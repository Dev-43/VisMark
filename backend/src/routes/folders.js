import express from 'express'
import { createClient } from '@supabase/supabase-js'
import requireAuth from '../middleware/auth.js'
import { inviteRateLimiter } from '../middleware/rateLimiter.js'

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

// Invite a user to a folder (Owner only)
router.post('/:id/invites', inviteRateLimiter, async (req, res) => {
  const supabase = getSupabase()
  const { id } = req.params
  const userId = req.user.id
  let { username, role } = req.body

  if (!username) {
    return res.status(400).json({ error: 'Username is required' })
  }

  username = username.trim().toLowerCase()
  role = role || 'editor'

  if (role !== 'editor' && role !== 'viewer') {
    return res.status(400).json({ error: 'Invalid role. Must be editor or viewer.' })
  }

  // 1. Verify caller is the owner of the folder
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
    return res.status(403).json({ error: 'Only the folder owner can invite members' })
  }

  // 2. Prevent self-invite
  if (req.user.username === username) {
    return res.status(400).json({ error: 'You cannot invite yourself' })
  }

  // 3. Find target user
  const { data: targetProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .maybeSingle()

  if (profileError) {
    return res.status(500).json({ error: profileError.message })
  }

  if (!targetProfile) {
    return res.status(404).json({ error: 'User not found' })
  }

  // 4. Check if already a member
  const { data: existingMember, error: existingMemberError } = await supabase
    .from('folder_members')
    .select('role')
    .eq('folder_id', id)
    .eq('user_id', targetProfile.id)
    .maybeSingle()

  if (existingMemberError) {
    return res.status(500).json({ error: existingMemberError.message })
  }

  if (existingMember) {
    return res.status(400).json({ error: `${username} is already a member of this folder` })
  }

  // 5. Check if invite is already pending
  const { data: existingInvite, error: existingInviteError } = await supabase
    .from('folder_invites')
    .select('id')
    .eq('folder_id', id)
    .eq('invited_user', targetProfile.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingInviteError) {
    return res.status(500).json({ error: existingInviteError.message })
  }

  if (existingInvite) {
    return res.status(400).json({ error: `An invite is already pending for ${username}` })
  }

  // 6. Create the invite
  const { data: newInvite, error: inviteCreateError } = await supabase
    .from('folder_invites')
    .insert({
      folder_id: id,
      invited_by: userId,
      invited_user: targetProfile.id,
      role,
      status: 'pending'
    })
    .select()
    .single()

  if (inviteCreateError) {
    return res.status(500).json({ error: inviteCreateError.message })
  }

  // 7. Create notification for the invited user
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      recipient_id: targetProfile.id,
      type: 'folder_invite',
      folder_id: id,
      invite_id: newInvite.id,
      status: 'pending'
    })

  if (notificationError) {
    // Cleanup the created invite if notification creation fails
    await supabase.from('folder_invites').delete().eq('id', newInvite.id)
    return res.status(500).json({ error: 'Failed to create invite notification: ' + notificationError.message })
  }

  res.status(201).json(newInvite)
})

// Get pending invites for a folder (Owner only)
router.get('/:id/invites', async (req, res) => {
  const supabase = getSupabase()
  const { id } = req.params
  const userId = req.user.id

  // 1. Verify caller is the owner of the folder
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
    return res.status(403).json({ error: 'Only the folder owner can view invites' })
  }

  // 2. Fetch pending invites and join target profiles to get usernames
  const { data: invites, error: inviteError } = await supabase
    .from('folder_invites')
    .select(`
      id,
      role,
      status,
      created_at,
      invited_user_profile:profiles!invited_user (id, username)
    `)
    .eq('folder_id', id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (inviteError) {
    return res.status(500).json({ error: inviteError.message })
  }

  // Map into a cleaner format for frontend
  const formatted = (invites || []).map(inv => ({
    id: inv.id,
    role: inv.role,
    status: inv.status,
    created_at: inv.created_at,
    invited_user: inv.invited_user_profile
  }))

  res.json(formatted)
})

// Cancel a pending invite (Owner only)
router.delete('/:id/invites/:inviteId', async (req, res) => {
  const supabase = getSupabase()
  const { id, inviteId } = req.params
  const userId = req.user.id

  // 1. Verify caller is the owner of the folder
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
    return res.status(403).json({ error: 'Only the folder owner can cancel invites' })
  }

  // 2. Delete the invite (making sure it belongs to the folder and is pending)
  const { error: deleteError } = await supabase
    .from('folder_invites')
    .delete()
    .eq('id', inviteId)
    .eq('folder_id', id)
    .eq('status', 'pending')

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message })
  }

  res.json({ message: 'Invite cancelled successfully' })
})

export default router