import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateInterviewScore(conversationData, interviewType) {
  // Summarize conversation to reduce token count
  const summary = conversationData
    .map((msg, idx) => {
      const content = msg.content?.substring(0, 500) || ""; // Limit each message to 500 chars
      return `Q${idx + 1}: ${content}`;
    })
    .join("\n");

  const rules = `You are a Senior Technical Interviewer at a FAANG company evaluating a VERBAL technical interview.

**CRITICAL CONTEXT:**
- Responses were SPOKEN and transcribed - not typed code
- Forgive verbal artifacts (filler words, minor grammar issues)
- Judge like a real tech interviewer: technical depth, problem-solving approach, and clarity

**REAL INTERVIEWER EVALUATION CRITERIA:**

1. TECHNICAL KNOWLEDGE (Weight: 35%)
   - Depth of understanding of core concepts
   - Accuracy of technical explanations
   - Awareness of edge cases, trade-offs, and complexities
   - Correct use of terminology
   - 90-100: Expert-level understanding, mentions optimizations and trade-offs unprompted
   - 75-89: Solid grasp, mostly correct with minor gaps
   - 60-74: Basic understanding but misses nuances or makes notable mistakes
   - 40-59: Significant misconceptions or knowledge gaps
   - Below 40: Fundamental misunderstanding

2. PROBLEM-SOLVING APPROACH (Weight: 40%)
   - Asks clarifying questions before diving in
   - Breaks down complex problems systematically
   - Considers multiple approaches and compares them
   - Thinks through edge cases and constraints
   - Iterates and refines solutions when prompted
   - 90-100: Methodical, considers alternatives, identifies optimal approach
   - 75-89: Good structured thinking, covers most cases
   - 60-74: Somewhat structured but misses edge cases or better approaches
   - 40-59: Scattered thinking, struggles to form coherent approach
   - Below 40: Cannot formulate logical approach

3. COMMUNICATION CLARITY (Weight: 25%)
   - Explains thought process clearly as they work
   - Uses analogies or examples to illustrate complex ideas
   - Responds directly to questions without excessive rambling
   - Checks for interviewer understanding
   - 90-100: Crystal clear explanations, teaches concepts effectively
   - 75-89: Generally clear, minor areas of confusion
   - 60-74: Understandable but requires follow-up questions
   - 40-59: Often unclear or hard to follow
   - Below 40: Cannot articulate thoughts coherently

**CALCULATE OVERALL SCORE:**
- Overall Score = (Technical × 0.35) + (Problem-Solving × 0.40) + (Communication × 0.25)
- Round to nearest integer
- Do NOT just average the three scores - use the weighted formula above

**OUTPUT FORMAT (VALID JSON ONLY):**
{
  "overallScore": <calculated using weighted formula>,
  "breakdown": {
    "technical": <0-100>,
    "problemSolving": <0-100>,
    "communication": <0-100>
  },
  "strengths": [
    "Quote or reference their specific strong response",
    "Another specific strength with example",
    "Limit to 5 most impactful strengths which are super in-detail about details"
  ],
  "gaps": [
    "Specific concept they struggled with or got wrong",
    "Missed edge case or approach they didn't consider",
    "Limit to 5 most critical gaps which are super in-detail about details"
  ],
  "improvement": [
    "Concrete study topic: 'Review [specific concept] focusing on [specific aspect]'",
    "Practice recommendation: 'Practice [type of problem] on [platform/resource]'",
    "Skill development: 'Work on [specific skill] by [specific action]'",
    "Limit to 5 actionable items which are super in-detail about details"
  ]
}

**MAKE IT REAL:**
- Reference actual things they said or didn't say
- No generic feedback - tie everything to this specific interview
- Be honest but constructive

Interview Type: ${interviewType}
Conversation:
${summary}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "you are a scoring assistant. you MUST respond with valid json only. no markdown, no code blocks, no explanations. just raw json.",
      },
      {
        role: "user",
        content: rules,
      },
    ],
    temperature: 0.6,
    response_format: { type: "json_object" },
  });

  let content = response.choices[0].message.content;
  console.log("raw ai score response:", content);

  // clean up any markdown code blocks
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");

  // replace markdown bullets with proper json arrays
  content = content.replace(/\* /g, "");

  // extract json from response
  let jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return JSON.parse(content);
}

export { generateInterviewScore };
