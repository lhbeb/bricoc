import { supabaseAdmin } from './server';

export interface StripeConfig {
    publishableKey: string;
    secretKey: string;
    mode: 'live' | 'test';
    isActive: boolean;
}

/**
 * Fetches the active Stripe configuration from the database.
 * If not configured in the DB, it falls back to environment variables.
 * Caches the result in memory for 1 minute to prevent hammering the DB.
 */
let cachedConfig: StripeConfig | null = null;
let lastFetchTime = 0;

let cachedPaypalConfig: PaypalConfig | null = null;
let lastPaypalFetchTime = 0;

let cachedPaypalApiConfig: PaypalApiConfig | null = null;
let lastPaypalApiFetchTime = 0;

const CACHE_TTL = 0; // Temporarily 0 to flush cache

export async function getStripeConfig(): Promise<StripeConfig> {
    const now = Date.now();
    
    // Return cached config if it's still valid
    if (cachedConfig && (now - lastFetchTime) < CACHE_TTL) {
        return cachedConfig;
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('payment_settings')
            .select('publishable_key, secret_key, mode, is_active')
            .eq('provider', 'stripe')
            .eq('is_active', true)
            .single();

        if (!error && data) {
            cachedConfig = {
                publishableKey: data.publishable_key,
                secretKey: data.secret_key,
                mode: data.mode as 'live' | 'test',
                isActive: data.is_active
            };
            lastFetchTime = now;
            return cachedConfig;
        }
        
        // If row not found (PGRST116), log explicitly
        if (error && error.code === 'PGRST116') {
             console.warn('⚠️ [Payment Settings] No active Stripe configuration found in Supabase. Falling back to environment variables.');
        } else if (error) {
             console.error('❌ [Payment Settings] Error fetching Stripe config:', error);
        }
    } catch (err) {
        console.error('❌ [Payment Settings] Unexpected error fetching Stripe config:', err);
    }

    // Fallback to environment variables
    const fallbackConfig: StripeConfig = {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        mode: process.env.NODE_ENV === 'production' ? 'live' : 'test',
        isActive: !!process.env.STRIPE_SECRET_KEY
    };

    if (!fallbackConfig.secretKey) {
         console.warn('⚠️ [Payment Settings] Both Supabase and environment variables are missing Stripe Secret Key!');
    }

    // Cache the fallback so we don't spam the DB when things are intentionally left as env variables
    cachedConfig = fallbackConfig;
    lastFetchTime = now;

    return fallbackConfig;
}

export interface PaypalConfig {
    payeeEmail: string;
}

export interface PaypalApiConfig {
    clientId: string;
    clientSecret: string;
    merchantEmail: string;
    mode: 'sandbox' | 'live';
    isActive: boolean;
}

/**
 * Fetches the global PayPal Direct Checkout configuration from the database.
 */
export async function getPaypalDirectConfig(): Promise<PaypalConfig> {
    const now = Date.now();
    
    if (cachedPaypalConfig && (now - lastPaypalFetchTime) < CACHE_TTL) {
        return cachedPaypalConfig;
    }

    let payeeEmail = '';

    try {
        // Fetch PayPal Direct Checkout email
        const primaryResult = await supabaseAdmin
            .from('payment_settings')
            .select('payee_email, publishable_key')
            .eq('provider', 'paypal-direct')
            .eq('is_active', true)
            .single();

        if (!primaryResult.error && primaryResult.data) {
            payeeEmail = primaryResult.data.payee_email || primaryResult.data.publishable_key || '';
        } else if (primaryResult.error && primaryResult.error.code === '42703') {
            const fallbackResult = await supabaseAdmin
                .from('payment_settings')
                .select('publishable_key')
                .eq('provider', 'paypal-direct')
                .eq('is_active', true)
                .single();
            if (!fallbackResult.error && fallbackResult.data) {
                payeeEmail = fallbackResult.data.publishable_key || '';
            }
        }
    } catch (err) {
        console.error('❌ [Payment Settings] Unexpected error fetching PayPal config:', err);
    }

    cachedPaypalConfig = { payeeEmail };
    lastPaypalFetchTime = now;
    return cachedPaypalConfig;
}

/**
 * Backward-compatible alias.
 * @deprecated Use getPaypalDirectConfig instead.
 */
export const getPaypalUnclaimedConfig = getPaypalDirectConfig;

/**
 * Fetches PayPal Orders API credentials. This function is server-only because
 * the service-role Supabase client and PayPal Client Secret must never reach the browser.
 */
export async function getPaypalApiConfig(): Promise<PaypalApiConfig> {
    const now = Date.now();

    if (cachedPaypalApiConfig && (now - lastPaypalApiFetchTime) < CACHE_TTL) {
        return cachedPaypalApiConfig;
    }

    const emptyConfig: PaypalApiConfig = {
        clientId: '',
        clientSecret: '',
        merchantEmail: '',
        mode: 'sandbox',
        isActive: false,
    };

    try {
        const { data, error } = await supabaseAdmin
            .from('payment_settings')
            .select('publishable_key, secret_key, payee_email, mode, is_active')
            .eq('provider', 'paypal-api')
            .eq('is_active', true)
            .maybeSingle();

        if (error) {
            console.error('[Payment Settings] Error fetching PayPal API config:', error);
            return emptyConfig;
        }

        if (data) {
            cachedPaypalApiConfig = {
                clientId: data.publishable_key || '',
                clientSecret: data.secret_key || '',
                merchantEmail: data.payee_email || '',
                mode: data.mode === 'live' ? 'live' : 'sandbox',
                isActive: Boolean(data.is_active),
            };
            lastPaypalApiFetchTime = now;
            return cachedPaypalApiConfig;
        }
    } catch (error) {
        console.error('[Payment Settings] Unexpected error fetching PayPal API config:', error);
    }

    return emptyConfig;
}

/**
 * Force invalidate the Stripe config cache.
 */
export function invalidateStripeConfigCache() {
    cachedConfig = null;
    lastFetchTime = 0;
}

export function invalidatePaypalConfigCache() {
    cachedPaypalConfig = null;
    lastPaypalFetchTime = 0;
}

export function invalidatePaypalApiConfigCache() {
    cachedPaypalApiConfig = null;
    lastPaypalApiFetchTime = 0;
}
