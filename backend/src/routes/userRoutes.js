import express from 'express';
import { getUserByIdHandler } from '../controllers/userController.js';

const router = express.Router();

router.get('/:id', getUserByIdHandler);

export default router;