import re
from typing import Type, TypeVar
from pydantic import BaseModel
from .provider import LLMProvider

T = TypeVar("T", bound=BaseModel)


class DemoProvider(LLMProvider):
    name = "demo"

    async def generate_structured(
        self,
        prompt: str,
        system_prompt: str,
        schema: Type[T]
    ) -> T:
        prompt_lower = prompt.lower()

        # 1. Evaluation Prompt
        if "evaluate the technical response" in prompt_lower or "correctness tier" in prompt_lower:
            result = self._handle_evaluation(prompt)
            return schema.model_validate(result)

        # 2. Followup Prompt
        if "evaluation tier:" in prompt_lower or "unaddressed concepts" in prompt_lower:
            result = self._handle_followup(prompt)
            return schema.model_validate(result)

        # 3. Question Prompt
        if "generate the next technical interview question" in prompt_lower or "target question #:" in prompt_lower:
            result = self._handle_question(prompt)
            return schema.model_validate(result)

        # 4. Feedback Prompt
        if "generate final comprehensive technical interview feedback" in prompt_lower or "session performance history:" in prompt_lower:
            result = self._handle_feedback(prompt)
            return schema.model_validate(result)

        raise ValueError(f"DemoProvider: Unsupported prompt type: {prompt[:100]}")

    def _handle_evaluation(self, prompt: str) -> dict:
        question_match = re.search(r'Question:\s*"([^"]+)"', prompt, re.IGNORECASE) or re.search(r'Question:\s*(.+)', prompt, re.IGNORECASE)
        question = question_match.group(1).strip() if question_match else ""

        answer_match = re.search(r'Candidate Answer:\s*"([^"]+)"', prompt, re.IGNORECASE) or re.search(r'Candidate Answer:\s*(.+)', prompt, re.IGNORECASE)
        answer = answer_match.group(1).strip() if answer_match else ""

        clean_answer = answer.lower().strip()
        length = len(clean_answer)

        # 1. Exact Evasive Check (strict set of non-answer phrases)
        exact_evasive_set = {
            "idk", "don't know", "dont know", "no idea", "pass", "skip", "dunno",
            "nothing", "no answer", "whatever", "garbage", "kuch bhi", "galat",
            "cant answer", "can't answer", "no", "na", "nhi", "nahi"
        }

        is_explicit_evasive = clean_answer in exact_evasive_set

        # 2. Keyboard Mashing Check
        mashing_pattern = re.compile(r'^(asdfghjkl|qwertyuiop|zxcvbnm|[1234567890]{4,}|[bcdfghjklmnpqrstvwxyz]{6,})$', re.IGNORECASE)
        has_vowels = bool(re.search(r'[aeiouy]', clean_answer, re.IGNORECASE))
        is_keyboard_mashing = bool(mashing_pattern.match(clean_answer)) or (not has_vowels and length > 5)

        is_too_short = length < 3

        if is_explicit_evasive or is_keyboard_mashing or is_too_short:
            return {
                "score": 1 if is_keyboard_mashing else 2 if is_explicit_evasive else 1,
                "correctness": "incorrect",
                "technicalDepth": "none",
                "communication": "evasive",
                "missingConcepts": ["Core technical concept", "Direct answer to question"],
                "misconceptions": ["Answer was evasive, gibberish, or non-responsive"],
                "strengths": [],
                "weaknesses": ["Failed to provide a relevant technical response"],
                "shouldFollowUp": True,
                "followUpType": "diagnostic",
                "tier": "WEAK",
            }

        # 3. Relevancy & Quality Assessment
        domain_keywords = [
            "vector", "embedding", "rag", "agent", "mcp", "latency", "hnsw", "index",
            "retrieval", "hybrid", "sql", "context", "chunk", "transformer", "prompt",
            "temperature", "eval", "docker", "token", "cache", "venv", "python", "fastapi",
            "express", "react", "similarity", "cosine", "distance", "nearest", "dimension",
            "quantization", "re-rank", "rerank", "concurrency", "state", "sse", "websocket",
            "model", "data", "database", "api", "server", "code", "search", "query",
            "parameter", "memory", "pip", "virtual", "environment", "setup", "llm", "ai"
        ]

        question_words = re.findall(r'\b[a-z]{3,}\b', question.lower())
        question_hit_count = sum(1 for w in question_words if w in clean_answer)
        domain_hit_count = sum(1 for k in domain_keywords if k in clean_answer)

        total_hits = domain_hit_count + question_hit_count

        off_topic_keywords = ["pizza", "cricket", "weather", "movie", "football", "burger", "dance", "song"]
        is_off_topic = any(w in clean_answer for w in off_topic_keywords) and total_hits == 0

        if is_off_topic:
            return {
                "score": 2,
                "correctness": "incorrect",
                "technicalDepth": "none",
                "communication": "unclear",
                "missingConcepts": ["Technical domain principles"],
                "misconceptions": ["Answer was off-topic and unrelated to the question"],
                "strengths": [],
                "weaknesses": ["Answer was completely irrelevant to the technical question"],
                "shouldFollowUp": True,
                "followUpType": "diagnostic",
                "tier": "WEAK",
            }

        # 4. Scoring for Genuine Technical Answers
        if total_hits == 0:
            return {
                "score": 2,
                "correctness": "incorrect",
                "technicalDepth": "none",
                "communication": "unclear",
                "missingConcepts": ["Core technical domain concepts", "Relevant answer to question"],
                "misconceptions": ["Answer was off-topic, gibberish, or non-responsive"],
                "strengths": [],
                "weaknesses": ["Failed to address the asked technical question"],
                "shouldFollowUp": True,
                "followUpType": "diagnostic",
                "tier": "WEAK",
            }

        if total_hits >= 2 or (length > 35 and total_hits >= 1):
            score = 9
            tier = "STRONG"
            correctness = "correct"
            technical_depth = "deep"
            follow_up_type = "deep_dive"
        else:
            score = 7
            tier = "PARTIAL"
            correctness = "mostly_correct"
            technical_depth = "medium"
            follow_up_type = "clarification"

        return {
            "score": score,
            "correctness": correctness,
            "technicalDepth": technical_depth,
            "communication": "clear" if length > 40 else "concise",
            "missingConcepts": [] if tier == "STRONG" else ["Further architectural trade-offs"],
            "misconceptions": [],
            "strengths": ["Addressed question concepts accurately", "Demonstrated sound engineering principles"],
            "weaknesses": [] if tier == "STRONG" else ["Could provide additional production details"],
            "shouldFollowUp": True,
            "followUpType": follow_up_type,
            "tier": tier,
        }

    def _handle_followup(self, prompt: str) -> dict:
        tier_match = re.search(r'Evaluation Tier:\s*(STRONG|PARTIAL|WEAK)', prompt, re.IGNORECASE)
        tier = tier_match.group(1).upper() if tier_match else "PARTIAL"

        day_match = re.search(r'Curriculum Day:\s*Day\s*(\d+)\s*-\s*(.+)', prompt, re.IGNORECASE)
        day = int(day_match.group(1)) if day_match else 7
        topic = day_match.group(2).strip() if day_match else "Embeddings Explained"

        phase_match = re.search(r'Interview Phase:\s*(.+)', prompt, re.IGNORECASE)
        phase = phase_match.group(1).strip() if phase_match else "ADAPTIVE FOLLOW-UP"

        followup_map = {
            1: {
                "strong": ["Great points on VS Code & Python environment setup. In a multi-OS engineering team (Windows, macOS, Linux), how do you enforce lockfile consistency and prevent environment drift across team members?"],
                "partial": ["Good start on Python setup. How would you configure Pylance and linter settings in VS Code to automatically catch type mismatches before execution?"],
                "weak": ["Let's clarify virtual environment basics: Why are virtual environments (.venv) critical when managing project dependencies compared to global pip installs?"]
            },
            7: {
                "strong": ["Spot on for embeddings. Suppose you index 50 million 1536-dimensional vectors — how do scalar quantization (SQ8) and product quantization (PQ) reduce memory while preserving recall?"],
                "partial": ["Good explanation of semantic similarity. How would your embedding pipeline handle domain-specific vocabulary (such as medical or legal terms)?"],
                "weak": ["Let's review embedding fundamentals: Why is cosine similarity preferred over Euclidean distance for normalized vector comparison?"]
            },
            8: {
                "strong": ["Excellent vector database analysis. When tuning HNSW indexing in production, how do you balance parameters M and efConstruction against QPS and build time?"],
                "partial": ["Good overview of vector DBs. How does an approximate nearest neighbor (ANN) graph index differ from a flat brute-force vector scan?"],
                "weak": ["Let's break down vector storage basics: What is the role of metadata payload filtering during vector query execution?"]
            }
        }

        day_followup = followup_map.get(day, {
            "strong": [f"Great points on {topic}. How would you structure this component for high scalability, low p99 latency, and production robustness?"],
            "partial": [f"Good start on {topic}. How would your implementation handle edge cases and maintain reliability when deployed in production?"],
            "weak": [f"That covers the high-level concept of {topic}. Can you explain step-by-step how you would configure and test this component in your workflow?"]
        })

        pool = day_followup["strong"] if tier == "STRONG" else day_followup["partial"] if tier == "PARTIAL" else day_followup["weak"]
        reply = pool[0]
        for item in pool:
            if item not in prompt:
                reply = item
                break

        return {
            "reply": reply,
            "day": day,
            "topic": topic,
            "objective": f"Follow-up evaluation on {topic}",
            "difficulty": "Advanced" if tier == "STRONG" else "Intermediate" if tier == "PARTIAL" else "Beginner",
            "phase": phase,
        }

    def _handle_question(self, prompt: str) -> dict:
        day_match = re.search(r'Curriculum Day:\s*Day\s*(\d+)\s*-\s*(.+)', prompt, re.IGNORECASE)
        day = int(day_match.group(1)) if day_match else 7
        topic = day_match.group(2).strip() if day_match else "Embeddings Explained"

        diff_match = re.search(r'Difficulty Level:\s*(Beginner|Intermediate|Advanced|Expert)', prompt, re.IGNORECASE)
        difficulty = diff_match.group(1) if diff_match else "Intermediate"

        phase_match = re.search(r'Interview Phase:\s*(.+)', prompt, re.IGNORECASE)
        phase = phase_match.group(1).strip() if phase_match else "FUNDAMENTALS"

        question_map = {
            1: "How do you configure a Python virtual environment and ensure isolated dependency management in VS Code?",
            2: "When running a local coding LLM with Ollama, what are the primary trade-offs between model parameter quantization and inference throughput?",
            3: "How would you design a FastAPI endpoint to handle asynchronous streaming responses from an LLM backend to a React frontend?",
            4: "What strategies do you use for cleaning, chunking, and preparing unstructured documents before indexing?",
            5: "How does tokenization impact context window utilization and cost optimization in large-scale dataset pipelines?",
            6: "What are the structural differences between dense vector representations and traditional sparse BM25 term frequency indexes?",
            7: "Can you explain how high-dimensional vector embeddings capture semantic similarity, and how cosine distance differs from Euclidean distance?",
            8: "How does HNSW (Hierarchical Navigable Small World) indexing accelerate vector search compared to flat brute-force vector scans?",
            10: "In a hybrid retrieval pipeline, how do you combine SQL relational query filters with vector cosine similarity scores?",
            11: "Walk me through an end-to-end RAG architecture. How do you prevent context distortion and hallucination during generation?",
            12: "What is system prompt steering, and how do few-shot exemplars improve structured JSON reliability?",
            13: "How do function calling and tool execution work under the hood when an LLM produces function call arguments?",
            16: "How do you structure an Express API backend to maintain user state and manage chat memory across multiple REST requests?",
            18: "What are Server-Sent Events (SSE) and WebSockets, and which would you select for a real-time LLM chat interface?",
            20: "How do you implement sliding window memory and summary compaction to stay within tight LLM context window limits?",
            21: "What are the core components of an AI Agent executor, and how does the ReAct (Reasoning + Acting) loop operate?",
            22: "When building a multi-agent workflow, how do router agents distribute tasks between specialized sub-agents?",
            23: "How does the Model Context Protocol (MCP) standardize context exchange between client applications and external tools?",
            25: "How do you systematically evaluate LLM outputs using LLM-as-a-judge metrics such as faithfulness and answer relevance?",
            28: "How would you containerize a multi-service AI application using Docker Compose and configure health checks for Postgres/pgvector?",
            29: "What metrics and tracing parameters are essential for monitoring LLM latency, token usage, and guardrail violations in production?",
            31: "Looking at your overall capstone project design, how did you balance latency, accuracy, and operational cost?"
        }

        reply = question_map.get(day, f"Moving to {topic}: how would you design and implement this component for a production engineering workload?")

        return {
            "reply": reply,
            "day": day,
            "topic": topic,
            "objective": f"Mastery of Day {day} core engineering principles",
            "difficulty": difficulty,
            "phase": phase,
        }

    def _handle_feedback(self, prompt: str) -> dict:
        scores = [int(m) for m in re.findall(r'Score\s*(\d+)/10', prompt, re.IGNORECASE)]
        avg_score = round((sum(scores) / len(scores)) * 10) if scores else 75

        is_high = avg_score >= 70
        is_medium = 45 <= avg_score < 70

        return {
            "summary": (
                "The candidate demonstrated solid technical depth across AI cohort topics, showcasing clear reasoning on architecture and system trade-offs."
                if is_high else
                "The candidate demonstrated partial technical understanding across cohort topics, showing good high-level awareness but missing several low-level details."
                if is_medium else
                "The candidate struggled with technical depth during the session, giving evasive or incorrect responses on several core curriculum topics."
            ),
            "strengths": [
                "Strong understanding of vector database indexing and retrieval strategies.",
                "Solid architectural vision for multi-turn state and backend API integration.",
                "Clear communication of engineering trade-offs between speed, cost, and accuracy."
            ] if is_high else [
                "Identified basic high-level system components.",
                "Attempted answers across multiple curriculum days."
            ] if is_medium else [
                "Attempted the technical assessment session."
            ],
            "gaps": [
                "Could deepen knowledge around ANN graph parameters like HNSW M and efConstruction.",
                "Production observability and structured evaluation frameworks could be explored further."
            ] if is_high else [
                "Need fundamental review of vector embeddings, RAG architectures, and tool calling.",
                "Precision in technical vocabulary and system design trade-offs requires improvement."
            ],
            "next": [
                "Review vector database indexing options (HNSW, IVFFlat, SQ8).",
                "Practice building custom MCP tools and multi-agent routing workflows.",
                "Study automated RAG evaluation metrics using LLM-as-a-judge frameworks."
            ],
            "subScores": {
                "technicalDepth": max(10, min(100, avg_score)),
                "systemDesign": max(10, min(100, avg_score - 3 if is_high else avg_score)),
                "communication": max(10, min(100, avg_score + 4 if is_high else avg_score)),
                "adaptability": max(10, min(100, avg_score))
            }
        }
