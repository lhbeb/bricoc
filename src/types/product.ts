export interface Review {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  helpful?: number;
  verified?: boolean;
  location?: string;
  purchaseDate?: string;
  images?: string[]; // Array of review/unboxing images
  productTitle?: string; // Product this review belongs to
  productSlug?: string; // Product slug for linking
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  images: string[];
  condition: string;
  category: string;
  brand: string;
  payeeEmail: string;
  currency: string;
  checkoutLink: string;
  checkoutFlow?: 'buymeacoffee' | 'kofi' | 'external' | 'stripe' | 'paypal-invoice' | 'paypal-unclaimed' | 'paypal-direct' | 'paypal-api'; // Checkout flow type
  reviews?: Review[];
  meta?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    published?: boolean;
    targetMarket?: string; // e.g. 'uk' | 'us' | 'eu' | 'ca' | 'au'
    hasSizes?: boolean;
    sizes?: string;
    has_mens_sizes?: boolean;
    sizes_mens?: string;
    has_womens_sizes?: boolean;
    sizes_womens?: string;
    rotate_links?: boolean;
    checkout_links?: string[];
    gmc_enabled?: boolean;
  };
  published?: boolean; // Extracted from meta.published for easier access
  isFeatured?: boolean;
  inStock?: boolean;
  listedBy?: string | null; // The user who listed this product (admin-only, internal)
  sellerId?: string | null; // The public-facing seller associated with this product
  collections?: string[]; // Array of collection tags (electronics, entertainment, hobbies-collectibles, featured, etc.)
  original_price?: number;
  originalPrice?: number;
}
