const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://potkqvigvhwxapyyscgd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdGtxdmlndmh3eGFweXlzY2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg1OTI4NiwiZXhwIjoyMTAzNDM1Mjg2fQ.6AdrrDfJhjoFX4N9gyd0h95o98-rLXK-YRel3WKT_F0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeProducts() {
  console.log('Fetching products from Bricoc database...');
  let allProducts = [];
  let from = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .range(from, from + limit - 1);
      
    if (error) {
      console.error('Error fetching products:', error);
      break;
    }
    
    if (data.length === 0) break;
    
    allProducts.push(...data);
    from += limit;
  }
  
  console.log(`Fetched ${allProducts.length} products total.`);
  
  // Analyze duplicates by slug
  const slugMap = new Map();
  // Analyze duplicates by title
  const titleMap = new Map();
  
  allProducts.forEach(product => {
    // Slug
    if (!slugMap.has(product.slug)) {
      slugMap.set(product.slug, []);
    }
    slugMap.get(product.slug).push(product);
    
    // Title
    const title = (product.title || '').trim().toLowerCase();
    if (!titleMap.has(title)) {
      titleMap.set(title, []);
    }
    titleMap.get(title).push(product);
  });
  
  const duplicateSlugs = Array.from(slugMap.entries()).filter(([slug, products]) => products.length > 1);
  const duplicateTitles = Array.from(titleMap.entries()).filter(([title, products]) => products.length > 1);
  
  console.log(`\nFound ${duplicateSlugs.length} duplicate slugs.`);
  if (duplicateSlugs.length > 0) {
    duplicateSlugs.slice(0, 5).forEach(([slug, products]) => {
      console.log(`Slug: ${slug} (${products.length} duplicates)`);
      products.forEach(p => console.log(`  - ID: ${p.id}, Listed By: ${p.listed_by}, Created: ${p.created_at}`));
    });
    if (duplicateSlugs.length > 5) console.log(`...and ${duplicateSlugs.length - 5} more.`);
  }
  
  console.log(`\nFound ${duplicateTitles.length} duplicate titles.`);
  if (duplicateTitles.length > 0) {
    duplicateTitles.slice(0, 5).forEach(([title, products]) => {
      console.log(`Title: ${title} (${products.length} duplicates)`);
      products.forEach(p => console.log(`  - ID: ${p.id}, Slug: ${p.slug}`));
    });
    if (duplicateTitles.length > 5) console.log(`...and ${duplicateTitles.length - 5} more.`);
  }

  // Write a brief summary file
  fs.writeFileSync('bricoc_analysis.json', JSON.stringify({
    totalProducts: allProducts.length,
    duplicateSlugsCount: duplicateSlugs.length,
    duplicateTitlesCount: duplicateTitles.length,
    sampleDuplicateSlugs: duplicateSlugs.slice(0, 10).map(([s, p]) => ({ slug: s, count: p.length })),
    sampleDuplicateTitles: duplicateTitles.slice(0, 10).map(([t, p]) => ({ title: t, count: p.length }))
  }, null, 2));
}

analyzeProducts();
