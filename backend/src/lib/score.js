import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function generateInterviewScore(conversationData, interviewType) {
    const rules = `Tech interview scorer. Grade on 4 areas (0-100):

TECHNICAL (40%): Algorithms, system design, architecture. High scores need complexity analysis, edge cases, multiple solutions.

PROBLEM-SOLVING (30%): Approach and optimization. Systematic methodology, debugging skills.

COMMUNICATION (30%): Technical clarity and vocabulary. Precise explanations.

Overall = weighted average. Be precise about gaps and strengths. (Make sure they mathematically add up to 100 and the weights make sense).

Output: 
{
    "overallScore":N,
    "breakdown":
        {
        "technical":N,
        "problemSolving":N,
        "communication":N
        },
    "strengths":[],
    "gaps":[],
    "improvement":[]
}

Type: ${interviewType}
Data: ${JSON.stringify(conversationData)}`;

    const response = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: [{
            role: "user",
            content: rules
        }],
        temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content);
}

export { generateInterviewScore };