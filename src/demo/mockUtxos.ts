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
    txid: "tx_dao_treasury_001",
    vout: 0,
    value: 12500000,
    address: ADDRESSES.daoTreasury,
  },
  {
    txid: "tx_user_lucy_001",
    vout: 0,
    value: 500000,
    address: ADDRESSES.userLucy,
  },
  {
    txid: "tx_user_judge_001",
    vout: 0,
    value: 300000,
    address: ADDRESSES.userJudge,
  },
  {
    txid: "tx_platform_001",
    vout: 0,
    value: 1000000,
    address: ADDRESSES.platform,
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

