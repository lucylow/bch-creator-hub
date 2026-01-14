import React, { useEffect, useState } from "react";
import { connect, clearCachedProvider } from "../utils/provider";

export default function ConnectWallet() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    // Auto-connect if cached (optional)
  }, []);

  async function handleConnect() {
    try {
      const { signer, address } = await connect();
      setAccount(address);
      setSigner(signer);
      // Store in context or global state if needed
      window.daoSigner = signer;
      window.daoAccount = address;
    } catch (err) {
      console.error(err);
      alert("Connect failed. Check console.");
    }
  }

  function disconnect() {
    clearCachedProvider();
    setAccount(null);
    setSigner(null);
    window.daoSigner = null;
    window.daoAccount = null;
    window.location.reload();
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {account ? (
        <>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600 }}>{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</div>
            <div className="small">Connected</div>
          </div>
          <button className="button secondary" onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button className="button" onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  );
}



