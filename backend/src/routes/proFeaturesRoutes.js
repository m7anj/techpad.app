import express from "express";
import { requireAuth } from "@clerk/express";
import { requireProSubscription } from "../middleware/requireProSubscription.js";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

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

/**
 * Cancel subscription
 * Cancels the user's Stripe subscription at period end
 * The webhook will handle the actual downgrade when the period ends
 */
router.post("/cancel-subscription", requireAuth(), async (req, res) => {
  try {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    const { userId: clerkUserId } = auth;

    // Get user's subscription info from database
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    if (user.subscriptionStatus !== "active") {
      return res.status(400).json({ error: "Subscription is not active" });
    }

    // Cancel subscription at period end (user keeps access until billing period ends)
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    console.log(`✅ Subscription ${subscription.id} set to cancel at period end`);
    console.log(`   Cancel date: ${new Date(subscription.current_period_end * 1000).toISOString()}`);

    // Update database to reflect pending cancellation
    await prisma.user.update({
      where: { clerkUserId },
      data: {
        subscriptionStatus: "cancelling", // Mark as pending cancellation
      },
    });

    res.json({
      success: true,
      message: "Subscription will be cancelled at the end of the billing period",
      cancelAt: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

/**
 * Reactivate subscription (undo cancellation)
 * Only works if subscription is set to cancel at period end but hasn't ended yet
 */
router.post("/reactivate-subscription", requireAuth(), async (req, res) => {
  try {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    const { userId: clerkUserId } = auth;

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({ error: "No subscription found" });
    }

    // Reactivate subscription (undo cancel_at_period_end)
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    console.log(`✅ Subscription ${subscription.id} reactivated`);

    // Update database
    await prisma.user.update({
      where: { clerkUserId },
      data: {
        subscriptionStatus: "active",
      },
    });

    res.json({
      success: true,
      message: "Subscription reactivated successfully",
    });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    res.status(500).json({ error: "Failed to reactivate subscription" });
  }
});

export default router;
