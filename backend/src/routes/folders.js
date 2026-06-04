import express from 'express'
import { createClient } from '@supabase/supabase-js'
import requireAuth from '../middleware/auth.js'

const getSupabase = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const router = express.Router()

router.post('/', requireAuth, async (req, res) => {
  const supabase = getSupabase()
  const { name } = req.body           // folder name from frontend
  const userId = req.user.id          // user id from the verified JWT

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Folder name is required' })
  }

  const { data, error } = await supabase
    .from('folders')
    .insert({ name: name.trim(), user_id: userId })
    .select()        // .select() returns the newly created row
    .single()        // we only inserted one row, so unwrap the array

  if (error) return res.status(500).json({ error: error.message })

  res.status(201).json(data)
})

router.patch('/:id', requireAuth, async (req, res) => {
  const supabase = getSupabase()
  const { id } = req.params           // folder UUID from the URL
  const { name } = req.body
  const userId = req.user.id

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Folder name is required' })
  }

  const { data, error } = await supabase
    .from('folders')
    .update({ name: name.trim() })
    .eq('id', id)
    .eq('user_id', userId)   // IMPORTANT: only update if this user owns it
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

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)   // same safety check

  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: 'Folder deleted' })
})

export default router