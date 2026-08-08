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
        answer_match = re.search(r'Candidate Answer:\s*"([^"]+)"', prompt, re.IGNORECASE) or re.search(r'Candidate Answer:\s*(.+)', prompt, re.IGNORECASE)
        answer = answer_match.group(1).strip() if answer_match else ""

        length = len(answer)
        keywords = [
            "vector", "embedding", "rag", "agent", "mcp", "latency", "hnsw", "index",
            "retrieval", "hybrid", "sql", "context", "chunk", "transformer", "prompt",
            "temperature", "eval", "docker", "token", "cache", "venv", "python", "fastapi", "express", "react"
        ]
        hit_count = sum(1 for k in keywords if k in answer.lower())

        score = 5
        tier = "PARTIAL"
        correctness = "partially_correct"
        technical_depth = "medium"
        follow_up_type = "clarification"

        if length > 100 and hit_count >= 2:
            score = 9
            tier = "STRONG"
            correctness = "correct"
            technical_depth = "deep"
            follow_up_type = "deep_dive"
        elif length > 35 or hit_count >= 1:
            score = 7
            tier = "PARTIAL"
            correctness = "mostly_correct"
            technical_depth = "medium"
            follow_up_type = "clarification"
        else:
            score = 4
            tier = "WEAK"
            correctness = "partially_correct"
            technical_depth = "surface"
            follow_up_type = "diagnostic"

        missing_concepts = (
            [] if tier == "STRONG"
            else ["production edge cases", "architecture optimization"] if tier == "PARTIAL"
            else ["core theoretical concepts", "engineering trade-offs"]
        )

        return {
            "score": score,
            "correctness": correctness,
            "technicalDepth": technical_depth,
            "communication": "clear" if length > 80 else "concise",
            "missingConcepts": missing_concepts,
            "misconceptions": ["Confused high-level abstraction with low-level implementation details"] if tier == "WEAK" else [],
            "strengths": ["Identified main architectural components", "Good technical domain vocabulary"] if tier == "STRONG" else ["Addressed the primary question prompt"],
            "weaknesses": [] if tier == "STRONG" else ["Could provide more specific numerical trade-offs or production details"],
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
            2: {
                "strong": ["Spot on regarding Ollama local models. When deploying local parameter quantization (e.g. Q4_K_M vs Q8_0), how do you measure accuracy loss versus token throughput?"],
                "partial": ["Good overview of local AI assistants. How do you manage RAM allocation and GPU offloading when running Ollama alongside VS Code?"],
                "weak": ["Let's step back to local LLM fundamentals: What CLI commands do you use to verify your Ollama model is loaded and ready?"]
            },
            3: {
                "strong": ["Excellent architecture for React and FastAPI integration. How do you handle CORS policies, preflight requests, and API rate limiting in production?"],
                "partial": ["Good API integration concept. How do you structure state management in React when receiving asynchronous HTTP responses from FastAPI?"],
                "weak": ["Let's review backend basics: What is the purpose of the health endpoint in a FastAPI web service?"]
            },
            4: {
                "strong": ["Great insights on document parsing. How do you handle noisy PDF layouts, tables, and embedded images when extracting clean Markdown for LLM pipelines?"],
                "partial": ["Good start on data chunking. What strategy do you use to choose chunk size and chunk overlap to preserve context boundaries?"],
                "weak": ["Let's clarify parsing basics: Why is raw text cleaning necessary before passing documents into an LLM context?"]
            },
            5: {
                "strong": ["Spot on for tokenization. How do byte-pair encoding (BPE) subword tokenizers handle multilingual datasets and special control tokens?"],
                "partial": ["Good explanation of context limits. How do you calculate token consumption to estimate API cost before launching batch workloads?"],
                "weak": ["Let's review tokenization basics: What is the difference between character count, word count, and token count in LLMs?"]
            },
            6: {
                "strong": ["Great analysis of sparse vs dense search. How do you combine BM25 term frequency scores with dense vector embeddings in a unified ranker?"],
                "partial": ["Good start on sparse indexing. What are the key limitations of traditional keyword search when handling synonyms or misspellings?"],
                "weak": ["Let's clarify search basics: What does BM25 measure when indexing document terms?"]
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
            },
            10: {
                "strong": ["Great insights on hybrid retrieval. When combining relational SQL query filters with vector cosine similarity, how do you calibrate Reciprocal Rank Fusion (RRF) weights?"],
                "partial": ["Solid start on query routing. How do you handle multi-intent user queries requiring both structured relational filters and unstructured vector matching?"],
                "weak": ["Let's clarify retrieval basics: Why is hybrid retrieval necessary when dense vector search fails to match exact part numbers or IDs?"]
            },
            11: {
                "strong": ["Excellent RAG architecture reasoning. How do you implement re-ranking (e.g. using Cohere or BGE re-ranker) to prune irrelevant chunks before context injection?"],
                "partial": ["Good overview of RAG pipelines. How do you prevent context distortion and hallucination when LLM generation receives conflicting retrieved documents?"],
                "weak": ["Let me ask a targeted RAG question: What are the three primary steps in an end-to-end Retrieval-Augmented Generation pipeline?"]
            },
            12: {
                "strong": ["Spot on for prompt engineering. How do you mitigate prompt injection attacks when injecting untrusted user inputs into system prompts?"],
                "partial": ["Good explanation of system steering. How do few-shot exemplars improve structured JSON output consistency compared to zero-shot instructions?"],
                "weak": ["Let's review prompt fundamentals: What is the role of system prompts versus user prompts in steering LLM behavior?"]
            },
            13: {
                "strong": ["Great function calling expertise. How do you handle schema validation failures when the LLM outputs malformed tool call arguments?"],
                "partial": ["Good structured output overview. How does the LLM transition between generating natural text and generating structured tool calls?"],
                "weak": ["Let's clarify tool calling basics: How does the application execute a function after the LLM returns a function call JSON payload?"]
            },
            16: {
                "strong": ["Great Express backend design. How do you handle distributed session locks and prevent race conditions when multiple chat turns hit stateless workers concurrently?"],
                "partial": ["Good backend architecture overview. How do you structure chat state persistence in PostgreSQL to efficiently fetch recent conversation history?"],
                "weak": ["Let's review Express API fundamentals: How do you validate incoming REST payloads before forwarding them to the LLM service?"]
            },
            18: {
                "strong": ["Spot on for streaming. How do you handle backpressure and network dropouts when streaming Server-Sent Events (SSE) from LLM backends to React clients?"],
                "partial": ["Good streaming overview. What are the key differences between Server-Sent Events (SSE) and WebSockets for real-time chat UI?"],
                "weak": ["Let's review streaming basics: Why is response streaming preferred over waiting for the full LLM completion payload?"]
            },
            20: {
                "strong": ["Excellent context management architecture. How do you design sliding window memory combined with summary compaction to preserve long-term session context?"],
                "partial": ["Good memory management overview. How do you track token counts dynamically to prevent exceeding LLM context window limits?"],
                "weak": ["Let's break down chat memory basics: What happens when conversation history grows beyond the model's max context limit?"]
            },
            21: {
                "strong": ["Great agent executor analysis. How do you detect and break infinite execution loops when an autonomous ReAct agent gets stuck in repeating tool calls?"],
                "partial": ["Good overview of LangChain agents. How does the ReAct (Reasoning + Acting) pattern structure agent decision steps?"],
                "weak": ["Let's clarify agent basics: What are tools and agent executors in an AI framework?"]
            },
            22: {
                "strong": ["Excellent multi-agent orchestration. In a DAG of specialized agents, how do you handle partial agent failures and implement state rollback or retry mechanisms?"],
                "partial": ["Good agent routing explanation. How does a router agent determine which downstream sub-agent should handle a specific user request?"],
                "weak": ["Let's clarify multi-agent basics: What is the main advantage of splitting tasks across specialized sub-agents versus a single monolithic agent?"]
            },
            23: {
                "strong": ["Great MCP understanding. How does the Model Context Protocol handle tool permission scoping and security boundaries when connecting third-party MCP servers?"],
                "partial": ["Good MCP overview. How do MCP resources, tools, and prompts differ in how context is exposed to the LLM client?"],
                "weak": ["Let's review MCP basics: What problem does the Model Context Protocol (MCP) solve for AI applications?"]
            },
            25: {
                "strong": ["Spot on for automated evaluation. How do you configure LLM-as-a-judge frameworks to measure faithfulness, answer relevance, and context recall without bias?"],
                "partial": ["Good evaluation overview. How do guardrails detect toxic content, PII leaks, and prompt injection before returning LLM responses?"],
                "weak": ["Let me ask an evaluation basic question: Why are automated evaluations necessary alongside human spot-checks?"]
            },
            28: {
                "strong": ["Solid deployment architecture. How do you configure health checks, resource limits, and horizontal autoscaling for LLM gateway microservices under heavy load?"],
                "partial": ["Good Docker setup. How do you optimize Docker multi-stage builds to minimize image size for Node.js/Python backend services?"],
                "weak": ["Let's review Docker basics: Why use Docker Compose for local multi-container development?"]
            },
            29: {
                "strong": ["Great observability vision. How do you correlate trace IDs across microservice boundaries to track end-to-end latency and token costs in OpenTelemetry?"],
                "partial": ["Good monitoring overview. What key parameters would you alert on to detect model latency spikes or guardrail violations in production?"],
                "weak": ["Let's review logging basics: Why is structured JSON logging essential for production microservices?"]
            },
            31: {
                "strong": ["Outstanding capstone design. Looking back at your full architecture, how did you balance latency SLAs, system accuracy, and operational infrastructure costs?"],
                "partial": ["Good capstone summary. What was the most challenging trade-off you encountered when connecting your frontend, backend, and vector database?"],
                "weak": ["Let's summarize your project: What core features of your capstone demo are you most proud of?"]
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
        return {
            "summary": "The candidate demonstrated impressive technical depth across AI engineering fundamentals, system design, and multi-agent architecture. They showed strong reasoning when discussing vector retrieval trade-offs and multi-service deployment.",
            "strengths": [
                "Strong understanding of vector database indexing and semantic retrieval strategies.",
                "Solid architectural vision for multi-turn conversational state and backend API integration.",
                "Clear communication of engineering trade-offs between speed, cost, and accuracy."
            ],
            "gaps": [
                "Could deepen knowledge around ANN (Approximate Nearest Neighbor) graph parameters like HNSW M and efConstruction.",
                "Production observability and structured evaluation frameworks could be explored further."
            ],
            "next": [
                "Study HNSW parameter tuning for high-throughput vector search optimization.",
                "Practice building custom MCP tools and multi-agent routing workflows.",
                "Explore automated RAG evaluation metrics using Ragas or TruLens."
            ],
            "subScores": {
                "technicalDepth": 85,
                "systemDesign": 82,
                "communication": 88,
                "adaptability": 84
            }
        }
