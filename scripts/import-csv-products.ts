import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { getCollectionsForCategory } from '../src/lib/productCollections';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function extractBrand(title: string): string {
  const firstWord = title.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
  if (firstWord && firstWord.length > 1) return firstWord;
  return 'Xavlyin';
}

async function importProducts(csvPath: string) {
  console.log(`Reading ${csvPath}...`);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  if (lines.length < 2) {
    console.error('CSV file is empty or has no data rows.');
    return;
  }

  const headers = parseCSVLine(lines[0]);
  console.log(`Headers: ${headers.join(', ')}`);

  const totalRows = lines.length - 1;
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  console.log(`Total products to import: ${totalRows}`);

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h.trim()] = values[idx] || ''; });

    const slug = row.slug || row.id;
    const title = row.title?.replace(/&#\d+;/g, '').replace(/&#\w+;/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#8211;/g, '-').replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').replace(/&#8243;/g, '"').replace(/&#8217;/g, "'").trim();
    const description = row.excerpt?.replace(/&#\d+;/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() || title;
    const price = parseFloat(row.price);
    const imageUrl = row.image_url || '';
    const categories = row.categories || '';
    const currency = row.currency || 'USD';

    if (!slug || !title || isNaN(price) || price <= 0) {
      console.warn(`  [SKIP] Row ${i}: Invalid data (slug="${slug}", title="${title?.substring(0, 40)}", price=${row.price})`);
      skipCount++;
      continue;
    }

    const brand = extractBrand(title);
    const mainCategory = categories.split(';')[0].trim();
    const collections = getCollectionsForCategory(mainCategory);

    const productData = {
      id: slug,
      slug,
      title,
      description,
      price,
      images: imageUrl ? [imageUrl] : [],
      condition: 'New',
      category: mainCategory || 'Lawn Mowers',
      brand,
      payee_email: '',
      checkout_link: '',
      checkout_flow: 'paypal-unclaimed' as const,
      currency,
      in_stock: true,
      listed_by: 'walid',
      collections,
    };

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          id: productData.id,
          slug: productData.slug,
          title: productData.title,
          description: productData.description,
          price: productData.price,
          images: productData.images,
          condition: productData.condition,
          category: productData.category,
          brand: productData.brand,
          payee_email: productData.payee_email,
          checkout_link: productData.checkout_link,
          checkout_flow: productData.checkout_flow,
          currency: productData.currency,
          in_stock: productData.in_stock,
          listed_by: productData.listed_by,
          collections: productData.collections,
          rating: 0,
          review_count: 0,
          reviews: [],
          meta: {},
          is_featured: false,
        })
        .select();

      if (error) {
        if (error.code === '23505') {
          console.warn(`  [SKIP] ${slug}: Already exists (duplicate key)`);
          skipCount++;
        } else {
          console.error(`  [ERROR] ${slug}: ${error.message}`);
          errorCount++;
        }
      } else {
        successCount++;
        if (successCount % 20 === 0) {
          console.log(`  Progress: ${successCount}/${totalRows} imported`);
        }
      }
    } catch (err: any) {
      console.error(`  [ERROR] ${slug}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\nImport complete:`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors:  ${errorCount}`);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: npx tsx scripts/import-csv-products.ts <path-to-csv>');
  process.exit(1);
}

importProducts(csvPath).catch(console.error);
