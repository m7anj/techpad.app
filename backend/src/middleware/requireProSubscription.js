import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Middleware to verify user has an active pro subscription
 * Checks the database (source of truth) rather than trusting client-side data
 */
async function requireProSubscription(req, res, next) {
  try {
    // Get user ID from Clerk auth
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    const { userId: clerkUserId } = auth;

    if (!clerkUserId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be signed in"
      });
    }

    // Check subscription status in database (source of truth)
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        subscriptionStatus: true,
        numberOfInterviewsAllowed: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "Please contact support"
      });
    }

    // Verify user has active pro subscription
    if (user.subscriptionStatus !== "active") {
      return res.status(403).json({
        error: "Pro subscription required",
        message: "This feature requires an active Pro subscription",
        upgradeUrl: "/payment"
      });
    }

    // Attach user data to request for use in route handlers
    req.subscription = {
      status: user.subscriptionStatus,
      interviewsAllowed: user.numberOfInterviewsAllowed,
    };

    next();
  } catch (error) {
    console.error("Error in requireProSubscription middleware:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to verify subscription status"
    });
  }
}

export { requireProSubscription };
