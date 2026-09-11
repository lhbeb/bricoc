import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const slugs = [
  'lifetimetamarackprositontopksjjf6k',
  'cubcadetultimazt150zeroturnrz7hytf',
  'amyetg60peakelectricbikesbslbps',
  'allterrainmountainebike1400wbyo7q1',
  'honeywellhomerth9585wf1004wiqdfzrz',
  'gskyhairclippersformenprofesce6xjz',
  'mototecmudmonsterxl212cc2sea8o95ej',
  'weberspirite325gasgrillskf6b0m',
  'aurorafusionlifetimemanta10f13b9zy',
  'suzuki15hpoutboardmotordf15al1l6e2',
  'brevillebaristaexpressespresakm1pz',
  'xpro125ccatvwithreverseelecti3vgxp',
  'kittycityoutdoorcatiofurnitux44zeo',
  'bestwayapx36518x52roundabovexpdgxc',
  'pioneerdjddjrev7djcontrollere1fvp4'
];

async function generateLinks() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });

  for (const slug of slugs) {
    try {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('id, price')
        .eq('slug', slug)
        .single();
      
      if (fetchError || !product) {
        console.error(`Could not fetch product ${slug}: ${fetchError?.message}`);
        continue;
      }

      console.log(`Processing ${slug}, price: ${product.price}`);

      // Create a fresh context to ensure cookies are clean
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('https://buymeacoffee.com/davidbuckwalter/e/490033', { waitUntil: 'domcontentloaded' });

      // Wait a bit for the page to fully render
      await page.waitForTimeout(2000);

      // Locate the price input. The screenshot shows placeholder "19+"
      const priceInput = page.getByPlaceholder('19+').first();
      // Wait for it to be visible
      await priceInput.waitFor({ state: 'visible', timeout: 10000 });
      
      // Clear and fill the exact price
      await priceInput.fill(product.price.toString());
      
      // Click Add to cart
      await page.getByRole('button', { name: 'Add to cart' }).click();

      // Wait for the URL to change to the checkout URL
      await page.waitForURL('**/extras/checkout/**', { timeout: 15000 });
      
      const checkoutUrl = page.url();
      console.log(`Generated link for ${slug}: ${checkoutUrl}`);

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('products')
        .update({ checkout_link: checkoutUrl })
        .eq('slug', slug);

      if (updateError) {
        console.error(`Failed to update DB for ${slug}:`, updateError);
      } else {
        console.log(`Successfully updated ${slug} in DB.`);
      }

      await context.close();
    } catch (e) {
      console.error(`Error processing ${slug}:`, e.message);
    }
  }

  await browser.close();
  console.log('Finished generating links.');
}

generateLinks();
