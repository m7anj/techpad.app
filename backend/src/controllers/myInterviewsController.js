import { getCompletedInterviewsByUserId as getCompletedInterviews, addCompletedInterview as addInterview } from '../services/myInterviewsService.js';
import { getUserByClerkId } from '../services/userService.js';

export const getCompletedInterviewsByUserId = async (req, res) => {
  try {
    const { userId: clerkUserId } = req.auth;

    if (!clerkUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get the user record from database using Clerk ID
    const user = await getUserByClerkId(clerkUserId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const interviews = await getCompletedInterviews(user.id);

    if (!interviews || interviews.length === 0) {
      return res.status(404).json({ message: 'There are no interviews conducted' });
    }

    res.status(200).json(interviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error!' });
  }
};

export const addCompletedInterview = async (clerkUserId, interviewId, questionAnswers, timeTaken, score, feedback) => {
  try {
    // Get the actual user database ID from clerk ID
    const user = await getUserByClerkId(clerkUserId);

    if (!user) {
      throw new Error('User not found');
    }

    const result = await addInterview(user.id, interviewId, questionAnswers, timeTaken, score, feedback);
    return result;
  } catch (error) {
    console.error('Error adding completed interview:', error);
    throw error;
  }
};
