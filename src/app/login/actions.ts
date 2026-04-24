'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithGoogle() {
  const supabase = await createClient()

  // Base URL para fallback
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (data.url) {
    redirect(data.url) // Redireciona para o Google OAuth
  }

  if (error) {
    console.error('Login error:', error.message)
    redirect('/login?error=true')
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
