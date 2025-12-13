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

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = 4000;

import expressWs from "express-ws";

expressWs(app);

// Security and Middleware
app.use(helmet());
app.use(cors());

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

setupWebSocketRoutes(app);

// Root route
app.get("/", (req, res) => {
  res.send("API running with Express + Prisma!");
});

// Start server
app.listen(port, "0.0.0.0", () =>
  console.log(`Server running on port ${port}`),
);
