// ENHANCED VERSION: Load data only when user logs in
// const API_BASE_URL = 'https://oppzai-production-c5c3.up.railway.app/api';
const API_BASE_URL = 'http://localhost:5006/api/api'; // For development

console.log('🚀 formControl.init.js loaded, API_BASE_URL:', API_BASE_URL);

// Field mapping for display
const fieldMapping = {
  'FirstName': 'First name',
  'LastName': 'Last name',
  'PhoneNumber': 'Mobile phone number',
  'Email': 'Email',
  'City': 'City',
  'YearsOfExperience': 'Years of experience'
};

// Reverse mapping
const reverseFieldMapping = {
  'First name': 'FirstName',
  'Last name': 'LastName',
  'Mobile phone number': 'PhoneNumber',
  'Phone number': 'PhoneNumber',
  'Email': 'Email',
  'City': 'City',
  'Years of experience': 'YearsOfExperience',
  'Experience': 'YearsOfExperience'
};

// Auto-sync configuration - MODIFIED: Disabled auto-loading
const AUTO_SYNC_CONFIG = {
  enabled: false, // Changed from true to false
  interval: 30000, // 30 seconds
  retryInterval: 5000, // 5 seconds on error
  maxRetries: 3,
  backgroundSync: false // Changed from true to false
};

// Track initialization state
let isInitialized = false;
let syncInterval = null;
let authCheckInterval = null;
let formManagerWatcher = null;

// Get authentication headers for API calls
async function getAuthHeaders() {
  try {
    console.log('🔐 Getting auth headers...');
    const result = await chrome.storage.local.get(['authToken', 'user']);
    console.log('🔐 Auth data retrieved:', { 
      hasToken: !!result.authToken, 
      hasUser: !!result.user,
      userEmail: result.user?.email 
    });
    
    if (!result.authToken || !result.user) {
      throw new Error('User not authenticated');
    }
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${result.authToken}`
    };
  } catch (error) {
    console.error('❌ Error getting auth headers:', error);
    throw error;
  }
}

// Get user email for API calls
async function getUserEmail() {
  try {
    console.log('📧 Getting user email...');
    const result = await chrome.storage.local.get(['user']);
    console.log('📧 User data:', result.user);
    
    if (!result.user || !result.user.email) {
      throw new Error('User email not found');
    }
    console.log('📧 User email found:', result.user.email);
    return result.user.email;
  } catch (error) {
    console.error('❌ Error getting user email:', error);
    throw error;
  }
}

// Save configurations to backend with better error handling
async function saveConfigurationsToBackend(configurations) {
  console.log('💾 Starting saveConfigurationsToBackend...');
  try {
    const headers = await getAuthHeaders();
    const email = await getUserEmail();
    
    // Add email to each config
    const configsWithEmail = configurations.map(config => ({
      ...config,
      email: email,
      updatedAt: new Date().toISOString()
    }));
    
    console.log('💾 Saving configurations to backend:', {
      count: configsWithEmail.length,
      email: email,
      firstConfig: configsWithEmail[0]
    });
    
    const saveUrl = `${API_BASE_URL}/inputs/save-inputconfigs`;
    console.log('💾 Save URL:', saveUrl);
    
    const response = await fetch(saveUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(configsWithEmail)
    });

    console.log('💾 Save response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('💾 Save error response text:', errorText);
      
      if (response.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      }
      if (response.status === 404) {
        throw new Error(`Save API endpoint not found. URL: ${saveUrl}`);
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.warn('💾 Non-JSON response from save endpoint:', responseText);
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();
    console.log('💾 Save response data:', data);

    if (data.success !== undefined && !data.success) {
      throw new Error(data.message || 'Failed to save configurations');
    }

    return data;

  } catch (error) {
    console.error('❌ Error saving configurations to backend:', error);
    throw error;
  }
}

// Fetch configurations from backend with better debugging
async function fetchConfigurationsFromBackend() {
  console.log('📥 Starting fetchConfigurationsFromBackend...');
  try {
    const headers = await getAuthHeaders();
    const email = await getUserEmail();
    
    const fetchUrl = `${API_BASE_URL}/inputs/get-inputconfigs?email=${encodeURIComponent(email)}`;
    console.log('📥 Fetch URL:', fetchUrl);
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: headers
    });

    console.log('📥 Fetch response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📥 Fetch error response text:', errorText);
      
      if (response.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      }
      if (response.status === 404) {
        throw new Error(`Fetch API endpoint not found. URL: ${fetchUrl}`);
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('📥 Non-JSON response:', responseText);
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();
    console.log('📥 Fetch response data:', data);

    // Handle different possible response structures
    let configs = [];
    if (data.success !== undefined) {
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch configurations');
      }
      configs = data.configs || data.data || [];
    } else if (Array.isArray(data)) {
      configs = data;
    } else if (data.inputConfigs) {
      configs = data.inputConfigs;
    } else {
      configs = data.configs || [];
    }

    console.log('📥 Processed configs:', { count: configs.length, configs });
    return configs;

  } catch (error) {
    console.error('❌ Error fetching configurations from backend:', error);
    throw error;
  }
}

// Update progress indicator
function updateProgressIndicator() {
  console.log('📊 Updating progress indicator...');
  chrome.storage.local.get(['defaultFields'], function (result) {
    const defaultFields = result.defaultFields || {};
    console.log('📊 Default fields:', defaultFields);
    
    const requiredFields = ['YearsOfExperience', 'FirstName', 'LastName', 'PhoneNumber', 'City', 'Email'];

    let filledCount = 0;
    requiredFields.forEach(field => {
      if (defaultFields[field] && defaultFields[field].trim()) {
        filledCount++;
        const input = document.querySelector(`input[name="${field}"]`);
        if (input) input.value = defaultFields[field];
      }
    });

    console.log('📊 Progress:', { filledCount, total: requiredFields.length });

    const percentage = (filledCount / requiredFields.length) * 100;
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    
    if (progressText) {
      progressText.textContent = `${filledCount}/${requiredFields.length} fields completed`;
    }
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    if (progressFill) {
      if (percentage === 100) {
        progressFill.style.backgroundColor = '#4caf50';
      } else if (percentage >= 50) {
        progressFill.style.backgroundColor = '#ff9800';
      } else {
        progressFill.style.backgroundColor = '#f44336';
      }
    }
  });
}

// Update sync status
function updateSyncStatus() {
  console.log('🔄 Updating sync status...');
  chrome.storage.local.get(['inputFieldConfigs'], function (result) {
    const inputFieldConfigs = result.inputFieldConfigs || [];
    console.log('🔄 Input field configs:', { count: inputFieldConfigs.length, configs: inputFieldConfigs });
    
    const syncStatus = document.getElementById('sync-status');

    const syncedFields = inputFieldConfigs.filter(config =>
      config.defaultValue && config.defaultValue.trim() !== ''
    );

    console.log('🔄 Synced fields:', { count: syncedFields.length });

    if (syncStatus) {
      if (syncedFields.length > 0) {
        syncStatus.textContent = `${syncedFields.length} fields synced from server`;
        syncStatus.style.color = '#4caf50';
      } else {
        syncStatus.textContent = 'No data synced yet';
        syncStatus.style.color = '#666';
      }
    }
  });
}

// Show sync panel
function showSyncInfo() {
  console.log('ℹ️ Showing sync info...');
  chrome.storage.local.get(['inputFieldConfigs'], function (result) {
    const inputFieldConfigs = result.inputFieldConfigs || [];
    const syncPanel = document.getElementById('sync-info-panel');
    const syncDetails = document.getElementById('sync-details');

    console.log('ℹ️ Sync panel elements:', { 
      hasSyncPanel: !!syncPanel, 
      hasSyncDetails: !!syncDetails,
      configCount: inputFieldConfigs.length 
    });

    if (syncPanel && syncDetails) {
      if (inputFieldConfigs.length > 0) {
        syncDetails.innerHTML = '';
        inputFieldConfigs.forEach(config => {
          const item = document.createElement('div');
          item.style.cssText = 'margin-bottom: 5px; font-size: 12px;';
          item.innerHTML = `
            <strong>${config.placeholderIncludes}:</strong>
            ${config.defaultValue || 'No value'}
            <span style="color: #666;">(used ${config.count || 0} times)</span>
            ${config.updatedAt ? `<br><small>Updated: ${new Date(config.updatedAt).toLocaleString()}</small>` : ''}
          `;
          syncDetails.appendChild(item);
        });
        syncPanel.style.display = 'block';
        console.log('ℹ️ Sync panel populated with', inputFieldConfigs.length, 'items');
      } else {
        syncPanel.style.display = 'none';
        console.log('ℹ️ Sync panel hidden - no configs');
      }
    }
  });
}

// Show loading state for sync button
function showSyncLoading(button, isLoading) {
  console.log('⏳ Sync loading state:', isLoading);
  if (!button) {
    console.warn('⚠️ No sync button found');
    return;
  }
  
  if (isLoading) {
    button.textContent = '🔄 Syncing...';
    button.disabled = true;
    button.style.opacity = '0.7';
  } else {
    button.textContent = '🔄 Sync with Server Data';
    button.disabled = false;
    button.style.opacity = '1';
  }
}

// Show status message
function showStatusMessage(message, type = 'info') {
  console.log('💬 Status message:', { message, type });
  
  // Remove existing status messages
  const existingMessages = document.querySelectorAll('.sync-status-message');
  existingMessages.forEach(msg => msg.remove());

  const messageDiv = document.createElement('div');
  messageDiv.className = 'sync-status-message';
  messageDiv.style.cssText = `
    padding: 10px 15px;
    margin: 10px 0;
    border-radius: 4px;
    font-size: 14px;
    ${type === 'error' ? 
      'background-color: #fee; border: 1px solid #fcc; color: #c33;' : 
      type === 'success' ?
      'background-color: #efe; border: 1px solid #cfc; color: #3c3;' :
      'background-color: #e7f3ff; border: 1px solid #b3d9ff; color: #0066cc;'
    }
  `;
  messageDiv.textContent = message;

  const syncButton = document.getElementById('sync-button');
  if (syncButton && syncButton.parentNode) {
    syncButton.parentNode.insertBefore(messageDiv, syncButton.nextSibling);
    console.log('💬 Status message added to DOM');
  } else {
    console.warn('⚠️ Could not add status message - no sync button or parent');
    document.body.appendChild(messageDiv);
  }

  // Auto-remove messages after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
      console.log('💬 Status message auto-removed');
    }
  }, 5000);
}

// Enhanced sync function with backend integration
async function performSync() {
  console.log('🔄 Starting performSync...');
  try {
    // Check authentication first
    const authResult = await chrome.storage.local.get(['authToken', 'user']);
    console.log('🔄 Auth check:', { hasToken: !!authResult.authToken, hasUser: !!authResult.user });
    
    if (!authResult.authToken || !authResult.user) {
      console.log('🔄 Not authenticated, skipping sync');
      return;
    }

    // Get current data from storage
    const result = await chrome.storage.local.get(['inputFieldConfigs', 'defaultFields']);
    const inputConfigs = result.inputFieldConfigs || [];
    const defaultFields = result.defaultFields || {};

    console.log('🔄 Current data:', { 
      inputConfigsCount: inputConfigs.length,
      defaultFieldsKeys: Object.keys(defaultFields)
    });

    const updatedDefaults = { ...defaultFields };
    const fieldMap = {
      'First Name': 'FirstName',
      'Last Name': 'LastName',
      'Email': 'Email',
      'Phone Number': 'PhoneNumber',
      'Mobile Phone Number': 'PhoneNumber',
      'City': 'City',
      'Years of Experience': 'YearsOfExperience',
      'Experience': 'YearsOfExperience'
    };

    // 1. Populate defaultFields from inputFieldConfigs
    inputConfigs.forEach(config => {
      const match = fieldMap[config.placeholderIncludes.trim()];
      if (match && config.defaultValue && config.defaultValue.trim() !== "") {
        updatedDefaults[match] = config.defaultValue.trim();
        console.log('🔄 Mapped field:', config.placeholderIncludes, '->', match, '=', config.defaultValue);
      }
    });

    // 2. Save to defaultFields
    await chrome.storage.local.set({ defaultFields: updatedDefaults });
    console.log('🔄 Updated default fields:', updatedDefaults);

    // 3. Create configurations from defaultFields (reverse sync)
    const currentConfigsResult = await chrome.storage.local.get(['inputFieldConfigs']);
    const currentConfigs = currentConfigsResult.inputFieldConfigs || [];
    const updatedConfigs = [...currentConfigs];
    const newFromDefaults = [];

    for (const [key, value] of Object.entries(updatedDefaults)) {
      if (!value || !value.trim()) continue;

      const displayName = fieldMapping[key];
      if (!displayName) continue;

      const existing = updatedConfigs.find(cfg =>
        cfg.placeholderIncludes?.trim().toLowerCase() === displayName.toLowerCase()
      );

      if (existing) {
        existing.defaultValue = value;
        existing.updatedAt = new Date().toISOString();
        console.log('🔄 Updated existing config:', displayName);
      } else {
        const newConfig = {
          placeholderIncludes: displayName,
          defaultValue: value,
          count: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        newFromDefaults.push(newConfig);
        console.log('🔄 Created new config:', newConfig);
      }
    }

    const finalConfigs = [...updatedConfigs, ...newFromDefaults];
    console.log('🔄 Final configs:', { count: finalConfigs.length });

    // 4. Save to backend first, then local storage
    try {
      await saveConfigurationsToBackend(finalConfigs);
      console.log('✅ Successfully synced with server!');
    } catch (backendError) {
      console.warn('🔄 Backend sync failed, saving locally:', backendError);
    }

    // 5. Save to local storage
    await chrome.storage.local.set({ inputFieldConfigs: finalConfigs });
    console.log('🔄 Saved to local storage');

    // 6. Update displays
    updateUI();

  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// Check authentication status
async function checkAuthStatus() {
  console.log('🔐 Checking auth status...');
  try {
    const result = await chrome.storage.local.get(['authToken', 'user']);
    console.log('🔐 Auth status result:', { 
      hasToken: !!result.authToken, 
      hasUser: !!result.user,
      userEmail: result.user?.email 
    });
    
    const syncButton = document.getElementById('sync-button');
    
    if (!result.authToken || !result.user) {
      if (syncButton) {
        syncButton.style.opacity = '0.5';
        syncButton.title = 'Please log in to sync with server';
      }
      return false;
    } else {
      if (syncButton) {
        syncButton.style.opacity = '1';
        syncButton.title = 'Sync with server and local data';
      }
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking auth status:', error);
    return false;
  }
}

// MODIFIED: Load data from server only when authenticated
async function loadDataFromServer() {
  console.log('🔄 Loading data from server...');
  try {
    const isAuthenticated = await checkAuthStatus();
    if (!isAuthenticated) {
      console.log('🔄 Not authenticated, skipping server data load');
      return false;
    }

    const configs = await fetchConfigurationsFromBackend();
    await chrome.storage.local.set({ 
      inputFieldConfigs: configs,
      lastDataLoad: new Date().toISOString()
    });
    console.log('✅ Server data load successful, configs:', configs.length);
    
    // Convert to defaultFields format
    const defaultFields = {};
    const fieldMap = {
      'First Name': 'FirstName',
      'First name': 'FirstName',
      'Last Name': 'LastName',
      'Last name': 'LastName',
      'Email': 'Email',
      'Phone Number': 'PhoneNumber',
      'Mobile Phone Number': 'PhoneNumber',
      'Mobile phone number': 'PhoneNumber',
      'City': 'City',
      'Years of Experience': 'YearsOfExperience',
      'Years of experience': 'YearsOfExperience',
      'Experience': 'YearsOfExperience'
    };

    configs.forEach(config => {
      const match = fieldMap[config.placeholderIncludes?.trim()];
      if (match && config.defaultValue && config.defaultValue.trim() !== "") {
        defaultFields[match] = config.defaultValue.trim();
      }
    });

    await chrome.storage.local.set({ defaultFields });
    console.log('✅ Default fields updated from server data:', defaultFields);
    
    updateUI();
    return true;
    
  } catch (error) {
    console.error('❌ Server data load failed:', error);
    return false;
  }
}

// Update UI elements
function updateUI() {
  console.log('🎨 Updating UI...');
  updateProgressIndicator();
  updateSyncStatus();
  showSyncInfo();
  
  // Update formManager if available
  if (typeof window.formManager !== 'undefined' && window.formManager) {
    chrome.storage.local.get(['inputFieldConfigs'], (result) => {
      const configs = result.inputFieldConfigs || [];
      window.formManager.displayAndUpdateInputFieldConfig(configs);
    });
  }
}

// MODIFIED: Only start sync intervals when authenticated
function startAutoSync() {
  console.log('🔄 Checking if auto-sync should start...');
  
  // Don't start auto-sync if disabled in config
  if (!AUTO_SYNC_CONFIG.enabled) {
    console.log('🔄 Auto-sync disabled in config');
    return;
  }
  
  // Check authentication before starting
  checkAuthStatus().then(isAuth => {
    if (!isAuth) {
      console.log('🔄 Not authenticated, auto-sync not started');
      return;
    }
    
    console.log('🔄 Starting auto-sync intervals...');
    
    // Clear existing intervals
    if (syncInterval) clearInterval(syncInterval);
    if (authCheckInterval) clearInterval(authCheckInterval);
    
    // Auto-sync every 30 seconds
    syncInterval = setInterval(async () => {
      console.log('🔄 Auto-sync triggered...');
      await performSync();
    }, AUTO_SYNC_CONFIG.interval);
    
    // Check auth status every 10 seconds
    authCheckInterval = setInterval(async () => {
      console.log('🔐 Auto-auth check...');
      const stillAuth = await checkAuthStatus();
      if (!stillAuth) {
        console.log('🔐 Auth lost, stopping auto-sync');
        stopAutoSync();
      }
    }, 10000);
    
    console.log('✅ Auto-sync intervals started');
  });
}

// Stop auto-sync intervals
function stopAutoSync() {
  console.log('⏹️ Stopping auto-sync intervals...');
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
    authCheckInterval = null;
  }
  console.log('✅ Auto-sync intervals stopped');
}

// Watch for formManager availability
function watchForFormManager() {
  if (formManagerWatcher) return;
  
  console.log('👀 Starting formManager watcher...');
  formManagerWatcher = setInterval(() => {
    if (window.formManager && !window.formManagerReady) {
      console.log('✅ FormManager detected, triggering update...');
      window.formManagerReady = true;
      updateUI();
    }
  }, 1000);
}

// MODIFIED: Initialize only basic components, not auto-loading
async function initializeBasicComponents() {
  if (isInitialized) {
    console.log('⚠️ Already initialized, skipping...');
    return;
  }
  
  console.log('🚀 Initializing basic components...');
  isInitialized = true;
  
  // Check authentication but don't auto-load data
  const isAuthenticated = await checkAuthStatus();
  console.log('🔐 Initial auth status:', isAuthenticated);
  
  // Watch for formManager
  watchForFormManager();
  
  // Initial UI update with existing data only
  updateUI();
  
  console.log('✅ Basic components initialized (no auto data loading)');
}

// NEW: Function specifically for loading data after login
async function initializeAfterLogin() {
  console.log('🔑 Initializing after login...');
  
  try {
    // Load data from server
    const dataLoaded = await loadDataFromServer();
    
    if (dataLoaded) {
      console.log('✅ Data loaded after login');
      
      // Start auto-sync if enabled and authenticated
      if (AUTO_SYNC_CONFIG.enabled) {
        startAutoSync();
      }
    }
    
    // Update UI
    updateUI();
    
  } catch (error) {
    console.error('❌ Error initializing after login:', error);
  }
}

// Enhanced event listeners
function setupEventListeners() {
  console.log('🎯 Setting up event listeners...');
  
  // Listen for authentication changes
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local') {
      if (changes.authToken || changes.user) {
        console.log('🔐 Auth status changed:', changes);
        await checkAuthStatus();
        
        // If user just logged in, load their data and start auto-sync
        if (changes.authToken && changes.authToken.newValue && changes.user && changes.user.newValue) {
          console.log('🔐 User just logged in, initializing...');
          setTimeout(async () => {
            await initializeAfterLogin();
          }, 1000);
        }
        
        // If user logged out, stop auto-sync
        if (changes.authToken && !changes.authToken.newValue) {
          console.log('🔐 User logged out, stopping auto-sync');
          stopAutoSync();
        }
      }
      
      // Listen for data changes and update UI
      if (changes.inputFieldConfigs || changes.defaultFields) {
        console.log('📊 Data changed, updating UI...');
        updateUI();
      }
      
      // Listen for login success message
      if (changes.lastDataLoad) {
        console.log('📥 Data freshly loaded, updating UI...');
        updateUI();
      }
    }
  });
  
  // Listen for messages from other parts of the extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Message received:', message);
    
    if (message.type === 'LOGIN_SUCCESS') {
      console.log('🔑 Login success message received');
      setTimeout(async () => {
        await initializeAfterLogin();
      }, 500);
    }
    
    if (message.action === 'LOAD_USER_DATA') {
      console.log('📥 Load user data request received');
      loadDataFromServer().then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // Keep message channel open for async response
    }
  });
  
  // Listen for visibility changes to refresh when tab becomes active (only if authenticated)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      const isAuth = await checkAuthStatus();
      if (isAuth) {
        console.log('👁️ Tab became visible and user is authenticated, refreshing data...');
        await loadDataFromServer();
      }
    }
  });
  
  // Listen for focus events (only if authenticated)
  window.addEventListener('focus', async () => {
    const isAuth = await checkAuthStatus();
    if (isAuth) {
      console.log('🎯 Window focused and user is authenticated, refreshing data...');
      await loadDataFromServer();
    }
  });
  
  console.log('✅ Event listeners set up');
}

// Initialize basic components when script loads (no data loading)
(async function immediateInit() {
  console.log('⚡ Immediate basic initialization starting...');
  
  // Set up event listeners first
  setupEventListeners();
  
  // Wait for DOM if not ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBasicComponents);
  } else {
    // DOM already loaded, initialize basic components immediately
    await initializeBasicComponents();
  }
  
  // Also handle the case where DOMContentLoaded already fired
  setTimeout(async () => {
    if (!isInitialized) {
      console.log('🔄 Fallback basic initialization...');
      await initializeBasicComponents();
    }
  }, 100);
})();

// Enhanced sync button handler (if it exists)
document.addEventListener('DOMContentLoaded', function() {
  const syncButton = document.getElementById('sync-button');
  if (syncButton) {
    syncButton.addEventListener('click', async function () {
      console.log('🔄 Manual sync button clicked');
      const isAuth = await checkAuthStatus();
      
      if (!isAuth) {
        if (confirm('You need to log in to sync with the server. Would you like to go to the login page?')) {
          window.location.href = chrome.runtime.getURL('popup/auth/login.html');
        }
        return;
      }

      showSyncLoading(syncButton, true);
      
      try {
        await performSync();
        await loadDataFromServer();
        showStatusMessage('Successfully synced!', 'success');
      } catch (error) {
        console.error('❌ Manual sync error:', error);
        showStatusMessage('Sync failed: ' + error.message, 'error');
      } finally {
        showSyncLoading(syncButton, false);
      }
    });
  }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  stopAutoSync();
  if (formManagerWatcher) {
    clearInterval(formManagerWatcher);
    formManagerWatcher = null;
  }
});

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateProgressIndicator,
    updateSyncStatus,
    showSyncInfo,
    performSync,
    checkAuthStatus,
    saveConfigurationsToBackend,
    fetchConfigurationsFromBackend,
    initializeBasicComponents,
    initializeAfterLogin,
    startAutoSync,
    stopAutoSync,
    loadDataFromServer
  };
}

console.log('🚀 Enhanced formControl.init.js fully loaded (login-triggered data loading)');