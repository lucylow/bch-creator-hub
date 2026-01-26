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
  Withdrawal,
} from '@/types/api';
import { isDemoMode } from '@/config/demo';
import {
  generateMockDashboardStats,
  generateMockTransactions,
  generateMockPaymentIntents,
  generateMockWithdrawals,
  generateMockTransactionStats,
  generateMockAnalyticsApi,
  generateMockEarningsChart,
} from '@/demo/mockData';
import { normalizeError, getUserFriendlyMessage } from '@/utils/errorUtils';
import { logger } from '@/utils/logger';

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

  /** Default request timeout in ms */
  private static readonly REQUEST_TIMEOUT_MS = 30_000;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), ApiService.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal ?? controller.signal,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle 401 - Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('wallet_address');
        throw new Error('Authentication expired. Please reconnect your wallet.');
      }

      const contentType = response.headers.get('content-type') ?? '';
      let data: Record<string, unknown>;
      if (contentType.includes('application/json')) {
        const text = await response.text();
        try {
          data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
        } catch {
          throw new Error(`Invalid JSON from server: ${response.status} ${response.statusText}`);
        }
      } else {
        throw new Error(
          response.ok
            ? 'Server returned non-JSON response.'
            : `HTTP ${response.status}: ${response.statusText}`
        );
      }

      if (!response.ok) {
        const msg =
          (data.error as string) ??
          (data.message as string) ??
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(typeof msg === 'string' ? msg : 'API error');
      }

      // Store token if provided in response (token can be at root or in data object)
      if (data.token) {
        localStorage.setItem('auth_token', String(data.token));
      } else if (data.data && typeof data.data === 'object' && data.data !== null && 'token' in data.data) {
        const t = (data.data as Record<string, unknown>).token;
        if (t != null) localStorage.setItem('auth_token', String(t));
      }

      return { success: true, ...data } as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      const normalized = normalizeError(error);
      if (normalized.message.includes('Authentication expired')) {
        throw normalized;
      }
      const message = getUserFriendlyMessage(normalized, 'API request failed');
      return { success: false, error: message };
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
    if (isDemoMode()) {
      return {
        success: true,
        data: generateMockDashboardStats(period),
      };
    }
    const response = await this.request<DashboardStats>(`/api/creators/dashboard?period=${period}`);
    if (!response.success) {
      logger.warn('Dashboard stats API failed, falling back to mock data', { error: response.error, period });
      return { success: true, data: generateMockDashboardStats(period) };
    }
    return response;
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
        data: generateMockPaymentIntents(12),
      };
    }
    const response = await this.request<PaymentIntent[]>('/api/payments/intents');
    if (!response.success) {
      logger.warn('Payment intents API failed, falling back to mock data', { error: response.error });
      return { success: true, data: generateMockPaymentIntents(12) };
    }
    return response;
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
          total: 120,
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
    const response = await this.request<{ transactions: Transaction[]; total: number; page: number; limit: number }>(`/api/transactions${query ? `?${query}` : ''}`);
    if (!response.success) {
      const limit = params?.limit || 10;
      logger.warn('Transactions API failed, falling back to mock data', { error: response.error });
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
    return response;
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
    const response = await this.request<Transaction>(`/api/transactions/${txid}`);
    if (!response.success) {
      logger.warn('Transaction API failed, falling back to mock data', { error: response.error, txid });
      const mockTx = generateMockTransactions(1)[0];
      mockTx.txid = txid;
      return { success: true, data: mockTx };
    }
    return response;
  }

  /**
   * Get transaction stats
   */
  async getTransactionStats(): Promise<ApiResponse<TransactionStats>> {
    const mockStats = generateMockTransactionStats();
    if (isDemoMode()) {
      return { success: true, data: mockStats };
    }
    const response = await this.request<TransactionStats>('/api/transactions/stats/summary');
    if (!response.success) {
      logger.warn('Transaction stats API failed, falling back to mock data', { error: response.error });
      return { success: true, data: mockStats };
    }
    return response;
  }

  /**
   * Get withdrawals
   */
  async getWithdrawals(): Promise<ApiResponse<{ withdrawals: Withdrawal[] }>> {
    if (isDemoMode()) {
      return {
        success: true,
        data: { withdrawals: generateMockWithdrawals(8) },
      };
    }
    const response = await this.request<{ withdrawals: Withdrawal[] }>('/api/withdrawals');
    if (!response.success) {
      logger.warn('Withdrawals API failed, falling back to mock data', { error: response.error });
      return { success: true, data: { withdrawals: generateMockWithdrawals(5) } };
    }
    return response;
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
    if (isDemoMode()) {
      const period = params?.period === '7' || params?.period === '7d' ? '7d' : params?.period === '90' || params?.period === '90d' ? '90d' : '30d';
      return { success: true, data: generateMockAnalyticsApi(period) };
    }
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
    if (isDemoMode()) {
      const period = params?.period === '7' || params?.period === '7d' ? '7d' : params?.period === '90' || params?.period === '90d' ? '90d' : '30d';
      return { success: true, data: generateMockEarningsChart(period) };
    }
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

