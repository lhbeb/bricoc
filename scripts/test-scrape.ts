async function testFetch() {
  const urls = [
    'https://www.pgatoursuperstore.com/anyday-14-way-golf-stand-bag/2000000052710.html?dwvar_2000000052710_STK_COLOR=5&cgid=golf-bags&isSBStoreSelected=false&shopByStoreID=false',
    'https://www.pgatoursuperstore.com/ultralight-pro-2025-cart-bag/2000000047625.html?dwvar_2000000047625_STK_COLOR=5&cgid=golf-bags&isSBStoreSelected=false&shopByStoreID=false',
    'https://www.pgatoursuperstore.com/ghost-leather-golf-glove/2000000053263.html?dwvar_2000000053263_STK_COLOR=39',
    'https://www.pgatoursuperstore.com/extreme-lite-golf-cart-bag/2000000050188.html?dwvar_2000000050188_STK_COLOR=5'
  ];

  for (const url of urls) {
    try {
      console.log('Fetching:', url);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      console.log('Status:', res.status);
      if (res.ok) {
        const text = await res.text();
        console.log('Length:', text.length);
        // Find title
        const titleMatch = text.match(/<title>(.*?)<\/title>/i);
        console.log('Title:', titleMatch ? titleMatch[1] : 'No title');
        // Find ld+json
        const jsonLdMatches = text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
        console.log('JSON-LD count:', jsonLdMatches ? jsonLdMatches.length : 0);
        if (jsonLdMatches) {
          console.log('First JSON-LD:', jsonLdMatches[0].slice(0, 300));
        }
      }
    } catch (e: any) {
      console.error('Error:', e.message);
    }
  }
}

testFetch();
