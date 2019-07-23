import express from "express";

const router = express.Router();
router.get('/test', (req: express.Request, res: express.Response) => {
    res.json({ result: 5 });
});

export default router;