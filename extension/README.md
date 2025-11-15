# YuyuAsset Manager - Browser Extension 💜

One-click save assets from ACON3D, Gumroad, VGEN, ArtStation, and more!

## Features

- 🚀 **One-Click Save** - Floating button appears on asset pages
- 🎯 **Auto-Extract** - Automatically detects title, price, thumbnail, and platform
- 💾 **Instant Sync** - Saves directly to your YuyuAsset Manager
- 🌐 **Multi-Platform** - Works on ACON3D, Gumroad, VGEN, ArtStation, Blender Market

## Installation

### For Development/Testing:

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `extension` folder
5. The extension should now appear in your extensions list!

### First-Time Setup:

1. Click the YuyuAsset extension icon in your browser
2. Copy your User ID from the YuyuAsset dashboard
3. Paste it into the extension and click "Connect Account"
4. Done! You're ready to save assets!

## How to Use

### Method 1: Floating Button
1. Browse to any asset page (ACON3D, Gumroad, etc.)
2. Look for the purple **"Add to YuyuAsset"** button (bottom-right)
3. Click it - that's it!

### Method 2: Extension Popup
1. While on an asset page, click the extension icon
2. Click **"💾 Save Current Page"**
3. Done!

## Supported Platforms

- ✅ ACON3D
- ✅ Gumroad
- ✅ VGEN
- ✅ ArtStation Marketplace
- ✅ Blender Market
- ✅ CGTrader (coming soon)
- ✅ TurboSquid (coming soon)

## Troubleshooting

**Extension button doesn't appear?**
- Make sure you're on a supported marketplace
- Refresh the page
- Check if the extension is enabled in `chrome://extensions/`

**"Cannot extract data" error?**
- Some platforms have different page structures
- Try using the "Add Asset" button in the YuyuAsset dashboard instead

**Not saving to Firebase?**
- Make sure you're logged into YuyuAsset
- Check that your User ID is correct in extension settings

## Creating Icons

The extension needs 3 icon sizes. You can create them using any image editor:

1. Create a purple/pink gradient circle with a heart or asset icon
2. Export as PNG in these sizes:
   - `icons/icon16.png` (16x16px)
   - `icons/icon48.png` (48x48px)
   - `icons/icon128.png` (128x128px)

Or use an online tool like [https://favicon.io/](https://favicon.io/)

## Development

Want to modify the extension? Here's the structure:

```
extension/
├── manifest.json       # Extension configuration
├── content.js          # Runs on asset pages, extracts data
├── content.css         # Styles for floating button
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── icons/              # Extension icons
└── README.md           # This file!
```

Make your changes, then reload the extension in `chrome://extensions/`

## Privacy

- Extension only requests permission to access marketplaces
- No data is collected or sent anywhere except your YuyuAsset account
- Your User ID is stored locally in Chrome's sync storage
- Open source - check the code yourself!

---

Made with 💜 by YuyuAsset Team
