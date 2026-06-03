'use client'

import { createClient } from '@/lib/supabase'

export default function LoginPage() {
    const supabase = createClient()

    async function handleGoogleLogin() {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    return (
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
      <h1>Welcome to VisMark</h1>
      <button onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
    </div>
    )
}