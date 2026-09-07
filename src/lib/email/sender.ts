import 'server-only';
import nodemailer from 'nodemailer';
import { updateOrderEmailStatus, getOrderById } from '@/lib/supabase/orders';
import { supabaseAdmin } from '@/lib/supabase/server';
import { resolveBaseUrl } from '@/lib/url';

// Create transporter (in serverless, each invocation is isolated)
const createTransporter = (): nodemailer.Transporter => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error(
      'Missing email environment variables. Please set EMAIL_USER and EMAIL_PASS'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    secure: false,
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

const parseFullOrderData = (rawData: unknown): Record<string, any> | undefined => {
  if (!rawData) {
    return undefined;
  }

  if (typeof rawData === 'object') {
    return rawData as Record<string, any>;
  }

  if (typeof rawData === 'string') {
    try {
      return JSON.parse(rawData) as Record<string, any>;
    } catch {
      console.warn('⚠️ Unable to parse full_order_data string');
    }
  }

  return undefined;
};

const getExtendedShippingDetails = (
  order: Record<string, any>,
  parsedFullOrderData = parseFullOrderData(order.full_order_data)
) => {
  const shippingData = parsedFullOrderData?.shippingData || {};
  const country = order.shipping_country || shippingData.country || '';
  const countryCode = order.shipping_country_code || shippingData.countryCode || '';

  return {
    addressLine2: order.shipping_address_line_2 || shippingData.addressLine2 || '',
    country: country && countryCode ? `${country} (${countryCode})` : country || countryCode,
  };
};

/**
 * Send email for an order (used by background retry system)
 */
export async function sendOrderEmail(order: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { product_title, product_price, product_slug, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_state, shipping_zip, full_order_data } = order;
    const parsedFullOrderData = parseFullOrderData(full_order_data);
    const extendedShipping = getExtendedShippingDetails(order, parsedFullOrderData);
    const selectedSize = parsedFullOrderData?.product?.selectedSize || null;
    const baseUrl = resolveBaseUrl([
      parsedFullOrderData?.siteUrl,
      parsedFullOrderData?.siteOrigin,
      order.site_url,
    ]);
    const normalizedSlug = typeof product_slug === 'string' ? product_slug.replace(/^\/+/, '') : '';
    const productPath = normalizedSlug ? `/products/${normalizedSlug}` : '';
    const productUrl = `${baseUrl}${productPath}`;

    // Fetch product details from database to get listed_by and checkout_flow
    let listedBy: string | null = null;
    let checkoutFlow = 'Not specified';

    if (normalizedSlug) {
      try {
        const { data: product, error: productError } = await supabaseAdmin
          .from('products')
          .select('listed_by, checkout_flow')
          .eq('slug', normalizedSlug)
          .single();

        if (productError) {
          console.warn(`⚠️ Could not fetch product details for slug "${normalizedSlug}":`, productError.message);
        } else if (product) {
          listedBy = product.listed_by;
          checkoutFlow = product.checkout_flow || 'Not specified';
        }
      } catch (productFetchError) {
        console.warn('⚠️ Error fetching product details:', productFetchError);
      }
    }

    // Format checkout flow for display
    const formatCheckoutFlow = (flow: string): string => {
      const flowMap: Record<string, string> = {
        'stripe': 'Stripe',
        'kofi': 'Ko-fi',
        'buymeacoffee': 'Buy Me a Coffee',
        'external': 'External',
        'paypal-invoice': 'PayPal Invoice',
        'paypal-unclaimed': 'PayPal Unclaimed',
        'paypal-direct': 'PayPal Checkout Direct',
        'paypal-api': 'PayPal API Checkout',
      };
      return flowMap[flow] || flow;
    };

    const transporter = createTransporter();
    const emailUser = process.env.EMAIL_USER || 'contacthappydeel@gmail.com';

    const emailContent = `
      <h2>New Order Shipping Information</h2>

      <h3>Product Details:</h3>
      <ul>
        <li><strong>Product:</strong> ${product_title}</li>
        ${selectedSize ? `<li><strong>Selected Size:</strong> ${selectedSize}</li>` : ''}
        <li><strong>Price:</strong> $${product_price}</li>
        <li><strong>Listed By:</strong> ${listedBy || 'Not specified'}</li>
        <li><strong>Checkout Flow:</strong> ${formatCheckoutFlow(checkoutFlow)}</li>
        <li><strong>Product URL:</strong> ${productUrl}</li>
      </ul>

      <h3>Shipping Address:</h3>
      <ul>
        <li><strong>Street Address:</strong> ${shipping_address}</li>
        ${extendedShipping.addressLine2 ? `<li><strong>Apartment / Unit:</strong> ${extendedShipping.addressLine2}</li>` : ''}
        <li><strong>City:</strong> ${shipping_city}</li>
        <li><strong>State/Province:</strong> ${shipping_state}</li>
        <li><strong>Zip Code:</strong> ${shipping_zip}</li>
        ${extendedShipping.country ? `<li><strong>Country:</strong> ${extendedShipping.country}</li>` : ''}
        <li><strong>Email:</strong> ${customer_email}</li>
        <li><strong>Phone Number:</strong> ${customer_phone || 'Not provided'}</li>
      </ul>

      <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
    `;

    const mailOptions = {
      from: emailUser,
      to: 'contacthappydeel@gmail.com',
      subject: `New Order - ${product_title}`,
      html: emailContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully for order ${order.id}:`, info.messageId);

    // Update order: email sent successfully
    await updateOrderEmailStatus(order.id, true, undefined, 0, null);

    return { success: true };
  } catch (error) {
    const err = error as Error;
    const errorMessage = err.message || 'Unknown error';
    console.error(`❌ Failed to send email for order ${order.id}:`, errorMessage);

    // Calculate next retry time (exponential backoff: 5min, 15min, 30min, 1hr, 2hr)
    const retryCount = (order.email_retry_count || 0) + 1;
    const retryDelays = [5, 15, 30, 60, 120]; // minutes
    const delayMinutes = retryDelays[Math.min(retryCount - 1, retryDelays.length - 1)];
    const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();

    // Update order: email failed, schedule retry
    await updateOrderEmailStatus(order.id, false, errorMessage, retryCount, nextRetryAt);

    return { success: false, error: errorMessage };
  }
}

/**
 * Background email sender - doesn't block, runs async
 */
export async function sendOrderEmailAsync(orderId: string): Promise<void> {
  // Don't await - fire and forget
  // Use setImmediate or Promise.resolve().then() to ensure it runs after current execution
  Promise.resolve().then(async () => {
    try {
      console.log(`📧 [Async] Starting email send for order ${orderId}...`);
      const order = await getOrderById(orderId);

      if (!order) {
        console.error(`❌ [Async] Order ${orderId} not found in database`);
        return;
      }

      console.log(`📧 [Async] Order found, sending email...`);
      const result = await sendOrderEmail(order);

      if (result.success) {
        console.log(`✅ [Async] Email sent successfully for order ${orderId}`);
      } else {
        console.error(`❌ [Async] Email failed for order ${orderId}:`, result.error);
      }
    } catch (error) {
      console.error(`❌ [Async] Error in async email send for order ${orderId}:`, error);
      if (error instanceof Error) {
        console.error(`Error stack:`, error.stack);
      }
    }
  }).catch((error) => {
    console.error(`❌ [Async] Unhandled error in email async handler for order ${orderId}:`, error);
  });
}

/**
 * Send a dedicated PayPal payment success notification after IPN confirmation.
 * This is separate from the checkout-intent email and should only fire after PayPal confirms payment.
 */
export async function sendPaypalPaymentSuccessEmail(
  order: any,
  payment: {
    txnId?: string;
    paymentStatus?: string;
    mcGross?: string;
    mcCurrency?: string;
    payerEmail?: string;
    receiverEmail?: string;
    raw?: Record<string, string>;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    const emailUser = process.env.EMAIL_USER || 'contacthappydeel@gmail.com';
    const extendedShipping = getExtendedShippingDetails(order);

    const productUrl = order?.product_slug
      ? `${resolveBaseUrl([order?.site_url])}/products/${String(order.product_slug).replace(/^\/+/, '')}`
      : 'Not available';

    const mailOptions = {
      from: emailUser,
      to: 'contacthappydeel@gmail.com',
      subject: `PayPal Payment Confirmed - ${order.product_title}`,
      html: `
        <h2>PayPal Payment Confirmed</h2>

        <h3>Order Details</h3>
        <ul>
          <li><strong>Order ID:</strong> ${order.id}</li>
          <li><strong>Product:</strong> ${order.product_title}</li>
          <li><strong>Product URL:</strong> ${productUrl}</li>
          <li><strong>Order Amount:</strong> ${order.product_price}</li>
          <li><strong>Order Flow:</strong> ${order.checkout_flow || 'Not specified'}</li>
        </ul>

        <h3>PayPal Details</h3>
        <ul>
          <li><strong>Transaction ID:</strong> ${payment.txnId || 'Not provided'}</li>
          <li><strong>Payment Status:</strong> ${payment.paymentStatus || 'Not provided'}</li>
          <li><strong>Gross Amount:</strong> ${payment.mcGross || 'Not provided'}</li>
          <li><strong>Currency:</strong> ${payment.mcCurrency || 'Not provided'}</li>
          <li><strong>Payer Email:</strong> ${payment.payerEmail || order.customer_email || 'Not provided'}</li>
          <li><strong>Receiver Email:</strong> ${payment.receiverEmail || 'Not provided'}</li>
        </ul>

        <h3>Shipping Address</h3>
        <ul>
          <li><strong>Email:</strong> ${order.customer_email}</li>
          <li><strong>Street Address:</strong> ${order.shipping_address}</li>
          ${extendedShipping.addressLine2 ? `<li><strong>Apartment / Unit:</strong> ${extendedShipping.addressLine2}</li>` : ''}
          <li><strong>City:</strong> ${order.shipping_city}</li>
          <li><strong>State/Province:</strong> ${order.shipping_state}</li>
          <li><strong>Zip Code:</strong> ${order.shipping_zip}</li>
          ${extendedShipping.country ? `<li><strong>Country:</strong> ${extendedShipping.country}</li>` : ''}
        </ul>

        <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        <p><strong>IPN Received:</strong> ${new Date().toLocaleString()}</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ PayPal payment notification sent successfully for order ${order.id}:`, info.messageId);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    const errorMessage = err.message || 'Unknown error';
    console.error(`❌ Failed to send PayPal payment notification for order ${order.id}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendPaypalUnclaimedProofEmail(
  order: any,
  proof: {
    proofUrl: string;
    payeeEmail: string;
    payerEmail?: string;
    amount?: string;
    currency?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    const emailUser = process.env.EMAIL_USER || 'contacthappydeel@gmail.com';
    const extendedShipping = getExtendedShippingDetails(order);

    const productUrl = order?.product_slug
      ? `${resolveBaseUrl([order?.site_url])}/products/${String(order.product_slug).replace(/^\/+/, '')}`
      : 'Not available';

    const mailOptions = {
      from: emailUser,
      to: 'contacthappydeel@gmail.com',
      subject: `PayPal Proof Uploaded - ${order.product_title}`,
      html: `
        <h2>PayPal Unclaimed Proof Uploaded</h2>

        <h3>Order Details</h3>
        <ul>
          <li><strong>Order ID:</strong> ${order.id}</li>
          <li><strong>Product:</strong> ${order.product_title}</li>
          <li><strong>Product URL:</strong> ${productUrl}</li>
          <li><strong>Checkout Flow:</strong> ${order.checkout_flow || 'Not specified'}</li>
        </ul>

        <h3>Payment Details</h3>
        <ul>
          <li><strong>Payee Email:</strong> ${proof.payeeEmail}</li>
          <li><strong>Payer Email:</strong> ${proof.payerEmail || order.customer_email || 'Not provided'}</li>
          <li><strong>Amount:</strong> ${proof.amount || order.product_price}</li>
          <li><strong>Currency:</strong> ${proof.currency || 'USD'}</li>
          <li><strong>Proof URL:</strong> <a href="${proof.proofUrl}" target="_blank" rel="noopener noreferrer">${proof.proofUrl}</a></li>
        </ul>

        <h3>Shipping Address</h3>
        <ul>
          <li><strong>Email:</strong> ${order.customer_email}</li>
          <li><strong>Street Address:</strong> ${order.shipping_address}</li>
          ${extendedShipping.addressLine2 ? `<li><strong>Apartment / Unit:</strong> ${extendedShipping.addressLine2}</li>` : ''}
          <li><strong>City:</strong> ${order.shipping_city}</li>
          <li><strong>State/Province:</strong> ${order.shipping_state}</li>
          <li><strong>Zip Code:</strong> ${order.shipping_zip}</li>
          ${extendedShipping.country ? `<li><strong>Country:</strong> ${extendedShipping.country}</li>` : ''}
        </ul>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    const errorMessage = err.message || 'Unknown error';
    console.error('❌ Failed to send PayPal unclaimed proof email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendStripePaymentSuccessEmail(
  order: any,
  payment: {
    paymentIntentId?: string;
    amount?: number; // cents
    currency?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (order.stripe_email_sent || parseFullOrderData(order.full_order_data)?.stripe_email_sent) {
    console.log(`📧 [Stripe] Payment notification already sent for order ${order.id}, skipping`);
    return { success: true };
  }

  const transporter = createTransporter();
  const emailUser = process.env.EMAIL_USER || 'contacthappydeel@gmail.com';
  const adminEmail = process.env.ADMIN_EMAIL || 'contacthappydeel@gmail.com';
  const extendedShipping = getExtendedShippingDetails(order);

  // Dynamic base URL — reads from env/order, never hardcoded
  const baseUrl = resolveBaseUrl([order?.site_url]);
  const productUrl = order?.product_slug
    ? `${baseUrl}/products/${String(order.product_slug).replace(/^\/+/, '')}`
    : null;

  let listedBy: string | null = null;
  if (order?.product_slug) {
    try {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('listed_by')
        .eq('slug', order.product_slug)
        .single();
      listedBy = product?.listed_by || null;
    } catch (productFetchError) {
      console.warn('⚠️ Error fetching listed_by for Stripe notification:', productFetchError);
    }
  }

  const amountDisplay = payment.amount
    ? (payment.amount / 100).toFixed(2)
    : Number(order.product_price || 0).toFixed(2);
  const currencyUpper = (payment.currency || 'USD').toUpperCase();
  const paymentIntentId = payment.paymentIntentId || order.stripe_payment_intent_id || 'N/A';
  const processedAt = new Date().toLocaleString('en-US', {
    timeZone: 'Europe/London',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const shippingBlock = [
    order.customer_name,
    order.shipping_address,
    extendedShipping.addressLine2,
    `${order.shipping_city}${order.shipping_state ? `, ${order.shipping_state}` : ''} ${order.shipping_zip || ''}`.trim(),
    extendedShipping.country,
  ].filter(Boolean).join('<br>');

  // ── Admin notification email ──────────────────────────────────────────────
  await transporter.sendMail({
    from: `"Bricoc Payments" <${emailUser}>`,
    to: adminEmail,
    subject: `💳 Stripe Payment Confirmed — ${order.product_title} — ${currencyUpper} ${amountDisplay}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stripe Payment Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#059669 0%,#065f46 100%);padding:36px 32px;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;padding:14px;margin-bottom:16px;">
            <span style="font-size:32px;">✅</span>
          </div>
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Payment Confirmed</h1>
          <p style="margin:8px 0 0;color:#a7f3d0;font-size:15px;">A new Stripe payment has been successfully processed</p>
        </td></tr>

        <!-- Amount Badge -->
        <tr><td style="background:#f0fdf4;padding:20px 32px;text-align:center;border-bottom:1px solid #d1fae5;">
          <span style="font-size:36px;font-weight:800;color:#059669;">${currencyUpper} ${amountDisplay}</span>
          <span style="display:block;color:#6b7280;font-size:13px;margin-top:4px;">Payment ID: ${paymentIntentId}</span>
        </td></tr>

        <tr><td style="padding:28px 32px;">

          <!-- Order Info -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td colspan="2" style="padding-bottom:10px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;">Order Details</td></tr>
            <tr>
              <td style="padding:10px 14px;background:#f9fafb;border-radius:8px 0 0 0;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;width:38%;">Order ID</td>
              <td style="padding:10px 14px;background:#f9fafb;border-radius:0 8px 0 0;border:1px solid #e5e7eb;border-left:0;font-size:13px;font-weight:600;color:#111827;font-family:monospace;">${order.id}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border:1px solid #e5e7eb;border-top:0;font-size:13px;color:#6b7280;">Product</td>
              <td style="padding:10px 14px;border:1px solid #e5e7eb;border-top:0;border-left:0;font-size:13px;font-weight:600;color:#111827;">${order.product_title}</td>
            </tr>
            ${listedBy ? `<tr>
              <td style="padding:10px 14px;border:1px solid #e5e7eb;border-top:0;font-size:13px;color:#6b7280;">Listed By</td>
              <td style="padding:10px 14px;border:1px solid #e5e7eb;border-top:0;border-left:0;font-size:13px;font-weight:600;color:#111827;">${listedBy}</td>
            </tr>` : ''}
            ${productUrl ? `<tr>
              <td style="padding:10px 14px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 0 8px;font-size:13px;color:#6b7280;">Product URL</td>
              <td style="padding:10px 14px;border:1px solid #e5e7eb;border-top:0;border-left:0;border-radius:0 0 8px 0;font-size:13px;"><a href="${productUrl}" style="color:#059669;text-decoration:none;font-weight:500;">${productUrl}</a></td>
            </tr>` : ''}
          </table>

          <!-- Shipping Info -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td colspan="2" style="padding-bottom:10px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;">Ship To</td></tr>
            <tr>
              <td style="padding:10px 14px;background:#f9fafb;border-radius:8px 0 0 0;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;width:38%;">Customer</td>
              <td style="padding:10px 14px;background:#f9fafb;border-radius:0 8px 0 0;border:1px solid #e5e7eb;border-left:0;font-size:13px;font-weight:600;color:#111827;">${order.customer_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border:1px solid #e5e7eb;border-top:0;font-size:13px;color:#6b7280;">Email</td>
              <td style="padding:10px 14px;border:1px solid #e5e7eb;border-top:0;border-left:0;font-size:13px;"><a href="mailto:${order.customer_email}" style="color:#059669;text-decoration:none;font-weight:500;">${order.customer_email}</a></td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 0 8px;font-size:13px;color:#6b7280;vertical-align:top;">Address</td>
              <td style="padding:10px 14px;border:1px solid #e5e7eb;border-top:0;border-left:0;border-radius:0 0 8px 0;font-size:13px;color:#111827;line-height:1.7;">${shippingBlock}</td>
            </tr>
          </table>

          <!-- Action Required Banner -->
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#c2410c;">⚡ Action Required</p>
            <p style="margin:6px 0 0;font-size:13px;color:#9a3412;line-height:1.6;">Please process and dispatch this order. The customer expects delivery within 5–8 business days.</p>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Automated notification from <a href="${baseUrl}" style="color:#059669;text-decoration:none;font-weight:600;">${baseUrl.replace('https://', '')}</a> · Processed ${processedAt}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  // ── Customer confirmation email ────────────────────────────────────────────
  await transporter.sendMail({
    from: `"Bricoc" <${emailUser}>`,
    to: order.customer_email,
    subject: `✅ Order Confirmed — ${order.product_title}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#233F31 0%,#789676 100%);padding:36px 32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Thank You for Your Order!</h1>
          <p style="margin:8px 0 0;color:#c7d2fe;font-size:15px;">Your payment was successful. Here's your confirmation.</p>
        </td></tr>

        <!-- Amount Badge -->
        <tr><td style="background:#eef2ff;padding:20px 32px;text-align:center;border-bottom:1px solid #c7d2fe;">
          <span style="font-size:32px;font-weight:800;color:#233F31;">${currencyUpper} ${amountDisplay}</span>
          <span style="display:block;color:#6b7280;font-size:13px;margin-top:4px;">Order #${order.id.slice(0, 8).toUpperCase()}</span>
        </td></tr>

        <tr><td style="padding:28px 32px;">

          <!-- Order Summary -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr><td colspan="2" style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">Order Summary</td></tr>
            <tr>
              <td style="padding:12px 16px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Product</td>
              <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${order.product_title}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:14px;color:#6b7280;">Amount Paid</td>
              <td style="padding:12px 16px;font-size:15px;font-weight:700;color:#059669;">${currencyUpper} ${amountDisplay}</td>
            </tr>
          </table>

          <!-- Shipping Address -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr><td colspan="2" style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">Shipping To</td></tr>
            <tr>
              <td style="padding:14px 16px;font-size:14px;color:#374151;line-height:1.7;">${shippingBlock}</td>
            </tr>
          </table>

          <!-- Timeline -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr><td colspan="2" style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">What Happens Next</td></tr>
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;width:36px;vertical-align:top;font-size:18px;">🔄</td>
              <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
                <strong style="font-size:14px;color:#111827;">Order Processing</strong>
                <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">We'll prepare your order within 24–48 hours.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:18px;">📦</td>
              <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
                <strong style="font-size:14px;color:#111827;">Dispatched</strong>
                <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">You'll receive a shipping confirmation once it's on its way.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 16px;vertical-align:top;font-size:18px;">🚚</td>
              <td style="padding:12px 16px;">
                <strong style="font-size:14px;color:#111827;">Delivery</strong>
                <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Expected within 5–8 business days from dispatch.</p>
              </td>
            </tr>
          </table>

          <!-- Help -->
          <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Questions about your order?</p>
            <a href="mailto:contact@bricoc.com" style="color:#233F31;font-weight:700;font-size:14px;text-decoration:none;">contact@bricoc.com</a>

          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">This is an automated confirmation from <a href="${baseUrl}" style="color:#233F31;text-decoration:none;font-weight:600;">${baseUrl.replace('https://', '')}</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  console.log(`✅ Stripe payment emails sent for order ${order.id} (admin + customer)`);

  // Idempotency flag — only set after BOTH emails succeed so failed sends retry
  // Bricoc stores notification state in its existing order JSON column.
  const { data: latestOrder, error: readError } = await supabaseAdmin
    .from('orders').select('full_order_data').eq('id', order.id).single();
  if (readError) return { success: false, error: 'Unable to read payment notification state' };
  const { error: saveError } = await supabaseAdmin.from('orders').update({
    full_order_data: {
      ...parseFullOrderData(latestOrder.full_order_data),
      stripe_email_sent: true,
    },
  }).eq('id', order.id);
  if (saveError) return { success: false, error: 'Unable to save payment notification state' };

  return { success: true };
}
