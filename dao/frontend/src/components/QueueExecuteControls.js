import React, { useState } from "react";
import { connect } from "../utils/provider";
import { descriptionHash } from "../utils/helpers";
import { GOVERNOR_ABI } from "../utils/abis";
import { GOVERNOR_ADDRESS } from "../utils/constants";
import { ethers } from "ethers";

export default function QueueExecuteControls({ proposalId, targets, values, calldatas, description }) {
  const [loading, setLoading] = useState(false);

  async function handleQueue() {
    setLoading(true);
    try {
      const { signer } = await connect();
      const gov = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer);
      const descHash = descriptionHash(description);
      const tx = await gov.queue(targets, values, calldatas, descHash);
      await tx.wait();
      alert("Proposal queued");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Queue failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleExecute() {
    setLoading(true);
    try {
      const { signer } = await connect();
      const gov = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer);
      const descHash = descriptionHash(description);
      // For execute may require sending value with transaction if values[] include nonzero.
      const tx = await gov.execute(targets, values, calldatas, descHash, { value: 0 });
      await tx.wait();
      alert("Proposal executed");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Execute failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button className="button" onClick={handleQueue} disabled={loading}>Queue</button>
      <button className="button" onClick={handleExecute} disabled={loading}>Execute</button>
    </div>
  );
}

