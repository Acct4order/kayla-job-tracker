import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { job, resume } = await request.json();

    const prompt = `You are an elite executive resume writer specialising in ATS-optimised resumes.

TARGET ROLE: ${job.title} at ${job.company} | ${job.location} | ${job.workMode}

JOB DESCRIPTION:
${(job.description || '').substring(0, 2500)}

ORIGINAL RESUME:
${resume}

REWRITE INSTRUCTIONS:
1. Tailor the resume to this specific role. ATS score must be 90%+. Executive tone. Achievement-focused. Do NOT fabricate experience.
2. Write Professional Summary in normal sentence case (not all caps, not title case for body text).
3. Use Title Case only for: section headings and job titles.
4. Do NOT write body text in ALL CAPITALS or Title Case.

CRITICAL FORMAT RULES — follow exactly, ATS parsers depend on this:
Each job entry MUST use this exact 3-line structure with NO pipes in the job title line:

Job Title
Company Name
City, Province | Mon YYYY – Mon YYYY

Then bullet points starting with - 

Example of CORRECT format:
Administrative Assistant
DCY Professional Corporation CPA
Toronto, ON | Sep 2024 – Aug 2025
- Led firm-wide rollout of CCH iFirm across 30-person firm

Example of WRONG format (do NOT do this):
Administrative Assistant | DCY Professional Corporation CPA | Toronto, ON | Sep 2024 to Aug 2025
- Led firm-wide rollout...

Section order: Professional Summary, Core Skills, Professional Experience, Education and Certifications.
Core Skills: single line of comma-separated keywords, no bullets.
Output plain text only. No markdown.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return NextResponse.json({ result: data.content?.[0]?.text || '' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
