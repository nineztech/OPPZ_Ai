// utils/auth.js
const API_BASE_URL = 'http://localhost:5006/api';

export const handleLogin = async (email, password) => {
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

export const handleLogout = async () => {
  try {
    await chrome.storage.local.remove(['authToken', 'user']);
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getAuthToken = async () => {
  try {
    const result = await chrome.storage.local.get(['authToken']);
    return result.authToken;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    const result = await chrome.storage.local.get(['user']);
    return result.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token;
};