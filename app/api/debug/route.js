import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function GET() {
  const alertJobs = await redis.get('kayla_alert_jobs');
  return NextResponse.json({ 
    alertJobs,
    count: alertJobs ? alertJobs.length : 0 
  });
}
