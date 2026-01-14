import React, { useState } from "react";
import ProposalList from "../components/ProposalList";
import ProposalDetail from "../components/ProposalDetail";

export default function HomePage() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <div className="card">
        <h2>DAO Dashboard</h2>
        <p className="small">List and inspect proposals on-chain. Use the Propose page to create a new proposal.</p>
      </div>

      <div className="grid">
        <div>
          <ProposalList onSelectProposal={(id) => setSelected(id)} />
        </div>
        <div>
          {selected ? (
            <ProposalDetail proposalId={selected} />
          ) : (
            <div className="card">
              <h3>No proposal selected</h3>
              <div className="small">Select a proposal to see details and actions.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



