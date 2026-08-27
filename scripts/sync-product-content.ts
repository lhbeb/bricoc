import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const contentPath = path.resolve(process.cwd(), 'scratch', 'product-content.json');
const command = process.argv[2];
const shouldApply = process.argv.includes('--apply');
const shouldForce = process.argv.includes('--force');

interface EditableProductContent {
  slug: string;
  title: string;
  description: string;
  sourceUpdatedAt: string | null;
}

interface ProductContentExport {
  exportedAt: string;
  products: EditableProductContent[];
}

function validateExport(value: unknown): ProductContentExport {
  if (!value || typeof value !== 'object' || !Array.isArray((value as ProductContentExport).products)) {
    throw new Error('Invalid product-content.json: expected a products array.');
  }

  const exportData = value as ProductContentExport;
  const seenSlugs = new Set<string>();

  for (const [index, product] of exportData.products.entries()) {
    if (!product || typeof product !== 'object') {
      throw new Error(`Invalid product at index ${index}.`);
    }

    product.slug = String(product.slug || '').trim();
    product.title = String(product.title || '').trim();
    product.description = String(product.description || '').trim();

    if (!product.slug || !product.title || !product.description) {
      throw new Error(`Product at index ${index} must have a non-empty slug, title, and description.`);
    }
    if (seenSlugs.has(product.slug)) {
      throw new Error(`Duplicate slug in product-content.json: ${product.slug}`);
    }
    seenSlugs.add(product.slug);
  }

  return exportData;
}

async function pullContent() {
  const { data, error } = await supabase
    .from('products')
    .select('slug,title,description,updated_at')
    .order('slug', { ascending: true });

  if (error) throw error;

  const exportData: ProductContentExport = {
    exportedAt: new Date().toISOString(),
    products: (data || []).map((product) => ({
      slug: product.slug,
      title: product.title,
      description: product.description,
      sourceUpdatedAt: product.updated_at || null,
    })),
  };

  await mkdir(path.dirname(contentPath), { recursive: true });
  await writeFile(contentPath, `${JSON.stringify(exportData, null, 2)}\n`, 'utf8');
  console.log(`Pulled ${exportData.products.length} products to ${contentPath}`);
}

async function pushContent() {
  const rawContent = await readFile(contentPath, 'utf8');
  const exportData = validateExport(JSON.parse(rawContent));
  const slugs = exportData.products.map((product) => product.slug);

  const { data, error } = await supabase
    .from('products')
    .select('slug,title,description,updated_at')
    .in('slug', slugs);

  if (error) throw error;

  const databaseProducts = new Map((data || []).map((product) => [product.slug, product]));
  const missing = slugs.filter((slug) => !databaseProducts.has(slug));
  if (missing.length > 0) {
    throw new Error(`Products no longer found in the database: ${missing.join(', ')}`);
  }

  const changes = exportData.products.filter((product) => {
    const current = databaseProducts.get(product.slug)!;
    return product.title !== current.title || product.description !== current.description;
  });

  const conflicts = changes.filter((product) => {
    const current = databaseProducts.get(product.slug)!;
    return product.sourceUpdatedAt && current.updated_at !== product.sourceUpdatedAt;
  });

  if (conflicts.length > 0 && !shouldForce) {
    throw new Error(
      `Database changes detected for: ${conflicts.map((product) => product.slug).join(', ')}. ` +
      'Pull again and reapply your edits, or use --force only after reviewing the conflict.',
    );
  }

  console.log(`${exportData.products.length} products checked; ${changes.length} content changes found.`);
  for (const product of changes) {
    console.log(`- ${product.slug}: ${product.title}`);
  }

  if (!shouldApply) {
    console.log('Dry run only. Re-run with --apply to update Supabase.');
    return;
  }

  for (const product of changes) {
    const { error: updateError } = await supabase
      .from('products')
      .update({
        title: product.title,
        description: product.description,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', product.slug);

    if (updateError) {
      throw new Error(`Failed to update ${product.slug}: ${updateError.message}`);
    }
  }

  console.log(`Updated ${changes.length} products in Supabase.`);
}

async function main() {
  if (command === 'pull') {
    await pullContent();
    return;
  }
  if (command === 'push') {
    await pushContent();
    return;
  }

  throw new Error('Usage: tsx scripts/sync-product-content.ts <pull|push> [--apply] [--force]');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
