import { z } from 'zod';
import { LLMProvider } from './provider.js';

export class DemoProvider implements LLMProvider {
  name = 'demo';

  async generateStructured<T>(prompt: string, systemPrompt: string, schema: z.ZodType<T>): Promise<T> {
    const promptLower = prompt.toLowerCase();

    // 1. Evaluation Prompt
    if (promptLower.includes('evaluate the technical response') || promptLower.includes('correctness tier')) {
      const result = this.handleEvaluation(prompt);
      return result as unknown as T;
    }

    // 2. Followup Prompt
    if (promptLower.includes('evaluation tier:') || promptLower.includes('unaddressed concepts')) {
      const result = this.handleFollowup(prompt);
      return result as unknown as T;
    }

    // 3. Question Prompt
    if (promptLower.includes('generate the next technical interview question') || promptLower.includes('target question #:')) {
      const result = this.handleQuestion(prompt);
      return result as unknown as T;
    }

    // 4. Feedback Prompt
    if (promptLower.includes('generate final comprehensive technical interview feedback') || promptLower.includes('session performance history:')) {
      const result = this.handleFeedback(prompt);
      return result as unknown as T;
    }

    throw new Error(`DemoProvider: Unsupported prompt type: ${prompt.slice(0, 100)}`);
  }

  private handleEvaluation(prompt: string): any {
    const questionMatch = prompt.match(/Question:\s*"([^"]+)"/i) || prompt.match(/Question:\s*(.+)/i);
    const question = questionMatch ? questionMatch[1].trim() : '';

    const answerMatch = prompt.match(/Candidate Answer:\s*"([^"]+)"/i) || prompt.match(/Candidate Answer:\s*(.+)/i);
    const answer = answerMatch ? answerMatch[1].trim() : '';

    const cleanAnswer = answer.toLowerCase().trim();
    const length = cleanAnswer.length;

    // 1. Exact Evasive Check (strict set of non-answer phrases)
    const exactEvasiveSet = new Set([
      'idk', "don't know", 'dont know', 'no idea', 'pass', 'skip', 'dunno',
      'nothing', 'no answer', 'whatever', 'garbage', 'kuch bhi', 'galat',
      'cant answer', "can't answer", 'no', 'na', 'nhi', 'nahi'
    ]);

    const isExplicitEvasive = exactEvasiveSet.has(cleanAnswer);

    // 2. Keyboard Mashing Check (random consecutive mashing patterns or mashing without vowels)
    const mashingPattern = /^(asdfghjkl|qwertyuiop|zxcvbnm|[1234567890]{4,}|[bcdfghjklmnpqrstvwxyz]{6,})$/i;
    const hasVowels = /[aeiouy]/i.test(cleanAnswer);
    const isKeyboardMashing = mashingPattern.test(cleanAnswer) || (!hasVowels && length > 5);

    const isTooShort = length < 3;

    if (isExplicitEvasive || isKeyboardMashing || isTooShort) {
      return {
        score: isKeyboardMashing ? 1 : isExplicitEvasive ? 2 : 1,
        correctness: 'incorrect',
        technicalDepth: 'none',
        communication: 'evasive',
        missingConcepts: ['Core technical concept', 'Direct answer to question'],
        misconceptions: ['Answer was evasive, gibberish, or non-responsive'],
        strengths: [],
        weaknesses: ['Failed to provide a relevant technical response'],
        shouldFollowUp: true,
        followUpType: 'diagnostic',
        tier: 'WEAK',
      };
    }

    // 3. Relevancy & Quality Assessment
    const domainKeywords = [
      'vector', 'embedding', 'rag', 'agent', 'mcp', 'latency', 'hnsw', 'index',
      'retrieval', 'hybrid', 'sql', 'context', 'chunk', 'transformer', 'prompt',
      'temperature', 'eval', 'docker', 'token', 'cache', 'venv', 'python', 'fastapi',
      'express', 'react', 'similarity', 'cosine', 'distance', 'nearest', 'dimension',
      'quantization', 're-rank', 'rerank', 'concurrency', 'state', 'sse', 'websocket',
      'model', 'data', 'database', 'api', 'server', 'code', 'search', 'query',
      'parameter', 'memory', 'pip', 'virtual', 'environment', 'setup', 'llm', 'ai'
    ];

    const questionWords = question.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const questionHitCount = questionWords.filter(w => cleanAnswer.includes(w)).length;
    const domainHitCount = domainKeywords.filter(k => cleanAnswer.includes(k)).length;

    const totalHits = domainHitCount + questionHitCount;

    // Check for off-topic response
    const offTopicKeywords = ['pizza', 'cricket', 'weather', 'movie', 'football', 'burger', 'dance', 'song'];
    const isOffTopic = offTopicKeywords.some(w => cleanAnswer.includes(w)) && totalHits === 0;

    if (isOffTopic) {
      return {
        score: 2,
        correctness: 'incorrect',
        technicalDepth: 'none',
        communication: 'unclear',
        missingConcepts: ['Technical domain principles'],
        misconceptions: ['Answer was off-topic and unrelated to the question'],
        strengths: [],
        weaknesses: ['Answer was completely irrelevant to the technical question'],
        shouldFollowUp: true,
        followUpType: 'diagnostic',
        tier: 'WEAK',
      };
    }

    // 4. Scoring for Genuine Technical Answers
    if (totalHits === 0) {
      return {
        score: 2,
        correctness: 'incorrect',
        technicalDepth: 'none',
        communication: 'unclear',
        missingConcepts: ['Core technical domain concepts', 'Relevant answer to question'],
        misconceptions: ['Answer was off-topic, gibberish, or non-responsive'],
        strengths: [],
        weaknesses: ['Failed to address the asked technical question'],
        shouldFollowUp: true,
        followUpType: 'diagnostic',
        tier: 'WEAK',
      };
    }

    let score = 7;
    let tier: 'STRONG' | 'PARTIAL' | 'WEAK' = 'PARTIAL';
    let correctness = 'mostly_correct';
    let technicalDepth = 'medium';
    let followUpType: 'deep_dive' | 'clarification' | 'diagnostic' = 'clarification';

    if (totalHits >= 2 || (length > 35 && totalHits >= 1)) {
      score = 9;
      tier = 'STRONG';
      correctness = 'correct';
      technicalDepth = 'deep';
      followUpType = 'deep_dive';
    } else {
      score = 7;
      tier = 'PARTIAL';
      correctness = 'mostly_correct';
      technicalDepth = 'medium';
      followUpType = 'clarification';
    }

    return {
      score,
      correctness,
      technicalDepth,
      communication: length > 40 ? 'clear' : 'concise',
      missingConcepts: tier === 'STRONG' ? [] : ['Further architectural trade-offs'],
      misconceptions: [],
      strengths: ['Addressed question concepts accurately', 'Demonstrated sound engineering principles'],
      weaknesses: tier === 'STRONG' ? [] : ['Could provide additional production details'],
      shouldFollowUp: true,
      followUpType,
      tier,
    };
  }

  private handleFollowup(prompt: string): any {
    const tierMatch = prompt.match(/Evaluation Tier:\s*(STRONG|PARTIAL|WEAK)/i);
    const tier = tierMatch ? tierMatch[1].toUpperCase() : 'PARTIAL';

    const dayMatch = prompt.match(/Curriculum Day:\s*Day\s*(\d+)\s*-\s*(.+)/i);
    const day = dayMatch ? parseInt(dayMatch[1], 10) : 7;
    const topic = dayMatch ? dayMatch[2].trim() : 'Embeddings Explained';

    const phaseMatch = prompt.match(/Interview Phase:\s*(.+)/i);
    const phase = phaseMatch ? phaseMatch[1].trim() : 'ADAPTIVE FOLLOW-UP';

    const followupMap: Record<number, { strong: string[]; partial: string[]; weak: string[] }> = {
      1: {
        strong: ["Great points on VS Code & Python environment setup. In a multi-OS engineering team (Windows, macOS, Linux), how do you enforce lockfile consistency and prevent environment drift across team members?"],
        partial: ["Good start on Python setup. How would you configure Pylance and linter settings in VS Code to automatically catch type mismatches before execution?"],
        weak: ["Let's clarify virtual environment basics: Why are virtual environments (.venv) critical when managing project dependencies compared to global pip installs?"]
      },
      7: {
        strong: ["Spot on for embeddings. Suppose you index 50 million 1536-dimensional vectors — how do scalar quantization (SQ8) and product quantization (PQ) reduce memory while preserving recall?"],
        partial: ["Good explanation of semantic similarity. How would your embedding pipeline handle domain-specific vocabulary (such as medical or legal terms)?"],
        weak: ["Let's review embedding fundamentals: Why is cosine similarity preferred over Euclidean distance for normalized vector comparison?"]
      },
      8: {
        strong: ["Excellent vector database analysis. When tuning HNSW indexing in production, how do you balance parameters M and efConstruction against QPS and build time?"],
        partial: ["Good overview of vector DBs. How does an approximate nearest neighbor (ANN) graph index differ from a flat brute-force vector scan?"],
        weak: ["Let's break down vector storage basics: What is the role of metadata payload filtering during vector query execution?"]
      }
    };

    const dayFollowup = followupMap[day] || {
      strong: [`Great points on ${topic}. How would you structure this component for high scalability, low p99 latency, and production robustness?`],
      partial: [`Good start on ${topic}. How would your implementation handle edge cases and maintain reliability when deployed in production?`],
      weak: [`That covers the high-level concept of ${topic}. Can you explain step-by-step how you would configure and test this component in your workflow?`]
    };

    const pool = tier === 'STRONG' ? dayFollowup.strong : tier === 'PARTIAL' ? dayFollowup.partial : dayFollowup.weak;
    let reply = pool[0];
    for (const item of pool) {
      if (!prompt.includes(item)) {
        reply = item;
        break;
      }
    }

    return {
      reply,
      day,
      topic,
      objective: `Follow-up evaluation on ${topic}`,
      difficulty: tier === 'STRONG' ? 'Advanced' : tier === 'PARTIAL' ? 'Intermediate' : 'Beginner',
      phase,
    };
  }

  private handleQuestion(prompt: string): any {
    const dayMatch = prompt.match(/Curriculum Day:\s*Day\s*(\d+)\s*-\s*(.+)/i);
    const day = dayMatch ? parseInt(dayMatch[1], 10) : 7;
    const topic = dayMatch ? dayMatch[2].trim() : 'Embeddings Explained';

    const diffMatch = prompt.match(/Difficulty Level:\s*(Beginner|Intermediate|Advanced|Expert)/i);
    const difficulty = diffMatch ? diffMatch[1] : 'Intermediate';

    const phaseMatch = prompt.match(/Interview Phase:\s*(.+)/i);
    const phase = phaseMatch ? phaseMatch[1].trim() : 'FUNDAMENTALS';

    const questionMap: Record<number, string> = {
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
    };

    const reply = questionMap[day] || `Moving to ${topic}: how would you design and implement this component for a production engineering workload?`;

    return {
      reply,
      day,
      topic,
      objective: `Mastery of Day ${day} core engineering principles`,
      difficulty,
      phase,
    };
  }

  private handleFeedback(prompt: string): any {
    const scoreMatches = Array.from(prompt.matchAll(/Score\s*(\d+)\/10/gi));
    const scores = scoreMatches.map(m => parseInt(m[1], 10));

    const avgScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10)
      : 75;

    const isHigh = avgScore >= 70;
    const isMedium = avgScore >= 45 && avgScore < 70;

    return {
      summary: isHigh
        ? "The candidate demonstrated solid technical depth across AI cohort topics, showcasing clear reasoning on architecture and system trade-offs."
        : isMedium
        ? "The candidate demonstrated partial technical understanding across cohort topics, showing good high-level awareness but missing several low-level details."
        : "The candidate struggled with technical depth during the session, giving evasive or incorrect responses on several core curriculum topics.",
      strengths: isHigh ? [
        "Strong understanding of vector database indexing and retrieval strategies.",
        "Solid architectural vision for multi-turn state and backend API integration.",
        "Clear communication of engineering trade-offs between speed, cost, and accuracy."
      ] : isMedium ? [
        "Identified basic high-level system components.",
        "Attempted answers across multiple curriculum days."
      ] : [
        "Attempted the technical assessment session."
      ],
      gaps: isHigh ? [
        "Could deepen knowledge around ANN graph parameters like HNSW M and efConstruction.",
        "Production observability and structured evaluation frameworks could be explored further."
      ] : [
        "Need fundamental review of vector embeddings, RAG architectures, and tool calling.",
        "Precision in technical vocabulary and system design trade-offs requires improvement."
      ],
      next: [
        "Review vector database indexing options (HNSW, IVFFlat, SQ8).",
        "Practice building custom MCP tools and multi-agent routing workflows.",
        "Study automated RAG evaluation metrics using LLM-as-a-judge frameworks."
      ],
      subScores: {
        technicalDepth: Math.max(10, Math.min(100, avgScore)),
        systemDesign: Math.max(10, Math.min(100, isHigh ? avgScore - 3 : avgScore)),
        communication: Math.max(10, Math.min(100, isHigh ? avgScore + 4 : avgScore)),
        adaptability: Math.max(10, Math.min(100, avgScore))
      }
    };
  }
}
