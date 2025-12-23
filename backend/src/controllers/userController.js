// userdata comes from clerk directly via req.auth
import { clerkClient } from "@clerk/express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getUserByIdHandler(req, res) {
  // handle both old and new clerk api versions
  const auth = typeof req.auth === "function" ? req.auth() : req.auth;
  const { userId: clerkUserId } = auth;

  if (!clerkUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // fetch full user data from clerk to get metadata
    const clerkUser = await clerkClient.users.getUser(clerkUserId);

    // fetch user from database to get subscription details
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        numberOfInterviewsAllowed: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    // Determine plan based on subscription status from database
    const isPro = dbUser?.subscriptionStatus === "active";
    const plan = isPro ? "pro_monthly" : "free";
    const role = isPro ? "pro" : "free";

    // return user info - ALL subscription data comes from database
    const user = {
      clerkId: clerkUserId,
      email: clerkUser.emailAddresses?.[0]?.emailAddress,
      username: clerkUser.username,
      imageUrl: clerkUser.imageUrl,
      role: role,
      subscription: {
        plan: plan,
        status: dbUser?.subscriptionStatus || "inactive",
        stripeCustomerId: dbUser?.stripeCustomerId,
        subscriptionId: dbUser?.stripeSubscriptionId,
        interviewsAllowed: dbUser?.numberOfInterviewsAllowed ?? 3,
        subscriptionEndsAt: dbUser?.subscriptionEndsAt,
      },
    };

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserByIdHandler:", error);
    res.status(500).json({ message: "Error" });
  }
}

// for public use
async function getUserByUsernameHandler(req, res) {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    // Fetch user from database by username
    const dbUser = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        clerkUserId: true,
        username: true,
        email: true,
        elo: true,
        numberOfInterviewsAllowed: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const completedInterviews = await prisma.completedInterview.findMany({
      where: { clerkUserId: dbUser.clerkUserId },
      select: {
        id: true,
        score: true,
        timeTaken: true,
        completedAt: true,
        interview: {
          select: {
            type: true,
            topic: true,
            difficulty: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Fetch profile picture from Clerk
    let imageUrl = null;
    try {
      const clerkUser = await clerkClient.users.getUser(dbUser.clerkUserId);
      imageUrl = clerkUser.imageUrl;
    } catch (clerkError) {
      console.error("Error fetching Clerk user data:", clerkError);
    }

    // Build user profile response
    const userProfile = {
      username: dbUser.username,
      email: dbUser.email,
      imageUrl: imageUrl,
      elo: dbUser.elo,
      subscriptionStatus: dbUser.subscriptionStatus,
      memberSince: dbUser.createdAt,
      stats: {
        totalInterviews: completedInterviews.length,
        averageScore:
          completedInterviews.length > 0
            ? (
                completedInterviews.reduce(
                  (sum, interview) => sum + (interview.score || 0),
                  0,
                ) / completedInterviews.length
              ).toFixed(2)
            : 0,
        interviewsCompleted: completedInterviews,
      },
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error in getUserByUsernameHandler:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
}

export { getUserByIdHandler, getUserByUsernameHandler };
