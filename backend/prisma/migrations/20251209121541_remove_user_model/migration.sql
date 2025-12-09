/*
  Warnings:

  - You are about to drop the column `userId` on the `completedInterview` table. All the data in the column will be lost.
  - The `feedback` column on the `completedInterview` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `clerkUserId` to the `completedInterview` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "completedInterview" DROP CONSTRAINT "completedInterview_userId_fkey";

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'Medium',
ADD COLUMN     "premium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "completedInterview" DROP COLUMN "userId",
ADD COLUMN     "clerkUserId" TEXT NOT NULL,
DROP COLUMN "feedback",
ADD COLUMN     "feedback" JSONB;

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSession_sessionToken_key" ON "InterviewSession"("sessionToken");

-- CreateIndex
CREATE INDEX "InterviewSession_clerkUserId_idx" ON "InterviewSession"("clerkUserId");

-- CreateIndex
CREATE INDEX "completedInterview_clerkUserId_idx" ON "completedInterview"("clerkUserId");
