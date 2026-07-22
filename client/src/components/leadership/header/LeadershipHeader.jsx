import {
  FaBell,
  FaBars,
  FaChevronLeft,
} from "react-icons/fa";

import { useDashboard } from "../../../context/DashboardContext";

import "./LeadershipHeader.css";

function LeadershipHeader({
  collapsed,
  setCollapsed,
  position,
  category,
}) {
  const {
    member,
    notifications = [],
  } = useDashboard();

  const unreadNotifications = notifications.filter(
    (notification) => !notification.read
  ).length;

  const greeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";

    return "Good Evening";
  };

  const formattedCategory = category
    ? category
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Leadership";

  return (
    <header className="leadership-header">
      {/* ==========================================
          LEFT
      ========================================== */}

      <div className="leadership-header-left">
        <button
          className="sidebar-toggle-button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={
            collapsed
              ? "Expand Sidebar"
              : "Collapse Sidebar"
          }
        >
          {collapsed ? (
            <FaBars />
          ) : (
            <FaChevronLeft />
          )}
        </button>

        <div className="leadership-header-title">
          <h1>
            {greeting()}
            {member?.firstName ? `, ${member.firstName}` : ""}
          </h1>

          <p>
            {position || "Leader"}
            {" • "}
            {formattedCategory}
          </p>
        </div>
      </div>

      {/* ==========================================
          RIGHT
      ========================================== */}

      <div className="leadership-header-right">
        <button
          className="leadership-notification-button"
          aria-label="Notifications"
        >
          <FaBell />

          {unreadNotifications > 0 && (
            <span className="notification-badge">
              {unreadNotifications}
            </span>
          )}
        </button>

        <div className="leadership-user">
          <img
            src={
              member?.profilePhoto ||
              "/default-avatar.png"
            }
            alt={
              member?.firstName || "Member"
            }
          />

          <div className="leadership-user-info">
            <strong>
              {[member?.firstName, member?.lastName]
                .filter(Boolean)
                .join(" ")}
            </strong>

            <small>
              {position || "Leader"}
            </small>
          </div>
        </div>
      </div>
    </header>
  );
}

export default LeadershipHeader;