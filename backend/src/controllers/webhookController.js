import { Webhook } from "svix";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function handleClerkWebhook(req, res) {
  console.log("=== WEBHOOK RECEIVED ===");

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  // Get the headers
  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  // If there are no headers, return 400
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Missing svix headers" });
  }

  // Get the body as string (it's raw from express.raw())
  const payload = req.body.toString();

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Verify the webhook signature
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).json({ error: "Webhook verification failed" });
  }

  // Handle the webhook
  const { type, data } = evt;

  console.log(`Webhook type: ${type}`);
  console.log(`User ID: ${data.id}`);

  try {
    if (type === "user.created") {
      console.log(`✅ New user registered in Clerk: ${data.id}`);

      // Create user in database
      const email = data.email_addresses?.[0]?.email_address;

      try {
        const user = await prisma.user.create({
          data: {
            clerkUserId: data.id,
            email: email,
            numberOfInterviewsAllowed: 3, // Default free tier
          },
        });

        console.log(`✅ User created in database:`, {
          id: user.id,
          clerkUserId: user.clerkUserId,
          email: user.email,
          numberOfInterviewsAllowed: user.numberOfInterviewsAllowed,
        });

        return res.status(200).json({
          success: true,
          message: "User created successfully",
          user: {
            id: user.id,
            clerkUserId: user.clerkUserId,
            numberOfInterviewsAllowed: user.numberOfInterviewsAllowed,
          }
        });
      } catch (dbError) {
        console.error("❌ Error creating user in database:", dbError);
        // Still return success to Clerk so it doesn't retry
        return res.status(200).json({
          success: true,
          message: "User registered in Clerk (database error logged)"
        });
      }
    }

    // For other event types, just acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export { handleClerkWebhook };
