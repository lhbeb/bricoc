"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#233F31] border-t border-[#789676]/30 shadow-2xl">
      <div className="container mx-auto px-4 py-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Text */}
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <Cookie className="h-5 w-5 text-[#789676] flex-shrink-0" />
            <p className="text-[#FAF6EB] text-xs sm:text-sm">
              Bricoc uses essential cookies to ensure seamless shopping and cart functionality.
              <Link href="/cookies" className="underline ml-1.5 hover:text-white font-medium">Learn more</Link>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDecline}
              className="px-4 py-1.5 text-[#FAF6EB] border border-white/20 rounded-full hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-5 py-1.5 bg-[#789676] text-white rounded-full hover:bg-[#688566] transition-colors text-xs sm:text-sm font-bold shadow-sm"
            >
              Accept
            </button>
            <button
              onClick={handleClose}
              className="text-[#FAF6EB]/70 hover:text-white transition-colors p-1"
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
