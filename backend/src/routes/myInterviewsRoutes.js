import express from "express";
import { requireAuth } from "@clerk/express";
import { getCompletedInterviewsByUserId, getCompletedInterviewByIdHandler } from "../controllers/myInterviewsController.js";

const router = express.Router();

router.get("/", requireAuth(), getCompletedInterviewsByUserId);
router.get("/:id", requireAuth(), getCompletedInterviewByIdHandler);

export default router;
