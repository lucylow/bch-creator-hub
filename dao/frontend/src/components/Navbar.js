import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const loc = useLocation();
  return (
    <nav className="nav">
      <Link to="/" className={loc.pathname === "/" ? "active" : ""}>Home</Link>
      <Link to="/propose" className={loc.pathname === "/propose" ? "active" : ""}>Propose</Link>
      <Link to="/vote" className={loc.pathname === "/vote" ? "active" : ""}>Vote</Link>
      <Link to="/admin" className={loc.pathname === "/admin" ? "active" : ""}>Admin</Link>
    </nav>
  );
}


