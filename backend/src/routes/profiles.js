import express from 'express'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const router = express.Router()

// Get my profile
router.get('/me', async (req, res) => {
  const supabase = getSupabase()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single()

  if (error || !profile) {
    return res.status(404).json({ error: 'Profile not found' })
  }

  res.json(profile)
})

// Check if username is available (live validation)
router.get('/check-availability', async (req, res) => {
  const supabase = getSupabase()
  const username = (req.query.username || '').trim().toLowerCase()

  if (!username) {
    return res.status(400).json({ error: 'Username query parameter is required' })
  }

  if (username.length < 3 || username.length > 20) {
    return res.json({ available: false, reason: 'length' })
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return res.json({ available: false, reason: 'format' })
  }

  const { data: existing, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ available: !existing })
})

// Create my profile
router.post('/', async (req, res) => {
  const supabase = getSupabase()
  let { username } = req.body

  if (!username) {
    return res.status(400).json({ error: 'Username is required' })
  }

  username = username.trim().toLowerCase()

  // Validate username format and length
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' })
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain lowercase letters, numbers, and underscores' })
  }

  // Check if username is already taken
  const { data: existing, error: checkError } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle()

  if (checkError) {
    return res.status(500).json({ error: checkError.message })
  }

  if (existing) {
    return res.status(400).json({ error: 'Username is already taken' })
  }

  // Insert the profile
  const { data: profile, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: req.user.id, username })
    .select()
    .single()

  if (insertError) {
    return res.status(500).json({ error: insertError.message })
  }

  res.status(201).json(profile)
})

// Check if username exists (for invite lookup)
router.get('/exists', async (req, res) => {
  const supabase = getSupabase()
  const username = (req.query.username || '').trim().toLowerCase()

  if (!username) {
    return res.status(400).json({ error: 'Username query parameter is required' })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  if (!profile) {
    return res.json({ exists: false })
  }

  res.json({ exists: true, profile })
})

export default router
