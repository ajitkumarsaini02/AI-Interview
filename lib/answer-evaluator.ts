import OpenAI from 'openai';
import { EvaluationOutputSchema, AskedQuestion } from '../types/interview';
import { CurriculumDay } from '../types/curriculum';
import { Candidate } from '../types/candidate';

export interface EvaluationResult {
  classification: 'strong' | 'acceptable' | 'weak' | 'incorrect' | 'incomplete';
  reasoning: string;
  identifiedStrengths: string[];
  identifiedGaps: string[];
}

export async function evaluateAnswer(
  candidate: Candidate,
  question: AskedQuestion,
  curriculumDay: CurriculumDay,
  candidateAnswer: string
): Promise<EvaluationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });

      const prompt = `You are a strict, fair Senior Technical Interviewer evaluating a candidate's response in a live technical interview.

Candidate Profile:
- Name: ${candidate.member.name}
- Role: ${candidate.member.jobRole} (${candidate.member.yearsExperience} years exp)

Curriculum Topic (Day ${curriculumDay.day}):
- Title: ${curriculumDay.title}
- Tools: ${curriculumDay.tools.join(', ')}
- Objectives: ${curriculumDay.objectives.join('; ')}

Question Asked:
"${question.questionText}" (Type: ${question.type}, Difficulty: ${question.difficulty})

Candidate Answer:
"${candidateAnswer}"

Evaluate the candidate's answer strictly against the technical curriculum objectives and question context.

SPECIAL RELEVANCE CHECK:
- If the candidate's answer is completely irrelevant, off-topic, evasive, nonsense, or non-responsive (e.g. "I don't know", "skip", unrelated topics like baking/sports), assign "classification": "incomplete" or "weak" and explicitly note in identifiedGaps: ["Response was off-topic or non-responsive to the current question context"].

Return a JSON object matching this exact structure:
{
  "classification": "strong" | "acceptable" | "weak" | "incorrect" | "incomplete",
  "reasoning": "Detailed technical analysis of why this grade was assigned.",
  "identifiedStrengths": ["Specific strength 1", "Specific strength 2"],
  "identifiedGaps": ["Specific technical gap or missing concept 1"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const validated = EvaluationOutputSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      }
    } catch (error) {
      console.warn('OpenAI answer evaluation call failed, using deterministic evaluator fallback:', error);
    }
  }

  // Deterministic Fallback Evaluator
  return fallbackEvaluateAnswer(question, curriculumDay, candidateAnswer);
}

function fallbackEvaluateAnswer(
  question: AskedQuestion,
  curriculumDay: CurriculumDay,
  candidateAnswer: string
): EvaluationResult {
  const lowerAnswer = candidateAnswer.toLowerCase().trim();
  const wordCount = lowerAnswer.split(/\s+/).length;

  if (
    lowerAnswer.length === 0 ||
    lowerAnswer.includes("don't know") ||
    lowerAnswer.includes("not sure") ||
    lowerAnswer.includes("pass") ||
    lowerAnswer.includes("skip") ||
    lowerAnswer.includes("whatever")
  ) {
    return {
      classification: 'incomplete',
      reasoning: 'The candidate did not provide a technical answer or stated they were unsure.',
      identifiedStrengths: [],
      identifiedGaps: [`Lacks familiarity with ${curriculumDay.title} concepts (${curriculumDay.tools.join(', ')})`],
    };
  }

  const stopWords = new Set([
    'with', 'that', 'from', 'this', 'they', 'them', 'have', 'make', 'your', 'what', 'where', 'when',
    'which', 'about', 'would', 'could', 'should', 'more', 'some', 'other', 'into', 'than', 'then', 'only',
    'build', 'results', 'using', 'using'
  ]);

  // Extract key domain words from tools and objectives
  const keyTerms = Array.from(
    new Set([
      ...curriculumDay.tools.map((t) => t.toLowerCase()),
      ...curriculumDay.objectives.flatMap((o) => o.toLowerCase().split(/[\s,();]+/)),
      'vector', 'embeddings', 'chromadb', 'rrf', 'bm25', 'hybrid', 'rag', 'pydantic', 'fastapi', 'langchain', 'mcp', 'docker', 'kubernetes', 'prompt', 'fine-tuning', 'indexing', 'retrieval', 'chunk', 'token', 'model', 'search'
    ])
  ).filter((term) => term.length > 2 && !stopWords.has(term));

  const matchedTerms = keyTerms.filter((term) => lowerAnswer.includes(term));

  // Check relevance: if matched terms is zero, answer is irrelevant or non-responsive
  if (matchedTerms.length === 0) {
    return {
      classification: 'incomplete',
      reasoning: `The candidate's response was non-responsive or off-topic to the question on ${curriculumDay.title}.`,
      identifiedStrengths: [],
      identifiedGaps: [`Response was off-topic or non-responsive to ${curriculumDay.title} context`],
    };
  }

  if ((wordCount >= 18 && matchedTerms.length >= 2) || matchedTerms.length >= 4) {
    return {
      classification: 'strong',
      reasoning: `Demonstrated solid understanding of ${curriculumDay.title} referencing key concepts (${matchedTerms.slice(0, 3).join(', ')}).`,
      identifiedStrengths: [
        `Clear explanation of ${curriculumDay.title} fundamentals`,
        `Mentioned relevant tools/techniques (${matchedTerms.slice(0, 3).join(', ')})`,
      ],
      identifiedGaps: [],
    };
  } else if (matchedTerms.length >= 1) {
    return {
      classification: 'acceptable',
      reasoning: `Provided a reasonable answer covering basic concepts of ${curriculumDay.title}, though could elaborate on edge cases.`,
      identifiedStrengths: [`Understands basic principles of ${curriculumDay.title}`],
      identifiedGaps: [`Could detail specific implementation nuances or trade-offs`],
    };
  } else {
    return {
      classification: 'weak',
      reasoning: `Response was brief and lacked key technical details regarding ${curriculumDay.title}.`,
      identifiedStrengths: [`Attempted response to ${question.type} question`],
      identifiedGaps: [`Needs more depth on ${curriculumDay.tools.join(' / ')}`],
    };
  }
}
