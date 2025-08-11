// Enhanced login.js - Immediate data loading after login
// const API_BASE_URL = 'https://oppzai-production-c5c3.up.railway.app/api';
const API_BASE_URL = 'http://localhost:5006/api'; // For development

console.log('🚀 Login script loaded, API_BASE_URL:', API_BASE_URL);

// Check if user is already authenticated
const checkAuthState = async () => {
  try {
    const result = await chrome.storage.local.get(['authToken', 'user']);
    console.log('Checking auth state:', { hasToken: !!result.authToken, hasUser: !!result.user });
    
    if (result.authToken && result.user) {
      console.log('User already authenticated, redirecting to main popup');
      window.location.href = chrome.runtime.getURL('popup/popup/popup.html');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking auth state:', error);
    return false;
  }
};

// Load user data immediately after login - ENHANCED VERSION
const loadUserInputConfigs = async (authToken, userEmail) => {
  try {
    console.log('🔄 Loading user input configs after login...');
    console.log('🔄 Auth token:', authToken ? 'Present' : 'Missing');
    console.log('🔄 User email:', userEmail);
    
    const fetchUrl = `${API_BASE_URL}/api/inputs/get-inputconfigs?email=${encodeURIComponent(userEmail)}`;
    console.log('🔄 Fetch URL:', fetchUrl);
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('🔄 Response status:', response.status);
    console.log('🔄 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔄 Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('🔄 Non-JSON response:', responseText);
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();
    console.log('🔄 Response data:', data);

    // Handle different possible response structures
    let configs = [];
    if (data.success !== undefined) {
      if (data.success) {
        configs = data.configs || data.data || [];
      } else {
        console.warn('🔄 Server returned success=false:', data.message);
        configs = []; // Start with empty configs if server says no data
      }
    } else if (Array.isArray(data)) {
      configs = data;
    } else if (data.inputConfigs) {
      configs = data.inputConfigs;
    } else {
      configs = data.configs || [];
    }

    console.log('🔄 Processed configs:', configs);

    // Store the configurations with timestamp
    await chrome.storage.local.set({ 
      inputFieldConfigs: configs,
      lastDataLoad: new Date().toISOString(),
      dataLoadedFromLogin: true // Flag to indicate data was loaded from login
    });
    
    console.log('✅ Input configs stored:', configs.length, 'configurations');
    
    // Convert configs to defaultFields format for immediate use
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
      if (config.placeholderIncludes && config.defaultValue) {
        const match = fieldMap[config.placeholderIncludes.trim()];
        if (match && config.defaultValue.trim() !== "") {
          defaultFields[match] = config.defaultValue.trim();
          console.log('🔄 Mapped:', config.placeholderIncludes, '->', match, '=', config.defaultValue);
        }
      }
    });

    // Store defaultFields as well
    await chrome.storage.local.set({ defaultFields });
    console.log('✅ Default fields stored:', defaultFields);
    
    return { success: true, configCount: configs.length, defaultFields };
    
  } catch (error) {
    console.error('❌ Error loading user input configs:', error);
    return { success: false, error: error.message };
  }
};

// Enhanced login handler
const handleLogin = async (email, password) => {
  try {
    console.log('Attempting login with:', { email }); // Don't log password
    console.log('Making request to:', `${API_BASE_URL}/users/login`);
    
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password
      })
    });

    console.log('Response status:', response.status);
    
    // Check if response is actually JSON before parsing
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Received non-JSON response:', textResponse);
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Check if your backend is running and the API endpoint is correct.`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    // Store token and user data FIRST
    if (data.token && data.user) {
      // Clear any old data first
      await chrome.storage.local.remove(['inputFieldConfigs', 'defaultFields', 'lastDataLoad']);
      
      await chrome.storage.local.set({
        authToken: data.token,
        user: data.user,
        loginTimestamp: new Date().toISOString(),
        freshLogin: true // Flag for formControl.init.js
      });
      
      console.log('✅ Login successful, credentials stored');
      
      // NOW load user data immediately
      console.log('🔄 Loading user data immediately after login...');
      const dataResult = await loadUserInputConfigs(data.token, data.user.email);
      
      if (dataResult.success) {
        console.log('✅ User data loaded successfully:', dataResult);
        
        // Notify all extension components about successful login and data load
        try {
          await chrome.runtime.sendMessage({ 
            action: 'updateAuthState',
            type: 'LOGIN_SUCCESS',
            userData: data.user,
            dataLoaded: true,
            configCount: dataResult.configCount
          });
          console.log('📨 Background script and components notified');
        } catch (msgError) {
          console.warn('⚠️ Failed to notify background script:', msgError);
        }
        
        return { 
          ...data, 
          dataLoaded: true, 
          configCount: dataResult.configCount,
          defaultFields: dataResult.defaultFields
        };
      } else {
        console.warn('⚠️ Login successful but data loading failed:', dataResult.error);
        
        // Still notify about login success even if data loading failed
        try {
          await chrome.runtime.sendMessage({ 
            action: 'updateAuthState',
            type: 'LOGIN_SUCCESS',
            userData: data.user,
            dataLoaded: false,
            dataError: dataResult.error
          });
        } catch (msgError) {
          console.warn('⚠️ Failed to notify background script:', msgError);
        }
        
        return { ...data, dataLoaded: false, dataError: dataResult.error };
      }
    } else {
      throw new Error('No token or user data received from server');
    }

  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Toggle password visibility
document.addEventListener('DOMContentLoaded', () => {
  const togglePassword = document.getElementById('togglePassword');
  if (togglePassword) {
    togglePassword.addEventListener('click', function () {
      const passwordInput = document.getElementById('password');
      const icon = this.querySelector('i');
      
      if (passwordInput && icon) {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        
        // Toggle icon class
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      }
    });
  }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Login page loaded, checking auth state...');
    
    // First check if user is already authenticated
    const isAlreadyAuth = await checkAuthState();
    if (isAlreadyAuth) {
      // Don't initialize login form if already authenticated
      return;
    }
    
    // Show login form since user is not authenticated
    const loginContainer = document.querySelector('.login-container');
    const authCheckLoading = document.getElementById('authCheckLoading');
    
    if (loginContainer) {
      loginContainer.style.display = 'block';
    }
    if (authCheckLoading) {
      authCheckLoading.style.display = 'none';
    }
    
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');

    if (!loginForm) {
        console.error('Login form not found');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (!emailInput || !passwordInput) {
            console.error('Email or password input not found');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        console.log('Attempting login with email:', email);
        
        // Basic validation
        if (!email || !password) {
            const message = 'Please enter both email and password';
            if (errorMessage) {
              errorMessage.textContent = message;
              errorMessage.style.display = 'block';
              errorMessage.style.color = 'red';
            }
            console.error(message);
            return;
        }
        
        if (!isValidEmail(email)) {
            const message = 'Please enter a valid email address';
            if (errorMessage) {
              errorMessage.textContent = message;
              errorMessage.style.display = 'block';
              errorMessage.style.color = 'red';
            }
            console.error(message);
            return;
        }
        
        try {
            // Show loading state
            if (loadingSpinner) loadingSpinner.style.display = 'block';
            if (errorMessage) errorMessage.style.display = 'none';
            
            console.log('Calling handleLogin...');
            const result = await handleLogin(email, password);
            console.log('Login result:', result);
            
            // Show success message with detailed info
           // Show simple success message
if (errorMessage) {
    errorMessage.textContent = '✅ Login successful! Redirecting...';
    errorMessage.className = 'success-message';
    errorMessage.style.display = 'block';
    errorMessage.style.color = 'green';
    errorMessage.style.fontSize = '14px';
    errorMessage.style.lineHeight = '1.4';
}

            
            // Redirect after showing success message
            setTimeout(() => {
                window.location.href = chrome.runtime.getURL('popup/popup/popup.html');
            }, 3000); // Increased to 3 seconds to allow reading the message
            
        } catch (error) {
            console.error('Login failed:', error);
            const message = error.message || 'Login failed. Please try again.';
            if (errorMessage) {
                errorMessage.textContent = message;
                errorMessage.className = 'error-message';
                errorMessage.style.color = 'red';
                errorMessage.style.display = 'block';
            }
        } finally {
            // Hide loading state
            if (loadingSpinner) loadingSpinner.style.display = 'none';
        }
    });

    // Add link to website signup
    const signupLink = document.getElementById('signupLink');
    if (signupLink) {
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://www.oppzai.com/signup' });
        });
    }
    
    // Add link to website login
    const websiteLoginLink = document.querySelector('a[href="https://www.oppzai.com/login"]');
    if (websiteLoginLink) {
        websiteLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://www.oppzai.com/login' });
        });
    }
});

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

console.log('✅ Enhanced login script fully loaded (with immediate data loading)');