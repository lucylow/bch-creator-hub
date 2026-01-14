import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { GOVERNOR_ABI } from "../utils/abis";
import { GOVERNOR_ADDRESS, INDEXER_URL } from "../utils/constants";
import { getReadOnlyProvider } from "../utils/provider";
import { proposalStateLabel } from "../utils/helpers";

export default function ProposalList({ onSelectProposal }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProposals();
    // eslint-disable-next-line
  }, []);

  async function loadProposals() {
    setLoading(true);
    try {
      // Try to load from indexer first
      try {
        const response = await fetch(`${INDEXER_URL}/proposals`);
        if (response.ok) {
          const data = await response.json();
          // Also fetch state for each proposal
          const provider = await getReadOnlyProvider();
          const gov = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, provider);
          const proposalsWithState = await Promise.all(
            data.map(async (p) => {
              try {
                const state = await gov.state(p.proposalId);
                return { ...p, state: state.toNumber() };
              } catch (e) {
                return { ...p, state: -1 };
              }
            })
          );
          setProposals(proposalsWithState.reverse());
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Indexer not available, falling back to on-chain lookup");
      }

      // Fallback: no indexer available
      setProposals([]);
    } catch (err) {
      console.error(err);
      alert("Failed to load proposals. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3>Proposals</h3>
      {loading && <div className="small">Loading...</div>}
      {!loading && proposals.length === 0 && (
        <div className="small">No proposals found. Start the indexer or create a proposal.</div>
      )}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {proposals.map((p) => (
          <li key={p.proposalId} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", borderBottom: "1px solid #eee" }}>
            <div>
              <div style={{ fontWeight: 600 }}>Proposal #{p.proposalId}</div>
              <div className="small">{proposalStateLabel(p.state)}</div>
              {p.description && <div className="small" style={{ marginTop: 4 }}>{p.description.substring(0, 60)}...</div>}
            </div>
            <div>
              <button className="button secondary" onClick={() => onSelectProposal(p.proposalId)}>Open</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}



