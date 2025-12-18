import express from "express";
import { requireAuth } from "@clerk/express";
import { getUserByIdHandler } from "../controllers/userController.js";
import { checkSubscriptionExpiry } from "../middleware/checkSubscriptionExpiry.js";

const router = express.Router();

// Check subscription expiry before returning user data
router.get("/me", requireAuth(), checkSubscriptionExpiry, getUserByIdHandler);
router.post("/webhooks/clerk", requireAuth(), async (req, res) => {
  try {
    const { id } = req.body;
    const user = await getUserByIdHandler(id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
