async function test() {
  const url = 'https://www.ebay.com/itm/168525606795';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const html = await res.text();
    console.log('Status:', res.status);
    console.log('Length:', html.length);
    console.log('Includes title tag:', html.match(/<title>([^<]+)<\/title>/i)?.[1]);
    
    // Look for image urls
    const imgMatches = html.match(/https:\/\/i\.ebayimg\.com\/images\/g\/[a-zA-Z0-9_-]+\/s-l\d+\.jpg/gi);
    console.log('Images found:', imgMatches?.length, imgMatches?.slice(0, 3));
    
    // Look for price
    const priceMatch = html.match(/itemprop="price"\s+content="([^"]+)"/i) || html.match(/US\s*\$([0-9.]+)/i);
    console.log('Price found:', priceMatch?.[1]);
  } catch (e: any) {
    console.error('Fetch error:', e.message);
  }
}

test();
