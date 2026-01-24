/**
 * Paywall Service
 * 
 * Handles content access checks and payment verification.
 * Automatically falls back to mock data when web3/API operations fail.
 */
import { mockIndexerApi } from '@/demo';
import { logger } from '@/utils/logger';

export interface ContentAccessResult {
  hasAccess: boolean;
  reason?: string;
  paymentTxid?: string;
}

/**
 * Check if an address has access to specific content
 */
export async function canAccessContent(
  address: string,
  contentId: string
): Promise<ContentAccessResult> {
  // Try web3/API first
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/paywall/check?address=${encodeURIComponent(address)}&contentId=${encodeURIComponent(contentId)}`
    );

    if (!response.ok) {
      throw new Error('Failed to verify access');
    }

    const data = await response.json();
    return {
      hasAccess: data.hasAccess || false,
      reason: data.reason,
      paymentTxid: data.paymentTxid,
    };
  } catch (error) {
    // Fallback to mock data
    logger.warn('Paywall API check failed, falling back to mock data', { error: error instanceof Error ? error.message : String(error), address, contentId });
    const hasAccess = await mockIndexerApi.hasPaidForContent(address, contentId);
    return {
      hasAccess,
      reason: hasAccess ? 'Payment verified' : 'Payment required',
    };
  }
}

/**
 * Check if an address has an access NFT for content
 */
export async function hasAccessNFT(
  address: string,
  tokenId: string
): Promise<boolean> {
  // Try web3/API first
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/paywall/nft?address=${encodeURIComponent(address)}&tokenId=${encodeURIComponent(tokenId)}`
    );

    if (!response.ok) {
      throw new Error('Failed to verify NFT access');
    }

    const data = await response.json();
    return data.hasAccess || false;
  } catch (error) {
    // Fallback to mock data
    logger.warn('Paywall NFT API check failed, falling back to mock data', { error: error instanceof Error ? error.message : String(error), address, tokenId });
    return mockIndexerApi.hasAccessNFT(address, tokenId);
  }
}

/**
 * Verify payment for content unlock
 */
export async function verifyPayment(
  txid: string,
  contentId: string
): Promise<boolean> {
  // Try web3/API first
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/paywall/verify?txid=${encodeURIComponent(txid)}&contentId=${encodeURIComponent(contentId)}`
    );

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    const data = await response.json();
    return data.verified || false;
  } catch (error) {
    // Fallback to mock data - accept payments that match mock data patterns
    logger.warn('Paywall verification API failed, falling back to mock data', { error: error instanceof Error ? error.message : String(error), txid, contentId });
    return txid.startsWith('demo_tx_') || txid.startsWith('pay_');
  }
}

