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
              alt="Bricoc order delivery"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover object-center"
              priority
            />
          </div>

          {/* Right Section - Content */}
          <div className="md:w-[55%] bg-[#233F31] text-[#FAF6EB] p-8 sm:p-12 flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-white">
              Shipping & Delivery Information
            </h2>

            <p className="text-base sm:text-lg leading-relaxed font-normal mb-8 text-[#FAF6EB]/90">
              Bricoc currently lists golf bags, leather gloves, and golf ball accessories. Review the shipping policy for destinations, processing details, delivery estimates, and tracking information for your order.
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
                Check the shipping policy for the current order processing schedule and cutoff details.
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
                Returns
              </h3>
              <p className="text-gray-600 text-sm">
                Review the return policy for eligibility, timelines, and instructions before starting a return.
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
                Order Tracking
              </h3>
              <p className="text-gray-600 text-sm">
                Use the tracking information from your shipping confirmation or visit the order tracking page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-[#233F31]/10">
        <div>
          <p className="text-gray-500 text-sm mb-1">
            Looking for golf gear for your next round?
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#233F31]">
            Browse golf bags, gloves, and <span className="text-[#789676]">golf ball accessories</span>
          </p>
        </div>
        <a
          href="/search?query=golf"
          className="bg-[#233F31] hover:bg-[#1a3025] text-[#FAF6EB] font-bold py-3.5 px-8 rounded-full text-base sm:text-lg transition-colors whitespace-nowrap shadow-sm"
        >
          Browse Golf Products
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
