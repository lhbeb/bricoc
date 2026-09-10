export const GOOGLE_ADS_ID = 'AW-18441617346';

const PURCHASE_CONVERSION_LABEL = '1UFCCJKbtfMcEML_0tlE';
const ADD_TO_BASKET_CONVERSION_LABEL = '-UI4CKKrwvMcEML_0tlE';
const BEGIN_CHECKOUT_CONVERSION_LABEL = 'jFkACPS7wvMcEML_0tlE';
export const PAGE_VIEW_CONVERSION_LABEL = 'DfaeCNLDwvMcEML_0tlE';

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

export function queueGoogleAdsAddToBasket(value: number, currency: string, itemData?: { id?: string; name?: string }): boolean {
  const gtag = getGoogleAdsTag();
  if (!gtag) return false;

  const validValue = Number.isFinite(value) && value > 0 ? value : 1.0;
  const validCurrency = currency || 'USD';

  // Google Ads specific conversion action
  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${ADD_TO_BASKET_CONVERSION_LABEL}`,
    value: validValue,
    currency: validCurrency,
  });

  // Standard ecommerce event for Google Tag / Merchant Center / GA4
  gtag('event', 'add_to_cart', {
    value: validValue,
    currency: validCurrency,
    items: [
      {
        item_id: itemData?.id || 'product',
        item_name: itemData?.name || 'Product',
        price: validValue,
        quantity: 1,
      },
    ],
  });

  return true;
}

export function queueGoogleAdsBeginCheckout(value: number, currency: string): boolean {
  const gtag = getGoogleAdsTag();
  if (!gtag) return false;

  const validValue = Number.isFinite(value) && value > 0 ? value : 1.0;
  const validCurrency = currency || 'USD';

  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${BEGIN_CHECKOUT_CONVERSION_LABEL}`,
    value: validValue,
    currency: validCurrency,
  });

  // Standard ecommerce begin_checkout event for GA4 / GMC
  gtag('event', 'begin_checkout', {
    value: validValue,
    currency: validCurrency,
  });

  return true;
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
