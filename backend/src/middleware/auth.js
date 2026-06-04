import { createClient } from '@supabase/supabase-js'

async function requireAuth(req, res, next) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await supabase.auth.getUser(token)
  
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = data.user
  next()
}

export default requireAuth