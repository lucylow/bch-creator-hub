/**
 * Mock UTXO Set (Bitcoin Cash State)
 * 
 * Simulates the UTXO set that would be returned by a BCH indexer.
 * Includes both BCH and CashToken UTXOs.
 */
import { ADDRESSES } from './mockAddresses';

export type MockUTXO = {
  txid: string;
  vout: number;
  value: number; // sats
  address: string;
  token?: MockToken;
};

export type MockToken = {
  tokenId: string;
  amount: number;
  capability?: "minting" | "mutable" | "none";
};

export const MOCK_UTXOS: MockUTXO[] = [
  {
    txid: "tx_paywall_001",
    vout: 0,
    value: 15000,
    address: ADDRESSES.creatorAlice,
  },
  {
    txid: "tx_paywall_002",
    vout: 0,
    value: 25000,
    address: ADDRESSES.creatorBob,
  },
  {
    txid: "tx_paywall_003",
    vout: 0,
    value: 30000,
    address: ADDRESSES.creatorAlice,
  },
  {
    txid: "tx_paywall_004",
    vout: 0,
    value: 20000,
    address: ADDRESSES.creatorBob,
  },
  {
    txid: "tx_paywall_005",
    vout: 1,
    value: 50000,
    address: ADDRESSES.creatorAlice,
  },
  {
    txid: "tx_nft_001",
    vout: 1,
    value: 546,
    address: ADDRESSES.userLucy,
    token: {
      tokenId: "token_creator_access_001",
      amount: 1,
      capability: "none",
    },
  },
  {
    txid: "tx_nft_002",
    vout: 1,
    value: 546,
    address: ADDRESSES.userJudge,
    token: {
      tokenId: "token_dao_vote_001",
      amount: 1,
      capability: "none",
    },
  },
  {
    txid: "tx_nft_003",
    vout: 1,
    value: 546,
    address: ADDRESSES.userLucy,
    token: {
      tokenId: "token_vip_member_001",
      amount: 1,
      capability: "none",
    },
  },
  {
    txid: "tx_nft_004",
    vout: 2,
    value: 546,
    address: ADDRESSES.userJudge,
    token: {
      tokenId: "token_early_supporter_001",
      amount: 1,
      capability: "none",
    },
  },
  {
    txid: "tx_nft_005",
    vout: 1,
    value: 546,
    address: ADDRESSES.userLucy,
    token: {
      tokenId: "token_annual_pass_2026",
      amount: 1,
      capability: "none",
    },
  },
  {
    txid: "tx_nft_006",
    vout: 0,
    value: 546,
    address: ADDRESSES.creatorAlice,
    token: {
      tokenId: "token_content_creator_001",
      amount: 1,
      capability: "mutable",
    },
  },
  {
    txid: "tx_dao_treasury_001",
    vout: 0,
    value: 12500000,
    address: ADDRESSES.daoTreasury,
  },
  {
    txid: "tx_dao_treasury_002",
    vout: 1,
    value: 3500000,
    address: ADDRESSES.daoTreasury,
  },
  {
    txid: "tx_dao_treasury_003",
    vout: 0,
    value: 8000000,
    address: ADDRESSES.daoTreasury,
  },
  {
    txid: "tx_user_lucy_001",
    vout: 0,
    value: 500000,
    address: ADDRESSES.userLucy,
  },
  {
    txid: "tx_user_lucy_002",
    vout: 1,
    value: 250000,
    address: ADDRESSES.userLucy,
  },
  {
    txid: "tx_user_lucy_003",
    vout: 0,
    value: 150000,
    address: ADDRESSES.userLucy,
  },
  {
    txid: "tx_user_judge_001",
    vout: 0,
    value: 300000,
    address: ADDRESSES.userJudge,
  },
  {
    txid: "tx_user_judge_002",
    vout: 1,
    value: 180000,
    address: ADDRESSES.userJudge,
  },
  {
    txid: "tx_user_judge_003",
    vout: 0,
    value: 120000,
    address: ADDRESSES.userJudge,
  },
  {
    txid: "tx_platform_001",
    vout: 0,
    value: 1000000,
    address: ADDRESSES.platform,
  },
  {
    txid: "tx_platform_002",
    vout: 1,
    value: 500000,
    address: ADDRESSES.platform,
  },
  {
    txid: "tx_platform_003",
    vout: 0,
    value: 750000,
    address: ADDRESSES.platform,
  },
  {
    txid: "tx_creator_alice_extra_001",
    vout: 0,
    value: 40000,
    address: ADDRESSES.creatorAlice,
  },
  {
    txid: "tx_creator_alice_extra_002",
    vout: 1,
    value: 35000,
    address: ADDRESSES.creatorAlice,
  },
  {
    txid: "tx_creator_bob_extra_001",
    vout: 0,
    value: 45000,
    address: ADDRESSES.creatorBob,
  },
  {
    txid: "tx_creator_bob_extra_002",
    vout: 1,
    value: 38000,
    address: ADDRESSES.creatorBob,
  },
];

/**
 * Get UTXOs for a specific address
 */
export function getUTXOsForAddress(address: string): MockUTXO[] {
  return MOCK_UTXOS.filter(utxo => utxo.address === address);
}

/**
 * Get total balance for an address
 */
export function getBalanceForAddress(address: string): number {
  return getUTXOsForAddress(address).reduce((sum, utxo) => sum + utxo.value, 0);
}

