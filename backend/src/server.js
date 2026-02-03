import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";

import { PrismaClient } from "@prisma/client";

import exploreRoutes from "./routes/exploreRoutes.js";
import myInterviewsRoutes from "./routes/myInterviewsRoutes.js";
import pricingRoutes from "./routes/pricingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import setupWebSocketRoutes from "./routes/interviewRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import interviewSessionRoutes from "./routes/interviewSessionRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import proFeaturesRoutes from "./routes/proFeaturesRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 4000;

import expressWs from "express-ws";

expressWs(app);

// Trust proxy for rate limiting (needed when behind proxies like nginx, cloudflare, etc)
app.set("trust proxy", 1);

// Security and Middleware
app.use(helmet());

// CORS configuration - restrict to frontend URL in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://techpad-app.vercel.app',
        'https://techpad.app',
        'https://www.techpad.app',
        process.env.FRONTEND_URL?.replace(/\/$/, '')
      ].filter(Boolean)
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Webhook route BEFORE express.json() to get raw body
app.use("/webhooks", webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// API routes
app.use("/explore", exploreRoutes);
app.use("/myInterviews", myInterviewsRoutes);
app.use("/pricing", pricingRoutes);
app.use("/user", userRoutes);
app.use("/interview-session", interviewSessionRoutes);
app.use("/checkout", checkoutRoutes);
app.use("/pro", proFeaturesRoutes);
app.use("/leaderboard", leaderboardRoutes);

setupWebSocketRoutes(app);

// Root route
app.get("/", (req, res) => {
  res.send("API running with Express + Prisma!");
});

// Start server
app.listen(port, "0.0.0.0", () =>
  console.log(`Server running on port ${port}`),
);
