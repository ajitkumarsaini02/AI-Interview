import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class CandidateDB(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    jobRole = Column(String, nullable=False)
    yearsExperience = Column(Integer, nullable=False)
    education = Column(String, nullable=False)
    status = Column(String, nullable=False)
    commitDays = Column(Integer, default=0)
    missionsCompleted = Column(Integer, default=0)
    missionsFirstTry = Column(Integer, default=0)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    missions = relationship("MissionDB", back_populates="candidate", cascade="all, delete-orphan")
    sessions = relationship("InterviewSessionDB", back_populates="candidate")


class MissionDB(Base):
    __tablename__ = "missions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidateId = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    day = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    passed = Column(Boolean, default=False)
    skipped = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)

    candidate = relationship("CandidateDB", back_populates="missions")


class InterviewSessionDB(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True)
    candidateId = Column(String, ForeignKey("candidates.id"), nullable=False)
    status = Column(String, default="IN_PROGRESS")
    questionCount = Column(Integer, default=0)
    currentDay = Column(Integer, default=7)
    currentTopic = Column(String, default="Embeddings Explained")
    difficulty = Column(String, default="Intermediate")
    startedAt = Column(DateTime, default=datetime.utcnow)
    completedAt = Column(DateTime, nullable=True)

    candidate = relationship("CandidateDB", back_populates="sessions")
    messages = relationship("InterviewMessageDB", back_populates="session", cascade="all, delete-orphan")
    evaluations = relationship("AnswerEvaluationDB", back_populates="session", cascade="all, delete-orphan")
    feedback = relationship("InterviewFeedbackDB", back_populates="session", uselist=False, cascade="all, delete-orphan")


class InterviewMessageDB(Base):
    __tablename__ = "interview_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sessionId = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    questionNumber = Column(Integer, default=0)
    curriculumDay = Column(Integer, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSessionDB", back_populates="messages")


class AnswerEvaluationDB(Base):
    __tablename__ = "answer_evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sessionId = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    questionNumber = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)
    correctness = Column(String, nullable=False)
    technicalDepth = Column(String, nullable=False)
    communication = Column(String, nullable=False)
    strengths = Column(Text, default="[]")
    weaknesses = Column(Text, default="[]")
    createdAt = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSessionDB", back_populates="evaluations")


class InterviewFeedbackDB(Base):
    __tablename__ = "interview_feedbacks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sessionId = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), unique=True, nullable=False)
    summary = Column(Text, nullable=False)
    strengths = Column(Text, default="[]")
    gaps = Column(Text, default="[]")
    nextSteps = Column(Text, default="[]")
    createdAt = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSessionDB", back_populates="feedback")


class CurriculumChunkDB(Base):
    __tablename__ = "curriculum_chunks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    day = Column(Integer, unique=True, nullable=False)
    title = Column(String, nullable=False)
    type = Column(String, default="CONCEPT")
    tools = Column(Text, default="[]")
    objectives = Column(Text, default="[]")
    content = Column(Text, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
