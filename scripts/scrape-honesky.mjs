/**
 * Flobay FULL SITE Scraper → Bricoc Supabase Importer
 *
 * - Iterates all 117 shop pages → collects every product URL
 * - For each product: fetches page, extracts data, downloads images,
 *   uploads to Supabase storage, inserts into DB
 * - gmc_enabled: TRUE on all products
 * - Skips already-imported slugs (resume-safe via progress.json)
 * - Logs progress to scrape-progress.json so it can be resumed
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL   = 'https://potkqvigvhwxapyyscgd.supabase.co';
const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdGtxdmlndmh3eGFweXlzY2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg1OTI4NiwiZXhwIjoyMTAzNDM1Mjg2fQ.6AdrrDfJhjoFX4N9gyd0h95o98-rLXK-YRel3WKT_F0';
const STORAGE_BUCKET = 'product-images';
const STORAGE_FOLDER = 'bricoc-catalog';
const LISTED_BY      = 'bricoc';
const CHECKOUT_FLOW  = 'stripe';
const CURRENCY       = 'USD';
const TMP_DIR        = './tmp-honesky';
const PROGRESS_FILE  = './scripts/honesky-progress.json';
const SHOP_BASE      = 'https://us-honesky.com/shop/?orderby=popularity&paged=1';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// ── Progress tracking (resume-safe) ──────────────────────────────────────────
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch {}
  }
  return { doneUrls: [], failedUrls: [], lastPage: 0, stats: { success: 0, failed: 0, skipped: 0 } };
}

function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function fetchText(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const attempt = (n) => {
      const req = mod.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          return fetchText(res.headers.location, retries).then(resolve).catch(reject);
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', (err) => {
        if (n > 0) delay(3000).then(() => attempt(n - 1));
        else reject(err);
      });
      req.setTimeout(30000, () => {
        req.destroy();
        if (n > 0) delay(3000).then(() => attempt(n - 1));
        else reject(new Error('Timeout'));
      });
    };
    attempt(retries);
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BricoCrawler/1.0)' }
    }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const file = createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function supabaseReq(method, urlPath, body, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${urlPath}`);
    const bodyBuf = body instanceof Buffer ? body
      : body ? Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))
      : null;
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': contentType,
        'Prefer': 'return=representation',
        ...(bodyBuf ? { 'Content-Length': bodyBuf.length } : {}),
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        if (res.statusCode >= 400) {
          reject(new Error(`Supabase ${res.statusCode}: ${raw.slice(0, 300)}`));
          return;
        }
        try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
      });
    });
    req.on('error', reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

// ── Scrape product links from a shop listing page ─────────────────────────────
function extractProductLinks(html) {
  const links = new Set();
  for (const m of html.matchAll(/href="(https:\/\/us-honesky\.com\/product\/[^"?#]+?)"/g)) {
    links.add(m[1]);
  }
  return [...links];
}

// ── Product page parsers ──────────────────────────────────────────────────────
function extractTitle(html) {
  const og = html.match(/<meta property="og:title" content="([^"]+)"/);
  if (og) return og[1].replace(/ [–-] US Honesky$/i, '').trim();
  const h1 = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/);
  if (h1) return h1[1].replace(/<[^>]+>/g, '').trim();
  return null;
}

function extractPrice(html) {
  for (const block of [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]) {
    try {
      const data = JSON.parse(block[1]);
      const items = Array.isArray(data['@graph']) ? data['@graph'] : [data];
      for (const item of items) {
        const offers = item.offers;
        if (offers) {
          const price = Array.isArray(offers) ? offers[0]?.price : offers.price;
          if (price && parseFloat(price) > 0) return parseFloat(price);
        }
      }
    } catch {}
  }
  const pm = html.match(/class="woocommerce-Price-amount[^"]*"[^>]*>[^$]*\$([0-9,]+(?:\.[0-9]{2})?)/);
  if (pm) return parseFloat(pm[1].replace(/,/g, ''));
  return null;
}

function extractDescription(html) {
  const short = html.match(/class="[^"]*woocommerce-product-details__short-description[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (short) {
    const text = short[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 20) return text.slice(0, 3000);
  }
  const tab = html.match(/id="tab-description"[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/);
  if (tab) return tab[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
  return '';
}

function isExcludedImageUrl(url) {
  const lower = url.toLowerCase();
  const excludedKeywords = [
    'logo', 'icon', 'payment', 'credit', 'badge', 'banner',
    'pin', 'phone', 'call', 'footer', 'header', 'cart', 'search',
    'favicon', 'avatar', 'whatsapp', 'social', 'trust', 'guarantee'
  ];
  return excludedKeywords.some(kw => lower.includes(kw));
}

function extractImages(html) {
  const images = new Set();
  
  // 1. WooCommerce product gallery data-large_image
  for (const m of html.matchAll(/data-large_image="([^"]+)"/g)) {
    const url = decodeURIComponent(m[1]).trim();
    if (!isExcludedImageUrl(url)) {
      images.add(url);
    }
  }

  // 2. WooCommerce product gallery link anchors (href in product-gallery)
  for (const m of html.matchAll(/class="[^"]*woocommerce-product-gallery__image[^"]*"[^>]*>\s*<a[^>]*href="([^"]+\.(?:jpg|jpeg|png|webp))"/gi)) {
    const url = decodeURIComponent(m[1]).trim();
    if (!isExcludedImageUrl(url)) {
      images.add(url);
    }
  }

  // 3. JSON-LD structured product image data
  for (const block of [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]) {
    try {
      const data = JSON.parse(block[1]);
      const items = Array.isArray(data['@graph']) ? data['@graph'] : [data];
      for (const item of items) {
        if (!item.image) continue;
        const imgs = Array.isArray(item.image) ? item.image : [item.image];
        for (const img of imgs) {
          const url = typeof img === 'string' ? img : (img.url || img.contentUrl);
          if (url?.includes('us-honesky.com/wp-content/uploads') && !isExcludedImageUrl(url)) {
            images.add(url.trim());
          }
        }
      }
    } catch {}
  }

  return [...images].slice(0, 15);
}

function extractCategory(html) {
  const cat = html.match(/class="[^"]*posted_in[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
  if (cat) return cat[1].trim();
  const bc = html.match(/product-category\/([^/"]+)\//);
  if (bc) return bc[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return 'Power Equipment';
}

function extractBrand(html, title) {
  for (const block of [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]) {
    try {
      const data = JSON.parse(block[1]);
      const items = Array.isArray(data['@graph']) ? data['@graph'] : [data];
      for (const item of items) {
        if (item.brand?.name) return item.brand.name;
      }
    } catch {}
  }
  return (title?.split(/[\s–—-]/)[0] || 'Honesky');
}

function getMimeType(url) {
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext] || 'image/jpeg';
}

function generateSlug(title, uid) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28) + uid;
}

function randomId(len = 6) {
  return Math.random().toString(36).substring(2, 2 + len);
}

// ── Upload image ──────────────────────────────────────────────────────────────
async function uploadImage(localPath, remotePath, mimeType) {
  const data = fs.readFileSync(localPath);
  try {
    await supabaseReq('POST', `/storage/v1/object/${STORAGE_BUCKET}/${remotePath}`, data, mimeType);
  } catch {
    await supabaseReq('PUT', `/storage/v1/object/${STORAGE_BUCKET}/${remotePath}`, data, mimeType);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${remotePath}`;
}

// ── Insert product ────────────────────────────────────────────────────────────
async function insertProduct(p) {
  return supabaseReq('POST', '/rest/v1/products', {
    id: p.slug, slug: p.slug, title: p.title,
    description: p.description || p.title,
    price: p.price, images: p.images,
    condition: 'new', category: p.category, brand: p.brand,
    payee_email: '', checkout_link: '',
    checkout_flow: CHECKOUT_FLOW, currency: CURRENCY,
    rating: 0, review_count: 0, reviews: [],
    meta: { gmc_enabled: false, published: true, source: 'honesky', source_url: p.sourceUrl },
    in_stock: true, is_featured: false, listed_by: LISTED_BY, collections: [],
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  const progress = loadProgress();
  const doneSet = new Set(progress.doneUrls);
  const failedSet = new Set(progress.failedUrls);

  console.log(`🚀 US Honesky Import — 1 page to scrape`);
  console.log(`📊 Resuming: ${doneSet.size} done, ${failedSet.size} failed, last page: ${progress.lastPage}\n`);

  // ── Phase 1: Collect all product URLs ──────────────────────────────────────
  let allProductUrls = progress.allProductUrls || [];

  if (!allProductUrls.length) {
    console.log(`📖 Collecting product URLs from ${SHOP_BASE}...`);

    for (let page = 1; page <= 1; page++) {
      const url = SHOP_BASE;
      try {
        process.stdout.write(`  Page ${page}/1... `);
        const html = await fetchText(url);
        const links = extractProductLinks(html);
        let newLinks = 0;
        for (const link of links) {
          if (!allProductUrls.includes(link)) {
            allProductUrls.push(link);
            newLinks++;
          }
        }
        process.stdout.write(`${links.length} products (+${newLinks} new)\n`);
        progress.lastPage = page;
        progress.allProductUrls = allProductUrls;
        saveProgress(progress);
        await delay(600);
      } catch (err) {
        process.stdout.write(`⚠️ ${err.message}\n`);
        await delay(2000);
      }
    }
    progress.allProductUrls = allProductUrls;
    saveProgress(progress);
    console.log(`\n✅ Collected ${allProductUrls.length} total product URLs\n`);
  }

  // Filter to only unprocessed URLs
  const toProcess = allProductUrls.filter(url => !doneSet.has(url));
  const total = toProcess.length;
  console.log(`📦 Processing ${total} products (${doneSet.size} already done)...\n`);

  // ── Phase 2: Process each product ─────────────────────────────────────────
  for (let i = 0; i < toProcess.length; i++) {
    const productUrl = toProcess[i];
    const pctDone = doneSet.size + i;
    const pctTotal = doneSet.size + total;
    process.stdout.write(`\n[${pctDone + 1}/${pctTotal}] ${productUrl.split('/product/')[1]?.slice(0, 60)}\n`);

    try {
      await delay(1000);
      const html = await fetchText(productUrl);

      const title = extractTitle(html);
      const price = extractPrice(html);
      const description = extractDescription(html);
      const rawImages = extractImages(html);
      const category = extractCategory(html);
      const brand = extractBrand(html, title);

      process.stdout.write(`  📝 ${title?.slice(0, 60)} | 💰 $${price || '?'} | 🖼 ${rawImages.length}\n`);

      if (!title) throw new Error('No title found');
      if (!price || price <= 0) throw new Error('No price found');
      if (rawImages.length === 0) throw new Error('No images found');

      const uid = randomId(6);
      const slug = generateSlug(title, uid);
      const folderPath = `${STORAGE_FOLDER}/${slug}`;

      // Download & upload images
      const uploadedImages = [];
      for (let j = 0; j < rawImages.length; j++) {
        const imgUrl = rawImages[j];
        const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
        const safeExt = ['jpg','jpeg','png','webp'].includes(ext) ? ext : 'jpg';
        const localFile = path.join(TMP_DIR, `${slug}-${j + 1}.${safeExt}`);
        const remotePath = `${folderPath}/${j + 1}.${safeExt}`;
        try {
          await downloadFile(imgUrl, localFile);
          const publicUrl = await uploadImage(localFile, remotePath, getMimeType(imgUrl));
          uploadedImages.push(publicUrl);
          try { fs.unlinkSync(localFile); } catch {}
          await delay(200);
        } catch (imgErr) {
          process.stdout.write(`  ⚠️  img ${j + 1}: ${imgErr.message}\n`);
        }
      }

      if (uploadedImages.length === 0) throw new Error('All image uploads failed');

      await insertProduct({ slug, title, description, price, images: uploadedImages, category, brand, sourceUrl: productUrl });

      process.stdout.write(`  ✅ Inserted: ${slug} (${uploadedImages.length} imgs)\n`);
      doneSet.add(productUrl);
      progress.doneUrls.push(productUrl);
      progress.stats.success++;
      saveProgress(progress);

    } catch (err) {
      process.stdout.write(`  ❌ ${err.message}\n`);
      if (!failedSet.has(productUrl)) {
        failedSet.add(productUrl);
        progress.failedUrls.push(productUrl);
        progress.stats.failed++;
        saveProgress(progress);
      }
    }

    // Print running totals every 25 products
    if ((i + 1) % 25 === 0) {
      console.log(`\n── Progress: ${progress.stats.success} ✅  ${progress.stats.failed} ❌  (${i + 1}/${total} this session) ──\n`);
    }

    await delay(1200);
  }

  // Cleanup
  try { fs.rmdirSync(TMP_DIR); } catch {}

  console.log('\n' + '═'.repeat(65));
  console.log(`✅ Total imported:  ${progress.stats.success}`);
  console.log(`❌ Total failed:    ${progress.stats.failed}`);
  console.log(`📄 Progress saved to: ${PROGRESS_FILE}`);
  console.log('═'.repeat(65));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
