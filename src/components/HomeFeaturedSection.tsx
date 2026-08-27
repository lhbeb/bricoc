"use client";

import { useEffect, useState } from 'react';

import FeaturedProduct from './FeaturedProduct';
import type { Product } from '@/types/product';
import { createVisitorRotationSeed, selectRotatedProducts } from '@/utils/visitorProductRotation';

interface HomeFeaturedSectionProps {
  products: Product[];
}

const FEATURED_PRODUCT_COUNT = 6;

const HomeFeaturedSection = ({ products }: HomeFeaturedSectionProps) => {
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(() =>
    products.slice(0, FEATURED_PRODUCT_COUNT),
  );

  useEffect(() => {
    if (!products || products.length === 0) {
      setDisplayedProducts([]);
      return;
    }

    const seed = createVisitorRotationSeed('home-featured');
    setDisplayedProducts(selectRotatedProducts(products, seed, FEATURED_PRODUCT_COUNT));
  }, [products]);

  if (displayedProducts.length === 0) {
    return null;
  }

  return (
    <section id="featured" className="py-16 bg-gray-100 overflow-visible">
      <div className="container mx-auto px-4 overflow-visible">
        <div className="w-full max-w-7xl mx-auto overflow-visible">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:gap-10 overflow-visible">
            {displayedProducts.map((product) => (
              <FeaturedProduct key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeFeaturedSection;
