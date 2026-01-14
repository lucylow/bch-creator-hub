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
    proposalId: "proposal_002",
    voter: ADDRESSES.creatorBob,
    vote: "against",
    signature: "demo_sig_vote_6",
    timestamp: "2026-01-05T21:00:00Z",
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
  {
    proposalId: "proposal_004",
    voter: ADDRESSES.userLucy,
    vote: "for",
    signature: "demo_sig_vote_7",
    timestamp: "2026-01-02T10:00:00Z",
  },
  {
    proposalId: "proposal_004",
    voter: ADDRESSES.userJudge,
    vote: "for",
    signature: "demo_sig_vote_8",
    timestamp: "2026-01-02T11:00:00Z",
  },
  {
    proposalId: "proposal_004",
    voter: ADDRESSES.creatorAlice,
    vote: "for",
    signature: "demo_sig_vote_9",
    timestamp: "2026-01-02T12:00:00Z",
  },
  {
    proposalId: "proposal_004",
    voter: ADDRESSES.creatorBob,
    vote: "for",
    signature: "demo_sig_vote_10",
    timestamp: "2026-01-02T13:00:00Z",
  },
  {
    proposalId: "proposal_004",
    voter: ADDRESSES.platform,
    vote: "for",
    signature: "demo_sig_vote_11",
    timestamp: "2026-01-02T14:00:00Z",
  },
  {
    proposalId: "proposal_004",
    voter: ADDRESSES.daoTreasury,
    vote: "against",
    signature: "demo_sig_vote_12",
    timestamp: "2026-01-02T15:00:00Z",
  },
  {
    proposalId: "proposal_005",
    voter: ADDRESSES.userLucy,
    vote: "for",
    signature: "demo_sig_vote_13",
    timestamp: "2026-01-05T08:00:00Z",
  },
  {
    proposalId: "proposal_005",
    voter: ADDRESSES.userJudge,
    vote: "against",
    signature: "demo_sig_vote_14",
    timestamp: "2026-01-05T09:00:00Z",
  },
  {
    proposalId: "proposal_005",
    voter: ADDRESSES.creatorAlice,
    vote: "for",
    signature: "demo_sig_vote_15",
    timestamp: "2026-01-05T10:00:00Z",
  },
  {
    proposalId: "proposal_005",
    voter: ADDRESSES.creatorBob,
    vote: "against",
    signature: "demo_sig_vote_16",
    timestamp: "2026-01-05T11:00:00Z",
  },
  {
    proposalId: "proposal_005",
    voter: ADDRESSES.platform,
    vote: "for",
    signature: "demo_sig_vote_17",
    timestamp: "2026-01-05T12:00:00Z",
  },
  {
    proposalId: "proposal_005",
    voter: ADDRESSES.daoTreasury,
    vote: "against",
    signature: "demo_sig_vote_18",
    timestamp: "2026-01-05T13:00:00Z",
  },
  {
    proposalId: "proposal_006",
    voter: ADDRESSES.userLucy,
    vote: "for",
    signature: "demo_sig_vote_19",
    timestamp: "2025-12-28T10:00:00Z",
  },
  {
    proposalId: "proposal_006",
    voter: ADDRESSES.userJudge,
    vote: "for",
    signature: "demo_sig_vote_20",
    timestamp: "2025-12-28T11:00:00Z",
  },
  {
    proposalId: "proposal_006",
    voter: ADDRESSES.creatorAlice,
    vote: "for",
    signature: "demo_sig_vote_21",
    timestamp: "2025-12-28T12:00:00Z",
  },
  {
    proposalId: "proposal_006",
    voter: ADDRESSES.creatorBob,
    vote: "for",
    signature: "demo_sig_vote_22",
    timestamp: "2025-12-28T13:00:00Z",
  },
  {
    proposalId: "proposal_007",
    voter: ADDRESSES.userLucy,
    vote: "for",
    signature: "demo_sig_vote_23",
    timestamp: "2026-01-06T10:00:00Z",
  },
  {
    proposalId: "proposal_007",
    voter: ADDRESSES.userJudge,
    vote: "for",
    signature: "demo_sig_vote_24",
    timestamp: "2026-01-06T11:00:00Z",
  },
  {
    proposalId: "proposal_007",
    voter: ADDRESSES.creatorAlice,
    vote: "against",
    signature: "demo_sig_vote_25",
    timestamp: "2026-01-06T12:00:00Z",
  },
  {
    proposalId: "proposal_007",
    voter: ADDRESSES.creatorBob,
    vote: "against",
    signature: "demo_sig_vote_26",
    timestamp: "2026-01-06T13:00:00Z",
  },
  {
    proposalId: "proposal_007",
    voter: ADDRESSES.platform,
    vote: "against",
    signature: "demo_sig_vote_27",
    timestamp: "2026-01-06T14:00:00Z",
  },
  {
    proposalId: "proposal_007",
    voter: ADDRESSES.daoTreasury,
    vote: "against",
    signature: "demo_sig_vote_28",
    timestamp: "2026-01-06T15:00:00Z",
  },
  {
    proposalId: "proposal_008",
    voter: ADDRESSES.userLucy,
    vote: "for",
    signature: "demo_sig_vote_29",
    timestamp: "2026-01-07T08:00:00Z",
  },
  {
    proposalId: "proposal_008",
    voter: ADDRESSES.userJudge,
    vote: "for",
    signature: "demo_sig_vote_30",
    timestamp: "2026-01-07T09:00:00Z",
  },
  {
    proposalId: "proposal_008",
    voter: ADDRESSES.creatorAlice,
    vote: "for",
    signature: "demo_sig_vote_31",
    timestamp: "2026-01-07T10:00:00Z",
  },
  {
    proposalId: "proposal_008",
    voter: ADDRESSES.creatorBob,
    vote: "for",
    signature: "demo_sig_vote_32",
    timestamp: "2026-01-07T11:00:00Z",
  },
  {
    proposalId: "proposal_008",
    voter: ADDRESSES.platform,
    vote: "for",
    signature: "demo_sig_vote_33",
    timestamp: "2026-01-07T12:00:00Z",
  },
  {
    proposalId: "proposal_008",
    voter: ADDRESSES.daoTreasury,
    vote: "for",
    signature: "demo_sig_vote_34",
    timestamp: "2026-01-07T13:00:00Z",
  },
  {
    proposalId: "proposal_008",
    voter: ADDRESSES.userLucy,
    vote: "against",
    signature: "demo_sig_vote_35",
    timestamp: "2026-01-07T14:00:00Z",
  },
  {
    proposalId: "proposal_009",
    voter: ADDRESSES.userJudge,
    vote: "for",
    signature: "demo_sig_vote_36",
    timestamp: "2025-12-30T10:00:00Z",
  },
  {
    proposalId: "proposal_009",
    voter: ADDRESSES.creatorAlice,
    vote: "for",
    signature: "demo_sig_vote_37",
    timestamp: "2025-12-30T11:00:00Z",
  },
  {
    proposalId: "proposal_009",
    voter: ADDRESSES.creatorBob,
    vote: "for",
    signature: "demo_sig_vote_38",
    timestamp: "2025-12-30T12:00:00Z",
  },
  {
    proposalId: "proposal_009",
    voter: ADDRESSES.platform,
    vote: "for",
    signature: "demo_sig_vote_39",
    timestamp: "2025-12-30T13:00:00Z",
  },
  {
    proposalId: "proposal_009",
    voter: ADDRESSES.daoTreasury,
    vote: "for",
    signature: "demo_sig_vote_40",
    timestamp: "2025-12-30T14:00:00Z",
  },
  {
    proposalId: "proposal_009",
    voter: ADDRESSES.userLucy,
    vote: "against",
    signature: "demo_sig_vote_41",
    timestamp: "2025-12-30T15:00:00Z",
  },
  {
    proposalId: "proposal_009",
    voter: ADDRESSES.userJudge,
    vote: "against",
    signature: "demo_sig_vote_42",
    timestamp: "2025-12-30T16:00:00Z",
  },
  {
    proposalId: "proposal_010",
    voter: ADDRESSES.userLucy,
    vote: "for",
    signature: "demo_sig_vote_43",
    timestamp: "2025-12-25T10:00:00Z",
  },
  {
    proposalId: "proposal_010",
    voter: ADDRESSES.userJudge,
    vote: "for",
    signature: "demo_sig_vote_44",
    timestamp: "2025-12-25T11:00:00Z",
  },
  {
    proposalId: "proposal_010",
    voter: ADDRESSES.creatorAlice,
    vote: "for",
    signature: "demo_sig_vote_45",
    timestamp: "2025-12-25T12:00:00Z",
  },
  {
    proposalId: "proposal_010",
    voter: ADDRESSES.creatorBob,
    vote: "for",
    signature: "demo_sig_vote_46",
    timestamp: "2025-12-25T13:00:00Z",
  },
  {
    proposalId: "proposal_010",
    voter: ADDRESSES.platform,
    vote: "for",
    signature: "demo_sig_vote_47",
    timestamp: "2025-12-25T14:00:00Z",
  },
  {
    proposalId: "proposal_010",
    voter: ADDRESSES.daoTreasury,
    vote: "for",
    signature: "demo_sig_vote_48",
    timestamp: "2025-12-25T15:00:00Z",
  },
  {
    proposalId: "proposal_010",
    voter: ADDRESSES.userLucy,
    vote: "for",
    signature: "demo_sig_vote_49",
    timestamp: "2025-12-25T16:00:00Z",
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

