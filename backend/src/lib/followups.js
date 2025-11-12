import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config()

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function generateFollowups(currentQuestion, responses) {
    const rules = `Tech follow-up generator. Probe shallow answers, end when deep understanding shown.

PROBE: Missing complexity analysis, vague performance claims, no trade-offs discussed, incomplete error handling.

END: Technical depth with specifics, 3+ follow-ups, clear understanding demonstrated.

Format: {"followup":{"id":${responses.length + 1},"forWhatQuestion":1,"followupQuestion":"...","isThisTheEnd":false}}

Question: ${currentQuestion}
Responses: ${JSON.stringify(responses)}`;




    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{
            role: "user",
            content: rules
        }],
        temperature: 0.3,
        max_tokens: 150
    });

    return JSON.parse(response.choices[0].message.content);
}

export { generateFollowups };