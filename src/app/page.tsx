import React, { Suspense } from 'react';
import Hero from '@/components/Hero';
import SameDayShipping from '@/components/SameDayShipping';
import ProductGrid from '@/components/ProductGrid';
import HomeReviews from '@/components/HomeReviews';
import CategorySection from '@/components/CategorySection';
import PopularCategories from '@/components/PopularCategories';
import { getFeaturedProducts, getProducts } from '@/lib/data';
import { homeReviews, homeReviewsStats } from '@/lib/homeReviews';
import ScrollToTop from '@/components/ScrollToTop';
import { FEATURED_PRODUCT_LIMIT } from '@/config/products';

export default async function HomePage() {
  try {
    const [featuredProducts, products] = await Promise.all([
      getFeaturedProducts(),
      getProducts(),
    ]);

    const electricGolfCarts = products.filter(p =>
      p.category?.toLowerCase().includes('electric') ||
      p.category?.toLowerCase().includes('cart') ||
      p.title?.toLowerCase().includes('cart') ||
      p.collections?.includes('lawn-garden')
    );

    const accessoriesAndParts = products.filter((product) =>
      product.category?.toLowerCase().includes('hardware') ||
      product.category?.toLowerCase().includes('accessories') ||
      product.collections?.includes('power-tools')
    );

  return (
    <>
      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
      <Hero />

      <PopularCategories products={products} />

      <CategorySection
        products={featuredProducts.length > 0 ? featuredProducts : products}
        title="Featured Bricoc Lineup"
        subtitle="Precision engineered golf carts built for golf courses, resort communities, and private estates."
        maxDisplay={FEATURED_PRODUCT_LIMIT}
        shuffleForVisitor
        visitorShuffleKey="home-featured"
      />

      <SameDayShipping />

      {electricGolfCarts.length > 0 && (
        <Suspense fallback={null}>
          <ProductGrid
            products={electricGolfCarts}
            sectionId="bricoc-golf-carts"
            title="Premium Bricoc Golf Carts"
            editorialCard={{
              title: 'Master Every Fairway and Neighborhood',
              description:
                'Bricoc golf carts combine whisper-quiet lithium power, superior comfort seating, and long-range battery performance. Experience smooth acceleration and street-legal capability built to outlast.',
            }}
            randomizeForVisitor
            visitorShuffleKey="home-electric-carts"
          />
        </Suspense>
      )}

      {accessoriesAndParts.length > 0 && (
        <Suspense fallback={null}>
          <ProductGrid
            products={accessoriesAndParts}
            sectionId="accessories-parts"
            title="Accessories & Equipment"
            randomizeForVisitor
            visitorShuffleKey="home-accessories"
          />
        </Suspense>
      )}

      <HomeReviews
        reviews={homeReviews}
        averageRating={homeReviewsStats.averageRating}
        totalReviews={homeReviewsStats.totalReviews}
      />
    </>
  );
  } catch (error) {
    console.error('Error loading homepage:', error);
    return (
      <>
        <Hero />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-[#233F31] mb-4">Unable to load products</h2>
          <p className="text-gray-600">Please refresh the page or try again later.</p>
        </div>
      </>
    );
  }
}
