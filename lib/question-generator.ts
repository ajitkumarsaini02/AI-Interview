import OpenAI from 'openai';
import { Candidate } from '../types/candidate';
import { AskedQuestion } from '../types/interview';
import { NextQuestionPlan } from './interview-planner';

export interface QuestionGenerationResult {
  reply: string;
  questionText: string;
}

export async function generateQuestion(
  candidate: Candidate,
  plan: NextQuestionPlan,
  askedQuestions: AskedQuestion[],
  isFirstQuestion: boolean = false
): Promise<QuestionGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.trim().length > 0) {
    try {
      console.log(`[OpenAI Engine] Generating ${plan.difficulty} ${plan.questionType} question via gpt-4o-mini...`);
      const openai = new OpenAI({ apiKey });

      const day = plan.targetDay;
      const historySummary = askedQuestions
        .slice(-3)
        .map((q) => `- ${q.topic} (${q.type}): ${q.questionText}`)
        .join('\n');

      let prompt: string;

      if (isFirstQuestion) {
        prompt = `You are a Senior AI Technical Interviewer conducting a realistic, multi-turn technical interview.

Candidate Profile:
- Name: ${candidate.member.name}
- Job Role: ${candidate.member.jobRole} (${candidate.member.yearsExperience} yrs experience)
- Education: ${candidate.member.education}

Starting Interview Focus: Day ${day.day}: "${day.title}".
Tools: ${day.tools.join(', ')}.
Objectives: ${day.objectives.join('; ')}.

Instructions:
1. Provide a warm, professional 1-2 sentence technical greeting welcoming ${candidate.member.name}.
2. Ask an engaging, realistic ${plan.difficulty}-level ${plan.questionType} question based on Day ${day.day} (${day.title}).
3. Ensure the question is distinct, challenging, and tailored to their background.

Output JSON format:
{
  "greeting": "Welcome message...",
  "questionText": "The actual technical question..."
}`;
      } else if (plan.isFollowUp && plan.followUpContext) {
        prompt = `You are a Senior AI Technical Interviewer conducting a realistic, multi-turn technical interview.

Candidate Profile: ${candidate.member.name} (${candidate.member.jobRole})

Previous Question: "${plan.followUpContext.previousQuestion}"
Candidate Answer: "${plan.followUpContext.previousAnswer}"
Evaluation Classification: ${plan.followUpContext.classification.toUpperCase()}
Gaps Noted: ${plan.followUpContext.gaps.join(', ') || 'None'}
Strengths Noted: ${plan.followUpContext.strengths.join(', ') || 'None'}

Target Topic (Day ${day.day}): ${day.title}
Tools: ${day.tools.join(', ')}

DYNAMIC QUESTION ADAPTATION RULES:
1. IF candidate's previous answer was RELEVANT:
   - Transition MUST explicitly quote or reference concepts/terms from candidate's answer ("${plan.followUpContext.previousAnswer.slice(0, 80)}...").
   - Ask a follow-up building directly on what they wrote (${plan.difficulty} difficulty, ${plan.questionType} style).
2. IF candidate's previous answer was IRRELEVANT, OFF-TOPIC, or INCOMPLETE:
   - Transition MUST gently state: "INTERVIEWER NOTE: Your response was off-topic or non-responsive. Let's re-frame with a foundational question on ${day.title}."
   - CHANGE THE QUESTION to a simplified, diagnostic question probing foundational understanding of ${day.title}.

Output JSON format:
{
  "transition": "Transition phrase...",
  "questionText": "The technical question..."
}`;
      } else {
        const weaknessClause = plan.isWeaknessProbing
          ? `NOTE: The candidate previously had multiple submission attempts or skipped Day ${day.day} (${day.title}). Ask a targeted diagnostic question to evaluate whether they have mastered this concept.`
          : '';

        prompt = `You are a Senior AI Technical Interviewer conducting a realistic technical interview.

Candidate Profile: ${candidate.member.name} (${candidate.member.jobRole}, ${candidate.member.yearsExperience} yrs exp)
Previously Asked Topics:
${historySummary}

Next Target Topic (Day ${day.day}): "${day.title}"
Tools: ${day.tools.join(', ')}
Objectives: ${day.objectives.join('; ')}
${weaknessClause}

Instructions:
1. Provide a brief 1-sentence transition switching topic smoothly to Day ${day.day} (${day.title}).
2. Ask a fresh, high-quality ${plan.difficulty}-level ${plan.questionType} technical question based on Day ${day.day}.
3. DO NOT repeat any previous questions.

Output JSON format:
{
  "transition": "Transition phrase...",
  "questionText": "The new technical question..."
}`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const prefix = parsed.greeting || parsed.transition || '';
        const questionText = parsed.questionText;
        if (questionText) {
          const reply = prefix ? `${prefix}\n\n${questionText}` : questionText;
          return { reply, questionText };
        }
      }
    } catch (error) {
      console.warn('OpenAI question generation call failed, using fallback generator:', error);
    }
  }

  // Fallback Question Generator
  return fallbackGenerateQuestion(candidate, plan, isFirstQuestion);
}

function fallbackGenerateQuestion(
  candidate: Candidate,
  plan: NextQuestionPlan,
  isFirstQuestion: boolean
): QuestionGenerationResult {
  const day = plan.targetDay;
  const toolsStr = day.tools.join(', ');
  const objStr = day.objectives[0] || day.title;

  let questionText: string;

  switch (plan.questionType) {
    case 'conceptual':
      questionText = `In the context of Day ${day.day} (${day.title}), how would you explain the core difference between using ${toolsStr} and traditional approaches for ${objStr}?`;
      break;
    case 'implementation':
      questionText = `Looking at ${day.title} (Day ${day.day}), how would you write or structure the implementation for ${objStr} using ${day.tools[0] || 'Python'}?`;
      break;
    case 'debugging':
      questionText = `Suppose your pipeline for ${day.title} is deployed, but you notice high latency or incorrect outputs related to ${toolsStr}. How would you systematically debug this issue?`;
      break;
    case 'scenario':
      questionText = `Imagine you are building a production AI system for healthcare data. Based on Day ${day.day} (${day.title}), how would you handle ${objStr}?`;
      break;
    case 'trade-off':
      questionText = `What are the primary trade-offs when choosing between ${toolsStr} for ${day.title}? Under what constraints would you pick one over the other?`;
      break;
    case 'architecture':
    case 'system design':
      questionText = `How would you architect an end-to-end system utilizing ${toolsStr} to achieve ${objStr} reliably at scale?`;
      break;
    default:
      questionText = `Can you walk me through your experience with ${day.title} (Day ${day.day}), specifically addressing ${objStr}?`;
      break;
  }

  if (isFirstQuestion) {
    const reply = `Welcome ${candidate.member.name}. Let's begin your technical interview.\n\nTo start off, let's examine ${day.title} (Day ${day.day}).\n\n${questionText}`;
    return { reply, questionText };
  } else if (plan.isFollowUp && plan.followUpContext) {
    const isOffTopic =
      plan.followUpContext.classification === 'incomplete' ||
      plan.followUpContext.gaps.some((g) => g.toLowerCase().includes('off-topic') || g.toLowerCase().includes('non-responsive'));

    if (isOffTopic) {
      const transition = `INTERVIEWER NOTE: Your response was off-topic or non-responsive. Let's re-frame and reset our focus on foundational concepts of ${day.title}.`;
      const changedQuestion = `Let's step back: what is the fundamental purpose of ${toolsStr} in ${day.title}, and how does it fit into an AI engineering pipeline?`;
      const reply = `${transition}\n\n${changedQuestion}`;
      return { reply, questionText: changedQuestion };
    } else {
      const words = plan.followUpContext.previousAnswer.split(/\s+/).filter((w) => w.length > 4);
      const excerpt = words.slice(0, 4).join(' ') || 'your previous response';

      let transition = `Regarding your point about "${excerpt}"...`;
      if (plan.followUpContext.classification === 'strong') {
        transition = `You made strong points regarding "${excerpt}". Let's push deeper into the architectural trade-offs.`;
      } else if (plan.followUpContext.classification === 'incorrect' || plan.followUpContext.classification === 'weak') {
        transition = `I see your point about "${excerpt}". Let's test a scenario to clarify the mental model.`;
      }

      const reply = `${transition}\n\n${questionText}`;
      return { reply, questionText };
    }
  } else {
    const weaknessNote = plan.isWeaknessProbing ? ` (Focusing on an area with previous mission friction)` : '';
    const reply = `Moving on to Day ${day.day}: ${day.title}${weaknessNote}.\n\n${questionText}`;
    return { reply, questionText };
  }
}
