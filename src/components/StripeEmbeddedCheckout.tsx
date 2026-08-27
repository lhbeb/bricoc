'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { ArrowLeft, Check, MapPin, Mail } from 'lucide-react';
import type { ShippingData } from '@/lib/shipping';

interface StripeEmbeddedCheckoutProps {
  clientSecret: string;
  product: {
    title: string;
    price: number;
    currency?: string;
    images?: string[];
  };
  shippingData: ShippingData;
  sellerName?: string | null;
  onBack?: () => void;
}

export default function StripeEmbeddedCheckout({
  clientSecret,
  product,
  shippingData,
  sellerName,
  onBack,
}: StripeEmbeddedCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const loadStripeConfig = async () => {
      try {
        const response = await fetch(`/api/config/stripe?t=${Date.now()}`);
        const data = await response.json();

        if (!response.ok || !data.publishableKey) {
          throw new Error(data.error || 'Stripe is not configured');
        }

        setStripePromise(loadStripe(data.publishableKey));
      } catch (error) {
        console.error('Failed to load Stripe config:', error);
        setConfigError('Payment is temporarily unavailable. Please email contact@bricoc.com.');
      }
    };

    loadStripeConfig();
  }, []);

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency || 'USD',
  }).format(product.price);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6EB] via-white to-[#FAF6EB] px-0 py-0 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl overflow-hidden bg-white shadow-none sm:rounded-3xl sm:border sm:border-gray-100 sm:shadow-2xl">
        <div className="border-b border-gray-100 p-5 sm:p-8">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#233F31] transition-colors hover:text-[#789676]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to checkout
            </button>
          )}

          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-2 inline-flex items-center justify-center rounded-full bg-[#FAF6EB] p-2 border border-[#789676]/30">
              <Check className="h-7 w-7 text-[#233F31]" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#233F31] sm:text-3xl">
              Secure Bricoc Payment
            </h1>
            <p className="mt-2 text-base text-gray-600">
              Complete your payment below without leaving Bricoc.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#789676]/20 bg-[#FAF6EB]/40 p-5">
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#233F31]" />
                <span className="font-semibold text-[#233F31]">Confirmed Delivery Address</span>
              </div>
              <div className="leading-relaxed text-gray-800">
                {shippingData.streetAddress && <div>{shippingData.streetAddress}</div>}
                {shippingData.city && <div>{shippingData.city}</div>}
                {(shippingData.state || shippingData.zipCode) && (
                  <div>
                    {shippingData.state}
                    {shippingData.state && shippingData.zipCode ? ', ' : ''}
                    {shippingData.zipCode}
                  </div>
                )}
              </div>
              {shippingData.email && (
                <div className="mt-3 flex items-center gap-2 text-[#233F31]">
                  <Mail className="h-5 w-5 text-[#789676]" />
                  <span>{shippingData.email}</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Order Summary
              </h2>
              <div className="text-lg font-bold leading-tight text-[#233F31]">{product.title}</div>
              {sellerName && (
                <div className="mt-1 text-sm text-gray-500">
                  Sold by: <span className="font-medium text-[#233F31]">{sellerName}</span>
                </div>
              )}
              <div className="mt-5 flex items-end justify-between border-t border-gray-100 pt-4">
                <span className="text-sm font-semibold text-gray-500">Total</span>
                <span className="text-2xl font-extrabold text-[#233F31]">{formattedPrice}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-[640px] p-3 sm:p-8">
          {configError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-700">
              {configError}
            </div>
          ) : stripePromise ? (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#233F31]/25 border-t-[#233F31]" />
              <span className="font-medium text-gray-700">Loading secure payment form...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
