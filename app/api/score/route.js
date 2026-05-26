import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { job, resume } = await request.json();

    const prompt = `You are a senior recruiter with 20 years experience AND the CEO of the hiring company.
JOB: ${job.title} at ${job.company} | ${job.location} | ${job.workMode} | ${job.salary}
JOB DESCRIPTION:
${(job.description || '').substring(0, 2500)}
CANDIDATE RESUME:
${resume}
Return ONLY raw JSON, no markdown:
{"ats_score":<0-100>,"recruiter_score":<0-100>,"ceo_score":<0-100>,"breakdown":{"leadership":{"score":<0-100>,"comment":"<1 sentence>"},"relevant_experience":{"score":<0-100>,"comment":"<1 sentence>"},"technical_skills":{"score":<0-100>,"comment":"<1 sentence>"},"education":{"score":<0-100>,"comment":"<1 sentence>"},"communication":{"score":<0-100>,"comment":"<1 sentence>"}},"strengths":["<s1>","<s2>","<s3>"],"gaps":["<g1>","<g2>","<g3>"],"recommendation":"<STRONG PROCEED|PROCEED|CONDITIONAL|NOT RECOMMENDED>","summary":"<2-3 sentences>"}`;

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
    const text = data.content?.[0]?.text || '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
