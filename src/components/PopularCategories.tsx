import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types/product';

const POPULAR_CATEGORY_NAMES = [
  'Golf Carts',
  'Golf Bags',
  'Golf Gloves',
  'Golf Clubs',
  'Accessories & Parts',
  'Golf Apparel',
  'Electric Golf Carts',
  '4-Passenger Carts',
  '6-Passenger Carts',
  'Utility Carts',
] as const;

interface PopularCategoriesProps {
  products: Product[];
}

export default function PopularCategories({ products }: PopularCategoriesProps) {
  const categories = POPULAR_CATEGORY_NAMES.map((name) => {
    const categoryProducts = products.filter(
      (product) => product.category?.trim().toLowerCase() === name.toLowerCase(),
    );

    return {
      name,
      count: categoryProducts.length,
      image: categoryProducts.find((product) => product.images?.[0])?.images[0],
    };
  }).filter((category) => category.count > 0 && category.image);

  if (categories.length === 0) return null;

  return (
    <section className="bg-[#FAF6EB] py-14 md:py-20" aria-labelledby="popular-categories-title">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 md:mb-10">
            <h2
              id="popular-categories-title"
              className="text-3xl font-bold tracking-tight text-[#233F31] md:text-4xl"
            >
              Explore Golf Equipment & Categories
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/search?category=${encodeURIComponent(category.name)}`}
                className="relative overflow-hidden rounded-2xl border border-[#233F31]/15 bg-white shadow-sm transition-all duration-200 hover:border-[#789676] hover:shadow-md group"
                aria-label={`Shop ${category.name}`}
              >
                <div className="relative aspect-square overflow-hidden bg-[#FAF6EB]/40 p-3 sm:p-5">
                  <Image
                    src={category.image!}
                    alt={`${category.name} collection`}
                    fill
                    sizes="(max-width: 1023px) 50vw, 20vw"
                    className="object-contain p-5 sm:p-7 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex min-h-20 items-center bg-[#233F31] px-4 py-4 text-[#FAF6EB] sm:px-5 group-hover:bg-[#1c3327] transition-colors">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold leading-tight sm:text-base text-white">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
