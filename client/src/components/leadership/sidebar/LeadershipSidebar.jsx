import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaIdCard,
  FaUsers,
  FaCalendarAlt,
  FaBullhorn,
  FaClipboardList,
  FaFolderOpen,
  FaSitemap,
  FaChartBar,
  FaCog,
} from "react-icons/fa";

import "./LeadershipSidebar.css";

function LeadershipSidebar({
  collapsed = false,
  leadership,
  position,
  category,
}) {
  const menuItems = [
    {
      name: "Overview",
      icon: <FaHome />,
      path: "/workspace/leadership",
      end: true,
    },
    {
      name: "My Leadership Card",
      icon: <FaIdCard />,
      path: "/workspace/leadership/card",
    },
    {
      name: "Members",
      icon: <FaUsers />,
      path: "/workspace/leadership/members",
    },
    {
      name: "Meetings",
      icon: <FaCalendarAlt />,
      path: "/workspace/leadership/meetings",
    },
    {
      name: "Announcements",
      icon: <FaBullhorn />,
      path: "/workspace/leadership/announcements",
    },
    {
      name: "Reports",
      icon: <FaClipboardList />,
      path: "/workspace/leadership/reports",
    },
    {
      name: "Documents",
      icon: <FaFolderOpen />,
      path: "/workspace/leadership/documents",
    },
    {
      name: "Committees",
      icon: <FaSitemap />,
      path: "/workspace/leadership/committees",
    },
    {
      name: "Analytics",
      icon: <FaChartBar />,
      path: "/workspace/leadership/analytics",
    },
    {
      name: "Settings",
      icon: <FaCog />,
      path: "/workspace/leadership/settings",
    },
  ];

  return (
    <aside
      className={
        collapsed
          ? "leadership-sidebar collapsed"
          : "leadership-sidebar"
      }
    >
      {/* ==========================================
          BRAND
      ========================================== */}

      <div className="leadership-sidebar-brand">
        {!collapsed ? (
          <>
            <h2>Leadership</h2>
            <span>Workspace</span>
          </>
        ) : (
          <h2>LW</h2>
        )}
      </div>

      {/* ==========================================
          PROFILE
      ========================================== */}

      <div className="leadership-profile">
        <div className="leadership-avatar">
          {position?.charAt(0)?.toUpperCase() || "L"}
        </div>

        {!collapsed && (
          <div className="leadership-profile-info">
            <h4>{position || "Leader"}</h4>

            <p>
              {category
                ?.replace(/_/g, " ")
                ?.replace(/\b\w/g, (c) => c.toUpperCase()) ||
                "Leadership"}
            </p>
          </div>
        )}
      </div>

      {/* ==========================================
          NAVIGATION
      ========================================== */}

      <nav className="leadership-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              isActive
                ? "leadership-nav-link active"
                : "leadership-nav-link"
            }
          >
            <span className="leadership-nav-icon">
              {item.icon}
            </span>

            {!collapsed && (
              <span>{item.name}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default LeadershipSidebar;