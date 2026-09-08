import https from 'https';

const SUPABASE_URL = 'https://potkqvigvhwxapyyscgd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdGtxdmlndmh3eGFweXlzY2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg1OTI4NiwiZXhwIjoyMTAzNDM1Mjg2fQ.6AdrrDfJhjoFX4N9gyd0h95o98-rLXK-YRel3WKT_F0';

const BAD_HASHES = new Set([
  'bab4957ca3d2b185b8a5b3841b051a73', // flo icon logo
  '8a003a4c56fc873bf07ac273f7f93d13', // Flobay logo
  '73c673a4f81788dda654c7f228a2331c', // map location pin
  'db890c2f5e02039569b4733dc5785976', // phone call icon
  'f919fc7145bf5446bc53c453d73f1452', // payment methods banner
]);

const BAD_SIZES = new Set([23481, 69080, 21939, 19655, 22025]);

async function fetchAllProducts() {
  let all = [];
  let page = 0;
  const pageSize = 500;
  while (true) {
    const rangeStart = page * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;
    const data = await new Promise((resolve, reject) => {
      https.get(`${SUPABASE_URL}/rest/v1/products?select=id,title,images,meta`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Range': `${rangeStart}-${rangeEnd}`,
        }
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });
    if (!Array.isArray(data) || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  return all;
}

const urlStatusCache = new Map();

async function isBadImageUrl(url) {
  if (urlStatusCache.has(url)) return urlStatusCache.get(url);

  if (!url.toLowerCase().endsWith('.png')) {
    urlStatusCache.set(url, false);
    return false;
  }

  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) {
      // If 404/deleted, treat as bad if it was in the bad list
      return false;
    }
    const etag = (res.headers.get('etag') || '').replace(/"/g, '');
    const size = parseInt(res.headers.get('content-length') || '0', 10);
    const isBad = BAD_HASHES.has(etag) || BAD_SIZES.has(size);
    urlStatusCache.set(url, isBad);
    return isBad;
  } catch (err) {
    return false;
  }
}

async function mapConcurrent(items, concurrency, fn) {
  const results = new Array(items.length);
  let idx = 0;
  const workers = new Array(concurrency).fill(0).map(async () => {
    while (idx < items.length) {
      const cur = idx++;
      results[cur] = await fn(items[cur], cur);
    }
  });
  await Promise.all(workers);
  return results;
}

async function updateProductInDb(id, cleanImages) {
  const body = JSON.stringify({ images: cleanImages });
  return new Promise((resolve, reject) => {
    const req = https.request(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(body),
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`HTTP ${res.statusCode}: ${d}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function deleteStorageObjects(storagePaths) {
  if (!storagePaths.length) return;
  const body = JSON.stringify({ prefixes: storagePaths });
  return new Promise((resolve, reject) => {
    const req = https.request(`${SUPABASE_URL}/storage/v1/object/product-images`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`Storage delete failed HTTP ${res.statusCode}: ${d}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('🚀 Starting Bricoc Logo & Icon Purge...');
  const products = await fetchAllProducts();
  console.log(`📦 Loaded ${products.length} products from database.`);

  // Collect all PNG URLs
  const allPngs = new Set();
  for (const p of products) {
    for (const img of (p.images || [])) {
      if (img.toLowerCase().endsWith('.png')) {
        allPngs.add(img);
      }
    }
  }
  console.log(`🔍 Inspecting ${allPngs.size} unique PNG URLs...`);

  let checkedPngs = 0;
  await mapConcurrent([...allPngs], 40, async (url) => {
    await isBadImageUrl(url);
    checkedPngs++;
    if (checkedPngs % 500 === 0 || checkedPngs === allPngs.size) {
      process.stdout.write(`   Checked ${checkedPngs}/${allPngs.size} PNGs...\n`);
    }
  });

  // Identify affected products & storage paths to delete
  const updates = [];
  const storagePathsToDelete = [];
  const storagePrefix = `${SUPABASE_URL}/storage/v1/object/public/product-images/`;

  for (const p of products) {
    const original = p.images || [];
    const cleaned = [];
    let modified = false;

    for (const img of original) {
      if (urlStatusCache.get(img) === true) {
        modified = true;
        if (img.startsWith(storagePrefix)) {
          storagePathsToDelete.push(img.slice(storagePrefix.length));
        }
      } else {
        cleaned.push(img);
      }
    }

    if (modified) {
      if (cleaned.length === 0) {
        console.warn(`⚠️ Warning: Product ${p.id} would have 0 images! Skipping DB update for safety.`);
      } else {
        updates.push({ id: p.id, title: p.title, images: cleaned, removed: original.length - cleaned.length });
      }
    }
  }

  console.log(`\n📋 Found ${updates.length} products to update in database.`);
  console.log(`🗑  Found ${storagePathsToDelete.length} bad image files to delete from Supabase storage.`);

  // 1. Update Database records
  console.log('\n💾 Updating product records in database (concurrency=25)...');
  let updatedCount = 0;
  await mapConcurrent(updates, 25, async (u) => {
    await updateProductInDb(u.id, u.images);
    updatedCount++;
    if (updatedCount % 50 === 0 || updatedCount === updates.length) {
      process.stdout.write(`   Updated ${updatedCount}/${updates.length} products in DB...\n`);
    }
  });
  console.log('✅ Database update complete!');

  // 2. Delete bad objects from storage in batches of 100
  console.log('\n🧹 Deleting bad logo/icon files from Supabase Storage...');
  const batchSize = 100;
  for (let i = 0; i < storagePathsToDelete.length; i += batchSize) {
    const batch = storagePathsToDelete.slice(i, i + batchSize);
    try {
      await deleteStorageObjects(batch);
    } catch (err) {
      console.warn(`   Warning on storage delete batch ${i}: ${err.message}`);
    }
    if ((i + batchSize) % 500 === 0 || i + batchSize >= storagePathsToDelete.length) {
      process.stdout.write(`   Deleted ${Math.min(i + batchSize, storagePathsToDelete.length)}/${storagePathsToDelete.length} files...\n`);
    }
  }
  console.log('✅ Storage purge complete!');

  console.log('\n════════════════════ PURGE COMPLETE ════════════════════');
  console.log(`Total products cleaned:   ${updates.length}`);
  console.log(`Total bad images removed: ${storagePathsToDelete.length}`);
}

run().catch(console.error);
