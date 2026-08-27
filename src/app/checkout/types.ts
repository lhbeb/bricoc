export type { ShippingData } from '@/lib/shipping';

export interface ShippingEmailResult {
  orderId: string;
  checkoutLink?: string;
}

export interface PaypalPaymentInitializationResult {
  ok: boolean;
  payeeEmail: string;
  amount: number;
  currency: string;
  description: string;
  orderId?: string;
}

export interface PaypalApiInitializationResult {
  ok: boolean;
  orderId?: string;
}
