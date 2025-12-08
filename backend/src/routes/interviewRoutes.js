import express from "express";
import {
  setupInterview,
  validateInterviewSession,
  invalidateInterviewSession,
} from "../services/interviewService.js";
import { nodeModuleNameResolver } from "typescript";
import { generateFollowups } from "../lib/followups.js";
import { closeInterview } from "../services/interviewService.js";

const activeSessions = new Map(); // Initialising a new map when the server starts running which has all the activeSessions in here.
const questionCache = new Map(); // cache generated questions by interview id to avoid excessive api calls

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
      clerkUserId = dbSession.userId;
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
      console.log("Questions: " + JSON.stringify(questions, null, 2));

      activeSessions.set(sessionId, {
        // Creating a hashmap entry in activeSessions{} for the session's data
        clerkUserId: clerkUserId, // Store the authenticated user ID
        questions: questions, // Questions we are going to ask
        currentQuestionIndex: 1, // q counter (every qeustion will be ++)
        followupQuestions: [],
        followupAnswers: [], // followups (dynamically going to be added to)
        questionAnswers: [], // userAnswers (when user responds we add to this)
      });

      ws.sessionId = sessionId; // set the webSocket's sessionId to a more accessible variable
      const session = activeSessions.get(sessionId); // load the current session's data into memory,
      //  we add to it from this point on. we don't directly change the hashmap's entry, we can save
      //  the data in a variable and then change it.

      // WebSocket: immediately send first question on connection
      console.log(`✅ Session created successfully. Sending first question.`);
      const firstQuestion = {
        type: "question",
        question: session.questions.questions[0].question,
        questionIndex: 1,
      };
      ws.send(JSON.stringify(firstQuestion));

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
            // Store the full answer with code and whiteboard
            session.questionAnswers.push({
              content: message.content,
              code: message.code,
              whiteboard: message.whiteboard,
            });

            // Generate followup for this question
            const followup = await generateFollowups(
              session.questions.questions[session.currentQuestionIndex - 1]
                .question,
              [
                {
                  content: message.content,
                  code: message.code,
                  whiteboard: message.whiteboard,
                },
              ],
              session.currentQuestionIndex,
            );

            session.followupQuestions.push(followup.followup);

            // Send followup with proper type for frontend
            const followupMessage = {
              type: "followup",
              followup: {
                question: followup.followup.followupQuestion,
                isThisTheEnd: followup.followup.isThisTheEnd,
                forWhatQuestion: followup.followup.forWhatQuestion,
              },
            };
            console.log("Sending followup:", followupMessage);
            ws.send(JSON.stringify(followupMessage));
          } else if (message.type == "followupAnswer") {
            // Store the full followup answer with code and whiteboard
            session.followupAnswers.push({
              content: message.content,
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
                ws.send(
                  JSON.stringify({
                    type: "question",
                    question:
                      session.questions.questions[
                        session.currentQuestionIndex - 1
                      ].question,
                    questionIndex: session.currentQuestionIndex,
                  }),
                );
              } else {
                ws.send(JSON.stringify({ type: "interviewComplete" }));
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
                ws.send(
                  JSON.stringify({
                    type: "question",
                    question:
                      session.questions.questions[
                        session.currentQuestionIndex - 1
                      ].question,
                    questionIndex: session.currentQuestionIndex,
                  }),
                );
              } else {
                ws.send(JSON.stringify({ type: "interviewComplete" }));
              }
            } else {
              session.followupQuestions.push(followup.followup);

              // Send followup with proper type for frontend
              const followupMessage = {
                type: "followup",
                followup: {
                  question: followup.followup.followupQuestion,
                  isThisTheEnd: followup.followup.isThisTheEnd,
                  forWhatQuestion: followup.followup.forWhatQuestion,
                },
              };
              console.log("Sending followup:", followupMessage);
              ws.send(JSON.stringify(followupMessage));
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
