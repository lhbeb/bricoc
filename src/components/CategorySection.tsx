"use client";

import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '@/types/product';
import { createVisitorRotationSeed, selectRotatedProducts } from '@/utils/visitorProductRotation';

interface CategorySectionProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  maxDisplay?: number;
  shuffleForVisitor?: boolean;
  visitorShuffleKey?: string;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  products,
  title = 'Featured Bricoc Golf Carts',
  subtitle = 'Engineered for smooth rides, exceptional battery life, and modern comfort.',
  maxDisplay = 8,
  shuffleForVisitor = false,
  visitorShuffleKey = 'home-featured-carts',
}) => {
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(() =>
    products.slice(0, maxDisplay),
  );

  useEffect(() => {
    if (!products || products.length === 0) {
      setDisplayedProducts([]);
      return;
    }

    if (!shuffleForVisitor) {
      setDisplayedProducts(products.slice(0, maxDisplay));
      return;
    }

    const seed = createVisitorRotationSeed(visitorShuffleKey);
    setDisplayedProducts(selectRotatedProducts(products, seed, maxDisplay));
  }, [products, shuffleForVisitor, visitorShuffleKey, maxDisplay]);

  if (!displayedProducts || displayedProducts.length === 0) {
    return null;
  }

  return (
    <section id="featured-carts" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="mb-10 text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-[#233F31] mb-2 font-heading">
              {title}
            </h2>
            <p className="max-w-2xl text-base sm:text-lg text-gray-600">
              {subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cardBackground="bg-[#FAF6EB]/40"
                showFullImage
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
