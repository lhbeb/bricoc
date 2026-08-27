import type { Product } from '@/types/product';

const VISITOR_ID_KEY = 'bricoc_visitor_id';
const ROTATION_WINDOW_MS = 5 * 60 * 1000;

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function generateVisitorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `visitor_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  try {
    const existingVisitorId = window.localStorage.getItem(VISITOR_ID_KEY);

    if (existingVisitorId) {
      return existingVisitorId;
    }

    const nextVisitorId = generateVisitorId();
    window.localStorage.setItem(VISITOR_ID_KEY, nextVisitorId);
    return nextVisitorId;
  } catch {
    return generateVisitorId();
  }
}

export function createVisitorRotationSeed(sectionKey: string): number {
  const visitorId = getOrCreateVisitorId();
  const rotationBucket = Math.floor(Date.now() / ROTATION_WINDOW_MS);

  return hashString(`${visitorId}:${sectionKey}:${rotationBucket}`);
}

export function shuffleProductsWithSeed(products: Product[], seed: number): Product[] {
  if (products.length <= 1) {
    return products;
  }

  const shuffled = [...products];
  let currentSeed = seed;

  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function selectRotatedProducts(products: Product[], seed: number, count: number): Product[] {
  return shuffleProductsWithSeed(products, seed).slice(0, count);
}
