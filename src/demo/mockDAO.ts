/**
 * Mock DAO Proposals
 * 
 * Simulates DAO governance proposals with voting state.
 */
import { ADDRESSES } from './mockAddresses';

export type MockProposal = {
  id: string;
  title: string;
  description: string;
  amount: number; // sats
  recipient: string;
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  status: "active" | "passed" | "executed" | "rejected";
  createdAt: string;
  expiresAt: string;
};

export const MOCK_PROPOSALS: MockProposal[] = [
  {
    id: "proposal_001",
    title: "Fund Creator Discovery Page",
    description: "Allocate funds to build a new creator discovery UX",
    amount: 2000000,
    recipient: ADDRESSES.creatorAlice,
    votesFor: 3,
    votesAgainst: 0,
    quorum: 2,
    status: "passed",
    createdAt: "2026-01-01T00:00:00Z",
    expiresAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "proposal_002",
    title: "Lower Platform Fee to 0.5%",
    description: "Reduce withdrawal fee to improve creator retention",
    amount: 0,
    recipient: ADDRESSES.platform,
    votesFor: 2,
    votesAgainst: 1,
    quorum: 2,
    status: "active",
    createdAt: "2026-01-03T00:00:00Z",
    expiresAt: "2026-01-17T00:00:00Z",
  },
  {
    id: "proposal_003",
    title: "Grant for BCH Education Content",
    description: "Fund educational content series about Bitcoin Cash",
    amount: 5000000,
    recipient: ADDRESSES.creatorBob,
    votesFor: 1,
    votesAgainst: 2,
    quorum: 2,
    status: "active",
    createdAt: "2026-01-04T00:00:00Z",
    expiresAt: "2026-01-18T00:00:00Z",
  },
  {
    id: "proposal_004",
    title: "Implement NFT Marketplace Integration",
    description: "Build marketplace features for CashToken NFTs",
    amount: 3500000,
    recipient: ADDRESSES.platform,
    votesFor: 5,
    votesAgainst: 1,
    quorum: 3,
    status: "passed",
    createdAt: "2026-01-02T00:00:00Z",
    expiresAt: "2026-01-16T00:00:00Z",
  },
  {
    id: "proposal_005",
    title: "Creator Staking Rewards Program",
    description: "Implement staking mechanism for creators",
    amount: 0,
    recipient: ADDRESSES.platform,
    votesFor: 3,
    votesAgainst: 3,
    quorum: 4,
    status: "active",
    createdAt: "2026-01-05T00:00:00Z",
    expiresAt: "2026-01-19T00:00:00Z",
  },
  {
    id: "proposal_006",
    title: "Multi-signature Treasury Upgrade",
    description: "Upgrade DAO treasury to 3-of-5 multisig",
    amount: 1000000,
    recipient: ADDRESSES.daoTreasury,
    votesFor: 4,
    votesAgainst: 0,
    quorum: 2,
    status: "executed",
    createdAt: "2025-12-28T00:00:00Z",
    expiresAt: "2026-01-11T00:00:00Z",
  },
  {
    id: "proposal_007",
    title: "Content Moderation Tools",
    description: "Develop tools for community content moderation",
    amount: 1800000,
    recipient: ADDRESSES.creatorBob,
    votesFor: 2,
    votesAgainst: 4,
    quorum: 3,
    status: "rejected",
    createdAt: "2026-01-06T00:00:00Z",
    expiresAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "proposal_008",
    title: "Mobile App Development Grant",
    description: "Fund development of native mobile applications",
    amount: 8000000,
    recipient: ADDRESSES.creatorAlice,
    votesFor: 6,
    votesAgainst: 1,
    quorum: 4,
    status: "active",
    createdAt: "2026-01-07T00:00:00Z",
    expiresAt: "2026-01-21T00:00:00Z",
  },
  {
    id: "proposal_009",
    title: "Increase Proposal Voting Period",
    description: "Extend voting period from 14 to 21 days",
    amount: 0,
    recipient: ADDRESSES.platform,
    votesFor: 5,
    votesAgainst: 2,
    quorum: 3,
    status: "passed",
    createdAt: "2025-12-30T00:00:00Z",
    expiresAt: "2026-01-13T00:00:00Z",
  },
  {
    id: "proposal_010",
    title: "Bug Bounty Program Launch",
    description: "Allocate funds for security bug bounty program",
    amount: 2500000,
    recipient: ADDRESSES.platform,
    votesFor: 7,
    votesAgainst: 0,
    quorum: 3,
    status: "executed",
    createdAt: "2025-12-25T00:00:00Z",
    expiresAt: "2026-01-08T00:00:00Z",
  },
];

/**
 * Get all proposals
 */
export function getProposals(): MockProposal[] {
  return MOCK_PROPOSALS;
}

/**
 * Get proposal by ID
 */
export function getProposalById(id: string): MockProposal | undefined {
  return MOCK_PROPOSALS.find(p => p.id === id);
}

/**
 * Get active proposals
 */
export function getActiveProposals(): MockProposal[] {
  return MOCK_PROPOSALS.filter(p => p.status === "active");
}

