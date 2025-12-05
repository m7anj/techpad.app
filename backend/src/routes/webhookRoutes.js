import express from "express";
import { handleClerkWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Clerk webhook endpoint - raw body needed for signature verification
router.post("/clerk", express.raw({ type: "application/json" }), handleClerkWebhook);

export default router;
