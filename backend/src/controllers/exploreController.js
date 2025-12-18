import { getExplorePresets, getExplorePresetById } from "../services/exploreService.js";

// HANDLER TO GET ALL EXPLORE PRESETS

async function getExplorePresetsHandler(req, res) {
    try {
        const presets = await getExplorePresets();
        res.status(200).json(presets);
    } catch (error) {
        console.error("Error in getExplorePresetsHandler:", error);
        res.status(500).json({ message: "Error" });
    }
}



// HANDLER TO GET EXPLORE PRESET BY ID

async function getExplorePresetByIdHandler(req, res) {
    const { id } = req.params
    try {
        const preset = await getExplorePresetById(id)

        if (preset == null) {
            res.status(404).json({ message: "Not Found" })
            return;
        } else {
            res.status(200).json(preset)
        }
    } catch (error) {
        console.error("Error in getExplorePresetByIdHandler:", error);
        res.status(500).json({ message: "Error"})
    }
}

export {
    getExplorePresetsHandler,
    getExplorePresetByIdHandler,
};