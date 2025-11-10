import express from 'express';
import { getInterviewByIdHandler } from '../controllers/exploreController.js';

const router = express.Router();

router.get('/:id', getInterviewByIdHandler );

export default router;