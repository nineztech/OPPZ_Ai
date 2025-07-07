// Updated login.js - Check auth state before showing login form
const API_BASE_URL = 'http://localhost:5006/api';

// Check if user is already authenticated
const checkAuthState = async () => {
  try {
    const result = await chrome.storage.local.get(['authToken', 'user']);
    console.log('Checking auth state:', { hasToken: !!result.authToken, hasUser: !!result.user });
    
    if (result.authToken && result.user) {
      console.log('User already authenticated, redirecting to main popup');
      // User is already logged in, redirect to main popup
      // Fix: Use the correct path based on your file structure
      window.location.href = chrome.runtime.getURL('popup/popup/popup.html');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking auth state:', error);
    return false;
  }
};

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
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
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

    // Store token and user data
    if (data.token) {
      // Store in chrome extension storage
      await chrome.storage.local.set({
        authToken: data.token,
        user: data.user
      });
      
      console.log('Login successful, token stored');
      return data;
    } else {
      throw new Error('No token received from server');
    }

  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

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
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            console.error(message);
            return;
        }
        
        if (!isValidEmail(email)) {
            const message = 'Please enter a valid email address';
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            console.error(message);
            return;
        }
        
        try {
            // Show loading state
            if (loadingSpinner) loadingSpinner.style.display = 'block';
            if (errorMessage) errorMessage.style.display = 'none';
            
            console.log('Calling handleLogin...');
            const result = await handleLogin(email, password);
            console.log('Login successful:', result);
            
            // Show success message briefly
            if (errorMessage) {
                errorMessage.textContent = 'Login successful! Redirecting...';
                errorMessage.className = 'success-message';
                errorMessage.style.display = 'block';
                errorMessage.style.color = 'green';
            }
            
            // Notify background script to update popup state
            try {
                await chrome.runtime.sendMessage({ action: 'updateAuthState' });
                console.log('Background script notified');
            } catch (msgError) {
                console.warn('Failed to notify background script:', msgError);
            }
            
            // Redirect to main popup after brief delay to show success message
            setTimeout(() => {
                // Fix: Use the correct path based on your file structure
                window.location.href = chrome.runtime.getURL('popup/popup/popup.html');
            }, 1000);
            
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
            chrome.tabs.create({ url: 'http://localhost:3000/signup' });
        });
    }
    
    // Add link to website login
    const websiteLoginLink = document.querySelector('a[href="http://localhost:3000/login"]');
    if (websiteLoginLink) {
        websiteLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'http://localhost:3000/login' });
        });
    }
});

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}