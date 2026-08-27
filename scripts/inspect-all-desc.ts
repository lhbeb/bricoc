import { execSync } from 'child_process';

const urls = [
  'https://www.pgatoursuperstore.com/anyday-14-way-golf-stand-bag/2000000052710.html?dwvar_2000000052710_STK_COLOR=5&cgid=golf-bags&isSBStoreSelected=false&shopByStoreID=false',
  'https://www.pgatoursuperstore.com/ultralight-pro-2025-cart-bag/2000000047625.html?dwvar_2000000047625_STK_COLOR=5&cgid=golf-bags&isSBStoreSelected=false&shopByStoreID=false',
  'https://www.pgatoursuperstore.com/ghost-leather-golf-glove/2000000053263.html?dwvar_2000000053263_STK_COLOR=39',
  'https://www.pgatoursuperstore.com/extreme-lite-golf-cart-bag/2000000050188.html?dwvar_2000000050188_STK_COLOR=5'
];

for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  console.log(`\n================== Product ${i + 1} ==================`);
  const cmd = `curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.9" "${url}"`;
  const html = execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString();

  // Search for Description tab or content
  const descSection = html.match(/id="description"[\s\S]*?<\/div>\s*<\/div>/i) ||
                      html.match(/class="description-and-detail[\s\S]*?<\/div>\s*<\/div>/i) ||
                      html.match(/class="details-content[\s\S]*?<\/div>/i) ||
                      html.match(/class="product-description[\s\S]*?<\/div>/i);
  
  if (descSection) {
    console.log('Desc section found:', descSection[0].slice(0, 400));
  } else {
    // Search for keywords
    const matches = html.match(/<div class="col-12 value content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
    console.log('Value content matches:', matches?.length);
    if (matches) {
      matches.forEach(m => console.log('--- Content block:', m.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)));
    }
  }
}
