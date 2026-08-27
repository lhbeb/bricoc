import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { getCollectionsForCategory } from '../src/lib/productCollections';

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
const STORAGE_BUCKET = 'product-images';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function color(msg: string, code: string) {
  return `\u001b[${code}m${msg}\u001b[0m`;
}

function info(msg: string) { console.log(color(msg, '36')); }
function success(msg: string) { console.log(color(msg, '32')); }
function warn(msg: string) { console.warn(color(msg, '33')); }
function error(msg: string) { console.error(color(msg, '31')); }

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith('https') ? https : http;
    const req = transport.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadImage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function getExtension(url: string): string {
  const match = url.match(/\.(jpe?g|png|gif|webp|avif)(\?|$)/i);
  if (match) return match[1].toLowerCase();
  const clean = url.replace(/\?.*/, '').split('/').pop() || '';
  const ext = path.extname(clean).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].includes(ext)) return ext.replace('.', '');
  return 'jpg';
}

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

function cleanHtmlEntities(text: string): string {
  return text
    .replace(/&#\d+;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#8211;/g, '-').replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#8243;/g, '"')
    .trim();
}

async function importProducts(csvPath: string) {
  info(`Reading ${csvPath}...`);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  if (lines.length < 2) {
    error('CSV file is empty or has no data rows.');
    return;
  }

  const headers = parseCSVLine(lines[0]);
  const totalRows = lines.length - 1;
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  info(`Total products to import: ${totalRows}`);

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h.trim()] = values[idx] || ''; });

    const slug = row.slug || row.id;
    const title = cleanHtmlEntities(row.title);
    const description = cleanHtmlEntities(row.excerpt) || title;
    const price = parseFloat(row.price);
    const imageUrl = row.image_url || '';
    const categories = row.categories || '';
    const currency = row.currency || 'USD';

    if (!slug || !title || isNaN(price) || price <= 0) {
      warn(`  [SKIP] Row ${i}: Invalid data (slug="${slug}", title="${title?.substring(0, 40)}", price=${row.price})`);
      skipped++;
      continue;
    }

    process.stdout.write(`  [${i}/${totalRows}] ${slug.substring(0, 50)}... `);

    try {
      const brand = extractBrand(title);
      const mainCategory = categories.split(';')[0].trim();
      const collections = getCollectionsForCategory(mainCategory);

      // Download and upload image
      let resolvedImageUrl = '';
      if (imageUrl) {
        try {
          const ext = getExtension(imageUrl);
          const imgBuffer = await downloadImage(imageUrl);
          const cleanSlug = slug.replace(/[^a-zA-Z0-9-_]/g, '-');
          const storagePath = `${cleanSlug}/img1.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, imgBuffer, {
              contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
              upsert: true,
            });

          if (uploadError) {
            warn(`upload failed (${uploadError.message}), using original URL`);
            resolvedImageUrl = imageUrl;
          } else {
            const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
            resolvedImageUrl = urlData?.publicUrl || imageUrl;
          }
        } catch (err: any) {
          warn(`download failed (${err.message}), using original URL`);
          resolvedImageUrl = imageUrl;
        }
      }

      // Upsert product
      const { error: upsertError } = await supabase
        .from('products')
        .upsert({
          id: slug,
          slug,
          title,
          description,
          price,
          images: resolvedImageUrl ? [resolvedImageUrl] : [],
          condition: 'New',
          category: mainCategory || 'Lawn Mowers',
          brand,
          payee_email: '',
          checkout_link: '',
          checkout_flow: 'paypal-unclaimed',
          currency,
          in_stock: true,
          listed_by: 'walid',
          collections,
          rating: 0,
          review_count: 0,
          reviews: [],
          meta: {},
          is_featured: false,
        }, { onConflict: 'slug' });

      if (upsertError) {
        error(`failed: ${upsertError.message}`);
        failed++;
      } else {
        success(`✓`);
        imported++;
      }
    } catch (err: any) {
      error(`error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n-------------------------------');
  console.log(`Imported: ${imported}`);
  console.log(`Skipped : ${skipped}`);
  console.log(`Failed  : ${failed}`);
  console.log('-------------------------------');
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: npx tsx scripts/import-products-with-images-from-csv.ts <path-to-csv>');
  process.exit(1);
}

importProducts(csvPath).catch(console.error);
