import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateInterviewScore(
  conversationData,
  interviewType,
  timeTaken,
  expectedDuration,
) {
  // Build full conversation context
  const fullConversation = conversationData
    .map((msg, idx) => {
      const role = msg.role === "assistant" ? "INTERVIEWER" : "CANDIDATE";
      const content = msg.content || "";
      return `${role}: ${content}`;
    })
    .join("\n\n");

  const totalQuestions = conversationData.filter(
    (m) => m.role === "assistant",
  ).length;
  const totalAnswers = conversationData.filter((m) => m.role === "user").length;
  const timeSpentMinutes = Math.floor(timeTaken / 60);
  const timeSpentSeconds = timeTaken % 60;
  const completionRatio = expectedDuration ? timeTaken / expectedDuration : 0;

  const rules = `You are a STRICT Senior Technical Interviewer evaluating this interview with BRUTAL HONESTY.

**INTERVIEW CONTEXT:**
- Total questions asked: ${totalQuestions}
- Total answers given: ${totalAnswers}
- Time spent: ${timeSpentMinutes}m ${timeSpentSeconds}s
- Expected duration: ${expectedDuration ? Math.floor(expectedDuration / 60) + "m" : "N/A"}
- Completion ratio: ${(completionRatio * 100).toFixed(0)}%

**CRITICAL RULES - READ CAREFULLY:**

1. **INCOMPLETE INTERVIEWS GET HARSH PENALTIES:**
   - If time spent < 2 minutes: Overall score CANNOT exceed 20
   - If answered < 50% of questions: Overall score CANNOT exceed 40
   - If completion ratio < 30%: Overall score CANNOT exceed 35
   - If they quit early or barely engaged: Reflect that in ALL scores

2. **ACTUALLY READ THE ENTIRE CONVERSATION:**
   - Evaluate EVERY question and answer pair
   - Don't be lenient - if they got something wrong, call it out
   - Empty answers, "I don't know", or no answers = 0 points for that question
   - Partial answers get partial credit ONLY if technically correct
   - Wrong answers are WORSE than no answer - deduct points

3. **MATH MUST ADD UP - USE WEIGHTED FORMULA:**
   - Overall Score = (Technical × 0.35) + (Problem-Solving × 0.40) + (Communication × 0.25)
   - DO NOT just average the three numbers
   - Round to nearest integer
   - Double-check your math before outputting

4. **SCORING SCALE (BE STRICT):**

   TECHNICAL KNOWLEDGE (35% weight):
   - 90-100: Expert level, mentions trade-offs, optimizations, edge cases unprompted
   - 75-89: Solid understanding, mostly correct, minor gaps
   - 60-74: Basic grasp but misses key concepts or makes mistakes
   - 40-59: Significant gaps, several wrong answers
   - 20-39: Major misconceptions, mostly wrong
   - 0-19: Didn't answer or completely wrong

   PROBLEM-SOLVING (40% weight):
   - 90-100: Systematic approach, considers alternatives, identifies optimal solution
   - 75-89: Structured thinking, covers most cases
   - 60-74: Some structure but misses edge cases or better approaches
   - 40-59: Scattered, struggles to form coherent plan
   - 20-39: No clear approach, guessing
   - 0-19: Didn't attempt or incoherent

   COMMUNICATION (25% weight):
   - 90-100: Crystal clear, teaches concepts effectively
   - 75-89: Generally clear with minor confusion
   - 60-74: Understandable but needs follow-up
   - 40-59: Often unclear or rambling
   - 20-39: Hard to follow
   - 0-19: Cannot articulate thoughts

5. **BE SPECIFIC IN FEEDBACK:**
   - Quote actual things they said (or didn't say)
   - Reference specific questions they struggled with
   - No generic bullshit like "good communication" - give examples
   - If they bombed, say so clearly

**OUTPUT FORMAT (MUST BE VALID JSON):**
{
  "overallScore": <integer 0-100, calculated using weighted formula>,
  "breakdown": {
    "technical": <integer 0-100>,
    "problemSolving": <integer 0-100>,
    "communication": <integer 0-100>
  },
  "strengths": [
    "Specific example of what they did well (quote or reference actual response)",
    "Another specific strength with evidence from conversation",
    "Max 5 items, be detailed and reference actual moments"
  ],
  "gaps": [
    "Specific concept/question they got wrong or struggled with",
    "Specific mistake they made with explanation why it's wrong",
    "Max 5 items, be brutally honest"
  ],
  "improvement": [
    "Concrete action: 'Study [specific topic] focusing on [specific aspect they missed]'",
    "Practice: 'Work on [type of problem] to improve [specific skill]'",
    "Max 5 actionable items tied to their actual gaps"
  ]
}

**REMEMBER:**
- Short interviews (< 5min) = bad scores
- Incomplete interviews = reflect that in score
- Wrong > No answer = penalize heavily
- Math must be correct: Overall = (T×0.35) + (P×0.40) + (C×0.25)
- Be honest, be specific, be harsh if needed

Interview Type: ${interviewType}

Full Conversation:
${fullConversation}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a scoring assistant. Respond with ONLY valid JSON. No markdown, no code blocks, no explanations. Just raw JSON.",
      },
      {
        role: "user",
        content: rules,
      },
    ],
    temperature: 0.3, // Lower temperature for more consistent scoring
    response_format: { type: "json_object" },
  });

  let content = response.choices[0].message.content;
  console.log("raw ai score response:", content);

  // clean up any markdown code blocks
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");

  // extract json from response
  let jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return JSON.parse(content);
}

export { generateInterviewScore };
