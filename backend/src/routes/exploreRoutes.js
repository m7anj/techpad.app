import express from 'express';
import { getExplorePresetsHandler, getExplorePresetByIdHandler } from '../controllers/exploreController.js';

const router = express.Router();

router.get('/', getExplorePresetsHandler);
router.get('/:id', getExplorePresetByIdHandler);

export default router;