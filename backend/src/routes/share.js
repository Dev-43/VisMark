import express from 'express';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '../utils/activity.js';

const shareRouter = express.Router();
const publicRouter = express.Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

shareRouter.patch('/:id/share', async (req, res) => {
  const { id } = req.params;         // folder UUID from URL
  const userId = req.user.id;        // set by auth middleware
  const { enable } = req.body;       // true = make public, false = make private

  // Security check — confirm user is the OWNER of this folder in folder_members
  const { data: membership, error: memberError } = await getSupabase()
    .from('folder_members')
    .select('role')
    .eq('folder_id', id)
    .eq('user_id', userId)
    .single();

  if (memberError || !membership) return res.status(404).json({ error: 'Folder not found or access denied' });
  if (membership.role !== 'owner') return res.status(403).json({ error: 'Forbidden: Only folder owners can toggle public sharing' });

  // Fetch current folder details for public_slug check
  const { data: folder, error: fetchError } = await getSupabase()
    .from('folders')
    .select('public_slug')
    .eq('id', id)
    .single();

  if (fetchError || !folder) return res.status(404).json({ error: 'Folder not found' });

  // If enabling: generate a slug (or reuse existing one)
  // If disabling: clear the slug
  const updates = enable
    ? { is_public: true, public_slug: folder.public_slug || nanoid(8) }
    : { is_public: false, public_slug: null };
  const { data, error } = await getSupabase()
    .from('folders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Log activity
  await logActivity(id, userId, 'public_share_toggled');

  res.json({
    is_public: data.is_public,
    public_slug: data.public_slug,
    share_url: data.public_slug ? `/share/${data.public_slug}` : null
  });
});

publicRouter.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  // Fetch the folder by its public slug
  const { data: folder, error: folderError } = await getSupabase()
    .from('folders')
    .select('id, name, user_id')
    .eq('public_slug', slug)
    .eq('is_public', true)   // double-check it's still public
    .single();

  if (folderError || !folder) {
    return res.status(404).json({ error: 'This folder is not available' });
  }

  // Fetch all links in this folder
  const { data: links, error: linksError } = await getSupabase()
    .from('links')
    .select('id, url, title, description, screenshot_url, favicon_url')
    .eq('folder_id', folder.id)
    .order('created_at', { ascending: false });

  if (linksError) return res.status(500).json({ error: linksError.message });

  res.json({ folder, links });
});

export { shareRouter, publicRouter };