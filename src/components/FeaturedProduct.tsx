"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Award } from 'lucide-react';
import type { Product } from '@/types/product';

interface FeaturedProductProps {
  product: Product;
}

const FeaturedProduct: React.FC<FeaturedProductProps> = ({ product }) => {
  if (!product) {
    return null;
  }

  const { slug, title, description, price, images, inStock } = product;
  const primaryImage = images?.[0];
  const isSoldOut = inStock === false;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-[#233F31]/10 shadow-sm transition-all duration-300 hover:shadow-md md:flex-row">
      <div className="relative w-full overflow-hidden md:w-2/5 md:h-full">
        <div className="absolute left-4 top-4 z-10 rounded-full bg-[#233F31] px-3 py-1 text-sm font-medium text-[#FAF6EB] shadow-sm">
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-[#789676]" />
            <span>Featured Cart</span>
          </div>
        </div>
        <div className="relative w-full aspect-square md:h-full md:aspect-auto bg-[#FAF6EB]/40">
          {primaryImage ? (
            <>
              <Image
                src={primaryImage}
                alt={title}
                fill
                className={`object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02] ${isSoldOut ? 'opacity-50' : ''}`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized
              />
              {isSoldOut && (
                <div className="absolute inset-0 bg-[rgba(35,63,49,0.75)] flex items-center justify-center">
                  <div className="bg-[#FAF6EB] rounded-lg px-7 py-2.5 shadow-md">
                    <span className="sold-out-badge text-[#233F31] text-base md:text-lg uppercase tracking-wider whitespace-nowrap font-bold">
                      Sold Out
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
              No image available
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col p-5 sm:p-6 md:w-3/5 md:h-full md:overflow-hidden md:justify-start">
        <div className="space-y-3 md:space-y-2.5">
          <h3 className="line-clamp-2 text-lg font-medium leading-snug text-[#233F31] md:text-xl">
            {title}
          </h3>

          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-semibold text-[#233F31] md:text-2xl">
              ${new Intl.NumberFormat('en-US').format(price)}
            </span>
            <span className="text-sm font-medium text-[#789676]">Free Nationwide Delivery</span>
          </div>

          {description && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mt-1">
              {description}
            </p>
          )}
        </div>

        <div className="mt-4 md:mt-auto pt-3 flex flex-col gap-2 sm:flex-row sm:gap-2">
          <Link
            href={`/products/${slug}`}
            className="flex-1 flex items-center justify-center rounded-full bg-[#233F31] py-2.5 px-4 text-sm font-semibold text-[#FAF6EB] transition-colors duration-300 hover:bg-[#1a3025] whitespace-nowrap shadow-sm"
          >
            Add to Cart
          </Link>
          <Link
            href={`/products/${slug}`}
            className="flex-1 flex items-center justify-center rounded-full border border-[#233F31] py-2.5 px-4 text-sm font-semibold text-[#233F31] transition-colors duration-300 hover:bg-[#FAF6EB] whitespace-nowrap"
          >
            <span>View Details</span>
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 flex-shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProduct;
