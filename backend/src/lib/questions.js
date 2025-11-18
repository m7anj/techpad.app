import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config()

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function generateQuestions(p) {

    const rules = `Generate technical interview questions for this topic: ${p}
Return ONLY valid JSON in this structure and nothing differnet. I want this json format only. Don't add anything else:
You would make more quesitons depending on what the prompt wants. But if it is not specified, make 4 questions.
{"questions":[{"id":1,"question":""},{"id":2,"question":""},{"id":3,"question":""},{"id":4,"question":""}]}
Start very easy with a specific topic, speak super human exactly like an interviewer would.`;



    const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [{
            role: "system", 
            content: rules
        }, {
            role: "user", 
            content: p
        }],
        temperature: 0.6,
    })


    return JSON.parse(response.choices[0].message.content.trim());
}

export {
    generateQuestions
}