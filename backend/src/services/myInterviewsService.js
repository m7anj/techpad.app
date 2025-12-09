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
      messages: {
        select: {
          id: true,
          content: true,
          sequence: true,
          role: true,
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
    // Create messages array with proper structure
    const messages = [];

    if (questionAnswers && Array.isArray(questionAnswers)) {
      questionAnswers.forEach((qa, index) => {
        // Add question (if exists)
        if (qa.question) {
          messages.push({
            content: qa.question,
            sequence: index * 2,
            role: "assistant",
          });
        }

        // Add answer - support both old format (qa.answer) and new format (qa.content)
        const answerContent = qa.answer || qa.content || "";
        if (answerContent) {
          messages.push({
            content: answerContent,
            sequence: index * 2 + 1,
            role: "user",
          });
        }
      });
    }

    const completedInterview = await prisma.completedInterview.create({
      data: {
        clerkUserId,
        interviewId,
        timeTaken: timeTaken || 0,
        score,
        feedback,
        messages: {
          create: messages,
        },
      },
      include: {
        messages: true,
      },
    });

    console.log(`✅ Saved interview with ${messages.length} messages`);
    return completedInterview;
  } catch (error) {
    console.error("Error in addCompletedInterview:", error);
    throw error;
  }
}

export { getCompletedInterviewsByUserId, addCompletedInterview };
