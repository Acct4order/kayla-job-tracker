import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RAPIDAPI_KEY not set in environment variables' }, { status: 500 });
    }

  const query = encodeURIComponent('manager Toronto Canada');

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${query}&page=1&num_pages=3&date_posted=month`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
        cache: 'no-store',
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
