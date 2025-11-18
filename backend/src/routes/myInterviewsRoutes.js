import express from 'express';
import { requireAuth } from '@clerk/express';
import { getCompletedInterviewsByUserId } from '../controllers/myInterviewsController.js';

const router = express.Router();

router.get('/', requireAuth(), getCompletedInterviewsByUserId);

export default router;