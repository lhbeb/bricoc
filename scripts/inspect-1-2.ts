import { execSync } from 'child_process';

const urls = [
  'https://www.pgatoursuperstore.com/anyday-14-way-golf-stand-bag/2000000052710.html?dwvar_2000000052710_STK_COLOR=5&cgid=golf-bags&isSBStoreSelected=false&shopByStoreID=false',
  'https://www.pgatoursuperstore.com/ultralight-pro-2025-cart-bag/2000000047625.html?dwvar_2000000047625_STK_COLOR=5&cgid=golf-bags&isSBStoreSelected=false&shopByStoreID=false'
];

for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  console.log(`\n================== Product ${i + 1} ==================`);
  const cmd = `curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.9" "${url}"`;
  const html = execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString();
  console.log('HTML length:', html.length);
  
  // Look for any script tags with JSON or product data
  const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
  console.log('Script tag count:', scripts.length);
  
  // Check if there are amplience images
  const amplienceMatches = Array.from(new Set(html.match(/https:\/\/cdn\.media\.amplience\.net\/[^\s"']+/g) || []));
  console.log('Amplience images found:', amplienceMatches);

  // Check title
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  console.log('H1:', h1Match ? h1Match[1].trim() : 'No H1');

  // Check price
  const priceMatch = html.match(/class="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/span>/gi);
  console.log('Prices found:', priceMatch?.slice(0, 5));

  // Check meta description
  const metaDesc = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  console.log('Meta desc:', metaDesc ? metaDesc[1] : 'No meta desc');
}
