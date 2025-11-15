import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config()

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function generateFollowups(currentQuestion, responses) {
    const rules = 
    
    `Tech follow-up generator. 
    Probe shallow answers, end when deep understanding shown.
    PROBE: Missing complexity analysis, vague performance claims,
     no trade-offs discussed, incomplete error handling. Basically I
     want you to test what they've just said from the most recent thing
     in the responses, like a real interviewer would.
     

    END: Technical depth with specifics, 3+ follow-ups, 
    clear understanding demonstrated.

    You can set the isThisTheEnd to something in which you 
    think is good to end off on. Don't keep going on for 20 
    times, just maybe do max 4 but it's all based on the 
    complexity of the topic at hand. Guarantee that a question has
    minimum 2 followups.

    Format: 
    {"followup":
        {
            "forWhatQuestion":1,
            "followupQuestion":"...",
            "isThisTheEnd":false
        }
    }

    Question: ${currentQuestion}
    Responses: ${JSON.stringify(responses, null, 2)}`;

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