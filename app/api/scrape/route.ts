import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    console.log('Scraping URL:', url);

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Try fetching with realistic browser headers and timeout
    console.log('Fetching HTML...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.google.com/'
      }
    }).finally(() => clearTimeout(timeoutId));

    console.log('Fetch response status:', response.status);

    // If blocked (403), try with CORS proxy as fallback
    if (!response.ok && response.status === 403) {
      console.log('Got 403, trying CORS proxy...');
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const proxyResponse = await fetch(proxyUrl);

        if (proxyResponse.ok) {
          const data = await proxyResponse.json();
          // Create a fake response object with the proxied content
          response = new Response(data.contents, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          });
          console.log('CORS proxy worked!');
        }
      } catch (proxyError) {
        console.error('CORS proxy also failed:', proxyError);
      }
    }

    if (!response.ok) {
      console.error('Failed to fetch URL. Status:', response.status);
      return NextResponse.json({
        error: `Failed to fetch URL (status ${response.status}). This site may block automated requests.`,
        success: false
      }, { status: 200 });
    }

    const html = await response.text();

    // Extract metadata using Open Graph tags and meta tags
    const title = extractMetadata(html, [
      /<meta property="og:title" content="([^"]+)"/i,
      /<meta name="twitter:title" content="([^"]+)"/i,
      /<title>([^<]+)<\/title>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i
    ]);

    const image = extractMetadata(html, [
      /<meta property="og:image" content="([^"]+)"/i,
      /<meta name="twitter:image" content="([^"]+)"/i,
      /<meta property="og:image:url" content="([^"]+)"/i
    ]);

    const description = extractMetadata(html, [
      /<meta property="og:description" content="([^"]+)"/i,
      /<meta name="description" content="([^"]+)"/i,
      /<meta name="twitter:description" content="([^"]+)"/i
    ]);

    // Extract price (common patterns)
    const price = extractPrice(html);

    // Detect platform from URL
    const platform = detectPlatform(url);

    return NextResponse.json({
      success: true,
      data: {
        title: title || 'Unknown Title',
        thumbnailUrl: image || '',
        description: description || '',
        price: price?.amount || null,
        currency: price?.currency || '$',
        platform: platform || ''
      }
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    console.error('Error stack:', error.stack);

    let errorMessage = 'Failed to scrape URL';
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout - this site is taking too long to respond';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error.message
    }, { status: 200 }); // Return 200 so frontend can show the error message
  }
}

function extractMetadata(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractPrice(html: string): { amount: number; currency: string } | null {
  // Common price patterns
  const patterns = [
    /\$\s*(\d+(?:\.\d{2})?)/i,           // $99.00
    /(\d+(?:\.\d{2})?)\s*USD/i,          // 99.00 USD
    /€\s*(\d+(?:\.\d{2})?)/i,            // €99.00
    /£\s*(\d+(?:\.\d{2})?)/i,            // £99.00
    /¥\s*(\d+)/i,                        // ¥9900
    /₩\s*(\d+)/i,                        // ₩99000
    /"price":\s*"?(\d+(?:\.\d{2})?)"/i,  // JSON price
    /data-price="(\d+(?:\.\d{2})?)"/i    // data attribute
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const amount = parseFloat(match[1]);
      let currency = '$';

      if (html.includes('€') || html.includes('EUR')) currency = '€';
      else if (html.includes('£') || html.includes('GBP')) currency = '£';
      else if (html.includes('¥') || html.includes('JPY')) currency = '¥';
      else if (html.includes('₩') || html.includes('KRW')) currency = '₩';

      return { amount, currency };
    }
  }
  return null;
}

function detectPlatform(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes('acon3d')) return 'ACON3D';
  if (hostname.includes('gumroad')) return 'Gumroad';
  if (hostname.includes('artstation')) return 'ArtStation Marketplace';
  if (hostname.includes('blendermarket')) return 'Blender Market';
  if (hostname.includes('cgtrader')) return 'CGTrader';
  if (hostname.includes('turbosquid')) return 'TurboSquid';
  if (hostname.includes('sketchfab')) return 'Sketchfab';

  return '';
}
