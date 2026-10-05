import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaMoneyBillWave,
  FaSignOutAlt,
} from "react-icons/fa";

import FinanceSidebar from "./FinanceSidebar";

import "./FinanceLayout.css";


/* ==========================================================
   FINANCE LAYOUT
========================================================== */

const FinanceLayout = () => {

  const navigate = useNavigate();

  const location = useLocation();


  /* ========================================================
     LOGOUT
  ======================================================== */

  const handleLogout = () => {

    /*
     * Clear the authentication information used
     * by the JVP frontend.
     *
     * We support the common token names used
     * across the application.
     */

    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    /*
     * Redirect to login after logout.
     */

    navigate("/login", {
      replace: true,
    });

  };


  /* ========================================================
     PAGE TITLE
  ======================================================== */

  const getPageTitle = () => {

    if (location.pathname === "/finance") {
      return "Finance Dashboard";
    }

    if (
      location.pathname.startsWith(
        "/finance/payments/manual-mpesa"
      )
    ) {
      return "Manual M-Pesa Verification";
    }

    if (
      location.pathname.startsWith(
        "/finance/payments"
      )
    ) {
      return "Payment Records";
    }

    if (
      location.pathname.startsWith(
        "/finance/reports"
      )
    ) {
      return "Financial Reports";
    }

    return "Finance Workspace";

  };


  /* ========================================================
     RENDER
  ======================================================== */

  return (

    <div className="finance-layout">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <FinanceSidebar />


      {/* ==================================================
          MAIN AREA
      ================================================== */}

      <div className="finance-main">

        {/* ================================================
            TOPBAR
        ================================================= */}

        <header className="finance-topbar">

          <div className="finance-topbar-left">

            <div className="finance-topbar-icon">

              <FaMoneyBillWave />

            </div>

            <div>

              <span className="finance-topbar-label">
                JVP CONNECT
              </span>

              <h1>
                {getPageTitle()}
              </h1>

            </div>

          </div>


          {/* ==============================================
              TOPBAR RIGHT
          =============================================== */}

          <div className="finance-topbar-right">

            <div className="finance-role-badge">

              <span className="finance-role-dot" />

              Finance

            </div>


            <button
              type="button"
              className="finance-logout-button"
              onClick={handleLogout}
              title="Logout"
            >

              <FaSignOutAlt />

              <span>
                Logout
              </span>

            </button>

          </div>

        </header>


        {/* ================================================
            PAGE CONTENT
        ================================================= */}

        <main className="finance-page-content">

          <Outlet />

        </main>

      </div>

    </div>

  );

};


export default FinanceLayout;