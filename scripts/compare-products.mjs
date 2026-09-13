#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

// Parse .env.local file
function parseEnv(path) {
  const values = {};
  for (const rawLine of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const sourceEnv = parseEnv('C:\\Users\\mehdi\\OneDrive\\Desktop\\my websites all\\bricoc.com\\.env.local');

const source = createClient(sourceEnv.NEXT_PUBLIC_SUPABASE_URL, sourceEnv.SUPABASE_SERVICE_ROLE_KEY);
const target = createClient('https://lgzdkdexkumbadelhpzm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnemRrZGV4a3VtYmFkZWxocHptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTI1NTkyNiwiZXhwIjoyMTA0ODMxOTI2fQ.i6xZtbX6dnmhq6tpdIhZiBQgnk5FeCNCSwG9_M7mlcY');

async function compareProducts() {
  console.log('Comparing products between source and target...');
  
  const { data: sourceProducts, error: sourceError } = await source.from('products').select('id, slug, title');
  const { data: targetProducts, error: targetError } = await target.from('products').select('id, slug, title');
  
  if (sourceError) {
    console.error('Error fetching source products:', sourceError);
    return;
  }
  if (targetError) {
    console.error('Error fetching target products:', targetError);
    return;
  }
  
  console.log(`\n📊 Source products: ${sourceProducts.length}`);
  console.log(`📊 Target products: ${targetProducts.length}`);
  
  const sourceSlugs = new Set(sourceProducts.map(p => p.slug));
  const targetSlugs = new Set(targetProducts.map(p => p.slug));
  
  const missingInTarget = [...sourceSlugs].filter(slug => !targetSlugs.has(slug));
  const extraInTarget = [...targetSlugs].filter(slug => !sourceSlugs.has(slug));
  
  console.log(`\n❌ Slugs missing in target: ${missingInTarget.length}`);
  console.log(`➕ Extra slugs in target: ${extraInTarget.length}`);
  
  if (missingInTarget.length > 0) {
    console.log('Missing slugs (first 5):', missingInTarget.slice(0, 5));
  }
  if (extraInTarget.length > 0) {
    console.log('Extra slugs (first 5):', extraInTarget.slice(0, 5));
  }
  
  // Check if slugs match for same IDs
  const sourceById = new Map(sourceProducts.map(p => [p.id, p.slug]));
  const targetById = new Map(targetProducts.map(p => [p.id, p.slug]));
  
  let slugMismatches = 0;
  for (const [id, sourceSlug] of sourceById) {
    const targetSlug = targetById.get(id);
    if (targetSlug && targetSlug !== sourceSlug) {
      slugMismatches++;
      console.log(`⚠️  Slug mismatch for ID ${id}: source='${sourceSlug}', target='${targetSlug}'`);
    }
  }
  
  console.log(`\n🔍 Slug mismatches: ${slugMismatches}`);
  console.log(`🎯 Slug stability: ${slugMismatches === 0 ? '✅ PERFECT - All slugs unchanged' : '❌ ISSUES FOUND'}`);
  
  // Show some sample products to verify
  console.log('\n📋 Sample products comparison:');
  const sampleSize = Math.min(5, sourceProducts.length);
  for (let i = 0; i < sampleSize; i++) {
    const sourceProduct = sourceProducts[i];
    const targetProduct = targetProducts.find(p => p.id === sourceProduct.id);
    console.log(`  ${sourceProduct.slug}: ${sourceProduct.title} ${targetProduct ? '✅' : '❌'}`);
  }
}

compareProducts().catch(console.error);