/**
 * Paywall Service
 * 
 * Handles content access checks and payment verification.
 * Supports both demo mode and real blockchain mode.
 */
import { isDemoMode } from '@/config/demo';
import { mockIndexerApi, hasPaidForContent } from '@/demo';

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
  if (isDemoMode()) {
    const hasAccess = await mockIndexerApi.hasPaidForContent(address, contentId);
    return {
      hasAccess,
      reason: hasAccess ? 'Payment verified' : 'Payment required',
    };
  }

  // Real mode: check blockchain/indexer
  try {
    // TODO: Implement real blockchain check
    // This should query the indexer or smart contract to verify payment
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/paywall/check?address=${encodeURIComponent(address)}&contentId=${encodeURIComponent(contentId)}`
    );

    if (!response.ok) {
      return {
        hasAccess: false,
        reason: 'Failed to verify access',
      };
    }

    const data = await response.json();
    return {
      hasAccess: data.hasAccess || false,
      reason: data.reason,
      paymentTxid: data.paymentTxid,
    };
  } catch (error) {
    return {
      hasAccess: false,
      reason: 'Error checking access',
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
  if (isDemoMode()) {
    return mockIndexerApi.hasAccessNFT(address, tokenId);
  }

  // Real mode: check blockchain
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/paywall/nft?address=${encodeURIComponent(address)}&tokenId=${encodeURIComponent(tokenId)}`
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.hasAccess || false;
  } catch (error) {
    return false;
  }
}

/**
 * Verify payment for content unlock
 */
export async function verifyPayment(
  txid: string,
  contentId: string
): Promise<boolean> {
  if (isDemoMode()) {
    // In demo mode, accept any payment that matches our mock data
    return txid.startsWith('demo_tx_') || txid.startsWith('pay_');
  }

  // Real mode: verify transaction on blockchain
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/paywall/verify?txid=${encodeURIComponent(txid)}&contentId=${encodeURIComponent(contentId)}`
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.verified || false;
  } catch (error) {
    return false;
  }
}

