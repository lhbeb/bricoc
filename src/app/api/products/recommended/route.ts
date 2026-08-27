import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedProducts } from '@/lib/supabase/products';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim() || '';
  if (!slug) {
    return NextResponse.json({ error: 'Product slug is required.' }, { status: 400 });
  }

  try {
    const products = await getRecommendedProducts(slug, 4);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to get recommended products:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve recommended products.' },
      { status: 500 },
    );
  }
}
