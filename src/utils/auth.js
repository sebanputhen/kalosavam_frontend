// src/utils/auth.js
export const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  };
  
  export const isAuthenticated = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
  
      const decodedToken = decodeToken(token);
      if (!decodedToken) return false;
  
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
  
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  };
  
  export const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
      return decodeToken(token);
    }
    localStorage.removeItem('token');
    return null;
  };
  
  export const getAuthToken = () => {
    return localStorage.getItem('token');
  };
  
  export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };
  
  // Add the missing startTokenExpirationCheck function
  export const startTokenExpirationCheck = () => {
    // Check token expiration every minute
    const checkInterval = setInterval(() => {
      if (!isAuthenticated()) {
        clearInterval(checkInterval);
        logout();
      }
    }, 60000); // 60000 ms = 1 minute
  
    // Also check when the window gains focus
    window.addEventListener('focus', () => {
      if (!isAuthenticated()) {
        logout();
      }
    });
  
    // Clean up on unmount
    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('focus', () => {});
    };
  };