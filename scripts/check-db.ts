import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Supabase URL:', supabaseUrl);
console.log('Has Service Key:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('products').select('id, slug, title, price').limit(5);
  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log(`Connected! Existing products in DB: ${data.length}`);
    console.log(data);
  }
}

check();
