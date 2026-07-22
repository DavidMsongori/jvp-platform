import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaChevronDown,
  FaUserPlus,
} from "react-icons/fa";

import "./Navbar.css";
import logo from "../../assets/images/jvp-logo.png";

function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(false);
  const [desktopDropdown, setDesktopDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDesktopDropdown(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const closeMenu = () => {
    setMobileMenu(false);
    setMobileDropdown(false);
    setDesktopDropdown(false);
  };

  return (
    <header
      className={`navbar ${scrolled ? "scrolled" : ""}`}
    >
      <div className="navbar-container">
        {/* =====================================
            LOGO
        ====================================== */}

        <Link
          to="/"
          className="logo"
          onClick={closeMenu}
        >
          <img
            src={logo}
            alt="JVP Connect Logo"
          />

          <div>
            <h2>JVP Connect</h2>
            <span>
              Jumuiya ya Vijana wa Pwani
            </span>
          </div>
        </Link>

        {/* =====================================
    NAVIGATION
===================================== */}

<nav
  className={
    mobileMenu
      ? "nav-links active"
      : "nav-links"
  }
>
  <Link to="/" onClick={closeMenu}>
    Home
  </Link>

  <Link to="/about" onClick={closeMenu}>
    About Us
  </Link>

  <Link to="/events" onClick={closeMenu}>
    Events
  </Link>

  <Link to="/summit" onClick={closeMenu}>
    Summit
  </Link>

  <Link to="/leadership" onClick={closeMenu}>
    Leadership
  </Link>

  <Link to="/news" onClick={closeMenu}>
    News
  </Link>

  {/* Dropdown */}

  <div
    className={`dropdown ${
      mobileDropdown ? "open" : ""
    }`}
    ref={dropdownRef}
  >
    <button
  type="button"
  className="dropdown-toggle"
  onClick={() => {
    if (window.innerWidth <= 992) {
      setMobileDropdown(!mobileDropdown);
    } else {
      setDesktopDropdown(!desktopDropdown);
    }
  }}
>
      More

      <FaChevronDown
        className={`dropdown-icon ${
          desktopDropdown ||
          mobileDropdown
            ? "rotate"
            : ""
        }`}
      />
    </button>

    <div
      className={`dropdown-menu ${
        desktopDropdown ||
        mobileDropdown
          ? "show"
          : ""
      }`}
    >
      <Link
        to="/programs"
        onClick={closeMenu}
      >
        Programs
      </Link>

      <Link
        to="/membership"
        onClick={closeMenu}
      >
        Membership
      </Link>

      <Link
        to="/contact"
        onClick={closeMenu}
      >
        Contact
      </Link>
    </div>
  </div>

  {/* MOBILE ACTION BUTTONS */}

  <div className="mobile-actions">

    <Link
      to="/login"
      className="mobile-login-btn"
      onClick={closeMenu}
    >
      Login
    </Link>

    <Link
      to="/register"
      className="mobile-join-btn"
      onClick={closeMenu}
    >
      Join JVP

      <FaUserPlus />
    </Link>

  </div>

</nav>

        {/* =====================================
            ACTION BUTTONS
        ====================================== */}

        <div className="navbar-actions">
          <Link
            to="/login"
            className="login-btn"
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
  type="button"
  className="menu-btn"
  onClick={() => setMobileMenu((prev) => !prev)}
  aria-label={
    mobileMenu
      ? "Close navigation menu"
      : "Open navigation menu"
  }
  aria-expanded={mobileMenu}
>
  {mobileMenu ? <FaTimes /> : <FaBars />}
</button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;