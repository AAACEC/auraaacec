'use server'

import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { submissions, profiles, notifications, taskAssignments, tasks } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { eq, and, count, inArray, sql } from 'drizzle-orm'

export async function submitTaskProof(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const taskId = formData.get('taskId') as string
  const attachmentLink = formData.get('attachmentLink') as string | null

  // 1. Check if user already has a pending submission for this task
  const existingPending = await db.select().from(submissions).where(
    and(
      eq(submissions.taskId, taskId),
      eq(submissions.memberId, user.id),
      eq(submissions.validationStatus, 'Pendente')
    )
  ).limit(1)

  if (existingPending.length > 0) {
    throw new Error('Você já tem uma entrega pendente para esta task.')
  }

  // 2. Insert submission with status 'Pendente'
  await db.insert(submissions).values({
    taskId,
    memberId: user.id,
    attachmentLink: attachmentLink || null,
    validationStatus: 'Pendente',
  })

  // 3. Remove user from task assignments (they have finished their part)
  await db.delete(taskAssignments).where(
    and(
      eq(taskAssignments.taskId, taskId),
      eq(taskAssignments.userId, user.id)
    )
  )

  // 4. Check for task finalization
  const taskRecord = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (taskRecord.length > 0) {
    const task = taskRecord[0]
    
    // Check if there are any remaining participants still working on the task
    const currentAssignments = await db.select({ value: count() })
      .from(taskAssignments)
      .where(eq(taskAssignments.taskId, taskId))
    
    const remainingParticipants = currentAssignments[0].value

    // Finalize the task if there are no more active participants and the task has a limit
    // (Only the second condition from the previous logic: remainingParticipants === 0)
    if (remainingParticipants === 0) {
      await db.update(tasks)
        .set({ status: 'Finalizada' })
        .where(eq(tasks.id, taskId))

      // Notify the creator
      await db.insert(notifications).values({
        userId: task.createdBy,
        message: `A task "${task.title}" foi finalizada pois todos os participantes atuais enviaram suas provas.`,
      })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tasks')
}

export async function joinTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Check task status
  const taskRecord = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (taskRecord.length === 0) throw new Error('Task not found')
  const task = taskRecord[0]

  if (task.status === 'Finalizada') {
    throw new Error('Esta task já foi finalizada.')
  }

  // 2. Check if already joined or already submitted
  const existingAssignment = await db.select().from(taskAssignments).where(
    and(
      eq(taskAssignments.taskId, taskId),
      eq(taskAssignments.userId, user.id)
    )
  ).limit(1)
  if (existingAssignment.length > 0) return

  const existingSubmission = await db.select().from(submissions).where(
    and(
      eq(submissions.taskId, taskId),
      eq(submissions.memberId, user.id),
      inArray(submissions.validationStatus, ['Pendente', 'Aprovada'])
    )
  ).limit(1)
  if (existingSubmission.length > 0) {
    throw new Error('Você já concluiu ou tem um envio pendente para esta task.')
  }

  // 3. Check task limit (Assignments + Existing Pendente/Aprovada submissions)
  const currentAssignments = await db.select({ value: count() })
    .from(taskAssignments)
    .where(eq(taskAssignments.taskId, taskId))

  const uniqueSubmitters = await db.select({ value: count() }).from(
    db.select({ memberId: submissions.memberId })
      .from(submissions)
      .where(
        and(
          eq(submissions.taskId, taskId),
          inArray(submissions.validationStatus, ['Pendente', 'Aprovada'])
        )
      )
      .groupBy(submissions.memberId)
      .as('sub')
  )

  const totalOccupiedSlots = currentAssignments[0].value + uniqueSubmitters[0].value

  if (totalOccupiedSlots >= task.maxParticipants) {
    throw new Error('Limite de participantes atingido')
  }

  // 4. Join
  await db.insert(taskAssignments).values({
    taskId,
    userId: user.id
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tasks')
}

export async function leaveTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await db.delete(taskAssignments).where(and(eq(taskAssignments.taskId, taskId), eq(taskAssignments.userId, user.id)))

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tasks')
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const nickname = formData.get('nickname') as string
  const course = formData.get('course') as string
  const favoriteSong = formData.get('favoriteSong') as string

  await db.update(profiles)
    .set({ nickname, course, favoriteSong })
    .where(eq(profiles.id, user.id))

  revalidatePath('/dashboard')
}
