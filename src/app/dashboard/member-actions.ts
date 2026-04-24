'use server'

import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { submissions, profiles, notifications, taskAssignments, tasks } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { eq, and, count } from 'drizzle-orm'

export async function submitTaskProof(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const taskId = formData.get('taskId') as string
  const attachmentLink = formData.get('attachmentLink') as string | null

  // Insert submission with status 'Pendente'
  await db.insert(submissions).values({
    taskId,
    memberId: user.id,
    attachmentLink: attachmentLink || null,
    validationStatus: 'Pendente',
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tasks')
}

export async function joinTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Check task limit
  const taskRecord = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (taskRecord.length === 0) throw new Error('Task not found')
  const task = taskRecord[0]

  if (task.maxParticipants !== null) {
    const currentParticipants = await db.select({ value: count() }).from(taskAssignments).where(eq(taskAssignments.taskId, taskId))
    if (currentParticipants[0].value >= task.maxParticipants) {
      throw new Error('Limite de participantes atingido')
    }
  }

  // 2. Check if already joined
  const existing = await db.select().from(taskAssignments).where(and(eq(taskAssignments.taskId, taskId), eq(taskAssignments.userId, user.id))).limit(1)
  if (existing.length > 0) return

  // 3. Join
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

export async function markNotificationAsRead(notificationId: string) {
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId))

  revalidatePath('/dashboard')
}
