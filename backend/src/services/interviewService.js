import { generateQuestions } from "../lib/questions.js";
import { getExplorePresetById } from "./exploreService.js";
import { addCompletedInterview } from "../controllers/myInterviewsController.js";
import { generateInterviewScore } from "../lib/score.js";


async function setupInterview(id) {
    // get interview data (which has the prompt in there)
    const interview = await getExplorePresetById(id)

    // get the generated questions
    const questions = await generateQuestions(interview.prompt);

    return questions;
}

// this is the handler of closing the interview and adding it's data to the database
async function closeInterview(interviewId, session) {
    const feedback = await generateInterviewScore(session.questionAnswers, session.questions.type);
    const overallScore = feedback.overallScore;

    const result = await addCompletedInterview(
        session.userId,
        interviewId,
        session.questionAnswers,
        session.timeTaken,
        overallScore,
        feedback
    );

    return result;
}

export {
    setupInterview,
    closeInterview
}