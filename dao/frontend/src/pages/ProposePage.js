import React from "react";
import ProposeForm from "../components/ProposeForm";

export default function ProposePage() {
  return (
    <div>
      <div className="card">
        <h2>New Proposal</h2>
        <p className="small">Create a proposal to be voted on by token holders. Ensure your calldata is correct and matches the target contract ABI.</p>
      </div>

      <ProposeForm />
    </div>
  );
}



