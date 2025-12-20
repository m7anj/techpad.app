import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getCompletedInterviewsByUserId(clerkUserId) {
  const completedInterviews = await prisma.completedInterview.findMany({
    where: {
      clerkUserId,
    },
    select: {
      id: true,
      timeTaken: true,
      score: true,
      feedback: true,
      completedAt: true,
      interview: {
        select: {
          id: true,
          type: true,
          topic: true,
          description: true,
          difficulty: true,
          tags: true,
        },
      },
    },
    orderBy: {
      completedAt: "desc",
    },
  });

  return completedInterviews;
}

async function addCompletedInterview(
  clerkUserId,
  interviewId,
  questionAnswers,
  timeTaken,
  score,
  feedback,
) {
  try {
    const completedInterview = await prisma.completedInterview.create({
      data: {
        clerkUserId,
        interviewId,
        timeTaken: timeTaken || 0,
        score,
        feedback,
      },
    });

    console.log(`✅ Saved completed interview`);
    return completedInterview;
  } catch (error) {
    console.error("Error in addCompletedInterview:", error);
    throw error;
  }
}

export { getCompletedInterviewsByUserId, addCompletedInterview };
