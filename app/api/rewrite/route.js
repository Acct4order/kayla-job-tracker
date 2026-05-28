import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { job, resume } = await request.json();
    const prompt = 'You are an elite executive resume writer.\nTARGET: ' + job.title + ' at ' + job.company + ' | ' + job.location + ' | ' + job.workMode + '\nJOB DESCRIPTION:\n' + (job.description || '').substring(0, 2500) + '\nORIGINAL RESUME:\n' + resume + '\nRewrite tailored to this role. ATS optimized 90%+. Executive tone. Achievement-focused. Do NOT fabricate. Write Professional Summary in normal sentence case. Use Title Case only for section headings and job titles. Do NOT write body text in ALL CAPITALS or Title Case. Format sections as: Professional Summary, Core Skills, Professional Experience, Education and Certifications. Output plain text only.';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return NextResponse.json({ result: data.content?.[0]?.text || '' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
