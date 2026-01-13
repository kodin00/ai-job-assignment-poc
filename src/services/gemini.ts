import { GoogleGenAI } from '@google/genai';
import type { User, Job } from '../db/schema';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function matchUserToJobs(user: User, jobs: Job[]) {
  const prompt = `You are an expert job matching AI. Analyze the candidate's CV and match them with suitable jobs.

**Candidate Information:**
Name: ${user.name}
Email: ${user.email}
Skills: ${user.skills || 'Not specified'}
CV Content: ${user.cvText || 'No CV text available'}

**Available Jobs:**
${jobs.map((job, idx) => `
Job ${idx + 1} (ID: ${job.id}):
- Title: ${job.title}
- Description: ${job.description}
- Requirements: ${job.requirements}
- Location: ${job.location || 'Not specified'}
- Salary: ${job.salary || 'Not specified'}
`).join('\n')}

For each job, provide:
1. A compatibility score from 0-100
2. Brief reasoning (1-2 sentences)

Respond in JSON format:
{
  "matches": [
    {
      "jobId": <job_id>,
      "jobTitle": "<job_title>",
      "score": <0-100>,
      "reasoning": "<brief explanation>"
    }
  ]
}

Only include jobs with a score of 30 or higher.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';

    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[1]);
    return parsed.matches || [];
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export async function matchAllUsersToJobs(users: User[], jobs: Job[]) {
  const allMatches: Array<{
    userId: number;
    jobId: number;
    score: number;
    reasoning: string;
  }> = [];

  for (const user of users) {
    if (!user.cvText && !user.skills) {
      continue; // Skip users without CV or skills
    }

    const matches = await matchUserToJobs(user, jobs);

    for (const match of matches) {
      allMatches.push({
        userId: user.id,
        jobId: match.jobId,
        score: match.score,
        reasoning: match.reasoning,
      });
    }
  }

  return allMatches;
}
