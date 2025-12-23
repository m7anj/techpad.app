import express from "express";
import { getLeaderboard } from "../controllers/leaderboardController.js";

const router = express.Router();

// Public endpoint to get leaderboard
router.get("/", getLeaderboard);

export default router;
