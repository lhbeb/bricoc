const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://potkqvigvhwxapyyscgd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdGtxdmlndmh3eGFweXlzY2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzg1OTI4NiwiZXhwIjoyMTAzNDM1Mjg2fQ.6AdrrDfJhjoFX4N9gyd0h95o98-rLXK-YRel3WKT_F0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeDeletions() {
  const data = JSON.parse(fs.readFileSync('bricoc_deletions.json', 'utf-8'));
  const ids = data.toDeleteIds;
  
  console.log(`Starting deletion of ${ids.length} products...`);
  
  for (const id of ids) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Failed to delete product ${id}:`, error.message);
    } else {
      console.log(`Deleted product: ${id}`);
    }
  }
  
  console.log('Deletion complete.');
}

executeDeletions();
