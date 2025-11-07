import express from 'express';
const router = express.Router();
router.get('/', (req, res) => {
    res.send('These are interviews you have completed!');
});
export default router;
