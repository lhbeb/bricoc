import { readdirSync, readFileSync } from 'fs';
import { join, extname } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const PRODUCTS_DIR = join(process.cwd(), 'public/products');
const BUCKET_NAME = 'product-images';

function getContentType(filename: string): string {
  const ext = extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

async function ensureBucket() {
  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
  if (error) {
    console.warn('Warning listing buckets:', error.message);
  }
  const exists = buckets?.some(b => b.name === BUCKET_NAME);
  if (!exists) {
    console.log(`Creating public bucket "${BUCKET_NAME}"...`);
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760 // 10MB
    });
    if (createError) {
      console.warn(`Could not create bucket (may already exist): ${createError.message}`);
    } else {
      console.log(`✅ Bucket "${BUCKET_NAME}" created!`);
    }
  } else {
    console.log(`✅ Bucket "${BUCKET_NAME}" exists!`);
    // Ensure bucket is public
    await supabaseAdmin.storage.updateBucket(BUCKET_NAME, { public: true });
  }
}

async function uploadAll() {
  console.log('🚀 Starting upload of all product images to Supabase Storage...\n');
  await ensureBucket();

  const productDirs = readdirSync(PRODUCTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`📦 Found ${productDirs.length} product directories in public/products/\n`);

  for (const productSlug of productDirs) {
    const productDir = join(PRODUCTS_DIR, productSlug);
    const files = readdirSync(productDir)
      .filter(file => ['.jpg', '.jpeg', '.png', '.webp'].includes(extname(file).toLowerCase()))
      .sort();

    console.log(`📸 Uploading ${productSlug} (${files.length} images)...`);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const filePath = join(productDir, file);
      const fileBuffer = readFileSync(filePath);
      const storagePath = `${productSlug}/${file}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: getContentType(file),
          upsert: true
        });

      if (uploadError) {
        console.error(`  ❌ Failed to upload ${file}:`, uploadError.message);
      } else {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);

        uploadedUrls.push(publicUrl);
        console.log(`  ✅ ${file} -> ${publicUrl}`);
      }
    }

    if (uploadedUrls.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ images: uploadedUrls })
        .eq('slug', productSlug);

      if (updateError) {
        console.error(`  ❌ Error updating DB for ${productSlug}:`, updateError.message);
      } else {
        console.log(`  🎉 Updated Supabase products table for "${productSlug}" with ${uploadedUrls.length} public storage URLs!\n`);
      }
    }
  }

  // Verify
  const { data: updatedProducts } = await supabaseAdmin.from('products').select('slug, images');
  console.log('🏁 Verification - Products in Supabase DB:');
  console.log(JSON.stringify(updatedProducts, null, 2));
}

uploadAll();
