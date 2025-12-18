import express from "express";
import { requireAuth } from "@clerk/express";
import { createCheckoutSession } from "../controllers/checkoutController.js";

const router = express.Router();

router.post("/create-session", requireAuth(), createCheckoutSession);

export default router;
