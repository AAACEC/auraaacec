import { pgTable, uuid, text, varchar, integer, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { sql } from "drizzle-orm";

export const areaEnum = pgEnum('area', ['100Nossao', 'Produtos', 'Eventos', 'Esportes', 'Cultura', 'Marketing', 'Administração']);
export const roleEnum = pgEnum('role', ['Presidência', 'Diretoria', 'Gestão']);
export const statusTaskEnum = pgEnum('status_task', ['Ativa', 'Finalizada']);
export const statusValidationEnum = pgEnum('status_validation', ['Pendente', 'Aprovada', 'Rejeitada']);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // Linked to Supabase Auth
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  nickname: varchar('nickname', { length: 255 }).notNull(),
  studentId: varchar('student_id', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 14 }).notNull(), // Added CPF
  course: varchar('course', { length: 255 }).notNull(),
  entryYear: varchar('entry_year', { length: 255 }).notNull(),
  favoriteSong: varchar('favorite_song', { length: 255 }),
  role: roleEnum('role').default('Gestão').notNull(),
  accumulatedAura: integer('accumulated_aura').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  requiresAttachment: boolean('requires_attachment').default(true).notNull(), // Toggle
  auraValue: integer('aura_value').notNull(),
  originArea: areaEnum('origin_area').notNull(),
  maxParticipants: integer('max_participants').notNull(),
  createdBy: uuid('created_by').references(() => profiles.id).notNull(),
  status: statusTaskEnum('status').default('Ativa').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  memberId: uuid('member_id').references(() => profiles.id).notNull(),
  attachmentLink: varchar('attachment_link', { length: 2048 }), // Nullable here, logic handles requirement
  validationStatus: statusValidationEnum('validation_status').default('Pendente').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const taskAssignments = pgTable('task_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
