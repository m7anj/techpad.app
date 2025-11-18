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

async function getUserByClerkId(clerkId) {
  const user = await prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      completedInterviews: {
        include: {
          interview: true
        }
      }
    },
  });
  return user;
}

async function createUser(userData) {
  const user = await prisma.user.create({
    data: userData,
    include: {
      completedInterviews: {
        include: {
          interview: true
        }
      }
    },
  });
  return user;
}

export {
  getUserById,
  getUserByClerkId,
  createUser,
};