import express from 'express';
import { takeScreenshot } from '../services/playwrightSnapshot.js';

const router = express.Router();

router.post('/test-playwright-snapshot', async (req, res) => {
  const { url } = req.body;
  try {
    const result = await takeScreenshot(url);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.name, message: err.message });
  }
});

export default router;