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
  FaExclamationCircle,
  FaCheckCircle,
  FaSyncAlt,
} from "react-icons/fa";

import {
  getDashboard,
  getManualMpesaQueue,
} from "../../services/admin.service";

import "./Dashboard.css";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);

  const [pendingMpesaCount, setPendingMpesaCount] = useState(0);
  const [queueLoading, setQueueLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  /* ==========================================
     LOAD DASHBOARD
  ========================================== */

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const response = await getDashboard();

      const data = response?.data || response;

      setDashboard(data);
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
     LOAD MANUAL M-PESA QUEUE
  ========================================== */

  const loadPendingMpesaQueue = async () => {
    try {
      setQueueLoading(true);

      const response = await getManualMpesaQueue();

      const data = response?.data || response;

      let queue = [];

      if (Array.isArray(data)) {
        queue = data;
      } else if (Array.isArray(data?.payments)) {
        queue = data.payments;
      } else if (Array.isArray(data?.queue)) {
        queue = data.queue;
      } else if (Array.isArray(data?.results)) {
        queue = data.results;
      }

      setPendingMpesaCount(queue.length);
    } catch (err) {
      console.error(
        "Unable to load manual M-Pesa queue:",
        err
      );

      setPendingMpesaCount(0);
    } finally {
      setQueueLoading(false);
    }
  };

  /* ==========================================
     INITIAL LOAD
  ========================================== */

  useEffect(() => {
    loadDashboard();
    loadPendingMpesaQueue();
  }, []);

  /* ==========================================
     REFRESH QUEUE
  ========================================== */

  const handleRefreshQueue = async () => {
    await loadPendingMpesaQueue();
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
          <h1>Dashboard</h1>

          <p>
            Welcome back. Here's what's happening
            across JVP Connect.
          </p>
        </div>

        <button
          className="dashboard-refresh-btn"
          onClick={() => {
            loadDashboard();
            loadPendingMpesaQueue();
          }}
          title="Refresh dashboard"
        >
          <FaSyncAlt />
          <span>Refresh</span>
        </button>
      </div>


      {/* ======================================
          PAYMENT VERIFICATION ALERT
      ======================================= */}

      {!queueLoading && pendingMpesaCount > 0 && (
        <div className="payment-verification-alert">

          <div className="payment-alert-icon">
            <FaExclamationCircle />
          </div>

          <div className="payment-alert-content">
            <h3>
              {pendingMpesaCount} Manual M-Pesa Payment
              {pendingMpesaCount !== 1 ? "s" : ""} Awaiting
              Verification
            </h3>

            <p>
              Members have submitted M-Pesa confirmation
              codes and are waiting for Finance/Admin
              verification.
            </p>
          </div>

          <button
            className="payment-alert-action"
            onClick={() => navigate("/admin/payments")}
          >
            Review Payments
            <FaArrowRight />
          </button>

        </div>
      )}

      {!queueLoading && pendingMpesaCount === 0 && (
        <div className="payment-verification-clear">

          <FaCheckCircle />

          <div>
            <strong>
              Payment verification queue is clear
            </strong>

            <span>
              There are no manual M-Pesa payments
              awaiting verification.
            </span>
          </div>

          <button
            onClick={handleRefreshQueue}
            title="Refresh verification queue"
          >
            <FaSyncAlt />
          </button>

        </div>
      )}


      {/* ======================================
          STATISTICS
      ======================================= */}

      <div className="statistics-grid">

        <div className="stat-card">
          <FaUsers className="stat-icon" />

          <div>
            <span>Total Members</span>
            <h2>{stats.totalMembers ?? 0}</h2>
          </div>
        </div>


        <div className="stat-card">
          <FaUsers className="stat-icon" />

          <div>
            <span>Activated Members</span>
            <h2>{stats.activatedMembers ?? 0}</h2>
          </div>
        </div>


        <div className="stat-card">
          <FaUsers className="stat-icon" />

          <div>
            <span>Imported Members</span>
            <h2>{stats.importedMembers ?? 0}</h2>
          </div>
        </div>


        <div className="stat-card">
          <FaUsers className="stat-icon" />

          <div>
            <span>New Members</span>
            <h2>{stats.newMembers ?? 0}</h2>
          </div>
        </div>


        <div className="stat-card">
          <FaMoneyBillWave className="stat-icon" />

          <div>
            <span>Total Revenue</span>
            <h2>
              KES {Number(stats.totalRevenue ?? 0).toLocaleString()}
            </h2>
          </div>
        </div>


        <div className="stat-card">
          <FaChartLine className="stat-icon" />

          <div>
            <span>Payments</span>
            <h2>{stats.totalPayments ?? 0}</h2>
          </div>
        </div>


        <div className="stat-card">
          <FaCalendarAlt className="stat-icon" />

          <div>
            <span>Events</span>
            <h2>{stats.totalEvents ?? 0}</h2>
          </div>
        </div>

      </div>


      {/* ======================================
          DASHBOARD SECTIONS
      ======================================= */}

      <div className="dashboard-sections">

        {/* ====================================
            QUICK ACTIONS
        ===================================== */}

        <div className="dashboard-panel">

          <div className="panel-header">
            <h3>Quick Actions</h3>
          </div>

          <div className="quick-actions">

            <button
              className="quick-action"
              onClick={() =>
                navigate("/admin/members")
              }
            >
              <FaUserFriends />

              <span>
                Manage Members
              </span>

              <FaArrowRight />
            </button>


            <button
              className="quick-action"
              onClick={() =>
                navigate("/admin/payments")
              }
            >
              <FaMoneyBillWave />

              <span>
                Verify Payments
                {pendingMpesaCount > 0 && (
                  <strong className="quick-action-count">
                    {pendingMpesaCount}
                  </strong>
                )}
              </span>

              <FaArrowRight />
            </button>


            <button
              className="quick-action"
              onClick={() =>
                navigate("/admin/events")
              }
            >
              <FaCalendarAlt />

              <span>
                Manage Events
              </span>

              <FaArrowRight />
            </button>


            <button
              className="quick-action"
              onClick={() =>
                navigate("/admin/events/new")
              }
            >
              <FaPlusCircle />

              <span>
                Create Event
              </span>

              <FaArrowRight />
            </button>


            <button
              className="quick-action"
              onClick={() =>
                navigate("/admin/reports")
              }
            >
              <FaChartLine />

              <span>
                Reports
              </span>

              <FaArrowRight />
            </button>


            <button
              className="quick-action"
              onClick={() =>
                navigate("/admin/settings")
              }
            >
              <FaCog />

              <span>
                System Settings
              </span>

              <FaArrowRight />
            </button>

          </div>

        </div>


        {/* ====================================
            UPCOMING EVENTS
        ===================================== */}

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

                    <h4>
                      {event.title}
                    </h4>

                    <p>
                      📅{" "}
                      {new Date(
                        event.startDate
                      ).toLocaleDateString()}
                    </p>

                    <p>
                      {event.venue?.name || "N/A"}
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

              <p>
                No upcoming events.
              </p>

            </div>

          )}

        </div>


        {/* ====================================
            RECENT MEMBERS
        ===================================== */}

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
                      {member.firstName}{" "}
                      {member.lastName}
                    </h4>

                    <p>
                      {member.membershipType}
                    </p>

                    <small>
                      Joined{" "}
                      {new Date(
                        member.createdAt
                      ).toLocaleDateString()}
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

              <p>
                No members found.
              </p>

            </div>

          )}

        </div>


        {/* ====================================
            RECENT PAYMENTS
        ===================================== */}

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
                      {new Date(
                        payment.createdAt
                      ).toLocaleDateString()}
                    </small>

                  </div>


                  <div className="payment-right">

                    <strong>
                      KES{" "}
                      {Number(
                        payment.amount || 0
                      ).toLocaleString()}
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

              <p>
                No recent payments.
              </p>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;