'use server'

import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { tasks, submissions, profiles, notifications, taskAssignments } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Auth & Role Helper
async function checkAdminOrDirector() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const userProfileRecord = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1)
  if (userProfileRecord.length === 0) throw new Error('Profile not found')

  const profile = userProfileRecord[0]
  if (profile.role !== 'Presidência' && profile.role !== 'Diretoria') {
    throw new Error('Forbidden')
  }

  return profile
}

export async function createTask(formData: FormData) {
  const profile = await checkAdminOrDirector()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const originArea = formData.get('originArea') as any
  const auraValue = parseInt(formData.get('auraValue') as string, 10)
  const maxParticipantsRaw = formData.get('maxParticipants') as string
  const maxParticipants = parseInt(maxParticipantsRaw, 10) || 1
  const requiresAttachment = formData.get('requiresAttachment') === 'on'
  
  // New: Get assigned members from form
  const assignedMemberIds = formData.getAll('assignedMembers') as string[]

  // 1. Insert Task
  const [insertedTask] = await db.insert(tasks).values({
    title,
    description,
    originArea,
    auraValue,
    maxParticipants,
    requiresAttachment,
    createdBy: profile.id,
    status: 'Ativa'
  }).returning({ id: tasks.id })

  // 2. Insert Initial Assignments
  if (insertedTask && assignedMemberIds.length > 0) {
    // Only insert up to the limit (security check)
    const membersToAssign = maxParticipants 
      ? assignedMemberIds.slice(0, maxParticipants) 
      : assignedMemberIds

    for (const memberId of membersToAssign) {
      await db.insert(taskAssignments).values({
        taskId: insertedTask.id,
        userId: memberId
      })
      
      // Notify them
      await db.insert(notifications).values({
        userId: memberId,
        message: `Você foi escalado para a task: "${title}".`,
      })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tasks')
}

export async function validateSubmission(formData: FormData) {
  await checkAdminOrDirector()

  const submissionId = formData.get('submissionId') as string
  const status = formData.get('status') as 'Aprovada' | 'Rejeitada'

  // Fetch submission
  const submissionRecord = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1)
  if (submissionRecord.length === 0) return
  
  const sub = submissionRecord[0]
  if (sub.validationStatus !== 'Pendente') return

  // Fetch task info
  const taskRecord = await db.select().from(tasks).where(eq(tasks.id, sub.taskId)).limit(1)
  if (taskRecord.length === 0) return
  const task = taskRecord[0]

  // Update submission status
  await db.update(submissions)
    .set({ validationStatus: status })
    .where(eq(submissions.id, submissionId))

  if (status === 'Aprovada') {
    // Grant Aura ONLY to the submitter
    const memberRecord = await db.select().from(profiles).where(eq(profiles.id, sub.memberId)).limit(1)
    if (memberRecord.length > 0) {
      const member = memberRecord[0]
      await db.update(profiles)
        .set({ accumulatedAura: member.accumulatedAura + task.auraValue })
        .where(eq(profiles.id, member.id))
      
      // Notify submitter
      await db.insert(notifications).values({
        userId: member.id,
        message: `Sua task "${task.title}" foi aprovada! Você ganhou ${task.auraValue} AURA.`,
      })
    }
    
    // Remove ONLY this person from the task assignments
    await db.delete(taskAssignments).where(and(eq(taskAssignments.taskId, task.id), eq(taskAssignments.userId, sub.memberId)))

  } else if (status === 'Rejeitada') {
    await db.insert(notifications).values({
      userId: sub.memberId,
      message: `Sua prova para "${task.title}" foi rejeitada. Verifique com a diretoria.`,
    })

    // Re-open the task if it was finalized, as there is now an open slot again
    if (task.status === 'Finalizada') {
      await db.update(tasks).set({ status: 'Ativa' }).where(eq(tasks.id, task.id))
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tasks')
}

export async function updateUserRole(formData: FormData) {
  const admin = await checkAdminOrDirector()
  if (admin.role !== 'Presidência') {
    throw new Error('Apenas a Presidência pode gerenciar cargos.')
  }

  const userId = formData.get('userId') as string
  const newRole = formData.get('role') as 'Presidência' | 'Diretoria' | 'Gestão'

  await db.update(profiles)
    .set({ role: newRole })
    .where(eq(profiles.id, userId))

  revalidatePath('/dashboard')
}

export async function deleteTask(formData: FormData) {
  await checkAdminOrDirector()
  const taskId = formData.get('taskId') as string
  await db.delete(tasks).where(eq(tasks.id, taskId))
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tasks')
}

export async function updateTask(formData: FormData) {
  await checkAdminOrDirector()

  const taskId = formData.get('taskId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const originArea = formData.get('originArea') as any
  const auraValue = parseInt(formData.get('auraValue') as string, 10)
  const maxParticipantsRaw = formData.get('maxParticipants') as string
  const maxParticipants = parseInt(maxParticipantsRaw, 10) || 1
  const requiresAttachment = formData.get('requiresAttachment') === 'on'

  await db.update(tasks)
    .set({ 
      title, 
      description, 
      originArea, 
      auraValue, 
      maxParticipants,
      requiresAttachment
    })
    .where(eq(tasks.id, taskId))

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tasks')
}

export async function finalizeTask(taskId: string) {
  await checkAdminOrDirector()
  
  await db.update(tasks)
    .set({ status: 'Finalizada' })
    .where(eq(tasks.id, taskId))

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tasks')
}

export async function grantAuraDirectly(taskId: string, memberId: string) {
  await checkAdminOrDirector()

  // 1. Get task info
  const taskRecord = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (taskRecord.length === 0) throw new Error('Task not found')
  const task = taskRecord[0]

  // 2. Create an approved submission
  await db.insert(submissions).values({
    taskId,
    memberId,
    attachmentLink: 'Atribuído manualmente pela diretoria',
    validationStatus: 'Aprovada'
  })

  // 3. Grant Aura
  const memberRecord = await db.select().from(profiles).where(eq(profiles.id, memberId)).limit(1)
  if (memberRecord.length > 0) {
    const member = memberRecord[0]
    await db.update(profiles)
      .set({ accumulatedAura: member.accumulatedAura + task.auraValue })
      .where(eq(profiles.id, member.id))
    
    // Notify
    await db.insert(notifications).values({
      userId: member.id,
      message: `Você recebeu ${task.auraValue} AURA manualmente da diretoria pela task "${task.title}".`,
    })
  }

  // 4. Remove from assignments if there
  await db.delete(taskAssignments).where(and(eq(taskAssignments.taskId, taskId), eq(taskAssignments.userId, memberId)))

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tasks')
}

