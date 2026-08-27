"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import type { PaypalApiInitializationResult } from '@/app/checkout/types';

interface PaypalApiRedirectButtonProps {
  onBeforePayment: () => Promise<PaypalApiInitializationResult>;
  disabled?: boolean;
  className?: string;
}

const PaypalApiRedirectButton: React.FC<PaypalApiRedirectButtonProps> = ({
  onBeforePayment,
  disabled,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      const result = await onBeforePayment();
      if (!result.ok || !result.orderId) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/paypal-api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: result.orderId }),
      });
      const data = await response.json().catch(() => ({})) as { approvalUrl?: string; error?: string };

      if (!response.ok || !data.approvalUrl) {
        throw new Error(data.error || 'PayPal checkout could not be initialized.');
      }

      window.location.assign(data.approvalUrl);
    } catch (error) {
      console.error('[PayPal API Redirect] Error:', error);
      alert(error instanceof Error ? error.message : 'Something went wrong with PayPal. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <button
        type="button"
        onClick={handlePayClick}
        disabled={disabled || isLoading}
        aria-label="Checkout with PayPal"
        className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95 active:scale-[0.98]"
        style={{ backgroundColor: '#EFC154' }}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#003087]" />
        ) : (
          <Image
            src="/PayPal-checkout.png"
            alt="PayPal Checkout"
            width={150}
            height={24}
            className="h-6 w-auto object-contain"
          />
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium tracking-wide">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3 text-gray-400 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Secure &amp; protected — pay instantly with your PayPal account
      </p>
    </div>
  );
};

export default PaypalApiRedirectButton;
