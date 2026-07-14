import { useEffect, useState } from "react";

import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import DashboardStats from "../../components/dashboard/DashboardStats";
import MemberCardPreview from "../../components/dashboard/MemberCardPreview";
import QuickActions from "../../components/dashboard/QuickActions";
import UpcomingEvents from "../../components/dashboard/UpcomingEvents";
import RecentPayments from "../../components/dashboard/RecentPayments";
import RecentActivity from "../../components/dashboard/RecentActivity";
import Notifications from "../../components/dashboard/Notifications";
import News from "../../components/dashboard/News";

import { getDashboard } from "../../services/member.service";

import "./Dashboard.css";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const response = await getDashboard();

      setDashboard(response.data);

    } catch (err) {

      console.error(err);

      setError(

        err.response?.data?.message ||

        "Unable to load dashboard."

      );

    } finally {

      setLoading(false);

    }
  };

  if (loading) {

    return (

      <div className="member-dashboard">

        <div className="dashboard-loading">

          <p>Loading dashboard...</p>

        </div>

      </div>

    );

  }

  if (error) {

    return (

      <div className="member-dashboard">

        <div className="dashboard-empty">

          <h3>Unable to Load Dashboard</h3>

          <p>{error}</p>

        </div>

      </div>

    );

  }

  const profile = dashboard?.profile || {};

  const statistics = dashboard?.statistics || {};

  const upcomingEvents =
    dashboard?.upcomingEvents || [];

  const recentPayments =
    dashboard?.recentPayments || [];

  // Backend endpoints to be added later
  const recentActivity =
    dashboard?.recentActivity || [];

  const notifications =
    dashboard?.notifications || [];

  const news =
    dashboard?.news || [];

  return (

    <div className="member-dashboard">

      {/* ==========================================
          WELCOME
      ========================================== */}

      <WelcomeBanner
        profile={profile}
      />

      {/* ==========================================
          STATS
      ========================================== */}

      <DashboardStats
        profile={profile}
        statistics={statistics}
      />

      {/* ==========================================
          CARD + QUICK ACTIONS
      ========================================== */}

      <div className="dashboard-grid">

        <div className="dashboard-grid-half">

          <MemberCardPreview
            profile={profile}
          />

        </div>

        <div className="dashboard-grid-half">

          <QuickActions />

        </div>

      </div>

      {/* ==========================================
          EVENTS + PAYMENTS
      ========================================== */}

      <div className="dashboard-grid">

        <div className="dashboard-grid-half">

          <UpcomingEvents
            events={upcomingEvents}
          />

        </div>

        <div className="dashboard-grid-half">

          <RecentPayments
            payments={recentPayments}
          />

        </div>

      </div>

      {/* ==========================================
          ACTIVITY + NOTIFICATIONS
      ========================================== */}

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

      {/* ==========================================
          NEWS
      ========================================== */}

      <News
        news={news}
      />

    </div>

  );
}

export default Dashboard;