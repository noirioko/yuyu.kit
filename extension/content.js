console.log('🎨 MyPebbles extension loaded!');

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
  } else if (hostname.includes('clip-studio')) {
    data.platform = 'CSP Asset';
  } else if (hostname.includes('amazon')) {
    data.platform = 'Amazon';
  }

  console.log('🏷️ Platform detected:', data.platform);

  // CSP-SPECIFIC EXTRACTION (do this FIRST before generic methods)
  if (data.platform === 'CSP Asset') {
    console.log('🎨 Using CSP-specific extraction...');

    // CSP Title: h1.materialHeaderTitle span[data-translated-text]
    const cspTitleSpan = document.querySelector('.materialHeaderTitle span[data-translated-text]');
    if (cspTitleSpan) {
      data.title = cspTitleSpan.textContent.trim();
      console.log('✅ Found CSP title from .materialHeaderTitle span:', data.title);
    }

    // CSP Author: span.authorTop__name
    const cspAuthor = document.querySelector('.authorTop__name');
    if (cspAuthor) {
      const authorText = cspAuthor.textContent?.trim();
      if (authorText && authorText.length >= 2 && authorText.length <= 50) {
        data.creator = authorText;
        console.log('✅ Found CSP author from .authorTop__name:', data.creator);
      }
    }

    // CSP Price: Check li.price__free first, then ul.price for CLIPPY/GOLD
    const priceFreeElement = document.querySelector('li.price__free');
    if (priceFreeElement) {
      data.price = 0;
      data.currency = 'Free';
      console.log('✅ CSP FREE item detected from li.price__free');
    } else {
      // Check for CLIPPY/GOLD in ul.price
      const priceContainer = document.querySelector('ul.price');
      if (priceContainer) {
        const priceText = priceContainer.textContent || '';
        console.log('🔍 CSP price text:', priceText);

        const clippyMatch = priceText.match(/(\d+)\s*CLIPPY/i);
        const goldMatch = priceText.match(/(\d+)\s*GOLD/i);

        if (clippyMatch) {
          data.price = parseInt(clippyMatch[1]);
          data.currency = 'Clippy';
          console.log('✅ CSP CLIPPY price:', data.price);
        } else if (goldMatch) {
          data.price = parseInt(goldMatch[1]);
          data.currency = 'Gold';
          console.log('✅ CSP GOLD price:', data.price);
        }
      }
    }
  }

  // AMAZON-SPECIFIC EXTRACTION
  if (data.platform === 'Amazon') {
    console.log('🛒 Using Amazon-specific extraction...');

    // Amazon Title: #productTitle
    const amazonTitle = document.querySelector('#productTitle');
    if (amazonTitle) {
      data.title = amazonTitle.textContent.trim();
      console.log('✅ Found Amazon title:', data.title);
    }

    // Amazon Image: #imgTagWrapperId img or #landingImage
    const amazonImgWrapper = document.querySelector('#imgTagWrapperId img');
    const amazonLandingImg = document.querySelector('#landingImage');
    const amazonMainImg = document.querySelector('#imgBlkFront');

    if (amazonImgWrapper && amazonImgWrapper.src) {
      data.thumbnailUrl = amazonImgWrapper.src;
      console.log('✅ Found Amazon image from #imgTagWrapperId:', data.thumbnailUrl);
    } else if (amazonLandingImg && amazonLandingImg.src) {
      data.thumbnailUrl = amazonLandingImg.src;
      console.log('✅ Found Amazon image from #landingImage:', data.thumbnailUrl);
    } else if (amazonMainImg && amazonMainImg.src) {
      data.thumbnailUrl = amazonMainImg.src;
      console.log('✅ Found Amazon image from #imgBlkFront:', data.thumbnailUrl);
    }

    // Amazon Price: .a-price .a-offscreen or #priceblock_ourprice
    const amazonPrice = document.querySelector('.a-price .a-offscreen');
    const amazonPriceAlt = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price-whole');

    if (amazonPrice) {
      const priceText = amazonPrice.textContent.trim();
      const match = priceText.match(/([\d,]+\.?\d*)/);
      if (match) {
        data.price = parseFloat(match[1].replace(/,/g, ''));
        if (priceText.includes('$')) data.currency = '$';
        else if (priceText.includes('¥')) data.currency = '¥';
        else if (priceText.includes('€')) data.currency = '€';
        else if (priceText.includes('£')) data.currency = '£';
        console.log('✅ Found Amazon price:', data.price, data.currency);
      }
    } else if (amazonPriceAlt) {
      const priceText = amazonPriceAlt.textContent.trim();
      const match = priceText.match(/([\d,]+\.?\d*)/);
      if (match) {
        data.price = parseFloat(match[1].replace(/,/g, ''));
        console.log('✅ Found Amazon price (alt):', data.price);
      }
    }

    // Amazon Brand/Seller: #bylineInfo or .author.notFaded (for amazon.co.jp)
    const amazonBrand = document.querySelector('#bylineInfo');
    const amazonAuthorJP = document.querySelector('.author.notFaded a, .author.notFaded');

    if (amazonAuthorJP) {
      // Japanese Amazon author (books, etc.)
      let authorText = amazonAuthorJP.textContent.trim();
      if (authorText.length >= 1 && authorText.length <= 100) {
        data.creator = authorText;
        console.log('✅ Found Amazon.co.jp author:', data.creator);
      }
    } else if (amazonBrand) {
      let brandText = amazonBrand.textContent.trim();
      // Clean up "Visit the X Store" or "Brand: X"
      brandText = brandText.replace(/^(Visit the |Brand:\s*)/i, '').replace(/\s*Store$/i, '');
      if (brandText.length >= 2 && brandText.length <= 50) {
        data.creator = brandText;
        console.log('✅ Found Amazon brand:', data.creator);
      }
    }
  }

  // Try meta tags first (most reliable)
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogImage = document.querySelector('meta[property="og:image"]');

  if (ogTitle && !data.title) {
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

  // CSP-specific: Check if we already extracted price in CSP-specific section
  if (data.platform === 'CSP Asset' && data.price !== null) {
    priceFound = true;
    console.log('✅ CSP price already extracted:', data.price, data.currency);
  }

  // ACON3D-specific: Try to find both original and sale prices
  if (!priceFound && data.platform === 'ACON3D') {
    try {
      console.log('🔍 ACON3D detected - looking for sale info...');

      // Store original price if we find crossed-out text
      let acon3dOriginalPrice = null;
      const crossedOut = document.querySelectorAll('del, s, strike, [style*="line-through"]');
      for (const el of crossedOut) {
        const text = el.textContent?.trim();
        if (text && text.length < 50) {
          const match = text.match(/([\d,]+\.?\d*)/);
          if (match) {
            const val = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(val) && val > 0 && val < 1000000) {
              acon3dOriginalPrice = val;
              console.log('💰 Found crossed-out price:', acon3dOriginalPrice);
              break;
            }
          }
        }
      }

      // Try to find sale price with the specific class
      const saleEl = document.querySelector('[class*="css-1nhqly6"], [class*="e147ribj2"]');
      if (saleEl) {
        const text = saleEl.textContent?.trim();
        if (text) {
          const match = text.match(/^([\d,]+\.?\d*)$/);
          if (match) {
            const val = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(val) && val > 0) {
              data.price = val;
              priceFound = true;
              console.log('✅ Found ACON3D current price:', data.price);

              // If we found both prices and original > current, it's a sale
              // IMPORTANT: Only mark as sale if original is SIGNIFICANTLY higher (at least 5% difference)
              if (acon3dOriginalPrice && acon3dOriginalPrice > val) {
                const discountPercent = ((acon3dOriginalPrice - val) / acon3dOriginalPrice) * 100;
                if (discountPercent >= 5) {
                  data.originalPrice = acon3dOriginalPrice;
                  data.isOnSale = true;
                  console.log('🎉 ACON3D sale detected! Original:', acon3dOriginalPrice, 'Current:', val, 'Discount:', Math.round(discountPercent) + '%');
                } else {
                  console.log('⚠️ Price difference too small (<5%), ignoring as sale');
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.log('⚠️ ACON3D-specific detection failed:', e);
    }
  }

  // Strategy 1: Check meta tags (most reliable)
  if (!priceFound) {
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
          else if (curr === 'GOLD' || curr === 'Gold') data.currency = 'Gold';
          else if (curr === 'CLIPPY' || curr === 'Clippy') data.currency = 'Clippy';
        }
        console.log('✅ Found price from meta tags:', data.price, data.currency);
        priceFound = true;
      }
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
            else if (curr === 'GOLD' || curr === 'Gold') data.currency = 'Gold';
            else if (curr === 'CLIPPY' || curr === 'Clippy') data.currency = 'Clippy';
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
      /GBP\s*([\d,]+\.?\d*)/,          // GBP 49.99
      /([\d,]+\.?\d*)\s*GOLD/i,        // 100 GOLD
      /GOLD\s*([\d,]+\.?\d*)/i,        // GOLD 100
      /([\d,]+\.?\d*)\s*CLIPPY/i,      // 50 CLIPPY
      /CLIPPY\s*([\d,]+\.?\d*)/i       // CLIPPY 50
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
          else if (patternStr.toUpperCase().includes('GOLD')) data.currency = 'Gold';
          else if (patternStr.toUpperCase().includes('CLIPPY')) data.currency = 'Clippy';

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
      const crossedOutPrices = [];
      const bodyText = document.body.innerText || '';

      // Look for crossed-out/strikethrough prices (original price) - limit search
      try {
        const priceElements = document.querySelectorAll('del, s, [style*="line-through"], [style*="text-decoration: line-through"], [style*="text-decoration:line-through"]');
        for (const el of priceElements) {
          const text = el.textContent?.trim();
          if (text && text.length < 50) {
            const priceMatch = text.match(/([\d,]+\.?\d*)/);
            if (priceMatch) {
              const priceValue = parseFloat(priceMatch[1].replace(/,/g, ''));
              if (!isNaN(priceValue) && priceValue > 0 && priceValue < 1000000) {
                crossedOutPrices.push(priceValue);
                console.log('💰 Found crossed-out price (original):', priceValue);
              }
            }
          }
        }
      } catch (e) {
        console.log('⚠️ Error scanning strikethrough prices:', e);
      }

      // If we found crossed-out prices, use them as original price
      if (crossedOutPrices.length > 0) {
        const highestCrossedOut = Math.max(...crossedOutPrices);
        // Only use if it's significantly higher than current price (at least 5% difference)
        if (highestCrossedOut > data.price) {
          const discountPercent = ((highestCrossedOut - data.price) / highestCrossedOut) * 100;
          if (discountPercent >= 5) {
            data.originalPrice = highestCrossedOut;
            data.isOnSale = true;
            console.log('✅ Sale detected! Original:', data.originalPrice, 'Current:', data.price, 'Discount:', Math.round(discountPercent) + '%');
          } else {
            console.log('⚠️ Crossed-out price found but discount <5%, ignoring as sale');
          }
        }
      }

      // Look for percentage discount indicators (fallback)
      if (!data.originalPrice) {
        try {
          const discountMatch = bodyText.match(/(\d+)%\s*(?:off|discount|sale)/i);
          if (discountMatch) {
            const discountPercent = parseInt(discountMatch[1]);
            // Only accept discounts >= 5% and < 100%
            if (discountPercent >= 5 && discountPercent < 100) {
              // Calculate original price from discount percentage
              const calculatedOriginal = data.price / (1 - discountPercent / 100);
              if (calculatedOriginal > data.price) {
                data.originalPrice = Math.round(calculatedOriginal * 100) / 100;
                data.isOnSale = true;
                console.log(`💰 Calculated original price from ${discountPercent}% discount:`, data.originalPrice);
              }
            } else {
              console.log(`⚠️ Discount ${discountPercent}% is too small or invalid, ignoring`);
            }
          }
        } catch (e) {
          console.log('⚠️ Error calculating discount:', e);
        }
      }

      // REMOVED: Don't mark as sale just from class names - too many false positives
      // Only mark as sale if we have actual price data (original vs current)
      if (data.isOnSale && !data.originalPrice) {
        console.log('⚠️ No original price found, clearing sale flag');
        data.isOnSale = false;
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
    if (!data.creator && data.platform === 'ACON3D') {
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

          // Filter out descriptions
          const looksLikeDescription =
            brandName.length > 30 ||
            (brandName.match(/\./g) || []).length > 1 ||
            brandName.includes('\n') ||
            /[,;:].*[,;:]/.test(brandName);

          if (!looksLikeDescription && brandName.length >= 2 && brandName.length <= 30) {
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

              // Filter out descriptions
              const looksLikeDescription =
                brandName.length > 30 ||
                (brandName.match(/\./g) || []).length > 1 ||
                brandName.includes('\n') ||
                /[,;:].*[,;:]/.test(brandName);

              if (!looksLikeDescription && brandName.length >= 2 && brandName.length <= 30) {
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
        const authorName = metaAuthor.getAttribute('content')?.trim();

        // Filter out descriptions
        const looksLikeDescription =
          !authorName ||
          authorName.length > 30 ||
          (authorName.match(/\./g) || []).length > 1 ||
          authorName.includes('\n') ||
          /[,;:].*[,;:]/.test(authorName);

        if (!looksLikeDescription && authorName.length >= 2 && authorName.length <= 30) {
          data.creator = authorName;
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

          // Filter out descriptions
          const looksLikeDescription =
            authorName.length > 30 ||
            (authorName.match(/\./g) || []).length > 1 ||
            authorName.includes('\n') ||
            /[,;:].*[,;:]/.test(authorName);

          if (!looksLikeDescription && authorName.length >= 2 && authorName.length <= 30) {
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

            // Filter out descriptions (they're usually longer and contain punctuation)
            const looksLikeDescription =
              authorName.length > 30 || // Too long for a name
              (authorName.match(/\./g) || []).length > 1 || // Multiple sentences
              authorName.includes('\n') || // Multiple lines
              /[,;:].*[,;:]/.test(authorName); // Multiple punctuation marks

            if (!looksLikeDescription && authorName.length >= 2 && authorName.length <= 30) {
              data.creator = authorName;
              console.log(`✅ Found creator from ${selector}:`, data.creator);
              break;
            } else if (looksLikeDescription) {
              console.log('⚠️ Skipping description-like text:', authorName.substring(0, 50) + '...');
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

  // VALIDATION: Filter out invalid creators (sale timers, discounts, CSS class names, etc.)
  if (data.creator) {
    const invalidPatterns = [
      /^\d+\s*days?$/i,        // "2 day", "3 days"
      /^\d+\s*hours?$/i,       // "2 hour", "3 hours"
      /^\d+\s*mins?$/i,        // "2 min", "3 minutes"
      /^\d+[hm]$/i,            // "2h", "3m"
      /^sale$/i,               // "sale"
      /^discount$/i,           // "discount"
      /^off$/i,                // "off"
      /^\d+%$/,                // "50%"
      /_/,                     // CSS class names with underscores (e.g., "authorTop_Name")
      /^[a-z]+[A-Z]/,          // camelCase (e.g., "authorTop", "creatorName")
      /^(author|creator|brand|artist|seller|name|top|bottom|left|right|inner|outer|wrapper|container|box|div|span)$/i, // Common CSS/HTML terms
      /^content\s+id$/i,       // "Content ID"
      /^content$/i,            // "Content"
      /^id$/i,                 // "ID"
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(data.creator.trim())) {
        console.log('⚠️ Invalid creator detected (sale timer/discount):', data.creator, '- removing');
        data.creator = '';
        break;
      }
    }
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

// Check if current page is a product/asset page (not homepage, category, search, etc.)
function isAssetPage() {
  const url = window.location.href;
  const pathname = window.location.pathname;
  const hostname = window.location.hostname;

  console.log('🔍 Checking if asset page:', url);

  // ACON3D: Must be /product/ with language code (en, ko, ja)
  if (hostname.includes('acon3d')) {
    const isProductPage = /\/(en|ko|ja)\/product\/\d+/.test(url);
    console.log('✅ ACON3D product page:', isProductPage);
    return isProductPage;
  }

  // Clip Studio Paint: Must be /detail?id=
  if (hostname.includes('clip-studio')) {
    const isDetailPage = url.includes('/detail?id=');
    console.log('✅ CSP detail page:', isDetailPage);
    return isDetailPage;
  }

  // Amazon: Must be /dp/ or /gp/product/
  if (hostname.includes('amazon')) {
    const isProductPage = /\/(dp|gp\/product)\/[A-Z0-9]+/i.test(url);
    console.log('✅ Amazon product page:', isProductPage);
    return isProductPage;
  }

  // Other sites - show button on any page for now
  console.log('⚠️ Unknown platform - allowing button');
  return true;
}

// Create and inject the floating button
async function createFloatingButton() {
  // Check if button already exists - remove it first to allow re-creation
  const existingButton = document.getElementById('mypebbles-btn');
  if (existingButton) {
    existingButton.remove();
    console.log('🗑️ Removed existing button for re-creation');
  }

  // Check if we're on a valid asset page
  if (!isAssetPage()) {
    console.log('⏭️ Not an asset page, skipping button injection');
    return;
  }

  // Check if Quick Add button is enabled
  const { quickAddEnabled } = await chrome.storage.sync.get(['quickAddEnabled']);
  if (quickAddEnabled === false) {
    console.log('⏭️ Quick Add button is disabled, skipping button injection');
    return;
  }

  const button = document.createElement('button');
  button.id = 'mypebbles-btn';
  button.className = 'mypebbles-floating-btn';

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

  if (request.action === 'toggleQuickAdd') {
    const button = document.getElementById('mypebbles-btn');
    if (request.enabled) {
      // Show button if it doesn't exist
      if (!button && isAssetPage()) {
        createFloatingButton();
      }
    } else {
      // Hide button if it exists
      if (button) {
        button.remove();
        console.log('✅ Quick Add button removed');
      }
    }
    return true;
  }
});

// Initialize when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createFloatingButton);
} else {
  createFloatingButton();
}

// Watch for URL changes (for single-page apps like ACON3D)
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log('🔄 URL changed, re-checking page type:', currentUrl);
    // Wait a bit for the page to update
    setTimeout(createFloatingButton, 500);
  }
}).observe(document, { subtree: true, childList: true });
