import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { logActivity } from '../utils/activity.js'

const getSupabase = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const router = express.Router()

// Get all pending notifications for the logged-in user
router.get('/', async (req, res) => {
  const supabase = getSupabase()
  const userId = req.user.id

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
      id,
      type,
      status,
      created_at,
      folder_id,
      invite_id,
      folder:folders (id, name),
      invite:folder_invites (
        id,
        role,
        status,
        invited_by_profile:profiles!invited_by (id, username)
      )
    `)
    .eq('recipient_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Format response for easier front-end consumption
  const formatted = (notifications || []).map(notif => ({
    id: notif.id,
    type: notif.type,
    status: notif.status,
    created_at: notif.created_at,
    folder: notif.folder,
    role: notif.invite?.role || 'editor',
    sender: notif.invite?.invited_by_profile?.username || 'unknown'
  }))

  res.json(formatted)
})

// Accept folder invite notification
router.post('/:id/accept', async (req, res) => {
  const supabase = getSupabase()
  const { id } = req.params
  const userId = req.user.id

  // 1. Fetch the notification to verify ownership and get details
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select(`
      id,
      status,
      folder_id,
      invite_id,
      recipient_id,
      invite:folder_invites (
        id,
        role,
        status
      )
    `)
    .eq('id', id)
    .single()

  if (fetchError || !notification) {
    return res.status(404).json({ error: 'Notification not found' })
  }

  // IDOR check: ensure the notification belongs to the calling user
  if (notification.recipient_id !== userId) {
    return res.status(403).json({ error: 'Access denied: notification belongs to another user' })
  }

  if (notification.status !== 'pending' || !notification.invite || notification.invite.status !== 'pending') {
    return res.status(400).json({ error: 'This invitation is no longer pending' })
  }

  // 2. Add the user to the folder members
  const { error: memberInsertError } = await supabase
    .from('folder_members')
    .insert({
      folder_id: notification.folder_id,
      user_id: userId,
      role: notification.invite.role
    })

  if (memberInsertError) {
    return res.status(500).json({ error: 'Failed to join folder: ' + memberInsertError.message })
  }

  // Log activity
  await logActivity(notification.folder_id, userId, 'member_joined', userId)

  // 3. Update the invite status
  const { error: inviteUpdateError } = await supabase
    .from('folder_invites')
    .update({ status: 'accepted' })
    .eq('id', notification.invite_id)

  if (inviteUpdateError) {
    console.error('Failed to update invite status:', inviteUpdateError)
    // We continue since the member is already added, but log the error
  }

  // 4. Update the notification status
  const { error: notifUpdateError } = await supabase
    .from('notifications')
    .update({ status: 'accepted' })
    .eq('id', id)

  if (notifUpdateError) {
    console.error('Failed to update notification status:', notifUpdateError)
  }

  res.json({ message: 'Invitation accepted successfully' })
})

// Decline folder invite notification
router.post('/:id/decline', async (req, res) => {
  const supabase = getSupabase()
  const { id } = req.params
  const userId = req.user.id

  // 1. Fetch the notification to verify ownership
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('id, status, invite_id, recipient_id')
    .eq('id', id)
    .single()

  if (fetchError || !notification) {
    return res.status(404).json({ error: 'Notification not found' })
  }

  // IDOR check: ensure notification belongs to the calling user
  if (notification.recipient_id !== userId) {
    return res.status(403).json({ error: 'Access denied: notification belongs to another user' })
  }

  if (notification.status !== 'pending') {
    return res.status(400).json({ error: 'This notification is no longer pending' })
  }

  // 2. Update invite status to declined
  if (notification.invite_id) {
    const { error: inviteUpdateError } = await supabase
      .from('folder_invites')
      .update({ status: 'declined' })
      .eq('id', notification.invite_id)

    if (inviteUpdateError) {
      console.error('Failed to update invite status:', inviteUpdateError)
    }
  }

  // 3. Update notification status to declined
  const { error: notifUpdateError } = await supabase
    .from('notifications')
    .update({ status: 'declined' })
    .eq('id', id)

  if (notifUpdateError) {
    return res.status(500).json({ error: 'Failed to decline invitation: ' + notifUpdateError.message })
  }

  res.json({ message: 'Invitation declined successfully' })
})

export default router
