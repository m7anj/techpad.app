// userdata comes from clerk directly via req.auth
import { clerkClient } from "@clerk/express";

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

    // return user info from clerk
    const user = {
      clerkId: clerkUserId,
      email: clerkUser.emailAddresses?.[0]?.emailAddress,
      username: clerkUser.username,
      imageUrl: clerkUser.imageUrl,
      role: clerkUser.publicMetadata?.role || "free",
    };

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserByIdHandler:", error);
    res.status(500).json({ message: "Error" });
  }
}

export { getUserByIdHandler };
