import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProposePage from "./pages/ProposePage";
import VotePage from "./pages/VotePage";
import AdminPage from "./pages/AdminPage";
import Navbar from "./components/Navbar";
import ConnectWallet from "./components/ConnectWallet";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <div className="topbar">
          <div style={{ flex: 1 }}>
            <Link to="/" className="brand">BCH Paywall Router — DAO</Link>
          </div>
          <ConnectWallet />
        </div>

        <main className="container">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/propose" element={<ProposePage />} />
            <Route path="/vote" element={<VotePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>

        <footer className="footer">
          <div>DAO UI — Demo. Connect a wallet on the network matching REACT_APP_RPC_URL</div>
        </footer>
      </div>
    </BrowserRouter>
  );
}


