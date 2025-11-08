import { getExplorePresets, getExplorePresetById } from "../services/exploreService.js";

// Handle a request to get all the different presets in the Interviews table in the database

async function getExplorePresetsHandler(req, res) {
    try {
        const presets = await getExplorePresets();
        res.status(200).json(presets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error" });
    }
}

// Handle a request to get a specific preset by its id

async function getExplorePresetByIdHandler(req, res) {
    const { id } = req.params
    try {
        const preset = await getExplorePresetById(id)
        
        if (preset == null) {
            console.error("Not Found")
            res.status(404).json({ message: "Not Found" })
            return;
        } else {
            res.status(200).json(preset)
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error NOT FOUND"})
    }

    
}

export default {
    getExplorePresetsHandler,
    getExplorePresetByIdHandler,
};