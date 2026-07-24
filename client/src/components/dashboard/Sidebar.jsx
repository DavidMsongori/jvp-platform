import {
  LayoutDashboard,
  User,
  CreditCard,
  CalendarDays,
  GraduationCap,
  Bell,
  Settings,
  LogOut,
  Shield,
  X,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useDashboard } from "../../context/DashboardContext";

import "./Sidebar.css";

const Sidebar = ({
  open = false,
  onClose,
}) => {
  /* ==========================================
     CONTEXT
  ========================================== */

  const {
    logout,
  } = useAuth();

  const {
    leadership,
  } = useDashboard();

  /* ==========================================
     MENU
  ========================================== */

  const menu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "My Profile",
      icon: User,
      path: "/dashboard/profile",
    },
    {
      name: "Membership Card",
      icon: CreditCard,
      path: "/dashboard/membership-card",
    },
    {
      name: "Events",
      icon: CalendarDays,
      path: "/dashboard/events",
    },
    {
      name: "Programs",
      icon: GraduationCap,
      path: "/dashboard/programs",
    },
    {
      name: "Notifications",
      icon: Bell,
      path: "/dashboard/notifications",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/dashboard/settings",
    },
  ];

  /* ==========================================
     LEADERSHIP MENU
  ========================================== */

  if (leadership?.isLeader) {
    menu.splice(3, 0, {
      name: "Leadership",
      icon: Shield,
      path: "/workspace/leadership",
    });
  }

  /* ==========================================
     LOGOUT
  ========================================== */

  const handleLogout = async () => {
    onClose?.();

    await logout();
  };

  /* ==========================================
     COMPONENT
  ========================================== */

  return (
    <aside
      className={`member-sidebar ${
        open ? "mobile-open" : ""
      }`}
      aria-label="Member dashboard navigation"
    >

      {/* ======================================
          MOBILE CLOSE BUTTON
      ====================================== */}

      <button
        type="button"
        className="sidebar-mobile-close"
        onClick={onClose}
        aria-label="Close dashboard navigation"
      >
        <X size={24} />
      </button>

      {/* ======================================
          LOGO
      ====================================== */}

      <div className="sidebar-logo">

        <img
          src="/logo.png"
          alt="JVP Connect"
        />

        <div>
          <h3>JVP Connect</h3>

          <span>
            Member Dashboard
          </span>
        </div>

      </div>

      {/* ======================================
          MENU
      ====================================== */}

      <nav>

        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={
                item.path ===
                "/dashboard"
              }
              onClick={onClose}
              className={({
                isActive,
              }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >
              <Icon size={20} />

              <span>
                {item.name}
              </span>
            </NavLink>
          );
        })}

      </nav>

      {/* ======================================
          LOGOUT
      ====================================== */}

      <button
        type="button"
        className="logout-btn"
        onClick={handleLogout}
      >
        <LogOut size={18} />

        <span>
          Logout
        </span>
      </button>

    </aside>
  );
};

export default Sidebar;