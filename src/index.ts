import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { db } from './db';
import { users, jobs, matches } from './db/schema';
import { eq, sql } from 'drizzle-orm';
import { ensureBucketExists, uploadCV } from './services/minio';
import { extractTextFromPDF } from './services/pdf';
import { matchAllUsersToJobs } from './services/gemini';

const app = new Hono();

// Middleware
app.use('/*', cors());
app.use('/static/*', serveStatic({ root: './' }));

// Initialize Minio on startup
ensureBucketExists();

// API Routes

// Get all users
app.get('/api/users', async (c) => {
  const allUsers = await db.select().from(users);
  return c.json(allUsers);
});

// Add new user
app.post('/api/users', async (c) => {
  const body = await c.req.json();
  const { name, email, cvText, skills } = body;

  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      cvText: cvText || null,
      skills: skills || null,
    })
    .returning();

  return c.json(newUser, 201);
});

// Upload CV PDF for user
app.post('/api/users/:id/upload-cv', async (c) => {
  const userId = parseInt(c.req.param('id'));
  const formData = await c.req.formData();
  const file = formData.get('cv') as File;

  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400);
  }

  try {
    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const cvText = await extractTextFromPDF(buffer);

    // Upload to Minio
    const objectName = await uploadCV(file.name, buffer);

    // Update user with CV text and path
    await db
      .update(users)
      .set({
        cvText,
        cvPdfPath: objectName,
      })
      .where(eq(users.id, userId));

    return c.json({ success: true, cvText, path: objectName });
  } catch (error: any) {
    console.error('Upload error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get all jobs
app.get('/api/jobs', async (c) => {
  const allJobs = await db.select().from(jobs);
  return c.json(allJobs);
});

// Add new job
app.post('/api/jobs', async (c) => {
  const body = await c.req.json();
  const { title, description, requirements, location, salary } = body;

  const [newJob] = await db
    .insert(jobs)
    .values({
      title,
      description,
      requirements,
      location: location || null,
      salary: salary || null,
    })
    .returning();

  return c.json(newJob, 201);
});

// Get all matches
app.get('/api/matches', async (c) => {
  const allMatches = await db
    .select({
      id: matches.id,
      userId: matches.userId,
      jobId: matches.jobId,
      compatibilityScore: matches.compatibilityScore,
      reasoning: matches.reasoning,
      matchedAt: matches.matchedAt,
      userName: users.name,
      jobTitle: jobs.title,
    })
    .from(matches)
    .leftJoin(users, eq(matches.userId, users.id))
    .leftJoin(jobs, eq(matches.jobId, jobs.id));

  return c.json(allMatches);
});

// Trigger AI matching for all users and jobs
app.post('/api/match', async (c) => {
  try {
    const allUsers = await db.select().from(users);
    const allJobs = await db.select().from(jobs).where(eq(jobs.status, 'open'));

    if (allUsers.length === 0 || allJobs.length === 0) {
      return c.json({ error: 'No users or jobs to match' }, 400);
    }

    // Clear previous matches
    await db.delete(matches);

    // Run AI matching
    const aiMatches = await matchAllUsersToJobs(allUsers, allJobs);

    // Insert new matches
    if (aiMatches.length > 0) {
      await db.insert(matches).values(
        aiMatches.map((match) => ({
          userId: match.userId,
          jobId: match.jobId,
          compatibilityScore: match.score,
          reasoning: match.reasoning,
        }))
      );
    }

    return c.json({ success: true, matchCount: aiMatches.length });
  } catch (error: any) {
    console.error('Matching error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete user
app.delete('/api/users/:id', async (c) => {
  const userId = parseInt(c.req.param('id'));
  await db.delete(users).where(eq(users.id, userId));
  return c.json({ success: true });
});

// Delete job
app.delete('/api/jobs/:id', async (c) => {
  const jobId = parseInt(c.req.param('id'));
  await db.delete(jobs).where(eq(jobs.id, jobId));
  return c.json({ success: true });
});

// Serve frontend
app.get('/', serveStatic({ path: './static/index.html' }));

const port = parseInt(process.env.PORT || '5555');
console.log(`🚀 Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
