'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? null)
    }
    getUser()
  }, [])

  useEffect(() => {
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('TOKEN:', session?.access_token)
  }
  getToken()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }


  return (
    <div style={{ padding: '40px' }}>
      <h1>Dashboard</h1>
      <p>Logged in as: {email}</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  )
}
