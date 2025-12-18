import { setupInterview, createInterviewSession } from "../services/interviewService.js";
import { getExplorePresetById } from "../services/exploreService.js";
import { canAccessPremium } from "../middleware/auth.js";



// HANDLER TO START INTERVIEW SESSION
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



// HANDLER TO CREATE AN INTERVIEW SESSION
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

    // Check if interview is premium and if user has access
    const interview = await getExplorePresetById(interviewId);

    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    if (interview.premium && !canAccessPremium(req)) {
      return res.status(403).json({
        error: "Premium subscription required",
        message: "This interview requires a premium subscription",
      });
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
