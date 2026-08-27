import type { Review } from '@/types/product';

// The live homepage feed is restricted to lawn-mower product reviews.
// Keep the server-rendered fallback empty rather than showing reviews from
// unrelated legacy products while the live feed is loading.
export const homeReviews: Review[] = [];

export const homeReviewsStats = {
  averageRating: 0,
  totalReviews: 0,
};
