const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://potkqvigvhwxapyyscgd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdGtxdmlndmh3eGFweXlzY2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg1OTI4NiwiZXhwIjoyMTAzNDM1Mjg2fQ.6AdrrDfJhjoFX4N9gyd0h95o98-rLXK-YRel3WKT_F0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function planDeletions() {
  console.log('Fetching products from Bricoc database for dry run...');
  let allProducts = [];
  let from = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, slug, created_at')
      .range(from, from + limit - 1);
      
    if (error) {
      console.error('Error fetching products:', error);
      break;
    }
    
    if (data.length === 0) break;
    
    allProducts.push(...data);
    from += limit;
  }
  
  const titleMap = new Map();
  allProducts.forEach(product => {
    const title = (product.title || '').trim().toLowerCase();
    if (!titleMap.has(title)) {
      titleMap.set(title, []);
    }
    titleMap.get(title).push(product);
  });
  
  const duplicateGroups = Array.from(titleMap.values()).filter(products => products.length > 1);
  
  const toDeleteIds = [];
  const gmcIdsToDelete = [];
  
  duplicateGroups.forEach(group => {
    // Sort by created_at (oldest first) and slug length (shortest first)
    // We want to keep the "original" clean slug.
    group.sort((a, b) => {
      // Prefer the one without random suffixes (shorter slug)
      if (a.slug.length !== b.slug.length) {
        return a.slug.length - b.slug.length;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });
    
    // Keep the first one, delete the rest
    const canonical = group[0];
    const duplicates = group.slice(1);
    
    duplicates.forEach(dup => {
      toDeleteIds.push(dup.id);
      
      // GMC ID is usually uppercase ID. Let's see if the ID contains "bricoc-"
      let gmcId = dup.id.toUpperCase();
      if (!gmcId.startsWith('BRICOC-')) {
          gmcId = 'BRICOC-' + gmcId;
      }
      gmcIdsToDelete.push(gmcId);
    });
  });
  
  fs.writeFileSync('bricoc_deletions.json', JSON.stringify({
    toDeleteIds,
    gmcIdsToDelete
  }, null, 2));
  
  console.log(`Found ${toDeleteIds.length} duplicate products to delete.`);
}

planDeletions();
