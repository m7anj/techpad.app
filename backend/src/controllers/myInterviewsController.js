import { getCompletedInterviewsByUserId as getCompletedInterviews, addCompletedInterview as addInterview } from '../services/myInterviewsService.js';

export const getCompletedInterviewsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const interviews = await getCompletedInterviews(userId);

    if (!interviews || interviews.length === 0) {
      return res.status(404).json({ message: 'There are no interviews conducted' });
    }

    res.status(200).json(interviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error!' });
  }
};

export const addCompletedInterview = async (userId, interviewId, questionAnswers, timeTaken, score, feedback) => {
  try {
    const result = await addInterview(userId, interviewId, questionAnswers, timeTaken, score, feedback);
    return result;
  } catch (error) {
    console.error('Error adding completed interview:', error);
    throw error;
  }
};
