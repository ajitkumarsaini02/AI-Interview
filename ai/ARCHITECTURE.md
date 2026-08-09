# 🏗 AI Technical Interview Agent - System Architecture

This document describes the high-level and detailed architecture of the AI Technical Interview Agent, including component interaction, multi-turn state machine transitions, data models, and LLM abstraction layers.

---

## 1. Core Architecture Diagram

```mermaid
graph TD
    User([Candidate / User]) -->|POST /api/interview| API[FastAPI / Express Backend]
    API --> Controller[Interview Controller]
    
    subgraph Core Engine
        Controller --> CandidateSvc[Candidate Profile Service]
        Controller --> PlannerSvc[Interview Planner Service]
        Controller --> QuestionSvc[Question Generation Service]
        Controller --> EvaluatorSvc[Answer Evaluator Service]
        Controller --> FeedbackSvc[Feedback Synthesis Service]
        Controller --> RetrievalSvc[Curriculum Retrieval RAG Service]
    end

    subgraph LLM Abstraction Layer
        QuestionSvc & EvaluatorSvc & FeedbackSvc --> Provider[LLM Provider Router]
        Provider --> Gemini[Google Gemini 2.0 / 1.5]
        Provider --> OpenAI[OpenAI GPT-4o]
        Provider --> Groq[Groq Llama 3.3]
        Provider --> Demo[Demo Mode Fallback Engine]
    end

    subgraph Persistence Layer
        Controller --> DB[(SQLite dev.db + SQLAlchemy)]
        Controller --> DataJSON[candidates.json & curriculum.json]
    end
```

---

## 2. Adaptive State Machine Flow

The interviewer progresses through structured interview phases based on curriculum objectives and candidate evaluation scores.

```mermaid
stateDiagram-v2
    [*] --> INTRO
    INTRO --> FUNDAMENTALS : Candidate Init & Welcome
    FUNDAMENTALS --> APPLIED : Fundamental Topic Qs
    APPLIED --> ADAPTIVE_FOLLOWUP : Score Evaluated
    ADAPTIVE_FOLLOWUP --> SYSTEM_DESIGN : Probing / Diagnostic Qs
    SYSTEM_DESIGN --> FINAL_CHALLENGE : Deep Architecture Scenarios
    FINAL_CHALLENGE --> FEEDBACK : Question Count >= 8 & Days >= 4
    FEEDBACK --> DONE : Session Complete & Report Generated
```

### Phase Definitions:
- **`INTRO`**: Candidate background analysis (`candidates.json`), experience assessment, initial greeting.
- **`FUNDAMENTALS`**: Questions probing core concepts (Day 1-10 curriculum objectives).
- **`APPLIED`**: Hands-on implementation scenarios (Day 11-20 objectives).
- **`ADAPTIVE_FOLLOWUP`**: Generated dynamically based on response quality:
  - **`STRONG` (Score >= 8)**: Deeper production edge cases and scaling scenarios.
  - **`PARTIAL` (Score 6-7)**: Targeted clarifying questions focusing on missing nuances.
  - **`WEAK` (Score < 6)**: Friendly diagnostic hint or fundamental concept reset.
- **`SYSTEM_DESIGN`**: End-to-end AI system architecture and optimization questions.
- **`FINAL_CHALLENGE`**: Advanced troubleshooting or trade-off evaluation.
- **`FEEDBACK`**: Generates comprehensive final report when at least 8 questions across 4 curriculum days are completed.

---

## 3. Storage & Schema Model (SQLite & JSON)

- **`Candidate`**: Candidate profile, job role, experience level, completed missions, skipped missions.
- **`InterviewSession`**: Session state, candidate ID, current day, question count, difficulty level, completion flag.
- **`InterviewMessage`**: Turn-by-turn chat transcript records with timestamps and curriculum day mapping.
- **`AnswerEvaluation`**: Score (0-10), correctness tier, depth classification, communication rating, missing concepts.
- **`InterviewFeedback`**: Final report summary, strengths, knowledge gaps, next steps, sub-scores (0-100).
- **`CurriculumChunk`**: 31-day curriculum topics, objectives, tools, and code snippets (`curriculum.json`).

---

## 4. Multi-Provider Fallback Logic

```mermaid
flowchart LR
    Request[LLM Generation Request] --> CheckKey{API Key Configured?}
    CheckKey -->|Gemini Key| GeminiSDK[Google Generative AI]
    CheckKey -->|OpenAI Key| OpenAISDK[OpenAI API]
    CheckKey -->|Groq Key| GroqSDK[Groq Cloud API]
    CheckKey -->|No Keys / DEMO_MODE| DemoEngine[Deterministic Mock Engine]
    
    GeminiSDK --> Output[Validated JSON Output]
    OpenAISDK --> Output
    GroqSDK --> Output
    DemoEngine --> Output
```

If an external LLM call fails or rate-limits, the system gracefully falls back to deterministic rule-based output, ensuring zero downtime for candidate interviews.
