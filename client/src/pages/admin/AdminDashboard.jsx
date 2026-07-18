import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaUsers,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaChartLine,
  FaUserFriends,
  FaPlusCircle,
  FaCog,
  FaArrowRight,
} from "react-icons/fa";

import { getDashboard } from "../../services/admin.service";

import "./Dashboard.css";

function AdminDashboard() {

  const [dashboard, setDashboard] = useState(null);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* ==========================================
     LOAD DASHBOARD
  ========================================== */

  useEffect(() => {

    loadDashboard();

  }, []);

  const loadDashboard = async () => {

    try {

      setLoading(true);

      const response =
        await getDashboard();

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

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {

    return (

      <div className="dashboard-loading">

        Loading dashboard...

      </div>

    );

  }

  /* ==========================================
     ERROR
  ========================================== */

  if (error) {

    return (

      <div className="dashboard-error">

        {error}

      </div>

    );

  }

  const stats = dashboard?.statistics || {};

  return (

    <div className="admin-dashboard">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="dashboard-header">

        <div>

          <h1>

            Dashboard

          </h1>

          <p>

            Welcome back. Here's what's happening across JVP Connect.

          </p>

        </div>

      </div>

      {/* ======================================
          STATISTICS
      ======================================= */}

      <div className="statistics-grid">

        <div className="stat-card">

          <FaUsers className="stat-icon" />

          <div>

            <span>Total Members</span>

            <h2>

              {stats.totalMembers ?? 0}

            </h2>

          </div>

        </div>

       <div className="stat-card">

  <FaUsers className="stat-icon" />

  <div>

    <span>Activated Members</span>

    <h2>

      {stats.activatedMembers ?? 0}

    </h2>

  </div>

</div>

<div className="stat-card">

  <FaUsers className="stat-icon" />

  <div>

    <span>Imported Members</span>

    <h2>

      {stats.importedMembers ?? 0}

    </h2>

  </div>

</div>

<div className="stat-card">

  <FaUsers className="stat-icon" />

  <div>

    <span>New Members</span>

    <h2>

      {stats.newMembers ?? 0}

    </h2>

  </div>

</div>

        <div className="stat-card">

          <FaMoneyBillWave className="stat-icon" />

          <div>

            <span>Total Revenue</span>

            <h2>

              KES {stats.totalRevenue ?? 0}

            </h2>

          </div>

        </div>

        <div className="stat-card">

          <FaChartLine className="stat-icon" />

          <div>

            <span>Payments</span>

            <h2>

              {stats.totalPayments ?? 0}

            </h2>

          </div>

        </div>

        <div className="stat-card">

          <FaCalendarAlt className="stat-icon" />

          <div>

            <span>Events</span>

            <h2>

              {stats.totalEvents ?? 0}

            </h2>

          </div>

        </div>

      </div>

      {/* ======================================
          PLACEHOLDERS
      ======================================= */}

      <div className="dashboard-sections">

        <div className="dashboard-panel">

  <div className="panel-header">

    <h3>Quick Actions</h3>

  </div>

  <div className="quick-actions">

    <button
      className="quick-action"
      onClick={() => navigate("/admin/members")}
    >
      <FaUserFriends />

      <span>Manage Members</span>

      <FaArrowRight />
    </button>

    <button
      className="quick-action"
      onClick={() => navigate("/admin/payments")}
    >
      <FaMoneyBillWave />

      <span>Verify Payments</span>

      <FaArrowRight />
    </button>

    <button
      className="quick-action"
      onClick={() => navigate("/admin/events")}
    >
      <FaCalendarAlt />

      <span>Manage Events</span>

      <FaArrowRight />
    </button>

    <button
      className="quick-action"
      onClick={() => navigate("/admin/events/new")}
    >
      <FaPlusCircle />

      <span>Create Event</span>

      <FaArrowRight />
    </button>

    <button
      className="quick-action"
      onClick={() => navigate("/admin/reports")}
    >
      <FaChartLine />

      <span>Reports</span>

      <FaArrowRight />
    </button>

    <button
      className="quick-action"
      onClick={() => navigate("/admin/settings")}
    >
      <FaCog />

      <span>System Settings</span>

      <FaArrowRight />
    </button>

  </div>

</div>

        <div className="dashboard-panel">

  <div className="panel-header">

    <h3>Upcoming Events</h3>

  </div>

  {dashboard?.upcomingEvents?.length > 0 ? (

    <div className="event-list">

      {dashboard.upcomingEvents.map((event) => (

        <div
          key={event._id}
          className="event-item"
        >

          <div className="event-details">

            <h4>{event.title}</h4>

            <p>

              📅{" "}

              {new Date(event.startDate).toLocaleDateString()}

            </p>

            <p>

              📍 {event.venue}

            </p>

          </div>

          <span className="event-status">

            {event.status}

          </span>

        </div>

      ))}

    </div>

  ) : (

    <div className="empty-panel">

      <FaCalendarAlt size={34} />

      <p>No upcoming events.</p>

    </div>

  )}

</div>

        <div className="dashboard-panel">

  <div className="panel-header">

    <h3>Recent Members</h3>

  </div>

  {dashboard?.recentMembers?.length > 0 ? (

    <div className="member-list">

      {dashboard.recentMembers.map((member) => (

        <div
          key={member._id}
          className="member-item"
        >

          <div className="member-avatar">

            {member.profilePhoto ? (

              <img
                src={member.profilePhoto}
                alt={member.firstName}
              />

            ) : (

              <div className="avatar-placeholder">

                {member.firstName?.charAt(0)}
                {member.lastName?.charAt(0)}

              </div>

            )}

          </div>

          <div className="member-details">

            <h4>

              {member.firstName} {member.lastName}

            </h4>

            <p>

              {member.membershipType}

            </p>

            <small>

              Joined{" "}

              {new Date(member.createdAt).toLocaleDateString()}

            </small>

          </div>

          <div className="member-badges">

            <span
              className={`badge ${
                member.source === "imported"
                  ? "badge-imported"
                  : "badge-new"
              }`}
            >

              {member.source}

            </span>

            <span
              className={`badge ${
                member.accountActivated
                  ? "badge-active"
                  : "badge-pending"
              }`}
            >

              {member.accountActivated
                ? "Activated"
                : "Pending"}

            </span>

          </div>

        </div>

      ))}

    </div>

  ) : (

    <div className="empty-panel">

      <FaUsers size={34} />

      <p>No members found.</p>

    </div>

  )}

</div>

        <div className="dashboard-panel">

  <div className="panel-header">

    <h3>Recent Payments</h3>

  </div>

  {dashboard?.recentPayments?.length > 0 ? (

    <div className="payment-list">

      {dashboard.recentPayments.map((payment) => (

        <div
          key={payment._id}
          className="payment-item"
        >

          <div className="payment-info">

            <h4>

              {payment.member
                ? `${payment.member.firstName} ${payment.member.lastName}`
                : "Unknown Member"}

            </h4>

            <p>

              {payment.paymentMethod}

            </p>

            <small>

              {new Date(payment.createdAt).toLocaleDateString()}

            </small>

          </div>

          <div className="payment-right">

            <strong>

              KES {payment.amount.toLocaleString()}

            </strong>

            <span
              className={`payment-status payment-${payment.status}`}
            >

              {payment.status}

            </span>

          </div>

        </div>

      ))}

    </div>

  ) : (

    <div className="empty-panel">

      <FaMoneyBillWave size={34} />

      <p>No recent payments.</p>

    </div>

  )}

</div>

      </div>

    </div>

  );

}

export default AdminDashboard;