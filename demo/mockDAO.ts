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


