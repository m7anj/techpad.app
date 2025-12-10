import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// generates audio from text using elevenlabs tts api
// returns base64 encoded mp3 audio that can be sent over websocket
async function textToSpeech(text, voiceId = "JBFqnCBsd6RMkjVDRZzb") {
  try {
    // call elevenlabs tts api - returns a readable stream
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
    });

    // convert stream to buffer
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // encode to base64 so we can send it as a string over websocket
    const base64Audio = buffer.toString("base64");

    return base64Audio;
  } catch (error) {
    console.error("error generating tts audio:", error);
    throw error;
  }
}

export { textToSpeech };
