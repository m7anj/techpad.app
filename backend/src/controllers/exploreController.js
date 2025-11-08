import { getExplorePresets, getExplorePresetById } from "../services/exploreService.js";

async function getExplorePresetsHandler(req, res) {
    try {
        const presets = await getExplorePresets();
        res.status(200).json(presets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error" });
    }
}

async function getExplorePresetByIdHandler(req, res) {
    const { id } = req.params
    try {
        const preset = await getExplorePresetById(id)
        res.status(200).json(preset)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error"})
    }
}

export default {
    getExplorePresetsHandler,
    getExplorePresetByIdHandler,
};