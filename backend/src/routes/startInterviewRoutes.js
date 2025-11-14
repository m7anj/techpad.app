import express from 'express';
import { startInterview } from '../services/startInterviewService.js';

const activeSessions = new Map();

export default function setupWebSocketRoutes(app) {
    app.ws('/interview/:id', async (ws, req) => {

        console.log('Interview started');
        const questions = await startInterview(req.params.id);

        const sessionId = `user_${Date.now()}`;

        activeSessions.set(sessionId, {
            questions: questions,
            currentQuestionIndex: 0,
            followups: [],
            userAnswers: []
        })

        ws.sessionId = sessionId;
        
        ws.on('message', function(msg){
            
            const session = activeSessions.get(ws.sessionId);
            console.log("Current Session: ", session);

            ws.send(msg);
        });

        ws.on('close', function(){
            console.log('Interview closed');
        });
    });
}