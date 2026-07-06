import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes, FaUserPlus } from "react-icons/fa";

import "./Navbar.css";
import logo from "../../assets/images/jvp-logo.png";

function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => {
    setMobileMenu(false);
  };

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">

        {/* Logo */}
        <Link to="/" className="logo" onClick={closeMenu}>
          <img src={logo} alt="JVP Logo" />

          <div>
            <h2>JVP Connect</h2>
            <span>Jumuiya ya Vijana wa Pwani</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className={mobileMenu ? "nav-links active" : "nav-links"}>

          <Link to="/" onClick={closeMenu}>
            Home
          </Link>

          <Link to="/about" onClick={closeMenu}>
            About Us
          </Link>

          <Link to="/programs" onClick={closeMenu}>
            Programs
          </Link>

          <Link to="/summit" onClick={closeMenu}>
            Summit 2026
          </Link>

          <Link to="/events" onClick={closeMenu}>
            Events
          </Link>

          <Link to="/news" onClick={closeMenu}>
            News
          </Link>

          <Link to="/membership" onClick={closeMenu}>
            Membership
          </Link>

          <Link to="/contact" onClick={closeMenu}>
            Contact
          </Link>

        </nav>

        {/* Right Side Buttons */}
        <div className="navbar-actions">

          <Link
            to="/login"
            className="login-link"
            onClick={closeMenu}
          >
            Login
          </Link>

          <Link
            to="/register"
            className="join-btn"
            onClick={closeMenu}
          >
            Join JVP
            <FaUserPlus />
          </Link>

          <button
            className="menu-btn"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <FaTimes /> : <FaBars />}
          </button>

        </div>

      </div>
    </header>
  );
}

export default Navbar;