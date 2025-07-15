// Enhanced FormManager with better auto-apply integration

class FormManager {
    constructor() {
        this.defaultNullFieldInput = {
            YearsOfExperience: '',
            FirstName: '',
            LastName: '',
            PhoneNumber: '',
            City: '',
            Email: ''
        };
        
        this.fieldMapping = {
            'First Name': 'FirstName',
            'Last Name': 'LastName',
            'Phone Number': 'PhoneNumber',
            'Mobile Phone Number': 'PhoneNumber',
            'Email': 'Email',
            'City': 'City',
            'Years of Experience': 'YearsOfExperience',
            'Experience': 'YearsOfExperience',
        };
        
        this.reverseFieldMapping = {
            'FirstName': 'First Name',
            'LastName': 'Last Name',
            'PhoneNumber': 'Phone Number',
            'Email': 'Email',
            'City': 'City',
            'YearsOfExperience': 'Years of Experience',
        };
        
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupInitialLoad();
            this.setupStorageListeners();
            this.setupObserver();
            this.addAutoApplyReadinessIndicator();
            this.setupMessageListeners();
        });
    }
    
    displayAndUpdateInputFieldConfig(configurations) {
    const configurationsDiv = document.getElementById('configurations');
    if (!configurationsDiv) return;

    configurationsDiv.innerHTML = '';

    if (configurations && configurations.length > 0) {
      const sortedConfigurations = configurations.sort((a, b) => {
        const countA = a.count || 0;
        const countB = b.count || 0;
        return countB - countA;
      });

      sortedConfigurations.forEach(config => {
        const configContainer = document.createElement('div');
        configContainer.className = 'config-container';
        configContainer.id = `config-${config.placeholderIncludes}-container`;

        configContainer.innerHTML = `
          <h3>${config.placeholderIncludes}</h3>
          <div class="config-details">
            <strong>Current Value:</strong> ${config.defaultValue || '—'}<br>
            <strong>Count:</strong> ${config.count || 0}
          </div>
        `;

        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.value = config.defaultValue || '';
        inputField.className = 'config-input';

        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update';
        updateButton.className = 'update-button';
        updateButton.addEventListener('click', () => {
          chrome.runtime.sendMessage({
            action: 'updateInputFieldValue',
            data: {
              placeholder: config.placeholderIncludes,
              value: inputField.value.trim()
            }
          }, () => {
            alert('Updated!');
          });
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', () => {
          chrome.runtime.sendMessage({
            action: 'deleteInputFieldConfig',
            data: config.placeholderIncludes
          }, () => {
            configContainer.remove();
          });
        });

        configContainer.appendChild(inputField);
        configContainer.appendChild(updateButton);
        configContainer.appendChild(deleteButton);

        configurationsDiv.appendChild(configContainer);
      });
    }
  }

    // Setup message listeners for communication with popup
    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'checkFormControlReadiness') {
                this.checkFormControlReadiness().then(result => {
                    sendResponse(result);
                });
                return true; // Keep message channel open for async response
            }
            
            if (request.action === 'getFormControlData') {
                chrome.storage.local.get(['defaultFields', 'inputFieldConfigs'], (result) => {
                    sendResponse({
                        defaultFields: result.defaultFields || {},
                        inputFieldConfigs: result.inputFieldConfigs || []
                    });
                });
                return true;
            }
        });
    }
    
    // Check form control readiness - method that popup can call
    async checkFormControlReadiness() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['defaultFields', 'inputFieldConfigs'], (result) => {
                const defaultFields = result.defaultFields || {};
                const inputFieldConfigs = result.inputFieldConfigs || [];
                const requiredFields = ['YearsOfExperience', 'FirstName', 'LastName', 'PhoneNumber', 'City', 'Email'];
                
                const filledFields = requiredFields.filter(field => 
                    defaultFields[field] && defaultFields[field].trim() !== ''
                );
                
                const missingFields = requiredFields.filter(field => 
                    !defaultFields[field] || defaultFields[field].trim() === ''
                );
                
                const isReady = missingFields.length === 0;
                
                resolve({
                    ready: isReady,
                    filledCount: filledFields.length,
                    totalCount: requiredFields.length,
                    missingFields: missingFields,
                    configCount: inputFieldConfigs.length,
                    defaultFields: defaultFields
                });
            });
        });
    }
    
    // Enhanced status message with auto-apply integration
    updateStatusMessage() {
        chrome.storage.local.get(['defaultFields', 'inputFieldConfigs', 'authToken', 'user'], (result) => {
            const defaultFields = result.defaultFields || {};
            const inputFieldConfigs = result.inputFieldConfigs || [];
            const isAuthenticated = !!(result.authToken && result.user);
            
            const requiredFields = ['YearsOfExperience', 'FirstName', 'LastName', 'PhoneNumber', 'City', 'Email'];
            let allFieldsFilled = true;
            let filledCount = 0;
            
            for (const fieldName of requiredFields) {
                if (defaultFields[fieldName] && defaultFields[fieldName].trim()) {
                    filledCount++;
                } else {
                    allFieldsFilled = false;
                }
            }
            
            const messageElement = document.getElementById('status-message');
            if (!messageElement) return;
            
            // Clear existing content
            messageElement.innerHTML = '';
            
            // Authentication check
            if (!isAuthenticated) {
                messageElement.innerHTML = `
                    <div style="color: #b50000; font-weight: bold; margin-bottom: 10px;">
                        ⚠ Please log in to use auto-apply functionality
                    </div>
                `;
                chrome.storage.local.set({ 'autoApplyReady': false });
                return;
            }
            
            if (allFieldsFilled) {
                messageElement.innerHTML = `
                    <div style="color: #007700; font-weight: bold; margin-bottom: 10px;">
                        ✅ You are ready to use auto apply!
                    </div>
                `;
                
                const syncedFields = inputFieldConfigs.filter(config => 
                    config.defaultValue && config.defaultValue.trim() !== ''
                );
                
                this.updateSyncInfo(messageElement, syncedFields.length, filledCount);
                chrome.storage.local.set({ 'autoApplyReady': true });
                
            
                // Add auto-apply test button
                this.addAutoApplyTestButton(messageElement);
                
                // Notify popup that form is ready
                chrome.runtime.sendMessage({ 
                    action: 'formControlReady', 
                    data: { ready: true, filledCount, totalCount: requiredFields.length }
                });
                
            } else {
                const missingFields = requiredFields.filter(fieldName => 
                    !defaultFields[fieldName] || !defaultFields[fieldName].trim()
                );
                
                messageElement.innerHTML = `
                    <div style="color: #b50000; margin-bottom: 10px;">
                        <strong>Please fill out the missing values (${filledCount}/${requiredFields.length} completed):</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            ${missingFields.map(field => `<li>${this.getInputLabelText(field)}</li>`).join('')}
                        </ul>
                    </div>
                `;
                
                this.removeSyncInfo(messageElement);
                chrome.storage.local.set({ 'autoApplyReady': false });
                
                // Notify popup that form is not ready
                chrome.runtime.sendMessage({ 
                    action: 'formControlNotReady', 
                    data: { ready: false, filledCount, totalCount: requiredFields.length, missingFields }
                });
            }
            
            // Add progress indicator
            this.addProgressIndicator(messageElement, filledCount, requiredFields.length);
        });
    }
    
    // Add auto-apply readiness indicator
    addAutoApplyReadinessIndicator() {
        const headerElement = document.querySelector('.default-input-header');
        if (headerElement) {
            const indicator = document.createElement('div');
            indicator.id = 'auto-apply-readiness-indicator';
            indicator.style.cssText = `
                background: #f0f0f0;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
                text-align: center;
            `;
            
            headerElement.parentNode.insertBefore(indicator, headerElement.nextSibling);
            this.updateReadinessIndicator();
        }
    }
    
    // Update readiness indicator
    updateReadinessIndicator() {
        const indicator = document.getElementById('auto-apply-readiness-indicator');
        if (!indicator) return;
        
        chrome.storage.local.get(['defaultFields', 'authToken', 'user'], (result) => {
            const defaultFields = result.defaultFields || {};
            const isAuthenticated = !!(result.authToken && result.user);
            const requiredFields = ['YearsOfExperience', 'FirstName', 'LastName', 'PhoneNumber', 'City', 'Email'];
            
            const filledCount = requiredFields.filter(field => 
                defaultFields[field] && defaultFields[field].trim()
            ).length;
            
            const isReady = isAuthenticated && filledCount === requiredFields.length;
            
            if (isReady) {
                indicator.innerHTML = `
                    <div style="color: #007700;">
                        <h3 style="margin: 0 0 10px 0;">🎉 Auto-Apply Ready!</h3>
                        <p style="margin: 0;">You can now use the auto-apply feature on LinkedIn job pages.</p>
                        <button id="goto-popup-button" style="margin-top: 10px; padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Go to Auto-Apply
                        </button>
                    </div>
                `;
                indicator.style.background = '#e8f5e8';
                indicator.style.borderColor = '#4caf50';
                
                // Add event listener to the button
                const gotoButton = indicator.querySelector('#goto-popup-button');
                if (gotoButton) {
                    gotoButton.addEventListener('click', () => {
                        // Open popup or navigate to LinkedIn
                        chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/search/' });
                    });
                }
            } else if (!isAuthenticated) {
                indicator.innerHTML = `
                    <div style="color: #b50000;">
                        <h3 style="margin: 0 0 10px 0;">🔒 Authentication Required</h3>
                        <p style="margin: 0;">Please log in to enable auto-apply functionality.</p>
                        <button id="login-button" style="margin-top: 10px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Login Now
                        </button>
                    </div>
                `;
                indicator.style.background = '#ffeaea';
                indicator.style.borderColor = '#f44336';
                
                // Add event listener to login button
                const loginButton = indicator.querySelector('#login-button');
                if (loginButton) {
                    loginButton.addEventListener('click', () => {
                        window.location.href = chrome.runtime.getURL('popup/auth/login.html');
                    });
                }
            } else {
                indicator.innerHTML = `
                    <div style="color: #ff9800;">
                        <h3 style="margin: 0 0 10px 0;">⚠ Setup Required</h3>
                        <p style="margin: 0;">Complete ${requiredFields.length - filledCount} more fields to enable auto-apply.</p>
                        <div style="margin-top: 10px;">
                            <div style="background: #e0e0e0; border-radius: 10px; height: 20px; overflow: hidden;">
                                <div style="background: #ff9800; height: 100%; width: ${(filledCount / requiredFields.length) * 100}%; transition: width 0.3s ease;"></div>
                            </div>
                            <small style="margin-top: 5px; display: block;">${filledCount}/${requiredFields.length} fields completed</small>
                        </div>
                    </div>
                `;
                indicator.style.background = '#fff3e0';
                indicator.style.borderColor = '#ff9800';
            }
        });
    }
    
    // Add auto-apply test button
    addAutoApplyTestButton(messageElement) {
        const existingButton = messageElement.querySelector('.auto-apply-test-button');
        if (existingButton) return;
        
        const testButton = document.createElement('button');
        testButton.className = 'auto-apply-test-button';
        testButton.textContent = 'Test Auto-Apply Setup';
        testButton.style.cssText = `
            background: #0066cc;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 14px;
        `;
        
        testButton.addEventListener('click', () => {
            this.testAutoApplySetup();
        });
        
        messageElement.appendChild(testButton);
    }
    
    // Test auto-apply setup
    testAutoApplySetup() {
        chrome.storage.local.get(['defaultFields', 'inputFieldConfigs', 'authToken', 'user'], (result) => {
            const defaultFields = result.defaultFields || {};
            const inputFieldConfigs = result.inputFieldConfigs || [];
            const isAuthenticated = !!(result.authToken && result.user);
            
            let report = '🔍 Auto-Apply Setup Report:\n\n';
            
            // Authentication check
            if (isAuthenticated) {
                report += '✅ Authentication: Logged in\n';
            } else {
                report += '❌ Authentication: Not logged in\n';
            }
            
            // Required fields check
            report += '\n📋 Required Fields:\n';
            const requiredFields = ['YearsOfExperience', 'FirstName', 'LastName', 'PhoneNumber', 'City', 'Email'];
            requiredFields.forEach(field => {
                const value = defaultFields[field];
                const status = value && value.trim() ? '✅' : '❌';
                const displayName = this.getInputLabelText(field);
                report += `${status} ${displayName}: ${value || 'Not filled'}\n`;
            });
            
            // Website configurations
            report += '\n🌐 Website Configurations:\n';
            if (inputFieldConfigs.length > 0) {
                report += `✅ ${inputFieldConfigs.length} field configurations found\n`;
                inputFieldConfigs.forEach(config => {
                    const hasValue = config.defaultValue && config.defaultValue.trim();
                    const status = hasValue ? '✅' : '⚠️';
                    report += `${status} ${config.placeholderIncludes}: ${config.defaultValue || 'No default value'}\n`;
                });
            } else {
                report += '⚠️ No website configurations found\n';
                report += '   (These will be created automatically when you visit LinkedIn job pages)\n';
            }
            
            // Overall readiness
            const allRequiredFilled = requiredFields.every(field => 
                defaultFields[field] && defaultFields[field].trim()
            );
            
            report += '\n🎯 Overall Status:\n';
            if (isAuthenticated && allRequiredFilled) {
                report += '✅ Ready to use auto-apply!\n';
                report += '\nYou can now:\n';
                report += '• Go to LinkedIn job search pages\n';
                report += '• Use the auto-apply feature from the extension popup\n';
                report += '• The system will automatically fill forms with your data\n';
            } else {
                report += '❌ Not ready for auto-apply\n';
                report += '\nTo get ready:\n';
                if (!isAuthenticated) {
                    report += '• Log in to your account\n';
                }
                if (!allRequiredFilled) {
                    report += '• Fill out all required fields above\n';
                }
            }
            
            alert(report);
        });
    }
    
    // Enhanced sync info display
    updateSyncInfo(messageElement, syncedCount, filledCount) {
        const existingSyncInfo = messageElement.querySelector('.sync-info');
        if (existingSyncInfo) {
            existingSyncInfo.remove();
        }
        
         

        const syncInfo = document.createElement('div');
        syncInfo.className = 'sync-info';
        syncInfo.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-top: 10px;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 5px;
            border-left: 4px solid #007700;
        `;
        
        syncInfo.innerHTML = `
            <strong>Setup Complete:</strong><br>
            • ${filledCount} personal fields configured<br>
            ${syncedCount > 0 ? `• ${syncedCount} website fields synced<br>` : ''}
            • Ready for LinkedIn job applications
        `;
        
        messageElement.appendChild(syncInfo);
    }
    
    // Add progress indicator
    addProgressIndicator(messageElement, filledCount, totalCount) {
        const existingProgress = messageElement.querySelector('.progress-indicator');
        if (existingProgress) {
            existingProgress.remove();
        }
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-indicator';
        progressContainer.style.cssText = `
            margin-top: 15px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
        `;
        
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            background: #e0e0e0;
            border-radius: 10px;
            height: 20px;
            overflow: hidden;
            margin-bottom: 5px;
        `;
        
        const progressFill = document.createElement('div');
        const percentage = (filledCount / totalCount) * 100;
        progressFill.style.cssText = `
            background: ${percentage === 100 ? '#4caf50' : '#2196f3'};
            height: 100%;
            width: ${percentage}%;
            transition: width 0.3s ease;
        `;
        
        progressBar.appendChild(progressFill);
        
        const progressText = document.createElement('div');
        progressText.style.cssText = `
            font-size: 12px;
            color: #666;
            text-align: center;
        `;
        progressText.textContent = `${filledCount}/${totalCount} fields completed (${Math.round(percentage)}%)`;
        
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(progressText);
        messageElement.appendChild(progressContainer);
    }
    
    // Remove sync info
    removeSyncInfo(messageElement) {
        const existingSyncInfo = messageElement.querySelector('.sync-info');
        if (existingSyncInfo) {
            existingSyncInfo.remove();
        }
    }
    
    // Get input label text
    getInputLabelText(fieldName) {
        const labels = {
            'YearsOfExperience': 'Years of Experience',
            'FirstName': 'First Name',
            'LastName': 'Last Name',
            'PhoneNumber': 'Phone Number',
            'City': 'City',
            'Email': 'Email'
        };
        return labels[fieldName] || fieldName;
    }
    
    // Override the original handleInputChange to include readiness updates
    async handleInputChange(event) {
        const fieldName = event.target.getAttribute('name');
        const fieldValue = event.target.value.trim();
        
        // Update visual feedback
        if (fieldValue) {
            event.target.classList.remove('input-error');
            event.target.classList.add('input-success');
        } else {
            event.target.classList.add('input-error');
            event.target.classList.remove('input-success');
        }
        
        // Update default fields
        await new Promise((resolve) => {
            chrome.storage.local.get('defaultFields', (result) => {
                const defaultFields = result.defaultFields || {};
                defaultFields[fieldName] = fieldValue;
                chrome.storage.local.set({ 'defaultFields': defaultFields }, resolve);
            });
        });
        
        // Update corresponding website configs
        const websiteFieldName = this.reverseFieldMapping[fieldName];
        if (websiteFieldName) {
            await this.updateConfigDefaultFields(websiteFieldName, fieldValue);
        }
        
        // Update all status displays
        this.updateStatusMessage();
        this.updateReadinessIndicator();
        
        // Notify popup and other parts of the extension
        chrome.runtime.sendMessage({ 
            action: 'formFieldUpdated', 
            fieldName, 
            fieldValue 
        });
        
        // Also notify about readiness change
        const readinessCheck = await this.checkFormControlReadiness();
        chrome.runtime.sendMessage({ 
            action: 'formControlReadinessChanged', 
            data: readinessCheck 
        });
    }
    
    // Setup initial load
    setupInitialLoad() {
        chrome.storage.local.get(['defaultFields'], (result) => {
            const defaultFields = result.defaultFields || {};
            
            // Fill form fields with stored values
            Object.keys(this.defaultNullFieldInput).forEach(fieldName => {
                const input = document.querySelector(`input[name="${fieldName}"]`);
                if (input) {
                    input.value = defaultFields[fieldName] || '';
                    // Add visual feedback
                    if (input.value.trim()) {
                        input.classList.add('input-success');
                    } else {
                        input.classList.add('input-error');
                    }
                }
            });
            
            // Update status message
            this.updateStatusMessage();
        });
    }
    
    // Setup storage listeners
    setupStorageListeners() {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local') {
                if (changes.defaultFields || changes.inputFieldConfigs || changes.authToken || changes.user) {
                    this.updateStatusMessage();
                    this.updateReadinessIndicator();
                }
            }
        });
    }
    
    // Setup observer for form changes
    setupObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Re-setup event listeners if form is dynamically updated
                    this.setupFormEventListeners();
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Setup form event listeners
    setupFormEventListeners() {
        const inputs = document.querySelectorAll('input[name]');
        inputs.forEach(input => {
            if (!input.hasAttribute('data-listener-attached')) {
                input.addEventListener('input', (event) => {
                    this.handleInputChange(event);
                });
                input.setAttribute('data-listener-attached', 'true');
            }
        });
    }
    
    // Update config default fields
    async updateConfigDefaultFields(fieldName, fieldValue) {
        return new Promise((resolve) => {
            chrome.storage.local.get('inputFieldConfigs', (result) => {
                const configs = result.inputFieldConfigs || [];
                let updated = false;
                
                configs.forEach(config => {
                    if (config.placeholderIncludes === fieldName) {
                        config.defaultValue = fieldValue;
                        updated = true;
                    }
                });
                
                if (updated) {
                    chrome.storage.local.set({ 'inputFieldConfigs': configs }, resolve);
                } else {
                    resolve();
                }
            });
        });
    }
    
    // Enhanced CSS for better visual feedback
    addEnhancedStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .input-error {
                border-color: #f44336 !important;
                background-color: #ffebee !important;
            }
            
            .input-success {
                border-color: #4caf50 !important;
                background-color: #e8f5e8 !important;
            }
            
            .field-container {
                margin-bottom: 15px;
            }
            
            .field-container label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            
            .field-container input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                transition: all 0.3s ease;
            }
            
            .field-container input:focus {
                outline: none;
                border-color: #2196f3;
                box-shadow: 0 0 5px rgba(33, 150, 243, 0.3);
            }
            
            #auto-apply-readiness-indicator {
                transition: all 0.3s ease;
            }
            
            #auto-apply-readiness-indicator button {
                transition: all 0.2s ease;
            }
            
            #auto-apply-readiness-indicator button:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize the FormManager when the script loads
document.addEventListener('DOMContentLoaded', () => {
    const formManager = new FormManager();
    formManager.addEnhancedStyles();
    formManager.setupFormEventListeners();
    
    // Make it globally accessible for debugging
    window.formManager = formManager;
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormManager;
}
// Initialize the form manager
const formManager = new FormManager();
window.formManager = formManager; // 👈 Make it accessible globally
