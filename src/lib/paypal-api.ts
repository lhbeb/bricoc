import 'server-only';

import type { PaypalApiConfig } from '@/lib/supabase/payment-settings';

type PaypalLink = {
  href?: string;
  rel?: string;
  method?: string;
};

export type PaypalOrderResponse = {
  id?: string;
  status?: string;
  links?: PaypalLink[];
  payer?: {
    email_address?: string;
    payer_id?: string;
    name?: { given_name?: string; surname?: string };
  };
  purchase_units?: Array<{
    custom_id?: string;
    invoice_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: { currency_code?: string; value?: string };
        create_time?: string;
        update_time?: string;
      }>;
    };
  }>;
};

interface PaypalErrorResponse {
  name?: string;
  message?: string;
  debug_id?: string;
  details?: Array<{ issue?: string; description?: string }>;
}

export class PaypalApiError extends Error {
  status: number;
  debugId?: string;
  details?: PaypalErrorResponse['details'];

  constructor(message: string, status: number, response?: PaypalErrorResponse) {
    super(message);
    this.name = 'PaypalApiError';
    this.status = status;
    this.debugId = response?.debug_id;
    this.details = response?.details;
  }
}

let cachedAccessToken: { key: string; value: string; expiresAt: number } | null = null;

function getPaypalBaseUrl(mode: PaypalApiConfig['mode']): string {
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function describePaypalError(response: PaypalErrorResponse | null, fallback: string): string {
  const detail = response?.details?.find(item => item.description || item.issue);
  return detail?.description || detail?.issue || response?.message || fallback;
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
}

export function invalidatePaypalAccessTokenCache() {
  cachedAccessToken = null;
}

export async function getPaypalAccessToken(config: PaypalApiConfig): Promise<string> {
  if (!config.clientId || !config.clientSecret || !config.isActive) {
    throw new PaypalApiError('PayPal API checkout is not configured.', 503);
  }

  const cacheKey = `${config.mode}:${config.clientId}:${config.clientSecret}`;
  if (cachedAccessToken?.key === cacheKey && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.value;
  }

  const response = await fetch(`${getPaypalBaseUrl(config.mode)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  const data = await readJson<{ access_token?: string; expires_in?: number } & PaypalErrorResponse>(response);
  if (!response.ok || !data?.access_token) {
    throw new PaypalApiError(
      describePaypalError(data, 'PayPal rejected the API credentials.'),
      response.status,
      data || undefined,
    );
  }

  cachedAccessToken = {
    key: cacheKey,
    value: data.access_token,
    expiresAt: Date.now() + Math.max(60, (data.expires_in || 300) - 60) * 1000,
  };

  return data.access_token;
}

async function paypalRequest<T>(
  config: PaypalApiConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken = await getPaypalAccessToken(config);
  const response = await fetch(`${getPaypalBaseUrl(config.mode)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });

  const data = await readJson<T & PaypalErrorResponse>(response);
  if (!response.ok || !data) {
    throw new PaypalApiError(
      describePaypalError(data, 'PayPal could not process the request.'),
      response.status,
      data || undefined,
    );
  }

  return data;
}

export async function validatePaypalApiCredentials(config: PaypalApiConfig): Promise<void> {
  invalidatePaypalAccessTokenCache();
  await getPaypalAccessToken(config);
}

export async function createPaypalOrder(
  config: PaypalApiConfig,
  input: {
    requestId: string;
    localOrderId: string;
    amount: string;
    currency: string;
    description: string;
    returnUrl: string;
    cancelUrl: string;
    shipping: {
      fullName: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      countryCode: string;
    };
  },
): Promise<PaypalOrderResponse> {
  const shippingAddress: Record<string, string> = {
    address_line_1: input.shipping.addressLine1,
    admin_area_2: input.shipping.city,
    admin_area_1: input.shipping.state,
    postal_code: input.shipping.postalCode,
    country_code: input.shipping.countryCode,
  };

  if (input.shipping.addressLine2) {
    shippingAddress.address_line_2 = input.shipping.addressLine2;
  }

  return paypalRequest<PaypalOrderResponse>(config, '/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'PayPal-Request-Id': input.requestId,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: input.localOrderId,
        custom_id: input.localOrderId,
        invoice_id: input.localOrderId,
        description: input.description.slice(0, 127),
        amount: {
          currency_code: input.currency,
          value: input.amount,
        },
        shipping: {
          name: { full_name: input.shipping.fullName.slice(0, 300) },
          address: shippingAddress,
        },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'Bricoc',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            shipping_preference: 'SET_PROVIDED_ADDRESS',
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
  });
}

export async function getPaypalOrder(
  config: PaypalApiConfig,
  paypalOrderId: string,
): Promise<PaypalOrderResponse> {
  return paypalRequest<PaypalOrderResponse>(
    config,
    `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
    { method: 'GET' },
  );
}

export async function capturePaypalOrder(
  config: PaypalApiConfig,
  paypalOrderId: string,
  requestId: string,
): Promise<PaypalOrderResponse> {
  return paypalRequest<PaypalOrderResponse>(
    config,
    `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {
      method: 'POST',
      headers: {
        'PayPal-Request-Id': requestId,
        Prefer: 'return=representation',
      },
      body: '{}',
    },
  );
}

export function getPaypalApprovalUrl(order: PaypalOrderResponse): string | null {
  return order.links?.find(link => link.rel === 'payer-action')?.href
    || order.links?.find(link => link.rel === 'approve')?.href
    || null;
}
