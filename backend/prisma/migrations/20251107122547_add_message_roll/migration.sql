/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Interview` table. All the data in the column will be lost.
  - Added the required column `description` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expectedDuration` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prompt` to the `Interview` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_userId_fkey";

-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "createdAt",
DROP COLUMN "duration",
DROP COLUMN "feedback",
DROP COLUMN "score",
DROP COLUMN "userId",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "expectedDuration" INTEGER NOT NULL,
ADD COLUMN     "prompt" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "completedInterview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "feedback" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "completedInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "completedInterviewId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "completedInterview" ADD CONSTRAINT "completedInterview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completedInterview" ADD CONSTRAINT "completedInterview_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_completedInterviewId_fkey" FOREIGN KEY ("completedInterviewId") REFERENCES "completedInterview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
