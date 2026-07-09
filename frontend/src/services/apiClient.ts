import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for sending HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to format errors consistently
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error.response?.data?.error || {
      message: error.message || 'An unexpected connection error occurred.',
      code: 'CONNECTION_ERROR',
    };
    return Promise.reject(apiError);
  }
);
