import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { GOVERNOR_ABI } from "../utils/abis";
import { GOVERNOR_ADDRESS, INDEXER_URL } from "../utils/constants";
import { getReadOnlyProvider } from "../utils/provider";
import { proposalStateLabel, descriptionHash } from "../utils/helpers";
import VoteControls from "./VoteControls";
import QueueExecuteControls from "./QueueExecuteControls";

export default function ProposalDetail({ proposalId }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [targets, setTargets] = useState([]);
  const [values, setValues] = useState([]);
  const [calldatas, setCalldatas] = useState([]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!proposalId) return;
    loadProposal();
    // eslint-disable-next-line
  }, [proposalId]);

  async function loadProposal() {
    setLoading(true);
    try {
      const provider = await getReadOnlyProvider();
      const gov = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, provider);
      const st = await gov.state(proposalId);
      setState(st.toNumber());

      // Try to load from indexer
      try {
        const response = await fetch(`${INDEXER_URL}/proposals/${proposalId}`);
        if (response.ok) {
          const data = await response.json();
          setProposal(data);
          setTargets(data.targets || []);
          setValues(data.values || []);
          setCalldatas(data.calldatas || []);
          setDescription(data.description || "");
        }
      } catch (err) {
        console.warn("Could not load proposal details from indexer");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load proposal detail: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3>Proposal #{proposalId}</h3>
      {loading ? (
        <div className="small">Loading...</div>
      ) : (
        <>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>{proposalStateLabel(state)}</div>
            <div className="small">On-chain state code: {state}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 6 }}><strong>Description</strong></div>
            <div className="small">{description || "No description available"}</div>
          </div>

          {proposal && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6 }}><strong>Proposer</strong></div>
              <div className="mono">{proposal.proposer}</div>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <strong>Vote</strong>
            <div style={{ marginTop: 8 }}>
              <VoteControls proposalId={proposalId} />
            </div>
          </div>

          {(state === 4 || state === 5) && (
            <div style={{ marginBottom: 12 }}>
              <strong>Queue / Execute</strong>
              <div className="small">If the proposal has succeeded and timelock elapsed, you can queue and execute.</div>
              <div style={{ marginTop: 8 }}>
                {targets.length === 0 ? (
                  <div className="small" style={{ marginBottom: 8 }}>
                    Proposal data not available. You may need to manually enter targets, values, and calldatas from the original proposal.
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 8 }}>
                      <label className="small">Targets (comma-separated) — must match proposal payload</label>
                      <input className="mono" style={{ width: "100%", padding: 8 }} value={targets.join(",")} onChange={(e) => setTargets(e.target.value.split(","))} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label className="small">Values (comma-separated, wei)</label>
                      <input className="mono" style={{ width: "100%", padding: 8 }} value={values.join(",")} onChange={(e) => setValues(e.target.value.split(","))} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label className="small">Calldatas (comma-separated)</label>
                      <input className="mono" style={{ width: "100%", padding: 8 }} value={calldatas.join(",")} onChange={(e) => setCalldatas(e.target.value.split(","))} />
                    </div>
                  </>
                )}
                <div>
                  <QueueExecuteControls proposalId={proposalId} targets={targets} values={values} calldatas={calldatas} description={description} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

