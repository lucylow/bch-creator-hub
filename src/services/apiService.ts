/**
 * @deprecated Use the unified API service from '@/services/api' instead
 * This file is kept for backward compatibility and will redirect to the new service
 */

import { apiService as unifiedApiService } from './api';
import type { AuthResponse as UnifiedAuthResponse, Creator } from '@/types/api';

// Re-export types for backward compatibility
export interface User {
  id: string;
  address: string;
  displayName?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

// Legacy API Service wrapper
class ApiService {
  /**
   * @deprecated Use apiService.authenticateWallet() instead
   */
  async authenticate(
    address: string,
    signature: string,
    message: string
  ): Promise<{ data: AuthResponse }> {
    try {
      const response = await unifiedApiService.authenticateWallet({
        address,
        signature,
        message,
      });

      // Transform response to legacy format
      if (response.success && response.data) {
        const creator = response.data.creator;
        return {
          data: {
            success: true,
            token: response.data.token,
            user: {
              id: creator.id || creator.creatorId,
              address: creator.address,
              displayName: creator.displayName,
              createdAt: creator.createdAt,
            },
          },
        };
      }

      return {
        data: {
          success: false,
          error: response.error || 'Authentication failed',
        },
      };
    } catch (error) {
      return {
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        },
      };
    }
  }

  /**
   * @deprecated Token refresh not implemented in backend
   */
  async refreshToken(): Promise<{ data: AuthResponse }> {
    // Backend doesn't have refresh endpoint, return error
    return {
      data: {
        success: false,
        error: 'Token refresh not available',
      },
    };
  }
}

// Export instance for backward compatibility
export const apiService = new ApiService();

// Also export the new unified service as the primary export
export { unifiedApiService };

