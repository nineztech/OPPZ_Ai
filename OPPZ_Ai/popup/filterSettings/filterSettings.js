document.addEventListener('DOMContentLoaded', () => {
    const badWordsToggle = document.getElementById('bad-words-toggle');
    const badWordsContainer = document.getElementById('bad-words-list');
    const newBadWordInput = document.getElementById('new-bad-word');
    const addBadWordButton = document.getElementById('add-bad-word-button');
    
    const titleFilterToggle = document.getElementById('title-filter-toggle');
    const titleFilterContainer = document.getElementById('title-filter-list');
    const newTitleFilterInput = document.getElementById('new-title-filter');
    const addTitleFilterButton = document.getElementById('add-title-filter-button');
    
    const titleSkipToggle = document.getElementById('title-skip-toggle');
    const titleSkipContainer = document.getElementById('title-skip-list');
    const newTitleSkipInput = document.getElementById('new-title-skip');
    const addTitleSkipButton = document.getElementById('add-title-skip-button');
    
    const isDuplicate = (word, words) => {
        if (words && words.some(w => w.toLowerCase() === word.toLowerCase())){
            alert("Oops! This word is already in your filter. Try adding a new one!");
            return true;
        }
        return false;
    }
    
    function initializeToggles() {
        chrome.storage.local.get(['badWordsEnabled', 'titleFilterEnabled', 'titleSkipEnabled'], (result) => {
            badWordsToggle.checked = result.badWordsEnabled ?? true;
            titleFilterToggle.checked = result.titleFilterEnabled ?? true;
            titleSkipToggle.checked = result.titleSkipEnabled ?? true;
        });
    }
    
    badWordsToggle.addEventListener('change', () => {
        chrome.storage.local.set({ badWordsEnabled: badWordsToggle.checked });
        notifyWebsiteOfChanges();
    });
    
    titleFilterToggle.addEventListener('change', () => {
        chrome.storage.local.set({ titleFilterEnabled: titleFilterToggle.checked });
        notifyWebsiteOfChanges();
    });
    
    titleSkipToggle.addEventListener('change', () => {
        chrome.storage.local.set({ titleSkipEnabled: titleSkipToggle.checked });
        notifyWebsiteOfChanges();
    });
    
    function loadBadWords() {
        chrome.storage.local.get('badWords', (result) => {
            const badWords = result?.badWords || [];
            badWordsContainer.innerHTML = '';
            badWords.forEach((word, index) => addWordItem(word, index, badWordsContainer, 'badWords'));
        });
    }
    
    function loadTitleFilter() {
        chrome.storage.local.get('titleFilterWords', (result) => {
            const titleFilterWords = result?.titleFilterWords || [];
            titleFilterContainer.innerHTML = '';
            titleFilterWords.forEach((word, index) => addWordItem(word, index, titleFilterContainer, 'titleFilterWords'));
        });
    }
    
    function loadTitleSkip() {
        chrome.storage.local.get('titleSkipWords', (result) => {
            const titleSkipWords = result?.titleSkipWords || [];
            titleSkipContainer.innerHTML = '';
            titleSkipWords.forEach((word, index) => addWordItem(word, index, titleSkipContainer, 'titleSkipWords'));
        });
    }
    
    function addWordItem(word, index, container, filterType) {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        
        const wordInput = document.createElement('input');
        wordInput.type = 'text';
        wordInput.value = word;
        wordInput.dataset.index = index;
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteWord(index, filterType));
        
        wordInput.addEventListener('change', () => updateWord(index, wordInput.value, filterType));
        
        wordItem.appendChild(wordInput);
        wordItem.appendChild(deleteButton);
        container.appendChild(wordItem);
    }
    
    addBadWordButton.addEventListener('click', () => {
        const newWord = newBadWordInput.value.trim();
        if (newWord) {
            chrome.storage.local.get('badWords', (result) => {
                if (!isDuplicate(newWord, result.badWords || [])) {
                    const updatedWords = [...(result.badWords || []), newWord];
                    chrome.storage.local.set({ badWords: updatedWords }, () => {
                        loadBadWords();
                        notifyWebsiteOfChanges();
                    });
                }
                newBadWordInput.value = '';
            });
        }
    });
    
    addTitleFilterButton.addEventListener('click', () => {
        const newWord = newTitleFilterInput.value.trim();
        if (newWord) {
            chrome.storage.local.get('titleFilterWords', (result) => {
                if (!isDuplicate(newWord, result.titleFilterWords || [])) {
                    const updatedWords = [...(result.titleFilterWords || []), newWord];
                    chrome.storage.local.set({ titleFilterWords: updatedWords }, () => {
                        loadTitleFilter();
                        notifyWebsiteOfChanges();
                    });
                }
                newTitleFilterInput.value = '';
            });
        }
    });
    
    addTitleSkipButton.addEventListener('click', () => {
        const newWord = newTitleSkipInput.value.trim();
        if (newWord) {
            chrome.storage.local.get('titleSkipWords', (result) => {
                if (!isDuplicate(newWord, result.titleSkipWords || [])) {
                    const updatedWords = [...(result.titleSkipWords || []), newWord];
                    chrome.storage.local.set({ titleSkipWords: updatedWords }, () => {
                        loadTitleSkip();
                        notifyWebsiteOfChanges();
                    });
                }
                newTitleSkipInput.value = '';
            });
        }
    });
    
    function deleteWord(index, filterType) {
        const key = {
            badWords: 'badWords',
            titleFilterWords: 'titleFilterWords',
            titleSkipWords: 'titleSkipWords'
        }[filterType];
        
        chrome.storage.local.get(key, (result) => {
            const updatedWords = (result[key] || []).filter((_, i) => i !== index);
            chrome.storage.local.set({ [key]: updatedWords }, () => {
                if (filterType === 'badWords') loadBadWords();
                else if (filterType === 'titleFilterWords') loadTitleFilter();
                else if (filterType === 'titleSkipWords') loadTitleSkip();
                notifyWebsiteOfChanges();
            });
        });
    }
    
    function updateWord(index, newWord, filterType) {
        const key = {
            badWords: 'badWords',
            titleFilterWords: 'titleFilterWords',
            titleSkipWords: 'titleSkipWords'
        }[filterType];
        
        chrome.storage.local.get(key, (result) => {
            const updatedWords = [...(result[key] || [])];
            updatedWords[index] = newWord.trim();
            chrome.storage.local.set({ [key]: updatedWords }, () => {
                notifyWebsiteOfChanges();
            });
        });
    }
    
    // NEW: Function to notify website of changes
    function notifyWebsiteOfChanges() {
        // This will notify any listening tabs about filter changes
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.url && tab.url.includes('your-website-domain.com')) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'filterSettingsUpdated',
                        timestamp: Date.now()
                    }).catch(() => {
                        // Ignore errors for tabs that don't have the content script
                    });
                }
            });
        });
    }
    
    // Initialize everything
    initializeToggles();
    loadBadWords();
    loadTitleFilter();
    loadTitleSkip();
});

// ✅ NEW: Add message listener for website communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Extension received message:', request);
    
    try {
        // Handle different message types from website
        switch (request.action) {
            case 'getFilterSettings':
                // Get all filter settings and send back to website
                chrome.storage.local.get([
                    'badWords', 'titleFilterWords', 'titleSkipWords',
                    'badWordsEnabled', 'titleFilterEnabled', 'titleSkipEnabled'
                ], (result) => {
                    console.log('Sending filter settings to website:', result);
                    sendResponse({
                        success: true,
                        badWords: result.badWords || [],
                        titleFilterWords: result.titleFilterWords || [],
                        titleSkipWords: result.titleSkipWords || [],
                        badWordsEnabled: result.badWordsEnabled ?? true,
                        titleFilterEnabled: result.titleFilterEnabled ?? true,
                        titleSkipEnabled: result.titleSkipEnabled ?? true
                    });
                });
                return true; // Keep response channel open
                
            case 'updateFilterSetting':
                // Update specific filter setting from website
                const { key, value } = request;
                console.log('Updating filter setting:', key, value);
                
                chrome.storage.local.set({ [key]: value }, () => {
                    console.log('Filter setting updated:', key, value);
                    
                    // Refresh UI if this popup is open
                    refreshUI(key);
                    
                    sendResponse({
                        success: true,
                        message: `Updated ${key} successfully`
                    });
                });
                return true; // Keep response channel open
                
            case 'ping':
                // Simple ping to test connection
                sendResponse({
                    success: true,
                    message: 'Extension is alive!',
                    timestamp: Date.now()
                });
                return false;
                
            default:
                console.warn('Unknown action:', request.action);
                sendResponse({
                    success: false,
                    error: 'Unknown action: ' + request.action
                });
                return false;
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({
            success: false,
            error: error.message
        });
        return false;
    }
});

// ✅ NEW: Function to refresh UI when settings change from website
function refreshUI(changedKey) {
    try {
        switch (changedKey) {
            case 'badWords':
                if (typeof loadBadWords === 'function') loadBadWords();
                break;
            case 'titleFilterWords':
                if (typeof loadTitleFilter === 'function') loadTitleFilter();
                break;
            case 'titleSkipWords':
                if (typeof loadTitleSkip === 'function') loadTitleSkip();
                break;
            case 'badWordsEnabled':
            case 'titleFilterEnabled':
            case 'titleSkipEnabled':
                if (typeof initializeToggles === 'function') initializeToggles();
                break;
        }
    } catch (error) {
        console.error('Error refreshing UI:', error);
    }
}

// ✅ NEW: Listen for storage changes from any source
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
        console.log('Storage changed:', changes);
        
        // Refresh relevant UI components
        Object.keys(changes).forEach(key => {
            refreshUI(key);
        });
    }
});

// ✅ NEW: Add debugging helper
console.log('OPPZ Extension filter settings script loaded');