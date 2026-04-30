import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { profiles, tasks, submissions, notifications, taskAssignments } from '@/db/schema'
import { eq, desc, and, asc, sql, isNull, or, lt, gte, isNotNull, notExists, inArray } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { DashboardHeader } from '../components/header'
import { BountyBoard } from '../components/bounty-board'
import { RankingFilters } from '@/app/components/ranking-filters'

export default async function TasksPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const area = typeof searchParams.course === 'string' ? searchParams.course : undefined;
  const availability = typeof searchParams.availability === 'string' ? searchParams.availability : undefined;
  const sortBy = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest';
  const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;

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

  // Fetch Notifications for Header
  const userNotifications = await db.select()
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt))

  // 3. Fetch Tasks (Basic Filters)
  const taskFilters = [inArray(tasks.status, ['Ativa', 'Finalizada'])];
  if (area && area !== 'all') taskFilters.push(eq(tasks.originArea, area as any));
  if (query) taskFilters.push(sql`title ilike ${'%' + query + '%'}`);

  // Subquery for assignment counts
  const assignmentCounts = db
    .select({
      taskId: taskAssignments.taskId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(taskAssignments)
    .groupBy(taskAssignments.taskId)
    .as('assignment_counts')

  // Build the availability filter
  let availabilityFilter = undefined
  if (availability === 'available') {
    availabilityFilter = or(
      isNull(assignmentCounts.count),
      lt(assignmentCounts.count, tasks.maxParticipants)
    )
  } else if (availability === 'full') {
    availabilityFilter = gte(assignmentCounts.count, tasks.maxParticipants)
  }

  // Main Query - Hide tasks where user already has an APPROVED submission
  const results = await db
    .select({
      task: tasks,
    })
    .from(tasks)
    .leftJoin(assignmentCounts, eq(tasks.id, assignmentCounts.taskId))
    .where(and(
      ...taskFilters, 
      availabilityFilter,
      // Logic: Only show tasks that the current user hasn't successfully completed yet
      notExists(
        db.select()
          .from(submissions)
          .where(and(
            eq(submissions.taskId, tasks.id),
            eq(submissions.memberId, user.id),
            eq(submissions.validationStatus, 'Aprovada')
          ))
      )
    ))
    .orderBy(sortBy === 'oldest' ? asc(tasks.createdAt) : 
             sortBy === 'aura-high' ? desc(tasks.auraValue) :
             sortBy === 'aura-low' ? asc(tasks.auraValue) :
             desc(tasks.createdAt))
    .limit(100)

  const activeTasksWithCount = results.map(r => r.task)

  // 4. Fetch User Submissions (All status to show on cards)
  const userSubmissions = await db.select({
    id: submissions.id,
    taskId: submissions.taskId,
    attachmentLink: submissions.attachmentLink,
    validationStatus: submissions.validationStatus,
  }).from(submissions).where(eq(submissions.memberId, user.id))

  // 5. Fetch All Task Assignments with Nicknames
  const assignments = await db.select({
    id: taskAssignments.id,
    taskId: taskAssignments.taskId,
    userId: taskAssignments.userId,
    userNickname: profiles.nickname,
  })
  .from(taskAssignments)
  .leftJoin(profiles, eq(taskAssignments.userId, profiles.id))

  const areas = ['100Nossao', 'Produtos', 'Eventos', 'Esportes', 'Cultura', 'Marketing', 'Administração'];

  return (
    <div className="container mx-auto py-10 px-4 space-y-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold tracking-tighter text-primary uppercase">Mural de Tasks</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Confira e participe das demandas da AAACEC.
        </p>
      </div>

      <RankingFilters 
        courses={areas} 
        isTaskPage={true}
      />

      <div className="flex flex-col gap-6">
        <BountyBoard 
          activeTasks={activeTasksWithCount} 
          userSubmissions={userSubmissions} 
          isAdminOrDirector={isPresidencyOrDirector}
          assignments={assignments}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
