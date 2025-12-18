import { PrismaClient } from "@prisma/client";
import { clerkClient } from "@clerk/clerk-sdk-node";

const prisma = new PrismaClient();

/**
 * Middleware to check if user's subscription has expired
 * and downgrade them if necessary
 *
 * This runs on protected routes to ensure subscription status is current
 */
async function checkSubscriptionExpiry(req, res, next) {
  try {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    const { userId: clerkUserId } = auth;

    if (!clerkUserId) {
      return next(); // No user, skip check
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return next(); // User not in database yet, skip
    }

    // Check if subscription is active but expired
    if (
      user.subscriptionStatus === "active" &&
      user.subscriptionEndsAt &&
      new Date(user.subscriptionEndsAt) < new Date()
    ) {
      console.log(`⏰ Subscription expired for user: ${clerkUserId}`);
      console.log(`   Expired at: ${user.subscriptionEndsAt}`);

      // Downgrade in database
      await prisma.user.update({
        where: { clerkUserId },
        data: {
          subscriptionStatus: "expired",
          numberOfInterviewsAllowed: 3,
          subscriptionEndsAt: null,
        },
      });

      // Downgrade in Clerk metadata
      await clerkClient.users.updateUser(clerkUserId, {
        publicMetadata: {
          role: "free",
          plan: "free",
          subscriptionStatus: "expired",
          subscriptionEndsAt: null,
          updatedAt: new Date().toISOString(),
        },
      });

      console.log(`✅ User downgraded to free tier due to expired subscription`);
    }

    next();
  } catch (error) {
    console.error("Error checking subscription expiry:", error);
    // Don't fail the request, just log the error
    next();
  }
}

export { checkSubscriptionExpiry };
