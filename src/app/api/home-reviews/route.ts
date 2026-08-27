import { NextResponse } from 'next/server';

import { getHomeReviewsFeed } from '@/lib/supabase/sellers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const payload = await getHomeReviewsFeed(6);

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching home reviews:', error);
    return NextResponse.json(
      { error: 'Failed to load home reviews' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
