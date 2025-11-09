import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      email: true,
      completedInterviews: {
        select: {
          score: true,
          interview: {
            select: {
              description: true,
              topic: true,
            }
          }
        }
      }
    },
  });
  return user;
}

export {
  getUserById,
};