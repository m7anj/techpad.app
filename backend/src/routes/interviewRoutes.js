import {
  setupInterview,
  validateInterviewSession,
  invalidateInterviewSession,
} from "../services/interviewService.js";
import { generateFollowups } from "../lib/followups.js";
import { closeInterview } from "../services/interviewService.js";
import {
  isClarifyingQuestion,
  generateClarification,
} from "../lib/clarification.js";
import { textToSpeech } from "../lib/speechmatics.js";
import { transcribeAudio } from "../lib/transcribe.js";

const activeSessions = new Map(); // Initialising a new map when the server starts running which has all the activeSessions in here.
const questionCache = new Map(); // cache generated questions by interview id to avoid excessive api calls

// TTS audio cache: keyed by question text → base64 WAV audio
const ttsAudioCache = new Map();

// Helper: Send text immediately (with cached audio if available), generate audio in background otherwise
async function sendWithAudio(ws, message) {
  const textToSpeak = message.question || message.followup?.question;

  // If audio is already cached, include it inline with the message
  if (textToSpeak && ttsAudioCache.has(textToSpeak)) {
    message.audio = ttsAudioCache.get(textToSpeak);
    ws.send(JSON.stringify(message));
    return;
  }

  // Send text immediately so frontend can display it without waiting for TTS
  ws.send(JSON.stringify(message));

  if (!textToSpeak) return;

  // Generate TTS in background, send as separate message when ready
  try {
    const audioBuffer = await textToSpeech(textToSpeak);
    const audioBase64 = audioBuffer.toString('base64');
    ttsAudioCache.set(textToSpeak, audioBase64);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'audio', audio: audioBase64 }));
    }
  } catch (err) {
    console.error('TTS generation failed:', err.message);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'audioFailed' }));
    }
  }
}

// websocket functionality
export default function setupWebSocketRoutes(app) {
  app.ws("/interview/:sessionToken", async (ws, req) => {
    const { sessionToken } = req.params;
    let clerkUserId = null;
    let interviewId = null;
    let sessionId = null;

    try {
      console.log(
        `🔗 WebSocket connection attempt with token: ${sessionToken.substring(0, 8)}...`,
      );

      // Validate the session token
      const validation = await validateInterviewSession(sessionToken);

      if (!validation.valid) {
        console.log(`❌ Invalid session: ${validation.error}`);
        ws.send(
          JSON.stringify({
            type: "error",
            message: validation.error || "Invalid or expired session",
          }),
        );
        ws.close();
        return;
      }

      const { session: dbSession } = validation;
      clerkUserId = dbSession.clerkUserId;
      interviewId = dbSession.interviewId;

      console.log(`✅ Valid session for user: ${clerkUserId}`);
      console.log(`📝 Interview ID: ${interviewId}`);

      sessionId = `session_${sessionToken}`;
      console.log(`📝 Creating active session: ${sessionId}`);

      // check cache first to avoid excessive api calls
      let questions;
      if (questionCache.has(interviewId)) {
        console.log(`♻️ Using cached questions for interview ${interviewId}`);
        questions = questionCache.get(interviewId);
      } else {
        console.log(`🌐 Fetching new questions for interview ${interviewId}`);
        questions = await setupInterview(interviewId);
        questionCache.set(interviewId, questions);
        // set cache expiry - delete after 30 minutes
        setTimeout(
          () => {
            questionCache.delete(interviewId);
            console.log(
              `🗑️ Cleared cached questions for interview ${interviewId}`,
            );
          },
          30 * 60 * 1000,
        );
      }
      console.log("✅ Questions ready");

      // Pre-generate TTS for Q1 (await it so first question always has audio)
      const allQuestionTexts = questions.questions.map(q => q.question);
      try {
        const q1Audio = await textToSpeech(allQuestionTexts[0]);
        ttsAudioCache.set(allQuestionTexts[0], q1Audio.toString('base64'));
        console.log(`🔊 Pre-generated TTS for Q1`);
      } catch (e) {
        console.error(`TTS pre-gen failed for Q1: ${e.message}`);
      }

      // Pre-generate TTS for remaining questions in the background (non-blocking)
      Promise.allSettled(
        allQuestionTexts.slice(1).map(async (text) => {
          if (ttsAudioCache.has(text)) return;
          try {
            const audio = await textToSpeech(text);
            ttsAudioCache.set(text, audio.toString('base64'));
            console.log(`🔊 Pre-generated TTS for: "${text.substring(0, 50)}..."`);
          } catch (e) {
            console.error(`TTS pre-gen failed: ${e.message}`);
          }
        })
      );

      activeSessions.set(sessionId, {
        // Creating a hashmap entry in activeSessions{} for the session's data
        clerkUserId: clerkUserId, // Store the authenticated user ID
        questions: questions, // Questions we are going to ask
        currentQuestionIndex: 1, // q counter (every qeustion will be ++)
        currentQuestionText: questions.questions[0].question, // Track the current question being asked
        followupQuestions: [],
        followupAnswers: [], // followups (dynamically going to be added to)
        questionAnswers: [], // userAnswers (when user responds we add to this)
        startTime: Date.now(), // Track when interview started
      });

      ws.sessionId = sessionId; // set the webSocket's sessionId to a more accessible variable
      const session = activeSessions.get(sessionId); // load the current session's data into memory,
      //  we add to it from this point on. we don't directly change the hashmap's entry, we can save
      //  the data in a variable and then change it.

      // Send first question text immediately, then stream TTS audio
      console.log(`✅ Session created successfully. Sending first question.`);

      const questionText = session.questions.questions[0].question;

      await sendWithAudio(ws, {
        type: "question",
        question: questionText,
        questionIndex: 1,
      });

      // WebSocket: message handling

      ws.on("message", async function (data) {
        try {
          const message = JSON.parse(data);
          const session = activeSessions.get(sessionId);

          if (!session) {
            console.error("Session not found:", sessionId);
            ws.send(
              JSON.stringify({ type: "error", message: "Session expired" }),
            );
            return;
          }

          console.log("Received WebSocket message:", message);

          if (message.type == "ping") {
            // Respond to heartbeat
            ws.send(JSON.stringify({ type: "pong" }));
            return;
          } else if (message.type == "questionAnswer") {
            // Transcribe audio if provided
            let answerContent = message.content;
            if (message.audio) {
              try {
                console.log("🎙️ Transcribing user audio...");
                const audioBuffer = Buffer.from(message.audio, 'base64');
                answerContent = await transcribeAudio(audioBuffer, message.audioMimeType);
                console.log("✅ Transcribed answer:", answerContent.substring(0, 100));
              } catch (error) {
                console.error("❌ Transcription failed:", error.message);
                ws.send(JSON.stringify({ type: "error", message: "Failed to transcribe audio" }));
                return;
              }
            }

            // Check if this is a clarifying question
            if (isClarifyingQuestion(answerContent)) {
              console.log(
                "🤔 Detected clarifying question, generating clarification...",
              );
              const clarificationText = await generateClarification(
                session.currentQuestionText,
                answerContent,
              );

              // Send clarification as a followup but don't move forward
              await sendWithAudio(ws, {
                type: "followup",
                followup: {
                  question: clarificationText,
                  isThisTheEnd: false,
                  forWhatQuestion: session.currentQuestionIndex,
                },
              });

              return; // Don't process as actual answer
            }

            // Store the full answer with code and whiteboard
            const currentQuestion =
              session.questions.questions[session.currentQuestionIndex - 1]
                ?.question || "";
            session.questionAnswers.push({
              question: currentQuestion,
              answer: answerContent,
              content: answerContent,
              code: message.code,
              whiteboard: message.whiteboard,
            });

            // Generate followup for this question
            const followup = await generateFollowups(
              session.questions.questions[session.currentQuestionIndex - 1]
                .question,
              [
                {
                  content: answerContent,
                  code: message.code,
                  whiteboard: message.whiteboard,
                },
              ],
              session.currentQuestionIndex,
            );

            session.followupQuestions.push(followup.followup);
            session.currentQuestionText = followup.followup.followupQuestion; // Update current question

            // Send followup with pre-generated TTS audio
            const followupMessage = {
              type: "followup",
              followup: {
                question: followup.followup.followupQuestion,
                isThisTheEnd: followup.followup.isThisTheEnd,
                forWhatQuestion: followup.followup.forWhatQuestion,
              },
            };
            console.log("Sending followup:", followupMessage);
            await sendWithAudio(ws, followupMessage);
          } else if (message.type == "followupAnswer") {
            // Transcribe audio if provided
            let followupAnswerContent = message.content;
            if (message.audio) {
              try {
                console.log("🎙️ Transcribing followup audio...");
                const audioBuffer = Buffer.from(message.audio, 'base64');
                followupAnswerContent = await transcribeAudio(audioBuffer, message.audioMimeType);
                console.log("✅ Transcribed followup:", followupAnswerContent.substring(0, 100));
              } catch (error) {
                console.error("❌ Transcription failed:", error.message);
                ws.send(JSON.stringify({ type: "error", message: "Failed to transcribe audio" }));
                return;
              }
            }

            // Check if this is a clarifying question
            if (isClarifyingQuestion(followupAnswerContent)) {
              console.log(
                "🤔 Detected clarifying question, generating clarification...",
              );
              const clarificationText = await generateClarification(
                session.currentQuestionText,
                followupAnswerContent,
              );

              // Send clarification without moving forward
              await sendWithAudio(ws, {
                type: "followup",
                followup: {
                  question: clarificationText,
                  isThisTheEnd: false,
                  forWhatQuestion: session.currentQuestionIndex,
                },
              });

              return; // Don't process as actual answer
            }

            // Store the full followup answer with code and whiteboard
            session.followupAnswers.push({
              content: followupAnswerContent,
              code: message.code,
              whiteboard: message.whiteboard,
            });

            // Count followups for current question
            const currentQuestionFollowups = session.followupQuestions.filter(
              (f) => f.forWhatQuestion === session.currentQuestionIndex,
            );
            const followupCount = currentQuestionFollowups.length;

            // Force move to next question after 2 followups
            if (followupCount >= 2) {
              session.currentQuestionIndex++;
              session.followupAnswers = []; // Reset followup answers for new question
              if (
                session.currentQuestionIndex <=
                session.questions.questions.length
              ) {
                const nextQuestionText =
                  session.questions.questions[session.currentQuestionIndex - 1]
                    .question;
                session.currentQuestionText = nextQuestionText; // Update current question

                await sendWithAudio(ws, {
                  type: "question",
                  question: nextQuestionText,
                  questionIndex: session.currentQuestionIndex,
                  resetEditor: true, // Reset code and whiteboard for new main question
                });
              } else {
                // Interview is complete - save it and send result
                const result = await closeInterview(
                  interviewId,
                  session,
                  clerkUserId,
                );
                const resultId = result?.id || null;
                ws.send(
                  JSON.stringify({
                    type: "interviewComplete",
                    resultId: resultId,
                  }),
                );
              }
              return;
            }

            // Generate next followup based on all answers for this question
            const allResponses = [
              ...session.questionAnswers.slice(-1),
              ...session.followupAnswers,
            ];
            const followup = await generateFollowups(
              session.questions.questions[session.currentQuestionIndex - 1]
                .question,
              allResponses,
              session.currentQuestionIndex,
            );

            if (followup.followup.isThisTheEnd) {
              // Move to next question
              session.currentQuestionIndex++;
              session.followupAnswers = []; // Reset followup answers for new question
              if (
                session.currentQuestionIndex <=
                session.questions.questions.length
              ) {
                const nextQuestionText =
                  session.questions.questions[session.currentQuestionIndex - 1]
                    .question;
                session.currentQuestionText = nextQuestionText; // Update current question

                await sendWithAudio(ws, {
                  type: "question",
                  question: nextQuestionText,
                  questionIndex: session.currentQuestionIndex,
                  resetEditor: true, // Reset code and whiteboard for new main question
                });
              } else {
                // Interview is complete - save it and send result
                const result = await closeInterview(
                  interviewId,
                  session,
                  clerkUserId,
                );
                const resultId = result?.id || null;
                ws.send(
                  JSON.stringify({
                    type: "interviewComplete",
                    resultId: resultId,
                  }),
                );
              }
            } else {
              session.followupQuestions.push(followup.followup);
              session.currentQuestionText = followup.followup.followupQuestion; // Update current question

              // Send followup with pre-generated TTS audio
              const followupMessage = {
                type: "followup",
                followup: {
                  question: followup.followup.followupQuestion,
                  isThisTheEnd: followup.followup.isThisTheEnd,
                  forWhatQuestion: followup.followup.forWhatQuestion,
                },
              };
              console.log("Sending followup:", followupMessage);
              await sendWithAudio(ws, followupMessage);
            }
          }
          // Session processing complete
        } catch (error) {
          console.error("Error processing message:", error);
          console.error("Stack trace:", error.stack);
          try {
            if (ws.readyState === ws.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Error processing your response. Please try again.",
                }),
              );
            }
          } catch (e) {
            console.error("Error sending error response:", e);
          }
        }
      });

      // WebSocket: close Interview handling

      ws.on("close", async function () {
        try {
          const completedSession = activeSessions.get(sessionId);
          if (completedSession) {
            console.log(
              `🔌 Session ${sessionId} disconnected - saving data...`,
            );
            await closeInterview(interviewId, completedSession, clerkUserId);
            await invalidateInterviewSession(sessionToken);
            activeSessions.delete(sessionId);
            console.log(`✅ Session ${sessionId} saved and cleaned up`);
          } else {
            console.log(`⚠️ Session ${sessionId} not found on close`);
          }
        } catch (error) {
          console.error(`❌ Error closing session ${sessionId}:`, error);
        }
      });

      // WebSocket: error handling
      ws.on("error", function (error) {
        console.error(`❌ WebSocket error for session ${sessionId}:`, error);
        // Don't crash the server on WebSocket errors
        try {
          if (ws.readyState === ws.OPEN) {
            ws.send(
              JSON.stringify({ type: "error", message: "Connection error" }),
            );
          }
        } catch (e) {
          console.error("Error sending error message:", e);
        }
      });
    } catch (error) {
      console.error(`❌ Error setting up interview: ${error.message}`);
      console.error("Stack trace:", error.stack);
      try {
        if (ws.readyState === ws.OPEN) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Failed to setup interview",
            }),
          );
        }
        ws.close();
      } catch (e) {
        console.error("Error closing WebSocket:", e);
      }
    }
  });
}
