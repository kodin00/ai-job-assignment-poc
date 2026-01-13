import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

const sqlite = new Database('data/jobs.db', { create: true });
export const db = drizzle(sqlite, { schema });

// Enable foreign keys
sqlite.exec('PRAGMA foreign_keys = ON;');
