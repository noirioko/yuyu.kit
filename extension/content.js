console.log('🎨 YuyuAsset extension loaded!');

// Extract asset data from the current page
function extractAssetData() {
  console.log('🔍 Starting extraction from:', window.location.href);

  const data = {
    url: window.location.href,
    title: '',
    thumbnailUrl: '',
    price: null,
    originalPrice: null,
    isOnSale: false,
    currency: '$',
    platform: '',
    creator: ''
  };

  // Detect platform
  const hostname = window.location.hostname;
  if (hostname.includes('acon3d')) {
    data.platform = 'ACON3D';
  } else if (hostname.includes('gumroad')) {
    data.platform = 'Gumroad';
  } else if (hostname.includes('vgen')) {
    data.platform = 'VGEN';
  } else if (hostname.includes('artstation')) {
    data.platform = 'ArtStation Marketplace';
  } else if (hostname.includes('blendermarket')) {
    data.platform = 'Blender Market';
  }

  console.log('🏷️ Platform detected:', data.platform);

  // Try meta tags first (most reliable)
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogImage = document.querySelector('meta[property="og:image"]');

  if (ogTitle) {
    data.title = ogTitle.getAttribute('content');
    console.log('✅ Found title from og:title:', data.title);
  }

  if (ogImage) {
    data.thumbnailUrl = ogImage.getAttribute('content');
    console.log('✅ Found image from og:image:', data.thumbnailUrl);
  }

  // If meta tags didn't work, try page elements
  if (!data.title) {
    const titleSelectors = [
      'h1',
      'h1[class*="title"]',
      '[class*="product-title"]',
      '[class*="ProductTitle"]',
      'title'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        data.title = selector === 'title'
          ? element.textContent.split('|')[0].split('-')[0].trim()
          : element.textContent.trim();
        if (data.title && data.title.length > 3) {
          console.log(`✅ Found title from ${selector}:`, data.title);
          break;
        }
      }
    }
  }

  // Find images if meta didn't work
  if (!data.thumbnailUrl) {
    const imageSelectors = [
      'main img',
      '[class*="product"] img',
      '[class*="Product"] img',
      'article img',
      '.content img'
    ];

    for (const selector of imageSelectors) {
      const element = document.querySelector(selector);
      if (element && element.src && !element.src.includes('icon') && !element.src.includes('logo')) {
        data.thumbnailUrl = element.src;
        console.log(`✅ Found image from ${selector}:`, data.thumbnailUrl);
        break;
      }
    }
  }

  // Extract price - try multiple strategies
  let priceFound = false;

  // Strategy 1: Check meta tags (most reliable)
  const metaPrice = document.querySelector('meta[property="product:price:amount"]');
  const metaCurrency = document.querySelector('meta[property="product:price:currency"]');

  if (metaPrice) {
    const priceValue = parseFloat(metaPrice.getAttribute('content'));
    if (!isNaN(priceValue) && priceValue > 0) {
      data.price = priceValue;
      if (metaCurrency) {
        const curr = metaCurrency.getAttribute('content');
        if (curr === 'USD') data.currency = '$';
        else if (curr === 'EUR') data.currency = '€';
        else if (curr === 'GBP') data.currency = '£';
        else if (curr === 'KRW') data.currency = '₩';
        else if (curr === 'JPY') data.currency = '¥';
      }
      console.log('✅ Found price from meta tags:', data.price, data.currency);
      priceFound = true;
    }
  }

  // Strategy 2: Look for JSON-LD structured data
  if (!priceFound) {
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const jsonData = JSON.parse(script.textContent);
        if (jsonData.offers && jsonData.offers.price) {
          data.price = parseFloat(jsonData.offers.price);
          if (jsonData.offers.priceCurrency) {
            const curr = jsonData.offers.priceCurrency;
            if (curr === 'USD') data.currency = '$';
            else if (curr === 'EUR') data.currency = '€';
            else if (curr === 'GBP') data.currency = '£';
            else if (curr === 'KRW') data.currency = '₩';
            else if (curr === 'JPY') data.currency = '¥';
          }
          console.log('✅ Found price from JSON-LD:', data.price, data.currency);
          priceFound = true;
          break;
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }
  }

  // Strategy 3: Search entire page text for price patterns
  if (!priceFound) {
    const bodyText = document.body.innerText;

    // Look for common price patterns with currency symbols
    const pricePatterns = [
      /\$\s*([\d,]+\.?\d*)/,           // $49.99
      /USD\s*([\d,]+\.?\d*)/,          // USD 49.99
      /([\d,]+\.?\d*)\s*USD/,          // 49.99 USD
      /₩\s*([\d,]+)/,                  // ₩49000
      /KRW\s*([\d,]+)/,                // KRW 49000
      /([\d,]+)\s*KRW/,                // 49000 KRW
      /€\s*([\d,]+\.?\d*)/,            // €49.99
      /EUR\s*([\d,]+\.?\d*)/,          // EUR 49.99
      /£\s*([\d,]+\.?\d*)/,            // £49.99
      /GBP\s*([\d,]+\.?\d*)/           // GBP 49.99
    ];

    for (const pattern of pricePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const priceValue = parseFloat(match[1].replace(/,/g, ''));

        // Sanity check: price should be reasonable (0.01 to 1,000,000)
        if (!isNaN(priceValue) && priceValue > 0 && priceValue < 1000000) {
          data.price = priceValue;

          // Detect currency from pattern
          const patternStr = pattern.toString();
          if (patternStr.includes('$') || patternStr.includes('USD')) data.currency = '$';
          else if (patternStr.includes('₩') || patternStr.includes('KRW')) data.currency = '₩';
          else if (patternStr.includes('€') || patternStr.includes('EUR')) data.currency = '€';
          else if (patternStr.includes('£') || patternStr.includes('GBP')) data.currency = '£';

          console.log('✅ Found price from page text:', data.price, data.currency);
          priceFound = true;
          break;
        }
      }
    }
  }

  // Strategy 4: DOM search with class/attribute filters (last resort)
  if (!priceFound) {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const text = el.textContent?.trim();
      if (!text || text.length > 100) continue; // Skip long text blocks

      // Look for price-like patterns in short text
      const match = text.match(/^[\$₩€£]?\s*([\d,]+\.?\d*)\s*[\$₩€£]?$/);
      if (match) {
        const priceValue = parseFloat(match[1].replace(/,/g, ''));

        // Stricter validation for DOM search
        if (!isNaN(priceValue) && priceValue >= 0.01 && priceValue < 1000000) {
          // Check if element or parent has price-related attributes
          const hasPriceRelated =
            el.className?.toLowerCase().includes('price') ||
            el.getAttribute('data-price') ||
            el.parentElement?.className?.toLowerCase().includes('price');

          if (hasPriceRelated) {
            data.price = priceValue;

            // Detect currency from symbol in text
            if (text.includes('$')) data.currency = '$';
            else if (text.includes('₩')) data.currency = '₩';
            else if (text.includes('€')) data.currency = '€';
            else if (text.includes('£')) data.currency = '£';

            console.log('✅ Found price from DOM search:', data.price, data.currency);
            priceFound = true;
            break;
          }
        }
      }
    }
  }

  if (!priceFound) {
    console.log('⚠️ No price found on this page');
  }

  // SALE DETECTION: Look for discount indicators and extract original price
  if (data.price && data.price > 0) {
    try {
      console.log('🔍 Checking for sale/discount indicators...');

      const allPrices = [];
      const bodyText = document.body.innerText || '';

      // Look for crossed-out/strikethrough prices (original price) - limit search
      try {
        const priceElements = document.querySelectorAll('del, s, [style*="line-through"]');
        for (const el of priceElements) {
          const text = el.textContent?.trim();
          if (text && text.length < 50) {
            const priceMatch = text.match(/([\d,]+\.?\d*)/);
            if (priceMatch) {
              const priceValue = parseFloat(priceMatch[1].replace(/,/g, ''));
              if (!isNaN(priceValue) && priceValue > 0 && priceValue < 1000000) {
                allPrices.push({ value: priceValue, type: 'original' });
                console.log('💰 Found crossed-out price:', priceValue);
              }
            }
          }
        }
      } catch (e) {
        console.log('⚠️ Error scanning strikethrough prices:', e);
      }

      // Look for "was $X" or "before $X" patterns
      try {
        const wasPatterns = [
          /(?:was|before|originally)\s*[\$₩€£]?\s*([\d,]+\.?\d*)/i,
          /[\$₩€£]?\s*([\d,]+\.?\d*)\s*(?:was|before|originally)/i
        ];

        for (const pattern of wasPatterns) {
          const match = bodyText.match(pattern);
          if (match) {
            const priceValue = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(priceValue) && priceValue > data.price && priceValue < 1000000) {
              allPrices.push({ value: priceValue, type: 'original' });
              console.log('💰 Found "was" price:', priceValue);
              break; // Only take first match
            }
          }
        }
      } catch (e) {
        console.log('⚠️ Error checking "was" prices:', e);
      }

      // Look for percentage discount indicators
      try {
        const discountMatch = bodyText.match(/(\d+)%\s*(?:off|discount|sale)/i);
        if (discountMatch && !data.originalPrice) {
          const discountPercent = parseInt(discountMatch[1]);
          if (discountPercent > 0 && discountPercent < 100) {
            // Calculate original price from discount percentage
            const calculatedOriginal = data.price / (1 - discountPercent / 100);
            if (calculatedOriginal > data.price) {
              data.originalPrice = Math.round(calculatedOriginal * 100) / 100;
              data.isOnSale = true;
              console.log(`💰 Calculated original price from ${discountPercent}% discount:`, data.originalPrice);
            }
          }
        }
      } catch (e) {
        console.log('⚠️ Error calculating discount:', e);
      }

      // If we found crossed-out or "was" prices, use the highest one as original price
      if (allPrices.length > 0 && !data.originalPrice) {
        const highestPrice = Math.max(...allPrices.map(p => p.value));
        if (highestPrice > data.price) {
          data.originalPrice = highestPrice;
          data.isOnSale = true;
          console.log('✅ Sale detected! Original:', data.originalPrice, 'Sale:', data.price);
        }
      }

      // Check for sale/discount class names (lightweight check)
      if (data.isOnSale === false) {
        try {
          const hasSaleIndicator = document.querySelector('[class*="sale"], [class*="discount"]');
          if (hasSaleIndicator) {
            console.log('🏷️ Sale indicator found in DOM');
            data.isOnSale = true;
          }
        } catch (e) {
          console.log('⚠️ Error checking sale indicators:', e);
        }
      }
    } catch (error) {
      console.error('⚠️ Sale detection failed, continuing without sale info:', error);
      // Don't break the extraction if sale detection fails
      data.isOnSale = false;
      data.originalPrice = null;
    }
  }

  // CREATOR/BRAND EXTRACTION
  try {
    console.log('👤 Extracting creator/brand...');

    // Strategy 1: ACON3D specific - Look for brand name
    if (data.platform === 'ACON3D') {
      // Look for "Brand:" label
      const bodyText = document.body.innerText || '';
      const brandPatterns = [
        /(?:Brand|brand):\s*([A-Za-z0-9\s]+)/,
        /(?:Brand|brand)\s*([A-Za-z0-9\s]+)/,
        /브랜드:\s*([A-Za-z0-9\s가-힣]+)/  // Korean "Brand:"
      ];

      for (const pattern of brandPatterns) {
        const match = bodyText.match(pattern);
        if (match && match[1]) {
          const brandName = match[1].trim();
          if (brandName.length >= 2 && brandName.length <= 50 && !brandName.includes('\n')) {
            data.creator = brandName;
            console.log('✅ Found brand from text pattern:', data.creator);
            break;
          }
        }
      }

      // Look for brand links or elements
      if (!data.creator) {
        const brandSelectors = [
          'a[href*="/brand/"]',
          '[class*="brand"]',
          '[data-brand]'
        ];

        for (const selector of brandSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            let brandName = element.getAttribute('data-brand') || element.textContent?.trim();

            if (brandName && brandName.length >= 2 && brandName.length <= 100) {
              brandName = brandName.replace(/\s+/g, ' ').trim();
              if (brandName.length >= 2 && brandName.length <= 50) {
                data.creator = brandName;
                console.log(`✅ Found brand from ${selector}:`, data.creator);
                break;
              }
            }
          }
        }
      }
    }

    // Strategy 2: Check meta tags (for other platforms)
    if (!data.creator) {
      const metaAuthor = document.querySelector('meta[name="author"], meta[property="author"], meta[property="article:author"]');
      if (metaAuthor) {
        const authorName = metaAuthor.getAttribute('content');
        if (authorName && authorName.length > 0 && authorName.length < 100) {
          data.creator = authorName.trim();
          console.log('✅ Found creator from meta tag:', data.creator);
        }
      }
    }

    // Strategy 3: Look for common creator/author patterns in text
    if (!data.creator) {
      const bodyText = document.body.innerText || '';
      const authorPatterns = [
        /(?:by|By|BY)\s+([A-Z][a-zA-Z0-9\s]{2,50})/,
        /(?:Created by|created by)\s+([A-Z][a-zA-Z0-9\s]{2,50})/,
        /(?:Author|author):\s*([A-Z][a-zA-Z0-9\s]{2,50})/,
        /(?:Artist|artist):\s*([A-Z][a-zA-Z0-9\s]{2,50})/,
        /(?:Creator|creator):\s*([A-Z][a-zA-Z0-9\s]{2,50})/,
        /(?:Seller|seller):\s*([A-Z][a-zA-Z0-9\s]{2,50})/
      ];

      for (const pattern of authorPatterns) {
        const match = bodyText.match(pattern);
        if (match && match[1]) {
          const authorName = match[1].trim();
          if (authorName.length >= 2 && authorName.length <= 50 && !authorName.includes('\n')) {
            data.creator = authorName;
            console.log('✅ Found creator from text pattern:', data.creator);
            break;
          }
        }
      }
    }

    // Strategy 4: Look for elements with creator/author related classes or attributes
    if (!data.creator) {
      const creatorSelectors = [
        '[class*="creator"]',
        '[class*="author"]',
        '[class*="artist"]',
        '[class*="seller"]',
        '[data-author]',
        '[data-creator]',
        'a[href*="/creator/"]',
        'a[href*="/artist/"]',
        'a[href*="/user/"]',
        'a[href*="/seller/"]'
      ];

      for (const selector of creatorSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          let authorName = element.getAttribute('data-author') ||
                          element.getAttribute('data-creator') ||
                          element.textContent?.trim();

          if (authorName && authorName.length >= 2 && authorName.length <= 100) {
            authorName = authorName.replace(/\s+/g, ' ').trim();
            if (authorName.length >= 2 && authorName.length <= 50) {
              data.creator = authorName;
              console.log(`✅ Found creator from ${selector}:`, data.creator);
              break;
            }
          }
        }
      }
    }

    if (!data.creator) {
      console.log('⚠️ No creator/brand found on this page');
    }
  } catch (error) {
    console.error('⚠️ Creator extraction failed:', error);
    data.creator = '';
  }

  console.log('📦 Final extracted data:', data);

  // Validate we have at least title and URL
  if (!data.title || data.title.length < 3) {
    console.error('❌ No valid title found!');
    // Use URL as fallback
    data.title = window.location.pathname.split('/').pop() || 'Unknown Asset';
  }

  return data;
}

// Create and inject the floating button
function createFloatingButton() {
  // Check if button already exists
  if (document.getElementById('yuyuasset-btn')) return;

  const button = document.createElement('button');
  button.id = 'yuyuasset-btn';
  button.className = 'yuyuasset-floating-btn';

  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
    <span>Quick Add</span>
  `;

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.innerHTML = '⏳ Adding...';

    try {
      const assetData = extractAssetData();

      chrome.runtime.sendMessage({
        action: 'addAsset',
        data: assetData
      }, (response) => {
        // Check for chrome runtime errors
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          button.innerHTML = '❌ Error';
          setTimeout(() => {
            button.disabled = false;
            button.innerHTML = `
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>Quick Add</span>
            `;
          }, 2000);
          return;
        }

        if (response && response.success) {
          button.innerHTML = '✅ Added!';
          button.classList.add('success');
          setTimeout(() => {
            button.disabled = false;
            button.innerHTML = `
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>Quick Add</span>
            `;
            button.classList.remove('success');
          }, 2000);
        } else if (response && response.success === false) {
          // User cancelled or duplicate
          button.innerHTML = '⏭️ Skipped';
          setTimeout(() => {
            button.disabled = false;
            button.innerHTML = `
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>Quick Add</span>
            `;
          }, 2000);
        } else {
          button.innerHTML = '❌ Error';
          setTimeout(() => {
            button.disabled = false;
            button.innerHTML = `
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>Quick Add</span>
            `;
          }, 2000);
        }
      });
    } catch (error) {
      console.error('Error adding asset:', error);
      button.innerHTML = '❌ Error';
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>Quick Add</span>
        `;
      }, 2000);
    }
  });

  document.body.appendChild(button);
  console.log('✅ Floating button added!');
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const data = extractAssetData();
    sendResponse(data);
    return true;
  }
});

// Initialize when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createFloatingButton);
} else {
  createFloatingButton();
}
