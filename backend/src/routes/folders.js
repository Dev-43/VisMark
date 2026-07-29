import express from 'express'
import { createClient } from '@supabase/supabase-js'
import requireAuth from '../middleware/auth.js'

const getSupabase = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const router = express.Router()


router.get('/', requireAuth, async (req, res) => {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('folder_members')
    .select('role, folder:folders (*)')
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })

  const flattened = (data || [])
    .filter(m => m.folder)
    .map(m => ({
      ...m.folder,
      role: m.role
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json(flattened)
})

router.get('/:id', requireAuth, async (req, res) => {
  const supabase = getSupabase()
  const { id } = req.params
  const userId = req.user.id

  const { data, error } = await supabase
    .from('folder_members')
    .select('role, folder:folders (id, name, is_public, public_slug)')
    .eq('folder_id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Folder not found' })

  res.json({
    ...data.folder,
    role: data.role
  })
})

router.post('/', requireAuth, async (req, res) => {
  const supabase = getSupabase()
  const { name } = req.body           // folder name from frontend
  const userId = req.user.id          // user id from the verified JWT

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Folder name is required' })
  }

  // 1. Insert folder
  const { data: folder, error: folderError } = await supabase
    .from('folders')
    .insert({ name: name.trim(), user_id: userId })
    .select()
    .single()

  if (folderError) return res.status(500).json({ error: folderError.message })

  // 2. Insert owner membership in folder_members
  const { error: memberError } = await supabase
    .from('folder_members')
    .insert({ folder_id: folder.id, user_id: userId, role: 'owner' })

  if (memberError) {
    // Attempt cleanup
    await supabase.from('folders').delete().eq('id', folder.id)
    return res.status(500).json({ error: memberError.message })
  }

  res.status(201).json(folder)
})

router.patch('/:id', requireAuth, async (req, res) => {
  const supabase = getSupabase()
  const { id } = req.params           // folder UUID from the URL
  const { name } = req.body
  const userId = req.user.id

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Folder name is required' })
  }

  // Check role: only owner can rename folder
  const { data: membership, error: memberError } = await supabase
    .from('folder_members')
    .select('role')
    .eq('folder_id', id)
    .eq('user_id', userId)
    .single()

  if (memberError || !membership) {
    return res.status(404).json({ error: 'Folder not found or access denied' })
  }

  if (membership.role !== 'owner') {
    return res.status(403).json({ error: 'Only folder owners can rename folders' })
  }

  const { data, error } = await supabase
    .from('folders')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Folder not found' })

  res.json(data)
})

router.delete('/:id', requireAuth, async (req, res) => {
  const supabase = getSupabase()
  const { id } = req.params
  const userId = req.user.id

  // Check role: only owner can delete folder
  const { data: membership, error: memberError } = await supabase
    .from('folder_members')
    .select('role')
    .eq('folder_id', id)
    .eq('user_id', userId)
    .single()

  if (memberError || !membership) {
    return res.status(404).json({ error: 'Folder not found or access denied' })
  }

  if (membership.role !== 'owner') {
    return res.status(403).json({ error: 'Only folder owners can delete folders' })
  }

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: 'Folder deleted' })
})

export default router