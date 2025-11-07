import express from 'express';
import path from 'path';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// rate limter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: `Too many requests from this IP, please try again after 15 minutes`,
    headers: true,
    keyGenerator: (req) => req.ip,
});
app.use(limiter);


// Routes

app.get("/", (req, res) => {
    res.json({
        message: "Hello world from server.js! (path: /)",
        timestamp: new Date().toISOString()
    })
});

app.post("/interview", (req, res) => {
    res.json({
        message: "Interview! (path: /interview)",
        timestamp: new Date().toISOString()
    })
});










// Health check
app.get('/health', (req, res) => {    
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString() });                      
});

// Listen to port
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});