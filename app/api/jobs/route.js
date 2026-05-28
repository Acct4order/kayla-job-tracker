import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to return cached jobs first
    const cached = await redis.get('kayla_jobs');
    if (cached) {
      return NextResponse.json({ data: cached, source: 'cache' });
    }

    // No cache — fetch fresh from JSearch
    return await fetchAndStore();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  // Called by Zapier webhook — always fetch fresh
  try {
    return await fetchAndStore();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchAndStore() {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RAPIDAPI_KEY not set' }, { status: 500 });
  }

  const queries = [
    'Operations Manager Toronto Ontario Canada',
    'Administration Manager Toronto Ontario Canada',
    'Office Manager Toronto Ontario Canada',
    'Executive Manager Toronto Ontario Canada',
  ];

  const allJobs = [];
  for (const q of queries) {
    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(q)}&page=1&num_pages=2&date_posted=month`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
        cache: 'no-store',
      }
    );
    const data = await response.json();
    if (data.data) allJobs.push(...data.data);
  }

  // Deduplicate by job_id
  const seen = new Set();
  const unique = allJobs.filter(j => !seen.has(j.job_id) && seen.add(j.job_id));

  if (unique.length > 0) {
    await redis.set('kayla_jobs', unique, { ex: 7200 });
  }

  return NextResponse.json({ data: unique });
}
