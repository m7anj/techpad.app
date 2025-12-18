import Stripe from "stripe";
import { clerkClient } from "@clerk/clerk-sdk-node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createCheckoutSession(req, res) {
  try {
    const { priceId, planType } = req.body;

    // Get authenticated user from Clerk
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    const { userId: clerkUserId } = auth;

    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user email from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;

    console.log(`Creating checkout session for user: ${clerkUserId}`);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment`,
      customer_email: email,
      metadata: {
        clerk_user_id: clerkUserId,
        plan_type: planType,
      },
    });

    console.log(`✅ Checkout session created: ${session.id}`);

    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
}

export { createCheckoutSession };
