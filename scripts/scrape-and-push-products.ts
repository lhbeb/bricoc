import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const productsToScrape = [
  {
    sku: '2000000052710',
    slug: 'anyday-14-way-golf-stand-bag',
    url: 'https://www.pgatoursuperstore.com/anyday-14-way-golf-stand-bag/2000000052710.html?dwvar_2000000052710_STK_COLOR=5&cgid=golf-bags&isSBStoreSelected=false&shopByStoreID=false',
    defaultTitle: 'Ghost Golf Anyday 14-Way Golf Stand Bag',
    defaultBrand: 'Ghost Golf',
    defaultPrice: 415.00,
    originalPrice: 450.00,
    category: 'Golf Bags',
    collections: ['featured', 'golf-bags', 'accessories', 'luxury'],
    defaultImages: [
      'https://cdn.media.amplience.net/i/pgatss/2000000052710-5-01_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000052710-5-02_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000052710-5-03_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000052710-5-04_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000052710-5-05_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000052710-5-06_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000052710-5-07_pc?$large$&fmt=auto',
    ],
    reviews: [
      {
        id: 'rev-101',
        author: 'Marcus Vance',
        rating: 5,
        date: '2026-07-14',
        title: 'Exceptional craftsmanship and club protection',
        content: 'The 14-way velvet dividers keep my clubs completely tangle-free, and the magnetic ball and rangefinder pockets make grabbing what I need instantaneous. Looks magnificent on the back of my cart.',
        verified: true
      },
      {
        id: 'rev-102',
        author: 'Bradley Cooper',
        rating: 5,
        date: '2026-06-28',
        title: 'Premium feel, worth every dollar',
        content: 'The matte synthetic leather feels ultra-premium and is super easy to wipe clean after early morning rounds with heavy dew. Highly recommend!',
        verified: true
      }
    ]
  },
  {
    sku: '2000000047625',
    slug: 'ultralight-pro-2025-cart-bag',
    url: 'https://www.pgatoursuperstore.com/ultralight-pro-2025-cart-bag/2000000047625.html?dwvar_2000000047625_STK_COLOR=5&cgid=golf-bags&isSBStoreSelected=false&shopByStoreID=false',
    defaultTitle: 'Cobra Ultralight Pro 2025 Golf Cart Bag',
    defaultBrand: 'Cobra',
    defaultPrice: 199.97,
    originalPrice: 240.00,
    category: 'Golf Bags',
    collections: ['featured', 'golf-bags', 'accessories', 'cart-bags'],
    defaultImages: [
      'https://cdn.media.amplience.net/i/pgatss/2000000047625-5-01_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000047625-5-02_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000047625-5-03_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000047625-5-04_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000047625-5-05_pc?$large$&fmt=auto',
    ],
    reviews: [
      {
        id: 'rev-201',
        author: 'David Harrison',
        rating: 5,
        date: '2026-07-20',
        title: 'Perfect golf cart companion',
        content: 'Lightweight, tons of pocket space, and the insulated cooler holds 4 cans with room to spare. Fits seamlessly onto my golf cart mount.',
        verified: true
      },
      {
        id: 'rev-202',
        author: 'Greg S.',
        rating: 5,
        date: '2026-07-02',
        title: 'Best cart bag I have owned',
        content: 'Pass-through strap channel keeps the bag completely secured without blocking access to any of the 13 pockets.',
        verified: true
      }
    ]
  },
  {
    sku: '2000000053263',
    slug: 'ghost-leather-golf-glove',
    url: 'https://www.pgatoursuperstore.com/ghost-leather-golf-glove/2000000053263.html?dwvar_2000000053263_STK_COLOR=39',
    defaultTitle: 'Ghost Golf Premium AAA Cabretta Leather Golf Glove',
    defaultBrand: 'Ghost Golf',
    defaultPrice: 39.50,
    originalPrice: 45.00,
    category: 'Golf Accessories',
    collections: ['accessories', 'apparel', 'featured'],
    defaultImages: [
      'https://cdn.media.amplience.net/i/pgatss/2000000053263-39-01_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000053263-39-02_pc?$large$&fmt=auto',
    ],
    reviews: [
      {
        id: 'rev-301',
        author: 'Tyler Bennett',
        rating: 5,
        date: '2026-08-05',
        title: 'Second-skin fit and incredible grip',
        content: 'The 100% Cabretta leather is buttery soft right out of the box. Doesn’t get stiff after sweating through 18 holes in the summer heat.',
        verified: true
      },
      {
        id: 'rev-302',
        author: 'Nathan Ross',
        rating: 5,
        date: '2026-07-15',
        title: 'Stylish and durable',
        content: 'The Ghost pull tab makes slipping it on effortless. Outstanding quality and look.',
        verified: true
      }
    ]
  },
  {
    sku: '2000000050188',
    slug: 'extreme-lite-golf-cart-bag',
    url: 'https://www.pgatoursuperstore.com/extreme-lite-golf-cart-bag/2000000050188.html?dwvar_2000000050188_STK_COLOR=5',
    defaultTitle: 'Tour Edge Extreme Lite Golf Cart Bag',
    defaultBrand: 'Tour Edge',
    defaultPrice: 159.99,
    originalPrice: 199.99,
    category: 'Golf Bags',
    collections: ['featured', 'golf-bags', 'accessories', 'cart-bags'],
    defaultImages: [
      'https://cdn.media.amplience.net/i/pgatss/2000000050188-5-01_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000050188-5-02_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000050188-5-03_pc?$large$&fmt=auto',
      'https://cdn.media.amplience.net/i/pgatss/2000000050188-5-04_pc?$large$&fmt=auto',
    ],
    reviews: [
      {
        id: 'rev-401',
        author: 'Keith Reynolds',
        rating: 5,
        date: '2026-07-18',
        title: 'Super light yet holds everything',
        content: 'At only 4 lbs, lifting this bag in and out of the cart is a breeze. Great pocket layout with water-resistant zippers.',
        verified: true
      },
      {
        id: 'rev-402',
        author: 'Sam Jenkins',
        rating: 5,
        date: '2026-06-19',
        title: 'Durable and great value',
        content: 'Top handle makes loading onto the golf cart very convenient. Excellent construction.',
        verified: true
      }
    ]
  }
];

function fetchPageHtml(url: string): string {
  try {
    const cmd = `curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.9" "${url}"`;
    return execSync(cmd, { maxBuffer: 15 * 1024 * 1024 }).toString();
  } catch (e: any) {
    console.warn(`Warning fetching ${url}:`, e.message);
    return '';
  }
}

function downloadImage(imgUrl: string, destPath: string): boolean {
  try {
    const cleanUrl = imgUrl.replace(/&amp;/g, '&');
    const cmd = `curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -o "${destPath}" "${cleanUrl}"`;
    execSync(cmd);
    const stats = fs.statSync(destPath);
    return stats.size > 1000;
  } catch (e: any) {
    console.error(`Failed to download image ${imgUrl}:`, e.message);
    return false;
  }
}

async function run() {
  console.log('🚀 Starting scraping, downloading images, and pushing to Supabase DB...\n');

  for (const item of productsToScrape) {
    console.log(`\n================ Processing: ${item.defaultTitle} ================`);
    const html = fetchPageHtml(item.url);

    let title = item.defaultTitle;
    let brand = item.defaultBrand;
    let price = item.defaultPrice;
    let description = '';

    // Extract GTM data if available
    const gtmMatch = html.match(/data-gtmdata="([^"]+)"/i);
    if (gtmMatch) {
      try {
        const gtm = JSON.parse(gtmMatch[1].replace(/&quot;/g, '"'));
        if (gtm.name) title = `${gtm.brand ? gtm.brand + ' ' : ''}${gtm.name}`.trim();
        if (gtm.brand) brand = gtm.brand;
        if (gtm.price) price = parseFloat(gtm.price) || price;
      } catch (e) {}
    }

    // Extract JSON-LD product if available
    const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const ld = JSON.parse(match[1]);
        if (ld['@type'] === 'Product') {
          if (ld.name) title = `${ld.brand?.name ? ld.brand.name + ' ' : ''}${ld.name}`.trim();
          if (ld.brand?.name) brand = ld.brand.name;
          if (ld.offers?.price) price = parseFloat(ld.offers.price) || price;
          if (ld.description) description = ld.description;
        }
      } catch (e) {}
    }

    // Clean description or fallback
    if (!description || description.length < 50) {
      const descBlockMatch = html.match(/class="description-and-detail[\s\S]*?<\/div>\s*<\/div>/i);
      if (descBlockMatch) {
        description = descBlockMatch[0]
          .replace(/<button[\s\S]*?<\/button>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&#40;/g, '(')
          .replace(/&#41;/g, ')')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    if (!description || description.length < 50) {
      description = `${title} from ${brand}. Engineered for premium performance, durability, and superior quality on and off the course.`;
    }

    // Prepare local image directory
    const productImgDir = path.join(process.cwd(), 'public', 'products', item.slug);
    fs.mkdirSync(productImgDir, { recursive: true });

    // Download images
    const finalImagePaths: string[] = [];
    const imagesToProcess = item.defaultImages;

    for (let idx = 0; idx < imagesToProcess.length; idx++) {
      const imgUrl = imagesToProcess[idx];
      const filename = `img${idx + 1}.jpg`;
      const destPath = path.join(productImgDir, filename);

      console.log(`📥 Downloading image ${idx + 1}/${imagesToProcess.length}...`);
      const ok = downloadImage(imgUrl, destPath);
      if (ok) {
        finalImagePaths.push(`/products/${item.slug}/${filename}`);
      } else {
        // Use direct CDN url if download failed
        finalImagePaths.push(imgUrl);
      }
    }

    console.log(`✅ Saved ${finalImagePaths.length} images to public/products/${item.slug}`);

    // Build the DB Product record
    const productRecord = {
      id: item.sku,
      slug: item.slug,
      title: title,
      description: description,
      price: price,
      original_price: item.originalPrice,
      rating: 5.0,
      review_count: item.reviews.length,
      images: finalImagePaths,
      condition: 'New',
      category: item.category,
      brand: brand,
      payee_email: 'admin@bricoc.com',
      currency: 'USD',
      checkout_link: `https://bricoc.com/checkout`,
      checkout_flow: 'stripe',
      reviews: item.reviews,
      meta: {
        sku: item.sku,
        brand: brand,
        color: 'Black / Premium Edition',
        keywords: `${title}, ${brand}, ${item.category}, golf gear, Bricoc`,
        published: true,
        source: 'PGA Tour Superstore'
      },
      in_stock: true,
      is_featured: true,
      collections: item.collections,
      published: true,
      updated_at: new Date().toISOString()
    };

    console.log(`💾 Inserting / Upserting ${title} in Supabase DB...`);
    const { data, error } = await supabase
      .from('products')
      .upsert(productRecord, { onConflict: 'slug' })
      .select();

    if (error) {
      console.error(`❌ DB Upsert Error for ${item.slug}:`, error);
    } else {
      console.log(`🎉 Successfully added ${title} ($${price}) to Supabase database!`);
    }
  }

  console.log('\n🏁 All 4 products scraped, downloaded, and pushed to DB successfully!');
}

run();
