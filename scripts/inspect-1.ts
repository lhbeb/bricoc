import { execSync } from 'child_process';

const url = 'https://www.pgatoursuperstore.com/anyday-14-way-golf-stand-bag/2000000052710.html?dwvar_2000000052710_STK_COLOR=5&cgid=golf-bags&isSBStoreSelected=false&shopByStoreID=false';
const cmd = `curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.9" "${url}"`;
const html = execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString();

const gtmMatches = html.match(/data-gtmdata="([^"]+)"/i);
if (gtmMatches) {
  const decoded = gtmMatches[1].replace(/&quot;/g, '"');
  console.log('Product 1 GTM Data:', JSON.parse(decoded));
}

// Find all 2000000052710 images
const imgMatches = Array.from(new Set(html.match(/https:\/\/cdn\.media\.amplience\.net\/i\/pgatss\/2000000052710[^\s"'\)]+/g) || []));
console.log('Product 1 Images:', imgMatches);

// Find description
const descMatch = html.match(/class="item-description-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || html.match(/class="short-description"[^>]*>([\s\S]*?)<\/div>/i) || html.match(/<div class="value content"[^>]*>([\s\S]*?)<\/div>/i);
console.log('Product 1 Desc Match:', descMatch ? descMatch[1].trim().slice(0, 300) : 'No desc match');
