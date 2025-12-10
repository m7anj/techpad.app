import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// generates audio from text using openai's tts api
// returns base64 encoded mp3 audio that can be sent over websocket
async function textToSpeech(text, voice = "alloy") {
  try {
    // call openai tts api - returns a buffer of mp3 audio bytes
    const response = await openai.audio.speech.create({
      model: "tts-1", // tts-1 is faster, tts-1-hd is higher quality but slower
      voice: voice, // alloy, echo, fable, onyx, nova, shimmer
      input: text,
      response_format: "mp3", // mp3 is most compatible
    });

    // convert the response to an array buffer (raw audio bytes)
    const buffer = Buffer.from(await response.arrayBuffer());

    // encode to base64 so we can send it as a string over websocket
    const base64Audio = buffer.toString("base64");

    return base64Audio;
  } catch (error) {
    console.error("error generating tts audio:", error);
    throw error;
  }
}

export { textToSpeech };

