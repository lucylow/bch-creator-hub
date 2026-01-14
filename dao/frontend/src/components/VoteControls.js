import React, { useState } from "react";
import { connect } from "../utils/provider";
import { GOVERNOR_ABI } from "../utils/abis";
import { GOVERNOR_ADDRESS } from "../utils/constants";
import { ethers } from "ethers";

export default function VoteControls({ proposalId }) {
  const [submitting, setSubmitting] = useState(false);

  async function castVote(support) {
    setSubmitting(true);
    try {
      const { signer } = await connect();
      const gov = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer);
      const tx = await gov.castVote(proposalId, support);
      await tx.wait();
      alert("Vote cast successfully");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Vote failed: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button className="button" onClick={() => castVote(1)} disabled={submitting}>Vote FOR</button>
      <button className="button secondary" onClick={() => castVote(0)} disabled={submitting}>Vote AGAINST</button>
      <button className="button secondary" onClick={() => castVote(2)} disabled={submitting}>ABSTAIN</button>
    </div>
  );
}



