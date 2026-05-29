import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function GET() {
  await redis.del('kayla_alert_jobs');
  return NextResponse.json({ ok: true, message: 'Alert jobs cleared' });
}
