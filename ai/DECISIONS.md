# 📜 AI Technical Interview Agent - Architecture Decision Records (ADRs)

This document details key architectural decisions, rationale, trade-offs, and design choices made during the development of the AI Technical Interview Agent.

---

## ADR 1: Python FastAPI as Primary Backend with TypeScript Express Fallback

- **Context**: The project required both rapid AI SDK integration (Python generative AI libraries) and compatibility with Next.js TypeScript monorepos.
- **Decision**: Implemented Python FastAPI (`backend/app/main.py`) as the default primary backend engine, accompanied by a TypeScript Express implementation (`backend/src/server.ts`) as a fallback.
- **Rationale**: Python provides seamless integration with LLM SDKs, Pydantic data schemas, and vector processing tools, while maintaining full HTTP API compatibility with the Next.js frontend.
- **Status**: Accepted & Implemented.

---

## ADR 2: SQLite + JSON File Persistence for Lightweight Local Execution

- **Context**: Setting up PostgreSQL and pgvector for local evaluation can create environment setup friction for reviewers and automated evaluation environments.
- **Decision**: Standardized local persistence on SQLite (`dev.db` via SQLAlchemy) alongside static JSON grounding files (`candidates.json`, `curriculum.json`).
- **Rationale**: Eliminates external database setup dependencies while providing instant zero-config startup (`npm run dev`).
- **Status**: Accepted & Implemented.

---

## ADR 3: Zero-Key `DEMO_MODE` Execution Engine

- **Context**: Evaluation environments may not have active paid API keys for OpenAI, Gemini, or Groq configured.
- **Decision**: Built a deterministic `DEMO_MODE` execution path inside the question generator, evaluator, and feedback services.
- **Rationale**: Guarantees that the entire multi-turn adaptive interview flow can be tested end-to-end without requiring active third-party API credentials.
- **Status**: Accepted & Implemented.

---

## ADR 4: Scoring Tier Alignment (`STRONG >= 8`, `PARTIAL 6-7`, `WEAK < 6`)

- **Context**: Evaluation scores must reliably trigger appropriate interviewer follow-up questions.
- **Decision**: Standardized scoring thresholds across prompt templates and state machines:
  - **`STRONG` (>= 8)**: Leads to deep-dive production scaling questions.
  - **`PARTIAL` (6-7)**: Triggers targeted clarification questions on missing concepts.
  - **`WEAK` (< 6)**: Triggers friendly diagnostic hints and core conceptual resets.
- **Rationale**: A score of 5 represents significant missing knowledge and is appropriately classified under the diagnostic `WEAK` tier to prevent overwhelming candidates with deep scaling questions.
- **Status**: Accepted & Implemented.

---

## ADR 5: Score-Proportional Sub-Scores in Final Feedback

- **Context**: Final feedback reports include competency sub-scores (`technicalDepth`, `systemDesign`, `communication`, `adaptability`).
- **Decision**: Sub-scores are strictly calculated proportional to the candidate's average session evaluation score (e.g., an average score of 2/10 maps to ~20-30 sub-scores).
- **Rationale**: Prevents hallucinated glowing feedback for weak candidate sessions, maintaining objective interview grading integrity.
- **Status**: Accepted & Implemented.
