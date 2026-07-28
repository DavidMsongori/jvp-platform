import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  FaChartPie,
  FaUsers,
  FaUserTie,
  FaMoneyBillWave,
  FaTicketAlt,
  FaCalendarAlt,
  FaClipboardList,
  FaHistory,
  FaCog,
  FaUserCircle,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";

import { PERMISSIONS } from "../../utils/permissions";

import "./Sidebar.css";

function AdminSidebar({

  isOpen,

  onClose,

}) {

  const {

    hasPermission,

    logout,

  } = useAuth();

  /* ==========================================
     MENU
  ========================================== */

  const menuItems = [

    {
      name: "Dashboard",
      icon: <FaChartPie />,
      path: "/admin",
      permission: PERMISSIONS.VIEW_REPORTS,
    },

    {
      name: "Members",
      icon: <FaUsers />,
      path: "/admin/members",
      permission: PERMISSIONS.VIEW_MEMBERS,
    },

    {
      name: "Leadership",
      icon: <FaUserTie />,
      path: "/admin/leadership",
      permission: PERMISSIONS.VIEW_MEMBERS,
    },

    {
      name: "Payments",
      icon: <FaMoneyBillWave />,
      path: "/admin/payments",
      permission: PERMISSIONS.VIEW_PAYMENTS,
    },

    {
      name: "Events",
      icon: <FaCalendarAlt />,
      path: "/admin/events",
      permission: PERMISSIONS.VIEW_EVENTS,
    },

   {
  name: "Summit",
  icon: <FaTicketAlt />,
  path: "/admin/summit",
  permission: PERMISSIONS.VIEW_EVENTS,
},

    {
      name: "Reports",
      icon: <FaClipboardList />,
      path: "/admin/reports",
      permission: PERMISSIONS.VIEW_REPORTS,
    },

    {
      name: "Activity Logs",
      icon: <FaHistory />,
      path: "/admin/activity-logs",
      permission: PERMISSIONS.VIEW_REPORTS,
    },

    {
      name: "Settings",
      icon: <FaCog />,
      path: "/admin/settings",
      permission: PERMISSIONS.MANAGE_SETTINGS,
    },

    {
      name: "Profile",
      icon: <FaUserCircle />,
      path: "/admin/profile",
      permission: null,
    },

  ];

  /* ==========================================
     LOGOUT
  ========================================== */

  const handleLogout = async () => {

    await logout();

  };

  return (

    <aside
      className={`sidebar ${
        isOpen ? "open" : ""
      }`}
    >

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="sidebar-header">

        <div>

          <h2>JVP Connect</h2>

          <span>Admin Panel</span>

        </div>

        <button
          className="close-btn"
          onClick={onClose}
        >

          <FaTimes />

        </button>

      </div>

      {/* ======================================
          NAVIGATION
      ======================================= */}

      <nav className="sidebar-nav">

        {menuItems

          .filter((item) => {

            if (!item.permission) {

              return true;

            }

            return hasPermission(
              item.permission
            );

          })

          .map((item) => (

            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
              onClick={onClose}
            >

              <span className="sidebar-icon">

                {item.icon}

              </span>

              <span>

                {item.name}

              </span>

            </NavLink>

          ))}

      </nav>

      {/* ======================================
          FOOTER
      ======================================= */}

      <div className="sidebar-footer">

        <button
          className="logout-btn"
          onClick={handleLogout}
        >

          <FaSignOutAlt />

          <span>

            Logout

          </span>

        </button>

      </div>

    </aside>

  );

}

export default AdminSidebar;