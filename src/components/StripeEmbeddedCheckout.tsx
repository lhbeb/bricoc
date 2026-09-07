"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Check, MapPin, ChevronDown, Pencil } from 'lucide-react';
import { formatShippingAddressLines, type ShippingData } from '@/lib/shipping';

interface StripeEmbeddedCheckoutProps {
  clientSecret: string;
  shippingData: ShippingData;
  product: {
    title: string;
    images?: string[];
    price?: number;
    currency?: string;
  };
  onBack?: () => void;
}

// Matches CSS ease-in-out so counter-scroll stays in sync with the grid animation
function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export default function StripeEmbeddedCheckout({
  clientSecret,
  shippingData,
  product,
  onBack,
}: StripeEmbeddedCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [configError, setConfigError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const addressLines = formatShippingAddressLines(shippingData);

  const addressContentRef = useRef<HTMLDivElement>(null);
  const frameContainerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prev;
  }, []);

  // Cancel any running rAF on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Load Stripe config + publishable key
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
        setIsLoading(false);
      }
    };

    loadStripeConfig();
  }, []);

  // Hide loading overlay once the Stripe embedded form's iframe is in the DOM
  useEffect(() => {
    if (!stripePromise) return;

    const container = frameContainerRef.current;
    if (!container) return;
    if (container.querySelector('iframe')) {
      setIsLoading(false);
      return;
    }

    const observer = new MutationObserver(() => {
      if (container.querySelector('iframe')) {
        setIsLoading(false);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [stripePromise]);

  /**
   * Collapses the address section AND counter-scrolls in sync so the payment
   * form stays at the same visual position on mobile — zero perceived scroll jump.
   */
  const doCollapse = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const contentHeight = addressContentRef.current?.scrollHeight ?? 0;
    const startScrollY = window.scrollY;
    const duration = 500;
    const startTime = performance.now();

    document.documentElement.style.overflowAnchor = 'none';
    document.body.style.overflowAnchor = 'none';

    setIsCollapsed(true);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOut(progress);

      window.scrollTo(0, Math.max(0, startScrollY - contentHeight * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        document.documentElement.style.overflowAnchor = '';
        document.body.style.overflowAnchor = '';
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Auto-collapse on mobile after 2.2s
  useEffect(() => {
    const timer = setTimeout(() => doCollapse(), 2200);
    return () => clearTimeout(timer);
  }, [doCollapse]);

  // Manual toggle for mobile card
  const handleToggle = () => {
    document.documentElement.style.overflowAnchor = 'none';
    document.body.style.overflowAnchor = 'none';
    setIsCollapsed(prev => !prev);
    setTimeout(() => {
      document.documentElement.style.overflowAnchor = '';
      document.body.style.overflowAnchor = '';
    }, 550);
  };

  const formattedPrice = product.price !== undefined
    ? `$${product.price.toFixed(2)}`
    : null;
  const currencyCode = product.currency || 'USD';

  return (
    <div className="min-h-screen bg-gray-50/50 py-6 sm:py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        {/* ── MOBILE COLLAPSIBLE ORDER CARD (Mobile only) ── */}
        <div className="md:hidden mb-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={handleToggle}
            className="w-full p-4 flex items-center justify-between text-left focus:outline-none rounded-xl"
            aria-expanded={!isCollapsed}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Address Confirmed</p>
                <p className="text-gray-400 text-xs">Tap to view or edit</p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
            />
          </button>

          <div
            className="grid overflow-hidden transition-[grid-template-rows] duration-500 ease-in-out"
            style={{ gridTemplateRows: isCollapsed ? '0fr' : '1fr' }}
            aria-hidden={isCollapsed}
          >
            <div ref={addressContentRef} className="min-h-0 overflow-hidden">
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <MapPin className="h-4 w-4 shrink-0 text-gray-600 mt-0.5" />
                    <div className="min-w-0 text-xs text-gray-700 leading-relaxed font-medium">
                      <span className="font-semibold text-gray-900 block mb-0.5">Shipping to:</span>
                      {addressLines.map((line, index) => <div key={`${index}-${line}`}>{line}</div>)}
                    </div>
                  </div>
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      title="Edit address"
                      className="p-1 rounded text-gray-400 hover:text-gray-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2-COLUMN DESKTOP GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          {/* STRIPE EMBEDDED FORM */}
          {/*
            Mobile: no wrapper card — Stripe renders flush, its own header/product are the UI
            Desktop: white card with subtle "Payment" header above the Stripe iframe
          */}
          <div className="md:col-span-7 md:bg-white md:rounded-2xl md:border md:border-gray-200 md:p-6 md:shadow-sm">

            {/* Desktop-only header — Stripe SDK already shows its own heading on mobile */}
            <div className="hidden md:block mb-4 pb-3 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Payment</h2>
              <p className="text-xs text-gray-500 mt-0.5">Complete your order securely</p>
            </div>

            <div ref={frameContainerRef} className="relative w-full min-h-[420px]">
              {isLoading && (
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-white rounded-xl">
                  <div className="w-10 h-10 border-3 border-gray-200 border-t-[#233F31] rounded-full animate-spin mb-3" />
                  <span className="text-sm text-gray-600 font-medium">Loading payment options...</span>
                </div>
              )}

              {configError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {configError}
                </div>
              ) : stripePromise ? (
                <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              ) : null}
            </div>

            {/* Trust footer — desktop only (Stripe shows its own on mobile) */}
            <div className="hidden md:flex mt-6 pt-4 border-t border-gray-100 items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span>Encrypted &amp; Secure Payment</span>
              </div>
            </div>
          </div>

          {/* DESKTOP SIDEBAR — delivery address only (Stripe SDK shows product + price) */}
          <div className="hidden md:flex md:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-8 flex-col gap-4">
            <h2 className="text-base font-bold text-gray-900">Delivery Details</h2>

            {/* Confirmed Delivery Address */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 font-semibold text-gray-900">
                  <MapPin className="h-3.5 w-3.5 text-gray-600" />
                  <span>Shipping to</span>
                </div>
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-xs font-semibold text-[#233F31] hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              <address className="not-italic leading-relaxed font-medium text-gray-600">
                {addressLines.map((line, index) => <div key={`desktop-${index}-${line}`}>{line}</div>)}
              </address>
            </div>

            {/* Shipping badge */}
            <div className="flex items-center justify-between text-xs text-gray-600 px-1">
              <span>Shipping</span>
              <span className="font-semibold text-[#233F31]">Free</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
