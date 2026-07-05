import { useState, useEffect } from "react";
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

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">

        <a href="/" className="logo">
          <img src={logo} alt="JVP Logo" />

          <div>
            <h2>JVP Connect</h2>
            <span>Jumuiya ya Vijana wa Pwani</span>
          </div>
        </a>

        <nav className={mobileMenu ? "nav-links active" : "nav-links"}>

          <a href="/">Home</a>

          <a href="#about">About Us</a>

          <a href="#programs">Programs</a>

          <a href="#summit">Summit 2026</a>

          <a href="#events">Events</a>

          <a href="#news">News</a>

          <a href="#membership">Membership</a>

          <a href="#contact">Contact</a>

        </nav>

        <div className="navbar-actions">

          <a href="/login" className="login-link">
            Login
          </a>

          <a href="/register" className="join-btn">
            Join JVP
            <FaUserPlus />
          </a>

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