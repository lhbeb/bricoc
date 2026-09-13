import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderStripeStatus, getOrderById } from '@/lib/supabase/orders';
import { getProductBySlug } from '@/lib/supabase/products';
import { getStripeConfig } from '@/lib/supabase/payment-settings';
import { resolveBaseUrl } from '@/lib/url';

// Stripe initialization deferred to POST request handling to avoid build-time crashes

// Helper function to sanitize Stripe errors for user-facing responses
function getSafeStripeError(error: any): string {
    // Log the actual error for debugging (server-side only)
    console.error('🚨 [Stripe Error Details]:', {
        type: error.type,
        code: error.code,
        message: error.message,
        raw: error.raw,
    });

    // Check for sensitive errors that should NOT be exposed to users
    const sensitiveErrors = [
        'api_key',
        'authentication',
        'invalid_request_error',
        'expired',
        'sk_live',
        'sk_test',
        'secret',
        'token',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    const isSensitive = sensitiveErrors.some(sensitive => errorMessage.includes(sensitive));

    if (isSensitive) {
        // Return generic error for sensitive issues
        return 'Payment processing is temporarily unavailable. Please email contact@bricoc.com';
    }

    // For non-sensitive errors, we can show a slightly more specific message
    // but still avoid technical jargon
    if (error.type === 'card_error') {
        return 'There was an issue with your payment method. Please try a different card or email contact@bricoc.com';
    }

    // Generic fallback for any other errors
    return 'An error occurred during payment processing. Please email contact@bricoc.com';
}

export async function POST(request: NextRequest) {
    try {
        // Initialize Stripe with active DB secret key
        // Must use 'sk_test_' fallback to pass static evaluation if env is completely empty
        const stripeConfig = await getStripeConfig();
        const stripe = new Stripe(stripeConfig.secretKey || 'sk_test_placeholder', {
            apiVersion: '2026-01-28.clover' as any,
        });
        
        const body = await request.json();
        const { orderId, product, shippingData } = body;

        // Validate required data
        if (!orderId || !product?.slug || !shippingData) {
            return NextResponse.json(
                { error: 'Missing required data: orderId, product or shippingData' },
                { status: 400 }
            );
        }

        if (typeof shippingData.fullName !== 'string' || !shippingData.fullName.trim()) {
            return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
        }
        shippingData.fullName = shippingData.fullName.trim();

        // Server-side verification: NEVER trust client-supplied price/currency/title.
        // The cart lives in localStorage, so a tampered price must not reach Stripe.
        const dbProduct = await getProductBySlug(product.slug);
        if (!dbProduct) {
            console.error('🚨 [Stripe] Product not found or unpublished:', product.slug);
            return NextResponse.json(
                { error: 'This product is no longer available for purchase.' },
                { status: 404 }
            );
        }

        if (dbProduct.inStock === false) {
            console.error('🚨 [Stripe] Product is out of stock:', product.slug);
            return NextResponse.json(
                { error: 'Sorry, this item is currently sold out.' },
                { status: 409 }
            );
        }

        // Verify the order exists and belongs to this product
        const order = await getOrderById(orderId);
        if (!order) {
            console.error('🚨 [Stripe] Order not found:', orderId);
            return NextResponse.json(
                { error: 'Order could not be found. Please start checkout again.' },
                { status: 400 }
            );
        }

        if (order.product_slug !== dbProduct.slug) {
            console.error('🚨 [Stripe] Order/product mismatch:', {
                orderId,
                orderSlug: order.product_slug,
                productSlug: dbProduct.slug,
            });
            return NextResponse.json(
                { error: 'Order does not match this product. Please start checkout again.' },
                { status: 400 }
            );
        }

        if (order.status === 'paid') {
            console.error('🚨 [Stripe] Order already paid:', orderId);
            return NextResponse.json(
                { error: 'This order has already been paid.' },
                { status: 409 }
            );
        }

        if (order.checkout_flow !== 'stripe-hosted') {
            return NextResponse.json(
                { error: 'This order is not configured for Stripe Hosted Checkout.' },
                { status: 400 }
            );
        }

        // Use Bricoc's trusted production origin for Stripe's return URLs.
        const origin = process.env.NODE_ENV === 'development'
            ? request.nextUrl.origin
            : resolveBaseUrl();
        const shippingAddress = {
            line1: shippingData.streetAddress,
            line2: shippingData.addressLine2 || undefined,
            country: shippingData.countryCode || undefined,
            city: shippingData.city,
            state: shippingData.state,
            postal_code: shippingData.zipCode,
        };
        const orderReference = order.order_number ? `#${order.order_number}` : orderId;

        // Create a Stripe-hosted Checkout Session. The delivery address was already
        // collected and saved on Bricoc, so the hosted page only needs payment data.
        // NOTE: price/currency/title come from the DATABASE, not the client.
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: dbProduct.currency?.toLowerCase() || 'usd',
                        product_data: {
                            name: dbProduct.title,
                            description: `Bricoc order ${orderReference}`,
                            images: dbProduct.images && dbProduct.images.length > 0 ? [dbProduct.images[0]] : undefined,
                        },
                        unit_amount: Math.round(dbProduct.price * 100), // Stripe expects amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/thankyou?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout?payment=cancelled&provider=stripe-hosted`,
            client_reference_id: orderId,
            customer_email: shippingData.email,
            payment_intent_data: {
                shipping: {
                    name: shippingData.fullName || shippingData.email,
                    address: shippingAddress,
                },
            },
            // Stripe requires expires_at to be at least 30 minutes from now
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes from now
            metadata: {
                order_id: orderId,
                product_slug: dbProduct.slug,
                product_id: dbProduct.id,
                customer_email: shippingData.email,
                shipping_address: shippingData.streetAddress,
                shipping_city: shippingData.city,
                shipping_state: shippingData.state,
                shipping_zip: shippingData.zipCode,
            },
        });

        // CRITICAL: Update the local database order with the Checkout Session ID
        const linked = await updateOrderStripeStatus(orderId, {
            stripe_checkout_session_id: session.id,
            status: 'pending_payment',
            checkout_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });

        if (!linked) {
            // If the link fails, don't let the customer pay into an unlinked order.
            throw new Error('Failed to link Stripe session to order');
        }

        if (!session.url) {
            throw new Error('Stripe did not return a hosted Checkout URL');
        }

        return NextResponse.json({
            url: session.url,
            sessionId: session.id
        });
    } catch (error: any) {
        // Get sanitized error message (hides sensitive API details)
        const safeErrorMessage = getSafeStripeError(error);

        return NextResponse.json(
            { error: safeErrorMessage },
            { status: 500 }
        );
    }
}
