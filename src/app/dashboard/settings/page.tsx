import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Configurações",
};

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRecord = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1)
  if (profileRecord.length === 0) redirect('/onboarding')

  const profile = profileRecord[0]

  return (
    <div className="container mx-auto py-10 px-4 space-y-10">
      <SettingsForm profile={profile} />
    </div>
  )
}
