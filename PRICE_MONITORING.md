# Price Monitoring System

YuyuAsset Manager includes automatic price monitoring to track sales and price changes for your saved assets.

## Features

### 1. Manual Price Check
- Click the **"💰 Check Prices"** button in the Dashboard header
- Checks all your saved assets for price changes
- Shows a summary of:
  - Total assets checked
  - Number of price updates
  - Items currently on sale
  - Any errors encountered

### 2. Automatic Daily Price Monitoring
When deployed on Vercel, prices are automatically checked **daily at 9 AM UTC**.

### How It Works

1. **Price Detection**: When you save an asset, the current price is automatically extracted from the marketplace page

2. **Sale Detection**: The system detects when items are on sale by comparing:
   - Original price (strikethrough price on the page)
   - Current sale price (red/highlighted price)

3. **Price History**: Every price change is tracked in the asset's price history

4. **Lowest Price Tracking**: The system remembers the lowest price ever seen for each asset

5. **Visual Indicators**:
   - Sale badge with discount percentage
   - Strikethrough original price
   - Red highlighted sale price
   - Lowest price notification

## API Endpoints

### `/api/check-prices` (POST)
Checks prices for a specific user's assets.

**Request:**
```json
{
  "userId": "user_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "checked": 10,
    "updated": 3,
    "onSale": 2,
    "errors": 0,
    "details": [...]
  }
}
```

### `/api/cron/check-prices` (GET)
Automated cron endpoint that checks prices for all users.
Called automatically by Vercel Cron daily.

## Deployment Configuration

The `vercel.json` file configures the daily cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule Format**: `0 9 * * *` = Every day at 9:00 AM UTC

### Optional: Secure the Cron Endpoint

To prevent unauthorized access to the cron endpoint, add a `CRON_SECRET` environment variable in your Vercel project settings:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `CRON_SECRET` = `your-secret-key-here`

The cron endpoint will then require an `Authorization: Bearer your-secret-key-here` header.

## Supported Marketplaces

Price monitoring works with all supported marketplaces:
- ✅ ACON3D
- ✅ Gumroad
- ✅ VGEN
- ✅ ArtStation
- ✅ Blender Market

## Price Check Rate Limiting

To avoid overwhelming marketplace servers:
- 1 second delay between checking each asset
- 2 second delay between checking each user (in cron job)

## Troubleshooting

**Prices not updating?**
- Check that the asset has a valid URL
- Verify the marketplace page is still accessible
- Some marketplaces may block automated requests

**Cron not running?**
- Vercel Cron requires a Pro or Enterprise plan
- Check the Deployments → Cron tab in Vercel Dashboard
- Verify the cron endpoint is accessible

**False sale detection?**
- The system compares scraped prices with stored prices
- If a marketplace changes their HTML structure, scraping may fail
- Check the browser console for scraping errors
