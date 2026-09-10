import express from 'express'
import { createClient } from '@supabase/supabase-js'
import requireAuth from '../middleware/auth.js'
import { inviteRateLimiter } from '../middleware/rateLimiter.js'
import { logActivity } from '../utils/activity.js'

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

  // 1. Fetch folder name
  const { data: folder } = await supabase
    .from('folders')
    .select('name')
    .eq('id', id)
    .single()

  const folderName = folder?.name || 'A shared folder'

  // 2. Fetch all other active members in the folder
  const { data: otherMembers } = await supabase
    .from('folder_members')
    .select('user_id')
    .eq('folder_id', id)
    .neq('user_id', userId)

  // 3. Notify all other members about folder deletion
  if (otherMembers && otherMembers.length > 0) {
    const notificationsData = otherMembers.map(m => ({
      recipient_id: m.user_id,
      type: `folder_deleted:${folderName}`,
      folder_id: null,
      status: 'pending'
    }))
    const { error: notifErr } = await supabase.from('notifications').insert(notificationsData)
    if (notifErr) {
      console.error('Failed to notify members of folder deletion:', notifErr.message)
    }
  }

  // 4. Log activity
  await logActivity(id, userId, 'delete_initiated');

  // 5. Delete folder (cascades to links, folder_members, folder_invites)
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: 'Folder deleted and all members notified' })
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

  // Log activity
  await logActivity(id, userId, 'member_invited', targetProfile.id)

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

// Get folder activity log (any member can view)
router.get('/:id/activity', requireAuth, async (req, res) => {
  const supabase = getSupabase()
  const { id } = req.params
  const userId = req.user.id

  // Verify caller is a member of the folder
  const { data: membership, error: memberError } = await supabase
    .from('folder_members')
    .select('role')
    .eq('folder_id', id)
    .eq('user_id', userId)
    .single()

  if (memberError || !membership) {
    return res.status(404).json({ error: 'Folder not found or access denied' })
  }

  // Fetch activity entries with the acting user's username
  const { data: activities, error: activityError } = await supabase
    .from('folder_activity')
    .select(`
      id,
      action,
      target_id,
      created_at,
      user:profiles!user_id (id, username)
    `)
    .eq('folder_id', id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (activityError) {
    return res.status(500).json({ error: activityError.message })
  }

  // Format for frontend
  const formatted = (activities || []).map(a => ({
    id: a.id,
    action: a.action,
    target_id: a.target_id,
    created_at: a.created_at,
    username: a.user?.username || 'unknown'
  }))

  res.json(formatted)
})

// Get members of a folder (any member of the folder can query this)
router.get('/:id/members', requireAuth, async (req, res) => {
  const supabase = getSupabase()
  const { id } = req.params
  const userId = req.user.id

  // 1. Verify user is a member of the folder
  const { data: membership, error: memberError } = await supabase
    .from('folder_members')
    .select('role')
    .eq('folder_id', id)
    .eq('user_id', userId)
    .single()

  if (memberError || !membership) {
    return res.status(404).json({ error: 'Folder not found or access denied' })
  }

  // 2. Fetch all members with usernames
  const { data: members, error: fetchError } = await supabase
    .from('folder_members')
    .select(`
      id,
      role,
      joined_at,
      user_id,
      user:profiles!user_id (id, username)
    `)
    .eq('folder_id', id)
    .order('joined_at', { ascending: true })

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message })
  }

  // Format response
  const formatted = (members || []).map(m => ({
    id: m.id,
    role: m.role,
    joined_at: m.joined_at,
    user_id: m.user_id,
    username: m.user?.username || 'unknown'
  }))

  res.json(formatted)
})

// Leave a folder or remove a member
router.delete('/:id/members/:targetUserId', requireAuth, async (req, res) => {
  const supabase = getSupabase()
  const { id, targetUserId } = req.params
  const userId = req.user.id
  const copyOwnLinks = req.body.copyOwnLinks === true || req.query.copyOwnLinks === 'true'

  // 1. Fetch source folder information
  const { data: folder, error: folderErr } = await supabase
    .from('folders')
    .select('name')
    .eq('id', id)
    .single()

  if (folderErr || !folder) {
    return res.status(404).json({ error: 'Folder not found' })
  }

  // 2. Verify target user is indeed a member of the folder
  const { data: targetMembership, error: targetMemberError } = await supabase
    .from('folder_members')
    .select('role')
    .eq('folder_id', id)
    .eq('user_id', targetUserId)
    .single()

  if (targetMemberError || !targetMembership) {
    return res.status(404).json({ error: 'Target member not found in this folder' })
  }

  // 3. Verify caller permissions:
  // - If targetUserId === userId: leaving. Allowed for non-owners. Owner cannot leave.
  // - If targetUserId !== userId: removing. Only allowed if caller is the owner of the folder.
  const isLeaving = targetUserId === userId

  if (isLeaving) {
    if (targetMembership.role === 'owner') {
      return res.status(400).json({ error: 'Owner cannot leave without transferring ownership first' })
    }
  } else {
    // Caller must be owner
    const { data: callerMembership, error: callerMemberError } = await supabase
      .from('folder_members')
      .select('role')
      .eq('folder_id', id)
      .eq('user_id', userId)
      .single()

    if (callerMemberError || !callerMembership || callerMembership.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can remove members' })
    }
  }

  // 4. If copyOwnLinks is true, duplicate the links the target user added
  if (copyOwnLinks) {
    // a. Fetch links added by target user in this folder
    const { data: linksToCopy, error: linksError } = await supabase
      .from('links')
      .select('*')
      .eq('folder_id', id)
      .eq('user_id', targetUserId)

    if (linksError) {
      return res.status(500).json({ error: 'Failed to fetch links for duplication: ' + linksError.message })
    }

    if (linksToCopy && linksToCopy.length > 0) {
      // b. Create a new personal folder for the target user
      const { data: newFolder, error: newFolderError } = await supabase
        .from('folders')
        .insert({
          name: `${folder.name} (Copy)`,
          user_id: targetUserId
        })
        .select()
        .single()

      if (newFolderError) {
        return res.status(500).json({ error: 'Failed to create personal copy folder: ' + newFolderError.message })
      }

      // c. Add target user as owner of the new folder in folder_members
      const { error: newMemberError } = await supabase
        .from('folder_members')
        .insert({
          folder_id: newFolder.id,
          user_id: targetUserId,
          role: 'owner'
        })

      if (newMemberError) {
        // Rollback folder creation
        await supabase.from('folders').delete().eq('id', newFolder.id)
        return res.status(500).json({ error: 'Failed to set owner of copied folder: ' + newMemberError.message })
      }

      // d. Copy the links into the new folder
      const linksData = linksToCopy.map(link => ({
        folder_id: newFolder.id,
        user_id: targetUserId,
        url: link.url,
        title: link.title,
        description: link.description,
        personal_description: link.personal_description || null,
        screenshot_url: link.screenshot_url,
        favicon_url: link.favicon_url,
        snapshot_status: link.snapshot_status
      }))

      const { error: insertLinksError } = await supabase
        .from('links')
        .insert(linksData)

      if (insertLinksError) {
        // Cleanup folder (which cascades to folder_members)
        await supabase.from('folders').delete().eq('id', newFolder.id)
        return res.status(500).json({ error: 'Failed to copy links: ' + insertLinksError.message })
      }
    }
  }

  // 5. Log activity
  const action = isLeaving ? 'member_left' : 'member_removed'
  await logActivity(id, userId, action, targetUserId)

  // 6. Delete the membership row
  const { error: deleteError } = await supabase
    .from('folder_members')
    .delete()
    .eq('folder_id', id)
    .eq('user_id', targetUserId)

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message })
  }

  res.json({ message: isLeaving ? 'Successfully left the folder' : 'Member removed successfully' })
})

// Transfer ownership of a folder (Owner only)
router.post('/:id/transfer-ownership', requireAuth, async (req, res) => {
  const supabase = getSupabase()
  const { id } = req.params
  const userId = req.user.id
  const { newOwnerId } = req.body

  if (!newOwnerId) {
    return res.status(400).json({ error: 'newOwnerId is required' })
  }

  if (newOwnerId === userId) {
    return res.status(400).json({ error: 'You are already the owner of this folder' })
  }

  // 1. Verify caller is currently the owner of the folder
  const { data: callerMembership, error: callerError } = await supabase
    .from('folder_members')
    .select('role')
    .eq('folder_id', id)
    .eq('user_id', userId)
    .single()

  if (callerError || !callerMembership) {
    return res.status(404).json({ error: 'Folder not found or access denied' })
  }

  if (callerMembership.role !== 'owner') {
    return res.status(403).json({ error: 'Only the folder owner can transfer ownership' })
  }

  // 2. Verify new owner is an existing member of the folder
  const { data: targetMembership, error: targetError } = await supabase
    .from('folder_members')
    .select('role')
    .eq('folder_id', id)
    .eq('user_id', newOwnerId)
    .single()

  if (targetError || !targetMembership) {
    return res.status(404).json({ error: 'Target user is not a member of this folder' })
  }

  // 3. Demote caller to 'editor'
  const { error: demoteError } = await supabase
    .from('folder_members')
    .update({ role: 'editor' })
    .eq('folder_id', id)
    .eq('user_id', userId)

  if (demoteError) {
    return res.status(500).json({ error: 'Failed to update former owner role: ' + demoteError.message })
  }

  // 4. Promote new owner to 'owner'
  const { error: promoteError } = await supabase
    .from('folder_members')
    .update({ role: 'owner' })
    .eq('folder_id', id)
    .eq('user_id', newOwnerId)

  if (promoteError) {
    // Attempt rollback: restore caller as owner
    await supabase.from('folder_members').update({ role: 'owner' }).eq('folder_id', id).eq('user_id', userId)
    return res.status(500).json({ error: 'Failed to promote new owner: ' + promoteError.message })
  }

  // 5. Update folders.user_id to point to the new owner
  const { error: folderUpdateError } = await supabase
    .from('folders')
    .update({ user_id: newOwnerId })
    .eq('id', id)

  if (folderUpdateError) {
    console.error('Warning: failed to update folders.user_id:', folderUpdateError.message)
  }

  // 6. Log activity
  await logActivity(id, userId, 'ownership_transferred', newOwnerId)

  res.json({ message: 'Ownership transferred successfully', newOwnerId })
})

export default router