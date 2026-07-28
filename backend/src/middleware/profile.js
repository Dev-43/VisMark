import { createClient } from '@supabase/supabase-js'

async function requireProfile(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', req.user.id)
    .single()

  if (error || !profile) {
    return res.status(403).json({ error: 'Profile setup required', code: 'PROFILE_REQUIRED' })
  }

  req.user.username = profile.username
  next()
}

export default requireProfile
