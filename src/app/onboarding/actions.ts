'use server'

import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Extract form data
  const fullName = formData.get('fullName') as string
  const nickname = formData.get('nickname') as string
  const studentId = formData.get('studentId') as string
  const cpf = formData.get('cpf') as string
  const course = formData.get('course') as string
  const entryYear = formData.get('entryYear') as string
  const favoriteSong = formData.get('favoriteSong') as string

  // Insert profile into database
  try {
    await db.insert(profiles).values({
      id: user.id, // Linking to Supabase Auth ID
      email: user.email!, // Email from Auth
      fullName,
      nickname,
      studentId,
      cpf,
      course,
      entryYear,
      favoriteSong,
      role: 'Gestão', // Default role is Gestão
      accumulatedAura: 0,
    })
  } catch (error) {
    console.error('Failed to create profile:', error)
    // Here we could return an error to display on the client
    // For now we will just redirect to the error page or back to onboarding
    redirect('/onboarding?error=creation-failed')
  }

  // Redirect to dashboard after successful profile creation
  redirect('/dashboard')
}
