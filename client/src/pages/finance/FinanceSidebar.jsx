import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  FaTachometerAlt,
  FaMoneyBillWave,
  FaMobileAlt,
  FaChartLine,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaShieldAlt,
} from "react-icons/fa";

import {
  useState,
} from "react";

import "./FinanceSidebar.css";


/* ==========================================================
   FINANCE SIDEBAR
========================================================== */

const FinanceSidebar = () => {

  const location = useLocation();

  const [collapsed, setCollapsed] =
    useState(false);


  /* ========================================================
     NAVIGATION ITEMS
  ======================================================== */

  const navigation = [

    {
      label: "Dashboard",
      path: "/finance",
      icon: FaTachometerAlt,
      end: true,
    },

    {
      label: "Payment Records",
      path: "/finance/payments",
      icon: FaMoneyBillWave,
    },

    {
      label: "M-Pesa Verification",
      path: "/finance/payments/manual-mpesa",
      icon: FaMobileAlt,
    },

    {
      label: "Financial Reports",
      path: "/finance/reports",
      icon: FaChartLine,
    },

  ];


  /* ========================================================
     ACTIVE STATE
  ======================================================== */

  const isActive = (item) => {

    if (item.end) {
      return location.pathname === item.path;
    }

    return location.pathname.startsWith(
      item.path
    );

  };


  /* ========================================================
     RENDER
  ======================================================== */

  return (

    <aside
      className={`finance-sidebar ${
        collapsed
          ? "finance-sidebar-collapsed"
          : ""
      }`}
    >

      {/* ==================================================
          BRAND
      ================================================== */}

      <div className="finance-sidebar-brand">

        <div className="finance-brand-mark">

          <FaMoneyBillWave />

        </div>


        {!collapsed && (

          <div className="finance-brand-text">

            <strong>
              JVP CONNECT
            </strong>

            <span>
              FINANCE
            </span>

          </div>

        )}

      </div>


      {/* ==================================================
          NAVIGATION
      ================================================== */}

      <nav className="finance-sidebar-nav">

        <div className="finance-nav-section">

          {!collapsed && (

            <span className="finance-nav-heading">
              FINANCE
            </span>

          )}


          {navigation.map((item) => {

            const Icon = item.icon;

            const active =
              isActive(item);


            return (

              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={
                  `finance-nav-link ${
                    active
                      ? "active"
                      : ""
                  }`
                }
                title={
                  collapsed
                    ? item.label
                    : undefined
                }
              >

                <span className="finance-nav-icon">

                  <Icon />

                </span>


                {!collapsed && (

                  <span className="finance-nav-label">

                    {item.label}

                  </span>

                )}

              </NavLink>

            );

          })}

        </div>


        {/* ==================================================
            INFORMATION
        ================================================== */}

        {!collapsed && (

          <div className="finance-sidebar-information">

            <div className="finance-information-icon">

              <FaShieldAlt />

            </div>

            <div>

              <strong>
                Finance Workspace
              </strong>

              <p>
                Authorized financial
                operations only.
              </p>

            </div>

          </div>

        )}

      </nav>


      {/* ==================================================
          BOTTOM ACTIONS
      ================================================== */}

      <div className="finance-sidebar-bottom">

        {/* ================================================
            BACK TO MEMBER AREA
        ================================================= */}

        <NavLink
          to="/dashboard"
          className="finance-back-link"
          title={
            collapsed
              ? "Back to Member Area"
              : undefined
          }
        >

          <FaArrowLeft />

          {!collapsed && (

            <span>
              Member Area
            </span>

          )}

        </NavLink>


        {/* ================================================
            COLLAPSE BUTTON
        ================================================= */}

        <button
          type="button"
          className="finance-collapse-button"
          onClick={() =>
            setCollapsed(
              (value) => !value
            )
          }
          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >

          {collapsed ? (
            <FaChevronRight />
          ) : (
            <FaChevronLeft />
          )}

          {!collapsed && (

            <span>
              Collapse
            </span>

          )}

        </button>

      </div>

    </aside>

  );

};


export default FinanceSidebar;