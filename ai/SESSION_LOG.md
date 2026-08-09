# 📑 AI Technical Interview Agent - Session Execution Log

This document provides a trace structure and example transcript log of an end-to-end multi-turn interview session handled by the AI Technical Interview Agent.

---

## 🔁 Example Session Execution Log (`sessionId: session-demo-101`)

### Turn 0: Session Initialization (`POST /api/interview`)
- **Request Payload**:
  ```json
  {
    "sessionId": "session-demo-101",
    "candidate": {
      "member": {
        "id": "cand-01",
        "name": "Sarah Johnson",
        "jobRole": "AI Systems Engineer",
        "yearsExperience": 3
      },
      "missions": [
        { "day": 1, "title": "Prompt Engineering", "passed": true },
        { "day": 2, "title": "Vector Embeddings & Indexing", "passed": true }
      ]
    }
  }
  ```
- **State Update**: Phase = `INTRO` -> `FUNDAMENTALS`, Current Day = `2`, Question Count = `1`.
- **Response Payload**:
  ```json
  {
    "reply": "Welcome Sarah Johnson. Let's begin your technical interview.\n\nQuestion 1: In Day 2 of your cohort, you worked on vector embeddings. How do high-dimensional embeddings represent semantic relationships in text data?",
    "done": false
  }
  ```

---

### Turn 1: Candidate Response & Evaluation
- **Request Payload**:
  ```json
  {
    "sessionId": "session-demo-101",
    "message": "Vector embeddings transform unstructured text into dense numerical vectors in a multi-dimensional space where distance metrics like cosine similarity capture semantic similarity."
  }
  ```
- **Evaluation Result**:
  - Score: `9/10`
  - Tier: `STRONG`
  - Depth: `Deep`
  - Communication: `Clear`
- **State Update**: Phase = `ADAPTIVE_FOLLOWUP`, Next Question = `2` (Production scaling follow-up).
- **Response Payload**:
  ```json
  {
    "reply": "Great explanation on dense vector representations. Now, how would you configure HNSW index parameters like M and efConstruction to maintain sub-50ms query latencies as your dataset scales to 10M vectors?",
    "done": false
  }
  ```

---

### Turn 8: Session Completion (`done: true`)
- **Condition Met**: `questionNumber >= 8` & `topicsCovered.length >= 4`.
- **Final Response Payload**:
  ```json
  {
    "reply": "Interview completed.",
    "done": true,
    "feedback": {
      "summary": "Demonstrated strong technical depth across vector database indexing and LLM system architecture. Communicated trade-offs effectively throughout the session.",
      "strengths": [
        "In-depth understanding of high-dimensional vector embeddings",
        "Clear communication of production trade-offs",
        "Solid grasp of ANN index parameter tuning"
      ],
      "gaps": [
        "Production observability metrics for RAG pipelines",
        "Advanced prompt caching strategies"
      ],
      "next": [
        "Review HNSW efConstruction parameter impact on build time",
        "Practice implementing custom MCP tool integration"
      ],
      "subScores": {
        "technicalDepth": 88,
        "systemDesign": 82,
        "communication": 90,
        "adaptability": 85
      }
    }
  }
  ```
