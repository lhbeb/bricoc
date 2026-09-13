#!/usr/bin/env node
/**
 * Run this script locally to fix the checkout_flow constraint in Supabase
 * and then bulk-switch all 'stripe' products to 'stripe-hosted'.
 *
 * Usage:
 *   node scripts/fix-stripe-hosted-constraint.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

// ─── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};
for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const sep = line.indexOf('=');
  if (sep < 1) continue;
  env[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌  Could not parse project ref from SUPABASE_URL:', SUPABASE_URL);
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function headers(extra = {}) {
  return {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function rest(urlPath, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${urlPath}`;
  const mergedHeaders = {
    ...headers(),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers: mergedHeaders });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${options.method || 'GET'} ${url} → ${res.status}: ${body.slice(0, 400)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Step 1: Query what products are on 'stripe' ──────────────────────────────
console.log('\n🔍  Fetching all products with checkout_flow = "stripe" …');
const products = await rest('products?select=id,slug,title,checkout_flow&checkout_flow=eq.stripe', {
  headers: { Prefer: 'return=representation' },
});
console.log(`   Found ${products.length} products.`);

if (products.length === 0) {
  console.log('✅  Nothing to update.');
  process.exit(0);
}

// ─── Step 2: Try to update one product to see if constraint allows it ─────────
console.log('\n🧪  Testing if "stripe-hosted" is accepted by DB constraint …');
const testProduct = products[0];
let constraintBlocking = false;
try {
  await rest(`products?id=eq.${encodeURIComponent(testProduct.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ checkout_flow: 'stripe-hosted' }),
  });
  console.log('   ✅  Constraint OK — "stripe-hosted" is accepted.');
} catch (err) {
  if (err.message.includes('products_checkout_flow_check') || err.message.includes('check constraint')) {
    constraintBlocking = true;
    console.log('   ❌  Constraint is blocking "stripe-hosted". Need to fix it first.');
    // Restore the test product
    await rest(`products?id=eq.${encodeURIComponent(testProduct.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ checkout_flow: 'stripe' }),
    }).catch(() => {});
  } else {
    throw err;
  }
}

// ─── Step 3: Fix constraint via Management API (if needed) ───────────────────
if (constraintBlocking) {
  console.log('\n🔧  Fixing constraint via Supabase Management API …');
  const fixSQL = `
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_checkout_flow_check;
ALTER TABLE public.products ADD CONSTRAINT products_checkout_flow_check CHECK (
  checkout_flow IS NULL OR checkout_flow IN (
    'buymeacoffee', 'kofi', 'external', 'stripe', 'stripe-hosted',
    'paypal-invoice', 'paypal-unclaimed', 'paypal-direct', 'paypal-api',
    'lemon-squeezy'
  )
);
`;

  const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: fixSQL }),
  });

  if (mgmtRes.ok) {
    console.log('   ✅  Constraint fixed via Management API!');
    constraintBlocking = false;
  } else {
    const errText = await mgmtRes.text();
    console.error('   ⚠️   Management API failed:', errText.slice(0, 300));
    console.error('\n' + '─'.repeat(60));
    console.error('The Management API requires a Personal Access Token, not the service role key.');
    console.error('Please run this SQL manually in Supabase SQL Editor:');
    console.error('https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.error('\n' + fixSQL);
    console.error('─'.repeat(60) + '\n');
    process.exit(1);
  }
}

// ─── Step 4: Bulk update all stripe → stripe-hosted ──────────────────────────
console.log('\n🚀  Updating all products from "stripe" → "stripe-hosted" …');
let successCount = 0;
let failCount = 0;

for (const product of products) {
  if (product.checkout_flow === 'stripe-hosted') {
    successCount++;
    continue; // already updated (test product from step 2)
  }
  try {
    await rest(`products?id=eq.${encodeURIComponent(product.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ checkout_flow: 'stripe-hosted', updated_at: new Date().toISOString() }),
    });
    successCount++;
    if (successCount % 50 === 0) {
      console.log(`   ⏳  ${successCount}/${products.length} done …`);
    }
  } catch (err) {
    failCount++;
    console.error(`   ❌  Failed to update ${product.slug}: ${err.message.slice(0, 120)}`);
  }
}

console.log(`\n✅  Done! ${successCount} updated, ${failCount} failed out of ${products.length} products.`);
