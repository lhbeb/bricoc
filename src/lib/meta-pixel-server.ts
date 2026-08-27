import 'server-only';
import { createHash } from 'crypto';

// Meta Conversions API (server-side). Used to send an authoritative Purchase
// event when an admin confirms an order (there is no automated confirmation
// from Buy Me A Coffee). The event_id equals the order id so Meta can dedupe
// it against the client-side Purchase fired on /thankyou.
//
// Requires env vars:
//   META_PIXEL_ID      - the Meta Pixel id (e.g. 869199797850063)
//   META_ACCESS_TOKEN  - a Meta Conversions API access token
const META_PIXEL_ID = process.env.META_PIXEL_ID || '';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const GRAPH_VERSION = 'v21.0';

export interface MetaServerPurchaseInput {
  orderId: string;
  value: number;
  currency: string;
  contentIds: string[];
  contentName?: string;
  email?: string;
  eventSourceUrl?: string;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function sendMetaServerPurchase(
  input: MetaServerPurchaseInput
): Promise<boolean> {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
    console.warn(
      '[Meta CAPI] META_PIXEL_ID / META_ACCESS_TOKEN not configured — skipping server-side Purchase'
    );
    return false;
  }

  try {
    const userData: Record<string, unknown> = {};
    if (input.email) {
      // Meta expects a SHA-256 hash of the lowercase email.
      userData.em = [sha256(input.email.trim().toLowerCase())];
    }

    const event = {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: input.orderId,
      action_source: 'website',
      event_source_url: input.eventSourceUrl || '',
      user_data: userData,
      custom_data: {
        value: Number(input.value) || 0,
        currency: input.currency || 'USD',
        content_ids: input.contentIds.filter(Boolean),
        content_type: 'product',
        num_items: 1,
        content_name: input.contentName || '',
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [event] }),
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[Meta CAPI] Purchase event rejected:', response.status, result);
      return false;
    }

    console.log('[Meta CAPI] Purchase event sent:', input.orderId, result);
    return true;
  } catch (error) {
    console.error('[Meta CAPI] Failed to send Purchase event:', error);
    return false;
  }
}
