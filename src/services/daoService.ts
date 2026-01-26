/**
 * DAO Governance Service
 *
 * Reads proposals and votes from the indexer (or mock in demo mode).
 * Write operations (vote, create proposal) are no-ops in demo and can be
 * wired to a real backend or contract when available.
 */
import { isDemoMode } from "@/config/demo";
import { mockIndexerApi } from "@/demo/mockIndexerApi";

export type ProposalStatus = "active" | "passed" | "executed" | "rejected";

export interface Proposal {
  id: string;
  title: string;
  description: string;
  amount: number;
  recipient: string;
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  status: ProposalStatus;
  createdAt: string;
  expiresAt: string;
}

export interface Vote {
  proposalId: string;
  voter: string;
  vote: "for" | "against";
  signature: string;
  timestamp: string;
}

const daoService = {
  async getProposals(): Promise<Proposal[]> {
    if (isDemoMode()) {
      return mockIndexerApi.getProposals() as Promise<Proposal[]>;
    }
    const base = import.meta.env.VITE_INDEXER_URL || "";
    const res = await fetch(`${base}/api/dao/proposals`);
    if (!res.ok) throw new Error("Failed to load proposals");
    return res.json();
  },

  async getProposal(id: string): Promise<Proposal | null> {
    if (isDemoMode()) {
      const p = await mockIndexerApi.getProposal(id);
      return (p as Proposal) ?? null;
    }
    const base = import.meta.env.VITE_INDEXER_URL || "";
    const res = await fetch(`${base}/api/dao/proposals/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getVotesForProposal(proposalId: string): Promise<Vote[]> {
    if (isDemoMode()) {
      return mockIndexerApi.getVotesForProposal(proposalId) as Promise<Vote[]>;
    }
    const base = import.meta.env.VITE_INDEXER_URL || "";
    const res = await fetch(`${base}/api/dao/proposals/${proposalId}/votes`);
    if (!res.ok) return [];
    return res.json();
  },

  async hasVoted(proposalId: string, voterAddress: string): Promise<boolean> {
    if (isDemoMode()) {
      return mockIndexerApi.hasVoted(proposalId, voterAddress);
    }
    const base = import.meta.env.VITE_INDEXER_URL || "";
    const res = await fetch(
      `${base}/api/dao/proposals/${proposalId}/votes/check?voter=${encodeURIComponent(voterAddress)}`
    );
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.hasVoted;
  },

  async submitVote(
    proposalId: string,
    support: "for" | "against",
    voterAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    if (isDemoMode()) {
      return { success: true };
    }
    const base = import.meta.env.VITE_INDEXER_URL || "";
    const res = await fetch(`${base}/api/dao/proposals/${proposalId}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ support, voterAddress }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (data.error as string) || "Vote failed" };
    }
    return { success: true };
  },

  async createProposal(params: {
    title: string;
    description: string;
    amount: number;
    recipient: string;
    proposerAddress: string;
  }): Promise<{ success: boolean; proposalId?: string; error?: string }> {
    if (isDemoMode()) {
      return { success: true, proposalId: `proposal_demo_${Date.now()}` };
    }
    const base = import.meta.env.VITE_INDEXER_URL || "";
    const res = await fetch(`${base}/api/dao/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: (data.error as string) || "Failed to create proposal",
      };
    }
    return { success: true, proposalId: data.proposalId as string };
  },
};

export default daoService;
