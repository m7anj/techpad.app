import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Detect if user response is a clarifying question
function isClarifyingQuestion(userResponse) {
  const response = userResponse.toLowerCase().trim();

  // Keywords that indicate clarification needed
  const clarificationKeywords = [
    "i don't know",
    "honestly",
    "what do you mean",
    "can you explain",
    "can you repeat",
    "what does",
    "clarify",
    "don't understand",
    "confused",
    "what is",
    "repeat",
    "say that again",
    "didn't catch",
    "pardon",
    "sorry what",
    "elaborate",
    "could you",
    "can you rephrase",
    "not sure what",
    "what are you asking",
  ];

  // Check if response contains clarification keywords
  // 
  const hasClarificationKeyword = clarificationKeywords.some((keyword) =>
    response.includes(keyword),
  );

  // Check if response is very short and ends with "?"45678
  const isShortQuestion = response.length < 100 && response.includes("?");

  // Check if response starts with question words
  const questionStarters = [
    "what",
    "how",
    "why",
    "when",
    "where",
    "can you",
    "could you",
    "would you",
  ];
  const startsWithQuestion = questionStarters.some((starter) =>
    response.startsWith(starter),
  );

  return hasClarificationKeyword || (isShortQuestion && startsWithQuestion);
}

// Generate a clarification response using Claude
async function generateClarification(
  originalQuestion,
  userClarificationRequest,
) {
  try {
    const prompt = `You are conducting a technical interview. The candidate has asked for clarification on your question.

Original Question: "${originalQuestion}"

Candidate's Clarification Request: "${userClarificationRequest}"

Please provide a helpful clarification that:
1. Addresses what they're confused about
2. Rephrases or explains the question differently
3. Gives hints or examples if needed
4. Stays friendly and encouraging
5. Keeps it concise (2-3 sentences max)

Respond ONLY with the clarification text, no extra formatting.`;

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating clarification:", error);
    // Fallback clarification
    return `Let me rephrase: ${originalQuestion} Take your time and feel free to ask if you need more explanation.`;
  }
}

export { isClarifyingQuestion, generateClarification };
