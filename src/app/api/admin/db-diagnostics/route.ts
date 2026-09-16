import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { isRevokedAdminEmail } from '@/lib/admin-access';
import { shouldBypassAuth } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

function getSupabaseProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  return url.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1] || null;
}

async function getAdminAuth(request: NextRequest) {
  if (shouldBypassAuth()) {
    return { authenticated: true, role: 'SUPER_ADMIN', email: 'dev@localhost' };
  }

  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;

  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
    const decoded = payload as { role?: string; isActive?: boolean; email?: string };
    const normalizedRole = decoded.role?.toUpperCase();

    if (!decoded.email || isRevokedAdminEmail(decoded.email)) return null;
    if (!decoded.isActive) return null;
    if (!['SUPER_ADMIN', 'REGULAR_ADMIN', 'ADMIN'].includes(normalizedRole || '')) return null;

    return { authenticated: true, role: decoded.role || '', email: decoded.email };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checkoutFlows = [
    'stripe',
    'stripe-hosted',
    'buymeacoffee',
    'paypal-direct',
    'paypal-api',
    'kofi',
    'external',
  ];

  const counts: Record<string, number | { error: string }> = {};
  for (const flow of checkoutFlows) {
    const { count, error } = await supabaseAdmin
      .from('products')
      .select('slug', { count: 'exact', head: true })
      .eq('checkout_flow', flow);

    counts[flow] = error ? { error: error.message } : count ?? 0;
  }

  const { data: stripeSettings, error: stripeSettingsError } = await supabaseAdmin
    .from('payment_settings')
    .select('provider, publishable_key, secret_key, webhook_secret, is_active, mode')
    .eq('provider', 'stripe')
    .maybeSingle();

  return NextResponse.json({
    supabase: {
      projectRef: getSupabaseProjectRef(),
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    deployment: {
      nodeEnv: process.env.NODE_ENV || null,
      vercelEnv: process.env.VERCEL_ENV || null,
      vercelUrlHost: process.env.VERCEL_URL || null,
    },
    checkoutFlowCounts: counts,
    stripeSettings: stripeSettingsError
      ? { error: stripeSettingsError.message }
      : {
          exists: Boolean(stripeSettings),
          isActive: stripeSettings?.is_active ?? null,
          mode: stripeSettings?.mode ?? null,
          hasPublishableKey: Boolean(stripeSettings?.publishable_key),
          hasSecretKey: Boolean(stripeSettings?.secret_key),
          hasWebhookSecret: Boolean(stripeSettings?.webhook_secret),
        },
  });
}
