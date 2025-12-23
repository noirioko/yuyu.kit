import { NextResponse } from 'next/server';

// ACON3D sale page URLs to check
const ACON_SALE_PAGES = [
  'https://acon3d.com/en/toon?sort=NEWEST&onSale=true',
  'https://acon3d.com/en/game?sort=NEWEST&onSale=true',
  'https://acon3d.com/en/realistic?sort=NEWEST&onSale=true',
];

interface SaleItem {
  title: string;
  url: string;
  thumbnailUrl?: string;
}

export async function GET() {
  try {
    console.log('Scraping ACON3D sale pages...');
    const allSaleItems: SaleItem[] = [];

    for (const salePageUrl of ACON_SALE_PAGES) {
      try {
        const items = await scrapeAconSalePage(salePageUrl);
        allSaleItems.push(...items);
      } catch (err) {
        console.error(`Failed to scrape ${salePageUrl}:`, err);
      }
    }

    // Dedupe by URL
    const uniqueItems = Array.from(
      new Map(allSaleItems.map(item => [item.url, item])).values()
    );

    console.log(`Found ${uniqueItems.length} unique items on sale`);

    return NextResponse.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      count: uniqueItems.length,
      items: uniqueItems
    });
  } catch (error: any) {
    console.error('ACON sales scraping error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch ACON sales'
    }, { status: 500 });
  }
}

async function scrapeAconSalePage(url: string): Promise<SaleItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return parseAconSaleItems(html, url);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function parseAconSaleItems(html: string, baseUrl: string): SaleItem[] {
  const items: SaleItem[] = [];

  // Extract the base domain
  const urlObj = new URL(baseUrl);
  const baseDomain = `${urlObj.protocol}//${urlObj.host}`;

  // Pattern 1: Look for product links with titles
  // ACON uses links like /en/product/12345 or /ko/product/12345
  const productLinkPattern = /href="(\/(?:en|ko|ja)\/product\/\d+)"[^>]*>([^<]*)/gi;
  let match;

  while ((match = productLinkPattern.exec(html)) !== null) {
    const productUrl = baseDomain + match[1];
    const title = match[2].trim();

    if (title && title.length > 0) {
      items.push({
        title,
        url: productUrl
      });
    }
  }

  // Pattern 2: Look for product cards with data attributes or structured content
  // Try to find product titles in common patterns
  const titlePatterns = [
    /<a[^>]*href="(\/(?:en|ko|ja)\/product\/\d+)"[^>]*>[\s\S]*?<(?:h[1-6]|span|div)[^>]*class="[^"]*(?:title|name|product)[^"]*"[^>]*>([^<]+)/gi,
    /data-product-url="([^"]+)"[\s\S]*?data-product-name="([^"]+)"/gi,
  ];

  for (const pattern of titlePatterns) {
    pattern.lastIndex = 0;
    while ((match = pattern.exec(html)) !== null) {
      let productUrl = match[1];
      const title = match[2].trim();

      if (!productUrl.startsWith('http')) {
        productUrl = baseDomain + productUrl;
      }

      if (title && title.length > 0) {
        items.push({
          title,
          url: productUrl
        });
      }
    }
  }

  // Pattern 3: Extract from JSON-LD if present
  const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const jsonData = JSON.parse(match[1]);
      if (jsonData['@type'] === 'ItemList' && jsonData.itemListElement) {
        for (const item of jsonData.itemListElement) {
          if (item.url && item.name) {
            items.push({
              title: item.name,
              url: item.url,
              thumbnailUrl: item.image
            });
          }
        }
      }
    } catch {
      // JSON parse failed, continue
    }
  }

  // Dedupe by URL within this page
  return Array.from(
    new Map(items.map(item => [item.url, item])).values()
  );
}
