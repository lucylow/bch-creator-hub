/**
 * Mock DAO Votes
 * 
 * Simulates signature-based voting on DAO proposals.
 */
import { ADDRESSES } from './mockAddresses';

export type MockVote = {
  proposalId: string;
  voter: string;
  vote: "for" | "against";
  signature: string;
  timestamp: string;
};

export const MOCK_VOTES: MockVote[] = [
  {
    proposalId: "proposal_002",
    voter: ADDRESSES.userLucy,
    vote: "for",
    signature: "demo_sig_vote_1",
    timestamp: "2026-01-05T20:00:00Z",
  },
  {
    proposalId: "proposal_002",
    voter: ADDRESSES.userJudge,
    vote: "for",
    signature: "demo_sig_vote_2",
    timestamp: "2026-01-05T20:05:00Z",
  },
  {
    proposalId: "proposal_003",
    voter: ADDRESSES.userLucy,
    vote: "for",
    signature: "demo_sig_vote_3",
    timestamp: "2026-01-05T19:00:00Z",
  },
  {
    proposalId: "proposal_003",
    voter: ADDRESSES.userJudge,
    vote: "against",
    signature: "demo_sig_vote_4",
    timestamp: "2026-01-05T19:10:00Z",
  },
  {
    proposalId: "proposal_003",
    voter: ADDRESSES.creatorAlice,
    vote: "against",
    signature: "demo_sig_vote_5",
    timestamp: "2026-01-05T19:15:00Z",
  },
];

/**
 * Get votes for a proposal
 */
export function getVotesForProposal(proposalId: string): MockVote[] {
  return MOCK_VOTES.filter(v => v.proposalId === proposalId);
}

/**
 * Get votes by a voter
 */
export function getVotesByVoter(voter: string): MockVote[] {
  return MOCK_VOTES.filter(v => v.voter === voter);
}

/**
 * Check if voter has voted on a proposal
 */
export function hasVoted(proposalId: string, voter: string): boolean {
  return MOCK_VOTES.some(
    v => v.proposalId === proposalId && v.voter === voter
  );
}

