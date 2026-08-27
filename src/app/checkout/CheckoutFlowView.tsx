"use client";

import { Check, Mail, MapPin } from 'lucide-react';
import KofiCheckout from '@/components/KofiCheckout';
import PaypalDirectCheckout from '@/components/PaypalDirectCheckout';
import PaypalInvoiceConfirmation from '@/components/PaypalInvoiceConfirmation';
import StripeEmbeddedCheckout from '@/components/StripeEmbeddedCheckout';
import type { Product } from '@/types/product';
import type { ShippingData } from './types';

interface CheckoutFlowViewProps {
  product: Product;
  shippingData: ShippingData;
  sellerName: string | null;
  stripeClientSecret: string | null;
  showKofiCheckout: boolean;
  assignedCheckoutLink: string | null;
  showPaypalConfirmation: boolean;
  paypalConfirmationVariant: 'invoice' | 'unclaimed';
  paypalConfirmationOrderId: string | null;
  isRedirecting: boolean;
  redirectingProvider: 'paypal' | 'external';
  showPaypalDirect: boolean;
  paypalDirectEmail: string;
  paypalDirectOrderId: string | null;
  onStripeBack: () => void;
  onKofiClose: () => void;
  onPaypalConfirmationClose: () => void;
  onPaypalDirectClose: () => void;
}

interface ExternalCheckoutRedirectProps {
  shippingData: ShippingData;
  provider: 'paypal' | 'external';
}

function ExternalCheckoutRedirect({ shippingData, provider }: ExternalCheckoutRedirectProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#e0e7ff] via-[#f8fafc] to-[#f0fdfa] px-2 pt-4 min-h-0 sm:pt-16 sm:pb-16">
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 border border-gray-100 flex flex-col items-center max-w-md w-full mx-auto transition-all duration-500">
        <div className="flex flex-col items-center mb-4">
          <span className="inline-flex items-center justify-center bg-blue-100 rounded-full p-2 mb-2">
            <Check className="h-7 w-7 text-[#090A28]" />
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#262626] tracking-tight mb-2 text-center">
          Address Confirmed
        </h2>
        <p className="text-lg sm:text-xl text-gray-700 mb-4 text-center">
          Your Order Will Be Shipped To The Address Below:
        </p>
        <div className="w-full max-w-xs bg-blue-50 border border-blue-100 rounded-2xl shadow p-5 mb-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-5 w-5 text-[#090A28]" />
            <span className="font-semibold text-[#090A28] text-base">Confirmed Delivery Address</span>
          </div>
          <div className="text-gray-800 text-base whitespace-pre-line leading-relaxed">
            {shippingData.fullName && <div className="font-semibold text-gray-900 mb-0.5">{shippingData.fullName}</div>}
            {shippingData.streetAddress && <div>{shippingData.streetAddress}</div>}
            {shippingData.addressLine2 && <div>{shippingData.addressLine2}</div>}
            {shippingData.city && <div>{shippingData.city}</div>}
            {shippingData.state || shippingData.zipCode ? (
              <div>
                {shippingData.state}
                {shippingData.state && shippingData.zipCode ? ', ' : ''}
                {shippingData.zipCode}
              </div>
            ) : null}
          </div>
          {shippingData.email && (
            <div className="flex items-center gap-2 mt-2">
              <Mail className="h-5 w-5 text-[#090A28]" />
              <span className="text-[#090A28] text-base">{shippingData.email}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <span className="inline-flex items-center justify-center bg-gray-100 rounded-full p-1">
            <svg className="h-4 w-4 text-[#090A28]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect width="18" height="12" x="3" y="8" rx="2" />
              <path d="M7 8V6a5 5 0 0 1 10 0v2" />
            </svg>
          </span>
          <span>Your information is secured with SSL.</span>
        </div>
        <div className="flex flex-col items-center gap-2 mt-2 mb-6">
          <div className="w-10 h-10 border-4 border-[#090A28]/30 border-t-[#090A28] rounded-full animate-spin mb-2" />
          <span className="text-base text-gray-700 font-medium">
            {provider === 'paypal'
              ? 'Connecting to PayPal…'
              : 'Finalizing Your Checkout. This Won\'t Take Long…'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFlowView({
  product,
  shippingData,
  sellerName,
  stripeClientSecret,
  showKofiCheckout,
  assignedCheckoutLink,
  showPaypalConfirmation,
  paypalConfirmationVariant,
  paypalConfirmationOrderId,
  isRedirecting,
  redirectingProvider,
  showPaypalDirect,
  paypalDirectEmail,
  paypalDirectOrderId,
  onStripeBack,
  onKofiClose,
  onPaypalConfirmationClose,
  onPaypalDirectClose,
}: CheckoutFlowViewProps) {
  if (stripeClientSecret) {
    return (
      <StripeEmbeddedCheckout
        clientSecret={stripeClientSecret}
        shippingData={shippingData}
        product={{
          title: product.title,
          price: product.price,
          currency: product.currency,
          images: product.images,
        }}
        sellerName={sellerName}
        onBack={onStripeBack}
      />
    );
  }

  if (showKofiCheckout) {
    return (
      <KofiCheckout
        checkoutLink={assignedCheckoutLink || product.checkoutLink}
        shippingData={shippingData}
        sellerName={sellerName}
        product={{
          title: product.title,
          price: product.price,
          imageUrl: product.images?.[0] ?? null,
        }}
        onClose={onKofiClose}
      />
    );
  }

  if (showPaypalConfirmation) {
    return (
      <PaypalInvoiceConfirmation
        product={{
          title: product.title,
          price: product.price,
          currency: product.currency,
          images: product.images,
        }}
        shippingData={shippingData}
        sellerName={sellerName}
        orderId={paypalConfirmationOrderId}
        variant={paypalConfirmationVariant}
        onClose={onPaypalConfirmationClose}
      />
    );
  }

  if (isRedirecting) {
    return <ExternalCheckoutRedirect shippingData={shippingData} provider={redirectingProvider} />;
  }

  if (showPaypalDirect) {
    return (
      <PaypalDirectCheckout
        product={{
          title: product.title,
          price: product.price,
          currency: product.currency,
          payeeEmail: product.payeeEmail || '',
        }}
        shippingData={shippingData}
        preloadedEmail={paypalDirectEmail || null}
        orderId={paypalDirectOrderId || undefined}
        onClose={onPaypalDirectClose}
      />
    );
  }

  return null;
}
