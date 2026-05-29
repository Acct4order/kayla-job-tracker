import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function POST(req) {
  try {
    const secret = req.headers.get('x-webhook-secret');
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const job = {
      id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: body.title || 'Untitled',
      company: body.company || 'Unknown',
      location: body.location || 'Toronto, ON',
      workMode: body.workMode || 'On-site',
      salary: body.salary || 'Not listed',
      posted: new Date().toISOString(),
      description: body.description || '',
      applyLink: body.applyLink || '#',
      source: body.source || 'Email Alert', // Zapier sends "LinkedIn Alert" or "Indeed Alert"
    };

    // Load existing alert jobs, prepend new one, cap at 100
    const existing = (await redis.get('kayla_alert_jobs')) || [];
    const updated = [job, ...existing].slice(0, 100);
    await redis.set('kayla_alert_jobs', updated);

    return NextResponse.json({ ok: true, job });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
