import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Logs folder activity to the database.
 * @param {string} folderId 
 * @param {string} userId 
 * @param {string} action 
 * @param {string|null} targetId 
 */
export async function logActivity(folderId, userId, action, targetId = null) {
  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('folder_activity')
      .insert({
        folder_id: folderId,
        user_id: userId,
        action,
        target_id: targetId
      })
    if (error) {
      console.error(`Failed to log activity [${action}] on folder [${folderId}]:`, error.message)
    }
  } catch (err) {
    console.error(`Exception in logActivity [${action}]:`, err)
  }
}
