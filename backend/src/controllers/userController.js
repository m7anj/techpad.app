import { getUserById, getUserByClerkId, createUser } from "../services/userService.js";

async function getUserByIdHandler(req, res) {
    const { userId: clerkUserId } = req.auth;

    if (!clerkUserId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        let user = await getUserByClerkId(clerkUserId);

        // Create user if doesn't exist
        if (!user) {
            const { emailAddress, username } = req.auth.sessionClaims;
            user = await createUser({
                clerkId: clerkUserId,
                email: emailAddress,
                username: username || null
            });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error("Error in getUserByIdHandler:", error);
        res.status(500).json({ message: "Error"});
    }
}

export {
    getUserByIdHandler,
};