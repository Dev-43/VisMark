import express from 'express';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';

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

  // Security check — confirm this folder belongs to the requesting user
  const { data: folder, error: fetchError } = await getSupabase()
    .from('folders')
    .select('id, user_id, public_slug')
    .eq('id', id)
    .single();

  if (fetchError || !folder) return res.status(404).json({ error: 'Folder not found' });
  if (folder.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

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