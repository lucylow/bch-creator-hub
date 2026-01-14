/**
 * Mock Indexer API
 * 
 * Drop-in replacement for BCH indexer API calls.
 * Returns mock data that mirrors real indexer responses.
 */
import {
  MOCK_PAYMENTS,
  getPaymentsForCreator,
  getPaymentsFromUser,
  hasPaidForContent as checkPaymentAccess,
} from './mockPayments';
import {
  MOCK_NFTS,
  getNFTsForAddress,
  hasAccessNFT,
} from './mockNFTs';
import {
  MOCK_PROPOSALS,
  getProposals,
  getProposalById,
  getActiveProposals,
} from './mockDAO';
import {
  getVotesForProposal,
  getVotesByVoter,
  hasVoted,
} from './mockVotes';
import {
  getUTXOsForAddress,
  getBalanceForAddress,
} from './mockUtxos';

export const mockIndexerApi = {
  /**
   * Get payments received by an address (creator)
   */
  async getPayments(address: string) {
    return getPaymentsForCreator(address);
  },

  /**
   * Get payments sent by an address (user)
   */
  async getPaymentsFrom(address: string) {
    return getPaymentsFromUser(address);
  },

  /**
   * Get NFTs owned by an address
   */
  async getNFTs(address: string) {
    return getNFTsForAddress(address);
  },

  /**
   * Get all DAO proposals
   */
  async getProposals() {
    return getProposals();
  },

  /**
   * Get active DAO proposals
   */
  async getActiveProposals() {
    return getActiveProposals();
  },

  /**
   * Get proposal by ID
   */
  async getProposal(id: string) {
    return getProposalById(id);
  },

  /**
   * Get votes for a proposal
   */
  async getVotesForProposal(proposalId: string) {
    return getVotesForProposal(proposalId);
  },

  /**
   * Get votes by a voter
   */
  async getVotesByVoter(voter: string) {
    return getVotesByVoter(voter);
  },

  /**
   * Check if address has access NFT
   */
  async hasAccessNFT(address: string, tokenId: string): Promise<boolean> {
    return hasAccessNFT(address, tokenId);
  },

  /**
   * Check if user has paid for content
   */
  async hasPaidForContent(address: string, contentId: string): Promise<boolean> {
    return checkPaymentAccess(address, contentId);
  },

  /**
   * Get UTXOs for an address
   */
  async getUTXOs(address: string) {
    return getUTXOsForAddress(address);
  },

  /**
   * Get balance for an address
   */
  async getBalance(address: string) {
    return getBalanceForAddress(address);
  },

  /**
   * Check if voter has voted on proposal
   */
  async hasVoted(proposalId: string, voter: string): Promise<boolean> {
    return hasVoted(proposalId, voter);
  },
};

