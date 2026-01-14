/**
 * Mock Paywall Payments
 * 
 * Simulates payment transactions for content unlocks.
 * Includes fee splits between creators and platform.
 */
import { ADDRESSES } from './mockAddresses';

export type MockPayment = {
  txid: string;
  from: string;
  to: string;
  amount: number; // sats
  contentId: string;
  timestamp: string;
  feeSplit: {
    creator: number;
    platform: number;
  };
};

export const MOCK_PAYMENTS: MockPayment[] = [
  {
    txid: "pay_001",
    from: ADDRESSES.userLucy,
    to: ADDRESSES.creatorAlice,
    amount: 10000,
    contentId: "post_ethereum_vs_bch",
    timestamp: "2026-01-05T20:45:00Z",
    feeSplit: {
      creator: 9900,
      platform: 100,
    },
  },
  {
    txid: "pay_002",
    from: ADDRESSES.userJudge,
    to: ADDRESSES.creatorBob,
    amount: 5000,
    contentId: "video_cashscript_intro",
    timestamp: "2026-01-05T20:48:00Z",
    feeSplit: {
      creator: 4950,
      platform: 50,
    },
  },
  {
    txid: "pay_003",
    from: ADDRESSES.userLucy,
    to: ADDRESSES.creatorAlice,
    amount: 15000,
    contentId: "article_bch_scaling",
    timestamp: "2026-01-05T19:30:00Z",
    feeSplit: {
      creator: 14850,
      platform: 150,
    },
  },
  {
    txid: "pay_004",
    from: ADDRESSES.userJudge,
    to: ADDRESSES.creatorAlice,
    amount: 20000,
    contentId: "tutorial_cashtokens",
    timestamp: "2026-01-05T18:15:00Z",
    feeSplit: {
      creator: 19800,
      platform: 200,
    },
  },
];

/**
 * Get payments for a creator (received payments)
 */
export function getPaymentsForCreator(address: string): MockPayment[] {
  return MOCK_PAYMENTS.filter(p => p.to === address);
}

/**
 * Get payments from a user (sent payments)
 */
export function getPaymentsFromUser(address: string): MockPayment[] {
  return MOCK_PAYMENTS.filter(p => p.from === address);
}

/**
 * Get payment for specific content
 */
export function getPaymentForContent(contentId: string, fromAddress: string): MockPayment | undefined {
  return MOCK_PAYMENTS.find(
    p => p.contentId === contentId && p.from === fromAddress
  );
}

/**
 * Check if user has paid for content
 */
export function hasPaidForContent(address: string, contentId: string): boolean {
  return MOCK_PAYMENTS.some(
    p => p.from === address && p.contentId === contentId
  );
}



