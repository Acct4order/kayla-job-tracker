import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Parse LinkedIn subject: "keyword": Company - Job Title posted on date
const parseLinkedInSubject = (subject) => {
  if (!subject) return { title: 'Untitled', company: 'Unknown' };

  // Format: "Operations Manager Toronto": Lysander Funds Limited - Operations Manager posted on 5/27/26
  const match = subject.match(/^"?[^":]+"?\s*:\s*(.+?)\s*-\s*(.+?)\s*(posted on|$)/i);
  if (match) {
    return {
      company: match[1].trim(),
      title: match[2].trim().replace(/posted on.*/i, '').trim(),
    };
  }

  // Fallback: strip "posted on..." and use whole subject as title
  return {
    title: subject.replace(/posted on.*/i, '').trim(),
    company: 'Unknown',
  };
};

// Parse Indeed subject: "Job Title - Company - Location"
const parseIndeedSubject = (subject) => {
  if (!subject) return { title: 'Untitled', company: 'Unknown' };

  // Indeed format varies, try "Title at Company" or "Title - Company"
  const atMatch = subject.match(/^(.+?)\s+at\s+(.+?)(\s*-|$)/i);
  if (atMatch) {
    return { title: atMatch[1].trim(), company: atMatch[2].trim() };
  }

  const dashMatch = subject.match(/^(.+?)\s*-\s*(.+?)(\s*-|$)/i);
  if (dashMatch) {
    return { title: dashMatch[1].trim(), company: dashMatch[2].trim() };
  }

  return { title: subject.trim(), company: 'Unknown' };
};

export async function POST(req) {
  try {
    const secret = req.headers.get('x-webhook-secret');
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const source = body.source || 'Email Alert';

    // Parse title and company based on source
    let parsed;
    if (source === 'LinkedIn Alert') {
      parsed = parseLinkedInSubject(body.title);
    } else if (source === 'Indeed Alert') {
      parsed = parseIndeedSubject(body.title);
    } else {
      parsed = {
        title: body.title || 'Untitled',
        company: body.company || 'Unknown',
      };
    }

    const job = {
      id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: parsed.title || 'Untitled',
      company: parsed.company || 'Unknown',
      location: body.location || 'Toronto, ON',
      workMode: body.workMode || 'On-site',
      salary: body.salary || 'Not listed',
      posted: new Date().toISOString(),
      description: body.description || '',
      applyLink: body.applyLink || '#',
      source,
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
