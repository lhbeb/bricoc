import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { jwtVerify } from 'jose';
import { shouldBypassAuth } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

const MAX_PRODUCTS_PER_REQUEST = 2000;
const QUERY_BATCH_SIZE = 100;
const UPDATE_CONCURRENCY = 10;

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  if (shouldBypassAuth()) return true;

  const cookieToken = request.cookies.get('admin_token')?.value;
  const authorization = request.headers.get('authorization');
  const headerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined;
  const token = cookieToken || headerToken;

  if (!token) return false;

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    );
    const { payload } = await jwtVerify(token, secret);
    return payload.isActive === true;
  } catch {
    return false;
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const enabled = body.enabled;
    const rawSlugs: unknown[] = Array.isArray(body.slugs) ? body.slugs : [];
    const slugs = Array.from(
      new Set(
        rawSlugs
          .filter((slug): slug is string => typeof slug === 'string')
          .map((slug) => slug.trim())
          .filter(Boolean),
      ),
    );

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
    }
    if (slugs.length === 0) {
      return NextResponse.json({ error: 'No product slugs provided' }, { status: 400 });
    }
    if (slugs.length > MAX_PRODUCTS_PER_REQUEST) {
      return NextResponse.json(
        { error: `A maximum of ${MAX_PRODUCTS_PER_REQUEST} products can be updated at once` },
        { status: 400 },
      );
    }

    const existingProducts: Array<{ slug: string; meta: Record<string, unknown> | null }> = [];
    for (const slugBatch of chunk(slugs, QUERY_BATCH_SIZE)) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('slug, meta')
        .in('slug', slugBatch);

      if (error) throw error;
      existingProducts.push(...(data || []));
    }

    const updatedSlugs: string[] = [];
    const failedSlugs: string[] = [];
    const foundSlugs = new Set(existingProducts.map((product) => product.slug));
    failedSlugs.push(...slugs.filter((slug) => !foundSlugs.has(slug)));

    for (const productBatch of chunk(existingProducts, UPDATE_CONCURRENCY)) {
      const results = await Promise.all(
        productBatch.map(async (product) => {
          const { error } = await supabaseAdmin
            .from('products')
            .update({
              meta: { ...(product.meta || {}), gmc_enabled: enabled },
              updated_at: new Date().toISOString(),
            })
            .eq('slug', product.slug);

          return { slug: product.slug, error };
        }),
      );

      for (const result of results) {
        if (result.error) {
          console.error(`Failed to update GMC status for ${result.slug}:`, result.error);
          failedSlugs.push(result.slug);
        } else {
          updatedSlugs.push(result.slug);
        }
      }
    }

    revalidatePath('/api/feed/google');

    return NextResponse.json({
      enabled,
      updatedCount: updatedSlugs.length,
      failedCount: failedSlugs.length,
      updatedSlugs,
      failedSlugs,
    });
  } catch (error) {
    console.error('Bulk GMC update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update selected GMC products' },
      { status: 500 },
    );
  }
}
