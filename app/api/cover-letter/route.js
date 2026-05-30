import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { job, resume } = await request.json();

    const prompt = `You are an elite executive cover letter writer. Analyze the company and role to decide the ideal tone:
- Government / public sector / healthcare / NGO → formal and precise
- Startup / tech / creative → warm, confident, slightly personal
- Corporate / financial / legal / consulting → professional and results-focused

JOB: ${job.title} at ${job.company} | ${job.location} | ${job.workMode}
JOB DESCRIPTION:
${(job.description || '').substring(0, 2500)}

CANDIDATE RESUME:
${resume}

Write a cover letter tailored to this specific role and company. Rules:
- 3 tight paragraphs, max 350 words total
- Opening: why this role and company specifically (no generic openers like "I am writing to apply")
- Middle: 2-3 concrete achievements from the resume that directly match the job requirements
- Closing: confident next step, no grovelling
- Address to "Hiring Manager" unless a name is evident from the job description
- Use the candidate's actual contact details from the resume
- Sign off with candidate's name
- Do NOT fabricate achievements or credentials
- Plain text output only, no markdown`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
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
