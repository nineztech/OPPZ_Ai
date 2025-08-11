// Enhanced popup.js with better auto-apply integration

// Function to check if auto-apply is ready
const checkAutoApplyReadiness = async () => {
    try {
        const result = await chrome.storage.local.get([
            'autoApplyReady', 
            'defaultFields', 
            'inputFieldConfigs',
            'authToken',
            'user'
        ]);
        
        // Check authentication
        if (!result.authToken || !result.user) {
            console.log('User not authenticated');
            return { ready: false, reason: 'Not authenticated' };
        }
        
        // Check if form control data exists
        const defaultFields = result.defaultFields || {};
        const requiredFields = ['YearsOfExperience', 'FirstName', 'LastName', 'PhoneNumber', 'City', 'Email'];
        
        const missingFields = requiredFields.filter(field => 
            !defaultFields[field] || defaultFields[field].trim() === ''
        );
        
        if (missingFields.length > 0) {
            console.log('Missing required fields:', missingFields);
            return { 
                ready: false, 
                reason: `Missing required fields: ${missingFields.join(', ')}`,
                missingFields 
            };
        }
        
        // Check if we have some input field configs (optional but recommended)
        const inputFieldConfigs = result.inputFieldConfigs || [];
        
        return { 
            ready: true, 
            defaultFields,
            configCount: inputFieldConfigs.length
        };
        
    } catch (error) {
        console.error('Error checking auto-apply readiness:', error);
        return { ready: false, reason: 'Error checking readiness' };
    }
};

 // Change the auto-apply button UI state
// Fixed function to change the auto-apply button UI state
function changeAutoApplyButton(isRunning, buttonElement) {
    if (!buttonElement) return;

    if (isRunning) {
        // Use background instead of backgroundColor to override the gradient
        buttonElement.style.background = '#E60000';
        buttonElement.style.boxShadow = '0 4px 12px rgba(192, 24, 24, 0.3)';
        
        // Show running icon and hide start icon
        const startIcon = buttonElement.querySelector('#start-icon');
        const runningIcon = buttonElement.querySelector('#running-icon');
        if (startIcon) startIcon.style.display = 'none';
        if (runningIcon) runningIcon.style.display = 'inline-flex';
        
        // Update text content while preserving icons
        const textNodes = Array.from(buttonElement.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        textNodes.forEach(node => node.remove());
        buttonElement.appendChild(document.createTextNode('Stop Auto Apply'));
        
    } else {
        // Restore the original gradient background
        buttonElement.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        buttonElement.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
        
        // Show start icon and hide running icon
        const startIcon = buttonElement.querySelector('#start-icon');
        const runningIcon = buttonElement.querySelector('#running-icon');
        if (startIcon) startIcon.style.display = 'inline-flex';
        if (runningIcon) runningIcon.style.display = 'none';
        
        // Update text content while preserving icons
        const textNodes = Array.from(buttonElement.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        textNodes.forEach(node => node.remove());
        buttonElement.appendChild(document.createTextNode('Start Auto Apply'));
    }
}

document.addEventListener('DOMContentLoaded', () => {
  initializeMainPopup(); // your main entry
});

document.getElementById("help-button").addEventListener("click", function (e) {
  e.preventDefault();
  chrome.tabs.create({ url: "https://www.oppzai.com/FAQ" });
});

// Enhanced auto-apply button handler
const handleAutoApplyButton = async (button) => {
    try {
        // First check if we're on the right page
       const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
const currentUrl = tabs?.[0]?.url || '';

if (!currentUrl.includes('linkedin.com/jobs')) {
    alert('Please navigate to a LinkedIn jobs search page first.');
    return;
}
        
        // Check if auto-apply is ready
        const readinessCheck = await checkAutoApplyReadiness();
        
        if (!readinessCheck.ready) {
            let message = 'Auto-apply is not ready. ';
            
            if (readinessCheck.reason === 'Not authenticated') {
                message += 'Please log in first.';
                window.location.href = chrome.runtime.getURL('popup/auth/login.html');
                return;
            } else if (readinessCheck.missingFields) {
                message += `\n\nMissing required information:\n${readinessCheck.missingFields.map(field => `• ${getFieldDisplayName(field)}`).join('\n')}`;
                message += '\n\nWould you like to fill out your information now?';
                
                if (confirm(message)) {
                    chrome.tabs.create({ url: 'https://www.oppzai.com/MainPage' });
                }
                return;
            } else {
                message += readinessCheck.reason;
                alert(message);
                return;
            }
        }
        
        // Proceed with auto-apply
        chrome.storage.local.get('autoApplyRunning', ({ autoApplyRunning }) => {
            const newState = !autoApplyRunning;
            changeAutoApplyButton(newState, button);
            
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    const currentTabId = tabs[0].id;
                    chrome.runtime.sendMessage({
                        action: newState ? 'startAutoApply' : 'stopAutoApply',
                        tabId: currentTabId
                    }, response => {
                        if (response?.success) {
                            chrome.storage.local.set({ autoApplyRunning: newState });
                            if (newState) {
                                showAutoApplyStatus(readinessCheck);
                            }
                        } else {
                            chrome.storage.local.set({ autoApplyRunning: false }, () => {
                                changeAutoApplyButton(false, button);
                                alert(response?.message || 'Failed to start auto-apply');
                            });
                        }
                    });
                } else {
                    alert('No active tabs found. Please go to a LinkedIn job search page.');
                }
            });
        });
        
    } catch (error) {
        console.error('Error in auto-apply button handler:', error);
        alert('An error occurred while trying to start auto-apply.');
    }
};

// Helper function to get display names for fields
const getFieldDisplayName = (fieldName) => {
    const displayNames = {
        'YearsOfExperience': 'Years of Experience',
        'FirstName': 'First Name',
        'LastName': 'Last Name',
        'PhoneNumber': 'Phone Number',
        'City': 'City',
        'Email': 'Email'
    };
    return displayNames[fieldName] || fieldName;
};

// // Show auto-apply status
// const showAutoApplyStatus = (readinessCheck) => {
//     const statusElement = document.getElementById('auto-apply-status');
//     if (statusElement) {
//         statusElement.innerHTML = `
//             <div style="color: #007700; font-size: 12px; margin-top: 5px;">
//                 ✓ Auto-apply started successfully<br>
//                 <small>Form data: ${Object.keys(readinessCheck.defaultFields).length} fields ready</small>
//                 ${readinessCheck.configCount > 0 ? `<br><small>Website configs: ${readinessCheck.configCount} synced</small>` : ''}
//             </div>
//         `;
//     }
// };

// Optional: Sync inputFieldConfigs to defaultFields
async function syncDefaultFieldsFromConfigs() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['inputFieldConfigs', 'defaultFields'], (result) => {
      const inputConfigs = result.inputFieldConfigs || [];
      const defaultFields = result.defaultFields || {};

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

      inputConfigs.forEach(config => {
        const mapped = fieldMap[config.placeholderIncludes.trim()];
        if (mapped && config.defaultValue && config.defaultValue.trim() !== '') {
          defaultFields[mapped] = config.defaultValue.trim();
        }
      });

      chrome.storage.local.set({ defaultFields }, resolve);
    });
  });
}


// Enhanced initialization function
const initializeMainPopup = async () => {
    try {
        console.log('Initializing main popup...');
        
        // Get user data and display
       const result = await chrome.storage.local.get(['user']);

        const user = result.user;
        
        if (user) {
            console.log('Logged in user:', user.email);
            const userElement = document.getElementById('userInfo');
            if (userElement) {
                userElement.textContent = `Welcome, ${user.email}`;
            }
        }
        

       // Try to auto-sync required fields from configs
await syncDefaultFieldsFromConfigs();

// Re-check after sync
const readinessCheck = await checkAutoApplyReadiness();
updateAutoApplyButtonState(readinessCheck);


        // Initialize auto apply button state
        const autoApplyButton = document.getElementById('start-auto-apply-button');
        if (autoApplyButton) {
            // Add status container
            const statusContainer = document.createElement('div');
            statusContainer.id = 'auto-apply-status';
            autoApplyButton.parentNode.insertBefore(statusContainer, autoApplyButton.nextSibling);
            
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    const currentTabId = tabs[0].id;
                    chrome.runtime.sendMessage({
                        action: 'checkAutoApplyStatus',
                        tabId: currentTabId
                    }, (response) => {
                        const isRunning = response?.isRunning || false;
                        chrome.storage.local.set({ autoApplyRunning: isRunning }, () => {
                            changeAutoApplyButton(isRunning, autoApplyButton);
                        });
                    });
                } else {
                    chrome.storage.local.get('autoApplyRunning', ({ autoApplyRunning }) => {
                        changeAutoApplyButton(autoApplyRunning || false, autoApplyButton);
                    });
                }
            });
        }
        
        // Initialize other settings (existing code)
        initializeOtherSettings();
        
        console.log('Main popup initialized successfully');
        
    } catch (error) {
        console.error('Error initializing popup:', error);
    }
};

// Update auto-apply button state based on readiness
const updateAutoApplyButtonState = (readinessCheck) => {
    const autoApplyButton = document.getElementById('start-auto-apply-button');
    const statusContainer = document.getElementById('auto-apply-status');
    
    if (!autoApplyButton || !statusContainer) return;
    
    if (readinessCheck.ready) {
        autoApplyButton.disabled = false;
        autoApplyButton.style.opacity = '1';
        statusContainer.innerHTML = `
            <div style="color: #007700; font-size: 12px; margin-top: 5px;">
                ✓ Ready to auto-apply<br>
                <small>${Object.keys(readinessCheck.defaultFields).length} fields configured</small>
            </div>
        `;
    } else {
        autoApplyButton.disabled = false; // Keep enabled so user can click and get guidance
        autoApplyButton.style.opacity = '0.8';
        statusContainer.innerHTML = `
            <div style="color: #b50000; font-size: 12px; margin-top: 5px;">
                ⚠ Setup required<br>
                <small>Click to configure missing information</small>
            </div>
        `;
    }
};

// Initialize other settings (extracted from original code)
const initializeOtherSettings = () => {
    const switchInput = document.getElementById('stop-if-not-exist-in-form-control');
    if (switchInput) {
        chrome.storage.local.get('stopIfNotExistInFormControl', ({ stopIfNotExistInFormControl }) => {
            switchInput.checked = Boolean(stopIfNotExistInFormControl);
        });
        
        switchInput.addEventListener('change', () => {
            void chrome.storage.local.set({ stopIfNotExistInFormControl: switchInput.checked });
        });
    }

    const loopRunningInput = document.getElementById('loop-running');
    if (loopRunningInput) {
        chrome.storage.local.get('loopRunning', ({ loopRunning }) => {
            loopRunningInput.checked = Boolean(loopRunning);
        });
        
        loopRunningInput.addEventListener('change', () => {
            void chrome.storage.local.set({ loopRunning: loopRunningInput.checked });
        });
    }

    const loopRunningDelayInput = document.getElementById('loop-running-delay');
    if (loopRunningDelayInput) {
        chrome.storage.local.get('loopRunningDelay', ({ loopRunningDelay }) => {
            loopRunningDelayInput.value = loopRunningDelay || 0;
        });
        
        loopRunningDelayInput.addEventListener('input', () => {
            const value = parseInt(loopRunningDelayInput.value) || 0;
            void chrome.storage.local.set({ loopRunningDelay: value });
        });
    }
    
    // Initialize import file handler
    const importFileInput = document.getElementById('import-file');
    if (importFileInput) {
        importFileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    if (e?.target?.result && typeof e.target.result === 'string') {
                        const importedData = JSON.parse(e.target.result);
                        chrome.storage.local.set(importedData, function() {
                            alert('Settings imported successfully!');
                            // Refresh the readiness check
                            setTimeout(async () => {
                                const readinessCheck = await checkAutoApplyReadiness();
                                updateAutoApplyButtonState(readinessCheck);
                            }, 500);
                        });
                    } else {
                        alert('Error reading file.');
                    }
                } catch (err) {
                    alert('Parsing error JSON. ' + err);
                }
            };
            reader.readAsText(file);
        });
    }
};

// Update the global click handler
document.addEventListener('click', event => {
    if (event.target.tagName === 'BUTTON') {
        const buttonId = event.target.id;
        const button = document.getElementById(buttonId);
        
        switch (buttonId) {
            case 'start-auto-apply-button':
                event.preventDefault();
                handleAutoApplyButton(button);
                break;
            // ... other cases remain the same
        }
    }
});

// Listen for storage changes to update UI
chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local') {
        if (changes.defaultFields || changes.inputFieldConfigs) {
            const readinessCheck = await checkAutoApplyReadiness();
            updateAutoApplyButtonState(readinessCheck);
        }
    }
});

// Export functions for use in other parts of the extension
window.checkAutoApplyReadiness = checkAutoApplyReadiness;
window.updateAutoApplyButtonState = updateAutoApplyButtonState;