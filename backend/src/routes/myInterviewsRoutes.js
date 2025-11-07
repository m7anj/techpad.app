import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.send('yourInterviews')
});

export default router;