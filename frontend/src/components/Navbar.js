import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-bracket">[</span>
          intel
          <span className="logo-bracket">]</span>
        </Link>
        <div className="navbar-links">
          <Link to="/">Search</Link>
          <Link to="/history">History</Link>
        </div>
      </div>
    </nav>
  );
}
