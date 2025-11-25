// MyPebbles Manager - Popup Script

const YUYU_ASSET_URL = 'https://yuyu-kit.vercel.app';

// Load settings and render popup
async function init() {
  const { apiKey } = await chrome.storage.sync.get(['apiKey']);

  if (!apiKey) {
    renderSetup();
  } else {
    // Fetch projects from Firebase when connected
    await fetchProjects();
    renderMain();
  }
}

function renderSetup() {
  document.getElementById('content').innerHTML = `
    <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; backdrop-filter: blur(10px);">
      <h2 style="font-size: 18px; margin-bottom: 12px;">Welcome! 👋</h2>
      <p style="font-size: 14px; margin-bottom: 16px; opacity: 0.9;">
        Connect the extension to your MyPebbles account to start saving assets!
      </p>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 13px; margin-bottom: 6px; opacity: 0.9;">
          Your Firebase User ID:
        </label>
        <input
          type="text"
          id="apiKey"
          placeholder="Paste your User ID here..."
          style="width: 100%; padding: 10px; border-radius: 6px; border: none; font-size: 13px;"
        />
      </div>

      <button class="btn" id="saveBtn">Connect Account</button>

      <p style="font-size: 12px; opacity: 0.7; margin-top: 12px;">
        Find your User ID in the MyPebbles dashboard (click your profile)
      </p>
    </div>
  `;

  document.getElementById('saveBtn').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (apiKey) {
      await chrome.storage.sync.set({ apiKey });
      renderMain();
    } else {
      alert('Please enter your User ID');
    }
  });
}

async function renderMain() {
  const { defaultStatus, selectedProject, projects } = await chrome.storage.sync.get(['defaultStatus', 'selectedProject', 'projects']);
  const status = defaultStatus || 'wishlist';
  const projectsList = projects || [];

  document.getElementById('content').innerHTML = `
    <div class="status">
      <div class="status-item">
        <span class="status-label">Status</span>
        <span class="status-value">✅ Connected</span>
      </div>
      <div class="status-item">
        <span class="status-label">Platform</span>
        <span class="status-value" id="platform">Detecting...</span>
      </div>
    </div>

    <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 14px; margin-bottom: 12px; backdrop-filter: blur(10px);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <label style="font-size: 13px; font-weight: 600; opacity: 0.9;">
          Save as:
        </label>
      </div>

      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <label style="flex: 1; cursor: pointer;">
          <input type="radio" name="status" value="wishlist" ${status === 'wishlist' ? 'checked' : ''} style="display: none;" class="status-radio">
          <div class="radio-btn ${status === 'wishlist' ? 'active' : ''}" data-status="wishlist">
            <div style="font-size: 18px; margin-bottom: 2px;">📌</div>
            <div style="font-size: 10px;">Wishlist</div>
          </div>
        </label>
        <label style="flex: 1; cursor: pointer;">
          <input type="radio" name="status" value="bought" ${status === 'bought' ? 'checked' : ''} style="display: none;" class="status-radio">
          <div class="radio-btn ${status === 'bought' ? 'active' : ''}" data-status="bought">
            <div style="font-size: 18px; margin-bottom: 2px;">✅</div>
            <div style="font-size: 10px;">Bought</div>
          </div>
        </label>
        <label style="flex: 1; cursor: pointer;">
          <input type="radio" name="status" value="in-use" ${status === 'in-use' ? 'checked' : ''} style="display: none;" class="status-radio">
          <div class="radio-btn ${status === 'in-use' ? 'active' : ''}" data-status="in-use">
            <div style="font-size: 18px; margin-bottom: 2px;">🎨</div>
            <div style="font-size: 10px;">In Use</div>
          </div>
        </label>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <label style="font-size: 12px; opacity: 0.9;">
            Project (optional):
          </label>
          <button id="refreshProjects" style="background: none; border: none; color: white; cursor: pointer; opacity: 0.7; font-size: 16px; padding: 0;" title="Refresh projects">
            🔄
          </button>
        </div>
        <select id="projectSelect" style="width: 100%; padding: 8px; border-radius: 6px; border: none; font-size: 12px; color: #3b82f6;">
          <option value="">No Project</option>
          ${projectsList.map(p => `<option value="${p.id}" ${selectedProject === p.id ? 'selected' : ''}>${p.icon || '📁'} ${p.name}</option>`).join('')}
        </select>
      </div>
    </div>

    <button class="btn" id="addCurrentBtn">
      💾 Save Current Page
    </button>

    <div id="infoMessage" style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 10px; margin: 12px 0; font-size: 11px; line-height: 1.4; opacity: 0.9;">
      <div style="margin-bottom: 4px;">ℹ️ <strong>Note:</strong></div>
      Auto-fill isn't perfect! Please double-check the creator/brand and price fields before saving.
    </div>

    <button class="btn btn-secondary" id="openDashboardBtn">
      🏠 Open Dashboard
    </button>

    <button class="btn btn-secondary" id="settingsBtn">
      ⚙️ Settings
    </button>

    <div class="footer">
      Made with 💜 by MyPebbles
    </div>
  `;

  // Detect current platform and check if it's a product page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const url = new URL(tabs[0].url);
      let platform = 'Unknown';
      let isProductPage = false;

      if (url.hostname.includes('acon3d')) {
        platform = 'ACON3D';
        // Check if it's a product page: /en/product/123 or /ko/product/123 or /ja/product/123
        isProductPage = /\/(en|ko|ja)\/product\/\d+/.test(url.pathname);
      } else if (url.hostname.includes('clip-studio')) {
        platform = 'CSP Asset';
        // Check if it's a detail page: /detail?id=
        isProductPage = url.search.includes('detail?id=');
      } else if (url.hostname.includes('gumroad')) {
        platform = 'Gumroad';
      } else if (url.hostname.includes('vgen')) {
        platform = 'VGEN';
      } else if (url.hostname.includes('artstation')) {
        platform = 'ArtStation';
      }

      document.getElementById('platform').textContent = platform;

      // Disable button if not on a product page (for ACON3D and CSP)
      const addBtn = document.getElementById('addCurrentBtn');
      const infoMessage = document.getElementById('infoMessage');

      if ((platform === 'ACON3D' || platform === 'CSP Asset') && !isProductPage) {
        addBtn.disabled = true;
        addBtn.textContent = '⚠️ Not a Product Page';
        addBtn.style.opacity = '0.5';
        addBtn.style.cursor = 'not-allowed';

        // Update info message
        infoMessage.innerHTML = `
          <div style="margin-bottom: 4px;">⚠️ <strong>Not on a Product Page</strong></div>
          Navigate to a specific product page to use the Quick Add feature. The button only works on individual ${platform} product pages.
        `;
        infoMessage.style.background = 'rgba(239, 68, 68, 0.2)';
      }
    }
  });

  // Add current page button
  document.getElementById('addCurrentBtn').addEventListener('click', async () => {
    const btn = document.getElementById('addCurrentBtn');
    btn.textContent = '⏳ Saving...';
    btn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(tab.id, { action: 'extractData' }, async (assetData) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          alert('Cannot extract data from this page. Make sure you\'re on a supported marketplace!');
          btn.textContent = '💾 Save Current Page';
          btn.disabled = false;
          return;
        }

        if (assetData) {
          const success = await saveAsset(assetData);
          if (success) {
            btn.textContent = '✅ Saved!';
            setTimeout(() => {
              btn.textContent = '💾 Save Current Page';
              btn.disabled = false;
            }, 2000);
          } else {
            btn.textContent = '❌ Failed';
            setTimeout(() => {
              btn.textContent = '💾 Save Current Page';
              btn.disabled = false;
            }, 2000);
          }
        }
      });
    } catch (error) {
      console.error('Error:', error);
      btn.textContent = '❌ Error';
      setTimeout(() => {
        btn.textContent = '💾 Save Current Page';
        btn.disabled = false;
      }, 2000);
    }
  });

  // Open dashboard button
  document.getElementById('openDashboardBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: YUYU_ASSET_URL });
  });

  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    renderSettings();
  });

  // Status radio buttons
  document.querySelectorAll('.radio-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const selectedStatus = btn.dataset.status;
      await chrome.storage.sync.set({ defaultStatus: selectedStatus });
      console.log('✅ Default status saved:', selectedStatus);

      // Update UI
      document.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Project selector
  document.getElementById('projectSelect').addEventListener('change', async (e) => {
    const projectId = e.target.value || null;
    await chrome.storage.sync.set({ selectedProject: projectId });
    console.log('✅ Selected project:', projectId);
  });

  // Refresh projects button
  document.getElementById('refreshProjects').addEventListener('click', async () => {
    const btn = document.getElementById('refreshProjects');
    btn.textContent = '⏳';
    await fetchProjects();
    btn.textContent = '🔄';
  });
}

// Fetch projects from Firebase
async function fetchProjects() {
  const { apiKey } = await chrome.storage.sync.get(['apiKey']);

  if (!apiKey) {
    console.log('No API key, skipping project fetch');
    return;
  }

  try {
    console.log('🔄 Fetching projects from Firebase...');

    const response = await fetch(`${YUYU_ASSET_URL}/api/get-projects?userId=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (result.success) {
      await chrome.storage.sync.set({ projects: result.projects });
      console.log('✅ Projects loaded:', result.projects.length);
      renderMain(); // Re-render to show updated projects
    } else {
      console.error('❌ Failed to fetch projects:', result.error);
    }
  } catch (error) {
    console.error('💥 Error fetching projects:', error);
  }
}

async function renderSettings() {
  const { quickAddEnabled } = await chrome.storage.sync.get(['quickAddEnabled']);
  const isEnabled = quickAddEnabled !== false; // Default to true

  document.getElementById('content').innerHTML = `
    <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; backdrop-filter: blur(10px);">
      <h2 style="font-size: 18px; margin-bottom: 16px;">Settings</h2>

      <div style="background: rgba(255,255,255,0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">Quick Add Button</div>
            <div style="font-size: 11px; opacity: 0.8;">Show floating button on product pages</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="quickAddToggle" ${isEnabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <button class="btn btn-secondary" id="disconnectBtn" style="color: #ef4444; font-weight: 600;">
        🔌 Disconnect Account
      </button>

      <button class="btn btn-secondary" id="backBtn">
        ← Back
      </button>
    </div>
  `;

  document.getElementById('quickAddToggle').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.sync.set({ quickAddEnabled: enabled });
    console.log('✅ Quick Add button:', enabled ? 'enabled' : 'disabled');

    // Send message to content scripts to toggle button
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'toggleQuickAdd',
          enabled: enabled
        }).catch(() => {
          // Ignore errors for tabs without content script
        });
      });
    });
  });

  document.getElementById('disconnectBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to disconnect your account?')) {
      await chrome.storage.sync.remove(['apiKey']);
      renderSetup();
    }
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    renderMain();
  });
}

async function saveAsset(assetData) {
  const { apiKey, defaultStatus, selectedProject } = await chrome.storage.sync.get(['apiKey', 'defaultStatus', 'selectedProject']);
  const status = defaultStatus || 'wishlist';

  if (!apiKey) {
    alert('Please connect your account first!');
    return false;
  }

  try {
    console.log('💾 Saving asset:', assetData);
    console.log('👤 User ID:', apiKey);
    console.log('📁 Status:', status);
    console.log('📂 Project:', selectedProject);

    // Check for duplicates first
    console.log('🔍 Checking for duplicates...');
    const duplicateCheck = await fetch(`${YUYU_ASSET_URL}/api/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: apiKey,
        url: assetData.url
      })
    });

    const duplicateResult = await duplicateCheck.json();
    console.log('📦 Duplicate check response:', duplicateResult);

    if (duplicateResult.success && duplicateResult.isDuplicate) {
      const { existingAsset } = duplicateResult;
      const statusEmoji = existingAsset.status === 'wishlist' ? '📌' : existingAsset.status === 'bought' ? '✅' : '🎨';

      // Add notification to localStorage
      try {
        const notificationsKey = `notifications_${apiKey}`;
        const existingNotifs = localStorage.getItem(notificationsKey);
        const notifications = existingNotifs ? JSON.parse(existingNotifs) : [];

        notifications.push({
          id: `notif_${Date.now()}`,
          type: 'duplicate',
          assetId: existingAsset.id,
          assetTitle: existingAsset.title,
          url: assetData.url,
          timestamp: new Date().toISOString()
        });

        localStorage.setItem(notificationsKey, JSON.stringify(notifications));
        console.log('📬 Notification added to localStorage');
      } catch (e) {
        console.error('Failed to add notification:', e);
      }

      if (!confirm(`⚠️ You already have this asset!\n\n"${existingAsset.title}"\n${statusEmoji} Status: ${existingAsset.status}\n🏪 Platform: ${existingAsset.platform}\n\nDo you want to add it again anyway?`)) {
        console.log('❌ User cancelled - duplicate detected');
        return false;
      }
    }

    // Proceed with saving
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
    console.log('📦 API Response:', result);

    if (result.success) {
      console.log('✅ Asset saved successfully!');
      return true;
    } else {
      console.error('❌ Failed to save:', result.error);
      alert(`Failed to save: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error('💥 Error saving asset:', error);
    alert('Network error. Make sure MyPebbles is running on localhost:3000');
    return false;
  }
}

async function bulkSaveAssets(assetsArray) {
  const { apiKey, defaultStatus, selectedProject } = await chrome.storage.sync.get(['apiKey', 'defaultStatus', 'selectedProject']);
  const status = defaultStatus || 'wishlist';

  if (!apiKey) {
    alert('Please connect your account first!');
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
  return { success: true, count: successCount, failed: failCount };
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addAsset') {
    saveAsset(request.data)
      .then(success => {
        sendResponse({ success });
      })
      .catch(error => {
        console.error('Error in addAsset:', error);
        sendResponse({ success: false });
      });
    return true; // Keep the message channel open for async response
  }

  if (request.action === 'bulkAddAssets') {
    bulkSaveAssets(request.data)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Error in bulkAddAssets:', error);
        sendResponse({ success: false, count: 0 });
      });
    return true; // Keep the message channel open for async response
  }
});

// Initialize on load
init();
