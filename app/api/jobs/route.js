import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const alertJobs = (await redis.get('kayla_alert_jobs')) || [];

    // JSearch is DISABLED — running on alert jobs only (LinkedIn + Indeed)
    // To re-enable: restore the fetchAndStore() call and set RAPIDAPI_KEY
    return NextResponse.json({ 
      data: alertJobs, 
      source: 'alerts_only',
      jsearch: 'disabled',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST kept for manual refresh — also returns alerts only
export async function POST() {
  try {
    const alertJobs = (await redis.get('kayla_alert_jobs')) || [];
    return NextResponse.json({ 
      data: alertJobs, 
      source: 'alerts_only',
      jsearch: 'disabled',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
