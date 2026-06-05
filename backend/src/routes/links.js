import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Moved into a function — runs AFTER dotenv has loaded
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// GET /api/links?folder_id=...
router.get('/', async (req, res) => {
  const { folder_id } = req.query
  const user_id = req.user.id

  if (!folder_id) {
    return res.status(400).json({ error: 'folder_id is required' })
  }

  const { data, error } = await getSupabase()
    .from('links')
    .select('*')
    .eq('folder_id', folder_id)
    .eq('user_id', user_id)        // safety: only your own links
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  res.status(200).json(data)
})


// POST /api/links
router.post('/', async (req, res) => {
  const { folder_id, url } = req.body;
  const user_id = req.user.id; // comes from auth middleware

  if (!folder_id || !url) {
    return res.status(400).json({ error: 'folder_id and url are required' });
  }

  const { data, error } = await getSupabase()
    .from('links')
    .insert([{
      folder_id,
      user_id,
      url,
      snapshot_status: 'pending'
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json(data);
});

// DELETE /api/links/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const { error } = await getSupabase()
    .from('links')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id); // safety: can only delete your own links

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: 'Link deleted' });
});

export default router;