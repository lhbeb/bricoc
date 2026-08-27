import { NextRequest, NextResponse } from 'next/server';
import { saveOrder, getOrderById } from '@/lib/supabase/orders';
import {
  isBig4Country,
  isPaypalCheckoutFlow,
  isPostalCodeValid,
  normalizeShippingData,
  usesCountryFirstAddress,
} from '@/lib/shipping';
import { supabaseAdmin } from '@/lib/supabase/server';
import { resolveBaseUrl } from '@/lib/url';

// This endpoint saves the order and attempts to send email with a 5-second timeout
// If email fails or times out, the order is still saved and email will retry automatically

function sanitizeCheckoutLinks(links: unknown): string[] {
  if (!Array.isArray(links)) return [];

  return links
    .map((link) => typeof link === 'string' ? link.trim() : '')
    .filter((link) => {
      if (!link) return false;
      try {
        const url = new URL(link);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    });
}

async function claimCheckoutLinkRotationIndex(productSlug: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin.rpc('claim_checkout_link_rotation_index', {
    p_product_slug: productSlug,
  });

  if (error) {
    console.error('❌ [Checkout Link Rotation] Failed to claim atomic rotation index:', error);
    return null;
  }

  const claimedIndex = typeof data === 'number' ? data : Number(data);
  return Number.isFinite(claimedIndex) ? claimedIndex : null;
}

async function fallbackCheckoutLinkRotationIndex(productSlug: string): Promise<number | null> {
  const { count, error: countError } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('product_slug', productSlug);

  if (countError) {
    console.error('❌ [Checkout Link Rotation] Failed to count existing orders:', countError);
    return null;
  }

  return count || 0;
}

async function resolveAssignedCheckoutLink(product: any): Promise<string> {
  const fallbackLink = typeof product.checkoutLink === 'string'
    ? product.checkoutLink
    : typeof product.checkout_link === 'string'
      ? product.checkout_link
      : '';

  try {
    const { data: productConfig, error: productError } = await supabaseAdmin
      .from('products')
      .select('checkout_link, meta')
      .eq('slug', product.slug)
      .single();

    if (productError || !productConfig) {
      if (productError?.code !== 'PGRST116') {
        console.error('❌ [Checkout Link Rotation] Failed to fetch product config:', productError);
      }
      return fallbackLink;
    }

    const defaultLink = productConfig.checkout_link || fallbackLink;
    const meta = productConfig.meta || {};
    const rotatedLinks = sanitizeCheckoutLinks(meta.checkout_links);

    if (!meta.rotate_links || rotatedLinks.length === 0) {
      return defaultLink;
    }

    const claimedIndex = await claimCheckoutLinkRotationIndex(product.slug)
      ?? await fallbackCheckoutLinkRotationIndex(product.slug);

    if (claimedIndex === null) {
      return rotatedLinks[0] || defaultLink;
    }

    const nextIndex = claimedIndex % rotatedLinks.length;
    return rotatedLinks[nextIndex] || defaultLink;
  } catch (error) {
    console.error('❌ [Checkout Link Rotation] Unexpected error:', error);
    return fallbackLink;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let orderId: string | null = null;
  let assignedCheckoutLink = '';
  
  try {
    const body = await request.json();
    console.log('📦 [API] Received request body:', JSON.stringify(body, null, 2));
    
    const { shippingData: rawShippingData, product } = body;

    // Validate required data
    if (!rawShippingData || !product) {
      console.error('❌ [API] Missing required data:', { hasShippingData: !!rawShippingData, hasProduct: !!product });
      return NextResponse.json(
        { error: 'Missing required data: shippingData or product' },
        { status: 400 }
      );
    }

    const checkoutFlow = product.checkoutFlow || product.checkout_flow;
    const requiresCountry = usesCountryFirstAddress(checkoutFlow);
    const shippingData = requiresCountry ? normalizeShippingData(rawShippingData) : rawShippingData;

    // Validate shipping data fields
    if (!shippingData.email || !shippingData.streetAddress || !shippingData.city || !shippingData.state || !shippingData.zipCode) {
      console.error('❌ [API] Missing required shipping fields:', {
        email: !!shippingData.email,
        streetAddress: !!shippingData.streetAddress,
        city: !!shippingData.city,
        state: !!shippingData.state,
        zipCode: !!shippingData.zipCode,
      });
      return NextResponse.json(
        { error: 'Missing required shipping data fields' },
        { status: 400 }
      );
    }

    if (requiresCountry && (!shippingData.countryCode || !shippingData.country)) {
      console.error('❌ [API] Missing delivery country for country-aware checkout');
      return NextResponse.json(
        { error: 'Missing delivery country' },
        { status: 400 }
      );
    }

    if (isPaypalCheckoutFlow(checkoutFlow) && !isBig4Country(shippingData.countryCode)) {
      console.error('❌ [API] Invalid delivery country for PayPal checkout flow:', shippingData.countryCode);
      return NextResponse.json(
        { error: 'PayPal checkout flows only support Big 4 countries (US, CA, GB, AU)' },
        { status: 400 }
      );
    }

    if (requiresCountry && !isPostalCodeValid(shippingData.zipCode, shippingData.countryCode)) {
      console.error('❌ [API] Invalid postal code for selected country:', shippingData.countryCode);
      return NextResponse.json(
        { error: 'Invalid postal code for selected delivery country' },
        { status: 400 }
      );
    }

    // Validate product fields
    if (!product.slug || !product.title || product.price === undefined) {
      console.error('❌ [API] Missing required product fields:', {
        slug: !!product.slug,
        title: !!product.title,
        price: product.price !== undefined,
      });
      return NextResponse.json(
        { error: 'Missing required product fields' },
        { status: 400 }
      );
    }

    const originHeader = request.headers.get('origin');
    const refererHeader = request.headers.get('referer');
    const siteUrl = resolveBaseUrl([
      body?.siteUrl,
      rawShippingData?.siteUrl,
      originHeader,
      refererHeader,
    ]);

    // STEP 1: Save order to database FIRST (so we never lose the order)
    console.log('📦 [API] Starting order save process...');
    console.log('📦 [API] Product:', { slug: product.slug, title: product.title, price: product.price });
    console.log('📦 [API] Customer:', { email: shippingData.email });
    
    assignedCheckoutLink = await resolveAssignedCheckoutLink(product);

    const orderResult = await saveOrder({
      productSlug: product.slug,
      productTitle: product.title,
      productPrice: product.price,
      customerName: shippingData.fullName || shippingData.email,
      customerEmail: shippingData.email,
      customerPhone: undefined, // Phone number was removed from form
      shippingAddress: shippingData.streetAddress,
      shippingAddressLine2: shippingData.addressLine2,
      shippingCity: shippingData.city,
      shippingState: shippingData.state,
      shippingZip: shippingData.zipCode,
      shippingCountry: shippingData.country,
      shippingCountryCode: shippingData.countryCode,
      checkoutFlow,
      status: checkoutFlow === 'stripe' || checkoutFlow === 'paypal-direct' || checkoutFlow === 'paypal-api'
        ? 'pending_payment'
        : 'completed',
      paymentProvider: checkoutFlow,
      fullOrderData: {
        shippingData,
        product,
        siteUrl,
        checkoutLink: assignedCheckoutLink,
      },
    });

    console.log('📦 [API] Order save result:', { success: orderResult.success, orderId: orderResult.id, error: orderResult.error });

    if (!orderResult.success) {
      console.error('❌ [API] Failed to save order to database:', orderResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save order', 
          details: orderResult.error,
          note: 'Check server logs for detailed error information'
        },
        { status: 500 }
      );
    }

    if (!orderResult.id) {
      console.error('❌ [API] Order save returned success but no ID');
      return NextResponse.json(
        { 
          success: false,
          error: 'Order save returned no ID',
          details: 'Database insert succeeded but no ID was returned'
        },
        { status: 500 }
      );
    }

    orderId = orderResult.id;
    console.log('✅ [API] Order saved to database with ID:', orderId);

    // STEP 2: Try to send email with timeout (5 seconds max)
    // This ensures most emails are sent immediately without blocking checkout too long
    console.log('📧 [API] Attempting to send email (5 second timeout)...');
    
    try {
      // Race between email send and timeout
      const emailResult = await Promise.race([
        (async () => {
          const order = await getOrderById(orderId);
          if (!order) {
            console.error('❌ [API] Order not found for email sending');
            return { success: false, error: 'Order not found' };
          }
          
          const { sendOrderEmail } = await import('@/lib/email/sender');
          return await sendOrderEmail(order);
        })(),
        new Promise<{ success: boolean; error?: string }>((resolve) => 
          setTimeout(() => {
            console.log('⏱️ [API] Email send timed out after 5 seconds');
            resolve({ success: false, error: 'Timeout' });
          }, 5000)
        )
      ]);

      const duration = Date.now() - startTime;

      if (emailResult.success) {
        console.log('✅ [API] Email sent successfully');
        return NextResponse.json({ 
          success: true,
          orderId: orderId,
          checkoutLink: assignedCheckoutLink,
          emailSent: true,
          duration: `${duration}ms`,
          note: 'Order saved and email sent successfully.'
        });
      } else {
        console.log('⚠️ [API] Email failed, but order is saved. Will retry automatically.');
        return NextResponse.json({ 
          success: true,
          orderId: orderId,
          checkoutLink: assignedCheckoutLink,
          emailSent: false,
          duration: `${duration}ms`,
          note: 'Order saved. Email will be retried automatically.',
          emailError: emailResult.error
        });
      }
    } catch (emailError) {
      const duration = Date.now() - startTime;
      console.error('❌ [API] Error sending email:', emailError);
      
      // Order is saved, just email failed
      return NextResponse.json({ 
        success: true,
        orderId: orderId,
        checkoutLink: assignedCheckoutLink,
        emailSent: false,
        duration: `${duration}ms`,
        note: 'Order saved. Email will be retried automatically.'
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error as Error;
    const errorMessage = err.message || 'Unknown error';
    
    console.error(`❌ Error in checkout API after ${duration}ms:`, errorMessage);
    
    // If order was saved, still return success (email will retry later)
    if (orderId) {
      console.log(`Order ${orderId} saved. Email will be retried automatically.`);
      return NextResponse.json(
        { 
          success: true,
          orderId: orderId,
          checkoutLink: assignedCheckoutLink || undefined,
          duration: `${duration}ms`,
          note: 'Order saved. Email will be retried automatically.'
        },
        { status: 200 }
      );
    }
    
    // Order save failed - return error
    return NextResponse.json(
      { 
        error: 'Failed to process order',
        details: errorMessage,
        duration: `${duration}ms`
      },
      { status: 500 }
    );
  }
} 
