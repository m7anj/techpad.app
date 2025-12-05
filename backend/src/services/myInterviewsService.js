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
            completedAt: 'desc',
        },
    });

    return completedInterviews;
}

async function addCompletedInterview(userId, interviewId, questionAnswers, timeTaken, score, feedback) {
    const completedInterview = await prisma.completedInterview.create({
        data: {
            userId,
            interviewId,
            timeTaken,
            score,
            feedback,
            messages: {
                create: questionAnswers.map((qa, index) => [
                    {
                        content: qa.question,
                        sequence: index * 2,
                        role: 'assistant'
                    },
                    {
                        content: qa.answer,
                        sequence: index * 2 + 1,
                        role: 'user'
                    }
                ]).flat()
            }
        },
        include: {
            messages: true
        }
    });

    return completedInterview;
}

export { getCompletedInterviewsByUserId, addCompletedInterview };
