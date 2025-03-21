import axios from 'axios';
import { getAuthToken, clearAuthData } from './utils/auth';

const axiosInstance = axios.create({
  baseURL: 'https://kalosavam-backend.vercel.app/',
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Log request errors
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and authentication
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardized error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      switch (error.response.status) {
        case 401: // Unauthorized
          clearAuthData(); // Clear auth data from storage
          // Redirect to login, optionally with a reason
          window.location.href = '/login?reason=unauthorized';
          break;
        case 403: // Forbidden
          console.error('Access Forbidden:', error.response.data);
          break;
        case 404: // Not Found
          console.error('Resource Not Found:', error.response.data);
          break;
        case 500: // Internal Server Error
          console.error('Server Error:', error.response.data);
          break;
        default:
          console.error('Unexpected Error:', error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No Response Received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error Setting Up Request:', error.message);
    }

    return Promise.reject(error);
  }
);

// Optional: Add a method to refresh token if needed
axiosInstance.refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await axiosInstance.post('/auth/refresh', { refreshToken });
    
    // Update tokens in storage
    localStorage.setItem('token', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data.accessToken;
  } catch (error) {
    // If refresh fails, force logout
    clearAuthData();
    window.location.href = '/login?reason=session_expired';
    throw error;
  }
};

export default axiosInstance;

// Utility function for auth-related operations
export const auth = {
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      const { token, refreshToken, user } = response.data;
      
      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },
  
  logout: () => {
    clearAuthData();
    window.location.href = '/login';
  }
};