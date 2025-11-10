import express from 'express';
import { getCompletedInterviewsByUserId } from '../controllers/myInterviewsController.js';

const router = express.Router();

router.get('/:userId', getCompletedInterviewsByUserId);

export default router;