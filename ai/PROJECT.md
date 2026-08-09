# 🤖 AI Technical Interview Agent - Project Overview

> A production-quality, multi-turn AI Technical Interviewer monorepo built for the 31-day AI Cohort. Personalized to candidate performance data, curriculum objectives, and adaptive follow-up decision logic.

---

## 🎯 Problem & Solution

Traditional online technical assessments use static questionnaires or generic prompt templates that fail to reflect candidate experience or real engineering discussions.

**AI Technical Interview Agent** conducts a realistic multi-turn technical interview that:
- **Understands candidate background**: Evaluates completed, failed, and skipped missions along with commit signals from `candidates.json`.
- **Grounds questions in curriculum**: Uses 31-day AI cohort curriculum objectives (`curriculum.json`) as knowledge ground truth.
- **Adapts dynamically**: Evaluates candidate answer depth (`STRONG` / `PARTIAL` / `WEAK`) and generates targeted follow-up or diagnostic questions.
- **Guarantees structured feedback**: Returns actionable executive summaries, technical sub-scores, strengths, knowledge gaps, and next steps upon interview completion.

---

## 🛠 Project Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React icons.
- **Backend (Primary)**: Python 3.11/3.12, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2, Pytest.
- **Backend (Secondary / Fallback)**: Node.js, Express, TypeScript, tsx.
- **Database / Storage**: SQLite (`dev.db`) with SQLAlchemy ORM + JSON datasets (`candidates.json`, `curriculum.json`).
- **Validation**: Pydantic / Zod schema validation for HTTP payloads and LLM JSON outputs.
- **AI Integration**: Multi-provider support for Google Gemini 2.0/1.5, OpenAI GPT-4o, Groq Llama 3.3, and zero-key `DEMO_MODE=true` execution.

---

## 📁 Related Documentation Links

- [Root README.md](file:///c:/Users/ajitk/Documents/COLLEGE/WEB%20Projects/AI-Interview/README.md)
- [PROMPTS.md](file:///c:/Users/ajitk/Documents/COLLEGE/WEB%20Projects/AI-Interview/PROMPTS.md)
- [AGENTS.md](file:///c:/Users/ajitk/Documents/COLLEGE/WEB%20Projects/AI-Interview/AGENTS.md)
- [AI Architecture](file:///c:/Users/ajitk/Documents/COLLEGE/WEB%20Projects/AI-Interview/ai/ARCHITECTURE.md)
- [AI Current State](file:///c:/Users/ajitk/Documents/COLLEGE/WEB%20Projects/AI-Interview/ai/CURRENT_STATE.md)
- [AI Decisions](file:///c:/Users/ajitk/Documents/COLLEGE/WEB%20Projects/AI-Interview/ai/DECISIONS.md)
- [AI Tasks](file:///c:/Users/ajitk/Documents/COLLEGE/WEB%20Projects/AI-Interview/ai/TASKS.md)
- [AI Session Log](file:///c:/Users/ajitk/Documents/COLLEGE/WEB%20Projects/AI-Interview/ai/SESSION_LOG.md)
- [AI Memory](file:///c:/Users/ajitk/Documents/COLLEGE/WEB%20Projects/AI-Interview/ai/AI_MEMORY.md)
