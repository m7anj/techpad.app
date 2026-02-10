import { generateQuestions } from "../lib/questions.js";
import { getExplorePresetById } from "./exploreService.js";
import { addCompletedInterview } from "../controllers/myInterviewsController.js";
import { generateInterviewScore } from "../lib/score.js";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function setupInterview(id) {
  // get interview data (which has the prompt in there)
  const interview = await getExplorePresetById(id);

  // get the generated questions
  const questions = await generateQuestions(
    interview.prompt,
    interview.difficulty,
    interview.tags,
  );

  return questions;
}

// Create a secure interview session
async function createInterviewSession(clerkUserId, interviewId) {
  try {
    // Generate a secure random token
    const sessionToken = crypto.randomUUID();

    // Session expires in 3 hours
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const session = await prisma.interviewSession.create({
      data: {
        clerkUserId,
        interviewId,
        sessionToken,
        expiresAt,
        isActive: true,
      },
    });

    return session;
  } catch (error) {
    console.error("Error creating interview session:", error);
    throw error;
  }
}

// Validate an interview session token
async function validateInterviewSession(sessionToken) {
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { sessionToken },
    });

    if (!session) {
      return { valid: false, error: "Session not found" };
    }

    if (!session.isActive) {
      return { valid: false, error: "Session is no longer active" };
    }

    if (new Date() > session.expiresAt) {
      // Mark as inactive
      await prisma.interviewSession.update({
        where: { id: session.id },
        data: { isActive: false },
      });
      return { valid: false, error: "Session has expired" };
    }

    return { valid: true, session };
  } catch (error) {
    console.error("Error validating session:", error);
    return { valid: false, error: "Validation failed" };
  }
}

// Invalidate a session after interview completion
async function invalidateInterviewSession(sessionToken) {
  try {
    await prisma.interviewSession.update({
      where: { sessionToken },
      data: { isActive: false },
    });
  } catch (error) {
    console.error("Error invalidating session:", error);
  }
}

// this is the handler of closing the interview and adding it's data to the database
async function closeInterview(interviewId, session, clerkUserId) {
  try {
    // Calculate time taken in seconds
    const timeTaken = session.startTime
      ? Math.floor((Date.now() - session.startTime) / 1000)
      : 0;

    // Get expected duration from interview preset
    const interview = await getExplorePresetById(interviewId);
    const expectedDuration = interview?.expectedDuration || 0;

    // Fetch user's current ELO for scoring calibration
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { elo: true },
    });
    const currentElo = user?.elo ?? 200;

    const feedback = await generateInterviewScore(
      session.questionAnswers,
      "Technical Interview",
      timeTaken,
      expectedDuration,
      currentElo,
    );
    const overallScore = feedback.overallScore;
    const eloChange = typeof feedback.eloChange === "number"
      ? Math.max(-30, Math.min(30, Math.round(feedback.eloChange)))
      : 0;

    console.log(`📊 Interview Summary:`);
    console.log(`   - User: ${clerkUserId}`);
    console.log(`   - Interview ID: ${interviewId}`);
    console.log(`   - Questions Answered: ${session.questionAnswers.length}`);
    console.log(
      `   - Time Taken: ${timeTaken}s (${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s)`,
    );
    console.log(`   - Score: ${overallScore}%`);
    console.log(`   - ELO Change: ${eloChange >= 0 ? "+" : ""}${eloChange} (${currentElo} → ${currentElo + eloChange})`);

    const result = await addCompletedInterview(
      clerkUserId,
      interviewId,
      session.questionAnswers,
      timeTaken,
      overallScore,
      feedback,
      eloChange,
    );

    if (result) {
      console.log("✅ Interview saved to database successfully");
      console.log(`   - Database ID: ${result.id}`);
    } else {
      console.log("⚠️ Interview not saved - user may not exist in db yet");
    }

    return result;
  } catch (error) {
    console.error("error closing interview:", error);
    // don't crash the server - just log the error
    return null;
  }
}

export {
  setupInterview,
  closeInterview,
  createInterviewSession,
  validateInterviewSession,
  invalidateInterviewSession,
};
