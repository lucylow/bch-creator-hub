import type {
  ApiResponse,
  AuthRequest,
  AuthResponse,
  ChallengeResponse,
  User,
  Creator,
  CreatorUpdate,
  CreatorSearchResult,
  DashboardStats,
  PaymentIntent,
  CreatePaymentIntentRequest,
  PaymentLinkRequest,
  Transaction,
  TransactionStats,
  RecordPaymentRequest,
  Analytics,
  EarningsChartData,
  TopSupporter,
  Webhook,
} from '@/types/api';
import { isDemoMode } from '@/config/demo';
import { generateMockDashboardStats, generateMockTransactions, generateMockPaymentIntents, generateMockWithdrawals } from '@/demo/mockData';

/**
 * Unified API Service
 * Consolidates all backend API calls with proper TypeScript types
 * In demo mode, returns mock data instead of calling the real API
 */
class ApiService {
  private readonly baseURL: string;
  private readonly wsURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.wsURL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      // Handle 401 - Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('wallet_address');
        throw new Error('Authentication expired. Please reconnect your wallet.');
      }

      const data = await response.json().catch(() => ({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));

      if (!response.ok) {
        throw new Error(data.error || data.message || `API error: ${response.statusText}`);
      }

      // Store token if provided in response (token can be at root or in data object)
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      } else if (data.data && typeof data.data === 'object' && 'token' in data.data) {
        localStorage.setItem('auth_token', data.data.token);
      }

      return data as ApiResponse<T>;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication expired')) {
        throw error;
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API request failed',
      };
    }
  }

  // ============ Auth Endpoints ============

  /**
   * Authenticate wallet (matches backend /api/auth/wallet)
   */
  async authenticateWallet(request: AuthRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/api/auth/wallet', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    // Store token if authentication successful
    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response;
  }

  /**
   * Get authentication challenge
   */
  async getChallenge(address: string): Promise<ApiResponse<ChallengeResponse>> {
    return this.request<ChallengeResponse>(`/api/auth/challenge?address=${encodeURIComponent(address)}`);
  }

  /**
   * Verify authentication token
   */
  async verifyToken(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/verify');
  }

  // ============ Creator Endpoints ============

  /**
   * Get creator profile
   */
  async getCreatorProfile(): Promise<ApiResponse<Creator>> {
    return this.request<Creator>('/api/creators/profile');
  }

  /**
   * Update creator profile
   */
  async updateCreatorProfile(updates: CreatorUpdate): Promise<ApiResponse<Creator>> {
    return this.request<Creator>('/api/creators/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Search creators (public)
   */
  async searchCreators(query?: string, page = 1, limit = 20): Promise<ApiResponse<CreatorSearchResult>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (query) params.append('q', query);
    
    return this.request<CreatorSearchResult>(`/api/creators/search?${params.toString()}`);
  }

  /**
   * Get creator by ID (public)
   */
  async getCreatorById(creatorId: string): Promise<ApiResponse<Creator>> {
    return this.request<Creator>(`/api/public/creators/${creatorId}`);
  }

  /**
   * Deploy contract for creator
   */
  async deployContract(): Promise<ApiResponse<{ contractAddress: string; txid: string }>> {
    return this.request<{ contractAddress: string; txid: string }>('/api/creators/contract/deploy', {
      method: 'POST',
    });
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(period: '7d' | '30d' | '90d' = '30d'): Promise<ApiResponse<DashboardStats>> {
    // In demo mode, return mock data
    if (isDemoMode()) {
      return {
        success: true,
        data: generateMockDashboardStats(period),
      };
    }
    return this.request<DashboardStats>(`/api/creators/dashboard?period=${period}`);
  }

  // ============ Payment Endpoints ============

  /**
   * Create payment intent
   */
  async createPaymentIntent(intent: CreatePaymentIntentRequest): Promise<ApiResponse<PaymentIntent>> {
    return this.request<PaymentIntent>('/api/payments/intent', {
      method: 'POST',
      body: JSON.stringify(intent),
    });
  }

  /**
   * Get payment intent (public)
   */
  async getPaymentIntent(intentId: string): Promise<ApiResponse<PaymentIntent>> {
    return this.request<PaymentIntent>(`/api/payments/intent/${intentId}`);
  }

  /**
   * Get creator's payment intents
   */
  async getPaymentIntents(): Promise<ApiResponse<PaymentIntent[]>> {
    if (isDemoMode()) {
      return {
        success: true,
        data: generateMockPaymentIntents(5),
      };
    }
    return this.request<PaymentIntent[]>('/api/payments/intents');
  }

  /**
   * Update payment intent
   */
  async updatePaymentIntent(
    intentId: string,
    updates: Partial<CreatePaymentIntentRequest>
  ): Promise<ApiResponse<PaymentIntent>> {
    return this.request<PaymentIntent>(`/api/payments/intent/${intentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Generate payment link
   */
  async generatePaymentLink(request: PaymentLinkRequest): Promise<ApiResponse<PaymentIntent>> {
    return this.request<PaymentIntent>('/api/payments/link', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Record payment
   */
  async recordPayment(payment: RecordPaymentRequest): Promise<ApiResponse<Transaction>> {
    return this.request<Transaction>('/api/payments/record', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  // ============ Transaction Endpoints ============

  /**
   * Get transactions
   */
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{ transactions: Transaction[]; total: number; page: number; limit: number }>> {
    if (isDemoMode()) {
      const limit = params?.limit || 10;
      return {
        success: true,
        data: {
          transactions: generateMockTransactions(limit),
          total: 50,
          page: params?.page || 1,
          limit,
        },
      };
    }
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request(`/api/transactions${query ? `?${query}` : ''}`);
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(txid: string): Promise<ApiResponse<Transaction>> {
    if (isDemoMode()) {
      const mockTx = generateMockTransactions(1)[0];
      mockTx.txid = txid;
      return { success: true, data: mockTx };
    }
    return this.request<Transaction>(`/api/transactions/${txid}`);
  }

  /**
   * Get transaction stats
   */
  async getTransactionStats(): Promise<ApiResponse<TransactionStats>> {
    if (isDemoMode()) {
      return {
        success: true,
        data: {
          totalTransactions: Math.floor(Math.random() * 200) + 50,
          totalVolume: Math.floor(Math.random() * 50000000) + 10000000,
          avgTransaction: Math.floor(Math.random() * 200000) + 50000,
          todayCount: Math.floor(Math.random() * 20) + 5,
          todayVolume: Math.floor(Math.random() * 5000000) + 1000000,
        },
      };
    }
    return this.request<TransactionStats>('/api/transactions/stats/summary');
  }

  /**
   * Get withdrawals
   */
  async getWithdrawals(): Promise<ApiResponse<{ withdrawals: any[] }>> {
    if (isDemoMode()) {
      return {
        success: true,
        data: { withdrawals: generateMockWithdrawals(5) },
      };
    }
    return this.request<{ withdrawals: any[] }>('/api/withdrawals');
  }

  // ============ Analytics Endpoints ============

  /**
   * Get analytics
   */
  async getAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }): Promise<ApiResponse<Analytics>> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.period) queryParams.append('period', params.period);

    const query = queryParams.toString();
    return this.request<Analytics>(`/api/webhooks/analytics${query ? `?${query}` : ''}`);
  }

  /**
   * Get earnings chart data
   */
  async getEarningsChart(params?: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }): Promise<ApiResponse<EarningsChartData[]>> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.period) queryParams.append('period', params.period);

    const query = queryParams.toString();
    return this.request<EarningsChartData[]>(`/api/webhooks/analytics/earnings${query ? `?${query}` : ''}`);
  }

  /**
   * Get top supporters
   */
  async getTopSupporters(limit = 10): Promise<ApiResponse<TopSupporter[]>> {
    return this.request<TopSupporter[]>(`/api/webhooks/analytics/supporters?limit=${limit}`);
  }

  // ============ Webhook Endpoints ============

  /**
   * Get webhooks
   */
  async getWebhooks(): Promise<ApiResponse<Webhook[]>> {
    return this.request<Webhook[]>('/api/webhooks/webhooks');
  }

  /**
   * Create webhook
   */
  async createWebhook(webhook: { url: string; events: string[] }): Promise<ApiResponse<Webhook>> {
    return this.request<Webhook>('/api/webhooks/webhooks', {
      method: 'POST',
      body: JSON.stringify(webhook),
    });
  }

  /**
   * Update webhook
   */
  async updateWebhook(id: string, updates: Partial<Webhook>): Promise<ApiResponse<Webhook>> {
    return this.request<Webhook>(`/api/webhooks/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/webhooks/webhooks/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ Public Endpoints ============

  /**
   * Get API status
   */
  async getStatus(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/api/public/status');
  }

  // ============ Helper Methods ============

  /**
   * Get WebSocket URL
   */
  getWebSocketURL(): string {
    return this.wsURL;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('wallet_address');
  }
}

// Export singleton instance
export const apiService = new ApiService();

// For backward compatibility
export default apiService;

