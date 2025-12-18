import express from "express";
import { requireAuth } from "@clerk/express";
import { requireProSubscription } from "../middleware/requireProSubscription.js";

const router = express.Router();

/**
 * Example pro-only endpoint
 * This demonstrates how to protect premium features
 */
router.get(
  "/premium-feature",
  requireAuth(), // First verify user is authenticated
  requireProSubscription, // Then verify they have pro subscription
  (req, res) => {
    // This code only runs if user has active pro subscription
    res.json({
      message: "Welcome to the premium feature!",
      subscription: req.subscription, // Attached by requireProSubscription middleware
    });
  }
);

/**
 * Get subscription status from database
 * This returns the SOURCE OF TRUTH from Supabase
 */
router.get("/subscription-status", requireAuth(), async (req, res) => {
  try {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    const { userId: clerkUserId } = auth;

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        subscriptionStatus: true,
        numberOfInterviewsAllowed: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      subscriptionStatus: user.subscriptionStatus,
      interviewsAllowed: user.numberOfInterviewsAllowed,
      subscriptionEndsAt: user.subscriptionEndsAt,
      isPro: user.subscriptionStatus === "active",
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
});

export default router;
