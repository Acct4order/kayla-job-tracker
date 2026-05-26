import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { job, resume } = await request.json();

    const prompt = `You are an elite executive resume writer placing senior management candidates.
TARGET: ${job.title} at ${job.company} | ${job.location} | ${job.workMode}
JOB DESCRIPTION:
${(job.description || '').substring(0, 2500)}
ORIGINAL RESUME:
${resume}
Rewrite tailored to this role: ATS optimized 90%+, executive tone, achievement-focused. Do NOT fabricate anything. Format: Professional Summary, Core Skills, Professional Experience, Education and Certifications. Output plain text resume only, no commentary.`;

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
    const text = data.content?.[0]?.text || '';
    return NextResponse.json({ result: text });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
