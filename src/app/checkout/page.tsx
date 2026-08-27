"use client";

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CheckoutFlowView from './CheckoutFlowView';
import CheckoutShippingStep from './CheckoutShippingStep';
import { useCheckoutForm } from './useCheckoutForm';
import type {
  PaypalApiInitializationResult,
  PaypalPaymentInitializationResult,
  ShippingData,
  ShippingEmailResult,
} from './types';
import type { Product } from '@/types/product';
import { clearCart, getCartItem } from '@/utils/cart';
import type { CartItem } from '@/utils/cart';
import { debugError, debugLog } from '@/utils/debug';
import { preventScrollOnClick } from '@/utils/scrollUtils';
import { trackPixelEvent } from '@/lib/pixel';
import { setPendingOrder } from '@/lib/pendingOrder';
import { usesCountryFirstAddress } from '@/lib/shipping';

const REDIRECT_DELAY_MS = 4000;

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const [cartItem, setCartItem] = useState<CartItem | null>(null);
  const form = useCheckoutForm(cartItem?.product);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showKofiCheckout, setShowKofiCheckout] = useState(false);
  const [showPaypalConfirmation, setShowPaypalConfirmation] = useState(false);
  const [paypalConfirmationVariant, setPaypalConfirmationVariant] = useState<'invoice' | 'unclaimed'>('invoice');
  const [paypalConfirmationOrderId, setPaypalConfirmationOrderId] = useState<string | null>(null);
  const [showPaypalDirect, setShowPaypalDirect] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [assignedCheckoutLink, setAssignedCheckoutLink] = useState<string | null>(null);
  const [paypalDirectOrderId, setPaypalDirectOrderId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sellerName, setSellerName] = useState<string | null>(null);
  const [paypalDirectEmail, setPaypalDirectEmail] = useState('');

  useEffect(() => {
    debugLog('CheckoutPage: useEffect', 'Mounting checkout page', 'log');

    if (typeof window === 'undefined') return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('payment') === 'cancelled') {
        setCheckoutError('Your PayPal payment was not completed. Your item is still here, so you can try again.');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (searchParams.get('payment') === 'failed') {
        setCheckoutError('PayPal could not complete that payment. Please confirm your delivery details and try again.');
        window.history.replaceState({}, '', window.location.pathname);
      }

      debugLog('CheckoutPage: useEffect', 'Getting cart item from localStorage', 'log');
      const item = getCartItem();

      if (!item) {
        debugLog('CheckoutPage: useEffect', 'No cart item found, redirecting to home', 'warn');
        router.push('/');
        return;
      }

      if (item.product && item.product.inStock === false) {
        debugLog('CheckoutPage: useEffect', 'Product is sold out, redirecting to product page', 'warn');
        alert('This product is currently sold out and cannot be purchased.');
        clearCart();
        router.push(`/products/${item.product.slug}`);
        return;
      }

      debugLog(
        'CheckoutPage: useEffect',
        { productId: item.product?.id, productTitle: item.product?.title },
        'log'
      );
      setCartItem(item);

      if (item.product) {
        trackPixelEvent('InitiateCheckout', {
          content_ids: [item.product.slug],
          content_name: item.product.title,
          value: item.product.price,
          currency: item.product.currency || 'USD',
        });
      }

      debugLog('CheckoutPage: useEffect', 'Cart item set successfully', 'log');

      if (item.product?.sellerId) {
        fetch(`/api/sellers/id/${item.product.sellerId}`)
          .then(response => response.ok ? response.json() : null)
          .then(data => {
            if (data) setSellerName(data.name || data.username || null);
          })
          .catch(error => console.error('Error fetching seller name', error));
      }

      if (item.product?.checkoutFlow === 'paypal-direct') {
        fetch(`/api/payment-settings/paypal-direct?t=${Date.now()}`)
          .then(response => response.ok ? response.json() : null)
          .then(data => {
            if (data?.payeeEmail) setPaypalDirectEmail(data.payeeEmail);
          })
          .catch(error => console.error('Error fetching PayPal Direct email', error));
      }
    } catch (error) {
      debugError('CheckoutPage: useEffect - Error loading cart', error);
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (isRedirecting) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [isRedirecting]);

  const sendShippingEmail = async (
    shippingData: ShippingData,
    product: Product,
    retryCount = 0
  ): Promise<ShippingEmailResult | null> => {
    const maxRetries = 1;
    console.log(`📧 [sendShippingEmail] Starting (attempt ${retryCount + 1})`);
    debugLog('sendShippingEmail', `Calling API... (attempt ${retryCount + 1})`, 'log');

    let timeoutId: NodeJS.Timeout | null = null;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000);

      const requestShippingData = usesCountryFirstAddress(product.checkoutFlow)
        ? shippingData
        : {
            streetAddress: shippingData.streetAddress,
            city: shippingData.city,
            zipCode: shippingData.zipCode,
            state: shippingData.state,
            email: shippingData.email,
          };

      const requestBody = {
        shippingData: requestShippingData,
        product: {
          title: product.title,
          price: product.price,
          slug: product.slug,
          images: product.images,
          checkoutLink: product.checkoutLink,
          checkoutFlow: product.checkoutFlow,
          selectedSize: (product as ProductWithSelectedSize).selectedSize || null,
        },
      };

      console.log('📧 [sendShippingEmail] Request body:', JSON.stringify(requestBody, null, 2));
      console.log('📧 [sendShippingEmail] Making POST request to /api/send-shipping-email');

      const response = await fetch('/api/send-shipping-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      console.log('📧 [sendShippingEmail] Response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      if (timeoutId) clearTimeout(timeoutId);
      debugLog('sendShippingEmail', { status: response.status, ok: response.ok }, 'log');

      if (!response.ok) {
        let errorData: { details?: string; error?: string };
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: await response.text() };
        }

        debugError(
          'sendShippingEmail: API error',
          new Error(`Status: ${response.status}, Details: ${errorData.details || errorData.error}`)
        );

        if (retryCount < maxRetries && (response.status >= 500 || response.status === 0)) {
          console.log(`Retrying email send (attempt ${retryCount + 2})...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return sendShippingEmail(shippingData, product, retryCount + 1);
        }

        throw new Error(errorData.details || errorData.error || 'Failed to send email');
      }

      const result = await response.json();

      if (result.success && result.orderId) {
        debugLog(
          'sendShippingEmail',
          `Order saved (ID: ${result.orderId}). Email: ${result.messageId ? 'sent' : 'failed'} (${result.duration})`,
          'log'
        );
        if (result.error) {
          console.warn('Email failed but order saved:', result.note);
        }
        return { orderId: result.orderId, checkoutLink: result.checkoutLink };
      }

      debugLog('sendShippingEmail', `Success: ${result.messageId} (${result.duration})`, 'log');
      return result.orderId
        ? { orderId: result.orderId, checkoutLink: result.checkoutLink }
        : null;
    } catch (error: unknown) {
      if (timeoutId) clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Email send timeout after 30 seconds');
        debugError('sendShippingEmail: Timeout', error);

        if (retryCount < maxRetries) {
          console.log(`Retrying email send after timeout (attempt ${retryCount + 2})...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return sendShippingEmail(shippingData, product, retryCount + 1);
        }
      } else {
        console.error('Error sending email:', error);
        debugError('sendShippingEmail: Error', error);
      }

      return null;
    }
  };

  const handlePaypalBeforePayment = async (): Promise<PaypalPaymentInitializationResult> => {
    const fail: PaypalPaymentInitializationResult = {
      ok: false,
      payeeEmail: '',
      amount: 0,
      currency: 'USD',
      description: '',
      orderId: undefined,
    };

    if (!cartItem?.product) return fail;
    const product = cartItem.product;

    if (product.inStock === false) {
      alert('Sorry, this item is no longer in stock.');
      return fail;
    }

    if (!form.isFormValid) {
      alert('Please complete all required shipping fields before continuing to payment.');
      return fail;
    }

    try {
      const amount = parseFloat(product.price.toFixed(2));
      const platformEmail = paypalDirectEmail || '';
      const sellerEmail = product.payeeEmail || '';

      if (!sellerEmail && !platformEmail) {
        alert('Payment is not configured for this product. Please contact support.');
        return fail;
      }

      const paymentTarget = platformEmail || sellerEmail;
      console.log('🚀 [PayPal] Saving order intent... recipient:', paymentTarget);
      setIsSendingEmail(true);

      const orderResult = await sendShippingEmail({ ...form.shippingData }, product, 0);
      setIsSendingEmail(false);

      if (!orderResult?.orderId) {
        throw new Error('Failed to save order intent');
      }
      setAssignedCheckoutLink(orderResult.checkoutLink || null);

      console.log('💳 [PayPal] Buyer pays:', paymentTarget, '| Amount:', amount, product.currency || 'USD');
      return {
        ok: true,
        payeeEmail: paymentTarget,
        amount,
        currency: product.currency || 'USD',
        description: product.title,
        orderId: orderResult.orderId,
      };
    } catch (error) {
      debugError('CheckoutPage: handlePaypalBeforePayment', error);
      setIsSendingEmail(false);
      alert('Failed to initialize checkout. Please check your connection and try again.');
      return fail;
    }
  };

  const handlePaypalApiBeforePayment = async (): Promise<PaypalApiInitializationResult> => {
    const fail: PaypalApiInitializationResult = { ok: false, orderId: undefined };

    if (!cartItem?.product) return fail;
    const product = cartItem.product;

    if (product.inStock === false) {
      alert('Sorry, this item is no longer in stock.');
      return fail;
    }

    if (!form.isFormValid) {
      alert('Please complete all required shipping fields before continuing to payment.');
      return fail;
    }

    try {
      setIsSendingEmail(true);
      const orderResult = await sendShippingEmail({ ...form.shippingData }, product, 0);
      setIsSendingEmail(false);

      if (!orderResult?.orderId) {
        throw new Error('Failed to save order intent');
      }

      return { ok: true, orderId: orderResult.orderId };
    } catch (error) {
      debugError('CheckoutPage: handlePaypalApiBeforePayment', error);
      setIsSendingEmail(false);
      alert('Failed to initialize checkout. Please check your connection and try again.');
      return fail;
    }
  };

  const handleContinueToCheckout = async (event: FormEvent) => {
    event.preventDefault();
    console.log('🚀 [Checkout] Form submitted');

    if (!cartItem?.product) {
      console.error('❌ [Checkout] No cart item or product found!', { cartItem });
      alert('Product information is missing. Please go back and try again.');
      return;
    }

    const product = cartItem.product;
    console.log('📦 [Checkout] Product from cart:', {
      slug: product.slug,
      title: product.title,
      price: product.price,
    });

    if (product.inStock === false) {
      console.error('❌ [Checkout] Product is sold out');
      alert('This product is currently sold out and cannot be purchased.');
      clearCart();
      router.push(`/products/${product.slug}`);
      return;
    }

    if (!form.shippingData.email) {
      console.error('❌ [Checkout] Email is required');
      form.setEmailError('Email address is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.shippingData.email)) {
      console.error('❌ [Checkout] Invalid email format');
      form.setEmailError('Please enter a valid email address (e.g., example@email.com)');
      return;
    }

    if (form.requiresCountry && (!form.shippingData.countryCode || !form.shippingData.country)) {
      console.error('❌ [Checkout] Delivery country is required');
      alert('Please select a delivery country');
      return;
    }

    if (!form.isPostalCodeValid) {
      console.error('❌ [Checkout] Invalid zip code');
      alert(form.addressConfig.zipTitle);
      return;
    }

    const requiredFields: Array<keyof ShippingData> = ['streetAddress', 'city', 'state', 'zipCode'];
    if (form.requiresFullName) {
      requiredFields.push('fullName');
    }
    const missingFields = requiredFields.filter(field => !form.shippingData[field]);

    if (missingFields.length > 0) {
      console.error('❌ [Checkout] Missing required fields:', missingFields);
      alert('Please fill in all required fields');
      return;
    }

    console.log('✅ [Checkout] Validation passed');
    console.log('📦 [Checkout] Product:', {
      slug: product.slug,
      title: product.title,
      price: product.price,
    });
    console.log('👤 [Checkout] Shipping data:', { email: form.shippingData.email });

    setIsSendingEmail(true);
    setCheckoutError('');
    setAssignedCheckoutLink(null);

    try {
      console.log('📧 [Checkout] Calling sendShippingEmail...');
      const orderResult = await sendShippingEmail({ ...form.shippingData }, product);
      const orderId = orderResult?.orderId || null;
      const checkoutLink = orderResult?.checkoutLink || product.checkoutLink;
      setAssignedCheckoutLink(checkoutLink || null);

      // Remember the saved order so the /thankyou page can fire a Purchase event
      // from the real order data (with eventID = orderId) instead of leftover cart state.
      if (orderId) {
        setPendingOrder(orderId, product);
      }
      console.log('📧 [Checkout] sendShippingEmail returned:', orderResult);

      if (!orderId) {
        console.error('❌ [Checkout] Order save failed');
        alert('Failed to save order information. Please try again.');
        setIsSendingEmail(false);
        return;
      }

      console.log('✅ [Checkout] Order saved successfully');
      setIsSendingEmail(false);
      console.log('🔍 [Checkout] Product data:', {
        slug: product.slug,
        title: product.title,
        checkoutFlow: product.checkoutFlow,
        checkoutLink: product.checkoutLink,
      });

      const checkoutFlow = product.checkoutFlow || 'buymeacoffee';
      console.log('🔍 [Checkout] Detected checkout flow:', checkoutFlow);

      if (checkoutFlow === 'kofi') {
        console.log('🎨 [Checkout] Ko-fi flow: Showing iframe');
        setShowKofiCheckout(true);
      } else if (checkoutFlow === 'stripe') {
        console.log('💳 [Checkout] Stripe flow: Creating Embedded Checkout Session');
        try {
          const response = await fetch('/api/create-stripe-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, product, shippingData: form.shippingData }),
          });
          const data = await response.json();
          if (data.clientSecret) {
            setStripeClientSecret(data.clientSecret);
          } else {
            console.error('❌ [Checkout] Stripe session creation failed:', data);
            setCheckoutError(data.error || 'Failed to initialize payment. Please try again.');
          }
        } catch (error) {
          console.error('❌ [Checkout] Failed connecting to Stripe:', error);
          setCheckoutError('Could not connect to payment provider. Please check your connection and try again.');
        }
      } else if (checkoutFlow === 'paypal-invoice' || checkoutFlow === 'paypal-unclaimed') {
        console.log('📧 [Checkout] PayPal Invoice/Unclaimed flow: Showing confirmation screen');
        setPaypalConfirmationVariant(checkoutFlow === 'paypal-unclaimed' ? 'unclaimed' : 'invoice');
        setPaypalConfirmationOrderId(orderId);
        setShowPaypalConfirmation(true);
      } else if (checkoutFlow === 'paypal-direct') {
        console.log('💳 [Checkout] PayPal Direct flow: Opening PayPal redirect modal');
        setPaypalDirectOrderId(orderId);
        setShowPaypalDirect(true);
      } else if (checkoutFlow === 'paypal-api') {
        // Keep form submission/Enter-key behavior accessible in addition to the
        // dedicated PayPal button's click handler.
        setIsSendingEmail(true);
        const response = await fetch('/api/paypal-api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const data = await response.json().catch(() => ({})) as { approvalUrl?: string; error?: string };

        if (!response.ok || !data.approvalUrl) {
          setCheckoutError(data.error || 'PayPal checkout could not be initialized. Please try again.');
          setIsSendingEmail(false);
          return;
        }

        window.location.assign(data.approvalUrl);
      } else {
        console.log('🔄 [Checkout] External flow: Redirecting to', checkoutLink);
        setIsRedirecting(true);
        window.scrollTo({ top: 0 });
        setTimeout(() => {
          console.log('🔄 [Checkout] Redirecting to checkout link:', checkoutLink);
          window.location.href = checkoutLink;
        }, REDIRECT_DELAY_MS);
      }
    } catch (error) {
      console.error('❌ [Checkout] Error during checkout:', error);
      if (error instanceof Error) {
        console.error('❌ [Checkout] Error message:', error.message);
        console.error('❌ [Checkout] Error stack:', error.stack);
      }
      alert('An error occurred during checkout. Please try again.');
      setIsSendingEmail(false);
    }
  };

  const handleClearCart = () => {
    preventScrollOnClick(() => {
      if (typeof window !== 'undefined') {
        clearCart();
        window.scrollTo({ top: 0 });
      }
      router.push('/');
    }, true);
  };

  if (!cartItem) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#262626] mb-4">Your Cart Is Empty</h1>
            <Link href="/" className="text-[#090A28] hover:text-[#1c2070]">
              Continue Shopping
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const hasActiveCheckoutFlow = Boolean(
    stripeClientSecret ||
    showKofiCheckout ||
    showPaypalConfirmation ||
    isRedirecting ||
    showPaypalDirect
  );

  if (hasActiveCheckoutFlow) {
    return (
      <CheckoutFlowView
        product={cartItem.product}
        shippingData={form.shippingData}
        sellerName={sellerName}
        stripeClientSecret={stripeClientSecret}
        showKofiCheckout={showKofiCheckout}
        assignedCheckoutLink={assignedCheckoutLink}
        showPaypalConfirmation={showPaypalConfirmation}
        paypalConfirmationVariant={paypalConfirmationVariant}
        paypalConfirmationOrderId={paypalConfirmationOrderId}
        isRedirecting={isRedirecting}
        redirectingProvider="external"
        showPaypalDirect={showPaypalDirect}
        paypalDirectEmail={paypalDirectEmail}
        paypalDirectOrderId={paypalDirectOrderId}
        onStripeBack={() => {
          setStripeClientSecret(null);
          setCheckoutError('');
        }}
        onKofiClose={() => {
          setShowKofiCheckout(false);
        }}
        onPaypalConfirmationClose={() => {
          setShowPaypalConfirmation(false);
          setPaypalConfirmationOrderId(null);
          clearCart();
          router.push('/');
        }}
        onPaypalDirectClose={() => {
          setShowPaypalDirect(false);
          setPaypalDirectOrderId(null);
        }}
      />
    );
  }

  return (
    <CheckoutShippingStep
      cartItem={cartItem}
      sellerName={sellerName}
      form={form}
      isSendingEmail={isSendingEmail}
      isRedirecting={isRedirecting}
      checkoutError={checkoutError}
      onSubmit={handleContinueToCheckout}
      onPaypalBeforePayment={handlePaypalBeforePayment}
      onPaypalApiBeforePayment={handlePaypalApiBeforePayment}
      onClearCart={handleClearCart}
      onDismissCheckoutError={() => setCheckoutError('')}
    />
  );
};

interface ProductWithSelectedSize extends Product {
  selectedSize?: string;
}

export default CheckoutPage;
