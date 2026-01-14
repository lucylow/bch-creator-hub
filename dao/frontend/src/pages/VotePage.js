import React, { useState } from "react";
import ProposalList from "../components/ProposalList";
import ProposalDetail from "../components/ProposalDetail";

export default function VotePage() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <div className="card">
        <h2>Vote</h2>
        <p className="small">Review active proposals and cast your vote.</p>
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
              <div className="small">Select a proposal from the list to the left.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


