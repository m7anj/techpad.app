import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateFollowups(currentQuestion, responses, questionIndex) {
  const lastResponse = responses[responses.length - 1];
  const followupCount = responses.length - 1;

  // Format the response with all available data
  let responseText = "";
  let hasCode = false;
  let hasWhiteboard = false;

  if (typeof lastResponse === "string") {
    responseText = lastResponse;
  } else {
    responseText = lastResponse.content || "";
    if (lastResponse.code && lastResponse.code.trim()) {
      responseText += `\n\n[CODE]:\n${lastResponse.code}`;
      hasCode = true;
    }
    // Only set flag if whiteboard exists, but DON'T add text about it
    // Let the image speak for itself
    if (lastResponse.whiteboard) {
      hasWhiteboard = true;
    }
  }

  const rules = `You are a technical interviewer. The candidate just responded.

WHAT THEY PROVIDED:
${hasCode ? "✓ Text answer\n✓ Code snippet" : "✓ Text answer"}${hasWhiteboard ? "\n✓ Whiteboard drawing (see image)" : ""}

THEIR RESPONSE:
"${responseText}"

CRITICAL RULES:
1. ONLY reference what you actually see:
   - Their text: "${lastResponse.content || responseText}"
   ${hasCode ? `- Their code: Yes, they wrote code` : "- Their code: NO CODE PROVIDED"}
   ${hasWhiteboard ? "- Their whiteboard: YES, look at the image attached" : "- Their whiteboard: BLANK - DO NOT MENTION IT"}

2. Priority: Respond to TEXT first, then CODE (if exists), then DIAGRAM (if drawn).

3. If whiteboard is blank, DO NOT ask about drawings. Focus on their text${hasCode ? " and code" : ""}.

4. Ask ONE follow-up that:
   - Probes their reasoning or tests edge cases
   - Is based ONLY on what they actually provided
   - Sounds natural and human
   - Doesn't repeat what they said

${followupCount >= 1 ? "FINAL follow-up for this question." : ""}

OUTPUT (JSON only, no markdown):
{"followup":{"forWhatQuestion":${questionIndex},"followupQuestion":"","isThisTheEnd":${followupCount >= 1}}}`;

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
    temperature: 0.3,
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
