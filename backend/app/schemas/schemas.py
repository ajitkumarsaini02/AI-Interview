from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CandidateMember(BaseModel):
    id: str
    name: str
    jobRole: str
    yearsExperience: int
    education: str
    status: str


class CandidateMission(BaseModel):
    day: int
    title: str
    passed: Optional[bool] = False
    skipped: Optional[bool] = False
    attempts: Optional[int] = 0


class CandidateSignals(BaseModel):
    commitDays: int
    missionsCompleted: int
    missionsFirstTry: int


class CandidateInput(BaseModel):
    member: CandidateMember
    missions: List[CandidateMission] = Field(default_factory=list)
    signals: CandidateSignals


class StartInterviewRequest(BaseModel):
    sessionId: str
    candidate: CandidateInput


class TurnInterviewRequest(BaseModel):
    sessionId: str
    message: str


class EvaluationResult(BaseModel):
    score: int = Field(..., ge=0, le=10)
    correctness: str
    technicalDepth: str
    communication: str
    missingConcepts: List[str] = Field(default_factory=list)
    misconceptions: List[str] = Field(default_factory=list)
    strengths: Optional[List[str]] = Field(default_factory=list)
    weaknesses: Optional[List[str]] = Field(default_factory=list)
    shouldFollowUp: bool = True
    followUpType: str = "clarification"  # deep_dive | clarification | diagnostic
    tier: str = "PARTIAL"  # STRONG | PARTIAL | WEAK


class QuestionGenerationResult(BaseModel):
    reply: str
    day: int
    topic: str
    objective: str
    difficulty: str  # Beginner | Intermediate | Advanced | Expert
    phase: str


class SubScores(BaseModel):
    technicalDepth: int = 80
    systemDesign: int = 80
    communication: int = 80
    adaptability: int = 80


class FeedbackResult(BaseModel):
    summary: str
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    next: List[str] = Field(default_factory=list)
    subScores: Optional[SubScores] = None


class InterviewResponse(BaseModel):
    reply: str
    done: bool
    feedback: Optional[FeedbackResult] = None
    error: Optional[str] = None


class TopicCovered(BaseModel):
    day: int
    topic: str


class MessageItem(BaseModel):
    role: str
    content: str
    questionNumber: int
    curriculumDay: Optional[int] = None


class EvaluationItem(BaseModel):
    questionNumber: int
    score: int
    tier: str
    technicalDepth: str


class SessionStateData(BaseModel):
    sessionId: str
    candidate: CandidateInput
    questionCount: int
    currentDay: int
    currentTopic: str
    difficulty: str
    phase: str
    topicsCovered: List[TopicCovered] = Field(default_factory=list)
    messages: List[MessageItem] = Field(default_factory=list)
    isComplete: bool
    feedback: Optional[FeedbackResult] = None
    evaluations: List[EvaluationItem] = Field(default_factory=list)
