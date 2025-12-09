// userdata comes from Clerk directly via req.auth
import { getUserRole } from "../middleware/auth.js";

async function getUserByIdHandler(req, res) {
  const { userId: clerkUserId, sessionClaims } = req.auth;

  if (!clerkUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Return user info from Clerk session claims
    const user = {
      clerkId: clerkUserId,
      email: sessionClaims?.email,
      username: sessionClaims?.username,
      imageUrl: sessionClaims?.imageUrl,
      role: getUserRole(req),
    };

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserByIdHandler:", error);
    res.status(500).json({ message: "Error" });
  }
}

export { getUserByIdHandler };
