import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env.local'), quiet: true });

if (!process.argv.includes('--apply')) {
  throw new Error('Run with --apply to update the 40 Zimgoody products.');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('lgzdkdexkumbadelhpzm.supabase.co') ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Bricoc service credentials unavailable');
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const { data: products, error } = await db.from('products')
  .select('id,slug,title,price,original_price,description,meta')
  .contains('meta', { source: 'zimgoody' });
if (error) throw error;
if (products.length !== 40) throw new Error(`Expected 40 products, found ${products.length}`);
if (products.some(product => product.original_price != null)) {
  throw new Error('At least one product is already discounted; stopped to prevent compounding.');
}

const outputDir = path.join(root, 'scratch', 'zimgoody-popular');
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(
  path.join(outputDir, 'pre-discount-backup.json'),
  JSON.stringify(products, null, 2),
);

const shippingCopy = [
  'Shipping',
  '- Free standard shipping across all 50 U.S. states with no minimum purchase',
  '- Processing time: 0-1 business day',
  '- Orders placed before 2:00 PM EST on business days ship the same business day',
  '- Estimated transit time: 3-4 business days',
  '- Tracking details are provided after dispatch',
].join('\n');

const shipping = {
  country: 'US',
  service: 'Free Standard Shipping',
  price: 0,
  currency: 'USD',
  handling_time: { min: 0, max: 1, unit: 'business_day' },
    transit_time: { min: 3, max: 4, unit: 'business_day' },
  order_cutoff: '2:00 PM EST',
};

for (const product of products.sort((a, b) => a.meta.source_rank - b.meta.source_rank)) {
  const oldPrice = Number(product.price);
  const newPrice = Math.round(oldPrice * 0.9 * 100) / 100;
  const description = product.description.includes('\n\nShipping\n')
    ? product.description.replace(/\n\nShipping\n[\s\S]*$/, `\n\n${shippingCopy}`)
    : `${product.description.trim()}\n\n${shippingCopy}`;
  const reasons = (product.meta.gmc_readiness?.reasons || [])
    .filter(reason => reason !== 'Oversized-item shipping policy unverified');
  const meta = {
    ...product.meta,
    gmc_enabled: false,
    discount_percent: 10,
    shipping,
    gmc_readiness: {
      ...(product.meta.gmc_readiness || {}),
      status: 'blocked',
      reasons,
    },
  };
  const { error: updateError } = await db.from('products').update({
    price: newPrice,
    original_price: oldPrice,
    description,
    meta,
  }).eq('id', product.id);
  if (updateError) throw updateError;
  console.log(`${product.meta.source_rank}/40 ${product.title}: $${oldPrice.toFixed(2)} -> $${newPrice.toFixed(2)}`);
}
