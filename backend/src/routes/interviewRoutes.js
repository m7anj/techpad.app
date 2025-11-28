import express from "express";
import { setupInterview } from "../services/interviewService.js";
import { nodeModuleNameResolver } from "typescript";
import { generateFollowups } from "../lib/followups.js";
import { closeInterview } from "../services/interviewService.js";

const activeSessions = new Map(); // Initialising a new map when the server starts running which has all the activeSessions in here.
const questionCache = new Map(); // cache generated questions by interview id to avoid excessive api calls

// websocket functionality
export default function setupWebSocketRoutes(app) {
  app.ws("/interview/:id", async (ws, req) => {
    let clerkUserId = null;

    // Try to get authenticated user ID from Clerk middleware
    if (req.auth && req.auth.userId) {
      clerkUserId = req.auth.userId;
      console.log(`🔗 WebSocket connected with auth: ${clerkUserId}`);
    } else {
      // For now, we'll accept connections without auth for testing
      // In production, you'd want proper WebSocket auth
      console.log("🔗 WebSocket connected - no auth found, using test user");
      clerkUserId = "test-user-id";
    }

    if (!clerkUserId) {
      console.log("❌ No user ID - closing connection");
      ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
      ws.close();
      return;
    }

    const sessionId = `user_${clerkUserId}_${Date.now()}`;
    console.log(
      `📝 Creating session: ${sessionId} for interview ${req.params.id}`,
    );

    try {
      // check cache first to avoid excessive api calls
      let questions;
      if (questionCache.has(req.params.id)) {
        console.log(`♻️ Using cached questions for interview ${req.params.id}`);
        questions = questionCache.get(req.params.id);
      } else {
        console.log(`🌐 Fetching new questions for interview ${req.params.id}`);
        questions = await setupInterview(req.params.id);
        questionCache.set(req.params.id, questions);
        // set cache expiry - delete after 30 minutes
        setTimeout(
          () => {
            questionCache.delete(req.params.id);
            console.log(
              `🗑️ Cleared cached questions for interview ${req.params.id}`,
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
        const message = JSON.parse(data);
        const session = activeSessions.get(sessionId);

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
              session.currentQuestionIndex <= session.questions.questions.length
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
              session.currentQuestionIndex <= session.questions.questions.length
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
      });

      // WebSocket: close Interview handling

      ws.on("close", function () {
        const completedSession = activeSessions.get(sessionId); // extract session and use as param for closeInterview
        console.log(
          "Session completed: " + JSON.stringify(completedSession, null, 2),
        ); // test gfdsdsfdsf
        closeInterview(req.params.id, completedSession, clerkUserId);
      });
    } catch (error) {
      console.log(`❌ Error setting up interview: ${error.message}`);
      ws.send(
        JSON.stringify({ type: "error", message: "Failed to setup interview" }),
      );
      ws.close();
      return;
    }
  });
}
