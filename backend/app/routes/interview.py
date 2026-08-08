import os
import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Response
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.schemas.schemas import (
    StartInterviewRequest,
    TurnInterviewRequest,
    InterviewResponse,
    SessionStateData,
    CandidateInput,
    TopicCovered,
    MessageItem,
    EvaluationItem,
    EvaluationResult,
)
from app.services.candidate_service import candidate_service
from app.services.planner_service import planner_service, SessionState
from app.services.question_service import question_service
from app.services.evaluator_service import evaluator_service
from app.services.feedback_service import feedback_service
from app.db.database import get_db
from app.db import models

router = APIRouter()

# Active sessions in-memory cache
active_sessions: Dict[str, Dict[str, Any]] = {}


@router.post("/interview", response_model=InterviewResponse)
async def handle_interview(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object")

    # 1. Start Request
    if "candidate" in body:
        try:
            start_req = StartInterviewRequest.model_validate(body)
        except ValidationError as ve:
            raise HTTPException(status_code=400, detail=f"Invalid start payload: {ve.errors()}")
        return await handle_start(start_req, db)

    # 2. Turn Request
    if "message" in body and "sessionId" in body:
        try:
            turn_req = TurnInterviewRequest.model_validate(body)
        except ValidationError as ve:
            raise HTTPException(status_code=400, detail=f"Invalid turn payload: {ve.errors()}")
        return await handle_turn(turn_req, db)

    raise HTTPException(status_code=400, detail="Invalid request payload. Must provide candidate for start or message for turn.")


async def handle_start(req: StartInterviewRequest, db: Session) -> InterviewResponse:
    session_id = req.sessionId
    candidate = req.candidate

    profile = candidate_service.analyze_profile(candidate)
    initial_state = planner_service.determine_initial_state(session_id, candidate.member.id, profile)

    first_q = await question_service.generate_next_question(
        candidate_name=candidate.member.name,
        job_role=candidate.member.jobRole,
        years_experience=candidate.member.yearsExperience,
        current_day=initial_state.currentDay,
        current_topic=initial_state.currentTopic,
        difficulty=initial_state.difficulty,
        phase="FUNDAMENTALS",
        question_number=1,
        previous_questions=[],
    )

    initial_state.questionNumber = 1
    initial_state.phase = "FUNDAMENTALS"
    initial_state.previousQuestions.append(first_q.reply)
    initial_state.topicsCovered.append({"day": first_q.day, "topic": first_q.topic})

    welcome_reply = f"Welcome {candidate.member.name}. Let's begin your technical interview.\n\n{first_q.reply}"

    active_sessions[session_id] = {
        "state": initial_state,
        "candidate": candidate,
        "messages": [
            {"role": "interviewer", "content": welcome_reply, "questionNumber": 1, "curriculumDay": first_q.day}
        ],
        "evaluations": [],
        "lastQuestion": first_q.reply,
        "feedback": None,
    }

    # DB Persistence Try-Except
    try:
        cand_db = db.query(models.CandidateDB).filter(models.CandidateDB.id == candidate.member.id).first()
        if not cand_db:
            cand_db = models.CandidateDB(
                id=candidate.member.id,
                name=candidate.member.name,
                jobRole=candidate.member.jobRole,
                yearsExperience=candidate.member.yearsExperience,
                education=candidate.member.education,
                status=candidate.member.status,
                commitDays=candidate.signals.commitDays,
                missionsCompleted=candidate.signals.missionsCompleted,
                missionsFirstTry=candidate.signals.missionsFirstTry,
            )
            db.add(cand_db)
            db.commit()

        sess_db = db.query(models.InterviewSessionDB).filter(models.InterviewSessionDB.id == session_id).first()
        if not sess_db:
            sess_db = models.InterviewSessionDB(
                id=session_id,
                candidateId=candidate.member.id,
                questionCount=1,
                currentDay=first_q.day,
                currentTopic=first_q.topic,
                difficulty=initial_state.difficulty,
            )
            db.add(sess_db)

        msg_db = models.InterviewMessageDB(
            sessionId=session_id,
            role="interviewer",
            content=welcome_reply,
            questionNumber=1,
            curriculumDay=first_q.day,
        )
        db.add(msg_db)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"DB start write warning (fallback active): {e}")

    return InterviewResponse(reply=welcome_reply, done=False)


async def handle_turn(req: TurnInterviewRequest, db: Session) -> InterviewResponse:
    session_id = req.sessionId
    message = req.message

    session_data = active_sessions.get(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail=f"Session not found for sessionId: {session_id}")

    state: SessionState = session_data["state"]
    candidate: CandidateInput = session_data["candidate"]
    evaluations: List[EvaluationResult] = session_data["evaluations"]
    last_question: str = session_data.get("lastQuestion", "Describe your technical approach.")

    if state.isComplete and session_data.get("feedback"):
        return InterviewResponse(
            reply="Interview completed.",
            done=True,
            feedback=session_data["feedback"],
        )

    # 1. Record candidate message
    session_data["messages"].append({
        "role": "candidate",
        "content": message,
        "questionNumber": state.questionNumber,
        "curriculumDay": state.currentDay,
    })
    state.previousAnswers.append(message)

    # 2. Evaluate answer
    evaluation = await evaluator_service.evaluate_answer(
        question=last_question,
        answer=message,
        day=state.currentDay,
        topic=state.currentTopic,
    )
    evaluations.append(evaluation)
    state.evaluations.append(evaluation)

    # 3. State machine update
    profile = candidate_service.analyze_profile(candidate)
    next_step = planner_service.get_next_step(state, profile, evaluation)

    # 4. Completion check
    if next_step["isFinished"]:
        state.isComplete = True
        feedback = await feedback_service.generate_feedback(
            candidate_name=candidate.member.name,
            job_role=candidate.member.jobRole,
            evaluations=state.evaluations,
            topics_covered=state.topicsCovered,
        )
        session_data["feedback"] = feedback

        try:
            sess_db = db.query(models.InterviewSessionDB).filter(models.InterviewSessionDB.id == session_id).first()
            if sess_db:
                sess_db.status = "COMPLETED"

            fb_db = models.InterviewFeedbackDB(
                sessionId=session_id,
                summary=feedback.summary,
                strengths=json.dumps(feedback.strengths),
                gaps=json.dumps(feedback.gaps),
                nextSteps=json.dumps(feedback.next),
            )
            db.add(fb_db)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"DB feedback write warning: {e}")

        return InterviewResponse(
            reply="Interview completed.",
            done=True,
            feedback=feedback,
        )

    # 5. Generate Next Question or Followup
    next_q_num = state.questionNumber + 1
    state.questionNumber = next_q_num
    state.phase = next_step["nextPhase"]
    state.currentDay = next_step["nextDay"]
    state.currentTopic = next_step["nextTopic"]
    state.difficulty = next_step["nextDifficulty"]

    if next_step["isFollowUp"]:
        state.followUpCount += 1
    else:
        state.followUpCount = 0

    next_q_result = await question_service.generate_next_question(
        candidate_name=candidate.member.name,
        job_role=candidate.member.jobRole,
        years_experience=candidate.member.yearsExperience,
        current_day=next_step["nextDay"],
        current_topic=next_step["nextTopic"],
        difficulty=next_step["nextDifficulty"],
        phase=next_step["nextPhase"],
        question_number=next_q_num,
        previous_questions=state.previousQuestions,
        is_follow_up=next_step["isFollowUp"],
        previous_question=last_question,
        candidate_answer=message,
        last_evaluation=evaluation,
    )

    state.previousQuestions.append(next_q_result.reply)
    if not any(t["day"] == next_q_result.day for t in state.topicsCovered):
        state.topicsCovered.append({"day": next_q_result.day, "topic": next_q_result.topic})

    session_data["lastQuestion"] = next_q_result.reply
    session_data["messages"].append({
        "role": "interviewer",
        "content": next_q_result.reply,
        "questionNumber": next_q_num,
        "curriculumDay": next_q_result.day,
    })

    try:
        sess_db = db.query(models.InterviewSessionDB).filter(models.InterviewSessionDB.id == session_id).first()
        if sess_db:
            sess_db.questionCount = next_q_num
            sess_db.currentDay = next_q_result.day
            sess_db.currentTopic = next_q_result.topic
            sess_db.difficulty = next_step["nextDifficulty"]

        msg_db = models.InterviewMessageDB(
            sessionId=session_id,
            role="interviewer",
            content=next_q_result.reply,
            questionNumber=next_q_num,
            curriculumDay=next_q_result.day,
        )
        db.add(msg_db)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"DB turn write warning: {e}")

    return InterviewResponse(reply=next_q_result.reply, done=False)


@router.get("/interview/{session_id}")
async def get_session_state(session_id: str):
    session_data = active_sessions.get(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    state: SessionState = session_data["state"]
    candidate: CandidateInput = session_data["candidate"]
    evaluations: List[EvaluationResult] = session_data["evaluations"]

    topics_covered = [TopicCovered(day=t["day"], topic=t["topic"]) for t in state.topicsCovered]
    messages = [
        MessageItem(
            role=m["role"],
            content=m["content"],
            questionNumber=m["questionNumber"],
            curriculumDay=m.get("curriculumDay"),
        )
        for m in session_data["messages"]
    ]
    eval_items = [
        EvaluationItem(
            questionNumber=idx + 1,
            score=e.score,
            tier=e.tier,
            technicalDepth=e.technicalDepth,
        )
        for idx, e in enumerate(evaluations)
    ]

    return SessionStateData(
        sessionId=session_id,
        candidate=candidate,
        questionCount=state.questionNumber,
        currentDay=state.currentDay,
        currentTopic=state.currentTopic,
        difficulty=state.difficulty,
        phase=state.phase,
        topicsCovered=topics_covered,
        messages=messages,
        isComplete=state.isComplete,
        feedback=session_data.get("feedback"),
        evaluations=eval_items,
    )


@router.get("/candidates")
async def get_candidates():
    possible_paths = [
        os.path.abspath(os.path.join(os.getcwd(), "..", "data", "candidates.json")),
        os.path.abspath(os.path.join(os.getcwd(), "data", "candidates.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "candidates.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "candidates.json")),
    ]
    for p in possible_paths:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)

    raise HTTPException(status_code=404, detail="candidates.json file not found")


@router.get("/curriculum")
async def get_curriculum():
    possible_paths = [
        os.path.abspath(os.path.join(os.getcwd(), "..", "data", "curriculum.json")),
        os.path.abspath(os.path.join(os.getcwd(), "data", "curriculum.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "curriculum.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "curriculum.json")),
    ]
    for p in possible_paths:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)

    raise HTTPException(status_code=404, detail="curriculum.json file not found")
