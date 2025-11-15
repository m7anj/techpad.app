import express from 'express';
import { setupInterview } from '../services/interviewService.js';
import { nodeModuleNameResolver } from 'typescript';
import { generateFollowups } from '../lib/followups.js'

const activeSessions = new Map(); // Initialising a new map when the server starts running which has all the activeSessions in here.

export default function setupWebSocketRoutes(app) {
    app.ws('/interview/:id', async (ws, req) => {

        const sessionId = `user_${Date.now()}`;
         // Creating a unique sessionId based on the userId and the timeCreated

        const questions = await setupInterview(req.params.id);

        console.log("Questions: " + JSON.stringify(questions, null, 2));   // before anyhting we recieve qeustion data

        activeSessions.set(sessionId, { // Creating a hashmap entry in activeSessions{} for the session's data
            questions: questions,   // Questions we are going to ask
            currentQuestionIndex: 1,    // q counter (every qeustion will be ++)
            followupQuestions: [],    
            followupAnswers: [],  // followups (dynamically going to be added to)
            questionAnswers: [] // userAnswers (when user responds we add to this)
        })

        ws.sessionId = sessionId; // set the webSocket's sessionId to a more accessible variable
        
        const session = activeSessions.get(sessionId);   // load the current session's data into memory, we add to it from this point on. we don't directly change the hashmap's entry, we can save power by doing this at the end.

        ws.send(JSON.stringify(questions, null, 2));

        ws.on('message', async function(data) {
            const message = JSON.parse(data);
            const session = activeSessions.get(sessionId);

            if (message.type == "questionAnswer") {
                session.questionAnswers.push(message.content);

                // Generate followup for this question
                const followup = await generateFollowups(
                    session.questions[session.currentQuestionIndex - 1],
                    [message.content]
                );

                session.followupQuestions.push(followup.followup);
                ws.send(JSON.stringify(followup));
            }

            else if (message.type == "followupAnswer") {
                session.followupAnswers.push(message.content);

                // Generate next followup based on all answers for this question
                const allResponses = [...session.questionAnswers.slice(-1), ...session.followupAnswers];
                const followup = await generateFollowups(
                    session.questions[session.currentQuestionIndex - 1],
                    allResponses
                );

                if (followup.followup.isThisTheEnd) {
                    // Move to next question
                    session.currentQuestionIndex++;
                    if (session.currentQuestionIndex <= session.questions.length) {
                        ws.send(JSON.stringify({type: "nextQuestion", questionIndex: session.currentQuestionIndex}));
                    } else {
                        ws.send(JSON.stringify({type: "interviewComplete"}));
                    }
                } else {
                    session.followupQuestions.push(followup.followup);
                    ws.send(JSON.stringify(followup));
                }
            }
            console.log("Message: " + JSON.stringify(message, null, 2));
            console.log("Session: " + JSON.stringify(session, null, 2));
            
        });





        ws.on('close', function(){
            console.log('Interview closed');
        });
    });
}