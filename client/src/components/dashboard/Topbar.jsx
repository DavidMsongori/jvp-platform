import { useEffect, useRef, useState } from "react";

import {
  Bell,
  Search,
  ChevronDown,
  User,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useDashboard } from "../../context/DashboardContext";
import { useDashboardUI } from "../../context/DashboardUIContext";

import "./Topbar.css";

const Topbar = () => {
  /* ==========================================
     CONTEXT
  ========================================== */

  const { logout } = useAuth();

  const {
    member,
    summary,
  } = useDashboard();

  const {
    profile,
    fullName,
    profilePhoto,
  } = useProfile();

  const {
    search,
    setSearch,
  } = useDashboardUI();

  /* ==========================================
     STATE
  ========================================== */

  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuRef = useRef(null);

  /* ==========================================
     GREETING
  ========================================== */

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const firstName =
    member?.firstName ||
    profile?.firstName ||
    "Member";

  /* ==========================================
     CLOSE MENU
  ========================================== */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  /* ==========================================
     LOGOUT
  ========================================== */

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  /* ==========================================
     COMPONENT
  ========================================== */

  return (
    <header className="member-topbar">
      {/* ======================================
          LEFT
      ======================================= */}

      <div className="topbar-left">
        <h2>
          {greeting},{" "}
          {firstName}
        </h2>

        <small>
          Welcome to JVP Connect
        </small>
      </div>

      {/* ======================================
          RIGHT
      ======================================= */}

      <div className="topbar-right">
        {/* SEARCH */}

        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search events, programmes, news..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        {/* NOTIFICATIONS */}

        <button
          className="notification-btn"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={20} />

          {summary.unreadNotifications > 0 && (
            <span className="notification-badge">
              {summary.unreadNotifications}
            </span>
          )}
        </button>

        {/* PROFILE */}

        <div
          className="profile-menu"
          ref={menuRef}
        >
          <button
            type="button"
            className="profile-chip"
            onClick={() =>
              setMenuOpen(
                (previous) => !previous
              )
            }
          >
            <img
              src={
                profilePhoto ||
                "/images/default-avatar.png"
              }
              alt={
                fullName ||
                "Member"
              }
              onError={(event) => {
                event.target.src =
                  "/images/default-avatar.png";
              }}
            />

            <span>
              {fullName || "Member"}
            </span>

            <ChevronDown size={16} />
          </button>

          {menuOpen && (
            <div className="profile-dropdown">
              <Link
                to="/dashboard/profile"
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                <User size={18} />
                My Profile
              </Link>

              <Link
                to="/dashboard/membership-card"
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                <CreditCard size={18} />
                Membership Card
              </Link>

              <Link
                to="/dashboard/settings"
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                <Settings size={18} />
                Settings
              </Link>

              <button
                type="button"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;