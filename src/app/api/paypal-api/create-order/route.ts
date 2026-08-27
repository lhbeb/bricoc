import { NextRequest, NextResponse } from 'next/server';
import {
  createPaypalOrder,
  getPaypalApprovalUrl,
  PaypalApiError,
} from '@/lib/paypal-api';
import { getCountryName, getRegionCode, isBig4Country, normalizeShippingData } from '@/lib/shipping';
import { getOrderById } from '@/lib/supabase/orders';
import { getPaypalApiConfig } from '@/lib/supabase/payment-settings';
import { supabaseAdmin } from '@/lib/supabase/server';
import { resolveBaseUrl } from '@/lib/url';

export const dynamic = 'force-dynamic';

function parseRecord(value: unknown): Record<string, any> {
  if (value && typeof value === 'object') return value as Record<string, any>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function makeRequestId(orderId: string, suffix: string): string {
  return `${orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}-${suffix}`;
}

function formatAmount(value: unknown): string | null {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount.toFixed(2);
}

function inferCustomerName(email: string): string {
  const localPart = email.split('@')[0] || '';
  const words = localPart.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  return words || 'Bricoc Customer';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as { orderId?: unknown } | null;
    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : '';

    if (!/^[0-9a-fA-F-]{32,36}$/.test(orderId)) {
      return NextResponse.json({ error: 'Invalid order reference.' }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.checkout_flow !== 'paypal-api') {
      return NextResponse.json({ error: 'This order does not use PayPal API checkout.' }, { status: 400 });
    }

    if (order.status === 'paid') {
      return NextResponse.json({ approvalUrl: '/thankyou' });
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('slug, title, price, currency, checkout_flow')
      .eq('slug', order.product_slug)
      .single();

    if (productError || !product) {
      console.error('[PayPal API] Product lookup failed:', productError);
      return NextResponse.json({ error: 'The product could not be verified.' }, { status: 409 });
    }

    if (product.checkout_flow !== 'paypal-api') {
      return NextResponse.json({ error: 'PayPal API checkout is no longer enabled for this product.' }, { status: 409 });
    }

    const amount = formatAmount(product.price);
    const currency = String(product.currency || 'USD').trim().toUpperCase();
    if (!amount || !/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: 'The product price or currency is invalid.' }, { status: 409 });
    }

    const fullOrderData = parseRecord(order.full_order_data);
    const storedShipping = parseRecord(fullOrderData.shippingData);
    const shipping = normalizeShippingData({
      ...storedShipping,
      streetAddress: order.shipping_address || storedShipping.streetAddress,
      addressLine2: order.shipping_address_line_2 || storedShipping.addressLine2,
      city: order.shipping_city || storedShipping.city,
      state: order.shipping_state || storedShipping.state,
      zipCode: order.shipping_zip || storedShipping.zipCode,
      countryCode: order.shipping_country_code || storedShipping.countryCode,
      country: order.shipping_country || storedShipping.country,
      email: order.customer_email || storedShipping.email,
    });

    if (
      !shipping.streetAddress || !shipping.city || !shipping.state || !shipping.zipCode
      || !isBig4Country(shipping.countryCode) || !shipping.email
    ) {
      return NextResponse.json({ error: 'The saved delivery address is incomplete.' }, { status: 409 });
    }

    const config = await getPaypalApiConfig();
    if (!config.isActive || !config.clientId || !config.clientSecret) {
      return NextResponse.json(
        { error: 'PayPal API checkout is not configured. Please contact support.' },
        { status: 503 },
      );
    }

    const baseUrl = process.env.NODE_ENV === 'development'
      ? request.nextUrl.origin
      : resolveBaseUrl();
    const returnUrl = `${baseUrl}/api/paypal-api/return`;
    const cancelUrl = `${baseUrl}/checkout?payment=cancelled`;

    const paypalOrder = await createPaypalOrder(config, {
      requestId: makeRequestId(orderId, 'o'),
      localOrderId: orderId,
      amount,
      currency,
      description: product.title || order.product_title,
      returnUrl,
      cancelUrl,
      shipping: {
        fullName: shipping.fullName || inferCustomerName(shipping.email),
        addressLine1: shipping.streetAddress,
        addressLine2: shipping.addressLine2,
        city: shipping.city,
        state: getRegionCode(shipping.countryCode, shipping.state),
        postalCode: shipping.zipCode,
        countryCode: shipping.countryCode,
      },
    });

    const approvalUrl = getPaypalApprovalUrl(paypalOrder);
    if (!paypalOrder.id || !approvalUrl) {
      console.error('[PayPal API] Create order response had no approval URL:', paypalOrder.status);
      return NextResponse.json({ error: 'PayPal did not return a checkout link.' }, { status: 502 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        product_price: Number(amount),
        payment_provider: 'paypal-api',
        status: 'pending_payment',
        full_order_data: {
          ...fullOrderData,
          shippingData: {
            ...shipping,
            country: shipping.country || getCountryName(shipping.countryCode),
          },
          paypalApi: {
            orderId: paypalOrder.id,
            status: paypalOrder.status || 'CREATED',
            amount,
            currency,
            mode: config.mode,
            createdAt: new Date().toISOString(),
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('checkout_flow', 'paypal-api');

    if (updateError) {
      console.error('[PayPal API] Failed to attach PayPal order to local order:', updateError);
      return NextResponse.json({ error: 'Could not finalize PayPal checkout initialization.' }, { status: 500 });
    }

    return NextResponse.json({ approvalUrl });
  } catch (error) {
    if (error instanceof PaypalApiError) {
      console.error('[PayPal API] Create order failed:', {
        status: error.status,
        debugId: error.debugId,
        message: error.message,
      });
      const status = error.status === 401 ? 503 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error('[PayPal API] Unexpected create order error:', error);
    return NextResponse.json({ error: 'Could not connect to PayPal.' }, { status: 500 });
  }
}
