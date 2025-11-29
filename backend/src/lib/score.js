import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function generateInterviewScore(conversationData, interviewType) {
    // Summarize conversation to reduce token count
    const summary = conversationData.map((msg, idx) => {
        const content = msg.content?.substring(0, 500) || ''; // Limit each message to 500 chars
        return `Q${idx + 1}: ${content}`;
    }).join('\n');

    const rules = `Tech interview scoring system. Evaluate based on responses.

**Scoring (0-100):**
- TECHNICAL (40%): correctness, depth, trade-offs
- PROBLEM-SOLVING (30%): logical approach, optimization
- COMMUNICATION (30%): clarity, structure

**Output JSON:**
{
  "overallScore": N,
  "breakdown": {"technical": N, "problemSolving": N, "communication": N},
  "strengths": ["..."],
  "gaps": ["..."],
  "improvement": ["..."]
}

Type: ${interviewType}
Conversation Summary:
${summary}
`;

    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
            role: "system",
            content: "you are a scoring assistant. you MUST respond with valid json only. no markdown, no code blocks, no explanations. just raw json."
        }, {
            role: "user",
            content: rules
        }],
        temperature: 0.3,
        response_format: { type: "json_object" }
    });

    let content = response.choices[0].message.content;
    console.log("raw ai score response:", content);

    // clean up any markdown code blocks
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // replace markdown bullets with proper json arrays
    content = content.replace(/\* /g, '');

    // extract json from response
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
}

export { generateInterviewScore };
