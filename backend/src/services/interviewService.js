import { generateQuestions } from "../lib/questions.js";
import { getExplorePresetById } from "./exploreService.js";

async function setupInterview(id) {
    // get interview data (which has the prompt in there)
    const interview = await getExplorePresetById(id)

    // get the generated questions
    const questions = await generateQuestions(interview.prompt);

    return questions;
}

export {
    setupInterview
}