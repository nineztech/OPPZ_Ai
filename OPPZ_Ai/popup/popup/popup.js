// Fixed popup.js - Consolidated authentication and initialization
function changeAutoApplyButton(isRunning, selector) {
	const startIcon = document.getElementById('start-icon')
	const runningIcon = document.getElementById('running-icon')
	
	if (isRunning) {
		selector.classList.add('running')
		selector.textContent = 'Stop Auto Apply'
		if (startIcon) startIcon.style.display = 'none'
		if (runningIcon) runningIcon.style.display = 'inline'
	} else {
		selector.classList.remove('running')
		selector.textContent = 'Start Auto Apply'
		if (startIcon) startIcon.style.display = 'inline'
		if (runningIcon) runningIcon.style.display = 'none'
	}
}

const getCurrentUrl = () => {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs.length > 0) {
				chrome.tabs.sendMessage(tabs[0].id, { action: 'getCurrentUrl' }, (response) => {
					const url = response?.url
					if (!url?.includes('linkedin.com/jobs')) {
						alert('Saved is only available on the LinkedIn jobs search page.')
						resolve(false)
					}
					resolve(response.url)
				})
			} else {
				reject('Active tab not found')
			}
		})
	})
}

// Function to check authentication
const checkAuthentication = async () => {
    try {
        const result = await chrome.storage.local.get(['authToken', 'user']);
        console.log('Auth check result:', { hasToken: !!result.authToken, hasUser: !!result.user });
        
        return !!(result.authToken && result.user);
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
};

// Function to initialize main popup content
const initializeMainPopup = async () => {
    try {
        console.log('Initializing main popup...');
        
        // Get user data and display
        const result = await chrome.storage.local.get(['user']);
        const user = result.user;
        
        if (user) {
            console.log('Logged in user:', user.email);
            // Update UI with user info if needed
            const userElement = document.getElementById('userInfo');
            if (userElement) {
                userElement.textContent = `Welcome, ${user.email}`;
            }
        }
        
        // Initialize auto apply button state
        const autoApplyButton = document.getElementById('start-auto-apply-button')
        if (autoApplyButton) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    const currentTabId = tabs[0].id
                    chrome.runtime.sendMessage({
                        action: 'checkAutoApplyStatus',
                        tabId: currentTabId
                    }, (response) => {
                        const isRunning = response?.isRunning || false
                        chrome.storage.local.set({ autoApplyRunning: isRunning }, () => {
                            changeAutoApplyButton(isRunning, autoApplyButton)
                        })
                    })
                } else {
                    chrome.storage.local.get('autoApplyRunning', ({ autoApplyRunning }) => {
                        changeAutoApplyButton(autoApplyRunning || false, autoApplyButton)
                    })
                }
            })
        }
        
        // Initialize other settings
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
                const file = event.target.files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = function(e) {
                    try {
                        if (e?.target?.result && typeof e.target.result === 'string') {
                            const importedData = JSON.parse(e.target.result)
                            chrome.storage.local.set(importedData, function() {
                                alert('Settings imported successfully!')
                            })
                        } else {
                            alert('Error reading file.')
                        }
                    } catch (err) {
                        alert('Parsing error JSON. ' + err)
                    }
                }
                reader.readAsText(file)
            })
        }
        
        console.log('Main popup initialized successfully');
        
    } catch (error) {
        console.error('Error initializing popup:', error);
    }
};

// Handle logout
const handleLogout = async () => {
    try {
        // Clear stored auth data
        await chrome.storage.local.remove(['authToken', 'user']);
        
        // Notify background script
        try {
            await chrome.runtime.sendMessage({ action: 'logout' });
        } catch (error) {
            console.warn('Failed to notify background script about logout:', error);
        }
        
        console.log('Logged out successfully');
        
        // Redirect to login page
        window.location.href = chrome.runtime.getURL('popup/auth/login.html');
        
    } catch (error) {
        console.error('Logout error:', error);
    }
};

// Global click handler for buttons
document.addEventListener('click', event => {
	if (event.target.tagName === 'BUTTON') {
		const buttonId = event.target.id
		const button = document.getElementById(buttonId)
		switch (buttonId) {
			case 'form-control-button':
				chrome.tabs.create({ url: '/popup/formControl/formControl.html' })
				break
			case 'filter-settings-button':
				chrome.tabs.create({ url: '/popup/filterSettings/filterSettings.html' })
				break
			case 'external-apply-button':
				chrome.tabs.create({ url: '/popup/externalApply/externalApply.html' })
				break
			case 'export-button':
				chrome.storage.local.get(null, function(data) {
					const jsonData = JSON.stringify(data, null, 2)
					const blob = new Blob([jsonData], { type: 'application/json' })
					const url = URL.createObjectURL(blob)
					
					const link = document.createElement('a')
					link.href = url
					const { day, hour, minute, month } = getTime()
					link.download = `autoapply_settings_${day}_${month}_[${hour}_${minute}].json`
					link.click()
					
					URL.revokeObjectURL(url)
				})
				break
			case 'import-button':
				document.getElementById('import-file').click()
				break
			case 'save-link':
				chrome.storage.local.get('savedLinks', (result) => {
					const linkName = prompt('Enter link name')
					if (!linkName) {
						alert('Link name cannot be empty.')
						return
					}
					if (!('savedLinks' in result)) {
						getCurrentUrl().then(url => {
							if (!url) return
							chrome.storage.local.set({ savedLinks: { [linkName]: url } }, () => {
								alert('Link saved successfully!')
							})
						}).catch(err => {
							console.trace('Error getting current url: ' + err?.message)
						})
					} else {
						getCurrentUrl().then(url => {
							if (!url) return
							const savedLinks = result.savedLinks
							const savedLinksSet = new Set(Object.values(savedLinks))
							if (linkName in savedLinks) {
								alert('Link name already exists.')
							} else if (savedLinksSet.has(url)) {
								alert('Link already exists.')
							} else {
								chrome.storage.local.set({
									savedLinks: {
										...savedLinks, [linkName]: url
									}
								}, () => {
									alert('Link saved successfully!')
								})
							}
						})
					}
				})
				break
			case 'show-links':
				try {
					let accordion = document.getElementById('linksAccordion')
					
					const dataset = button.dataset
					if (dataset.open === 'true') {
						button.textContent = 'Show job search links'
						button.style.backgroundColor = 'rgb(9, 2, 214, 0.8)'
						button.dataset.open = 'false'
						if (accordion) {
							accordion.style.display = 'none'
						}
					} else {
						button.dataset.open = 'true'
						button.textContent = 'Hide job search link'
						button.style.backgroundColor = 'rgb(220,53,69)'
						
						if (accordion) {
							accordion.style.display = 'block'
						}
					}
					if (!accordion) {
						if (dataset.open === 'true') {
							accordion = document.createElement('div')
							accordion.id = 'linksAccordion'
							accordion.style.border = '1px solid #ccc'
							accordion.style.marginTop = '10px'
							accordion.style.padding = '10px'
							accordion.style.background = '#f9f9f9'
							accordion.style.borderRadius = '4px'
							const content = document.createElement('div')
							content.className = 'accordion-content'
							content.style.display = 'block'
							accordion.appendChild(content)
							document.getElementById('show-links').parentElement.appendChild(accordion)
							chrome.storage.local.get('savedLinks', (result) => {
								const savedLinks = result.savedLinks || {}
								content.innerHTML = ''
								if (Object.keys(savedLinks).length === 0) {
									const emptyMsg = document.createElement('div')
									emptyMsg.textContent = 'No saved links available.'
									content.appendChild(emptyMsg)
									return
								}
								Object.entries(savedLinks).forEach(([name, url]) => {
									const item = document.createElement('div')
									item.className = 'saved-link-item'
									const nameEl = document.createElement('span')
									nameEl.textContent = name
									item.appendChild(nameEl)
									const goButton = document.createElement('button')
									goButton.className = 'modal-button primary go-button'
									goButton.textContent = 'Go'
									goButton.addEventListener('click', () => {
										chrome.runtime.sendMessage({ action: 'openTabAndRunScript', url: url }, (response) => {
											console.trace('Result of opening the tab and executing the script:' + response)
										})
									})
									item.appendChild(goButton)
									const deleteButton = document.createElement('button')
									deleteButton.className = 'modal-button danger delete-button'
									deleteButton.textContent = 'Delete'
									deleteButton.addEventListener('click', () => {
										chrome.storage.local.get('savedLinks', (res) => {
											const links = res.savedLinks || {}
											delete links[name]
											chrome.storage.local.set({ savedLinks: links }, () => {
												item.remove()
											})
										})
									})
									item.appendChild(deleteButton)
									content.appendChild(item)
								})
							})
						}
					}
				} catch (error) {
					console.trace('Cannot show links case \'show-links\'' + error?.message)
				}
				break
			case 'start-auto-apply-button':
				if (typeof chrome !== 'undefined' && chrome?.storage && chrome?.storage.local) {
					chrome.storage.local.get('autoApplyRunning', ({ autoApplyRunning }) => {
						const newState = !autoApplyRunning
						changeAutoApplyButton(newState, button)
						chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
							const noActiveTabsText = 'No active tabs found try to go to a LinkedIn job search page or refresh the page.'
							if (tabs && tabs?.length > 0) {
								const currentTabId = tabs?.[0].id
								chrome.runtime.sendMessage({
									action: newState ? 'startAutoApply' : 'stopAutoApply', tabId: currentTabId
								}, response => {
									if (response?.success) {
										chrome.storage.local.set({ autoApplyRunning: newState })
									} else {
										chrome.storage.local.set({ autoApplyRunning: false }, () => {
											changeAutoApplyButton(false, button)
											if (response?.message === 'No active tab found.') {
												alert(noActiveTabsText)
											}
										})
									}
								})
							} else {
								alert(noActiveTabsText)
							}
						})
					})
				}
				break
			case 'logoutButton':
				handleLogout()
				break
		}
	}
})

// MAIN INITIALIZATION - Single DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Main popup loaded, checking authentication...');
    
    try {
        // Check if user is authenticated FIRST
        const isAuth = await checkAuthentication();
        
        if (!isAuth) {
            console.log('User not authenticated, redirecting to login');
            // Use the correct path from manifest.json
            window.location.href = chrome.runtime.getURL('popup/auth/login.html');
            return;
        }
        
        console.log('User authenticated, initializing main popup...');
        
        // Only initialize if authenticated
        await initializeMainPopup();
        
    } catch (error) {
        console.error('Error during popup initialization:', error);
        // Redirect to login on any error
        window.location.href = chrome.runtime.getURL('popup/auth/login.html');
    }
});

// Utility function for export functionality
function getTime() {
    const now = new Date();
    return {
        day: now.getDate(),
        month: now.getMonth() + 1,
        hour: now.getHours(),
        minute: now.getMinutes()
    };
}