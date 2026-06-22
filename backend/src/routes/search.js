import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Same pattern as links.js — runs AFTER dotenv has loaded
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// GET /api/search?q=notion
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const query = req.query.q;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const sanitized = query.trim().replace(/[^a-zA-Z0-9\s]/g, '');

  if (!sanitized) {
    return res.status(400).json({ error: 'Invalid search query' });
  }

  const tsQuery = sanitized.trim().split(/\s+/).join(' & ');

  try {
    const { data, error } = await getSupabase()
    .from('links')
    .select(`
    id,
    url,
    title,
    description,
    screenshot_url,
    favicon_url,
    snapshot_status,
    folder_id,
    created_at,
    folders ( name ),
    link_tags (tag_id,tags ( id, name ) )
    `)
    .eq('user_id', userId)
    .or(`fts.phfts(english).${sanitized},url.ilike.%${sanitized}%`);

    if (error) throw error;

    return res.json({ results: data, count: data.length });

  } catch (err) {
    console.error('Search error:', err.message);
    return res.status(500).json({ error: 'Search failed' });
  }
});

export default router;