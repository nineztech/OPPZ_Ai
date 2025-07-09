// Background script for OPPZ extension
// Handles notification support and extension badge updates

let currentInputFieldConfigs = [];

// Notification-related message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        // Handle notification-related actions
        if (request.action === 'openExtensionPopup') {
            // Open the extension popup
            chrome.action.openPopup().catch(error => {
                console.log('Could not open popup:', error);
                // Fallback: open extension options or popup page
                chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html') });
            });
            sendResponse({ success: true });
            
        } else if (request.action === 'updateExtensionBadge') {
            // Update extension badge text and color
            const { text, color } = request;
            
            chrome.action.setBadgeText({ 
                text: text || '',
                tabId: sender.tab?.id 
            });
            
            chrome.action.setBadgeBackgroundColor({ 
                color: color || '#0066cc',
                tabId: sender.tab?.id 
            });
            
            sendResponse({ success: true });
            
        } else if (request.action === 'startAutoApply') {
            return handleStartAutoApply(request, sender, sendResponse);
            
        } else if (request.action === 'externalApplyAction') {
            const { jobTitle, currentPageLink, companyName } = request.data;
            saveLinkedInJobData(jobTitle, currentPageLink, companyName, false)
                .then(() => {
                    sendResponse({ success: true });
                }).catch((error) => {
                    console.error('Failed to save external job:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true;
            
        } else if (request.action === 'saveAutoAppliedJob') {
            const { jobTitle, jobLink, companyName } = request.data;
            saveLinkedInJobData(jobTitle, jobLink, companyName, true)
                .then(() => {
                    console.log('Auto-applied job saved:', { jobTitle, jobLink, companyName });
                    sendResponse({ success: true });
                }).catch((error) => {
                    console.error('Failed to save auto-applied job:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true;
            
        } else if (request.action === 'openDefaultInputPage') {
            chrome.tabs.create({ url: 'popup/formControl/formControl.html' });
            
        } else if (request.action === 'stopAutoApply') {
            return handleAutoApplyStop(sender.tab?.id, sendResponse);
            
        } else if (request.action === 'checkAutoApplyStatus') {
            return checkAutoApplyStatus(sender.tab?.id, sendResponse);
            
        } else if (request.action === 'openTabAndRunScript') {
            chrome.tabs.create({ url: request.url }, (tab) => {
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                    if (tabId === tab.id && changeInfo.status === 'complete') {
                        chrome.tabs.sendMessage(tabId, { action: 'showRunningModal' })
                            .then(response => {
                                if (response && response.success) {
                                    chrome.scripting.executeScript({
                                        target: { tabId: tabId },
                                        func: runScriptInContent
                                    }).then(() => {
                                        sendResponse({ success: true });
                                    }).catch(err => {
                                        console.trace('executeScript error:' + err?.message);
                                        sendResponse({ success: false, message: err.message });
                                        chrome.tabs.sendMessage(tabId, { action: 'hideRunningModal' });
                                    });
                                } else {
                                    console.trace('Failed to show running modal: ' + response?.message);
                                    sendResponse({ success: false, message: response?.message || 'Failed to show running modal.' });
                                }
                            }).catch(err => {
                                console.trace('Error sending showRunningModal: ' + err?.message);
                                sendResponse({ success: false, message: 'Failed to send showRunningModal: ' + err?.message });
                            });
                        
                        chrome.tabs.onUpdated.removeListener(listener);
                    }
                });
            });
            return true;
            
        } else if (request.action === 'updateInputFieldValue') {
            const { placeholder, value } = request.data;
            updateOrAddInputFieldValue(placeholder, value)
                .then(() => sendResponse({ success: true }))
                .catch(err => {
                    console.trace("Error in updateInputFieldValue: " + err?.message);
                    sendResponse({ success: false, message: err?.message });
                });
            return true;
            
        } else if (request.action === 'updateInputFieldConfigsInStorage') {
            const placeholder = request.data;
            updateInputFieldConfigsInStorage(placeholder)
                .then(() => sendResponse({ success: true }))
                .catch(err => {
                    console.trace('Error in updateInputFieldConfigsInStorage:' + err?.message);
                    sendResponse({ success: false, message: err?.message });
                });
            return true;
            
        } else if (request.action === 'deleteInputFieldConfig') {
            const placeholder = request.data;
            deleteInputFieldConfig(placeholder);
            
        } else if (request.action === 'getInputFieldConfig') {
            getInputFieldConfig(sendResponse);
            return true;
            
        } else if (request.action === 'updateRadioButtonValueByPlaceholder') {
            updateRadioButtonValue(request.placeholderIncludes, request.newValue);
            
        } else if (request.action === 'deleteRadioButtonConfig') {
            deleteRadioButtonConfig(request.data);
            
        } else if (request.action === 'updateDropdownConfig') {
            updateDropdownConfig(request.data);
            
        } else if (request.action === 'deleteDropdownConfig') {
            deleteDropdownValueConfig(request.data);
            
        } else if (request.action === 'logout') {
            clearAuthData();
            sendResponse({ success: true });
            
        } else if (request.action === 'updateAuthState') {
            // Handle auth state updates
            console.log('Auth state updated');
            sendResponse({ success: true });
        
        } // Handle external apply action
    else if (request.action === 'externalApplyAction') {
      const { jobTitle, currentPageLink, companyName } = request.data;
      
      saveLinkedInJobData(jobTitle, currentPageLink, companyName, false)
        .then(result => {
          if (result.success) {
            sendResponse({ success: true, jobData: result.jobData });
          } else {
            sendResponse({ 
              success: false, 
              error: result.message || result.error,
              reason: result.reason 
            });
          }
        })
        .catch(error => {
          console.error('Failed to save external job:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    // Handle auto-applied job saving
    else if (request.action === 'saveAutoAppliedJob') {
      const { jobTitle, jobLink, companyName } = request.data;
      
      saveLinkedInJobData(jobTitle, jobLink, companyName, true)
        .then(result => {
          if (result.success) {
            console.log('Auto-applied job saved successfully:', result.jobData);
            sendResponse({ success: true, jobData: result.jobData });
          } else {
            console.log('Auto-applied job saving failed:', result.reason || result.error);
            sendResponse({ 
              success: false, 
              error: result.message || result.error,
              reason: result.reason 
            });
          }
        })
        .catch(error => {
          console.error('Failed to save auto-applied job:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    // Handle generic job data saving
    else if (request.action === 'saveJobData') {
      const { jobTitle, jobLink, companyName, isAutoApplied } = request.data;
      
      saveLinkedInJobData(jobTitle, jobLink, companyName, isAutoApplied)
        .then(result => {
          if (result.success) {
            sendResponse({ success: true, jobData: result.jobData });
          } else {
            sendResponse({ 
              success: false, 
              error: result.message || result.error,
              reason: result.reason 
            });
          }
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
        
        else {
            console.warn('Unknown action:', request.action);
            sendResponse({ success: false, message: 'Unknown action' });
        }
        
    } catch (e) {
        console.trace('onMessage error:' + e?.message);
        sendResponse({ success: false, message: e.message });
    }
});

// Handle auto-apply start
function handleStartAutoApply(request, sender, sendResponse) {
    try {
        chrome.tabs.query({ active: true, currentWindow: true })
            .then(tabs => {
                if (!tabs?.[0]) {
                    sendResponse({ success: false, message: 'No active tab found.' });
                    return;
                }
                
                const currentTabId = tabs[0].id;
                const currentUrl = tabs[0].url || request.currentUrl || '';
                
                chrome.storage.local.get('defaultFields', storageResult => {
                    if (!storageResult?.defaultFields) {
                        sendResponse({ success: false, message: 'Default fields are not set.' });
                        return;
                    }
                    
                    const result = storageResult.defaultFields;
                    const isDefaultFieldsEmpty = Object.values(result).some(value => value === '');
                    
                    if (!currentUrl.includes('linkedin.com/jobs')) {
                        chrome.tabs.sendMessage(currentTabId, { action: 'showNotOnJobSearchAlert' })
                            .then(() => sendResponse({
                                success: false,
                                message: 'You are not on the LinkedIn jobs search page.'
                            }))
                            .catch(err => {
                                const errorMessage = err?.message || 'Unknown error';
                                if (errorMessage.includes('establish connection')) return;
                                console.error('background script error:', errorMessage);
                                sendResponse({
                                    success: false,
                                    message: 'Error showing alert: ' + err.message
                                });
                            });
                        return;
                    }
                    
                    if (isDefaultFieldsEmpty) {
                        chrome.tabs.sendMessage(currentTabId, { action: 'showFormControlAlert' })
                            .then(() => sendResponse({
                                success: false,
                                message: 'Form control fields are empty. Please set them in the extension options.'
                            }))
                            .catch(err => {
                                console.trace('Error sending showFormControlAlert: ' + err?.message);
                                sendResponse({ success: false, message: 'Error showing form control alert: ' + err.message });
                            });
                        return;
                    }
                    
                    if (currentUrl.includes('linkedin.com/jobs') && !isDefaultFieldsEmpty) {
                        chrome.scripting.executeScript({
                            target: { tabId: currentTabId },
                            func: runScriptInContent
                        }).then(() => {
                            sendResponse({ success: true });
                        }).catch(err => {
                            console.trace('startAutoApply Error: ' + err?.message);
                            sendResponse({ success: false, message: err.message });
                        });
                    }
                });
            });
        return true;
    } catch (err) {
        console.trace('startAutoApply Error: ' + err?.message);
        sendResponse({ success: false, message: err.message });
        return true;
    }
}

// Handle auto-apply stop
function handleAutoApplyStop(tabId, sendResponse) {
    chrome.storage.local.set({ 'autoApplyRunning': false }, () => {
        if (!tabId) {
            sendResponse({ success: false, message: 'No tab ID provided.' });
            return;
        }
        
        chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError) {
                console.trace('Error getting tab info:' + chrome?.runtime?.lastError?.message);
                sendResponse({ success: false, message: 'Tab error: ' + chrome.runtime.lastError.message });
                return;
            }
            
            if (!tab || !tab.url || !tab.url.includes('linkedin.com/jobs')) {
                console.trace('Tab is invalid or URL does not match.');
                sendResponse({ success: false, message: 'Tab is invalid or not a LinkedIn jobs page.' });
                return;
            }
            
            chrome.tabs.sendMessage(tabId, { action: 'hideRunningModal' })
                .then(response => {
                    if (response && response.success) {
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, message: 'Failed to hide modal on stop.' });
                    }
                }).catch(err => {
                    console.trace('Error sending hideRunningModal: ' + err?.message);
                    sendResponse({ success: false, message: 'Failed to send hideRunningModal: ' + err?.message });
                });
        });
    });
    return true;
}

// Check auto-apply status
function checkAutoApplyStatus(tabId, sendResponse) {
    if (tabId) {
        chrome.tabs.sendMessage(tabId, { action: 'checkScriptRunning' })
            .then(response => {
                const isActuallyRunning = response?.isRunning || false;
                chrome.storage.local.set({ autoApplyRunning: isActuallyRunning }, () => {
                    sendResponse({ isRunning: isActuallyRunning });
                });
            })
            .catch(() => {
                chrome.storage.local.set({ autoApplyRunning: false }, () => {
                    sendResponse({ isRunning: false });
                });
            });
    } else {
        chrome.storage.local.get('autoApplyRunning', ({ autoApplyRunning }) => {
            sendResponse({ isRunning: Boolean(autoApplyRunning) });
        });
    }
    return true;
}

 
// Fixed job data saving function - prevents duplicates and saves only once per job
async function saveLinkedInJobData(jobTitle, jobLink, companyName, isAutoApplied = false) {
  try {
    const result = await chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs']);

    let externalJobs = result.externalApplyData || [];
    let autoJobs = result.autoAppliedJobs || [];

    // Normalize data for comparison
    const normalizedTitle = jobTitle?.toLowerCase().trim();
    const normalizedCompany = companyName?.toLowerCase().trim();
    const normalizedLink = jobLink?.toLowerCase().trim();

    // Check for duplicates in the appropriate array
    const targetArray = isAutoApplied ? autoJobs : externalJobs;
    
    const isDuplicate = targetArray.some(job => {
      const jobTitle_normalized = job.title?.toLowerCase().trim();
      const jobCompany_normalized = job.companyName?.toLowerCase().trim();
      const jobLink_normalized = job.link?.toLowerCase().trim();
      
      // Check for exact match on link OR combination of title + company
      return (
        jobLink_normalized === normalizedLink || 
        (jobTitle_normalized === normalizedTitle && jobCompany_normalized === normalizedCompany)
      );
    });

    // If duplicate found, don't save
    if (isDuplicate) {
      console.log(`Duplicate job skipped: ${jobTitle} at ${companyName}`);
      return { success: false, reason: 'duplicate', message: 'Job already exists' };
    }

    // Create new job data
    const jobData = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      title: jobTitle,
      link: jobLink,
      companyName,
      time: Date.now(),
      isAutoApplied,
      appliedDate: new Date().toISOString()
    };

    // Add to beginning of array
    targetArray.unshift(jobData);
    
    // Keep only latest 500 jobs
    if (targetArray.length > 500) {
      targetArray.splice(500);
    }

    // Save updated array
    const storageKey = isAutoApplied ? 'autoAppliedJobs' : 'externalApplyData';
    await chrome.storage.local.set({
      [storageKey]: targetArray
    });

    console.log(`Job saved successfully to ${storageKey}:`, jobData);
    return { success: true, jobData };
    
  } catch (error) {
    console.error('Error saving job data:', error);
    return { success: false, error: error.message };
  }
}



// Input field configuration functions
function deleteInputFieldConfig(placeholder) {
    chrome.storage.local.get(['inputFieldConfigs'], result => {
        const inputFieldConfigs = result?.inputFieldConfigs || [];
        const configIndex = inputFieldConfigs.findIndex(config => config.placeholderIncludes === placeholder);
        if (configIndex !== -1) {
            inputFieldConfigs.splice(configIndex, 1);
            chrome.storage.local.set({ 'inputFieldConfigs': inputFieldConfigs }, () => {
                currentInputFieldConfigs = inputFieldConfigs;
            });
        }
    });
}

async function updateOrAddInputFieldValue(placeholder, value) {
    try {
        const { inputFieldConfigs = [] } = await chrome.storage.local.get('inputFieldConfigs');
        const foundConfig = inputFieldConfigs.find(config => config.placeholderIncludes === placeholder);
        
        if (foundConfig) {
            foundConfig.defaultValue = value;
        } else {
            const newConfig = { placeholderIncludes: placeholder, defaultValue: value, count: 1 };
            inputFieldConfigs.push(newConfig);
        }
        
        await chrome.storage.local.set({ inputFieldConfigs });
        
    } catch (error) {
        console.trace("Error updating or adding input field value:" + error?.message);
        throw error;
    }
}

async function updateInputFieldConfigsInStorage(placeholder) {
    try {
        const result = await chrome.storage.local.get('inputFieldConfigs');
        const inputFieldConfigs = result?.inputFieldConfigs || [];
        const foundConfig = inputFieldConfigs.find(config => config.placeholderIncludes === placeholder);
        
        if (foundConfig) {
            foundConfig.count++;
            if (!('createdAt' in foundConfig) || !foundConfig.createdAt) {
                foundConfig.createdAt = Date.now();
            }
        } else {
            const newConfig = { placeholderIncludes: placeholder, defaultValue: '', count: 1, createdAt: Date.now() };
            inputFieldConfigs.push(newConfig);
        }
        
        chrome.storage.local.set({ 'inputFieldConfigs': inputFieldConfigs }, () => {
            currentInputFieldConfigs = inputFieldConfigs;
        });
    } catch (error) {
        console.trace('Error updating input field configs: ' + error?.message);
        throw error;
    }
}

function getInputFieldConfig(callback) {
    try {
        chrome.storage.local.get(['inputFieldConfigs'], result => {
            const fieldConfig = result && result?.inputFieldConfigs ? result?.inputFieldConfigs : null;
            callback(fieldConfig);
        });
    } catch (error) {
        callback(null);
    }
}

// Radio button configuration functions
function updateRadioButtonValue(placeholderIncludes, newValue) {
    chrome.storage.local.get('radioButtons', (result) => {
        const storedRadioButtons = result.radioButtons || [];
        const storedRadioButtonInfo = storedRadioButtons.find(info => info.placeholderIncludes === placeholderIncludes);
        if (storedRadioButtonInfo) {
            storedRadioButtonInfo.defaultValue = newValue;
            storedRadioButtonInfo.options.forEach(option => {
                option.selected = option.value === newValue;
            });
            chrome.storage.local.set({ 'radioButtons': storedRadioButtons });
        } else {
            console.trace(`Item with placeholderIncludes ${placeholderIncludes} not found`);
        }
    });
}

function deleteRadioButtonConfig(placeholder) {
    chrome.storage.local.get('radioButtons', function(result) {
        const radioButtons = result.radioButtons || [];
        const updatedRadioButtons = radioButtons.filter(config => config.placeholderIncludes !== placeholder);
        chrome.storage.local.set({ 'radioButtons': updatedRadioButtons });
    });
}

// Dropdown configuration functions
function updateDropdownConfig(dropdownData) {
    if (!dropdownData || !dropdownData.placeholderIncludes || !dropdownData.value || !dropdownData.options) {
        return;
    }
    
    chrome.storage.local.get('dropdowns', function(result) {
        let dropdowns = result.dropdowns || [];
        const storedDropdownInfo = dropdowns.find(info => info.placeholderIncludes === dropdownData.placeholderIncludes);
        
        if (storedDropdownInfo) {
            storedDropdownInfo.value = dropdownData.value;
            storedDropdownInfo.options = dropdownData.options.map(option => ({
                value: option.value,
                text: option.text || '',
                selected: option.value === dropdownData.value
            }));
            
            if (!('createdAt' in storedDropdownInfo) || !storedDropdownInfo.createdAt) {
                storedDropdownInfo.createdAt = Date.now();
            }
        } else {
            dropdowns.push({
                placeholderIncludes: dropdownData.placeholderIncludes,
                value: dropdownData.value,
                createdAt: Date.now(),
                options: dropdownData.options.map(option => ({
                    value: option.value,
                    text: option.text || '',
                    selected: option.value === dropdownData.value
                }))
            });
        }
        chrome.storage.local.set({ dropdowns });
    });
}

function deleteDropdownValueConfig(placeholder) {
    chrome.storage.local.get('dropdowns', function(result) {
        let dropdowns = result.dropdowns || [];
        const indexToDelete = dropdowns.findIndex(config => config.placeholderIncludes === placeholder);
        if (indexToDelete !== -1) {
            dropdowns.splice(indexToDelete, 1);
            chrome.storage.local.set({ 'dropdowns': dropdowns });
        }
    });
}

// Authentication functions
function clearAuthData() {
    chrome.storage.local.remove(['authToken', 'userEmail'], () => {
        console.log('Auth data cleared');
    });
}

// Content script execution function
function runScriptInContent() {
    if (typeof runScript === 'function') {
        runScript();
    }
}

// Extension installation/startup handler
chrome.runtime.onInstalled.addListener(() => {
    console.log('OPPZ Extension installed/updated');
    
    // Set default badge
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#0066cc' });
});

// Tab update listener for notification updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('linkedin.com')) {
        // Reset badge when navigating on LinkedIn
        chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
});

// Handle extension icon clicks
chrome.action.onClicked.addListener((tab) => {
    // This will be handled by the popup, but kept for fallback
    console.log('Extension icon clicked');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.from === 'website' && message.action === 'getFormControlData') {
    chrome.storage.local.get(['inputFieldConfigs', 'radioButtons', 'dropdowns'], (data) => {
      sendResponse({ success: true, data });
    });
    return true; // Important: keeps the response channel open
  }
});

// Extension background script for external messaging & job data management

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  const { from, action, data } = message;

  if (from !== 'website') return;

  // 1. READ all form control data
  if (action === 'getFormControlData') {
    chrome.storage.local.get(['inputFieldConfigs', 'radioButtons', 'dropdowns'], (result) => {
      sendResponse({ success: true, data: result });
    });
    return true;
  }

  // 2. UPDATE input text field value
  if (action === 'updateInputFieldValue') {
    (async () => {
      try {
        const { placeholder, value } = data;
        
        // Log incoming data for debugging
        console.log('[Extension] Received update for:', { placeholder, value });
        
        // Normalize placeholder for comparison (lowercase, trimmed)
        const placeholderKey = placeholder.trim().toLowerCase();

        const result = await new Promise(resolve => {
          chrome.storage.local.get(['inputFieldConfigs'], resolve);
        });

        const configs = result.inputFieldConfigs || [];
        console.log('[Extension] Current configs:', configs);

        // Find existing config with case-insensitive comparison
        let configFound = false;
        const updated = configs.map(config => {
          const configKey = config.placeholderIncludes?.trim().toLowerCase();
          if (configKey === placeholderKey) {
            console.log('[Extension] Updating existing config:', config.placeholderIncludes);
            configFound = true;
            return { 
              ...config, 
              defaultValue: value, 
              updatedAt: new Date().toISOString() 
            };
          }
          return config;
        });

        // If no existing config was found, create a new one
        if (!configFound) {
          console.log('[Extension] Creating new config for:', placeholder);
          const newConfig = {
            placeholderIncludes: placeholder, // Keep original case
            defaultValue: value,
            count: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          updated.push(newConfig);
        }

        // Save the updated configs
        chrome.storage.local.set({ inputFieldConfigs: updated }, () => {
          console.log(`[Extension] Successfully stored "${placeholder}": "${value}"`);
          console.log('[Extension] Updated configs:', updated);
          sendResponse({ success: true });
        });

      } catch (error) {
        console.error('[Extension] Failed to update input field:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep message channel open for async response
  }

  // 3. UPDATE radio button value
  if (action === 'updateRadioButtonValue') {
    chrome.storage.local.get(['radioButtons'], (result) => {
      const configs = result.radioButtons || [];
      const updated = configs.map(config =>
        config.placeholderIncludes === data.placeholder
          ? {
              ...config,
              options: config.options.map(option => ({
                ...option,
                selected: option.value === data.value
              }))
            }
          : config
      );
      chrome.storage.local.set({ radioButtons: updated }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  // 4. UPDATE dropdown selected value
  if (action === 'updateDropdownValue') {
    chrome.storage.local.get(['dropdowns'], (result) => {
      const configs = result.dropdowns || [];
      const updated = configs.map(config =>
        config.placeholderIncludes === data.placeholder
          ? {
              ...config,
              options: config.options.map(option => ({
                ...option,
                selected: option.value === data.selectedValue
              }))
            }
          : config
      );
      chrome.storage.local.set({ dropdowns: updated }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  // 5. GET job data
  if (action === 'getJobData') {
    chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs'], (result) => {
      sendResponse({
        success: true,
        data: {
          externalApplyData: result.externalApplyData || [],
          autoAppliedJobs: result.autoAppliedJobs || []
        }
      });
    });
    return true;
  }

  // 6. DELETE job
  if (action === 'deleteJob') {
    const { jobId, isAutoApplied } = data;

    chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs'], (result) => {
      let externalJobs = result.externalApplyData || [];
      let autoJobs = result.autoAppliedJobs || [];

      if (isAutoApplied) {
        autoJobs = autoJobs.filter(job => job.id !== jobId);
      } else {
        externalJobs = externalJobs.filter(job => job.id !== jobId);
      }

      chrome.storage.local.set({
        externalApplyData: externalJobs,
        autoAppliedJobs: autoJobs
      }, () => {
        console.log(`Job deleted successfully`);
        sendResponse({ success: true });
      });
    });
    return true;
  }

  // 7. UPDATE job
  if (action === 'updateJob') {
    const { jobId, isAutoApplied, updatedData } = data;

    chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs'], (result) => {
      let externalJobs = result.externalApplyData || [];
      let autoJobs = result.autoAppliedJobs || [];

      const update = (jobs) =>
        jobs.map(job => (job.id === jobId ? { ...job, ...updatedData } : job));

      if (isAutoApplied) {
        autoJobs = update(autoJobs);
      } else {
        externalJobs = update(externalJobs);
      }

      chrome.storage.local.set({
        externalApplyData: externalJobs,
        autoAppliedJobs: autoJobs
      }, () => {
        console.log(`Job updated`);
        sendResponse({ success: true });
      });
    });
    return true;
  }

  // 8. GET job statistics
  if (action === 'getJobStats') {
    chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs'], (result) => {
      const externalJobs = result.externalApplyData || [];
      const autoJobs = result.autoAppliedJobs || [];

      const stats = {
        total: externalJobs.length + autoJobs.length,
        external: externalJobs.length,
        auto: autoJobs.length,
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      };

      const now = Date.now();
      const oneDayAgo = now - 86400000;
      const oneWeekAgo = now - 7 * 86400000;
      const oneMonthAgo = now - 30 * 86400000;

      [...externalJobs, ...autoJobs].forEach(job => {
        if (job.time) {
          if (job.time >= oneDayAgo) stats.today++;
          if (job.time >= oneWeekAgo) stats.thisWeek++;
          if (job.time >= oneMonthAgo) stats.thisMonth++;
        }
      });

      sendResponse({ success: true, data: stats });
    });
    return true;
  }

  // 9. EXPORT job data
  if (action === 'exportJobData') {
    chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs'], (result) => {
      const externalJobs = result.externalApplyData || [];
      const autoJobs = result.autoAppliedJobs || [];

      const exportData = {
        exportDate: new Date().toISOString(),
        totalJobs: externalJobs.length + autoJobs.length,
        externalJobs,
        autoJobs
      };

      sendResponse({ success: true, data: exportData });
    });
    return true;
  }

  // 10. RECORD auto-applied job (direct version)
  if (action === 'recordAutoAppliedJob') {
    const newJob = data.job;

    chrome.storage.local.get(['autoAppliedJobs'], (result) => {
      let autoAppliedJobs = result.autoAppliedJobs || [];

      const isDuplicate = autoAppliedJobs.some(job =>
        job.link === newJob.link &&
        job.title?.toLowerCase().trim() === newJob.title?.toLowerCase().trim() &&
        job.companyName?.toLowerCase().trim() === newJob.companyName?.toLowerCase().trim()
      );

      if (!isDuplicate) {
        autoAppliedJobs.unshift(newJob);
        chrome.storage.local.set({ autoAppliedJobs }, () => {
          console.log("Job recorded:", newJob);
          sendResponse({ success: true });
        });
      } else {
        console.log("Duplicate job skipped");
        sendResponse({ success: false, reason: 'duplicate' });
      }
    });
    return true;
  }

  // 11. SAVE external job (manual application)
  if (action === 'saveExternalJob') {
    const { title, link, companyName } = data;

    const jobData = {
      id: Date.now(),
      title,
      link,
      companyName,
      time: Date.now()
    };

    chrome.storage.local.get(['externalApplyData'], (result) => {
      let externalJobs = result.externalApplyData || [];

      const isDuplicate = externalJobs.some(job =>
        job.link === jobData.link &&
        job.title?.toLowerCase().trim() === jobData.title?.toLowerCase().trim() &&
        job.companyName?.toLowerCase().trim() === jobData.companyName?.toLowerCase().trim()
      );

      if (!isDuplicate) {
        externalJobs.unshift(jobData);
        chrome.storage.local.set({ externalApplyData: externalJobs }, () => {
          console.log("External job saved:", jobData);
          sendResponse({ success: true, jobData });
        });
      } else {
        console.log("Duplicate external job skipped");
        sendResponse({ success: false, reason: 'duplicate' });
      }
    });
    return true;
  }
  const { key, value } = message;

  if (action === 'updateFilterSetting') {
    if (!key) {
      console.warn("No key provided in updateFilterSetting message");
      sendResponse({ success: false });
      return;
    }

    chrome.storage.local.set({ [key]: value }, () => {
      console.log('Updated filter setting:', key, value);
      sendResponse({ success: true });
    });

    return true; // Keep message channel alive
  }
});


// Helper function to check if job already exists (can be used elsewhere)
async function jobExists(jobTitle, jobLink, companyName, isAutoApplied = false) {
  try {
    const result = await chrome.storage.local.get(['externalApplyData', 'autoAppliedJobs']);
    const targetArray = isAutoApplied ? (result.autoAppliedJobs || []) : (result.externalApplyData || []);
    
    const normalizedTitle = jobTitle?.toLowerCase().trim();
    const normalizedCompany = companyName?.toLowerCase().trim();
    const normalizedLink = jobLink?.toLowerCase().trim();
    
    return targetArray.some(job => {
      const jobTitle_normalized = job.title?.toLowerCase().trim();
      const jobCompany_normalized = job.companyName?.toLowerCase().trim();
      const jobLink_normalized = job.link?.toLowerCase().trim();
      
      return (
        jobLink_normalized === normalizedLink || 
        (jobTitle_normalized === normalizedTitle && jobCompany_normalized === normalizedCompany)
      );
    });
  } catch (error) {
    console.error('Error checking job existence:', error);
    return false;
  }
}
