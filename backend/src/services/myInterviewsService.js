import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getCompletedInterviewsByUserId(userId) {
    const completedInterviews = await prisma.completedInterview.findMany({
        where: {
            userId,
        },
        select: {
            id: true,
            timeTaken: true,
            score: true,
            feedback: true,
            completedAt: true,
            messages: {
                select: {
                    id: true,
                    content: true,
                    sequence: true,
                    role: true,
                },
            },
        },
    });

    return completedInterviews;
}

export { getCompletedInterviewsByUserId };