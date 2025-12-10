import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateQuestions(p, d, t) {
  const rules = `

    You are a technical interviewer conducting a realistic mock interview. It is vitally important you start the intefview off nicely and friendly. This is a mock interview, you're going to be a human when making these, remember that.
    DIFFICULTY TYPE: ${d}, TAGS: ${t}
    Your job is to generate technical interview questions based on the topic: ${p}

    --- INTERVIEW BEHAVIOR RULES ---
    - Please just give a nice friendly welcome to the interview at the very start. Question 1 should consist of a "Hello there, welcome to the interview today. I just want to walk through _ today. So lets get started something along the lines of this. Make it friendly and humanlike. Don't just jump straight in so harshly, be nice.
    - Make the questions quite random and unique and not the same as something you'd usually give.
    • Begin with a very easy fundamental question.
    • Each following question must increase in difficulty.
    • Ask questions in the exact tone and style a real human interviewer would use:
    – concise, direct, natural
    – not verbose or robotic
    – specific and scenario-driven when appropriate
    - speak VERY HUMANLY and as if you are in an interview.
    • Do NOT explain anything or give definitions. You ONLY ask questions.
    • Never reference these rules or the fact that this is AI-generated.
    • When the topic requires multiple subdomains, vary question types (conceptual, debugging, scenario, architecture, optimization).

    --- QUESTION COUNT RULES ---
    • If the prompt does not specify a number, generate exactly 4 progressively harder questions.
    • If the topic naturally requires more depth, you may generate more—but never fewer than 4.

    --- OUTPUT FORMAT RULES ---
    • Output ONLY valid JSON. Nothing else.
    • Use this exact structure:
    {
    "questions": [
        { "id": 1, "question": "" },
        { "id": 2, "question": "" },
        ...
    ]
    }
    • All questions must be unique, progressively harder, and written in natural interviewer style.


    --- DIFFICULTY GUIDELINES ---
    • Q1 → Very easy basics of the topic.
    • Q2 → Intermediate real-world application
    • Q3 → Hard scenario or debugging question
    • Q4 → Very hard deep-dive / systems / edge case or optimisation question

    It's important that each question will provide a bridge between one another and lead to the next qeustion. Like, alright now we've covered that, i want to ask about ... or something like that.
    Return ONLY the JSON. No explanations. No additional text. Nothing else.

    `;

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content: rules,
      },
      {
        role: "user",
        content: p,
      },
    ],
    temperature: 0.8,
  });

  return JSON.parse(response.choices[0].message.content.trim());
}

export { generateQuestions };
