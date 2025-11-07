import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Find some new interview types!')
});

export default router;