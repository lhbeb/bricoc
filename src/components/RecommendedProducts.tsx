"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types/product';

interface RecommendedProductsProps {
  currentProductSlug: string;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({ currentProductSlug }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecommendedProducts = async () => {
      try {
        const response = await fetch(
          `/api/products/recommended?slug=${encodeURIComponent(currentProductSlug)}`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch recommended products');
        }

        const recommendedProducts = await response.json();
        if (!Array.isArray(recommendedProducts)) {
          throw new Error('Invalid recommended products response');
        }

        setProducts(recommendedProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommended products');
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure the main product page loads first
    const timer = setTimeout(loadRecommendedProducts, 500);
    return () => clearTimeout(timer);
  }, [currentProductSlug]);

  if (loading) {
    return (
      <section className="mt-16 border-t pt-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 animate-pulse rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-full max-w-md"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 animate-pulse rounded w-1/3"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-16"></div>
                    <div className="h-8 w-8 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || products.length === 0) {
    return null; // Don't show anything if there's an error or no products
  }

  return (
    <section className="mt-8 border-t pt-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#262626] mb-4">Recommended Products</h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            Discover more amazing products you might love
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                />
              </div>

              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-[#233F31] group-hover:text-[#789676] transition-colors line-clamp-2 sm:line-clamp-1">
                  {product.title}
                </h3>

                <p className="text-sm text-gray-500 overflow-hidden">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                    {product.condition}
                  </span>
                </p>

                <div className="text-xl font-bold text-[#233F31]">${new Intl.NumberFormat('en-US').format(product.price)}</div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                  <div className="flex items-center text-sm font-medium text-[#789676]">
                    <Eye className="h-4 w-4 mr-1" />
                    <span>View Details</span>
                  </div>
                  <div className="h-8 w-8 bg-[#233F31] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ShoppingCart className="h-4 w-4 text-[#FAF6EB]" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendedProducts; 
