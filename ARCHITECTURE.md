# AI Interview Agent — Architecture & Design Specification

## 1. System Architecture

The AI Interview Agent is built as a hybrid deterministic-generative full-stack application using **Next.js (App Router)** with **TypeScript**, **Tailwind CSS**, **Zod**, and the **OpenAI API**.

The core design philosophy enforces strict separation of responsibilities:
- **Deterministic Engine**: Manages session state, minimum question counts (>= 8), minimum unique curriculum day coverage (>= 4), duplicate topic prevention, candidate profile parsing, and interview completion criteria.
- **Generative AI Agent**: Synthesizes realistic, natural-sounding technical questions, evaluates candidate answers against curriculum benchmarks, decides adaptive follow-ups, and builds granular final feedback.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Next.js Frontend                              │
│ ┌───────────────────┐ ┌────────────────────┐ ┌───────────────────────┐ │
│ │ Candidate Selector│ │  Chat UI Engine    │ │ Coverage/Progress Bar │ │
│ └─────────┬─────────┘ └─────────┬──────────┘ └──────────┬────────────┘ │
└───────────┼─────────────────────┼───────────────────────┼──────────────┘
            │                     │                       │
            └─────────────────────┼───────────────────────┘
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        POST /api/interview                             │
├────────────────────────────────────────────────────────────────────────┤
│                          Interview Router                              │
│                                 │                                      │
│        ┌────────────────────────┴────────────────────────┐             │
│        ▼                                                 ▼             │
│ [Start Session Request]                       [Turn Answer Request]    │
│  - Init Session                                - Retrieve Session      │
│  - Parse Candidate Profile                     - Record Candidate Turn │
│  - Pick Initial Question                       - Run Answer Evaluator  │
│                                                - Determine Strategy    │
│                                                - Check Done Condition  │
│                                                - Gen Follow-up/Next Q  │
│                                                  OR Final Feedback     │
│        │                                                 │             │
│        └────────────────────────┬────────────────────────┘             │
│                                 ▼                                      │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                   Session Store (In-Memory Map)                    │ │
│ │                (Redis-ready interface abstraction)                 │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                 │                                      │
│        ┌────────────────────────┼────────────────────────┐             │
│        ▼                        ▼                        ▼             │
│ ┌──────────────┐       ┌─────────────────┐      ┌─────────────────┐    │
│ │ Candidate &  │       │  LLM Engine     │      │ Answer          │    │
│ │ Curriculum   │       │  (OpenAI + Zod) │      │ Evaluator       │    │
│ │ Planner      │       │                 │      │                 │    │
│ └──────────────┘       └─────────────────┘      └─────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Request Flow

### Request Flow Sequence

```
Client                  /api/interview                  SessionStore               OpenAI API
  │                           │                             │                          │
  ├─ POST (sessionId, cand) ─►│                             │                          │
  │                           ├─ Init Session ─────────────►│                          │
  │                           ├─ Select initial topic ──────┴─┐                        │
  │                           ├─ Generate Question ───────────┼───────────────────────►│
  │                           │◄──────────────────────────────┴────────────────────────┤
  │◄─ { reply, done: false } ─┤                             │                          │
  │                           │                             │                          │
  ├─ POST (sessionId, msg) ──►│                             │                          │
  │                           ├─ Fetch Session ────────────►│                          │
  │                           ├─ Evaluate Answer ───────────┼─────────────────────────►│
  │                           │◄────────────────────────────┴──────────────────────────┤
  │                           ├─ Update State & Difficulty ─►│                          │
  │                           ├─ Check Done Criteria        │                          │
  │                           │  (count>=8 AND days>=4)     │                          │
  │                           ├─ IF NOT DONE:               │                          │
  │                           │  Select Next Topic & Gen Q ─┼─────────────────────────►│
  │                           │◄────────────────────────────┴──────────────────────────┤
  │◄─ { reply, done: false } ─┤                             │                          │
  │                           ├─ IF DONE:                   │                          │
  │                           │  Generate Final Feedback ───┼─────────────────────────►│
  │                           │◄────────────────────────────┴──────────────────────────┤
  │◄─ { reply, done: true,    │                             │                          │
  │     feedback } ───────────┤                             │                          │
```

---

## 3. Interview Lifecycle

1. **Initialization (`START`)**:
   - Client sends `sessionId` and `candidate` profile object.
   - Backend checks if `sessionId` exists. If not, initializes a new session state.
   - Planner parses `completedDays`, `skippedDays`, `attemptsPerTopic`, and overall `learningSignals`.
   - Planner selects the 1st Day/Topic (focusing on candidate's background/weak areas).
   - LLM generates the opening greeting and Question 1.
   - Returns `{ reply: "...", done: false }`.

2. **Interactive Turns (`IN_PROGRESS`)**:
   - Candidate submits an answer via `message`.
   - Evaluator classifies answer (`strong`, `acceptable`, `weak`, `incorrect`, `incomplete`) with structured reasoning and extracts key strengths/gaps.
   - State updates: `questionCount += 1`, `coveredDays.add(day)`, `coveredTopics.add(topic)`, `answerEvaluations.push(eval)`.
   - Adaptive engine recalculates current difficulty (`entry`, `intermediate`, `advanced`).
   - Done Check: Evaluates whether `questionCount >= 8` AND `coveredDays.size >= 4`.
   - **If NOT done**:
     - Determines question strategy (follow-up vs new day topic based on answer quality and current day coverage).
     - LLM generates natural transition + next question.
     - Session is saved.
     - Returns `{ reply: "...", done: false }`.
   - **If DONE**:
     - Evaluates all collected answer assessments and history.
     - LLM synthesizes structured feedback matching spec schema (`summary`, `strengths`, `gaps`, `next`).
     - Session marked `completed: true`.
     - Returns `{ reply: "Interview completed.", done: true, feedback: { ... } }`.

---

## 4. Candidate Personalization Strategy

Candidate profile metrics direct the interview trajectory:

1. **Weak Areas Identification**:
   - `attemptsPerTopic`: Days/Missions with `attempts >= 3` indicate high friction. Target these days early to evaluate mastery.
   - `skippedDays`: Skipped missions (e.g. Day 28 Docker/K8s or Day 29 Monitoring) are probed lightly or tested to see if candidate has missing foundational knowledge.
2. **First-Try & Experience Scaling**:
   - `signals.missionsFirstTry / signals.missionsCompleted`: High ratio indicates high competence; starting difficulty set to `advanced`.
   - `yearsExperience` & `jobRole`: Senior Data Engineers will get deeper vector storage/pipeline architecture questions; Junior/Interns will be asked foundational conceptual and hands-on implementation questions first.
3. **Contextual Awareness**:
   - The prompt incorporates `candidate.jobRole`, `candidate.yearsExperience`, `candidate.education`, and specific mission attempt history into every question generator invocation.

---

## 5. Question Selection & Strategy

Deterministic topic selection operates as a priority queue:

```
Priority 1: Ensure minimum 4 unique curriculum days coverage.
Priority 2: Focus on high-attempt missions (attempts >= 3).
Priority 3: Cover skipped missions if candidate role requires it.
Priority 4: Progress through core AI Cohort modules (Data Foundations -> Vector Search -> RAG -> Agents -> Production).
```

### Constraints:
- Never repeat a day/topic unless conducting a direct follow-up.
- Never ask off-curriculum questions.
- Never ask generic AI trivia ("What is AI?").
- Include a rich mix of question types:
  * `conceptual`
  * `implementation`
  * `debugging`
  * `scenario`
  * `trade-off`
  * `architecture`
  * `system design`

---

## 6. Follow-up & Adaptation Strategy

After each candidate response, the adaptation engine maps classification to the next question style:

| Answer Classification | Primary Goal | Next Question Style | Difficulty Shift |
|---|---|---|---|
| **STRONG** | Challenge depth | Complex trade-offs, architecture, edge-cases, system scale | Upgrade (+1 difficulty) |
| **ACCEPTABLE** | Verify code/details | Practical implementation details, syntax, tool choices | Maintain current level |
| **WEAK** | Diagnose root cause | Diagnostic question, foundational principles | Maintain or step down |
| **INCORRECT** | Test misconception | Scenario testing the specific flawed assumption gently | Step down (-1 difficulty) |
| **INCOMPLETE** | Fill specific gap | Targeted prompt asking for missing parameters/components | Maintain current level |

---

## 7. Answer Evaluation Strategy

Evaluation runs via structured LLM prompt with strict JSON outputs (validated by Zod):

```typescript
const AnswerEvaluationSchema = z.object({
  classification: z.enum(['strong', 'acceptable', 'weak', 'incorrect', 'incomplete']),
  reasoning: z.string(),
  identifiedStrengths: z.array(z.string()),
  identifiedGaps: z.array(z.string()),
  suggestedFollowUpAngle: z.string()
});
```

The evaluator assesses:
1. **Technical Accuracy**: Correctness against standard curriculum objectives.
2. **Depth & Detail**: Specificity of tools, formulas, trade-offs, or architectures mentioned.
3. **Clarity**: Communication and reasoning structure.

---

## 8. Feedback Generation

When `questionCount >= 8` AND `coveredDays.size >= 4`, the system generates final feedback adhering strictly to `technical-spec.md`:

```typescript
const FinalFeedbackSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  next: z.array(z.string())
});
```

### Quality Guidelines:
- **Actionable & Specific**: References exact curriculum days and techniques (e.g., "Practiced hybrid search & RRF weighting from Day 10", "Needs work on MCP tool definitions from Day 23").
- **Evidence-Based**: Derived strictly from `answerEvaluations` collected during the session.

---

## 9. State Management

Interviews maintain state using an in-memory repository implementing a generic `SessionStore` interface:

```typescript
export interface SessionStore {
  get(sessionId: string): Promise<InterviewSession | null>;
  set(sessionId: string, session: InterviewSession): Promise<void>;
  delete(sessionId: string): Promise<void>;
}
```

- Initial implementation uses `InMemorySessionStore` (backed by a JavaScript `Map`).
- Implemented clean modular abstraction allowing seamless drop-in replacement by `RedisSessionStore` in production.

---

## 10. Error Handling

1. **Invalid Requests**: Standardized HTTP 400 with descriptive error messages.
2. **Missing Session**: Returns HTTP 404 / clear error message if turn request provides unknown `sessionId`.
3. **LLM API Timeout/Failure**: Fallback deterministic response logic to keep interview interactive without losing state.
4. **Zod Validation Failure**: Defensive parsing with schema repair or safe fallbacks.
