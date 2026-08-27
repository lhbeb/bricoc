"use client";

import React, { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setIsSuccess(true);
      setEmail('');

      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[#233F31] py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-[#789676]/30 border border-[#789676]/40 backdrop-blur-sm rounded-full p-3.5">
              <Mail className="h-7 w-7 text-[#FAF6EB]" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join the Bricoc VIP Club
          </h2>

          <p className="text-base md:text-lg text-[#FAF6EB]/85 mb-8 max-w-2xl mx-auto leading-relaxed">
            Get exclusive access to new golf cart releases, custom build options, lithium battery upgrades, and seasonal promotions.
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Your email address"
                  className="w-full px-4 py-3 rounded-full border-0 bg-[#FAF6EB] text-[#233F31] placeholder-[#233F31]/60 focus:outline-none focus:ring-2 focus:ring-[#789676] transition-all duration-200"
                  disabled={isSubmitting || isSuccess}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className="bg-[#789676] hover:bg-[#688566] text-white disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-full font-bold transition-all duration-200 flex items-center justify-center gap-2 min-w-[140px] shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Signing Up...
                  </>
                ) : isSuccess ? (
                  <>
                    <Check className="h-5 w-5" />
                    You&apos;re In!
                  </>
                ) : (
                  <>
                    Get Access
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="flex justify-center mt-3">
                <p className="text-red-200 font-semibold bg-red-900/40 px-4 py-1.5 rounded-full text-sm backdrop-blur-sm border border-red-400/30">
                  {error}
                </p>
              </div>
            )}

            {isSuccess && (
              <div className="flex justify-center mt-3">
                <p className="text-green-200 font-semibold bg-green-900/40 px-4 py-1.5 rounded-full text-sm backdrop-blur-sm border border-green-400/30">
                  Thanks for subscribing to Bricoc! Check your email for confirmation.
                </p>
              </div>
            )}
          </form>

          <p className="text-[#FAF6EB]/60 text-xs sm:text-sm mt-6">
            We value your privacy. Unsubscribe with one click anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
