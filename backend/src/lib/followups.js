import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config()

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function generateFollowups(currentQuestion, responses, questionIndex) {
    const lastResponse = responses[responses.length - 1];
    const followupCount = responses.length - 1; // First response is the main answer

    const rules = `Generate a followup question based on their answer: "${lastResponse}"
Return ONLY valid JSON:
{"followup":{"forWhatQuestion":${questionIndex},"followupQuestion":"","isThisTheEnd":${followupCount >= 1 ? 'true' : 'false'}}}`;

    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{
            role: "user",
            content: rules
        }],
        temperature: 0.4,
        max_tokens: 150
    });

    return JSON.parse(response.choices[0].message.content.trim());
}

export { generateFollowups };