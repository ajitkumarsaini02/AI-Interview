import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.schemas import CandidateInput
from app.services.candidate_service import candidate_service
from app.services.planner_service import planner_service
from app.services.llm.demo_provider import DemoProvider
from app.schemas.schemas import EvaluationResult

client = TestClient(app)

sample_candidate = {
    "member": {
        "id": "CAND-TEST-001",
        "name": "Sarah Johnson",
        "jobRole": "Senior Data Engineer",
        "yearsExperience": 9,
        "education": "MS Computer Science",
        "status": "COMPLETED"
    },
    "missions": [
        {"day": 7, "title": "Embeddings Explained", "passed": True, "attempts": 1},
        {"day": 8, "title": "Vector Databases Overview", "passed": True, "attempts": 1},
        {"day": 10, "title": "Retrieval & Matching Engine", "passed": True, "attempts": 2},
        {"day": 11, "title": "RAG End-to-End & LLM API Basics", "passed": True, "attempts": 1},
        {"day": 16, "title": "Chatbot Backend & API Integration", "passed": True, "attempts": 1},
        {"day": 22, "title": "Multi-Agent Orchestration", "passed": True, "attempts": 2},
        {"day": 23, "title": "Model Context Protocol (MCP)", "passed": True, "attempts": 2},
        {"day": 28, "title": "Docker & Kubernetes Deployment", "passed": True, "attempts": 3},
        {"day": 29, "title": "Monitoring, Logging & Observability", "skipped": True},
        {"day": 31, "title": "Capstone Project & Final Demo", "passed": True, "attempts": 1}
    ],
    "signals": {"commitDays": 28, "missionsCompleted": 30, "missionsFirstTry": 20}
}


def test_1_candidate_profile_analysis():
    cand_input = CandidateInput.model_validate(sample_candidate)
    profile = candidate_service.analyze_profile(cand_input)
    assert profile.role == "Senior Data Engineer"
    assert 7 in profile.completedDays
    assert 8 in profile.completedDays
    assert 29 in profile.skippedDays
    assert profile.initialDifficulty == "Advanced"


def test_2_topic_selection_logic():
    cand_input = CandidateInput.model_validate(sample_candidate)
    profile = candidate_service.analyze_profile(cand_input)
    assert len(profile.recommendedTopics) > 0
    assert profile.recommendedTopics[0]["day"] == 7


def test_3_and_4_session_creation_and_first_response():
    session_id = f"test-session-{int(time.time() * 1000)}"
    response = client.post(
        "/api/interview",
        json={"sessionId": session_id, "candidate": sample_candidate}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["done"] is False
    assert isinstance(data["reply"], str)
    assert "Welcome Sarah Johnson" in data["reply"]


def test_5_session_continuation():
    session_id = f"test-session-cont-{int(time.time() * 1000)}"
    client.post("/api/interview", json={"sessionId": session_id, "candidate": sample_candidate})

    response = client.post(
        "/api/interview",
        json={
            "sessionId": session_id,
            "message": "Vector embeddings transform high-dimensional unstructured text into dense vector representations where spatial distance captures semantic relationship."
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["done"] is False
    assert isinstance(data["reply"], str)


import asyncio

def test_6_7_8_evaluation_tiers():
    provider = DemoProvider()

    strong_eval = asyncio.run(provider.generate_structured(
        'Evaluate the technical response given by the candidate. Candidate Answer: "High dimensional vector embeddings capture semantic similarity using HNSW indexing and cosine distance scaling across 10 million vectors with strict p99 50ms SLAs."',
        "System prompt",
        EvaluationResult
    ))
    assert strong_eval.tier == "STRONG"

    partial_eval = asyncio.run(provider.generate_structured(
        'Evaluate the technical response given by the candidate. Candidate Answer: "It searches similar text using vectors."',
        "System prompt",
        EvaluationResult
    ))
    assert partial_eval.tier == "PARTIAL"

    weak_eval = asyncio.run(provider.generate_structured(
        'Evaluate the technical response given by the candidate. Candidate Answer: "idk"',
        "System prompt",
        EvaluationResult
    ))
    assert weak_eval.tier == "WEAK"



def test_9_duplicate_question_prevention_and_state_progression():
    cand_input = CandidateInput.model_validate(sample_candidate)
    profile = candidate_service.analyze_profile(cand_input)
    state = planner_service.determine_initial_state("s-1", "CAND-1", profile)
    state.questionNumber = 1
    state.previousQuestions.append("What are vector embeddings?")

    next_step = planner_service.get_next_step(state, profile)
    assert next_step["isFinished"] is False
    assert next_step["nextPhase"] == "FUNDAMENTALS"


def test_10_11_12_interview_completion_and_feedback():
    loop_session = f"test-loop-session-{int(time.time() * 1000)}"
    res = client.post("/api/interview", json={"sessionId": loop_session, "candidate": sample_candidate})
    assert res.json()["done"] is False

    turns = 0
    data = res.json()
    while not data.get("done") and turns < 15:
        turns += 1
        res = client.post(
            "/api/interview",
            json={
                "sessionId": loop_session,
                "message": f"Detailed technical response for turn {turns} explaining system design, HNSW vector search, hybrid SQL filtering, and multi-agent orchestration."
            }
        )
        data = res.json()

    assert data["done"] is True
    assert data["reply"] == "Interview completed."
    assert "feedback" in data
    assert isinstance(data["feedback"]["summary"], str)
    assert isinstance(data["feedback"]["strengths"], list)
    assert isinstance(data["feedback"]["gaps"], list)
    assert isinstance(data["feedback"]["next"], list)
    assert turns >= 7


def test_13_invalid_session_error_handling():
    res = client.post(
        "/api/interview",
        json={"sessionId": "non-existent-session-id", "message": "Hello"}
    )
    assert res.status_code == 404


def test_14_completed_session_repeat_handling():
    loop_session = f"test-completed-session-{int(time.time() * 1000)}"
    client.post("/api/interview", json={"sessionId": loop_session, "candidate": sample_candidate})

    for i in range(10):
        res = client.post(
            "/api/interview",
            json={
                "sessionId": loop_session,
                "message": f"Turn {i} explanation of architectural trade-offs."
            }
        )
        if res.json()["done"]:
            break

    post_done_res = client.post(
        "/api/interview",
        json={"sessionId": loop_session, "message": "Another message after done"}
    )
    assert post_done_res.json()["done"] is True
    assert "feedback" in post_done_res.json()


def test_15_demo_mode_execution():
    demo = DemoProvider()
    assert demo.name == "demo"


def test_16_health_and_catalogs():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    res_cand = client.get("/api/candidates")
    assert res_cand.status_code == 200

    res_curr = client.get("/api/curriculum")
    assert res_curr.status_code == 200
