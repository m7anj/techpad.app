import express from "express";
import { requireAuth } from "@clerk/express";
import { createInterviewSessionHandler } from "../controllers/interviewController.js";

const router = express.Router();

// Create a new interview session (requires authentication)
router.post("/create", requireAuth(), createInterviewSessionHandler);

export default router;
