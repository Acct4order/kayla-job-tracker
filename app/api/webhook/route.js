import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// ── LINKEDIN PARSER ──────────────────────────────────────────────────────────
const parseLinkedInJobs = (body) => {
  if (!body) return [];
  const jobs = [];
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (
      line.startsWith('http') || line.startsWith('View job:') ||
      line.startsWith('See all') || line.startsWith('This email') ||
      line.startsWith('Learn why') || line.startsWith('You are receiving') ||
      line.startsWith('Manage your') || line.startsWith('Unsubscribe') ||
      line.startsWith('Job search smarter') || line.startsWith('©') ||
      line.startsWith('LinkedIn') || line.startsWith('---') ||
      line.startsWith('Results from') || line.startsWith('Your job alert') ||
      line.match(/^\d+ new jobs/) || line.match(/^\d+ company alum/) ||
      line === 'This company is actively hiring' || line === 'Help:'
    ) { i++; continue; }

    const isJobTitle = line.length > 3 && line.length < 120 &&
      !line.startsWith('http') && !line.includes('@') &&
      !line.match(/^\d{4}/) && !line.includes('linkedin.com');

    if (isJobTitle && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const lineAfter = lines[i + 2] || '';
      const isCompany = nextLine.length > 1 && nextLine.length < 100 &&
        !nextLine.startsWith('http') && !nextLine.match(/^\d+ /) &&
        !nextLine.includes('linkedin.com');
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

// ── INDEED PARSER ─────────────────────────────────────────────────────────────
// Indeed plain-text format (Zapier Body Plain from HTML email):
//   Operations Manager
//   Maple Bear Global Schools 3.7        ← company + star rating number
//   Toronto, ON
//   $90,000–$100,000 a year              ← optional salary
//   Easily apply                         ← noise
//
const cleanCompany = (s) => s.replace(/\s+\d+\.\d+\s*[★\*]?\s*$/, '').trim();

const isIndeedNoise = (l) =>
  !l || /^\d+\s+new\s+/i.test(l) || /^refined by/i.test(l) ||
  /^these job ads/i.test(l) || /^see all/i.test(l) ||
  /^unsubscribe/i.test(l) || /^easily apply/i.test(l) ||
  /^(full-time|part-time|contract|permanent|temporary|casual)$/i.test(l) ||
  /^new (today|this week)/i.test(l) || /^sponsored$/i.test(l) ||
  /^indeed/i.test(l) || /^©/.test(l) || l.startsWith('http') ||
  /^view (this )?job/i.test(l) || /^apply now/i.test(l) ||
  /^help$/i.test(l) || /^privacy/i.test(l);

const isIndeedLocation = (l) =>
  /^[A-Z][a-zA-Z\s\-]+,\s*(ON|BC|AB|QC|MB|SK|NS|NB|PE|NL|NT|YT|NU)$/.test(l) ||
  /\bRemote\b/i.test(l) ||
  /^[A-Z][a-zA-Z\s]+,\s*(Ontario|British Columbia|Alberta|Quebec|Manitoba|Saskatchewan|Nova Scotia)/i.test(l) ||
  /^Canada$/.test(l);

const isIndeedSalary = (l) =>
  /\$[\d,]/.test(l) || /\d+\s*(a year|an hour|\/hr|\/yr)/i.test(l);

const parseIndeedJobs = (body) => {
  if (!body) return [];
  const jobs = [];
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip noise, location-only lines, salary-only lines
    if (isIndeedNoise(line) || isIndeedLocation(line) || isIndeedSalary(line)) { i++; continue; }

    // Potential job title — look ahead for company then location
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const isCompany = !isIndeedNoise(nextLine) && !isIndeedLocation(nextLine) &&
        !isIndeedSalary(nextLine) && nextLine.length > 1 && nextLine.length < 100;

      if (isCompany) {
        // Find location in next few lines
        let locationIdx = -1;
        for (let k = i + 2; k < Math.min(i + 6, lines.length); k++) {
          if (isIndeedLocation(lines[k])) { locationIdx = k; break; }
        }

        if (locationIdx !== -1) {
          // Validate title: short enough, no sentence punctuation
          const wordCount = line.split(' ').length;
          if (wordCount <= 10 && line.length < 100 && !line.includes('@') && !/^\d/.test(line)) {
            // Find salary after location
            let salary = 'Not listed';
            for (let k = locationIdx + 1; k < Math.min(locationIdx + 4, lines.length); k++) {
              if (isIndeedSalary(lines[k])) { salary = lines[k]; break; }
            }
            jobs.push({
              title: line.trim(),
              company: cleanCompany(nextLine),
              location: lines[locationIdx].trim(),
              salary,
              applyLink: '#', // Indeed plain text doesn't include direct links
            });
            i = locationIdx + 1;
            continue;
          }
        }
      }
    }
    i++;
  }
  return jobs;
};

// ── DEDUP FINGERPRINT ─────────────────────────────────────────────────────────
const jobFingerprint = (title, company) =>
  (title + '|' + company).toLowerCase().replace(/[^a-z0-9|]/g, '').trim();

// ── WEBHOOK HANDLER ───────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const secret = req.headers.get('x-webhook-secret');
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const source = body.source || 'Email Alert';

    // Save raw payload for debugging (last 5 per source)
    const debugKey = 'kayla_debug_' + source.replace(/\s+/g, '_').toLowerCase();
    const existingDebug = (await redis.get(debugKey)) || [];
    await redis.set(debugKey, [{
      receivedAt: new Date().toISOString(),
      source,
      title: body.title || '',
      location: body.location || '',
      bodyLength: (body.description || '').length,
      bodyPreview: (body.description || '').substring(0, 800),
      bodyLines: (body.description || '').split('\n').slice(0, 40),
    }, ...existingDebug].slice(0, 5));

    const existing = (await redis.get('kayla_alert_jobs')) || [];
    const existingFPs = new Set(existing.map(j => jobFingerprint(j.title || '', j.company || '')));

    let newJobs = [];
    let parsedCount = 0;

    if (source === 'LinkedIn Alert') {
      const parsed = parseLinkedInJobs(body.description || '');
      parsedCount = parsed.length;
      const toProcess = parsed.length > 0 ? parsed : [{
        title: body.title || 'LinkedIn Job', company: 'Unknown',
        location: body.location || 'Toronto, ON', applyLink: '#',
      }];
      newJobs = toProcess
        .filter(p => { const fp = jobFingerprint(p.title, p.company); if (existingFPs.has(fp)) return false; existingFPs.add(fp); return true; })
        .map(p => ({
          id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          title: p.title, company: p.company,
          location: p.location || body.location || 'Toronto, ON',
          workMode: 'On-site', salary: 'Not listed',
          posted: new Date().toISOString(),
          description: body.description || '',
          applyLink: p.applyLink || '#', source,
        }));

    } else if (source === 'Indeed Alert') {
      const parsed = parseIndeedJobs(body.description || '');
      parsedCount = parsed.length;

      if (parsed.length > 0) {
        newJobs = parsed
          .filter(p => { const fp = jobFingerprint(p.title, p.company); if (existingFPs.has(fp)) return false; existingFPs.add(fp); return true; })
          .map(p => ({
            id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            title: p.title, company: p.company,
            location: p.location || body.location || 'Toronto, ON',
            workMode: /remote/i.test(p.location) ? 'Remote' : 'On-site',
            salary: p.salary || 'Not listed',
            posted: new Date().toISOString(),
            description: body.description || '',
            applyLink: '#', source,
          }));
      } else {
        // Parsing yielded nothing — store raw so it's not silently lost
        // Strip "X new jobs for:" prefix from subject to get search term
        const rawTitle = (body.title || '')
          .replace(/^.+?is hiring for\s+/i, '')   // "Maple Bear... is hiring for Operations Manager + ..."
          .replace(/\s*\+\s*\d+.*$/i, '')          // remove "+ 30 new manager jobs in Thornhill, ON"
          .trim() || 'Indeed Job Alert';
        const fp = jobFingerprint(rawTitle, 'Indeed');
        if (!existingFPs.has(fp)) {
          newJobs = [{
            id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            title: rawTitle, company: 'See description',
            location: body.location || 'Toronto, ON',
            workMode: 'On-site', salary: 'Not listed',
            posted: new Date().toISOString(),
            description: body.description || '',
            applyLink: '#', source,
          }];
        }
      }

    } else {
      const fp = jobFingerprint(body.title || '', body.company || '');
      if (!existingFPs.has(fp)) {
        newJobs = [{
          id: 'alert_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          title: body.title || 'Untitled', company: body.company || 'Unknown',
          location: body.location || 'Toronto, ON',
          workMode: body.workMode || 'On-site', salary: body.salary || 'Not listed',
          posted: new Date().toISOString(),
          description: body.description || '',
          applyLink: body.applyLink || '#', source,
        }];
      }
    }

    const updated = [...newJobs, ...existing].slice(0, 200);
    await redis.set('kayla_alert_jobs', updated);

    return NextResponse.json({ ok: true, added: newJobs.length, parsed: parsedCount, jobs: newJobs.map(j => ({ title: j.title, company: j.company })) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
