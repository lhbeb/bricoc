import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Auth helper (same pattern as other admin routes)
async function getAdminAuth(request: NextRequest) {
    const { shouldBypassAuth } = await import('@/lib/supabase/auth');
    if (shouldBypassAuth()) {
        return { authenticated: true, role: 'SUPER_ADMIN', email: 'dev@localhost' };
    }

    const token = request.cookies.get('admin_token')?.value;
    if (!token) return null;

    try {
        const { jwtVerify } = await import('jose');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        const decoded = payload as { id: string; email: string; role: string; isActive: boolean };
        if (!decoded.isActive) return null;
        return { authenticated: true, role: decoded.role, email: decoded.email };
    } catch {
        return null;
    }
}

/**
 * POST /api/admin/run-migration
 * Runs the checkout_flow constraint migration to allow 'stripe-hosted' and
 * all other supported checkout flow values.
 * Restricted to SUPER_ADMIN only.
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await getAdminAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (auth.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
        }

        console.log(`🚀 [Migration] Running checkout_flow constraint migration by: ${auth.email}`);

        // Step 1: Find and drop any existing checkout_flow CHECK constraint
        const { data: constraints, error: constraintFetchError } = await supabaseAdmin
            .rpc('get_checkout_flow_constraints');

        // We use raw SQL via the postgres function approach.
        // Since supabaseAdmin doesn't expose raw SQL directly, we use the 
        // admin REST API with a stored procedure, OR we do individual alter via rpc.
        // 
        // Best approach: use supabaseAdmin.rpc with a migration function,
        // OR use the management API. Let's do it step-by-step using individual
        // supabase queries to drop+recreate the constraint.

        // The Supabase JS client doesn't support raw DDL directly.
        // We'll use the postgres function via rpc if available, otherwise
        // we'll do it via the Supabase Management REST API using the service key.

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        // Execute the migration SQL via Supabase's SQL endpoint (pg REST)
        const migrationSQL = `
DO $$
DECLARE
    constraint_record record;
BEGIN
    FOR constraint_record IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = con.connamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'products'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%checkout_flow%'
    LOOP
        EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT %I', constraint_record.conname);
    END LOOP;
END $$;

ALTER TABLE public.products
    ADD CONSTRAINT products_checkout_flow_check
    CHECK (
        checkout_flow IS NULL OR checkout_flow IN (
            'buymeacoffee',
            'kofi',
            'external',
            'stripe',
            'stripe-hosted',
            'paypal-invoice',
            'paypal-unclaimed',
            'paypal-direct',
            'paypal-api',
            'lemon-squeezy'
        )
    );
`;

        // Use Supabase's pg REST SQL execution endpoint
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
        if (!projectRef) {
            return NextResponse.json({ error: 'Could not determine Supabase project ref from URL' }, { status: 500 });
        }

        // Use the Supabase Management API to run the SQL
        const managementResponse = await fetch(
            `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ query: migrationSQL }),
            }
        );

        if (!managementResponse.ok) {
            const errorText = await managementResponse.text();
            console.error('[Migration] Management API failed:', errorText);

            // Fallback: try via the pg function RPC approach
            // Create a helper function and call it
            const fallbackSQL = `
SELECT 
    con.conname,
    pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = con.connamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'products'
  AND con.contype = 'c'
  AND pg_get_constraintdef(con.oid) ILIKE '%checkout_flow%';
`;
            return NextResponse.json({
                error: 'Management API not available. Please run the SQL migration manually in Supabase SQL Editor.',
                sql: migrationSQL,
                managementError: errorText.slice(0, 500),
            }, { status: 500 });
        }

        const result = await managementResponse.json();
        console.log('[Migration] Migration completed successfully:', result);

        return NextResponse.json({
            success: true,
            message: 'checkout_flow constraint updated successfully. stripe-hosted is now a valid value.',
            result,
        });

    } catch (error: any) {
        console.error('❌ [Migration] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Migration failed' },
            { status: 500 }
        );
    }
}
