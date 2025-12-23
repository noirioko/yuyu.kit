# MyPebbles Technical Audit

This document explains how MyPebbles detects, extracts, and processes asset data from different websites.

---

## Table of Contents

1. [Platform Detection](#platform-detection)
2. [Supported Platforms](#supported-platforms)
3. [Data Extraction Flow](#data-extraction-flow)
4. [Price Detection Strategies](#price-detection-strategies)
5. [Sale Detection](#sale-detection)
6. [Creator/Author Extraction](#creatorauthor-extraction)
7. [Unsupported Sites (Generic Fallback)](#unsupported-sites-generic-fallback)
8. [Duplicate Detection](#duplicate-detection)
9. [URL Normalization](#url-normalization)
10. [Known Platform Issues](#known-platform-issues)

---

## Platform Detection

When the extension loads on a page, it first identifies the platform based on the hostname:

```javascript
const hostname = window.location.hostname;

if (hostname.includes('acon3d'))      -> platform = 'ACON3D'
if (hostname.includes('clip-studio')) -> platform = 'CSP Asset'
if (hostname.includes('amazon'))      -> platform = 'Amazon'
// Otherwise: Generic extraction
```

### Asset Page Validation

Before showing the "Quick Add" button, the extension checks if the current page is actually a product/asset page (not a homepage, category, or search page):

| Platform | Valid URL Pattern | Example |
|----------|------------------|---------|
| ACON3D | `/en/product/{id}` or `/ko/product/{id}` or `/ja/product/{id}` | `acon3d.com/en/product/12345` |
| Clip Studio | `/detail?id={id}` | `assets.clip-studio.com/en-us/detail?id=12345` |
| Amazon | `/dp/{ASIN}` or `/gp/product/{ASIN}` | `amazon.com/dp/B08N5WRWNW` |
| Other Sites | Any page (no validation) | Shows button everywhere |

---

## Supported Platforms

### 1. ACON3D (`acon3d.com`)

**Data Extracted:**
- **Title**: From `<h1>` or `og:title` meta tag
- **Image**: From `og:image` meta tag
- **Price**: ⚠️ **Limited** - ACON3D encrypts/obfuscates price data
- **Original Price**: ⚠️ **Not available** - encrypted
- **Sale Detection**: ⚠️ **Not available** - cannot detect due to encryption
- **Creator/Brand**: From `Brand:` text pattern or `[class*="brand"]` elements (limited)
- **Currency**: Default `$`

**Known Limitations:**
- ACON3D uses encryption/obfuscation on their pricing elements
- Price, sale status, and original price cannot be reliably extracted
- Users should manually enter price information after adding assets
- Watches for URL changes (SPA navigation)

---

### 2. Clip Studio Paint Assets (`assets.clip-studio.com`)

**Data Extracted:**
- **Title**: `.materialHeaderTitle span[data-translated-text]`
- **Author**: `.authorTop__name`
- **Price**:
  - Free items: `li.price__free`
  - Paid items: `ul.price` containing "CLIPPY" or "GOLD"
- **Image**: From `og:image` meta tag
- **Currency**: `Free`, `Clippy`, or `Gold`

**Special Notes:**
- CSP uses virtual currencies (CLIPPY/GOLD), not real money
- URL query parameter `?id=` is critical for identifying unique assets
- Each asset has a unique ID in the URL

---

### 3. Amazon (`amazon.com`, `amazon.co.jp`, etc.)

**Data Extracted:**
- **Title**: `#productTitle`
- **Image**: Multiple selectors tried in order:
  ```
  #imgTagWrapperId img
  #landingImage
  #imgBlkFront
  #ebooksImgBlkFront (Kindle)
  #main-image
  #img-wrapper img
  .a-dynamic-image
  #imageBlock img
  ```
- **Price**: Multiple selectors tried:
  ```
  .a-price .a-offscreen
  #priceblock_ourprice
  #priceblock_dealprice
  #priceblock_saleprice
  .a-price-whole
  #kindle-price
  #price
  .a-color-price
  #newBuyBoxPrice
  #corePrice_feature_div .a-offscreen
  ```
- **Author/Brand**:
  - Japan: `.author.notFaded a`
  - Other: `#bylineInfo` (cleaned up "Visit the X Store" text)

**Currency Auto-Detection:**
| Domain | Currency |
|--------|----------|
| `amazon.co.jp` | ¥ |
| `amazon.co.uk` | £ |
| `amazon.de`, `amazon.fr`, `amazon.it`, `amazon.es` | € |
| Others | $ |

---

## Data Extraction Flow

The extension follows this priority order when extracting data:

### Title Extraction
1. **Platform-specific selector** (CSP, Amazon)
2. **`og:title` meta tag**
3. **Generic selectors**: `h1`, `h1[class*="title"]`, `[class*="product-title"]`
4. **Fallback**: URL path or "Unknown Asset"

### Image Extraction
1. **Platform-specific selector** (Amazon image selectors)
2. **`og:image` meta tag**
3. **Generic selectors**: `main img`, `[class*="product"] img`, `article img`

### Price Extraction (5 strategies)
1. **Platform-specific** (CSP CLIPPY/GOLD, ACON3D custom classes)
2. **Meta tags**: `product:price:amount`, `product:price:currency`
3. **JSON-LD structured data**: `<script type="application/ld+json">`
4. **Page text patterns**: Regex for `$49.99`, `USD 49.99`, `49000 KRW`, etc.
5. **DOM search**: Elements with `price` in class name

---

## Price Detection Strategies

### Strategy 1: Meta Tags
```html
<meta property="product:price:amount" content="49.99">
<meta property="product:price:currency" content="USD">
```

### Strategy 2: JSON-LD
```html
<script type="application/ld+json">
{
  "offers": {
    "price": 49.99,
    "priceCurrency": "USD"
  }
}
</script>
```

### Strategy 3: Text Patterns
Searches page text for patterns like:
- `$49.99`, `USD 49.99`, `49.99 USD`
- `¥4900`, `JPY 4900`
- `€49.99`, `EUR 49.99`
- `£49.99`, `GBP 49.99`
- `₩49000`, `KRW 49000`
- `100 GOLD`, `50 CLIPPY`

### Strategy 4: DOM Elements
Searches for elements with `price` in class name and validates the content matches a price pattern.

---

## Sale Detection

Sales are detected by comparing original vs current price (on supported sites):

1. **Look for crossed-out text**: `<del>`, `<s>`, `<strike>`, or `style="line-through"`
2. **Extract the crossed-out price** (original price)
3. **Compare with current price**
4. **Only mark as sale if discount >= 5%** (prevents false positives)

**Example:**
```
Original (crossed out): $100
Current: $75
Discount: 25% >= 5%
Result: isOnSale = true, originalPrice = 100
```

**Fallback:** If no crossed-out price found, looks for text like `25% off` and calculates original price.

**Platform Limitations:**
- ⚠️ **ACON3D**: Sale detection does NOT work - price data is encrypted/obfuscated
- **Clip Studio**: N/A - uses virtual currency, no traditional "sales"
- **Amazon**: Limited - Amazon's pricing structure varies significantly

---

## Creator/Author Extraction

### Priority Order:
1. **Platform-specific** (CSP `.authorTop__name`, Amazon `#bylineInfo`)
2. **Meta tags**: `author`, `article:author`
3. **Text patterns**: "by X", "Created by X", "Author: X", "Artist: X"
4. **DOM selectors**: `[class*="creator"]`, `a[href*="/user/"]`, etc.

### Validation Filters:
Invalid creators are filtered out:
- Sale timers: "2 days", "3 hours"
- Discounts: "50%", "sale", "off"
- CSS class names: "authorTop_Name", camelCase text
- HTML terms: "wrapper", "container", "div"

---

## Unsupported Sites (Generic Fallback)

When the extension encounters an unknown website:

### What Happens:
1. **Button appears** on any page (no validation)
2. **Generic extraction** is attempted using:
   - `og:title` and `og:image` meta tags
   - First `<h1>` for title
   - First large image for thumbnail
   - Price meta tags or JSON-LD
   - Author meta tags

### What Gets Extracted:
| Field | Source |
|-------|--------|
| Title | `og:title` → `<h1>` → URL path |
| Image | `og:image` → First `main img` |
| Price | Meta tags → JSON-LD → Text patterns |
| Creator | Meta `author` → Text patterns |
| Platform | Empty string |
| Currency | `$` (default) |

### Limitations on Unknown Sites:
- Price detection may fail (depends on site structure)
- Creator may not be found
- Sale detection may not work
- Image may be wrong (logo instead of product)

**Tip:** Users can edit any field in the app after saving!

---

## Duplicate Detection

### In Extension (Pre-save check)
The extension normalizes URLs and checks against saved assets before adding:

```javascript
// URL is normalized to remove tracking params
// Then compared against existing assets
```

**Note:** This check has limitations and may miss some duplicates.

### In Dashboard (Post-save check)
The "Check for Duplicates" tool in the sidebar is more reliable:

1. Loads ALL user assets
2. Normalizes each URL
3. Groups by normalized URL
4. Shows groups with 2+ assets as duplicates
5. Marks oldest as "Original"
6. Allows deletion of duplicates

---

## URL Normalization

URLs are normalized to detect duplicates that differ only in tracking parameters:

### Parameters Removed:
```
ref, ref_, tag
utm_source, utm_medium, utm_campaign, utm_content, utm_term
fbclid, gclid, msclkid
affiliate, aff, source
mc_cid, mc_eid
spm, scm, pvid, algo_pvid, algo_exp_id
btsid, ws_ab_test, sk
aff_fcid, aff_fsk, aff_platform, aff_trace_key
terminal_id, afSmartRedirect
```

### Parameters Kept:
- `id` (critical for Clip Studio)
- `product`
- Any other non-tracking parameters

### Normalization Process:
1. Parse URL
2. Remove tracking parameters
3. Remove trailing slash
4. Sort remaining query params
5. Convert to lowercase

**Example:**
```
Input:  https://assets.clip-studio.com/detail?id=12345&utm_source=google&ref=abc
Output: https://assets.clip-studio.com/detail?id=12345
```

---

## Summary Table

| Feature | ACON3D | CSP | Amazon | Generic |
|---------|--------|-----|--------|---------|
| Title | og:title | Custom selector | #productTitle | og:title / h1 |
| Image | og:image | og:image | Multiple selectors | og:image |
| Price | ⚠️ Encrypted | CLIPPY/GOLD | Multiple selectors | Meta/JSON-LD |
| Creator | Limited | .authorTop__name | #bylineInfo | Meta author |
| Sale | ⚠️ N/A | N/A | N/A | Crossed text |
| Currency | $ | Free/Clippy/Gold | Auto by region | $ |
| Page Check | /product/ | /detail?id= | /dp/ or /gp/ | Any page |

---

## Debugging

The extension logs detailed information to the browser console:

```
🎨 MyPebbles extension loaded!
🔍 Starting extraction from: https://...
🏷️ Platform detected: ACON3D Currency: $
✅ Found title from og:title: ...
✅ Found price from meta tags: 49.99 $
📦 Final extracted data: {...}
```

Open DevTools (F12) → Console tab to see extraction logs.

---

*Last updated: December 2024*

---

## Known Platform Issues

| Platform | Issue | Workaround |
|----------|-------|------------|
| ACON3D | Price/sale data encrypted | Manually enter price after saving |
| Clip Studio | - | Works well |
| Amazon | Complex pricing structure | Usually works, verify manually |
| VGen | Generic extraction | May need manual edits |
