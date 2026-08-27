import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

import { getCollectionsForCategory } from '../src/lib/productCollections';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const shouldApply = process.argv.includes('--apply');

function collectionsMatch(current: unknown, expected: string[]): boolean {
  const normalizedCurrent = Array.isArray(current)
    ? current.filter((value): value is string => typeof value === 'string').sort()
    : [];
  return normalizedCurrent.join('|') === [...expected].sort().join('|');
}

async function main() {
  const { data, error } = await supabase
    .from('products')
    .select('slug,title,category,collections')
    .order('category');

  if (error) throw error;

  const products = data || [];
  const changes = products
    .map((product) => ({
      ...product,
      expectedCollections: getCollectionsForCategory(product.category || ''),
    }))
    .filter((product) => !collectionsMatch(product.collections, product.expectedCollections));

  console.log(`${products.length} products audited; ${changes.length} require collection updates.`);

  for (const product of changes) {
    console.log(
      `${product.slug}: [${(product.collections || []).join(', ')}] -> [${product.expectedCollections.join(', ')}]`,
    );
  }

  if (!shouldApply) {
    console.log('Dry run only. Re-run with --apply to update Supabase.');
    return;
  }

  for (const product of changes) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ collections: product.expectedCollections })
      .eq('slug', product.slug);

    if (updateError) {
      throw new Error(`Failed to update ${product.slug}: ${updateError.message}`);
    }
  }

  console.log(`Updated ${changes.length} products successfully.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
