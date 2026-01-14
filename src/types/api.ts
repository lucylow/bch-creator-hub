// API Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ msg: string; param: string }>;
  token?: string;
}

// Auth Types
export interface AuthRequest {
  address: string;
  signature: string;
  message: string;
}

export interface AuthResponse {
  token: string;
  creator: Creator;
}

export interface ChallengeResponse {
  challenge: string;
  expiresIn: number;
}

export interface User {
  id: string;
  creatorId?: string;
  address: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  twitterHandle?: string;
  isVerified?: boolean;
  createdAt: string;
  lastLogin?: string;
}

// Creator Types
export interface Creator {
  id: string;
  creatorId: string;
  address: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  twitterHandle?: string;
  contractAddress?: string;
  feeBasisPoints: number;
  isVerified: boolean;
  balance?: Balance;
  stats?: CreatorStats;
  createdAt: string;
  lastLogin?: string;
}

export interface Balance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

export interface CreatorStats {
  totalEarnings: number;
  totalTransactions: number;
  activeSupporters: number;
  monthlyEarnings: number;
  todayEarnings: number;
}

export interface CreatorUpdate {
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  twitterHandle?: string;
}

export interface CreatorSearchResult {
  creators: Creator[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  totalBalance: number;
  todayEarnings: number;
  monthlyEarnings: number;
  transactionCount: number;
  avgTransaction: number;
  activeSupporters: number;
  recentTransactions: Transaction[];
  earningsChart: Array<{ date: string; amount: number }>;
}

// Payment Types
export interface PaymentIntent {
  id: string;
  intentId: string;
  creatorId: string;
  type: number;
  amountSats?: number;
  amountUsd?: number;
  title?: string;
  description?: string;
  contentUrl?: string;
  contentId?: string;
  metadata: Record<string, any>;
  isRecurring: boolean;
  recurrenceInterval?: string;
  expiresAt?: string;
  status: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentIntentRequest {
  type?: number;
  amountSats?: number;
  amountUsd?: number;
  title?: string;
  description?: string;
  contentUrl?: string;
  contentId?: string;
  metadata?: Record<string, any>;
  isRecurring?: boolean;
  recurrenceInterval?: string;
  expiresInHours?: number;
}

export interface PaymentLinkRequest {
  amountSats?: number;
  amountUsd?: number;
  description?: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  txid: string;
  creatorId: string;
  intentId?: string;
  senderAddress: string;
  recipientAddress: string;
  amountSats: number;
  amountUsd?: number;
  feeSats: number;
  paymentType?: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockHeight?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  confirmedAt?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  avgTransaction: number;
  todayCount: number;
  todayVolume: number;
}

export interface RecordPaymentRequest {
  txid: string;
  intentId?: string;
  amountSats: number;
  senderAddress: string;
}

// Analytics Types
export interface Analytics {
  totalEarnings: number;
  totalTransactions: number;
  period: string;
  startDate: string;
  endDate: string;
}

export interface EarningsChartData {
  date: string;
  amount: number;
  count: number;
}

export interface TopSupporter {
  address: string;
  totalAmount: number;
  transactionCount: number;
  lastTransaction: string;
}

// Webhook Types
export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  createdAt: string;
}

