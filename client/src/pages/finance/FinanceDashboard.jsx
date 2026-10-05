import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaMoneyBillWave,
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaMobileAlt,
  FaChartLine,
  FaSyncAlt,
  FaArrowRight,
  FaFileInvoiceDollar,
  FaExclamationTriangle,
  FaClipboardList,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./FinanceDashboard.css";


/* ==========================================================
   HELPERS
========================================================== */

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};


const formatNumber = (value) => {
  return new Intl.NumberFormat("en-KE").format(
    Number(value || 0)
  );
};


/* ==========================================================
   COMPONENT
========================================================== */

const FinanceDashboard = () => {

  const navigate = useNavigate();


  /* ========================================================
     STATE
  ======================================================== */

  const [statistics, setStatistics] = useState(null);

  const [manualMpesa, setManualMpesa] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");


  /* ========================================================
     LOAD FINANCE DATA
  ======================================================== */

  const loadDashboard = useCallback(
    async (refresh = false) => {

      try {

        setError("");

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }


        /* ----------------------------------------------
           PAYMENT STATISTICS
        ---------------------------------------------- */

        const statisticsRequest =
          api.get(
            "/payments/admin/statistics"
          );


        /* ----------------------------------------------
           MANUAL M-PESA QUEUE
        ---------------------------------------------- */

        const manualMpesaRequest =
          api.get(
            "/payments/admin/manual-mpesa",
            {
              params: {
                page: 1,
                limit: 5,
              },
            }
          );


        const [
          statisticsResponse,
          manualMpesaResponse,
        ] = await Promise.all([
          statisticsRequest,
          manualMpesaRequest,
        ]);


        /* ----------------------------------------------
           STATISTICS RESPONSE
        ---------------------------------------------- */

        const statisticsData =
          statisticsResponse?.data?.data ||
          statisticsResponse?.data ||
          {};


        /* ----------------------------------------------
           MANUAL M-PESA RESPONSE
        ---------------------------------------------- */

        const manualMpesaData =
          manualMpesaResponse?.data?.data ||
          manualMpesaResponse?.data ||
          {};


        setStatistics(
          statisticsData
        );

        setManualMpesa(
          manualMpesaData
        );

      } catch (err) {

        console.error(
          "Finance Dashboard error:",
          err
        );


        const status =
          err?.response?.status;


        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load Finance Dashboard.";


        if (status === 401) {

          setError(
            "Your session has expired. Please log in again."
          );

        } else if (status === 403) {

          setError(
            "Your Finance account does not have permission to access this financial information."
          );

        } else {

          setError(message);

        }

      } finally {

        setLoading(false);

        setRefreshing(false);

      }

    },
    []
  );


  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {

    loadDashboard();

  }, [loadDashboard]);


  /* ========================================================
     NORMALIZE STATISTICS
  ======================================================== */

  const stats = useMemo(() => {

    const source =
      statistics || {};


    /*
     * We support several possible names because
     * the payment service may expose statistics
     * using slightly different property names.
     */

    const successful =
      Number(
        source.successfulPayments ??
        source.successful ??
        source.completedPayments ??
        source.completed ??
        0
      );


    const pending =
      Number(
        source.pendingPayments ??
        source.pending ??
        0
      );


    const failed =
      Number(
        source.failedPayments ??
        source.failed ??
        0
      );


    const total =
      Number(
        source.totalPayments ??
        source.total ??
        successful +
          pending +
          failed
      );


    const revenue =
      Number(
        source.totalRevenue ??
        source.revenue ??
        source.successfulRevenue ??
        source.totalAmount ??
        0
      );


    return {

      totalPayments: total,

      successfulPayments:
        successful,

      pendingPayments:
        pending,

      failedPayments:
        failed,

      totalRevenue:
        revenue,

    };

  }, [statistics]);


  /* ========================================================
     MANUAL M-PESA COUNT
  ======================================================== */

  const manualMpesaCount =
    useMemo(() => {

      const source =
        manualMpesa || {};


      return Number(
        source.total ??
        source.totalCount ??
        source.count ??
        source.pagination?.total ??
        source.meta?.total ??
        0
      );

    }, [manualMpesa]);


  /* ========================================================
     PAYMENT SUCCESS RATE
  ======================================================== */

  const successRate =
    useMemo(() => {

      if (!stats.totalPayments) {
        return 0;
      }

      return Math.round(
        (
          stats.successfulPayments /
          stats.totalPayments
        ) * 100
      );

    }, [stats]);


  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {

    return (
      <div className="finance-dashboard">

        <div className="finance-loading">

          <FaSyncAlt className="finance-spin" />

          <h2>
            Loading Finance Dashboard
          </h2>

          <p>
            Preparing financial information...
          </p>

        </div>

      </div>
    );

  }


  /* ========================================================
     ERROR
  ======================================================== */

  if (error) {

    return (
      <div className="finance-dashboard">

        <div className="finance-error">

          <FaExclamationTriangle />

          <div>

            <h2>
              Finance Dashboard
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadDashboard(true)
              }
              className="finance-retry-button"
            >
              <FaSyncAlt />

              Try Again

            </button>

          </div>

        </div>

      </div>
    );

  }


  /* ========================================================
     DASHBOARD
  ======================================================== */

  return (

    <div className="finance-dashboard">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="finance-header">

        <div>

          <span className="finance-kicker">
            JVP CONNECT • FINANCE
          </span>

          <h1>
            Finance Dashboard
          </h1>

          <p>
            Monitor membership payments,
            revenue and financial operations.
          </p>

        </div>


        <button
          type="button"
          className="finance-refresh-button"
          onClick={() =>
            loadDashboard(true)
          }
          disabled={refreshing}
        >

          <FaSyncAlt
            className={
              refreshing
                ? "finance-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>


      {/* ==================================================
          STATISTICS
      ================================================== */}

      <div className="finance-stat-grid">


        {/* REVENUE */}

        <div className="finance-stat-card revenue">

          <div className="finance-stat-icon">
            <FaMoneyBillWave />
          </div>

          <div>

            <span>
              Total Revenue
            </span>

            <strong>
              {formatCurrency(
                stats.totalRevenue
              )}
            </strong>

            <small>
              Successful transactions
            </small>

          </div>

        </div>


        {/* SUCCESSFUL */}

        <div className="finance-stat-card successful">

          <div className="finance-stat-icon">
            <FaCheckCircle />
          </div>

          <div>

            <span>
              Successful Payments
            </span>

            <strong>
              {formatNumber(
                stats.successfulPayments
              )}
            </strong>

            <small>
              {successRate}% success rate
            </small>

          </div>

        </div>


        {/* PENDING */}

        <div className="finance-stat-card pending">

          <div className="finance-stat-icon">
            <FaClock />
          </div>

          <div>

            <span>
              Pending Payments
            </span>

            <strong>
              {formatNumber(
                stats.pendingPayments
              )}
            </strong>

            <small>
              Awaiting processing
            </small>

          </div>

        </div>


        {/* FAILED */}

        <div className="finance-stat-card failed">

          <div className="finance-stat-icon">
            <FaTimesCircle />
          </div>

          <div>

            <span>
              Failed Payments
            </span>

            <strong>
              {formatNumber(
                stats.failedPayments
              )}
            </strong>

            <small>
              Unsuccessful transactions
            </small>

          </div>

        </div>

      </div>


      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="finance-content-grid">


        {/* PAYMENT PERFORMANCE */}

        <section className="finance-panel">

          <div className="finance-panel-header">

            <div>

              <span>
                PAYMENT PERFORMANCE
              </span>

              <h2>
                Payment Overview
              </h2>

            </div>

            <FaChartLine />

          </div>


          <div className="finance-overview-list">


            <div className="finance-overview-row">

              <div className="finance-overview-left">

                <span className="finance-icon success">
                  <FaCheckCircle />
                </span>

                <div>

                  <strong>
                    Successful
                  </strong>

                  <small>
                    Completed payments
                  </small>

                </div>

              </div>


              <strong>
                {formatNumber(
                  stats.successfulPayments
                )}
              </strong>

            </div>


            <div className="finance-overview-row">

              <div className="finance-overview-left">

                <span className="finance-icon pending">
                  <FaClock />
                </span>

                <div>

                  <strong>
                    Pending
                  </strong>

                  <small>
                    Awaiting processing
                  </small>

                </div>

              </div>


              <strong>
                {formatNumber(
                  stats.pendingPayments
                )}
              </strong>

            </div>


            <div className="finance-overview-row">

              <div className="finance-overview-left">

                <span className="finance-icon failed">
                  <FaTimesCircle />
                </span>

                <div>

                  <strong>
                    Failed
                  </strong>

                  <small>
                    Unsuccessful payments
                  </small>

                </div>

              </div>


              <strong>
                {formatNumber(
                  stats.failedPayments
                )}
              </strong>

            </div>


          </div>

        </section>


        {/* QUICK ACTIONS */}

        <section className="finance-panel">

          <div className="finance-panel-header">

            <div>

              <span>
                FINANCE OPERATIONS
              </span>

              <h2>
                Quick Actions
              </h2>

            </div>

            <FaFileInvoiceDollar />

          </div>


          <div className="finance-actions">


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/payments/manual-mpesa"
                )
              }
              className="finance-action"
            >

              <span className="finance-action-icon">
                <FaMobileAlt />
              </span>

              <span className="finance-action-content">

                <strong>
                  Manual M-Pesa
                </strong>

                <small>
                  Review and verify submitted
                  confirmations
                </small>

              </span>

              <FaArrowRight />

            </button>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/payments"
                )
              }
              className="finance-action"
            >

              <span className="finance-action-icon">
                <FaMoneyBillWave />
              </span>

              <span className="finance-action-content">

                <strong>
                  Payment History
                </strong>

                <small>
                  View payment transactions
                </small>

              </span>

              <FaArrowRight />

            </button>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/finance/reports"
                )
              }
              className="finance-action"
            >

              <span className="finance-action-icon">
                <FaChartLine />
              </span>

              <span className="finance-action-content">

                <strong>
                  Financial Reports
                </strong>

                <small>
                  Review financial performance
                </small>

              </span>

              <FaArrowRight />

            </button>


          </div>

        </section>

      </div>


      {/* ==================================================
          MANUAL M-PESA
      ================================================== */}

      <section className="finance-manual-panel">

        <div className="finance-manual-heading">

          <div>

            <span>
              MANUAL PAYMENT VERIFICATION
            </span>

            <h2>
              M-Pesa Verification Queue
            </h2>

            <p>
              Review membership payments
              submitted manually by members.
            </p>

          </div>


          <div className="finance-manual-count">

            <FaMobileAlt />

            <div>

              <span>
                Pending Queue
              </span>

              <strong>
                {formatNumber(
                  manualMpesaCount
                )}
              </strong>

              <small>
                submissions
              </small>

            </div>

          </div>

        </div>


        <div className="finance-manual-actions">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/payments/manual-mpesa"
              )
            }
            className="finance-primary-button"
          >

            <FaClipboardList />

            Open Verification Queue

            <FaArrowRight />

          </button>

        </div>

      </section>


      {/* ==================================================
          WORKSPACE NOTICE
      ================================================== */}

      <div className="finance-workspace-notice">

        <FaCheckCircle />

        <div>

          <strong>
            Finance Workspace
          </strong>

          <p>
            Your account has access to
            authorized financial operations.
            Elections, events, programs,
            system users and general
            administrative settings remain
            restricted.
          </p>

        </div>

      </div>

    </div>

  );
};


export default FinanceDashboard;