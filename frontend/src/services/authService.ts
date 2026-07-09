import { apiClient } from './apiClient';
import type { AuthResponse, LogoutResponse, User } from '../types/auth';

export const authService = {
  /**
   * Register a new business user
   */
  register: async (payload: any): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', payload);
    return response.data.data.user;
  },

  /**
   * Log in an existing user
   */
  login: async (payload: any): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', payload);
    return response.data.data.user;
  },

  /**
   * Log out the current user session
   */
  logout: async (): Promise<void> => {
    await apiClient.post<LogoutResponse>('/api/auth/logout');
  },

  /**
   * Fetch current session profile details
   */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<AuthResponse>('/api/auth/me');
    return response.data.data.user;
  }
};
