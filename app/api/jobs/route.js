import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [cached, alertJobs] = await Promise.all([
      redis.get('kayla_jobs'),
      redis.get('kayla_alert_jobs'),
    ]);

    if (cached) {
      // Merge JSearch jobs + email alert jobs, alert jobs go first
      const merged = [...(alertJobs || []), ...cached];
      return NextResponse.json({ data: merged, source: 'cache' });
    }

    return await fetchAndStore(alertJobs || []);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const alertJobs = (await redis.get('kayla_alert_jobs')) || [];
    return await fetchAndStore(alertJobs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchAndStore(alertJobs = []) {
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

  const seen = new Set();
  const unique = allJobs.filter(j => !seen.has(j.job_id) && seen.add(j.job_id));

  if (unique.length > 0) {
    await redis.set('kayla_jobs', unique, { ex: 7200 });
  }

  // Always merge with alert jobs in response
  const merged = [...alertJobs, ...unique];
  return NextResponse.json({ data: merged });
}
