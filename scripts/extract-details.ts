import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const urls = [
  'https://www.pgatoursuperstore.com/anyday-14-way-golf-stand-bag/2000000052710.html?dwvar_2000000052710_STK_COLOR=5&cgid=golf-bags&isSBStoreSelected=false&shopByStoreID=false',
  'https://www.pgatoursuperstore.com/ultralight-pro-2025-cart-bag/2000000047625.html?dwvar_2000000047625_STK_COLOR=5&cgid=golf-bags&isSBStoreSelected=false&shopByStoreID=false',
  'https://www.pgatoursuperstore.com/ghost-leather-golf-glove/2000000053263.html?dwvar_2000000053263_STK_COLOR=39',
  'https://www.pgatoursuperstore.com/extreme-lite-golf-cart-bag/2000000050188.html?dwvar_2000000050188_STK_COLOR=5'
];

function fetchHtml(url: string): string {
  const cmd = `curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.9" "${url}"`;
  return execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString();
}

for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  console.log(`\n================== Product ${i + 1} ==================`);
  console.log('URL:', url);
  const html = fetchHtml(url);
  
  // Extract JSON-LD
  const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'Product' || data.name || data.offers) {
        console.log('JSON-LD Product Data:');
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (e) {}
  }

  // Extract meta tags
  const ogTitle = html.match(/<meta property="og:title" content="(.*?)"/i)?.[1];
  const ogDesc = html.match(/<meta property="og:description" content="(.*?)"/i)?.[1];
  const ogImage = html.match(/<meta property="og:image" content="(.*?)"/i)?.[1];
  const ogPrice = html.match(/<meta property="product:price:amount" content="(.*?)"/i)?.[1];

  console.log('OG Title:', ogTitle);
  console.log('OG Desc:', ogDesc);
  console.log('OG Image:', ogImage);
  console.log('OG Price:', ogPrice);

  // Extract all high-res image URLs in demandware / pgatour images
  const imageUrls = new Set<string>();
  if (ogImage) imageUrls.add(ogImage);
  
  const imgMatches = html.matchAll(/https:\/\/www\.pgatoursuperstore\.com\/dw\/image\/v2\/BCFG_PRD\/on\/demandware\.static\/[^\s"']+/g);
  for (const m of imgMatches) {
    let cleanUrl = m[0].split('?')[0]; // clean base
    imageUrls.add(cleanUrl);
  }

  // Also match srcset or data-src
  const srcMatches = html.matchAll(/data-(?:zoom-|src|hires)="([^"]+)"/g);
  for (const m of srcMatches) {
    if (m[1].includes('http')) imageUrls.add(m[1]);
  }

  console.log('Extracted Images count:', imageUrls.size);
  console.log('Sample images:', Array.from(imageUrls).slice(0, 5));
}
