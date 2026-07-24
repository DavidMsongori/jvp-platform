import {
  useEffect,
  useState,
} from "react";

import {
  Menu,
} from "lucide-react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import { DashboardProvider } from "../context/DashboardContext";
import { DashboardUIProvider } from "../context/DashboardUIContext";
import { ProfileProvider } from "../context/ProfileContext";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import "./DashboardLayout.css";

const DashboardLayout = () => {
  const location = useLocation();

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  /* ==========================================================
     CLOSE SIDEBAR AFTER NAVIGATION
  ========================================================== */

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  /* ==========================================================
     PREVENT BODY SCROLL WHEN MOBILE MENU IS OPEN
  ========================================================== */

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.overflow = "";

      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <DashboardUIProvider>
      <DashboardProvider>
        <ProfileProvider>

          <div className="dashboard-layout">

            {/* ================================================
                MOBILE OVERLAY
            ================================================ */}

            {sidebarOpen && (
              <button
                type="button"
                className="dashboard-sidebar-overlay"
                onClick={() =>
                  setSidebarOpen(false)
                }
                aria-label="Close dashboard navigation"
              />
            )}

            {/* ================================================
                SIDEBAR
            ================================================ */}

            <Sidebar
              open={sidebarOpen}
              onClose={() =>
                setSidebarOpen(false)
              }
            />

            {/* ================================================
                MAIN
            ================================================ */}

            <div className="dashboard-main">

              {/* MOBILE HAMBURGER */}

              <button
                type="button"
                className="dashboard-mobile-menu"
                onClick={() =>
                  setSidebarOpen(true)
                }
                aria-label="Open dashboard navigation"
                aria-expanded={sidebarOpen}
              >
                <Menu size={25} />
              </button>

              <Topbar />

              <main className="dashboard-content">
                <Outlet />
              </main>

            </div>

          </div>

        </ProfileProvider>
      </DashboardProvider>
    </DashboardUIProvider>
  );
};

export default DashboardLayout;