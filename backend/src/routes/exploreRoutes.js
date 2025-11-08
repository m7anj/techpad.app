import express from 'express';

import { getExplorePresetsHandler, getExplorePresetByIdHandler } from '../controllers/exploreController.js';
import { get } from 'http';

const router = express.Router();

router.get('/', async (req, res) => {
    res.send("Fetching explore data!");
    getExplorePresetsHandler(req, res);
});

router.get('/:id', async (req, res) => {
    res.send("Fetching explore data for id: " + req.params.id);
    getExplorePresetByIdHandler(req, res);
});

export default router;