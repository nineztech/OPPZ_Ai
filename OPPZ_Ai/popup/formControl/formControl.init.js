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

// Update progress indicator
function updateProgressIndicator() {
  chrome.storage.local.get(['defaultFields'], function (result) {
    const defaultFields = result.defaultFields || {};
    const requiredFields = ['YearsOfExperience', 'FirstName', 'LastName', 'PhoneNumber', 'City', 'Email'];

    let filledCount = 0;
    requiredFields.forEach(field => {
      if (defaultFields[field] && defaultFields[field].trim()) {
        filledCount++;
        const input = document.querySelector(`input[name="${field}"]`);
        if (input) input.value = defaultFields[field];
      }
    });

    const percentage = (filledCount / requiredFields.length) * 100;
    document.getElementById('progress-text').textContent = `${filledCount}/${requiredFields.length} fields completed`;
    document.getElementById('progress-fill').style.width = `${percentage}%`;

    const progressFill = document.getElementById('progress-fill');
    if (percentage === 100) {
      progressFill.style.backgroundColor = '#4caf50';
    } else if (percentage >= 50) {
      progressFill.style.backgroundColor = '#ff9800';
    } else {
      progressFill.style.backgroundColor = '#f44336';
    }
  });
}

// Update sync status
function updateSyncStatus() {
  chrome.storage.local.get(['inputFieldConfigs'], function (result) {
    const inputFieldConfigs = result.inputFieldConfigs || [];
    const syncStatus = document.getElementById('sync-status');

    const syncedFields = inputFieldConfigs.filter(config =>
      config.defaultValue && config.defaultValue.trim() !== ''
    );

    if (syncedFields.length > 0) {
      syncStatus.textContent = `${syncedFields.length} fields synced from website`;
      syncStatus.style.color = '#4caf50';
    } else {
      syncStatus.textContent = 'No website data detected';
      syncStatus.style.color = '#666';
    }
  });
}

// Show sync panel
function showSyncInfo() {
  chrome.storage.local.get(['inputFieldConfigs'], function (result) {
    const inputFieldConfigs = result.inputFieldConfigs || [];
    const syncPanel = document.getElementById('sync-info-panel');
    const syncDetails = document.getElementById('sync-details');

    if (inputFieldConfigs.length > 0) {
      syncDetails.innerHTML = '';
      inputFieldConfigs.forEach(config => {
        const item = document.createElement('div');
        item.style.cssText = 'margin-bottom: 5px; font-size: 12px;';
        item.innerHTML = `
          <strong>${config.placeholderIncludes}:</strong>
          ${config.defaultValue || 'No value'}
          <span style="color: #666;">(used ${config.count || 0} times)</span>
        `;
        syncDetails.appendChild(item);
      });
      syncPanel.style.display = 'block';
    } else {
      syncPanel.style.display = 'none';
    }
  });
}

// Init on page load
document.addEventListener('DOMContentLoaded', function () {
  const syncButton = document.getElementById('sync-button');

  // Auto-sync if defaultFields are incomplete
  chrome.storage.local.get(['defaultFields'], (result) => {
    const defaultFields = result.defaultFields || {};
    const requiredFields = ['YearsOfExperience', 'FirstName', 'LastName', 'PhoneNumber', 'City', 'Email'];
    const isIncomplete = requiredFields.some(f => !defaultFields[f] || defaultFields[f].trim() === '');

    if (isIncomplete) {
      syncButton.click(); // simulate user click
    } else {
      updateProgressIndicator();
      updateSyncStatus();
      showSyncInfo();
    }
  });

  // Sync button handler
  syncButton.addEventListener('click', function () {
    chrome.storage.local.get(['inputFieldConfigs', 'defaultFields'], (result) => {
      const inputConfigs = result.inputFieldConfigs || [];
      const defaultFields = result.defaultFields || {};

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
        }
      });

      // 2. Save to defaultFields
      chrome.storage.local.set({ defaultFields: updatedDefaults }, () => {
        updateProgressIndicator();
        updateSyncStatus();
        showSyncInfo();

        // 3. Reflect defaultFields back into inputFieldConfigs (reverse sync)
        chrome.storage.local.get(['inputFieldConfigs'], (res) => {
          const currentConfigs = res.inputFieldConfigs || [];
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
            } else {
              newFromDefaults.push({
                placeholderIncludes: displayName,
                defaultValue: value,
                count: 1
              });
            }
          }

          const finalConfigs = [...updatedConfigs, ...newFromDefaults];

          chrome.storage.local.set({ inputFieldConfigs: finalConfigs }, () => {
            // Update Text Fields Entry
            if (typeof window.formManager !== 'undefined') {
              window.formManager.displayAndUpdateInputFieldConfig(finalConfigs);
            }
            updateSyncStatus();
            showSyncInfo();
          });
        });
      });
    });

    syncButton.textContent = '🔄 Syncing...';
    syncButton.disabled = true;

    setTimeout(() => {
      syncButton.textContent = '🔄 Sync with Website Data';
      syncButton.disabled = false;
    }, 1000);
  });

  // Periodic update
  setInterval(() => {
    updateProgressIndicator();
    updateSyncStatus();
    showSyncInfo();
  }, 5000);
});
