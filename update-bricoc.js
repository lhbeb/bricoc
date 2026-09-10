const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCheckoutFlow() {
  console.log("Connecting to Bricoc Supabase...");
  
  // Try updating in batches or just do a bulk update without eq filter if Supabase allows it.
  // Using an explicit `.not('id', 'eq', 'invalid_id')` or similar can bypass some bulk update restrictions,
  // or we can just fetch all ids and update them.
  
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, slug, checkout_flow');
    
  if (fetchError) {
    console.error("Error fetching products:", fetchError);
    return;
  }
  
  console.log(`Found ${products.length} products in database.`);
  
  let updatedCount = 0;
  for (const product of products) {
    if (product.checkout_flow !== 'buymeacoffee') {
      const { error: updateError } = await supabase
        .from('products')
        .update({ checkout_flow: 'buymeacoffee' })
        .eq('id', product.id);
        
      if (updateError) {
        console.error(`Error updating product ${product.id}:`, updateError);
      } else {
        updatedCount++;
        if (updatedCount % 50 === 0) console.log(`Updated ${updatedCount} products...`);
      }
    }
  }
  
  console.log(`\nDone! Successfully updated ${updatedCount} products to use 'buymeacoffee' checkout flow.`);
  console.log(`${products.length - updatedCount} products were already set or skipped.`);
}

updateCheckoutFlow();
