import Stripe from "stripe";
import { clerkClient } from "@clerk/clerk-sdk-node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

        let planType = "pro_monthly";
        if (session.metadata?.plan_type) {
          planType = session.metadata.plan_type;
        } else if (session.mode === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          const interval = subscription.items.data[0]?.plan?.interval;
          planType = interval === "year" ? "pro_yearly" : "pro_monthly";
        }

        console.log("Updating Clerk user with plan:", planType);

        // Update Clerk user with subscription info
        await clerkClient.users.updateUser(clerkUserId, {
          publicMetadata: {
            stripeCustomerId: customerId,
            subscriptionId: subscriptionId,
            plan: planType,
            subscriptionStatus: "active",
            updatedAt: new Date().toISOString(),
          },
        });

        console.log("✅ Successfully updated user subscription status");
        break;
      }





      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log("🔄 Subscription updated:", subscription.id);

        // Find user by Stripe customer ID
        const users = await clerkClient.users.getUserList();
        const user = users.data.find(
          (u) => u.publicMetadata?.stripeCustomerId === subscription.customer
        );

        if (user) {
          await clerkClient.users.updateUser(user.id, {
            publicMetadata: {
              ...user.publicMetadata,
              subscriptionStatus: subscription.status,
              updatedAt: new Date().toISOString(),
            },
          });
          console.log("✅ Updated subscription status to:", subscription.status);
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
          await clerkClient.users.updateUser(user.id, {
            publicMetadata: {
              ...user.publicMetadata,
              subscriptionStatus: "cancelled",
              plan: "free",
              updatedAt: new Date().toISOString(),
            },
          });
          console.log("✅ Subscription cancelled for user");
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
