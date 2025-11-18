import express from 'express';
import { requireAuth } from '@clerk/express';
import { getUserByIdHandler } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', requireAuth(), getUserByIdHandler);

export default router;