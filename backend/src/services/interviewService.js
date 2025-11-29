import { generateQuestions } from "../lib/questions.js";
import { getExplorePresetById } from "./exploreService.js";
import { addCompletedInterview } from "../controllers/myInterviewsController.js";
import { generateInterviewScore } from "../lib/score.js";

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

// this is the handler of closing the interview and adding it's data to the database
async function closeInterview(interviewId, session, clerkUserId) {
  try {
    const feedback = await generateInterviewScore(
      session.questionAnswers,
      "Technical Interview",
    );
    const overallScore = feedback.overallScore;

    const result = await addCompletedInterview(
      clerkUserId, // now using actual authenticated user id
      interviewId,
      session.questionAnswers,
      null, // timeTaken - not tracked currently
      overallScore,
      feedback,
    );

    if (result) {
      console.log("✅ interview saved to database");
    } else {
      console.log("⚠️ interview not saved - user may not exist in db yet");
    }

    console.log("interview completed and saved to database:", result);
    return result;
  } catch (error) {
    console.error("error closing interview:", error);
    // don't crash the server - just log the error
    return null;
  }
}

export { setupInterview, closeInterview };
