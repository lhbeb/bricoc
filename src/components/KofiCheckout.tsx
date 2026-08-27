"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, MapPin, ChevronDown, Pencil } from 'lucide-react';
import { formatShippingAddressLines } from '@/lib/shipping';
import type { ShippingData } from '@/lib/shipping';

const KOFI_IFRAME_HEIGHT = 1700;
const KOFI_TOP_CROP = KOFI_IFRAME_HEIGHT * 0.2;
const KOFI_VISIBLE_HEIGHT = KOFI_IFRAME_HEIGHT - KOFI_TOP_CROP;

// Matches CSS ease-in-out so counter-scroll stays in sync with the grid animation
function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

interface KofiCheckoutProps {
    checkoutLink: string;
    shippingData: ShippingData;
    sellerName?: string | null;
    product?: {
        title: string;
        price: number;
        imageUrl?: string | null;
    };
    onClose?: () => void;
}

export default function KofiCheckout({ checkoutLink, shippingData, sellerName, product, onClose }: KofiCheckoutProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [badgeAnimated, setBadgeAnimated] = useState(false);
    const addressLines = formatShippingAddressLines(shippingData);

    const addressContentRef = useRef<HTMLDivElement>(null);
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

    /**
     * Collapses the address section AND counter-scrolls in sync so the iframe
     * stays at the same visual position — zero perceived scroll jump.
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
        setBadgeAnimated(true);

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeInOut(progress);

            // Scroll up by the same amount the card is shrinking so the iframe
            // stays at the same visual Y position throughout the animation.
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

    // Auto-collapse: wait for iframe to load OR 2.2 s, whichever comes first
    useEffect(() => {
        const timer = setTimeout(() => doCollapse(), 2200);
        return () => clearTimeout(timer);
    }, [doCollapse]);

    // If iframe loads before the 2.2 s timer, collapse immediately
    useEffect(() => {
        if (iframeLoaded) doCollapse();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iframeLoaded]);

    // Manual toggle — user-initiated so just use CSS transition, no counter-scroll
    const handleToggle = () => {
        document.documentElement.style.overflowAnchor = 'none';
        document.body.style.overflowAnchor = 'none';
        setIsCollapsed(prev => !prev);
        setTimeout(() => {
            document.documentElement.style.overflowAnchor = '';
            document.body.style.overflowAnchor = '';
        }, 550);
    };

    return (
        <div
            className="flex flex-col items-center justify-center bg-gradient-to-br from-[#e0e7ff] via-[#f8fafc] to-[#f0fdfa] px-0 sm:px-2 pt-0 sm:pt-8 sm:pb-8 min-h-screen"
            style={{ overflowAnchor: 'none' }}
        >
            <div className="bg-white/95 backdrop-blur-lg rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl border-0 sm:border border-gray-100 w-full max-w-5xl mx-auto">

                {/* ── ORDER CARD (always visible, matches Phase 1 order tab) ── */}
                <div className="mx-4 mt-4 sm:mx-6 bg-white rounded-2xl shadow-sm border border-gray-100">

                    {/* Card header — always visible, tappable */}
                    <button
                        type="button"
                        onClick={handleToggle}
                        className="w-full p-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-2xl"
                        aria-expanded={!isCollapsed}
                    >
                        <div className="flex items-center space-x-4">
                            {/* Thumbnail only */}
                            <div className="relative w-16 h-16 flex-shrink-0">
                                <div className="w-full h-full bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                                    {product?.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={product.imageUrl}
                                            alt={product?.title ?? 'Product'}
                                            className="w-14 h-14 object-cover rounded-lg"
                                        />
                                    ) : product ? (
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                                            <span className="text-[#0B50C7] text-xl font-bold">{product.title.charAt(0)}</span>
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 bg-gray-100 rounded-lg" />
                                    )}
                                </div>
                                {/* Checkmark badge */}

                            </div>

                            {/* Confirmation message */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-[#090A28] text-base mb-0.5">Address Confirmed</p>
                                <p className="text-gray-400 text-xs leading-tight">Tap To View/Hide Summary</p>
                            </div>
                        </div>

                        {/* Chevron — rotates like Phase 1 */}
                        <ChevronDown
                            className={`h-6 w-6 ml-3 flex-shrink-0 text-gray-600 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
                        />
                    </button>

                    {/* Collapsible address — collapses INSIDE the card, no outer disappear */}
                    <div
                        className="grid overflow-hidden transition-[grid-template-rows] duration-500 ease-in-out"
                        style={{ gridTemplateRows: isCollapsed ? '0fr' : '1fr' }}
                        aria-hidden={isCollapsed}
                    >
                        <div ref={addressContentRef} className="min-h-0 overflow-hidden">
                            <div className="px-4 pb-4 border-t border-gray-100">
                                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                                            <MapPin className="h-4 w-4 shrink-0 text-[#090A28] mt-0.5" />
                                            <div className="flex-grow min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
                                                    Shipping to
                                                </p>
                                                <address className="not-italic text-sm leading-5 text-[#262626] font-medium">
                                                    {addressLines.map((line, index) => <div key={`${index}-${line}`}>{line}</div>)}
                                                </address>
                                            </div>
                                        </div>
                                        {/* Edit address — goes back to Phase 1 form, cart and address preserved */}
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            title="Edit delivery address"
                                            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-[#090A28] hover:bg-blue-100 transition-colors duration-150"
                                            aria-label="Edit delivery address"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── KO-FI IFRAME ── */}
                <div className="p-0 mt-4 sm:p-8 sm:mt-0">
                    <div
                        className="relative w-full overflow-hidden"
                        style={{ height: KOFI_VISIBLE_HEIGHT }}
                    >
                        {isLoading && (
                            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-white rounded-2xl">
                                <div className="w-12 h-12 border-4 border-[#090A28]/30 border-t-[#090A28] rounded-full animate-spin mb-4" />
                                <span className="text-base text-gray-700 font-medium">Loading payment form...</span>
                            </div>
                        )}

                        <iframe
                            src={checkoutLink}
                            className={`w-full rounded-none sm:rounded-2xl border-0 sm:border-2 border-gray-200 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                            style={{
                                height: KOFI_IFRAME_HEIGHT,
                                minHeight: KOFI_IFRAME_HEIGHT,
                                overflow: 'hidden',
                                transform: `translateY(-${KOFI_TOP_CROP}px)`,
                                transformOrigin: 'top',
                            }}
                            title="Ko-fi Payment"
                            allow="payment"
                            referrerPolicy="strict-origin-when-cross-origin"
                            loading="eager"
                            onLoad={() => {
                                setIsLoading(false);
                                setIframeLoaded(true);
                            }}
                            data-kofi-iframe="true"
                            data-payment-frame="kofi"
                            scrolling="no"
                        />
                    </div>

                    {/* Trust badges */}
                    <div className="mt-8 mb-8 sm:mt-10 flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="inline-flex items-center justify-center bg-gray-100 rounded-full p-1">
                                <svg className="h-3 w-3 sm:h-4 sm:w-4 text-[#090A28]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect width="18" height="12" x="3" y="8" rx="2" />
                                    <path d="M7 8V6a5 5 0 0 1 10 0v2" />
                                </svg>
                            </span>
                            <span className="whitespace-nowrap">Secure Payment</span>
                        </div>
                        <div className="text-gray-300">•</div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="inline-flex items-center justify-center bg-gray-100 rounded-full p-1">
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-[#090A28]" />
                            </span>
                            <span className="whitespace-nowrap">SSL Encrypted</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes kofi-pop {
                    0%   { transform: scale(0.5); opacity: 0; }
                    60%  { transform: scale(1.15); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
