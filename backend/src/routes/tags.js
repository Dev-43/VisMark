import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
// GET /api/tags
router.get('/', async (req, res) => {
  const userId = req.user.id; // req.user is set by your auth middleware

  const { data, error } = await getSupabase().from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});


// POST /api/tags
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Tag name is required' });
  }

  const { data, error } = await getSupabase().from('tags')
    .insert({ user_id: userId, name: name.trim().toLowerCase() })
    .select()
    .single();

  if (error) {
    // Postgres error code 23505 = unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Tag already exists' });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

// DELETE /api/tags/:tagId
router.delete('/:tagId', async (req, res) => {
  const userId = req.user.id;
  const { tagId } = req.params;

  const { error } = await getSupabase().from('tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', userId); // safety check: only delete YOUR tag

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// POST /api/tags/:tagId/links/:linkId  — attach tag to a link
router.post('/:tagId/links/:linkId', async (req, res) => {
  const { tagId, linkId } = req.params;
  const userId = req.user.id;

  // Check tag ownership
  const { data: tag, error: tagError } = await getSupabase()
    .from('tags')
    .select('id')
    .eq('id', tagId)
    .eq('user_id', userId)
    .single();

  if (tagError || !tag) {
    return res.status(403).json({ error: 'Not found or access denied' });
  }

  // Check folder membership and role for link
  const { data: link, error: linkError } = await getSupabase()
    .from('links')
    .select('folder_id')
    .eq('id', linkId)
    .single();

  if (linkError || !link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const { data: membership, error: memberError } = await getSupabase()
    .from('folder_members')
    .select('role')
    .eq('folder_id', link.folder_id)
    .eq('user_id', userId)
    .single();

  if (memberError || !membership) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (membership.role !== 'owner' && membership.role !== 'editor') {
    return res.status(403).json({ error: 'Only owners and editors can modify tags on links' });
  }

  const { error } = await getSupabase().from('link_tags')
    .insert({ tag_id: tagId, link_id: linkId });

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Tag already on this link' });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).send();
});

// DELETE /api/tags/:tagId/links/:linkId  — remove tag from a link
router.delete('/:tagId/links/:linkId', async (req, res) => {
  const { tagId, linkId } = req.params;
  const userId = req.user.id;

  // Check tag ownership
  const { data: tag, error: tagError } = await getSupabase()
    .from('tags')
    .select('id')
    .eq('id', tagId)
    .eq('user_id', userId)
    .single();

  if (tagError || !tag) {
    return res.status(403).json({ error: 'Not found or access denied' });
  }

  // Check folder membership and role for link
  const { data: link, error: linkError } = await getSupabase()
    .from('links')
    .select('folder_id')
    .eq('id', linkId)
    .single();

  if (linkError || !link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const { data: membership, error: memberError } = await getSupabase()
    .from('folder_members')
    .select('role')
    .eq('folder_id', link.folder_id)
    .eq('user_id', userId)
    .single();

  if (memberError || !membership) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (membership.role !== 'owner' && membership.role !== 'editor') {
    return res.status(403).json({ error: 'Only owners and editors can modify tags on links' });
  }

  const { error } = await getSupabase().from('link_tags')
    .delete()
    .eq('tag_id', tagId)
    .eq('link_id', linkId);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// GET /api/tags/:tagId/links
router.get('/:tagId/links', async (req, res) => {
  const userId = req.user.id;
  const { tagId } = req.params;

  try {
    // 1. Fetch user's folder memberships to get folder IDs and roles
    const { data: memberships, error: memberError } = await getSupabase()
      .from('folder_members')
      .select('folder_id, role')
      .eq('user_id', userId);

    if (memberError) return res.status(500).json({ error: memberError.message });

    const folderMap = {};
    memberships.forEach(m => {
      folderMap[m.folder_id] = m.role;
    });
    const folderIds = Object.keys(folderMap);

    if (folderIds.length === 0) {
      return res.json([]);
    }

    // 2. Fetch links that are in those folders and have the specified tag
    const { data, error } = await getSupabase().from('links')
      .select(`
        *,
        link_tags!inner(tag_id, tags(id, name))
      `)
      .in('folder_id', folderIds)
      .eq('link_tags.tag_id', tagId);

    if (error) return res.status(500).json({ error: error.message });

    // 3. Attach folder role to each link
    const linksWithRole = (data || []).map(link => ({
      ...link,
      role: folderMap[link.folder_id]
    }));

    res.json(linksWithRole);
  } catch (err) {
    console.error('Error fetching tagged links:', err.message);
    res.status(500).json({ error: 'Failed to retrieve tagged links' });
  }
});

export default router;