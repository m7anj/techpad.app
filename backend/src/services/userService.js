import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// No longer need user lookup functions - use Clerk directly
// Keeping this file for potential future user-related queries

export { prisma };
