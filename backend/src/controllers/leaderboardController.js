import { PrismaClient } from "@prisma/client";
import { clerkClient } from "@clerk/clerk-sdk-node";

const prisma = new PrismaClient();

async function getLeaderboard(req, res) {
  try {
    // Get top users by ELO
    const topUsers = await prisma.user.findMany({
      where: {
        username: {
          not: null,
        },
      },
      select: {
        clerkUserId: true,
        username: true,
        elo: true,
        createdAt: true,
      },
      orderBy: {
        elo: "desc",
      },
      take: 25, // Top 25 users
    });

    // Fetch completed interviews count for each user
    const leaderboard = await Promise.all(
      topUsers.map(async (user) => {
        const completedCount = await prisma.completedInterview.count({
          where: { clerkUserId: user.clerkUserId },
        });

        const avgScore = await prisma.completedInterview.aggregate({
          where: { clerkUserId: user.clerkUserId },
          _avg: {
            score: true,
          },
        });

        // Try to fetch avatar from Clerk
        let imageUrl = null;
        try {
          const clerkUser = await clerkClient.users.getUser(user.clerkUserId);
          imageUrl = clerkUser.imageUrl;
        } catch (clerkError) {
          console.error(
            `Error fetching Clerk user for ${user.username}:`,
            clerkError,
          );
        }

        return {
          username: user.username,
          elo: user.elo,
          imageUrl: imageUrl,
          totalInterviews: completedCount,
          averageScore: avgScore._avg.score
            ? Number(avgScore._avg.score.toFixed(2))
            : 0,
          memberSince: user.createdAt,
        };
      }),
    );

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
}

export { getLeaderboard };
