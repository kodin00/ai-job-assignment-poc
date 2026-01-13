import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  cvText: text('cv_text'),
  cvPdfPath: text('cv_pdf_path'),
  skills: text('skills'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements').notNull(),
  location: text('location'),
  salary: text('salary'),
  status: text('status').default('open'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  compatibilityScore: real('compatibility_score').notNull(),
  reasoning: text('reasoning'),
  matchedAt: text('matched_at').default(sql`CURRENT_TIMESTAMP`)
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
