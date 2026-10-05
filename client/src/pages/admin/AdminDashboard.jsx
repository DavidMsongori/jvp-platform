import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaArrowRight,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaCog,
  FaExclamationCircle,
  FaMoneyBillWave,
  FaPlus,
  FaReceipt,
  FaSyncAlt,
  FaUserFriends,
  FaUsers,
  FaUserPlus,
  FaDatabase,
} from "react-icons/fa";

import {
  getDashboard,
  getManualMpesaQueue,
} from "../../services/admin.service";

import "./Dashboard.css";

/* ==========================================================
   HELPERS
========================================================== */

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString("en-KE");

const formatCurrency = (value) =>
  `KES ${Number(value ?? 0).toLocaleString("en-KE")}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (firstName = "", lastName = "") => {
  const first = firstName?.trim()?.charAt(0) || "";
  const last = lastName?.trim()?.charAt(0) || "";

  return `${first}${last}`.toUpperCase() || "M";
};

const getMembershipLabel = (type) => {
  if (!type) return "Member";

  return String(type)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getPaymentMethodLabel = (method) => {
  if (!method) return "Payment";

  return String(method)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getStatusClass = (status = "") => {
  const normalized = String(status).toLowerCase();

  if (
    normalized === "successful" ||
    normalized === "active" ||
    normalized === "approved"
  ) {
    return "status-success";
  }

  if (
    normalized === "pending" ||
    normalized === "submitted" ||
    normalized === "processing"
  ) {
    return "status-warning";
  }

  if (
    normalized === "failed" ||
    normalized === "cancelled" ||
    normalized === "expired" ||
    normalized === "rejected"
  ) {
    return "status-danger";
  }

  return "status-neutral";
};

/* ==========================================================
   COMPONENT
========================================================== */

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);

  const [pendingMpesaCount, setPendingMpesaCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* ========================================================
     DASHBOARD DATA
  ======================================================== */

  const stats = dashboard?.statistics || {};

  const upcomingEvents = Array.isArray(dashboard?.upcomingEvents)
    ? dashboard.upcomingEvents
    : [];

  const recentMembers = Array.isArray(dashboard?.recentMembers)
    ? dashboard.recentMembers
    : [];

  const recentPayments = Array.isArray(dashboard?.recentPayments)
    ? dashboard.recentPayments
    : [];

  /* ========================================================
     LOAD DASHBOARD
  ======================================================== */

  const loadDashboard = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getDashboard();

      const data = response?.data || response;

      setDashboard(data || {});
    } catch (err) {
      console.error("Unable to load admin dashboard:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ========================================================
     LOAD MANUAL M-PESA QUEUE
  ======================================================== */

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

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    loadDashboard();
    loadPendingMpesaQueue();
  }, []);

  /* ========================================================
     REFRESH
  ======================================================== */

  const handleRefresh = async () => {
    await Promise.all([
      loadDashboard(true),
      loadPendingMpesaQueue(),
    ]);
  };

  /* ========================================================
     DERIVED DATA
  ======================================================== */

  const memberActivationRate = useMemo(() => {
    const total = Number(stats.totalMembers ?? 0);
    const activated = Number(stats.activatedMembers ?? 0);

    if (!total) return 0;

    return Math.min(
      100,
      Math.round((activated / total) * 100)
    );
  }, [stats.totalMembers, stats.activatedMembers]);

  const membershipBreakdown = useMemo(
    () => [
      {
        label: "New Members",
        value: Number(stats.newMembers ?? 0),
        icon: FaUserPlus,
        className: "breakdown-new",
      },
      {
        label: "Imported Members",
        value: Number(stats.importedMembers ?? 0),
        icon: FaDatabase,
        className: "breakdown-imported",
      },
      {
        label: "Activated Members",
        value: Number(stats.activatedMembers ?? 0),
        icon: FaCheckCircle,
        className: "breakdown-active",
      },
    ],
    [
      stats.newMembers,
      stats.importedMembers,
      stats.activatedMembers,
    ]
  );

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <div className="admin-dashboard dashboard-page">
        <div className="dashboard-loading-screen">
          <div className="dashboard-loading-brand">
            <div className="loading-logo">
              JVP
            </div>

            <div>
              <strong>JVP Connect</strong>
              <span>Admin Dashboard</span>
            </div>
          </div>

          <div className="dashboard-skeleton-grid">
            <div className="dashboard-skeleton skeleton-wide" />
            <div className="dashboard-skeleton" />
            <div className="dashboard-skeleton" />
            <div className="dashboard-skeleton" />
            <div className="dashboard-skeleton" />
          </div>

          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  /* ========================================================
     ERROR
  ======================================================== */

  if (error) {
    return (
      <div className="admin-dashboard dashboard-page">
        <div className="dashboard-error-state">
          <div className="dashboard-error-icon">
            <FaExclamationCircle />
          </div>

          <h2>Dashboard unavailable</h2>

          <p>{error}</p>

          <button
            type="button"
            className="primary-dashboard-btn"
            onClick={() => loadDashboard()}
          >
            <FaSyncAlt />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="admin-dashboard dashboard-page">

      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <header className="dashboard-topbar">

        <div className="dashboard-heading">

          <div className="dashboard-eyebrow">
            <span className="eyebrow-dot" />
            JVP CONNECT ADMINISTRATION
          </div>

          <h1>Dashboard</h1>

          <p>
            Monitor membership, payments, events and
            organizational activity from one place.
          </p>

        </div>

        <div className="dashboard-header-actions">

          <button
            type="button"
            className="dashboard-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSyncAlt
              className={refreshing ? "spin-icon" : ""}
            />

            <span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>

        </div>

      </header>

      {/* ======================================================
          PRIMARY KPI CARDS
      ======================================================= */}

      <section className="primary-kpi-grid">

        <div className="kpi-card kpi-members">

          <div className="kpi-card-top">
            <div className="kpi-icon">
              <FaUsers />
            </div>

            <span className="kpi-label">
              Total Members
            </span>
          </div>

          <div className="kpi-value">
            {formatNumber(stats.totalMembers)}
          </div>

          <div className="kpi-footer">
            <span>
              Registered in JVP Connect
            </span>
          </div>

        </div>

        <div className="kpi-card kpi-active">

          <div className="kpi-card-top">
            <div className="kpi-icon">
              <FaCheckCircle />
            </div>

            <span className="kpi-label">
              Active Members
            </span>
          </div>

          <div className="kpi-value">
            {formatNumber(stats.activatedMembers)}
          </div>

          <div className="kpi-progress-row">
            <div className="kpi-progress">
              <span
                style={{
                  width: `${memberActivationRate}%`,
                }}
              />
            </div>

            <strong>
              {memberActivationRate}%
            </strong>
          </div>

        </div>

        <div className="kpi-card kpi-revenue">

          <div className="kpi-card-top">
            <div className="kpi-icon">
              <FaMoneyBillWave />
            </div>

            <span className="kpi-label">
              Total Revenue
            </span>
          </div>

          <div className="kpi-value currency-value">
            {formatCurrency(stats.totalRevenue)}
          </div>

          <div className="kpi-footer">
            <span>
              Successful payments
            </span>
          </div>

        </div>

        <div className="kpi-card kpi-payments">

          <div className="kpi-card-top">
            <div className="kpi-icon">
              <FaReceipt />
            </div>

            <span className="kpi-label">
              Total Payments
            </span>
          </div>

          <div className="kpi-value">
            {formatNumber(stats.totalPayments)}
          </div>

          <div className="kpi-footer">
            <span>
              Recorded transactions
            </span>
          </div>

        </div>

      </section>

      {/* ======================================================
          PAYMENT VERIFICATION
      ======================================================= */}

      {!queueLoading && pendingMpesaCount > 0 && (
        <section className="payment-alert">

          <div className="payment-alert-leading">
            <div className="payment-alert-icon">
              <FaExclamationCircle />
            </div>

            <div className="payment-alert-copy">

              <div className="payment-alert-title">
                Payment verification required
              </div>

              <p>
                <strong>{pendingMpesaCount}</strong>{" "}
                manual M-Pesa payment
                {pendingMpesaCount !== 1 ? "s" : ""}{" "}
                {pendingMpesaCount === 1 ? "is" : "are"}{" "}
                awaiting Finance verification.
              </p>

            </div>
          </div>

          <button
            type="button"
            className="payment-alert-btn"
            onClick={() =>
              navigate("/finance/payments")
            }
          >
            Review Payments
            <FaArrowRight />
          </button>

        </section>
      )}

      {!queueLoading && pendingMpesaCount === 0 && (
        <section className="payment-clear">

          <div className="payment-clear-icon">
            <FaCheckCircle />
          </div>

          <div className="payment-clear-copy">
            <strong>
              Payment verification queue is clear
            </strong>

            <span>
              No manual M-Pesa payments are awaiting
              verification.
            </span>
          </div>

          <button
            type="button"
            className="icon-refresh-btn"
            onClick={loadPendingMpesaQueue}
            title="Refresh payment queue"
          >
            <FaSyncAlt />
          </button>

        </section>
      )}

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <div className="dashboard-main-grid">

        {/* ====================================================
            QUICK ACTIONS
        ===================================================== */}

        <section className="dashboard-card quick-actions-card">

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                ACTION CENTER
              </span>

              <h2>Quick Actions</h2>

              <p>
                Frequently used administration tools.
              </p>
            </div>

          </div>

          <div className="quick-actions-grid">

            <button
              type="button"
              className="quick-action-item"
              onClick={() =>
                navigate("/admin/members")
              }
            >
              <span className="quick-action-icon">
                <FaUsers />
              </span>

              <span className="quick-action-content">
                <strong>Manage Members</strong>
                <small>
                  View and manage membership records
                </small>
              </span>

              <FaArrowRight className="quick-action-arrow" />
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() =>
                navigate("/finance/payments")
              }
            >
              <span className="quick-action-icon">
                <FaMoneyBillWave />
              </span>

              <span className="quick-action-content">
                <strong>Verify Payments</strong>
                <small>
                  Review member payment submissions
                </small>
              </span>

              {pendingMpesaCount > 0 && (
                <span className="quick-action-badge">
                  {pendingMpesaCount}
                </span>
              )}

              <FaArrowRight className="quick-action-arrow" />
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() =>
                navigate("/admin/events")
              }
            >
              <span className="quick-action-icon">
                <FaCalendarAlt />
              </span>

              <span className="quick-action-content">
                <strong>Manage Events</strong>
                <small>
                  View and organize JVP events
                </small>
              </span>

              <FaArrowRight className="quick-action-arrow" />
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() =>
                navigate("/admin/events/new")
              }
            >
              <span className="quick-action-icon">
                <FaPlus />
              </span>

              <span className="quick-action-content">
                <strong>Create Event</strong>
                <small>
                  Add a new event to JVP Connect
                </small>
              </span>

              <FaArrowRight className="quick-action-arrow" />
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() =>
                navigate("/admin/reports")
              }
            >
              <span className="quick-action-icon">
                <FaChartLine />
              </span>

              <span className="quick-action-content">
                <strong>Reports</strong>
                <small>
                  Review organizational reports
                </small>
              </span>

              <FaArrowRight className="quick-action-arrow" />
            </button>

            <button
              type="button"
              className="quick-action-item"
              onClick={() =>
                navigate("/admin/settings")
              }
            >
              <span className="quick-action-icon">
                <FaCog />
              </span>

              <span className="quick-action-content">
                <strong>System Settings</strong>
                <small>
                  Configure JVP Connect
                </small>
              </span>

              <FaArrowRight className="quick-action-arrow" />
            </button>

          </div>

        </section>

        {/* ====================================================
            MEMBERSHIP OVERVIEW
        ===================================================== */}

        <section className="dashboard-card membership-overview-card">

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                MEMBERSHIP
              </span>

              <h2>Membership Overview</h2>

              <p>
                Current membership activity.
              </p>
            </div>

            <button
              type="button"
              className="text-action"
              onClick={() =>
                navigate("/admin/members")
              }
            >
              View all
              <FaArrowRight />
            </button>

          </div>

          <div className="membership-summary">

            <div className="membership-total">
              <span>Total Members</span>

              <strong>
                {formatNumber(stats.totalMembers)}
              </strong>

              <small>
                {memberActivationRate}% activated
              </small>
            </div>

            <div className="membership-progress-large">
              <span
                style={{
                  width: `${memberActivationRate}%`,
                }}
              />
            </div>

          </div>

          <div className="membership-breakdown">

            {membershipBreakdown.map(
              ({
                label,
                value,
                icon: Icon,
                className,
              }) => (
                <div
                  className={`membership-breakdown-item ${className}`}
                  key={label}
                >
                  <div className="breakdown-icon">
                    <Icon />
                  </div>

                  <div>
                    <strong>
                      {formatNumber(value)}
                    </strong>

                    <span>{label}</span>
                  </div>
                </div>
              )
            )}

          </div>

        </section>

      </div>

      {/* ======================================================
          SECONDARY CONTENT
      ======================================================= */}

      <div className="dashboard-secondary-grid">

        {/* ====================================================
            UPCOMING EVENTS
        ===================================================== */}

        <section className="dashboard-card content-card">

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                CALENDAR
              </span>

              <h2>Upcoming Events</h2>

              <p>
                Your next scheduled activities.
              </p>
            </div>

            <button
              type="button"
              className="text-action"
              onClick={() =>
                navigate("/admin/events")
              }
            >
              View all
              <FaArrowRight />
            </button>

          </div>

          {upcomingEvents.length > 0 ? (
            <div className="event-list">

              {upcomingEvents
                .slice(0, 5)
                .map((event) => (
                  <div
                    className="event-row"
                    key={event._id}
                  >

                    <div className="event-date-box">
                      <FaCalendarAlt />
                    </div>

                    <div className="event-row-content">

                      <strong>
                        {event.title ||
                          "Untitled Event"}
                      </strong>

                      <span>
                        {formatDate(
                          event.startDate
                        )}
                        {event.venue?.name
                          ? ` • ${event.venue.name}`
                          : ""}
                      </span>

                    </div>

                    <span
                      className={`status-pill ${getStatusClass(
                        event.status
                      )}`}
                    >
                      {event.status ||
                        "Scheduled"}
                    </span>

                  </div>
                ))}

            </div>
          ) : (
            <div className="empty-state">

              <div className="empty-state-icon">
                <FaCalendarAlt />
              </div>

              <strong>
                No upcoming events
              </strong>

              <span>
                Scheduled events will appear here.
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/events/new")
                }
              >
                <FaPlus />
                Create Event
              </button>

            </div>
          )}

        </section>

        {/* ====================================================
            RECENT PAYMENTS
        ===================================================== */}

        <section className="dashboard-card content-card">

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                FINANCE
              </span>

              <h2>Recent Payments</h2>

              <p>
                Latest payment activity.
              </p>
            </div>

            <button
              type="button"
              className="text-action"
              onClick={() =>
                navigate("/finance/payments")
              }
            >
              View all
              <FaArrowRight />
            </button>

          </div>

          {recentPayments.length > 0 ? (
            <div className="payment-list">

              {recentPayments
                .slice(0, 5)
                .map((payment) => (
                  <div
                    className="payment-row"
                    key={payment._id}
                  >

                    <div className="payment-method-icon">
                      <FaMoneyBillWave />
                    </div>

                    <div className="payment-row-content">

                      <strong>
                        {payment.member
                          ? `${payment.member.firstName || ""} ${
                              payment.member.lastName || ""
                            }`.trim()
                          : "Unknown Member"}
                      </strong>

                      <span>
                        {getPaymentMethodLabel(
                          payment.paymentMethod
                        )}
                        {" • "}
                        {formatDateTime(
                          payment.createdAt
                        )}
                      </span>

                    </div>

                    <div className="payment-row-right">

                      <strong>
                        {formatCurrency(
                          payment.amount
                        )}
                      </strong>

                      <span
                        className={`status-pill ${getStatusClass(
                          payment.status
                        )}`}
                      >
                        {payment.status ||
                          "Unknown"}
                      </span>

                    </div>

                  </div>
                ))}

            </div>
          ) : (
            <div className="empty-state">

              <div className="empty-state-icon">
                <FaMoneyBillWave />
              </div>

              <strong>
                No recent payments
              </strong>

              <span>
                Payment activity will appear here.
              </span>

            </div>
          )}

        </section>

      </div>

      {/* ======================================================
          RECENT MEMBERS
      ======================================================= */}

      <section className="dashboard-card recent-members-card">

        <div className="section-heading">

          <div>
            <span className="section-kicker">
              MEMBERSHIP ACTIVITY
            </span>

            <h2>Recently Registered Members</h2>

            <p>
              The latest members added to JVP Connect.
            </p>
          </div>

          <button
            type="button"
            className="text-action"
            onClick={() =>
              navigate("/admin/members")
            }
          >
            Manage Members
            <FaArrowRight />
          </button>

        </div>

        {recentMembers.length > 0 ? (
          <div className="members-table-wrapper">

            <table className="members-table">

              <thead>
                <tr>
                  <th>Member</th>
                  <th>Membership</th>
                  <th>Location</th>
                  <th>Source</th>
                  <th>Account</th>
                  <th>Joined</th>
                </tr>
              </thead>

              <tbody>

                {recentMembers
                  .slice(0, 8)
                  .map((member) => {

                    const fullName =
                      `${member.firstName || ""} ${
                        member.middleName || ""
                      } ${
                        member.lastName || ""
                      }`
                        .replace(/\s+/g, " ")
                        .trim();

                    return (
                      <tr key={member._id}>

                        <td>
                          <div className="table-member">

                            {member.profilePhoto ? (
                              <img
                                src={
                                  member.profilePhoto
                                }
                                alt={fullName}
                              />
                            ) : (
                              <div className="table-member-avatar">
                                {getInitials(
                                  member.firstName,
                                  member.lastName
                                )}
                              </div>
                            )}

                            <div>
                              <strong>
                                {fullName ||
                                  "Unnamed Member"}
                              </strong>

                              <span>
                                {member.memberNumber ||
                                  "No member number"}
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="membership-type">
                            {getMembershipLabel(
                              member.membershipType
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="location-cell">
                            <strong>
                              {member.county ||
                                "—"}
                            </strong>

                            {member.ward && (
                              <span>
                                {member.ward}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`source-badge ${
                              member.source ===
                              "imported"
                                ? "source-imported"
                                : "source-new"
                            }`}
                          >
                            {member.source ===
                            "imported"
                              ? "Imported"
                              : "New"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-pill ${
                              member.accountActivated
                                ? "status-success"
                                : "status-warning"
                            }`}
                          >
                            {member.accountActivated
                              ? "Activated"
                              : "Pending"}
                          </span>
                        </td>

                        <td>
                          <span className="table-date">
                            {formatDate(
                              member.createdAt
                            )}
                          </span>
                        </td>

                      </tr>
                    );
                  })}

              </tbody>

            </table>

          </div>
        ) : (
          <div className="empty-state members-empty">

            <div className="empty-state-icon">
              <FaUsers />
            </div>

            <strong>
              No members found
            </strong>

            <span>
              Recently registered members will
              appear here.
            </span>

          </div>
        )}

      </section>

      {/* ======================================================
          FOOTER STATUS
      ======================================================= */}

      <footer className="dashboard-footer">

        <div className="system-status">

          <span className="system-status-dot" />

          <span>
            JVP Connect is operational
          </span>

        </div>

        <div className="dashboard-footer-links">

          <button
            type="button"
            onClick={() =>
              navigate("/admin/settings")
            }
          >
            <FaCog />
            Settings
          </button>

          <span>
            Last refreshed{" "}
            {new Date().toLocaleTimeString(
              "en-KE",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </span>

        </div>

      </footer>

    </div>
  );
}

export default AdminDashboard;