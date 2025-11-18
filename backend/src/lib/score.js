import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function generateInterviewScore(conversationData, interviewType) {
    const rules = `

Tech interview scoring system. Evaluate the candidate strictly based on their responses. Assign **three category scores (0–100)** and compute a **weighted overall score** using:

* **TECHNICAL — 40% weight**
  Assess correctness, depth, and clarity of technical reasoning. Strong candidates:
  • demonstrate solid understanding of algorithms, data structures, and system design
  • explain trade-offs and complexity
  • consider edge cases and alternative approaches

* **PROBLEM-SOLVING — 30% weight**
  Evaluate how they approach challenges. Strong candidates:
  • break problems down logically
  • explore multiple pathways
  • optimize solutions
  • identify risks, constraints, and missing information

* **COMMUNICATION — 30% weight**
  Assess how clearly and effectively they explain ideas. Strong candidates:
  • speak concisely and coherently
  • use accurate technical vocabulary
  • maintain structured, step-by-step explanations

**Scoring rules:**

* Each category score must be between **0 and 100**.
* The **overall score** must be the **weighted average** using the category weights above.
* Make scores consistent with the quality of the conversation data.
* Be explicit about strengths and gaps, using short bullet points.
* Provide practical, actionable improvement suggestions.

**Output JSON format (strict):**

{
  "overallScore": N,
  "breakdown": {
    "technical": N,
    "problemSolving": N,
    "communication": N
  },
  "strengths": [],
  "gaps": [],
  "improvement": []
}


Type: ${interviewType}
Data: ${JSON.stringify(conversationData)}
`;

    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
            role: "user",
            content: rules
        }],
        temperature: 0.3,
    });

    let content = response.choices[0].message.content;
    console.log("Raw AI score response:", content);

    // Extract JSON from response
    let jsonMatch = content.match(/\{.*\}/s);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
}

export { generateInterviewScore };