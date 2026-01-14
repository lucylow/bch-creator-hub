import React, { useState } from "react";
import { connect } from "../utils/provider";
import { TREASURY_ABI } from "../utils/abis";
import { TREASURY_ADDRESS } from "../utils/constants";
import { ethers } from "ethers";

export default function AdminPage() {
  const [releaseTo, setReleaseTo] = useState("");
  const [releaseAmount, setReleaseAmount] = useState("0.1");
  const [status, setStatus] = useState("");

  async function handleRelease() {
    setStatus("Submitting...");
    try {
      const { signer } = await connect();
      const treasury = new ethers.Contract(TREASURY_ADDRESS, TREASURY_ABI, signer);
      const wei = ethers.utils.parseEther(releaseAmount);
      const tx = await treasury.releaseEther(releaseTo, wei);
      await tx.wait();
      setStatus("Release executed. tx:" + tx.hash);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err.message || err));
    }
  }

  return (
    <div>
      <div className="card">
        <h2>Admin / Treasury</h2>
        <p className="small">Direct treasury calls should be managed via governance — this panel is for authorized timelock actors in testing.</p>
      </div>

      <div className="card">
        <h3>Release ETH (timelock role required)</h3>
        <label className="small">Recipient address</label>
        <input className="mono" style={{ width: "100%", padding: 8, marginBottom: 8 }} value={releaseTo} onChange={(e) => setReleaseTo(e.target.value)} />

        <label className="small">Amount (ETH)</label>
        <input style={{ width: 120, padding: 8, marginBottom: 12 }} value={releaseAmount} onChange={(e) => setReleaseAmount(e.target.value)} />

        <div style={{ display: "flex", gap: 8 }}>
          <button className="button" onClick={handleRelease}>Release</button>
        </div>

        <div style={{ marginTop: 12 }} className="small">{status}</div>
      </div>
    </div>
  );
}


