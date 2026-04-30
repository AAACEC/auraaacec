import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { profiles, tasks, submissions, notifications } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { ArrowRight, ClipboardList, ShieldCheck, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'

import { DashboardHeader } from './components/header'
import { AdminPanel } from './components/admin-panel'
import { StatsCards } from './components/stats-cards'
import { RecentSubmissions } from './components/recent-submissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const adminArea = typeof searchParams.adminArea === 'string' ? searchParams.adminArea : 'all';

  const supabase = await createClient()

  // 1. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch User Profile
  const userProfileRecord = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1)
  
  if (userProfileRecord.length === 0) {
    redirect('/onboarding')
  }

  const profile = userProfileRecord[0]
  const isPresidencyOrDirector = profile.role === 'Presidência' || profile.role === 'Diretoria'

  // Fetch Notifications
  const userNotifications = await db.select()
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt))

  // 4. Fetch User Submissions (Joined with tasks for history)
  const userSubmissions = await db.select({
    id: submissions.id,
    taskId: submissions.taskId,
    attachmentLink: submissions.attachmentLink,
    validationStatus: submissions.validationStatus,
    createdAt: submissions.createdAt,
    taskTitle: tasks.title,
    auraValue: tasks.auraValue,
  })
  .from(submissions)
  .leftJoin(tasks, eq(submissions.taskId, tasks.id))
  .where(eq(submissions.memberId, user.id))
  .orderBy(desc(submissions.createdAt))
  .limit(10)

  // 5. (Presidência/Diretoria only) Fetch ALL Pending Submissions
  let pendingSubmissions: any[] = []
  let allProfiles: any[] = []
  
  if (isPresidencyOrDirector) {
    const pendingFilters = [eq(submissions.validationStatus, 'Pendente')];
    if (adminArea !== 'all') pendingFilters.push(eq(tasks.originArea, adminArea as any));

    const pendingQuery = await db.select({
      submission: submissions,
      taskTitle: tasks.title,
      taskDescription: tasks.description,
      taskArea: tasks.originArea,
      auraValue: tasks.auraValue,
      memberNickname: profiles.nickname,
      memberFullName: profiles.fullName,
    })
    .from(submissions)
    .leftJoin(tasks, eq(submissions.taskId, tasks.id))
    .leftJoin(profiles, eq(submissions.memberId, profiles.id))
    .where(and(...pendingFilters))
    .orderBy(desc(submissions.createdAt))
    
    pendingSubmissions = pendingQuery

    // Fetch all profiles for both roles to allow escalating members
    allProfiles = await db.select().from(profiles).orderBy(profiles.nickname)
  }

  return (
    <div className="container mx-auto py-10 px-4 space-y-10">
      <DashboardHeader profile={profile} />

      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Seu Desempenho</h2>
        <StatsCards profile={profile} userSubmissions={userSubmissions} />
      </section>

      {isPresidencyOrDirector && (
        <section className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Diretoria</h2>
          <AdminPanel 
            pendingSubmissions={pendingSubmissions} 
            allProfiles={allProfiles} 
            currentRole={profile.role}
          />
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Recursos</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature: Tasks */}
          <Link href="/dashboard/tasks" className="group">
            <Card className="h-full border-2 hover:border-primary/50 transition-all shadow-sm group-active:scale-[0.98]">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">Tasks</CardTitle>
                <CardDescription className="font-medium">
                  Confira o Mural de Tasks da AAACEC.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Feature: Profile */}
          <Link href="/dashboard/settings" className="group">
            <Card className="h-full border-2 hover:border-primary/50 transition-all shadow-sm group-active:scale-[0.98]">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                  <UserCircle className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">Seu Perfil</CardTitle>
                <CardDescription className="font-medium">
                  Personalize as informações do seu perfil.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Feature: Ranking Shortcut */}
          <Link href="/" className="group">
            <Card className="h-full border-2 hover:border-primary/50 transition-all shadow-sm group-active:scale-[0.98]">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">Ver Ranking</CardTitle>
                <CardDescription className="font-medium">
                  Veja a classificação atual do Ranking de Aura.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Histórico</h2>
        <RecentSubmissions userSubmissions={userSubmissions} />
      </section>
    </div>
  )
}
