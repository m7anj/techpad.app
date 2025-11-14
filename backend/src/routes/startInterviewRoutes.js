import express from 'express';
import { startInterview } from '../services/startInterviewService.js';

const activeSessions = new Map();

export default function setupWebSocketRoutes(app) {
    app.ws('/interview/:id', async (ws, req) => {

        const sessionId = `user_${Date.now()}`; // Creating a unique sessionId based on the userId and the timeCreated

        const questions = await startInterview(req.params.id);
        console.log("Questions: " + JSON.stringify(questions, null, 2));   // before anyhting we recieve qeustion data

        activeSessions.set(sessionId, { // Creating a hashmap entry in activeSessions{} for the session's data
            questions: questions,   // Questions we are going to ask
            currentQuestionIndex: 0,    // q counter (every qeustion will be ++)
            followups: [],  // followups (dynamically going to be added to)
            userAnswers: [] // userAnswers (when user responds we add to this)
        })

        ws.sessionId = sessionId; 
        
        const session = activeSessions.get( sessionId);   // we make a variable which holds the session for this, we essentially do a O(1) look up of the activeSessions to find shit about it  

        ws.send(session.questions[0]); // we send question in web socket

        ws.on('close', function(){
            console.log('Interview closed');
        });
    });
}