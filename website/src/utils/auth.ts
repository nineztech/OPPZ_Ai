interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface ChromeExtensionUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

// Default user object for logged-out state
const EMPTY_USER: ChromeExtensionUser = {
  id: '',
  fullName: '',
  email: '',
  createdAt: new Date().toISOString()
};

interface AuthState {
  isAuthenticated: boolean;
  user: ChromeExtensionUser; // Remove null since extension always expects a user object
}

export const isTokenValid = (): boolean => {
  const token = localStorage.getItem('token');
  const expiration = localStorage.getItem('tokenExpiration');

  if (!token || !expiration) {
    return false;
  }

  const expirationTime = parseInt(expiration, 10);
  const currentTime = new Date().getTime();

  return currentTime < expirationTime;
};

export const adaptUserForExtension = (user: User): ChromeExtensionUser => {
  return {
    id: user.id,
    fullName: `${user.firstname} ${user.lastname}`,
    email: user.email,
    createdAt: user.createdAt
  };
};

export const logout = () => {
  console.log('Logging out user...'); // Debug log
  
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiration');
  localStorage.removeItem('user');

  // Notify Chrome extension
  if (window.chrome?.runtime?.sendMessage) {
    window.chrome.runtime.sendMessage({
      action: 'updateAuthState',
      data: {
        isAuthenticated: false,
        user: EMPTY_USER
      } satisfies AuthState
    });
  }

  // Dispatch custom event to notify components about auth state change
  console.log('Dispatching authStateChanged event for logout'); // Debug log
  window.dispatchEvent(new Event('authStateChanged'));
};

export const getAuthToken = (): string | null => {
  if (isTokenValid()) {
    return localStorage.getItem('token');
  }
  logout();
  return null;
};

export const getCurrentUser = (): User | null => {
  if (!isTokenValid()) {
    logout();
    return null;
  }
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  console.log('getCurrentUser returning:', user); // Debug log
  return user;
};

// Helper function to save user data and notify components
export const saveUserData = (token: string, user: User) => {
  console.log('Saving user data:', user); // Debug log
  
  const expirationTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 1 day
  localStorage.setItem('token', token);
  localStorage.setItem('tokenExpiration', expirationTime.toString());
  localStorage.setItem('user', JSON.stringify(user));

  // Notify Chrome extension
  if (window.chrome?.runtime?.sendMessage) {
    const authState: AuthState = {
      isAuthenticated: true,
      user: adaptUserForExtension(user),
    };

    window.chrome.runtime.sendMessage({
      action: 'updateAuthState',
      data: authState,
    });
  }

  // Dispatch custom event to notify components about auth state change
  console.log('Dispatching authStateChanged event for login'); // Debug log
  window.dispatchEvent(new Event('authStateChanged'));
};