import type { Product } from '@/types/product';

export interface PendingOrder {
  orderId: string;
  product: Product;
  createdAt: string;
}

// Stores the order reference at checkout time so the /thankyou page can fire a
// Purchase event from the actual saved order (not leftover cart state) once the
// user returns from the external payment provider (Buy Me A Coffee, etc.).
const PENDING_ORDER_KEY = 'Bricoc_pending_order';

export function setPendingOrder(orderId: string, product: Product): void {
  if (typeof window === 'undefined') return;
  try {
    const pending: PendingOrder = {
      orderId,
      product,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pending));
  } catch (error) {
    console.error('Failed to save pending order:', error);
  }
}

export function getPendingOrder(): PendingOrder | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(PENDING_ORDER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to read pending order:', error);
    return null;
  }
}

export function clearPendingOrder(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_ORDER_KEY);
  } catch (error) {
    console.error('Failed to clear pending order:', error);
  }
}
