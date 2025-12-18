import Stripe from "stripe";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { PrismaClient } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

async function handleStripeWebhook(req, res) {
  console.log("=== STRIPE WEBHOOK RECEIVED ===");

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("⚠️  Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  console.log(`Event type: ${event.type}`);



  try {
    switch (event.type) {


      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("💳 Checkout session completed:", session.id);

        // Get customer details
        const customerId = session.customer;
        const customerEmail = session.customer_details?.email;
        const subscriptionId = session.subscription;

        console.log("Customer ID:", customerId);
        console.log("Customer Email:", customerEmail);
        console.log("Subscription ID:", subscriptionId);

        // Get the Clerk user ID from session metadata
        // You'll need to pass this when creating the checkout session
        let clerkUserId = session.metadata?.clerk_user_id;

        // If no user ID in metadata, try to find user by email
        if (!clerkUserId && customerEmail) {
          try {
            const users = await clerkClient.users.getUserList({
              emailAddress: [customerEmail],
            });
            if (users.data.length > 0) {
              clerkUserId = users.data[0].id;
              console.log("Found Clerk user by email:", clerkUserId);
            }
          } catch (error) {
            console.error("Error finding user by email:", error);
          }
        }

        if (!clerkUserId) {
          console.error("❌ Could not find Clerk user ID");
          return res.status(400).json({ error: "User not found" });
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        let planType = "pro_monthly";
        if (session.metadata?.plan_type) {
          planType = session.metadata.plan_type;
        } else if (session.mode === "subscription") {
          const interval = subscription.items.data[0]?.plan?.interval;
          planType = interval === "year" ? "pro_yearly" : "pro_monthly";
        }

        console.log("Updating Clerk user with plan:", planType);
        console.log("Subscription ends at:", currentPeriodEnd.toISOString());

        // Update Clerk user with subscription info
        await clerkClient.users.updateUser(clerkUserId, {
          publicMetadata: {
            role: "pro", // Upgrade to pro role
            stripeCustomerId: customerId,
            subscriptionId: subscriptionId,
            plan: planType,
            subscriptionStatus: "active",
            subscriptionEndsAt: currentPeriodEnd.toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        console.log("✅ Updated Clerk metadata to pro");

        // Update Supabase database - upgrade user to pro with unlimited interviews
        try {
          await prisma.user.update({
            where: { clerkUserId: clerkUserId },
            data: {
              numberOfInterviewsAllowed: 999999, // Unlimited for pro users
              subscriptionStatus: "active",
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionEndsAt: currentPeriodEnd,
            },
          });
          console.log("✅ Updated Supabase database - user now has unlimited interviews");
          console.log(`   Database record updated with subscription end date: ${currentPeriodEnd.toISOString()}`);
        } catch (dbError) {
          console.error("❌ Error updating Supabase:", dbError);
        }

        console.log("✅ Successfully upgraded user to Pro membership");
        break;
      }





      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log("🔄 Subscription updated:", subscription.id);

        const updatedPeriodEnd = new Date(subscription.current_period_end * 1000);

        // Find user by Stripe customer ID
        const users = await clerkClient.users.getUserList();
        const user = users.data.find(
          (u) => u.publicMetadata?.stripeCustomerId === subscription.customer
        );

        if (user) {
          // Update Clerk metadata
          await clerkClient.users.updateUser(user.id, {
            publicMetadata: {
              ...user.publicMetadata,
              subscriptionStatus: subscription.status,
              subscriptionEndsAt: updatedPeriodEnd.toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
          console.log("✅ Updated subscription status to:", subscription.status);

          // Update Supabase database
          try {
            await prisma.user.update({
              where: { clerkUserId: user.id },
              data: {
                subscriptionStatus: subscription.status,
                subscriptionEndsAt: updatedPeriodEnd,
              },
            });
            console.log("✅ Updated database with new subscription end date");
          } catch (dbError) {
            console.error("❌ Error updating database:", dbError);
          }
        }
        break;
      }




      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("❌ Subscription cancelled:", subscription.id);

        // Find user and remove subscription
        const users = await clerkClient.users.getUserList();
        const user = users.data.find(
          (u) => u.publicMetadata?.stripeCustomerId === subscription.customer
        );

        if (user) {
          // Downgrade in Clerk
          await clerkClient.users.updateUser(user.id, {
            publicMetadata: {
              ...user.publicMetadata,
              role: "free", // Downgrade to free
              subscriptionStatus: "cancelled",
              plan: "free",
              subscriptionEndsAt: null,
              updatedAt: new Date().toISOString(),
            },
          });
          console.log("✅ Downgraded Clerk metadata to free");

          // Downgrade in Supabase - reset to 3 interviews
          try {
            await prisma.user.update({
              where: { clerkUserId: user.id },
              data: {
                numberOfInterviewsAllowed: 3,
                subscriptionStatus: "cancelled",
                subscriptionEndsAt: null,
              },
            });
            console.log("✅ Downgraded Supabase - reset to 3 interviews");
          } catch (dbError) {
            console.error("❌ Error downgrading in Supabase:", dbError);
          }

          console.log("✅ Subscription cancelled and user downgraded to free");
        }
        break;
      }



      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });


    
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}

export { handleStripeWebhook };
