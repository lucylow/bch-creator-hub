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
  {
    txid: "pay_005",
    from: ADDRESSES.userLucy,
    to: ADDRESSES.creatorBob,
    amount: 30000,
    contentId: "guide_slp_tokens",
    timestamp: "2026-01-05T17:00:00Z",
    feeSplit: {
      creator: 29700,
      platform: 300,
    },
  },
  {
    txid: "pay_006",
    from: ADDRESSES.userJudge,
    to: ADDRESSES.creatorAlice,
    amount: 25000,
    contentId: "case_study_nft_marketplace",
    timestamp: "2026-01-05T16:20:00Z",
    feeSplit: {
      creator: 24750,
      platform: 250,
    },
  },
  {
    txid: "pay_007",
    from: ADDRESSES.userLucy,
    to: ADDRESSES.creatorBob,
    amount: 12000,
    contentId: "video_wallet_integration",
    timestamp: "2026-01-05T15:45:00Z",
    feeSplit: {
      creator: 11880,
      platform: 120,
    },
  },
  {
    txid: "pay_008",
    from: ADDRESSES.userJudge,
    to: ADDRESSES.creatorAlice,
    amount: 50000,
    contentId: "premium_newsletter_jan",
    timestamp: "2026-01-05T14:30:00Z",
    feeSplit: {
      creator: 49500,
      platform: 500,
    },
  },
  {
    txid: "pay_009",
    from: ADDRESSES.userLucy,
    to: ADDRESSES.creatorBob,
    amount: 7500,
    contentId: "article_bch_vs_btc",
    timestamp: "2026-01-05T13:15:00Z",
    feeSplit: {
      creator: 7425,
      platform: 75,
    },
  },
  {
    txid: "pay_010",
    from: ADDRESSES.userJudge,
    to: ADDRESSES.creatorAlice,
    amount: 100000,
    contentId: "annual_membership_2026",
    timestamp: "2026-01-05T12:00:00Z",
    feeSplit: {
      creator: 99000,
      platform: 1000,
    },
  },
  {
    txid: "pay_011",
    from: ADDRESSES.userLucy,
    to: ADDRESSES.creatorBob,
    amount: 40000,
    contentId: "tutorial_cashscript_advanced",
    timestamp: "2026-01-05T11:30:00Z",
    feeSplit: {
      creator: 39600,
      platform: 400,
    },
  },
  {
    txid: "pay_012",
    from: ADDRESSES.userJudge,
    to: ADDRESSES.creatorAlice,
    amount: 8000,
    contentId: "quick_tip_twitter",
    timestamp: "2026-01-05T10:45:00Z",
    feeSplit: {
      creator: 7920,
      platform: 80,
    },
  },
  {
    txid: "pay_013",
    from: ADDRESSES.userLucy,
    to: ADDRESSES.creatorBob,
    amount: 60000,
    contentId: "exclusive_podcast_episode",
    timestamp: "2026-01-05T09:20:00Z",
    feeSplit: {
      creator: 59400,
      platform: 600,
    },
  },
  {
    txid: "pay_014",
    from: ADDRESSES.userJudge,
    to: ADDRESSES.creatorAlice,
    amount: 35000,
    contentId: "research_paper_defi",
    timestamp: "2026-01-04T22:10:00Z",
    feeSplit: {
      creator: 34650,
      platform: 350,
    },
  },
  {
    txid: "pay_015",
    from: ADDRESSES.userLucy,
    to: ADDRESSES.creatorBob,
    amount: 18000,
    contentId: "video_livestream_highlights",
    timestamp: "2026-01-04T21:00:00Z",
    feeSplit: {
      creator: 17820,
      platform: 180,
    },
  },
  {
    txid: "pay_016",
    from: ADDRESSES.userJudge,
    to: ADDRESSES.creatorAlice,
    amount: 90000,
    contentId: "code_repository_access",
    timestamp: "2026-01-04T20:30:00Z",
    feeSplit: {
      creator: 89100,
      platform: 900,
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

