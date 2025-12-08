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

  const rules = `You are evaluating a VERBAL technical interview - responses were spoken, not typed.

**IMPORTANT CONTEXT:**
- These are SPOKEN responses transcribed to text
- Verbal communication is naturally less polished than written code
- Forgive minor grammar, filler words, and conversational language
- Focus on technical understanding and problem-solving ability
- Value clear thinking over perfect articulation

**Scoring (0-100):**
- TECHNICAL (40%): Core understanding, concepts explained, awareness of trade-offs
- PROBLEM-SOLVING (30%): Logical thinking process, breaking down problems, considering approaches
- COMMUNICATION (30%): Ability to explain technical concepts clearly (considering this is verbal)

**Scoring Guidelines:**
- Be FAIR and ENCOURAGING - this is verbal, not perfect written code
- 80-100: Strong understanding with clear explanations
- 60-79: Good grasp with some gaps or unclear explanations
- 40-59: Basic understanding but needs development
- Below 40: Significant knowledge gaps

**Output JSON:**
{
  "overallScore": N,
  "breakdown": {"technical": N, "problemSolving": N, "communication": N},
  "strengths": ["Specific examples from their responses"],
  "gaps": ["Specific areas they struggled with"],
  "improvement": ["Actionable advice based on their actual responses"]
}

**Make feedback SPECIFIC to what they said, not generic.**

Type: ${interviewType}
Conversation Summary:
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
    temperature: 0.3,
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
