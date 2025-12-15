// YuyuAsset Manager - Background Service Worker
// This runs in the background and handles messages from content scripts

// Auto-detect: try localhost first, fallback to production
const URLS = {
  local: 'http://localhost:3000',
  production: 'https://pebblz.xyz'
};

let YUYU_ASSET_URL = URLS.production; // Default to production

// Check if localhost is available
async function detectServer() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    const response = await fetch(`${URLS.local}/api/health`, {
      method: 'HEAD',
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(timeout);

    if (response && response.ok) {
      YUYU_ASSET_URL = URLS.local;
      console.log('🏠 Background: Using localhost');
    } else {
      YUYU_ASSET_URL = URLS.production;
      console.log('🌐 Background: Using production (pebblz.xyz)');
    }
  } catch (e) {
    YUYU_ASSET_URL = URLS.production;
    console.log('🌐 Background: Using production (pebblz.xyz)');
  }
}

// Detect server on startup
detectServer();

// Listen for messages from content script (Quick Add button)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📥 Background received message:', request.action);

  if (request.action === 'addAsset') {
    // Handle async operation
    (async () => {
      try {
        const success = await handleAddAsset(request.data);
        console.log('✅ Sending response:', success);
        sendResponse({ success });
      } catch (error) {
        console.error('❌ Error in addAsset:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for async response
  }

  if (request.action === 'bulkAddAssets') {
    // Handle async operation
    (async () => {
      try {
        const result = await handleBulkAddAssets(request.data);
        sendResponse(result);
      } catch (error) {
        console.error('❌ Error in bulkAddAssets:', error);
        sendResponse({ success: false, count: 0, error: error.message });
      }
    })();
    return true;
  }
});

// Handle adding a single asset
async function handleAddAsset(assetData) {
  console.log('🚀 handleAddAsset started');

  // Make sure we have the right server URL
  await detectServer();

  try {
    const { apiKey, defaultStatus, selectedProject } = await chrome.storage.sync.get(['apiKey', 'defaultStatus', 'selectedProject']);
    const status = defaultStatus || 'wishlist';

    if (!apiKey) {
      console.error('❌ No API key found');
      throw new Error('Please connect your account in the extension popup');
    }

    console.log('💾 Saving asset:', assetData.title);
    console.log('👤 User ID:', apiKey.substring(0, 8) + '...');
    console.log('📁 Status:', status);
    console.log('📂 Project:', selectedProject || 'None');

    // Save directly without duplicate check (faster)
    console.log('📡 Calling API...');

    const response = await fetch(`${YUYU_ASSET_URL}/api/add-asset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: apiKey,
        status: status,
        projectId: selectedProject || null,
        ...assetData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📦 API Response:', result);

    if (result.success) {
      console.log('✅ Asset saved successfully!');

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Asset Saved!',
        message: `"${assetData.title}" added to ${status}`,
        priority: 1
      });

      return true;
    } else {
      throw new Error(result.error || 'Unknown API error');
    }
  } catch (error) {
    console.error('💥 Error saving asset:', error);

    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Failed to Save',
      message: error.message || 'Network error',
      priority: 2
    });

    return false;
  }
}

// Handle bulk adding assets
async function handleBulkAddAssets(assetsArray) {
  const { apiKey, defaultStatus, selectedProject } = await chrome.storage.sync.get(['apiKey', 'defaultStatus', 'selectedProject']);
  const status = defaultStatus || 'wishlist';

  if (!apiKey) {
    console.error('❌ No API key found');
    return { success: false, count: 0 };
  }

  let successCount = 0;
  let failCount = 0;

  console.log(`🚀 Starting bulk import with status: ${status}, project: ${selectedProject}`);

  for (const assetData of assetsArray) {
    try {
      console.log(`💾 Saving asset ${successCount + failCount + 1}/${assetsArray.length}:`, assetData.title);

      const response = await fetch(`${YUYU_ASSET_URL}/api/add-asset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: apiKey,
          status: status,
          projectId: selectedProject || null,
          ...assetData
        })
      });

      const result = await response.json();

      if (result.success) {
        successCount++;
        console.log(`✅ ${successCount}/${assetsArray.length} saved successfully`);
      } else {
        failCount++;
        console.error(`❌ Failed to save ${assetData.title}:`, result.error);
      }
    } catch (error) {
      failCount++;
      console.error(`💥 Error saving ${assetData.title}:`, error);
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`🎉 Bulk import complete! Success: ${successCount}, Failed: ${failCount}`);

  // Show completion notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Bulk Import Complete',
    message: `Saved ${successCount} assets. Failed: ${failCount}`,
    priority: 1
  });

  return { success: true, count: successCount, failed: failCount };
}

console.log('🎨 YuyuAsset background service worker loaded!');
