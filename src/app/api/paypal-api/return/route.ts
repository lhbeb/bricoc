import { NextRequest, NextResponse } from 'next/server';
import {
  capturePaypalOrder,
  getPaypalOrder,
  PaypalApiError,
  type PaypalOrderResponse,
} from '@/lib/paypal-api';
import { sendPaypalPaymentSuccessEmail } from '@/lib/email/sender';
import { getOrderById, updateOrderPaypalStatus } from '@/lib/supabase/orders';
import { getPaypalApiConfig } from '@/lib/supabase/payment-settings';
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

function makeCaptureRequestId(orderId: string): string {
  return `${orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}-c`;
}

function getCompletedCapture(order: PaypalOrderResponse) {
  return order.purchase_units
    ?.flatMap(unit => unit.payments?.captures || [])
    .find(capture => capture.status === 'COMPLETED') || null;
}

function redirectToCheckout(baseUrl: string, payment: 'failed' | 'cancelled') {
  const url = new URL('/checkout', baseUrl);
  url.searchParams.set('payment', payment);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NODE_ENV === 'development'
    ? request.nextUrl.origin
    : resolveBaseUrl();
  const paypalOrderId = request.nextUrl.searchParams.get('token')?.trim() || '';

  if (!paypalOrderId) {
    return redirectToCheckout(baseUrl, 'failed');
  }

  try {
    const config = await getPaypalApiConfig();
    if (!config.isActive || !config.clientId || !config.clientSecret) {
      throw new PaypalApiError('PayPal API checkout is not configured.', 503);
    }

    const approvedOrder = await getPaypalOrder(config, paypalOrderId);
    const localOrderId = approvedOrder.purchase_units?.[0]?.custom_id || '';
    if (!localOrderId) {
      console.error('[PayPal API] Returned order has no local order reference:', paypalOrderId);
      return redirectToCheckout(baseUrl, 'failed');
    }

    const localOrder = await getOrderById(localOrderId);
    if (!localOrder || localOrder.checkout_flow !== 'paypal-api') {
      console.error('[PayPal API] Local order validation failed:', localOrderId);
      return redirectToCheckout(baseUrl, 'failed');
    }

    const fullOrderData = parseRecord(localOrder.full_order_data);
    const storedPaypalData = parseRecord(fullOrderData.paypalApi);
    if (storedPaypalData.orderId !== paypalOrderId) {
      console.error('[PayPal API] PayPal/local order ID mismatch:', localOrderId);
      return redirectToCheckout(baseUrl, 'failed');
    }

    if (localOrder.status === 'paid' || localOrder.status === 'payment_review') {
      return NextResponse.redirect(new URL('/thankyou', baseUrl));
    }

    let capturedOrder: PaypalOrderResponse;
    try {
      capturedOrder = await capturePaypalOrder(
        config,
        paypalOrderId,
        makeCaptureRequestId(localOrderId),
      );
    } catch (error) {
      if (!(error instanceof PaypalApiError)) throw error;

      // A repeated return can race the original capture. Re-read the PayPal order;
      // a completed order is safe to continue processing idempotently.
      const latestOrder = await getPaypalOrder(config, paypalOrderId);
      if (latestOrder.status !== 'COMPLETED') throw error;
      capturedOrder = latestOrder;
    }

    const capture = getCompletedCapture(capturedOrder);
    const expectedAmount = String(storedPaypalData.amount || Number(localOrder.product_price).toFixed(2));
    const expectedCurrency = String(storedPaypalData.currency || 'USD').toUpperCase();
    const paidAmount = capture?.amount?.value || '';
    const paidCurrency = capture?.amount?.currency_code || '';

    if (capturedOrder.status !== 'COMPLETED' || !capture?.id) {
      console.error('[PayPal API] Capture validation failed:', {
        paypalOrderId,
        status: capturedOrder.status,
        expectedAmount,
        paidAmount,
        expectedCurrency,
        paidCurrency,
      });
      return redirectToCheckout(baseUrl, 'failed');
    }

    const amountMatches = Number(paidAmount) === Number(expectedAmount)
      && paidCurrency.toUpperCase() === expectedCurrency;

    if (!amountMatches) {
      // The buyer has already paid. Keep them on the success path to prevent a
      // second charge, while clearly flagging the order for manual review.
      console.error('[PayPal API] Completed capture amount mismatch:', {
        paypalOrderId,
        expectedAmount,
        paidAmount,
        expectedCurrency,
        paidCurrency,
      });
    }

    const paidAt = new Date().toISOString();
    const paymentData = {
      orderId: paypalOrderId,
      captureId: capture.id,
      status: capturedOrder.status,
      captureStatus: capture.status,
      amount: paidAmount,
      currency: paidCurrency,
      payerId: capturedOrder.payer?.payer_id || null,
      payerEmail: capturedOrder.payer?.email_address || null,
      completedAt: capture.update_time || capture.create_time || paidAt,
      mode: config.mode,
    };

    const finalStatus = amountMatches ? 'paid' : 'payment_review';
    const completedOrderData = {
      ...fullOrderData,
      paypalApi: {
        ...paymentData,
        amountMatches,
        expectedAmount,
        expectedCurrency,
      },
    };

    let updated = false;
    for (let attempt = 0; attempt < 3 && !updated; attempt += 1) {
      updated = await updateOrderPaypalStatus(localOrderId, {
        status: finalStatus,
        full_order_data: completedOrderData,
      });

      if (!updated && attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }

    if (!updated) {
      console.error('[PayPal API] Payment captured but local order update failed:', localOrderId);
    }

    const emailResult = await sendPaypalPaymentSuccessEmail(localOrder, {
      txnId: capture.id,
      paymentStatus: capture.status,
      mcGross: paidAmount,
      mcCurrency: paidCurrency,
      payerEmail: capturedOrder.payer?.email_address,
      receiverEmail: config.merchantEmail,
    });

    if (!emailResult.success) {
      console.error('[PayPal API] Payment recorded but notification email failed:', emailResult.error);
    } else {
      await updateOrderPaypalStatus(localOrderId, {
        status: finalStatus,
        full_order_data: {
          ...completedOrderData,
          paypalPaymentNotificationSentAt: paidAt,
        },
      });
    }

    return NextResponse.redirect(new URL('/thankyou', baseUrl));
  } catch (error) {
    if (error instanceof PaypalApiError) {
      console.error('[PayPal API] Return/capture failed:', {
        status: error.status,
        debugId: error.debugId,
        message: error.message,
      });
    } else {
      console.error('[PayPal API] Unexpected return/capture error:', error);
    }
    return redirectToCheckout(baseUrl, 'failed');
  }
}
