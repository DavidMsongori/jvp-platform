import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useDashboard } from "../../context/DashboardContext";

import LeadershipSidebar from "../../components/leadership/sidebar/LeadershipSidebar";
import LeadershipHeader from "../../components/leadership/header/LeadershipHeader";

import "./LeadershipLayout.css";

function LeadershipLayout() {
  const {
    loading,
    isLeader,
    leadership,
    leaderId,
    position,
    category,
  } = useDashboard();

  const [collapsed, setCollapsed] = useState(false);

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
    return <Navigate to="/dashboard" replace />;
  }

  /* ==========================================
     LAYOUT
  ========================================== */

  return (
    <div
      className={`leadership-layout ${
        collapsed ? "collapsed" : ""
      }`}
    >
      <LeadershipSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        leadership={leadership}
        leaderId={leaderId}
        position={position}
        category={category}
      />

      <div className="leadership-main">
        <LeadershipHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
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