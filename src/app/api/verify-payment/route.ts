import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getOrderById, updateOrderStripeStatus } from '@/lib/supabase/orders';
import { getStripeConfig } from '@/lib/supabase/payment-settings';

// Stripe initialization deferred to handler to avoid build-time crashes

export async function POST(request: NextRequest) {
    try {
        // Initialize Stripe inside handler to defer until runtime (avoids Vercel build crash)
        const stripeConfig = await getStripeConfig();
        const stripe = new Stripe(stripeConfig.secretKey || 'sk_test_placeholder', {
            apiVersion: '2026-01-28.clover' as any,
        });

        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Missing session ID' },
                { status: 400 }
            );
        }

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        console.log('✅ [Payment Verification] Checkout Session retrieved:', {
            id: session.id,
            status: session.status,
            payment_status: session.payment_status,
            amount: session.amount_total,
        });

        // Strict verification: Require Stripe session to be paid
        if (session.payment_status !== 'paid') {
            return NextResponse.json({
                status: 'pending',
                message: 'Payment not completed or still processing'
            });
        }
        
        const orderId = session.metadata?.order_id;
        if (!orderId) {
             return NextResponse.json(
                { error: 'Session missing order metadata' },
                { status: 400 }
            );
        }
        
        let order = await getOrderById(orderId);
        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        const paymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id;

        // Auto-heal / Fallback: If DB status is not 'paid', mark it paid now
        if (order.status !== 'paid') {
            console.log(`[Payment Verification] Updating order ${orderId} to PAID directly...`);
            const updated = await updateOrderStripeStatus(orderId, {
                status: 'paid',
                stripe_payment_intent_id: paymentIntentId,
                stripe_payment_status: session.payment_status,
                paid_at: new Date().toISOString()
            });

            if (!updated) throw new Error('Failed to update paid order');

            // Re-fetch updated order object
            order = (await getOrderById(orderId)) || order;
        }

        // Send payment success notification email if not already sent
        if (!order.stripe_email_sent) {
            try {
                console.log(`[Payment Verification] Sending payment notification emails for order ${orderId}...`);
                const { sendStripePaymentSuccessEmail } = await import('@/lib/email/sender');
                await sendStripePaymentSuccessEmail(order, {
                    paymentIntentId,
                    amount: session.amount_total ?? undefined,
                    currency: session.currency ?? undefined,
                });
            } catch (emailErr) {
                console.error(`[Payment Verification] Failed to send email for order ${orderId}:`, emailErr);
            }
        }

        // Return payment status and details securely
        return NextResponse.json({
            status: 'paid', // Explicit trust signal for frontend
            orderId: order.id,
            productSlug: order.product_slug,
            productTitle: order.product_title || null,
            sessionId: session.id,
            amount: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_email || session.metadata?.customer_email || null,
        });

    } catch (error: any) {
        console.error('❌ [Payment Verification] Error:', error);

        // Don't expose Stripe errors to client
        return NextResponse.json(
            {
                error: 'Unable to verify payment. Please contact support if you completed a payment.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
