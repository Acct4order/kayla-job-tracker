import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Parse all jobs from LinkedIn email body
const parseLinkedInJobs = (body) => {
  if (!body) return [];

  const jobs = [];
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip footer/header lines
    if (
      line.startsWith('http') ||
      line.startsWith('View job:') ||
      line.startsWith('See all jobs') ||
      line.startsWith('This email') ||
      line.startsWith('Learn why') ||
      line.startsWith('You are receiving') ||
      line.startsWith('Manage your') ||
      line.startsWith('Unsubscribe') ||
      line.startsWith('Job search smarter') ||
      line.startsWith('©') ||
      line.startsWith('LinkedIn') ||
      line.startsWith('---------') ||
      line.startsWith('Results from') ||
      line.startsWith('Your job alert') ||
      line.match(/^\d+ new jobs/) ||
      line.match(/^\d+ company alum/) ||
      line === 'This company is actively hiring' ||
      line === 'Help:'
    ) {
      i++;
      continue;
    }

    // Look for a job title line followed by company and location
    const isJobTitle = (
      line.length > 3 &&
      line.length < 120 &&
      !line.startsWith('http') &&
      !line.includes('@') &&
      !line.match(/^\d{4}/) &&
      !line.includes('linkedin.com')
    );

    if (isJobTitle && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const lineAfter = lines[i + 2] || '';

      const isCompany = (
        nextLine.length > 1 &&
        nextLine.length < 100 &&
        !nextLine.startsWith('http') &&
        !nextLine.match(/^\d+ /) &&
        !nextLine.includes('linkedin.com')
      );

      // Check if line after looks like a location (City, Province)
      const isLocation = lineAfter.match(/^[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}$/);

      if (isCompany && isLocation) {
        // Extract apply link from nearby lines
        let applyLink = '#';
        for (let j = i + 2; j < Math.min(i + 6, lines.length); j++) {
          if (lines[j].startsWith('View job:')) {
            applyLink = lines[j].replace('View job:', '').trim();
            break;
          }
          if (lines[j].startsWith('http') && lines[j].includes('linkedin.com')) {
            applyLink = lines[j].trim();
            break;
          }
        }

        jobs.push({
          title: line.trim(),
          company: nextLine.trim(),
          location: lineAfter.trim(),
          applyLink,
        });

        i += 3;
        continue;
      }
    }

    i++;
  }

  return jobs;
};

// Parse Indeed subject: "Title at Company" or "Title - Company"
const parseIndeedSubject = (subject) => {
  if (!subject) return { title: 'Untitled', company: 'Unknown' };
  const atMatch = subject.match(/^(.+?)\s+at\s+(.+?)(\s*-|$)/i);
  if (atMatch) return { title: atMatch[1].trim(), company: atMatch[2].trim() };
  const dashMatch = subject.match(/^(.+?)\s*-\s*(.+?)(\s*-|$)/i);
  if (dashMatch) return { title: dashMatch[1].trim(), company: dashMatch[2].trim() };
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
    const existing = (await redis.get('kayla_alert_jobs')) || [];
    let newJobs = [];

    if (source === 'LinkedIn Alert') {
      const parsed = parseLinkedInJobs(body.description || '');

      if (parsed.length > 0) {
        newJobs = parsed.map(p => ({
          id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          title: p.title,
          company: p.company,
          location: p.location || body.location || 'Toronto, ON',
          workMode: 'On-site',
          salary: 'Not listed',
          posted: new Date().toISOString(),
          description: body.description || '',
          applyLink: p.applyLink || '#',
          source,
        }));
      } else {
        newJobs = [{
          id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          title: body.title || 'LinkedIn Job',
          company: 'Unknown',
          location: body.location || 'Toronto, ON',
          workMode: 'On-site',
          salary: 'Not listed',
          posted: new Date().toISOString(),
          description: body.description || '',
          applyLink: '#',
          source,
        }];
      }

    } else if (source === 'Indeed Alert') {
      const parsed = parseIndeedSubject(body.title);
      newJobs = [{
        id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        title: parsed.title,
        company: parsed.company,
        location: body.location || 'Toronto, ON',
        workMode: 'On-site',
        salary: 'Not listed',
        posted: new Date().toISOString(),
        description: body.description || '',
        applyLink: body.applyLink || '#',
        source,
      }];

    } else {
      newJobs = [{
        id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        title: body.title || 'Untitled',
        company: body.company || 'Unknown',
        location: body.location || 'Toronto, ON',
        workMode: body.workMode || 'On-site',
        salary: body.salary || 'Not listed',
        posted: new Date().toISOString(),
        description: body.description || '',
        applyLink: body.applyLink || '#',
        source,
      }];
    }

    const updated = [...newJobs, ...existing].slice(0, 200);
    await redis.set('kayla_alert_jobs', updated);

    return NextResponse.json({ ok: true, added: newJobs.length, jobs: newJobs.map(j => ({ title: j.title, company: j.company })) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
