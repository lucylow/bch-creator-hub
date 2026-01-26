/**
 * @deprecated Use the unified API service from '@/services/api' instead
 * This file is kept for backward compatibility and redirects to the unified service
 */

import { apiService } from '@/services/api';
import type { ApiResponse } from '@/types/api';
import { getUserFriendlyMessage } from '@/utils/errorUtils';

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

      const contentType = response.headers.get('content-type') ?? '';
      const data = contentType.includes('application/json')
        ? await response.json().catch(() => ({ success: false, error: `HTTP ${response.status}: ${response.statusText}` }))
        : { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      
      if (data?.token) {
        localStorage.setItem('auth_token', data.token);
      } else if (data?.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
      }

      return data as ApiResponse<T>;
    } catch (error) {
      const msg = getUserFriendlyMessage(error, 'API request failed');
      return { success: false, error: msg };
    }
  }

  async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    // Special handling for /auth/login - redirect to /auth/wallet using unified service
    const auth = data as { address?: string; signature?: string; message?: string } | undefined;
    if (endpoint === '/auth/login' && auth?.address && auth?.signature && auth?.message) {
      return apiService.authenticateWallet({
        address: auth.address,
        signature: auth.signature,
        message: auth.message,
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

      const contentType = response.headers.get('content-type') ?? '';
      const responseData = contentType.includes('application/json')
        ? await response.json().catch(() => ({ success: false, error: `HTTP ${response.status}: ${response.statusText}` }))
        : { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      
      if (responseData?.token) {
        localStorage.setItem('auth_token', responseData.token);
      } else if (responseData?.data?.token) {
        localStorage.setItem('auth_token', responseData.data.token);
      }

      return responseData as ApiResponse<T>;
    } catch (error) {
      return { success: false, error: getUserFriendlyMessage(error, 'API request failed') };
    }
  }

  async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
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

      const contentType = response.headers.get('content-type') ?? '';
      const responseData = contentType.includes('application/json')
        ? await response.json().catch(() => ({ success: false, error: `HTTP ${response.status}: ${response.statusText}` }))
        : { success: false, error: `HTTP ${response.status}: ${response.statusText}` };

      if (responseData?.token) {
        localStorage.setItem('auth_token', responseData.token);
      } else if (responseData?.data?.token) {
        localStorage.setItem('auth_token', responseData.data.token);
      }

      return responseData as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: getUserFriendlyMessage(error, 'API request failed'),
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

      const contentType = response.headers.get('content-type') ?? '';
      const responseData = contentType.includes('application/json')
        ? await response.json().catch(() => ({ success: false, error: `HTTP ${response.status}: ${response.statusText}` }))
        : { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      return responseData as ApiResponse<T>;
    } catch (error) {
      return { success: false, error: getUserFriendlyMessage(error, 'API request failed') };
    }
  }
}

export const API = new ApiClient();
