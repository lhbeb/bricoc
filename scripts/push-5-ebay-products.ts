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

const products = [
  {
    id: '168525606795',
    sku: '168525606795',
    slug: 'mens-pro-grip-cabretta-leather-golf-gloves-with-ball-marker',
    title: "Men's Pro Grip Cabretta Leather Golf Gloves with Magnetic Ball Marker",
    brand: 'Bricoc Golf',
    price: 24.99,
    originalPrice: 34.00,
    category: 'Golf Accessories',
    collections: ['accessories', 'featured', 'gloves'],
    description: `Crafted from 100% premium AAA Cabretta leather, the Men's Pro Grip Golf Glove provides an unparalleled soft touch, flexible fit, and superior tackiness for maximum club control in all weather conditions.

Features & Benefits:
• Ultra-Soft Cabretta Leather: Tour-proven softness and breathability with perforations for enhanced airflow.
• Integrated Magnetic Ball Marker: Conveniently positioned on the wrist tab for fast, seamless access on the green.
• Moisture-Wicking Elastic Wristband: Keeps hands dry and cool while maintaining an anatomical, second-skin fit.
• Reinforced Palm Patch: Extended durability and resistance against wear during repeated swings.`,
    images: [
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/mens-pro-grip-cabretta-leather-golf-gloves-with-ball-marker/img1.jpg',
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/mens-pro-grip-cabretta-leather-golf-gloves-with-ball-marker/img2.jpg',
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/mens-pro-grip-cabretta-leather-golf-gloves-with-ball-marker/img3.jpg'
    ],
    reviews: [
      {
        id: 'rev-ebay-101',
        author: 'Travis Watson',
        rating: 5,
        date: '2026-08-20',
        title: 'Buttery soft leather and the ball marker is super handy',
        content: 'Fit is true to size and the leather feels incredible. The magnetic marker on the wrist is strong and saves me digging through my pockets on every green.',
        verified: true
      },
      {
        id: 'rev-ebay-102',
        author: 'Dean Campbell',
        rating: 5,
        date: '2026-08-04',
        title: 'Excellent grip even in the heat',
        content: 'Played 36 holes this weekend in 90 degree weather and this glove stayed supple without getting slippery. Great craftsmanship.',
        verified: true
      }
    ]
  },
  {
    id: '304575903094',
    sku: '304575903094',
    slug: 'golf-accessory-pouch-bag-tee-holder-valuables-pocket',
    title: 'Golf Accessory Pouch Bag with Tee Holder & Valuables Pocket (Hook to Bag)',
    brand: 'Bricoc Golf',
    price: 18.99,
    originalPrice: 26.00,
    category: 'Golf Accessories',
    collections: ['accessories', 'featured', 'bags'],
    description: `Keep your essential golfing accessories neatly organized with this heavy-duty clip-on Golf Valuables Pouch. Featuring dedicated tee slots, dual zippered compartments, and an anodized aluminum swivel carabiner hook.

Features & Benefits:
• Multi-Compartment Organization: Dual zippered pockets separate golf balls, divot tools, markers, and valuables (phone, keys, wallet).
• Exterior Elastic Tee Slots: Hold up to 6 golf tees for rapid access right at your fingertips.
• Sturdy Metal Carabiner Clip: Effortlessly hooks onto any golf bag ring, golf cart handlebar, or belt loop.
• Weather-Resistant High-Density Nylon: Guards your items against unexpected rain showers and turf moisture.`,
    images: [
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/golf-accessory-pouch-bag-tee-holder-valuables-pocket/img1.jpg',
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/golf-accessory-pouch-bag-tee-holder-valuables-pocket/img2.jpg'
    ],
    reviews: [
      {
        id: 'rev-ebay-201',
        author: 'Scott Peterson',
        rating: 5,
        date: '2026-08-16',
        title: 'No more digging through my bag for tees and markers',
        content: 'Clips right to my bag towel loop. Fits 3 balls, a handful of tees, ball markers, and my car key easily. High quality zippers too.',
        verified: true
      },
      {
        id: 'rev-ebay-202',
        author: 'Larry Hughes',
        rating: 5,
        date: '2026-07-27',
        title: 'Compact and very durable',
        content: 'Tough nylon fabric and the clip is solid. Best $19 I have spent on my golf setup this season.',
        verified: true
      }
    ]
  },
  {
    id: '306980993009',
    sku: '306980993009',
    slug: 'neoprene-golf-ball-carry-bag-tee-holder-pouch',
    title: 'Neoprene Golf Ball Carry Bag & Tee Holder Pouch with Swivel Clip',
    brand: 'Bricoc Golf',
    price: 14.99,
    originalPrice: 22.00,
    category: 'Golf Accessories',
    collections: ['accessories', 'featured'],
    description: `The ultra-light Neoprene Golf Ball Carry Bag is designed for quick grabbing and lightweight convenience. Easily holds 2 to 3 regulation golf balls plus side tee slots, with a 360-degree swivel clip for attaching to your cart or belt.

Features & Benefits:
• Premium Stretch Neoprene: Water-resistant, washable, and flexible to securely hug golf balls without rattling.
• Quick-Access Bottom Push-Through: Simply push up from the bottom to pop a ball out in seconds.
• 4 Integrated Tee Slots: Keeps your favorite tees ready for the tee box.
• Heavy-Duty Swivel Snap Hook: Rotates 360 degrees to prevent tangling when attached to a golf bag or cart.`,
    images: [
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/neoprene-golf-ball-carry-bag-tee-holder-pouch/img1.jpg',
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/neoprene-golf-ball-carry-bag-tee-holder-pouch/img2.jpg'
    ],
    reviews: [
      {
        id: 'rev-ebay-301',
        author: 'Brandon Ellis',
        rating: 5,
        date: '2026-08-22',
        title: 'Super handy when walking or on the cart',
        content: 'Soft neoprene, clips right to my belt loop when walking. Easy to pop a ball out when you lose one.',
        verified: true
      },
      {
        id: 'rev-ebay-302',
        author: 'Kyle Roberts',
        rating: 5,
        date: '2026-08-01',
        title: 'Simple and effective',
        content: 'Holds 3 balls firmly and 4 tees. Well constructed and looks great in matte black.',
        verified: true
      }
    ]
  },
  {
    id: '800413664167',
    sku: '800413664167',
    slug: 'multi-functional-golf-rangefinder-case-storage-pouch',
    title: 'Multi-Functional Golf Rangefinder Case & Shockproof Valuables Storage Pouch',
    brand: 'Bricoc Golf',
    price: 29.99,
    originalPrice: 38.00,
    category: 'Golf Accessories',
    collections: ['accessories', 'featured', 'bags'],
    description: `Protect your laser rangefinder and delicate electronics with this hard-shell shockproof Golf Rangefinder Case. Equipped with a quick-release magnetic closure and heavy-duty zipper for all-weather protection.

Features & Benefits:
• Shockproof EVA Hard-Shell: Absorbs impacts, drops, and bumps in the cart basket or golf bag.
• Dual Closure System: Quick-close magnetic elastic band for rapid between-shot access, plus full zipper for storage during transit.
• Plush Velvet Anti-Scratch Lining: Cushions optics and LCD screens against scratching.
• Universal Compatibility: Fits Bushnell, Callaway, Garmin, Blue Tees, and all standard golf laser rangefinders.`,
    images: [
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/multi-functional-golf-rangefinder-case-storage-pouch/img1.jpg',
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/multi-functional-golf-rangefinder-case-storage-pouch/img2.jpg'
    ],
    reviews: [
      {
        id: 'rev-ebay-401',
        author: 'Nathaniel Reed',
        rating: 5,
        date: '2026-08-11',
        title: 'Fits my Bushnell perfectly and magnetic closure is genius',
        content: 'The elastic magnetic strap lets me grab my rangefinder without zipping and unzipping every single shot. Excellent build quality.',
        verified: true
      },
      {
        id: 'rev-ebay-402',
        author: 'Chris Palmer',
        rating: 5,
        date: '2026-07-30',
        title: 'Great protective case for the price',
        content: 'Hard shell gives me complete peace of mind that my $350 rangefinder is protected when driving over bumpy cart paths.',
        verified: true
      }
    ]
  },
  {
    id: '256857394473',
    sku: '256857394473',
    slug: 'ultra-lightweight-compact-golf-club-carrier-holds-6-clubs',
    title: 'Ultra-Lightweight Compact Golf Club Carrier (Holds up to 6 Clubs)',
    brand: 'Bricoc Golf',
    price: 34.99,
    originalPrice: 45.00,
    category: 'Golf Accessories',
    collections: ['accessories', 'featured', 'cart-bags'],
    description: `The ideal solution for executive courses, driving range sessions, or cart-path-only days. This lightweight compact carrier holds up to 6 clubs securely with ergonomic rubber grip clips and a padded shoulder strap.

Features & Benefits:
• 6-Club Capacity: Securely locks irons, wedges, putters, or hybrids with rubberized friction channels that prevent clattering.
• Built-In Tee & Ball Holder: Includes slots for 3 balls and 4 tees directly on the handle.
• Retractable Ground Stand: Keeps grips elevated and completely dry off damp morning grass.
• Ultra-Portable Design: Fits effortlessly inside your trunk or golf cart storage basket at under 1 lb.`,
    images: [
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/ultra-lightweight-compact-golf-club-carrier-holds-6-clubs/img1.jpg',
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/ultra-lightweight-compact-golf-club-carrier-holds-6-clubs/img2.jpg',
      'https://potkqvigvhwxapyyscgd.supabase.co/storage/v1/object/public/product-images/ultra-lightweight-compact-golf-club-carrier-holds-6-clubs/img3.jpg'
    ],
    reviews: [
      {
        id: 'rev-ebay-501',
        author: 'Raymond Clark',
        rating: 5,
        date: '2026-08-19',
        title: 'Perfect for par-3 courses and driving range practice',
        content: 'I take this to the range and twilight par-3 rounds. Super lightweight, keeps grips dry off wet turf, and holds 6 clubs snugly.',
        verified: true
      },
      {
        id: 'rev-ebay-502',
        author: 'Anthony Morales',
        rating: 5,
        date: '2026-08-07',
        title: 'Awesome on cart-path-only days',
        content: 'When it is cart-path-only, I just grab 3-4 clubs in this carrier and walk over to my ball without carrying individual clubs in my hands. Highly recommended!',
        verified: true
      }
    ]
  }
];

async function run() {
  console.log('Cleaning up any placeholder items...');
  for (const item of products) {
    await supabase.from('products').delete().eq('id', item.id);
  }

  for (const item of products) {
    console.log(`Inserting: ${item.title} (${item.slug})`);
    const productRecord = {
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.description,
      price: item.price,
      original_price: item.originalPrice,
      rating: 4.9,
      review_count: 28 + Math.floor(Math.random() * 25),
      images: item.images,
      condition: 'New',
      category: item.category,
      brand: item.brand,
      payee_email: 'contact@bricoc.com',
      currency: 'USD',
      checkout_link: `https://bricoc.com/checkout`,
      checkout_flow: 'stripe',
      reviews: item.reviews,
      meta: {
        sku: item.sku,
        brand: item.brand,
        color: 'Black / Premium Edition',
        keywords: `${item.title}, golf gear, Bricoc accessories`,
        published: true,
        source: 'eBay',
        targetMarket: 'US',
        _sellerName: 'Bricoc Official',
        _sellerUsername: 'bricoc'
      },
      in_stock: true,
      is_featured: true,
      collections: item.collections,
      published: true,
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('products')
      .upsert(productRecord, { onConflict: 'slug' });

    if (insertError) {
      console.error(`❌ DB Insert Error for ${item.slug}:`, insertError.message);
    } else {
      console.log(`🎉 Successfully saved ${item.slug} to DB!`);
    }
  }

  console.log('\n🏁 Complete products list in DB:');
  const { data: allProds } = await supabase.from('products').select('slug, title, price, images');
  console.log(JSON.stringify(allProds, null, 2));
}

run();
