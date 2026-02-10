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
      eloChange: true,
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
  eloChange,
) {
  try {
    const completedInterview = await prisma.completedInterview.create({
      data: {
        clerkUserId,
        interviewId,
        timeTaken: timeTaken || 0,
        score,
        feedback,
        eloChange: eloChange ?? null,
      },
    });

    // Decrement interviews allowed (floor at 0)
    await prisma.user.update({
      where: { clerkUserId },
      data: {
        numberOfInterviewsAllowed: {
          decrement: 1,
        },
      },
    });

    // Ensure it doesn't go negative
    await prisma.user.updateMany({
      where: {
        clerkUserId,
        numberOfInterviewsAllowed: { lt: 0 },
      },
      data: {
        numberOfInterviewsAllowed: 0,
      },
    });

    // Update user ELO
    if (typeof eloChange === "number" && eloChange !== 0) {
      await prisma.user.update({
        where: { clerkUserId },
        data: {
          elo: {
            increment: eloChange,
          },
        },
      });

      // Floor ELO at 0
      await prisma.user.updateMany({
        where: {
          clerkUserId,
          elo: { lt: 0 },
        },
        data: {
          elo: 0,
        },
      });
    }

    console.log(`✅ Saved completed interview, decremented interviews allowed, ELO change: ${eloChange ?? 0}`);
    return completedInterview;
  } catch (error) {
    console.error("Error in addCompletedInterview:", error);
    throw error;
  }
}

async function getCompletedInterviewById(id, clerkUserId) {
  const completedInterview = await prisma.completedInterview.findUnique({
    where: { id },
    select: {
      id: true,
      interviewId: true,
      timeTaken: true,
      score: true,
      feedback: true,
      eloChange: true,
      completedAt: true,
      clerkUserId: true,
      interview: {
        select: {
          type: true,
          topic: true,
          difficulty: true,
        },
      },
    },
  });

  if (!completedInterview || completedInterview.clerkUserId !== clerkUserId) {
    return null;
  }

  // Remove clerkUserId from response
  const { clerkUserId: _, ...result } = completedInterview;
  return result;
}

export { getCompletedInterviewsByUserId, addCompletedInterview, getCompletedInterviewById };
