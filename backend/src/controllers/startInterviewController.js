import { startInterview } from "../services/startInterviewService.js";
import { getExplorePresetById } from "../services/exploreService.js"

// Handle a request to start an interview

async function startInterviewHandler(req, res) {
    const { id } = req.params
    try {
        const questions = await startInterview(id)
        res.status(200).json(questions)
    } catch (error) {
        console.error("Error:", error)
        res.status(500).json({ message: error })
    }
    return questions;
}

export { startInterviewHandler };
