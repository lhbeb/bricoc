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

async function updateFlows() {
  for (const slug of slugs) {
    const { error } = await supabase
      .from('products')
      .update({ checkout_flow: 'buymeacoffee' })
      .eq('slug', slug);

    if (error) {
      console.error(`Error updating ${slug}:`, error.message);
    } else {
      console.log(`Updated ${slug} checkout_flow to buymeacoffee`);
    }
  }
  console.log('Finished updating checkout flows.');
}

updateFlows();
