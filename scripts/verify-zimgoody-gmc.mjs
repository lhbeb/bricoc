import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const query = await db.from('products').select('slug,title,price,meta').contains('meta', { source: 'zimgoody' });
if (query.error) throw query.error;

const response = await fetch(`https://www.bricoc.com/api/feed/google?country=US&currency=USD&_=${Date.now()}`, {
  headers: { 'cache-control': 'no-cache' },
  signal: AbortSignal.timeout(30000),
});
const $ = cheerio.load(await response.text(), { xmlMode: true });
const items = $('item').map((_, element) => {
  const value = selector => $(element).find(selector).first().text().trim();
  return {
    id: value('g\\:id'), title: value('title'), description: value('description'),
    link: value('link'), image: value('g\\:image_link'), price: value('g\\:price'),
    availability: value('g\\:availability'), brand: value('g\\:brand'),
    country: value('g\\:shipping g\\:country'), shipPrice: value('g\\:shipping g\\:price'),
    minHandling: value('g\\:shipping g\\:min_handling_time'),
    maxHandling: value('g\\:shipping g\\:max_handling_time'),
    minTransit: value('g\\:shipping g\\:min_transit_time'),
    maxTransit: value('g\\:shipping g\\:max_transit_time'),
  };
}).get();
const ours = items.filter(item => item.link.includes('/products/zimgoody-'));
const expected = new Map(query.data.map(product => [`https://www.bricoc.com/products/${product.slug}`, product]));
const report = {
  feedStatus: response.status,
  databaseEnabled: query.data.filter(product => product.meta.gmc_enabled === true).length,
  totalFeedItems: items.length,
  ourItems: ours.length,
  uniqueIds: new Set(ours.map(item => item.id)).size,
  titlesMatch: ours.every(item => item.title === expected.get(item.link)?.title),
  pricesMatch: ours.every(item => item.price === `${Number(expected.get(item.link)?.price).toFixed(2)} USD`),
  descriptionsPresent: ours.every(item => item.description.length > 300),
  inStock: ours.every(item => item.availability === 'in_stock'),
  brandsPresent: ours.every(item => item.brand),
  shippingMatches: ours.every(item => item.country === 'US' && item.shipPrice === '0.00 USD' &&
    item.minHandling === '0' && item.maxHandling === '1' &&
    item.minTransit === '3' && item.maxTransit === '4'),
  allExpectedLinks: [...expected.keys()].every(link => ours.some(item => item.link === link)),
};
console.log(JSON.stringify(report, null, 2));

const pages = await Promise.all(ours.map(async item => ({
  link: item.link,
  status: (await fetch(item.link, {
    method: 'HEAD', headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(20000),
  })).status,
})));
console.log(`Landing pages: ${pages.filter(page => page.status === 200).length}/${pages.length} HTTP 200`);
const failures = pages.filter(page => page.status !== 200);
if (failures.length) console.log(JSON.stringify(failures, null, 2));

for (const item of [ours[0], ours[31], ours[39]]) {
  const image = await fetch(item.image, { method: 'HEAD', signal: AbortSignal.timeout(20000) });
  console.log(`Sample: ${item.title} | ${item.price} | image ${image.status} ${image.headers.get('content-type')}`);
}

if (Object.values(report).some(value => value === false) || report.databaseEnabled !== 40 ||
    report.ourItems !== 40 || report.uniqueIds !== 40 || failures.length) {
  process.exitCode = 1;
}
