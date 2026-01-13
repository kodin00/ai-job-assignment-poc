import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import { mkdirSync, existsSync } from 'fs';

// Ensure data directory exists
if (!existsSync('data')) {
  mkdirSync('data', { recursive: true });
}

const sqlite = new Database('data/jobs.db', { create: true });
const db = drizzle(sqlite, { schema });

// Enable foreign keys
sqlite.exec('PRAGMA foreign_keys = ON;');

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    cv_text TEXT,
    cv_pdf_path TEXT,
    skills TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    location TEXT,
    salary TEXT,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    compatibility_score REAL NOT NULL,
    reasoning TEXT,
    matched_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );
`);

console.log('✅ Database setup complete!');
sqlite.close();
