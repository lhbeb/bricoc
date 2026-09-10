export const GOOGLE_ADS_ID = 'AW-18441617346';

const PURCHASE_CONVERSION_LABEL = '1UFCCJKbtfMcEML_0tlE';

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: Gtag;
  }
}

export function getGoogleAdsTag(): Gtag | null {
  if (typeof window === 'undefined') return null;

  // The inline <script> in layout.tsx initialises dataLayer + gtag synchronously
  // before gtag.js loads, so we never need to re-call 'js' or 'config' here.
  // If the stub is somehow absent (e.g. unit-test env), create a safe fallback.
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
  }

  return window.gtag;
}

interface PurchaseConversion {
  value: number;
  currency: string;
  transactionId: string;
  email?: string | null;
  contentId?: string;
  contentName?: string;
}

export function queueGoogleAdsPurchase({
  value,
  currency,
  transactionId,
  email,
  contentId,
  contentName,
}: PurchaseConversion): boolean {
  const gtag = getGoogleAdsTag();
  if (!gtag) return false;

  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    gtag('set', 'user_data', { email: normalizedEmail });
  }

  // 1. Google Ads specific conversion action
  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${PURCHASE_CONVERSION_LABEL}`,
    value,
    currency,
    transaction_id: transactionId,
  });

  // 2. Standard Google Merchant Center / Google Tag ecommerce purchase key event
  gtag('event', 'purchase', {
    transaction_id: transactionId,
    value,
    currency: currency || 'USD',
    items: [
      {
        item_id: contentId || transactionId,
        item_name: contentName || 'Order Item',
        price: value,
        quantity: 1,
      },
    ],
  });

  return true;
}
