import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import DashboardStats from "../../components/dashboard/DashboardStats";
import MemberCardPreview from "../../components/dashboard/MemberCardPreview";
import QuickActions from "../../components/dashboard/QuickActions";
import UpcomingEvents from "../../components/dashboard/UpcomingEvents";
import RecentPayments from "../../components/dashboard/RecentPayments";
import RecentActivity from "../../components/dashboard/RecentActivity";
import Notifications from "../../components/dashboard/Notifications";
import News from "../../components/dashboard/News";

/* ==========================================
   LEADERSHIP
========================================== */

import LeadershipSnapshot from "../../components/leadership/LeadershipSnapshot";

import { useDashboard } from "../../context/DashboardContext";

import "./Dashboard.css";

function Dashboard() {
  /* ==========================================
     DASHBOARD CONTEXT
  ========================================== */

  const {
    member,
    leadership,
    summary,
    statistics,
    events,
    notifications,
    news,
    recentActivity,
    loading,
    error,
  } = useDashboard();

  /* ==========================================
     LOADING
  ========================================== */
console.log("Leadership in Dashboard:", leadership);

  if (loading) {
    return (
      <div className="member-dashboard">

        <div className="dashboard-loading">

          <p>
            Loading dashboard...
          </p>

        </div>

      </div>
    );
  }

  /* ==========================================
     ERROR
  ========================================== */

  if (error) {
    return (
      <div className="member-dashboard">

        <div className="dashboard-empty">

          <h3>
            Unable to Load Dashboard
          </h3>

          <p>
            {error}
          </p>

        </div>

      </div>
    );
  }

  /* ==========================================
     PLACEHOLDERS
     (Replace with services later)
  ========================================== */

  const recentPayments = [];

  /* ==========================================
     PAGE
  ========================================== */

  return (
    <div className="member-dashboard">

      {/* ======================================
          WELCOME
      ====================================== */}

      <WelcomeBanner
        member={member}
        leadership={leadership}
      />

      {/* ======================================
          LEADERSHIP WORKSPACE
      ====================================== */}

      {leadership?.isLeader && (
    <LeadershipSnapshot />
)}

      {/* ======================================
          DASHBOARD STATISTICS
      ====================================== */}

      <DashboardStats
        statistics={statistics}
        summary={summary}
      />

      {/* ======================================
          MEMBERSHIP CARD + QUICK ACTIONS
      ====================================== */}

      <div className="dashboard-grid">

        <div className="dashboard-grid-half">

          <MemberCardPreview
            member={member}
            leadership={leadership}
          />

        </div>

        <div className="dashboard-grid-half">

          <QuickActions
            leadership={leadership}
          />

        </div>

      </div>

      {/* ======================================
          EVENTS + PAYMENTS
      ====================================== */}

      <div className="dashboard-grid">

        <div className="dashboard-grid-half">

          <UpcomingEvents
            events={events}
          />

        </div>

        <div className="dashboard-grid-half">

          <RecentPayments
            payments={recentPayments}
          />

        </div>

      </div>

      {/* ======================================
          RECENT ACTIVITY + NOTIFICATIONS
      ====================================== */}

      <div className="dashboard-grid">

        <div className="dashboard-grid-half">

          <RecentActivity
            activities={recentActivity}
          />

        </div>

        <div className="dashboard-grid-half">

          <Notifications
            notifications={notifications}
          />

        </div>

      </div>

      {/* ======================================
          NEWS
      ====================================== */}

      <News
        news={news}
      />

    </div>
  );
}

export default Dashboard;