import Link from "next/link";
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { UserMenu } from "./user-menu";
import { RealtimeNotifications } from "./realtime-notifications";

export async function MainHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null

  if (user) {
    const profileRecord = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1)
    if (profileRecord.length > 0) {
      profile = profileRecord[0]
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-sm">
      {user && <RealtimeNotifications userId={user.id} />}
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link className="flex items-center space-x-2 hover:opacity-90 transition-opacity" href="/">
            <span className="font-extrabold text-2xl tracking-tighter">
              AurAAACEC
            </span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <nav className="flex items-center">
            {profile ? (
              <UserMenu profile={profile} />
            ) : (
              <Link 
                href="/login" 
                className="text-sm font-black uppercase tracking-widest px-4 py-2 rounded-md hover:bg-white hover:text-primary transition-colors"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
