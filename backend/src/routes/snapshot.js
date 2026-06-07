import express from 'express';
import { screenshotQueue } from '../services/queue.js';
import requireAuth from '../middleware/auth.js';
import { snapshotRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', requireAuth, snapshotRateLimiter, async (req, res) => {
  const { linkId, url } = req.body;

  if (!linkId || !url) {
    return res.status(400).json({ error: 'linkId and url are required' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    await screenshotQueue.add(
      'take-screenshot',
      { linkId, url },
      { attempts: 2, backoff: { type: 'fixed', delay: 3000 } }
    );
    return res.status(202).json({ status: 'pending' });
  } catch (err) {
    console.error('Failed to add job to queue:', err.message);
    return res.status(500).json({ error: 'Failed to queue screenshot job' });
  }
});

export default router;