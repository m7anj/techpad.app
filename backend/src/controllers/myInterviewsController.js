import {
  getCompletedInterviewsByUserId as getCompletedInterviews,
  addCompletedInterview as addInterview,
  getCompletedInterviewById as getCompletedInterview,
} from "../services/myInterviewsService.js";

export const getCompletedInterviewsByUserId = async (req, res) => {
  try {
    const { userId: clerkUserId } = req.auth;

    if (!clerkUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Directly query by clerkUserId - no user lookup needed
    const interviews = await getCompletedInterviews(clerkUserId);

    if (!interviews || interviews.length === 0) {
      return res.status(200).json({ interviews: [] });
    }

    // Format the response for frontend
    const formattedInterviews = interviews.map((interview) => ({
      _id: interview.id,
      userId: clerkUserId,
      interviewType: interview.interview.type,
      completedAt: interview.completedAt,
      duration: interview.timeTaken,
      score: interview.score,
      feedback: interview.feedback,
    }));

    res.status(200).json({ interviews: formattedInterviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error!" });
  }
};

export const getCompletedInterviewByIdHandler = async (req, res) => {
  try {
    const { userId: clerkUserId } = req.auth;
    const { id } = req.params;

    if (!clerkUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const interview = await getCompletedInterview(id, clerkUserId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.status(200).json(interview);
  } catch (error) {
    console.error("Error fetching completed interview:", error);
    res.status(500).json({ error: "Error fetching interview" });
  }
};

export const addCompletedInterview = async (
  clerkUserId,
  interviewId,
  questionAnswers,
  timeTaken,
  score,
  feedback,
) => {
  try {
    // Directly use clerkUserId - no user lookup needed
    const result = await addInterview(
      clerkUserId,
      interviewId,
      questionAnswers,
      timeTaken,
      score,
      feedback,
    );
    return result;
  } catch (error) {
    console.error("error adding completed interview:", error);
    // don't throw - return null to prevent crash
    return null;
  }
};
