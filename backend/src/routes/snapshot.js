import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { screenshotQueue } from '../services/queue.js';
import requireAuth from '../middleware/auth.js';
import { snapshotRateLimiter } from '../middleware/rateLimiter.js';
import { isUrlSafe } from '../utils/urlSafety.js';

const router = express.Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

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

  if (!(await isUrlSafe(url))) {
    return res.status(400).json({ error: 'URL not allowed' });
  }

  // Verify link ownership
  const userId = req.user.id;
  const { data: link, error: linkError } = await getSupabase()
    .from('links')
    .select('id')
    .eq('id', linkId)
    .eq('user_id', userId)
    .single();

  if (linkError || !link) {
    return res.status(403).json({ error: 'Link not found or access denied' });
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