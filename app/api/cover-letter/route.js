import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { job, resume } = await request.json();

    const prompt = `You are an elite executive career writer who has coached hundreds of C-suite candidates. Your cover letters are known for stopping hiring managers cold in the first 6 seconds — before they've read a full sentence.

TARGET ROLE: ${job.title} at ${job.company} | ${job.location} | ${job.workMode}

JOB DESCRIPTION:
${(job.description || '').substring(0, 2500)}

CANDIDATE RESUME:
${resume}

COVER LETTER RULES:
1. OPENING LINE (most important): Must be a punchy, non-generic hook that lands in under 6 seconds. Lead with the candidate's single strongest differentiator for THIS specific role — a credential, a number, a direct experience match. Never start with "I am writing to apply" or any variation. Never start with "I". Use a short declarative or fragment that arrests attention.

2. TONE: Confident, direct, and professional. No filler phrases ("I am passionate about", "I would love the opportunity", "I am excited to"). Every sentence must earn its place.

3. STRUCTURE — 5 paragraphs max:
   - Para 1: The hook. One or two sentences that make a hiring manager stop scrolling.
   - Para 2: The proof. Two most relevant past roles mapped directly to the top responsibilities in this job posting. Specific numbers and outcomes only.
   - Para 3: The insight. One short paragraph showing the candidate understands what this role REALLY requires (not what it says on paper). Shows strategic thinking.
   - Para 4: The operational match. Ties remaining experience directly to specific duties in the posting. Reframes experience as direct evidence, not adjacent skills.
   - Para 5: The differentiator close. One unique credential, skill, or attribute that most candidates won't have. End with quiet confidence — no begging for an interview.

4. LENGTH: 350–420 words. Tight. No padding.

5. Sign off with:
Sincerely,
Kayla Kwok
Ontario, Canada
(437) 362-9928 | kaylakwok.km@gmail.com

Output plain text only. No markdown. No subject line.`;

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
