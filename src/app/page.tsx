import React, { Suspense } from 'react';
import Hero from '@/components/Hero';
import SameDayShipping from '@/components/SameDayShipping';
import ProductGrid from '@/components/ProductGrid';
import HomeReviews from '@/components/HomeReviews';
import CategorySection from '@/components/CategorySection';
import PopularCategories from '@/components/PopularCategories';
import { getFeaturedProducts } from '@/lib/data';
import { homeReviews, homeReviewsStats } from '@/lib/homeReviews';
import ScrollToTop from '@/components/ScrollToTop';
import { FEATURED_PRODUCT_LIMIT } from '@/config/products';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  try {
    const featuredProducts = (await getFeaturedProducts()).filter(
      product => product.isFeatured === true,
    );

    const golfBags = featuredProducts.filter(product =>
      /\bgolf bags?\b/i.test(product.category || '') ||
      /\bgolf bags?\b/i.test(product.title || '')
    );

    const accessoriesAndParts = featuredProducts.filter((product) =>
      product.category?.toLowerCase().includes('hardware') ||
      product.category?.toLowerCase().includes('accessories') ||
      product.collections?.includes('power-tools')
    );

  return (
    <>
      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
      <Hero products={featuredProducts} />

      <PopularCategories products={featuredProducts} />

      <CategorySection
        products={featuredProducts}
        title="Featured Golf Bags & Accessories"
        subtitle="Explore the golf bags, leather gloves, and ball accessories currently available from Bricoc."
        maxDisplay={FEATURED_PRODUCT_LIMIT}
        shuffleForVisitor
        visitorShuffleKey="home-featured"
      />

      <SameDayShipping />

      {golfBags.length > 0 && (
        <Suspense fallback={null}>
          <ProductGrid
            products={golfBags}
            sectionId="bricoc-golf-bags"
            title="Premium Bricoc Golf Bags"
            editorialCard={{
              title: 'Gear Up for Your Round',
              description:
                'Browse Bricoc golf bags with club organization and storage, alongside accessories for carrying and organizing golf balls.',
            }}
            randomizeForVisitor
            visitorShuffleKey="home-golf-bags"
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
