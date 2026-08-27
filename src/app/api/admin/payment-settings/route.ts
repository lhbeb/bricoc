import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
    invalidatePaypalApiConfigCache,
    invalidatePaypalConfigCache,
    invalidateStripeConfigCache,
} from '@/lib/supabase/payment-settings';
import {
    invalidatePaypalAccessTokenCache,
    PaypalApiError,
    validatePaypalApiCredentials,
} from '@/lib/paypal-api';

// Helper to get admin auth from request
async function getAdminAuth(request: NextRequest) {
    // Bypass authentication in development if enabled
    const { shouldBypassAuth } = await import('@/lib/supabase/auth');
    if (shouldBypassAuth()) {
        return { authenticated: true, role: 'SUPER_ADMIN', email: 'dev@localhost' };
    }

    const token = request.cookies.get('admin_token')?.value;
    if (token) {
        try {
            const { jwtVerify } = await import('jose');
            const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
            const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);
            const { payload } = await jwtVerify(token, getSecretKey());
            const decoded = payload as { role: string; isActive: boolean; email: string };
            const normalizedRole = decoded.role?.toUpperCase();

            if (!decoded.isActive) return null;
            if (!['SUPER_ADMIN', 'REGULAR_ADMIN', 'ADMIN'].includes(normalizedRole)) return null;

            return { authenticated: true, role: decoded.role, email: decoded.email };
        } catch (error) {
            console.error('❌ [AUTH] JWT verification failed:', error);
            return null;
        }
    }
    return null;
}

async function getPaypalSettingsRow() {
    let data: { payee_email?: string | null; publishable_key?: string | null; is_active?: boolean | null } | null = null;
    let error: any = null;

    const primaryResult = await supabaseAdmin
        .from('payment_settings')
        .select('payee_email, publishable_key, is_active')
        .eq('provider', 'paypal-direct')
        .single();

    data = primaryResult.data;
    error = primaryResult.error;

    // Backward-compatible fallback for databases that do not yet have payee_email.
    if (error && error.code === '42703') {
        const fallbackResult = await supabaseAdmin
            .from('payment_settings')
            .select('publishable_key, is_active')
            .eq('provider', 'paypal-direct')
            .single();

        data = fallbackResult.data;
        error = fallbackResult.error;
    }

    return { data, error };
}

export async function GET(request: NextRequest) {
    try {
        const auth = await getAdminAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
        }

        // Fetch Stripe settings
        const { data: stripeData, error: stripeError } = await supabaseAdmin
            .from('payment_settings')
            .select('publishable_key, secret_key, mode, is_active')
            .eq('provider', 'stripe')
            .single();

        // Fetch PayPal settings
        const { data: paypalData, error: paypalError } = await getPaypalSettingsRow();

        // Fetch PayPal Orders API settings. The Client Secret is never returned.
        const { data: paypalApiData, error: paypalApiError } = await supabaseAdmin
            .from('payment_settings')
            .select('publishable_key, secret_key, payee_email, mode, is_active')
            .eq('provider', 'paypal-api')
            .maybeSingle();

        if (stripeError && stripeError.code !== 'PGRST116') {
            console.error('Error fetching Stripe settings:', stripeError);
        }

        if (paypalError && paypalError.code !== 'PGRST116') {
            console.error('Error fetching PayPal settings:', paypalError);
        }

        if (paypalApiError && paypalApiError.code !== 'PGRST116') {
            console.error('Error fetching PayPal API settings:', paypalApiError);
        }

        const response: any = {
            stripe: null,
            paypal: null,
            paypalApi: null,
        };

        if (stripeData) {
            const secretLength = stripeData.secret_key.length;
            const visibleChars = 8;
            const maskedSecret = stripeData.secret_key.substring(0, visibleChars) + '*'.repeat(Math.max(0, secretLength - visibleChars));
            
            response.stripe = {
                isConfigured: true,
                publishableKey: stripeData.publishable_key,
                secretKey: maskedSecret,
                mode: stripeData.mode,
                isActive: stripeData.is_active
            };
        }

        if (paypalData) {
            response.paypal = {
                isConfigured: true,
                payeeEmail: paypalData.payee_email || '',
                isActive: paypalData.is_active
            };
        }


        if (paypalApiData) {
            response.paypalApi = {
                isConfigured: Boolean(paypalApiData.publishable_key && paypalApiData.secret_key),
                clientId: paypalApiData.publishable_key || '',
                clientSecret: paypalApiData.secret_key ? '********' : '',
                merchantEmail: paypalApiData.payee_email || '',
                mode: paypalApiData.mode === 'live' ? 'live' : 'sandbox',
                isActive: paypalApiData.is_active,
            };
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error in GET payment settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAdminAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
        }

        const body = await request.json();
        const {
            provider,
            publishableKey,
            secretKey,
            mode,
            payeeEmail,
            clientId,
            clientSecret,
            merchantEmail,
        } = body;

        if (provider === 'paypal-direct') {
            if (!payeeEmail) {
                return NextResponse.json({ error: 'Missing Payee Email' }, { status: 400 });
            }

            // Check if row already exists so we can UPDATE instead of INSERT
            const { data: existing } = await supabaseAdmin
                .from('payment_settings')
                .select('id')
                .eq('provider', 'paypal-direct')
                .maybeSingle();

            let upsertError: any = null;

            if (existing) {
                const updatePayload: any = {
                    payee_email: payeeEmail,
                    publishable_key: payeeEmail,
                    is_active: true,
                    updated_by: auth.email
                };

                const { error: updateError } = await supabaseAdmin
                    .from('payment_settings')
                    .update(updatePayload)
                    .eq('provider', 'paypal-direct');
                upsertError = updateError;
            } else {
                const { error: insertError } = await supabaseAdmin
                    .from('payment_settings')
                    .insert({
                        provider: 'paypal-direct',
                        payee_email: payeeEmail,
                        publishable_key: payeeEmail,
                        secret_key: 'paypal-not-applicable',
                        mode: 'live',
                        is_active: true,
                        updated_by: auth.email
                    });
                upsertError = insertError;
            }

            if (upsertError) {
                console.error('Error saving PayPal settings:', upsertError);
                return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
            }

            invalidatePaypalConfigCache();
            return NextResponse.json({ success: true, message: 'PayPal settings saved successfully.' });
        }

        if (provider === 'paypal-api') {
            const normalizedClientId = typeof clientId === 'string' ? clientId.trim() : '';
            const normalizedEmail = typeof merchantEmail === 'string' ? merchantEmail.trim() : '';
            const normalizedMode = mode === 'live' ? 'live' : mode === 'sandbox' ? 'sandbox' : '';
            const submittedSecret = typeof clientSecret === 'string' ? clientSecret.trim() : '';

            if (!normalizedClientId || !normalizedEmail || !normalizedMode) {
                return NextResponse.json(
                    { error: 'Merchant email, Client ID, and environment are required.' },
                    { status: 400 },
                );
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                return NextResponse.json({ error: 'Enter a valid PayPal merchant email.' }, { status: 400 });
            }

            const { data: existingPaypalApi, error: existingError } = await supabaseAdmin
                .from('payment_settings')
                .select('id, secret_key')
                .eq('provider', 'paypal-api')
                .maybeSingle();

            if (existingError) {
                console.error('Error checking existing PayPal API settings:', existingError);
                return NextResponse.json({ error: 'Failed to read current configuration.' }, { status: 500 });
            }

            const keepExistingSecret = !submittedSecret || submittedSecret.includes('*');
            const resolvedSecret = keepExistingSecret
                ? existingPaypalApi?.secret_key || ''
                : submittedSecret;

            if (!resolvedSecret) {
                return NextResponse.json({ error: 'PayPal Client Secret is required.' }, { status: 400 });
            }

            try {
                await validatePaypalApiCredentials({
                    clientId: normalizedClientId,
                    clientSecret: resolvedSecret,
                    merchantEmail: normalizedEmail,
                    mode: normalizedMode,
                    isActive: true,
                });
            } catch (error) {
                if (error instanceof PaypalApiError) {
                    console.error('PayPal API credential verification failed:', {
                        status: error.status,
                        debugId: error.debugId,
                        message: error.message,
                    });
                    return NextResponse.json(
                        { error: `PayPal rejected these ${normalizedMode} credentials. Check the Client ID and Client Secret.` },
                        { status: 400 },
                    );
                }
                throw error;
            }

            const settingsPayload = {
                publishable_key: normalizedClientId,
                secret_key: resolvedSecret,
                payee_email: normalizedEmail,
                mode: normalizedMode,
                is_active: true,
                updated_by: auth.email,
            };

            const { error: saveError } = existingPaypalApi
                ? await supabaseAdmin
                    .from('payment_settings')
                    .update(settingsPayload)
                    .eq('provider', 'paypal-api')
                : await supabaseAdmin
                    .from('payment_settings')
                    .insert({ provider: 'paypal-api', ...settingsPayload });

            if (saveError) {
                console.error('Error saving PayPal API settings:', saveError);
                return NextResponse.json({ error: 'Failed to save PayPal API configuration.' }, { status: 500 });
            }

            invalidatePaypalApiConfigCache();
            invalidatePaypalAccessTokenCache();
            return NextResponse.json({
                success: true,
                message: `PayPal API ${normalizedMode} credentials verified and saved.`,
            });
        }

        // Default Stripe logic
        if (!publishableKey || !secretKey || !mode) {
            return NextResponse.json({ error: 'Missing required configuration fields' }, { status: 400 });
        }

        if (!publishableKey.startsWith('pk_')) {
            return NextResponse.json({ error: 'Invalid Publishable Key signature' }, { status: 400 });
        }

        if (!secretKey.startsWith('sk_') && !secretKey.startsWith('rk_')) {
            if (secretKey.includes('***')) {
                return NextResponse.json({ error: 'Please provide the full secret key, not the masked view' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Invalid Secret Key signature' }, { status: 400 });
        }

        // Check if a Stripe row already exists so we can UPDATE instead of INSERT.
        // We avoid .upsert({ onConflict: 'provider' }) because the DB uses a
        // *partial* unique index (WHERE is_active = true), which PostgreSQL does
        // not accept for ON CONFLICT resolution.
        const { data: existingStripe } = await supabaseAdmin
            .from('payment_settings')
            .select('id')
            .eq('provider', 'stripe')
            .maybeSingle();

        let stripeError: any = null;

        if (existingStripe) {
            const { error: updateError } = await supabaseAdmin
                .from('payment_settings')
                .update({
                    publishable_key: publishableKey,
                    secret_key: secretKey,
                    mode: mode,
                    is_active: true,
                    updated_by: auth.email
                })
                .eq('provider', 'stripe');
            stripeError = updateError;
        } else {
            const { error: insertError } = await supabaseAdmin
                .from('payment_settings')
                .insert({
                    provider: 'stripe',
                    publishable_key: publishableKey,
                    secret_key: secretKey,
                    mode: mode,
                    is_active: true,
                    updated_by: auth.email
                });
            stripeError = insertError;
        }

        if (stripeError) {
            console.error('Error saving Stripe settings:', stripeError);
            return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
        }

        invalidateStripeConfigCache();
        return NextResponse.json({ success: true, message: 'Stripe settings saved successfully.' });

    } catch (error) {
        console.error('Error in POST payment settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
