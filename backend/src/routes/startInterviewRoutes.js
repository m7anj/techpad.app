import express from 'express';
import { startInterviewHandler } from '../controllers/startInterviewController.js';

const router = express.Router();

router.get('/:id', startInterviewHandler );

export default router;