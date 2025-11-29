import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateFollowups(currentQuestion, responses, questionIndex) {
  const lastResponse = responses[responses.length - 1];
  const followupCount = responses.length - 1;

  // Build conversation history for context
  let conversationHistory = `ORIGINAL QUESTION: "${currentQuestion}"\n\n`;

  // Add all previous responses to give AI full context
  responses.forEach((resp, idx) => {
    const isLast = idx === responses.length - 1;
    let respText = "";
    let hasCode = false;
    let hasWhiteboard = false;

    if (typeof resp === "string") {
      respText = resp;
    } else {
      respText = resp.content || "";
      if (resp.code && resp.code.trim()) {
        respText += `\n\n[CODE]:\n${resp.code}`;
        hasCode = true;
      }
      if (resp.whiteboard) {
        hasWhiteboard = true;
      }
    }

    conversationHistory += `${isLast ? 'LATEST ' : ''}RESPONSE ${idx + 1}:\n"${respText}"\n${hasCode ? '[Has code]\n' : ''}${hasWhiteboard ? '[Has whiteboard]\n' : ''}\n`;
  });

  const lastResponseData = typeof lastResponse === "string"
    ? { content: lastResponse }
    : lastResponse;

  const hasCode = lastResponseData.code && lastResponseData.code.trim();
  const hasWhiteboard = lastResponseData.whiteboard;

  const rules = `You're interviewing someone. Here's what YOU asked and what THEY said:

${conversationHistory}

Listen - YOU asked them "${currentQuestion}". That was YOUR question. You own it.

Now they just responded. Here's what to do:

1. If they're asking YOU to clarify or elaborate on something YOU said, then clarify it. Don't act confused. You asked the question, so explain what you meant.

2. If they answered, ask ONE follow-up that digs deeper or tests their understanding. Be conversational. Talk like a human, not a robot.

3. Keep it natural. No "great question!" or "excellent point!" bullshit. Just respond like you're having a real conversation.

${followupCount >= 1 ? "This is your LAST follow-up for this question. Make it count." : ""}

Return JSON only (no markdown):
{"followup":{"forWhatQuestion":${questionIndex},"followupQuestion":"YOUR RESPONSE HERE","isThisTheEnd":${followupCount >= 1}}}`;

  // Build message content with vision support
  const messageContent = [];

  // Add the text prompt
  messageContent.push({
    type: "text",
    text: rules,
  });

  // Add whiteboard image ONLY if it exists
  if (hasWhiteboard) {
    messageContent.push({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${lastResponse.whiteboard}`,
      },
    });
  }

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: messageContent,
      },
    ],
    temperature: 0.5,
  });

  // Clean the response - remove markdown code blocks if present
  let content = response.choices[0].message.content.trim();

  // Remove ```json and ``` wrappers if they exist
  if (content.startsWith("```")) {
    content = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(content);
}

export { generateFollowups };
