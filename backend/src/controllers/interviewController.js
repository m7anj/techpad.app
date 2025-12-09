import {
  setupInterview,
  createInterviewSession,
} from "../services/interviewService.js";
import { getExplorePresetById } from "../services/exploreService.js";
import { requireAuth } from "@clerk/express";

// Handle a request to start an interview
async function getInterviewQuestionsHandler(req, res) {
  const { id } = req.params;
  try {
    const questions = await setupInterview(id);
    res.status(200).json(questions);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error });
  }
  return questions;
}

// Create a secure interview session
async function createInterviewSessionHandler(req, res) {
  try {
    const { interviewId } = req.body;
    const clerkUserId = req.auth.userId;

    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!interviewId) {
      return res.status(400).json({ error: "Interview ID is required" });
    }

    const session = await createInterviewSession(clerkUserId, interviewId);
    res.status(200).json({
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("Error creating interview session:", error);
    res.status(500).json({ error: "Failed to create interview session" });
  }
}

export { getInterviewQuestionsHandler, createInterviewSessionHandler };
