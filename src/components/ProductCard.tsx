"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  cardBackground?: string;
  showFullImage?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cardBackground = 'bg-white',
  showFullImage = false,
}) => {
  const { slug, title, price, images, inStock } = product;
  const isSoldOut = inStock === false;
  const [imgLoaded, setImgLoaded] = React.useState(false);

  return (
    <div className={`${cardBackground} rounded-xl border border-[#233F31]/10 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group`}>
      <Link href={`/products/${slug}`} className="block">
        <div className={`relative w-full bg-[#FAF6EB]/40 ${showFullImage ? 'aspect-square' : 'h-48 sm:h-52'}`}>
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse rounded-t-xl z-10">
              <div className="h-12 w-12 bg-gray-200 rounded-full" />
            </div>
          )}
          <Image
            src={images[0]}
            alt={title}
            fill
            className={`${showFullImage ? 'object-contain p-3 sm:p-5' : 'object-cover'} rounded-t-xl transition-all duration-300 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'} ${isSoldOut ? 'opacity-50' : ''}`}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            unoptimized
            onLoad={() => setImgLoaded(true)}
          />
          {isSoldOut && (
            <div className="absolute inset-0 bg-[rgba(35,63,49,0.75)] flex items-center justify-center rounded-t-xl">
              <div className="bg-[#FAF6EB] rounded-lg px-5 py-2 shadow-md">
                <span className="sold-out-badge text-[#233F31] text-sm uppercase tracking-wider whitespace-nowrap font-bold">
                  Sold Out
                </span>
              </div>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 flex-grow flex flex-col bg-white">
        <h3 className="text-base sm:text-lg font-medium text-[#233F31] line-clamp-2 mt-1 group-hover:text-[#789676] transition-colors">
          {title}
        </h3>
        <div className="mt-auto pt-3 flex items-center justify-between gap-2 border-t border-[#233F31]/10">
          <span className="text-lg sm:text-xl font-bold text-[#233F31]">${new Intl.NumberFormat('en-US').format(price)}</span>
          <Link
            href={`/products/${slug}`}
            className="flex items-center text-xs sm:text-sm font-semibold text-[#789676] hover:text-[#233F31] transition-colors"
          >
            <Eye className="h-4 w-4 mr-1" />
            <span>View Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
