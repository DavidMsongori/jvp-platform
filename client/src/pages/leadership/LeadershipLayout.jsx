import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useDashboard } from "../../context/DashboardContext";

import LeadershipSidebar from "../../components/leadership/sidebar/LeadershipSidebar";
import LeadershipHeader from "../../components/leadership/header/LeadershipHeader";

import "./LeadershipLayout.css";

function LeadershipLayout() {
  const location = useLocation();

  const {
    loading,
    isLeader,
    leadership,
    leaderId,
    position,
    category,
  } = useDashboard();

  const [
    collapsed,
    setCollapsed,
  ] = useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  /* ==========================================
     CLOSE MOBILE SIDEBAR AFTER NAVIGATION
  ========================================== */

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* ==========================================
     PREVENT BODY SCROLL WHEN SIDEBAR IS OPEN
  ========================================== */

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";

      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* ==========================================
     SIDEBAR TOGGLE

     Mobile: open/close drawer
     Desktop: collapse/expand sidebar
  ========================================== */

  const handleSidebarToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((current) => !current);

      return;
    }

    setCollapsed((current) => !current);
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="leadership-loading">
        Loading Leadership Workspace...
      </div>
    );
  }

  /* ==========================================
     ACCESS CONTROL
  ========================================== */

  if (!isLeader) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  /* ==========================================
     LAYOUT
  ========================================== */

  return (
    <div
      className={`leadership-layout ${
        collapsed
          ? "collapsed"
          : ""
      }`}
    >
      {/* ======================================
          MOBILE OVERLAY
      ====================================== */}

      {mobileOpen && (
        <button
          type="button"
          className="leadership-sidebar-overlay"
          onClick={() =>
            setMobileOpen(false)
          }
          aria-label="Close leadership navigation"
        />
      )}

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <LeadershipSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
        leadership={leadership}
        leaderId={leaderId}
        position={position}
        category={category}
      />

      {/* ======================================
          MAIN
      ====================================== */}

      <div className="leadership-main">
        <LeadershipHeader
          collapsed={collapsed}
          setCollapsed={
            handleSidebarToggle
          }
          leadership={leadership}
          leaderId={leaderId}
          position={position}
          category={category}
        />

        <main className="leadership-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LeadershipLayout;