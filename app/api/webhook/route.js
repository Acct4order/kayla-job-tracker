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
    ) { i++; continue; }

    const isJobTitle = (
      line.length > 3 && line.length < 120 &&
      !line.startsWith('http') && !line.includes('@') &&
      !line.match(/^\d{4}/) && !line.includes('linkedin.com')
    );

    if (isJobTitle && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const lineAfter = lines[i + 2] || '';

      const isCompany = (
        nextLine.length > 1 && nextLine.length < 100 &&
        !nextLine.startsWith('http') &&
        !nextLine.match(/^\d+ /) &&
        !nextLine.includes('linkedin.com')
      );

      const isLocation = lineAfter.match(/^[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}$/);

      if (isCompany && isLocation) {
        let applyLink = '#';
        for (let j = i + 2; j < Math.min(i + 6, lines.length); j++) {
          if (lines[j].startsWith('View job:')) { applyLink = lines[j].replace('View job:', '').trim(); break; }
          if (lines[j].startsWith('http') && lines[j].includes('linkedin.com')) { applyLink = lines[j].trim(); break; }
        }
        jobs.push({ title: line.trim(), company: nextLine.trim(), location: lineAfter.trim(), applyLink });
        i += 3; continue;
      }
    }
    i++;
  }
  return jobs;
};

// Parse all jobs from Indeed email body
// Indeed format: Title / Company / Location / (optional Salary) / (optional Type) / "View this job: URL"
const parseIndeedJobs = (body) => {
  if (!body) return [];
  const jobs = [];
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

  const isNoise = (l) =>
    l.startsWith('http') || l.startsWith('See all') || l.startsWith('View all') ||
    l.startsWith('Unsubscribe') || l.startsWith('Indeed') || l.startsWith('©') ||
    l.startsWith('You are receiving') || l.startsWith('This email') ||
    l.match(/^\d+\s+new\s+jobs?/i) || l.match(/^new jobs? for you/i) ||
    l.match(/^new jobs? matching/i);

  const isLocation = (l) =>
    /^[A-Z][a-zA-Z\s\-]+,\s*[A-Z]{2}/.test(l) ||
    /\bRemote\b/i.test(l) ||
    /^[A-Z][a-zA-Z\s]+,\s*(Ontario|British Columbia|Alberta|Quebec|Manitoba|Saskatchewan)/i.test(l);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isNoise(line)) { i++; continue; }

    if (i + 2 < lines.length) {
      const nextLine = lines[i + 1];
      const lineAfter = lines[i + 2];

      const looksLikeCompany =
        nextLine.length > 1 && nextLine.length < 100 &&
        !nextLine.startsWith('http') && !isNoise(nextLine) &&
        !isLocation(nextLine);

      if (looksLikeCompany && isLocation(lineAfter)) {
        // Look ahead for salary and apply link
        let salary = 'Not listed';
        let applyLink = '#';
        for (let k = i + 3; k < Math.min(i + 8, lines.length); k++) {
          const l = lines[k];
          if (l.includes('$') || l.match(/\d+\s*(a year|an hour|\/hr|\/yr)/i)) salary = l;
          if (l.startsWith('View this job:')) { applyLink = l.replace('View this job:', '').trim(); break; }
          if (l.includes('indeed.com/viewjob')) { applyLink = l.trim(); break; }
        }
        jobs.push({ title: line.trim(), company: nextLine.trim(), location: lineAfter.trim(), salary, applyLink });
        i += 3; continue;
      }
    }
    i++;
  }
  return jobs;
};

// Dedup helper: generates a normalised fingerprint for a job
// Catches same job posted by different sources or sent in multiple alert emails
const jobFingerprint = (title, company) =>
  (title + '|' + company).toLowerCase().replace(/[^a-z0-9|]/g, '').trim();

export async function POST(req) {
  try {
    const secret = req.headers.get('x-webhook-secret');
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const source = body.source || 'Email Alert';
    const existing = (await redis.get('kayla_alert_jobs')) || [];

    // Build fingerprint set from existing jobs to prevent cross-email duplicates
    const existingFingerprints = new Set(
      existing.map(j => jobFingerprint(j.title || '', j.company || ''))
    );

    let newJobs = [];

    if (source === 'LinkedIn Alert') {
      const parsed = parseLinkedInJobs(body.description || '');
      const source_jobs = parsed.length > 0 ? parsed : [{
        title: body.title || 'LinkedIn Job',
        company: 'Unknown',
        location: body.location || 'Toronto, ON',
        applyLink: '#',
      }];

      newJobs = source_jobs
        .filter(p => {
          const fp = jobFingerprint(p.title, p.company);
          if (existingFingerprints.has(fp)) return false;
          existingFingerprints.add(fp);
          return true;
        })
        .map(p => ({
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

    } else if (source === 'Indeed Alert') {
      // Parse multiple jobs from the Indeed email body
      const parsed = parseIndeedJobs(body.description || '');

      if (parsed.length > 0) {
        newJobs = parsed
          .filter(p => {
            const fp = jobFingerprint(p.title, p.company);
            if (existingFingerprints.has(fp)) return false;
            existingFingerprints.add(fp);
            return true;
          })
          .map(p => ({
            id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            title: p.title,
            company: p.company,
            location: p.location || body.location || 'Toronto, ON',
            workMode: p.location && /remote/i.test(p.location) ? 'Remote' : 'On-site',
            salary: p.salary || 'Not listed',
            posted: new Date().toISOString(),
            description: body.description || '',
            applyLink: p.applyLink || '#',
            source,
          }));
      } else {
        // Fallback: try to use subject line if body parsing yields nothing
        const titleFromSubject = (body.title || '').replace(/^\d+\s+new\s+jobs?\s+(for:?\s*)?/i, '').trim();
        if (titleFromSubject) {
          const fp = jobFingerprint(titleFromSubject, 'Indeed');
          if (!existingFingerprints.has(fp)) {
            newJobs = [{
              id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
              title: titleFromSubject || 'Indeed Job Alert',
              company: 'See description',
              location: body.location || 'Toronto, ON',
              workMode: 'On-site',
              salary: 'Not listed',
              posted: new Date().toISOString(),
              description: body.description || '',
              applyLink: body.applyLink || '#',
              source,
            }];
          }
        }
      }

    } else {
      // Generic / manual webhook
      const fp = jobFingerprint(body.title || '', body.company || '');
      if (!existingFingerprints.has(fp)) {
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
    }

    const updated = [...newJobs, ...existing].slice(0, 200);
    await redis.set('kayla_alert_jobs', updated);

    return NextResponse.json({
      ok: true,
      added: newJobs.length,
      skipped_duplicates: (source === 'LinkedIn Alert' ? parseLinkedInJobs(body.description || '').length : 0) - newJobs.length,
      jobs: newJobs.map(j => ({ title: j.title, company: j.company })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
