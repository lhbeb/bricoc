"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Truck, Package } from 'lucide-react';

interface SameDayShippingProps {
  fullWidth?: boolean;
  contained?: boolean;
}

const SameDayShipping: React.FC<SameDayShippingProps> = ({ fullWidth = false, contained = false }) => {
  const content = (
    <div className={`w-full ${fullWidth ? '' : 'max-w-7xl'} mx-auto`}>
      {/* Main Banner */}
      <div className="rounded-2xl overflow-hidden shadow-sm mb-8 border border-[#233F31]/10">
        <div className="flex flex-col md:flex-row">
          {/* Left Section - Image */}
          <div className="relative min-h-[360px] w-full md:min-h-[400px] md:w-[45%]">
            <Image
              src="/delivery-guy.png"
              alt="Bricoc golf cart delivery service"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover object-center"
              priority
            />
          </div>

          {/* Right Section - Content */}
          <div className="md:w-[55%] bg-[#233F31] text-[#FAF6EB] p-8 sm:p-12 flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-white">
              Same-Day Dispatch & Delivery
            </h2>

            <p className="text-base sm:text-lg leading-relaxed font-normal mb-8 text-[#FAF6EB]/90">
              Place your golf cart or accessory order and our dedicated logistics team will inspect, secure, and dispatch your delivery with trusted enclosed freight carriers. At <strong>Bricoc</strong>, dependable fulfillment is guaranteed.
            </p>
            <Link
              href="/shipping-policy"
              className="text-[#FAF6EB] hover:text-white text-base sm:text-lg underline underline-offset-4 transition-colors font-medium"
            >
              See our delivery & shipping policy →
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#233F31]/10">
          <div className="flex items-start gap-4">
            <div className="bg-[#233F31] rounded-full p-3 flex-shrink-0">
              <Clock className="w-6 h-6 text-[#FAF6EB]" />
            </div>
            <div>
              <h3 className="font-bold text-[#233F31] text-lg mb-2">
                Fast Processing
              </h3>
              <p className="text-gray-600 text-sm">
                Orders placed before 2:00 PM EST begin fulfillment and pre-delivery inspection that same day.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#233F31]/10">
          <div className="flex items-start gap-4">
            <div className="bg-[#233F31] rounded-full p-3 flex-shrink-0">
              <Package className="w-6 h-6 text-[#FAF6EB]" />
            </div>
            <div>
              <h3 className="font-bold text-[#233F31] text-lg mb-2">
                30-Day Guarantee
              </h3>
              <p className="text-gray-600 text-sm">
                Enjoy total confidence with our 30-day money-back return policy on all eligible purchases.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#233F31]/10">
          <div className="flex items-start gap-4">
            <div className="bg-[#233F31] rounded-full p-3 flex-shrink-0">
              <Truck className="w-6 h-6 text-[#FAF6EB]" />
            </div>
            <div>
              <h3 className="font-bold text-[#233F31] text-lg mb-2">
                Live Carrier Tracking
              </h3>
              <p className="text-gray-600 text-sm">
                Real-time tracking updates delivered directly to your inbox from dispatch to your driveway.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-[#233F31]/10">
        <div>
          <p className="text-gray-500 text-sm mb-1">
            Ready to experience the Bricoc difference?
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#233F31]">
            Order today for <span className="text-[#789676]">fast nationwide delivery</span>
          </p>
        </div>
        <a
          href="#products"
          className="bg-[#233F31] hover:bg-[#1a3025] text-[#FAF6EB] font-bold py-3.5 px-8 rounded-full text-base sm:text-lg transition-colors whitespace-nowrap shadow-sm"
        >
          Browse Golf Carts
        </a>
      </div>
    </div>
  );

  if (contained) {
    return (
      <div className="py-8 bg-[#FAF6EB] rounded-xl">
        {content}
      </div>
    );
  }

  return (
    <section className="py-16 bg-[#FAF6EB]">
      <div className="container mx-auto px-4">
        {content}
      </div>
    </section>
  );
};

export default SameDayShipping;
