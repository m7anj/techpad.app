import { getUserById } from "../services/userService.js";

async function getUserByIdHandler(req, res) {
    const { id } = req.params
    try {
        const user = await getUserById(id)

        if (user == null) {
            res.status(404).json({ message: "Not Found" })
            return;
        } else {
            res.status(200).json(user)
        }
        
    } catch (error) {
        console.error("Error in getUserByIdHandler:", error);
        res.status(500).json({ message: "Error"})
    }
}

export {
    getUserByIdHandler,
};