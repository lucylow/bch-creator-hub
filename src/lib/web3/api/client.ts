/**
 * @deprecated Use the unified API service from '@/services/api' instead
 * This file is kept for backward compatibility and redirects to the unified service
 */

import { apiService } from '@/services/api';
import type { ApiResponse } from '@/types/api';

// Legacy API Client wrapper - redirects to unified service
class ApiClient {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Redirect to unified service methods where possible
    // For generic GET requests, use the unified service's request method via a workaround
    // Since request is private, we'll need to use fetch directly for now
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch(`${baseURL}${normalizedEndpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('wallet_address');
        throw new Error('Authentication expired');
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      } else if (data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
      }

      return data as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API request failed',
      };
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Special handling for /auth/login - redirect to /auth/wallet using unified service
    if (endpoint === '/auth/login' && data?.address && data?.signature && data?.message) {
      return apiService.authenticateWallet({
        address: data.address,
        signature: data.signature,
        message: data.message,
      }) as Promise<ApiResponse<T>>;
    }
    
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch(`${baseURL}${normalizedEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('wallet_address');
        throw new Error('Authentication expired');
      }

      const responseData = await response.json();
      
      if (responseData.token) {
        localStorage.setItem('auth_token', responseData.token);
      } else if (responseData.data?.token) {
        localStorage.setItem('auth_token', responseData.data.token);
      }

      return responseData as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API request failed',
      };
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch(`${baseURL}${normalizedEndpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('wallet_address');
        throw new Error('Authentication expired');
      }

      const responseData = await response.json();
      
      if (responseData.token) {
        localStorage.setItem('auth_token', responseData.token);
      } else if (responseData.data?.token) {
        localStorage.setItem('auth_token', responseData.data.token);
      }

      return responseData as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API request failed',
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch(`${baseURL}${normalizedEndpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('wallet_address');
        throw new Error('Authentication expired');
      }

      const responseData = await response.json();
      return responseData as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API request failed',
      };
    }
  }
}

export const API = new ApiClient();
