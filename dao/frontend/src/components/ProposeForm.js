import React, { useState } from "react";
import { connect } from "../utils/provider";
import { ethers } from "ethers";
import { GOVERNOR_ABI } from "../utils/abis";
import { GOVERNOR_ADDRESS, TREASURY_ADDRESS } from "../utils/constants";

export default function ProposeForm() {
  const [targets, setTargets] = useState("");
  const [values, setValues] = useState("");
  const [calldatas, setCalldatas] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handlePropose(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { signer } = await connect();
      const gov = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer);

      const targetsArr = targets.split(",").map((s) => s.trim()).filter(Boolean);
      const valuesArr = values.split(",").map((s) => ethers.BigNumber.from(s.trim() || "0"));
      const calldatasArr = calldatas.split(",").map((s) => s.trim()).filter(Boolean);

      if (targetsArr.length === 0 || calldatasArr.length === 0) {
        alert("Please provide at least one target and calldata");
        return;
      }

      const tx = await gov.propose(targetsArr, valuesArr, calldatasArr, description);
      const receipt = await tx.wait();
      alert("Proposal submitted. tx: " + receipt.transactionHash);
      
      // Reset form
      setTargets("");
      setValues("");
      setCalldatas("");
      setDescription("");
    } catch (err) {
      console.error(err);
      alert("Propose failed: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  function fillReleaseExample() {
    // example for Treasury.releaseEther(address,uint256)
    const iface = new ethers.utils.Interface(["function releaseEther(address payable to, uint256 amount)"]);
    const exampleRecipient = "0x0000000000000000000000000000000000000000"; // Replace with actual address
    const sampleCalldata = iface.encodeFunctionData("releaseEther", [exampleRecipient, ethers.utils.parseEther("0.1")]);
    setTargets(TREASURY_ADDRESS || "");
    setValues("0");
    setCalldatas(sampleCalldata);
    setDescription("Release 0.1 ETH to recipient");
  }

  return (
    <div className="card">
      <h3>Create Proposal</h3>
      <form onSubmit={handlePropose}>
        <label className="small">Targets (comma separated addresses)</label>
        <input className="mono" style={{ width: "100%", marginTop: 8, marginBottom: 12, padding: 8 }} value={targets} onChange={(e) => setTargets(e.target.value)} placeholder="0x..." />

        <label className="small">Values (comma separated, wei)</label>
        <input className="mono" style={{ width: "100%", marginTop: 8, marginBottom: 12, padding: 8 }} value={values} onChange={(e) => setValues(e.target.value)} placeholder="0" />

        <label className="small">Calldatas (comma separated, hex-encoded)</label>
        <input className="mono" style={{ width: "100%", marginTop: 8, marginBottom: 12, padding: 8 }} value={calldatas} onChange={(e) => setCalldatas(e.target.value)} placeholder="0x..." />

        <label className="small">Description</label>
        <input style={{ width: "100%", marginTop: 8, marginBottom: 12, padding: 8 }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the proposal" />

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="button" disabled={submitting}>{submitting ? "Submitting..." : "Propose"}</button>
          <button type="button" className="button secondary" onClick={fillReleaseExample}>Fill example</button>
        </div>
      </form>
    </div>
  );
}


