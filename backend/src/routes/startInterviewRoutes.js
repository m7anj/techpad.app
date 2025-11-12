import express from 'express';
import { startInterview } from '../services/startInterviewService.js';

export default function setupWebSocketRoutes(app) {
    app.ws('/interview/:id', async (ws, req) => {

        console.log('Interview started');

        const questions = await startInterview(req.params.id);

        ws.on('message', function(msg){ 
            ws.send(msg);
        });

        ws.on('close', function(){
            console.log('Interview closed');
        });
    });
}