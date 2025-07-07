// Enhanced Chrome Extension Form Manager with improvements

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
        });
    }
    
    setupInitialLoad() {
        this.fetchInputFieldConfigs(this.displayAndUpdateInputFieldConfig.bind(this));
        this.fetchRadioButtonConfigs(this.displayRadioButtonConfigs.bind(this));
        this.fetchDropdownConfigs(this.displayDropdownConfigs.bind(this));
        this.loadDefaultFields();
        this.addSyncButton();
        this.startAutoSync();
    }
    
    setupStorageListeners() {
        chrome.storage.onChanged.addListener(changes => {
            if ('inputFieldConfigs' in changes) {
                const newConfigurations = changes.inputFieldConfigs.newValue || [];
                this.displayAndUpdateInputFieldConfig(newConfigurations);
                setTimeout(() => this.syncWebsiteDataWithForm(), 500);
            }
            if ('radioButtons' in changes) {
                const newConfigurations = changes.radioButtons.newValue || [];
                this.displayRadioButtonConfigs(newConfigurations);
            }
            if ('dropdowns' in changes) {
                const newConfigurations = changes.dropdowns.newValue || [];
                this.displayDropdownConfigs(newConfigurations);
            }
            if ('defaultFields' in changes) {
                const newDefaultFields = changes.defaultFields.newValue || {};
                this.renderInputFields(newDefaultFields);
                this.updateStatusMessage();
            }
        });
    }
    
    setupObserver() {
        const defaultInputSection = document.getElementById('default-input-fields');
        if (defaultInputSection) {
            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        this.setupInputFieldEventListeners();
                    }
                }
            });
            
            observer.observe(defaultInputSection, { childList: true, subtree: true });
            
            window.addEventListener('beforeunload', () => {
                observer.disconnect();
            });
        }
    }
    
    // Utility Functions
    sortData(data) {
        return data.sort((a, b) => {
            const countA = a.count === undefined ? -Infinity : a.count;
            const countB = b.count === undefined ? -Infinity : b.count;
            return countB - countA;
        }).sort((a, b) => {
            const timeA = a.createdAt === undefined ? -Infinity : a.createdAt;
            const timeB = b.createdAt === undefined ? -Infinity : b.createdAt;
            return timeB - timeA;
        });
    }
    
    isNumeric(str) {
        return /^\d+$/.test(str);
    }
    
    // Storage Functions
    async fetchInputFieldConfigs(callback) {
        try {
            const result = await new Promise(resolve => {
                chrome.runtime.sendMessage({ action: 'getInputFieldConfig' }, resolve);
            });
            callback(result || []);
        } catch (error) {
            console.error('Error fetching input field configs:', error);
            callback([]);
        }
    }
    
    async fetchRadioButtonConfigs(callback) {
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get('radioButtons', resolve);
            });
            callback(result?.radioButtons || []);
        } catch (error) {
            console.error('Error fetching radio button configs:', error);
            callback([]);
        }
    }
    
    async fetchDropdownConfigs(callback) {
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get('dropdowns', resolve);
            });
            callback(result.dropdowns || []);
        } catch (error) {
            console.error('Error fetching dropdown configs:', error);
            callback([]);
        }
    }
    
    // Display Functions
    displayRadioButtonConfigs(radioButtons) {
        const configurationsDiv = document.getElementById('radio');
        if (!configurationsDiv) return;
        
        configurationsDiv.innerHTML = '';
        const sortedRadioButtons = this.sortData(radioButtons);
        
        sortedRadioButtons.forEach(config => {
            const configContainer = this.createRadioButtonConfig(config);
            configurationsDiv.appendChild(configContainer);
        });
    }
    
    createRadioButtonConfig(config) {
        const configContainer = document.createElement('div');
        configContainer.className = 'config-container';
        configContainer.id = `radio-config-${config.placeholderIncludes}-container`;
        
        const questionTitle = document.createElement('h3');
        questionTitle.textContent = config.placeholderIncludes;
        configContainer.appendChild(questionTitle);
        
        const configDetails = document.createElement('div');
        configDetails.className = 'config-details';
        configDetails.innerHTML = `
            <div class="selected-option">
                <h3><strong>Counter:</strong> ${config.count}</h3>
            </div>
        `;
        configContainer.appendChild(configDetails);
        
        config.options.forEach(option => {
            const radioContainer = document.createElement('div');
            radioContainer.className = 'radio-container';
            
            const radioButton = document.createElement('input');
            radioButton.type = 'radio';
            radioButton.name = `config-${config.placeholderIncludes}-radio`;
            radioButton.value = option.value;
            radioButton.checked = option.selected;
            
            const label = document.createElement('label');
            label.textContent = this.isNumeric(option.value) ? option?.text : option.value;
            
            radioContainer.appendChild(radioButton);
            radioContainer.appendChild(label);
            configContainer.appendChild(radioContainer);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => this.deleteRadioButtonConfig(config.placeholderIncludes));
        configContainer.appendChild(deleteButton);
        
        this.addUpdateRadioButtonGroupEventListener(config.placeholderIncludes);
        
        return configContainer;
    }
    
    displayDropdownConfigs(dropdowns) {
        const configurationsDiv = document.getElementById('dropdown');
        if (!configurationsDiv) return;
        
        configurationsDiv.innerHTML = '';
        const sortedDropdowns = this.sortData(dropdowns);
        
        sortedDropdowns.forEach(config => {
            const configContainer = this.createDropdownConfig(config);
            configurationsDiv.appendChild(configContainer);
        });
    }
    
    createDropdownConfig(config) {
        const configContainer = document.createElement('div');
        configContainer.className = 'config-container';
        configContainer.id = `dropdown-config-${config.placeholderIncludes}-container`;
        
        const questionTitle = document.createElement('h3');
        questionTitle.textContent = config.placeholderIncludes;
        configContainer.appendChild(questionTitle);
        
        const configDetails = document.createElement('div');
        configDetails.className = 'config-details';
        configDetails.innerHTML = `
            <div class="dropdown-details">
                <h3><strong>Counter:</strong> ${config.count}</h3>
            </div>
        `;
        
        const selectContainer = document.createElement('div');
        selectContainer.className = 'select-container';
        const select = document.createElement('select');
        
        config.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.value;
            if (option.selected) {
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        });
        
        selectContainer.appendChild(select);
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => this.deleteDropdownConfig(config.placeholderIncludes));
        
        configDetails.appendChild(selectContainer);
        configContainer.appendChild(configDetails);
        configContainer.appendChild(deleteButton);
        
        this.addUpdateDropDownGroupEventListener(config.placeholderIncludes);
        
        return configContainer;
    }
    
    displayAndUpdateInputFieldConfig(configurations) {
        const configurationsDiv = document.getElementById('configurations');
        if (!configurationsDiv) return;
        
        configurationsDiv.innerHTML = '';
        
        if (configurations && configurations.length > 0) {
            const sortedConfigurations = this.sortData(configurations);
            sortedConfigurations.forEach(config => {
                const configContainer = this.createInputFieldConfig(config);
                configurationsDiv.appendChild(configContainer);
            });
        }
    }
    
    createInputFieldConfig(config) {
        const configContainer = document.createElement('div');
        configContainer.id = `config-${config.placeholderIncludes}-container`;
        configContainer.className = 'config-container';
        
        configContainer.innerHTML = `
            <div class="config-container">
                <h3>${config.placeholderIncludes}</h3>
                <div class="config-details">
                    <h3><strong>Current Value:</strong> ${config.defaultValue}</h3>
                    <h3><strong>Counter:</strong> ${config.count}</h3>
                </div>
            </div>
        `;
        
        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.id = `config-${config.placeholderIncludes}`;
        inputField.placeholder = 'New Default Value';
        inputField.className = 'config-input';
        inputField.value = config.defaultValue;
        
        const buttonsWrapper = document.createElement('div');
        buttonsWrapper.className = 'buttons-wrapper';
        
        const updateButton = document.createElement('button');
        updateButton.className = 'update-button';
        updateButton.textContent = 'Update';
        updateButton.addEventListener('click', () => this.updateConfigFormControl(config.placeholderIncludes));
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => this.deleteConfig(config.placeholderIncludes));
        
        buttonsWrapper.appendChild(updateButton);
        buttonsWrapper.appendChild(deleteButton);
        
        configContainer.appendChild(inputField);
        configContainer.appendChild(buttonsWrapper);
        
        return configContainer;
    }
    
    // Event Listeners
    addUpdateRadioButtonGroupEventListener(placeholder) {
        const configurationsDiv = document.getElementById('radio');
        if (!configurationsDiv) return;
        
        configurationsDiv.addEventListener('change', (event) => {
            if (event.target.matches(`[name="config-${placeholder}-radio"]`)) {
                chrome.runtime.sendMessage({
                    action: 'updateRadioButtonValueByPlaceholder',
                    placeholderIncludes: placeholder,
                    newValue: event.target.value
                });
            }
        });
    }
    
    async addUpdateDropDownGroupEventListener(placeholderIncludes) {
        const select = document.getElementById(`dropdown-config-${placeholderIncludes}-container`)?.querySelector('select');
        if (!select) return;
        
        select.addEventListener('change', async () => {
            const newValue = select.value;
            
            if (newValue !== '') {
                try {
                    const { dropdowns } = await new Promise(resolve => {
                        chrome.storage.local.get('dropdowns', resolve);
                    });
                    
                    const currentDropdownConfig = dropdowns.find(config => 
                        config.placeholderIncludes === placeholderIncludes
                    );
                    
                    if (currentDropdownConfig) {
                        await chrome.runtime.sendMessage({
                            action: 'updateDropdownConfig',
                            data: {
                                placeholderIncludes: placeholderIncludes,
                                options: currentDropdownConfig.options,
                                value: newValue,
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error updating dropdown:', error);
                }
            }
        });
    }
    
    // Delete Functions
    async deleteRadioButtonConfig(placeholder) {
        await chrome.runtime.sendMessage({ action: 'deleteRadioButtonConfig', data: placeholder });
    }
    
    deleteDropdownConfig(placeholderIncludes) {
        chrome.runtime.sendMessage({ action: 'deleteDropdownConfig', data: placeholderIncludes });
        const configContainer = document.getElementById(`dropdown-config-${placeholderIncludes}-container`);
        if (configContainer) {
            configContainer.remove();
        }
    }
    
    deleteConfig(placeholder) {
        chrome.runtime.sendMessage({ action: 'deleteInputFieldConfig', data: placeholder });
        const configContainer = document.getElementById(`config-${placeholder}-container`);
        if (configContainer) {
            configContainer.remove();
        }
    }
    
    // Update Functions
    updateConfigFormControl(placeholder) {
        const inputField = document.getElementById(`config-${placeholder}`);
        if (!inputField) return;
        
        const newValue = inputField.value.trim();
        chrome.runtime.sendMessage({ 
            action: 'updateInputFieldValue', 
            data: { placeholder, value: newValue } 
        });
    }
    
    async updateConfigDefaultFields(placeholder, newValue) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ 
                action: 'updateInputFieldValue', 
                data: { placeholder, value: newValue } 
            }, () => {
                resolve();
            });
        });
    }
    
    // Default Fields Management
    loadDefaultFields() {
        chrome.storage.local.get(['defaultFields'], (result) => {
            const defaultFields = result.defaultFields || {};
            
            if (Object.keys(defaultFields).length === 0) {
                chrome.storage.local.set({ 'defaultFields': this.defaultNullFieldInput }, () => {
                    this.syncWebsiteDataWithForm();
                });
            } else {
                this.syncWebsiteDataWithForm();
            }
        });
    }
    
    updateStatusMessage() {
        chrome.storage.local.get(['defaultFields', 'inputFieldConfigs'], (result) => {
            const defaultFields = result.defaultFields || {};
            const inputFieldConfigs = result.inputFieldConfigs || [];
            
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
            
            if (allFieldsFilled) {
                messageElement.textContent = 'You are ready to use auto apply!';
                messageElement.style.color = '#007700';
                messageElement.style.fontWeight = 'bold';
                
                const syncedFields = inputFieldConfigs.filter(config => 
                    config.defaultValue && config.defaultValue.trim() !== ''
                );
                
                this.updateSyncInfo(messageElement, syncedFields.length);
                chrome.storage.local.set({ 'autoApplyReady': true });
            } else {
                messageElement.textContent = `Please fill out the missing values (${filledCount}/${requiredFields.length} completed):`;
                messageElement.style.color = '#b50000';
                messageElement.style.fontWeight = 'normal';
                
                this.removeSyncInfo(messageElement);
                chrome.storage.local.set({ 'autoApplyReady': false });
            }
        });
    }
    
    updateSyncInfo(messageElement, syncedCount) {
        const existingSyncInfo = messageElement.parentNode.querySelector('.sync-info');
        if (existingSyncInfo) {
            existingSyncInfo.remove();
        }
        
        if (syncedCount > 0) {
            const syncInfo = document.createElement('div');
            syncInfo.className = 'sync-info';
            syncInfo.style.cssText = `
                font-size: 12px;
                color: #666;
                margin-top: 5px;
            `;
            syncInfo.textContent = `${syncedCount} fields synced from website data`;
            messageElement.parentNode.appendChild(syncInfo);
        }
    }
    
    removeSyncInfo(messageElement) {
        const existingSyncInfo = messageElement.parentNode.querySelector('.sync-info');
        if (existingSyncInfo) {
            existingSyncInfo.remove();
        }
    }
    
    // Form Field Management
    createInputField(fieldName, fieldValue) {
        const fieldContainer = document.createElement('div');
        fieldContainer.classList.add('field-container');
        
        const inputLabel = document.createElement('label');
        inputLabel.textContent = this.getInputLabelText(fieldName);
        
        const inputField = document.createElement('input');
        inputField.setAttribute('name', fieldName);
        inputField.value = fieldValue || '';
        
        if (!inputField.value) {
            inputField.classList.add('input-error');
        }
        
        fieldContainer.appendChild(inputLabel);
        fieldContainer.appendChild(inputField);
        
        return fieldContainer;
    }
    
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
    
    // Sync Functions
    syncWebsiteDataWithForm() {
        chrome.storage.local.get(['inputFieldConfigs', 'defaultFields'], (result) => {
            const inputFieldConfigs = result.inputFieldConfigs || [];
            const defaultFields = result.defaultFields || this.defaultNullFieldInput;
            
            let updatedDefaultFields = { ...defaultFields };
            let hasUpdates = false;
            
            inputFieldConfigs.forEach(config => {
               const websiteFieldName = config.placeholderIncludes.trim();
const formFieldName = this.fieldMapping[websiteFieldName] 
  || this.fieldMapping[websiteFieldName.toLowerCase()];

                
                if (formFieldName && config.defaultValue && config.defaultValue.trim() !== '') {
                    if (!updatedDefaultFields[formFieldName] || 
                        updatedDefaultFields[formFieldName] !== config.defaultValue) {
                        updatedDefaultFields[formFieldName] = config.defaultValue;
                        hasUpdates = true;
                        console.log(`Synced ${websiteFieldName} -> ${formFieldName}: ${config.defaultValue}`);
                    }
                }
            });
            
            if (hasUpdates) {
                chrome.storage.local.set({ 'defaultFields': updatedDefaultFields }, () => {
                    this.renderInputFields(updatedDefaultFields);
                    this.updateStatusMessage();
                    console.log('Form synced with website data');
                });
            } else {
                this.renderInputFields(updatedDefaultFields);
                this.updateStatusMessage();
            }
        });
    }
    
    renderInputFields(defaultFields) {
        const inputFieldsContainer = document.getElementById('default-input-fields');
        if (!inputFieldsContainer) return;
        
        inputFieldsContainer.innerHTML = '';
        
        chrome.storage.local.get(['inputFieldConfigs'], (result) => {
            const inputFieldConfigs = result.inputFieldConfigs || [];
            
            for (const fieldName in defaultFields) {
                const fieldContainer = this.createInputField(fieldName, defaultFields[fieldName]);
                
                const websiteFieldName = this.reverseFieldMapping[fieldName];
                const websiteConfig = inputFieldConfigs.find(config => 
                    config.placeholderIncludes === websiteFieldName
                );
                
                if (websiteConfig && websiteConfig.defaultValue) {
                    this.addSyncIndicator(fieldContainer);
                }
                
                inputFieldsContainer.appendChild(fieldContainer);
            }
            
            this.updateStatusMessage();
            setTimeout(() => this.setupInputFieldEventListeners(), 100);
        });
    }
    
    addSyncIndicator(fieldContainer) {
        const syncIndicator = document.createElement('span');
        syncIndicator.className = 'sync-indicator';
        syncIndicator.textContent = '(synced from website)';
        syncIndicator.style.cssText = `
            color: #666;
            font-size: 12px;
            margin-left: 10px;
        `;
        
        const label = fieldContainer.querySelector('label');
        label.appendChild(syncIndicator);
    }
    
    setupInputFieldEventListeners() {
        const defaultInputContainers = document.querySelectorAll('#default-input-fields .field-container');
        
        defaultInputContainers.forEach((fieldContainer) => {
            const inputs = fieldContainer.querySelectorAll('input');
            inputs.forEach((input) => {
                if (!input.dataset.listenerAdded) {
                    input.addEventListener('change', async (event) => {
                        await this.handleInputChange(event);
                    });
                    input.dataset.listenerAdded = 'true';
                }
            });
        });
    }
    
    async handleInputChange(event) {
        const fieldName = event.target.getAttribute('name');
        const fieldValue = event.target.value.trim();
        
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
        
        this.updateStatusMessage();
    }
    
    // UI Enhancement Functions
    addSyncButton() {
        const headerElement = document.querySelector('.default-input-header');
        if (headerElement) {
            const syncButton = this.createSyncButton();
            headerElement.parentNode.insertBefore(syncButton, headerElement.nextSibling);
        }
    }
    
    createSyncButton() {
        const syncButton = document.createElement('button');
        syncButton.textContent = 'Sync with Website Data';
        syncButton.className = 'sync-button';
        syncButton.style.cssText = `
            background-color: #0066cc;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px 0;
            font-size: 12px;
        `;
        
        syncButton.addEventListener('click', () => {
            syncButton.textContent = 'Syncing...';
            syncButton.disabled = true;
            
            this.syncWebsiteDataWithForm();
            
            setTimeout(() => {
                syncButton.textContent = 'Sync with Website Data';
                syncButton.disabled = false;
            }, 1000);
        });
        
        return syncButton;
    }
    
    startAutoSync() {
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.syncWebsiteDataWithForm();
            }
        }, 30000);
    }
    
    // Debug Functions
    forceStatusUpdate() {
        chrome.storage.local.get('defaultFields', (result) => {
            const defaultFields = result.defaultFields || {};
            this.renderInputFields(defaultFields);
            this.updateStatusMessage();
        });
    }
}

// Initialize the form manager
const formManager = new FormManager();

// Make forceStatusUpdate available globally for debugging
window.forceStatusUpdate = () => formManager.forceStatusUpdate();