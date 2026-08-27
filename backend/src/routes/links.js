import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '../utils/activity.js';

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

  // Verify folder membership
  const { data: membership, error: memberError } = await getSupabase()
    .from('folder_members')
    .select('role')
    .eq('folder_id', folder_id)
    .eq('user_id', user_id)
    .single();

  if (memberError || !membership) {
    return res.status(403).json({ error: 'Folder not found or access denied' })
  }

  const { data, error } = await getSupabase()
    .from('links')
    .select('*, link_tags (tag_id,tags ( id, name ) )')
    .eq('folder_id', folder_id)
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

  // Verify folder membership and check if user has write permissions (owner or editor)
  const { data: membership, error: memberError } = await getSupabase()
    .from('folder_members')
    .select('role')
    .eq('folder_id', folder_id)
    .eq('user_id', user_id)
    .single();

  if (memberError || !membership) {
    return res.status(403).json({ error: 'Folder not found or access denied' });
  }

  if (membership.role !== 'owner' && membership.role !== 'editor') {
    return res.status(403).json({ error: 'Only owners and editors can add links' });
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

  // Log activity
  await logActivity(folder_id, user_id, 'link_added', data.id);

  res.status(201).json(data);
});

// DELETE /api/links/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  // Find the link and its folder_id
  const { data: link, error: linkError } = await getSupabase()
    .from('links')
    .select('folder_id')
    .eq('id', id)
    .single();

  if (linkError || !link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  // Verify folder membership and check role
  const { data: membership, error: memberError } = await getSupabase()
    .from('folder_members')
    .select('role')
    .eq('folder_id', link.folder_id)
    .eq('user_id', user_id)
    .single();

  if (memberError || !membership) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (membership.role !== 'owner' && membership.role !== 'editor') {
    return res.status(403).json({ error: 'Only owners and editors can delete links' });
  }

  const { error } = await getSupabase()
    .from('links')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  // Log activity
  await logActivity(link.folder_id, user_id, 'link_deleted', id);

  res.status(200).json({ message: 'Link deleted' });
});

export default router;