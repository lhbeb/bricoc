'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Mail, Clock, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { trackPixelEvent } from '@/lib/pixel';
import { clearPendingOrder, getPendingOrder } from '@/lib/pendingOrder';
import { CART_STORAGE_KEY, clearCart } from '@/utils/cart';

// Window within which a pending order is treated as a real BMC conversion.
// BMC has no webhook/payment confirmation, so this guards against firing a
// Purchase for a stale/abandoned attempt.
const PENDING_ORDER_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

function ThankYouContent() {
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const sessionId = searchParams.get('session_id');
  const isStaticSuccess = !sessionId;
  const isSuccessful = isStaticSuccess || orderDetails?.status === 'paid';

  useEffect(() => {
    // Stripe flow: fire Purchase only from the server-verified session, using the
    // order id as the Meta eventID for dedup. No cart-based event is fired here,
    // so a Stripe order can never double-fire a Purchase.
    if (sessionId) {
      const verifyInBackground = async () => {
        try {
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });

          if (response.ok) {
            const data = await response.json();
            setOrderDetails(data);

            if (data.status === 'paid') {
              const orderId = data.orderId as string | undefined;
              const guardKey = orderId
                ? `purchase_tracked_${orderId}`
                : 'purchase_tracked_stripe';

              if (!sessionStorage.getItem(guardKey)) {
                trackPixelEvent(
                  'Purchase',
                  {
                    value: data.amount ? data.amount / 100 : 0,
                    currency: data.currency ? data.currency.toUpperCase() : 'USD',
                    content_ids: data.productSlug ? [data.productSlug] : [],
                    content_name: data.productTitle || '',
                    content_type: 'product',
                    num_items: 1,
                  },
                  { eventID: orderId || undefined }
                );
                // Google Ads conversion event
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'conversion', {
                    send_to: 'AW-18441617346/1UFCCJKbtfMcEML_0tlE',
                    value: data.amount ? data.amount / 100 : 0,
                    currency: data.currency ? data.currency.toUpperCase() : 'USD',
                    transaction_id: orderId || '',
                  });
                }
                sessionStorage.setItem(guardKey, '1');
              }
            }
          } else {
            console.warn('⚠️ Payment verification failed, falling back to pending UI');
            setOrderDetails({ status: 'pending' });
          }
        } catch (error) {
          console.error('❌ Background verification error:', error);
          setOrderDetails({ status: 'pending' });
        }
      };

      verifyInBackground();
      return;
    }

    // Non-Stripe flows (Buy Me A Coffee / external): the user only reaches this
    // page after a completed payment. Fire Purchase from the pending order saved
    // at checkout, with eventID = orderId so Meta can dedupe it against a
    // server-side Conversions API event on confirmation.
    //
    // False-positive safeguard: BMC has no webhook, so the pending order is only
    // treated as a real conversion within a short window. A stale pending order
    // (e.g. from an abandoned attempt) is suppressed instead of firing.
    const pending = getPendingOrder();
    const isPendingFresh =
      !!pending && Date.now() - new Date(pending.createdAt).getTime() <= PENDING_ORDER_WINDOW_MS;

    let orderId = isPendingFresh ? pending!.orderId : null;
    let product: any = isPendingFresh ? pending!.product : null;

    // Cart fallback only when there was no pending order at all (legacy path),
    // with validation so invalid/missing data can't produce a Purchase.
    if (!pending) {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const cartProduct = JSON.parse(stored)?.product;
          if (cartProduct && cartProduct.slug && cartProduct.price !== undefined) {
            product = cartProduct;
          }
        }
      } catch (e) {
        console.error('Purchase pixel error:', e);
      }
    }

    if (product) {
      const guardKey = orderId
        ? `purchase_tracked_${orderId}`
        : 'purchase_tracked_cart';

      if (!sessionStorage.getItem(guardKey)) {
        trackPixelEvent(
          'Purchase',
          {
            value: product.price || 0,
            currency: product.currency || 'USD',
            content_ids: [product.slug || product.id || ''],
            content_name: product.title || '',
            content_type: 'product',
            num_items: 1,
          },
          { eventID: orderId || undefined }
        );
        // Google Ads conversion event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            send_to: 'AW-18441617346/1UFCCJKbtfMcEML_0tlE',
            value: product.price || 0,
            currency: product.currency || 'USD',
            transaction_id: orderId || '',
          });
        }
        sessionStorage.setItem(guardKey, '1');
      }
    }

    clearCart();
    clearPendingOrder();
  }, [searchParams, sessionId]);

  // Always show success (Stripe only redirects here if payment succeeded)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Main Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#262626] mb-4">
            {isSuccessful ? 'Thank You for Your Order!' : 'Payment Verification Pending...'}
          </h1>

          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            {isSuccessful
              ? 'Your payment has been successfully recorded and your order is queued for manual processing. We will send you an email confirmation shortly once verified.' 
              : 'Your payment is still processing or awaiting backend verification. We will process your order and send a confirmation email once it is completely confirmed.'}
          </p>

          {/* Order Details */}
          {orderDetails && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-500 mb-2">Order ID</p>
              <p className="text-lg font-mono font-semibold text-[#262626] mb-4">
                {orderDetails.orderId || orderDetails.sessionId}
              </p>
              {orderDetails.amount && (
                <p className="text-2xl font-bold text-green-600">
                  ${(orderDetails.amount / 100).toFixed(2)} {orderDetails.currency?.toUpperCase()}
                </p>
              )}
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-[#262626] mb-4">
              What happens next?
            </h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-[#262626]">Order Processing</h3>
                  <p className="text-sm text-gray-600">We&apos;ll process your order within 24-48 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-[#262626]">Email Confirmation</h3>
                  <p className="text-sm text-gray-600">You&apos;ll receive an email with your order details and tracking number</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Package className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-[#262626]">Shipping</h3>
                  <p className="text-sm text-gray-600">Your order will arrive within 5-9 business days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-[#FAF6EB] border border-[#789676]/30 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-[#233F31] mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              If you have any questions about your golf cart order, don&apos;t hesitate to reach out:
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">
                📧 <a href="mailto:contact@bricoc.com" className="text-[#233F31] hover:text-[#789676] font-medium">
                  contact@bricoc.com
                </a>
              </p>
              <p className="text-gray-700">
                📞 <a href="tel:+19129231747" className="text-[#233F31] hover:text-[#789676] font-medium">
                  +19129231747
                </a>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#233F31] hover:bg-[#1a3025] text-[#FAF6EB] font-bold rounded-full transition-colors duration-200 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            {isSuccessful
              ? 'You will receive a confirmation email once our team reviews your order' 
              : 'We will notify you by email once your payment clears'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#262626] mb-4">
            Loading...
          </h1>
          <p className="text-lg text-gray-600">
            Please wait a moment.
          </p>
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function ThankYouPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ThankYouContent />
    </Suspense>
  );
}
