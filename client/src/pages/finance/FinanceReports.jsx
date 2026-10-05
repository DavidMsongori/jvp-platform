import { useEffect, useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaCalendarAlt,
  FaChartBar,
  FaChartPie,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaExclamationTriangle,
  FaFilter,
  FaMoneyBillWave,
  FaRedo,
  FaSearch,
  FaTimesCircle,
  FaUsers,
  FaWallet,
} from "react-icons/fa";

import {
  getPaymentStatistics,
  getFinancePayments,
} from "../../services/finance.service";

import "./FinanceReports.css";

/* ============================================================
   HELPERS
============================================================ */

const normalizeCollection = (response) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.payments)) {
    return payload.payments;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.payments)) {
    return payload.data.payments;
  }

  return [];
};

const normalizeStats = (response) => {
  const payload = response?.data ?? response;

  if (payload?.data && typeof payload.data === "object") {
    return payload.data;
  }

  return payload || {};
};

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numberValue(value));
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-KE").format(numberValue(value));
};

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

  return date.toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPaymentStatus = (payment) => {
  return String(
    payment?.status ||
      payment?.paymentStatus ||
      payment?.transactionStatus ||
      "unknown"
  ).toLowerCase();
};

const getPaymentAmount = (payment) => {
  return numberValue(
    payment?.amount ??
      payment?.paidAmount ??
      payment?.totalAmount ??
      payment?.amountPaid
  );
};

const getPaymentDate = (payment) => {
  return (
    payment?.createdAt ||
    payment?.paidAt ||
    payment?.paymentDate ||
    payment?.updatedAt
  );
};

const getPaymentMethod = (payment) => {
  return String(
    payment?.method ||
      payment?.paymentMethod ||
      payment?.channel ||
      "unknown"
  ).toLowerCase();
};

const getPaymentProvider = (payment) => {
  return String(
    payment?.provider ||
      payment?.paymentProvider ||
      "unknown"
  ).toLowerCase();
};

const getReference = (payment) => {
  return (
    payment?.reference ||
    payment?.paymentReference ||
    payment?.transactionReference ||
    payment?.transactionCode ||
    payment?._id ||
    "—"
  );
};

const getMemberName = (payment) => {
  const member = payment?.user || payment?.member;

  if (typeof member === "string") {
    return member;
  }

  if (member) {
    const name = [
      member.firstName,
      member.middleName,
      member.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    if (name) return name;

    return member.name || member.fullName || member.email || "Member";
  }

  const name = [
    payment?.firstName,
    payment?.middleName,
    payment?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    name ||
    payment?.memberName ||
    payment?.name ||
    payment?.email ||
    "Member"
  );
};

const titleCase = (value) => {
  if (!value) return "Unknown";

  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/* ============================================================
   COMPONENT
============================================================ */

const FinanceReports = () => {
  const [statistics, setStatistics] = useState({});
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* ==========================================================
     LOAD REPORT DATA
  ========================================================== */

  const loadReports = async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [statsResponse, paymentsResponse] = await Promise.all([
        getPaymentStatistics(),
        getFinancePayments({
          page: 1,
          limit: 1000,
        }),
      ]);

      setStatistics(normalizeStats(statsResponse));
      setPayments(normalizeCollection(paymentsResponse));
    } catch (err) {
      console.error("Finance reports error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load financial reports."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const calculatedStats = useMemo(() => {
    const successfulPayments = payments.filter(
      (payment) => getPaymentStatus(payment) === "successful"
    );

    const pendingPayments = payments.filter((payment) =>
      ["pending", "submitted", "processing"].includes(
        getPaymentStatus(payment)
      )
    );

    const failedPayments = payments.filter((payment) =>
      ["failed", "cancelled", "expired"].includes(
        getPaymentStatus(payment)
      )
    );

    const successfulRevenue = successfulPayments.reduce(
      (total, payment) => total + getPaymentAmount(payment),
      0
    );

    const pendingValue = pendingPayments.reduce(
      (total, payment) => total + getPaymentAmount(payment),
      0
    );

    return {
      successfulCount:
        numberValue(
          statistics?.successfulPayments ??
            statistics?.successfulCount ??
            statistics?.completedPayments
        ) || successfulPayments.length,

      pendingCount:
        numberValue(
          statistics?.pendingPayments ??
            statistics?.pendingCount
        ) || pendingPayments.length,

      failedCount:
        numberValue(
          statistics?.failedPayments ??
            statistics?.failedCount
        ) || failedPayments.length,

      successfulRevenue:
        numberValue(
          statistics?.totalRevenue ??
            statistics?.successfulRevenue ??
            statistics?.revenue
        ) || successfulRevenue,

      pendingValue,
      failedValue: failedPayments.reduce(
        (total, payment) => total + getPaymentAmount(payment),
        0
      ),
    };
  }, [payments, statistics]);

  /* ==========================================================
     FILTERED PAYMENTS
  ========================================================== */

  const filteredPayments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const status = getPaymentStatus(payment);
      const method = getPaymentMethod(payment);
      const paymentDate = getPaymentDate(payment);

      const memberName = getMemberName(payment).toLowerCase();
      const reference = getReference(payment).toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        memberName.includes(normalizedSearch) ||
        reference.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const matchesMethod =
        methodFilter === "all" || method === methodFilter;

      let matchesDate = true;

      if (paymentDate) {
        const date = new Date(paymentDate);

        if (dateFrom) {
          const from = new Date(`${dateFrom}T00:00:00`);
          if (date < from) matchesDate = false;
        }

        if (dateTo) {
          const to = new Date(`${dateTo}T23:59:59`);
          if (date > to) matchesDate = false;
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod &&
        matchesDate
      );
    });
  }, [
    payments,
    search,
    statusFilter,
    methodFilter,
    dateFrom,
    dateTo,
  ]);

  /* ==========================================================
     BREAKDOWNS
  ========================================================== */

  const methodBreakdown = useMemo(() => {
    const result = {};

    filteredPayments.forEach((payment) => {
      if (getPaymentStatus(payment) !== "successful") return;

      const method = getPaymentMethod(payment);
      const amount = getPaymentAmount(payment);

      if (!result[method]) {
        result[method] = {
          count: 0,
          amount: 0,
        };
      }

      result[method].count += 1;
      result[method].amount += amount;
    });

    return Object.entries(result).sort(
      (a, b) => b[1].amount - a[1].amount
    );
  }, [filteredPayments]);

  const providerBreakdown = useMemo(() => {
    const result = {};

    filteredPayments.forEach((payment) => {
      if (getPaymentStatus(payment) !== "successful") return;

      const provider = getPaymentProvider(payment);
      const amount = getPaymentAmount(payment);

      if (!result[provider]) {
        result[provider] = {
          count: 0,
          amount: 0,
        };
      }

      result[provider].count += 1;
      result[provider].amount += amount;
    });

    return Object.entries(result).sort(
      (a, b) => b[1].amount - a[1].amount
    );
  }, [filteredPayments]);

  const filteredRevenue = useMemo(() => {
    return filteredPayments
      .filter(
        (payment) => getPaymentStatus(payment) === "successful"
      )
      .reduce(
        (total, payment) => total + getPaymentAmount(payment),
        0
      );
  }, [filteredPayments]);

  const filteredSuccessfulCount = useMemo(() => {
    return filteredPayments.filter(
      (payment) => getPaymentStatus(payment) === "successful"
    ).length;
  }, [filteredPayments]);

  /* ==========================================================
     EXPORT
  ========================================================== */

  const handleExport = () => {
    if (!filteredPayments.length) {
      return;
    }

    const headers = [
      "Date",
      "Member",
      "Reference",
      "Amount",
      "Method",
      "Provider",
      "Status",
    ];

    const rows = filteredPayments.map((payment) => [
      formatDateTime(getPaymentDate(payment)),
      getMemberName(payment),
      getReference(payment),
      getPaymentAmount(payment),
      titleCase(getPaymentMethod(payment)),
      titleCase(getPaymentProvider(payment)),
      titleCase(getPaymentStatus(payment)),
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `jvp-financial-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* ==========================================================
     RESET FILTERS
  ========================================================== */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setMethodFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters =
    search ||
    statusFilter !== "all" ||
    methodFilter !== "all" ||
    dateFrom ||
    dateTo;

  /* ==========================================================
     LOADING STATE
  ========================================================== */

  if (loading) {
    return (
      <section className="finance-reports-page">
        <div className="finance-reports-loading">
          <div className="finance-report-spinner" />
          <h3>Loading financial reports</h3>
          <p>
            Please wait while we retrieve the latest payment
            information.
          </p>
        </div>
      </section>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section className="finance-reports-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="finance-reports-header">
        <div>
          <span className="finance-reports-eyebrow">
            FINANCE &amp; REPORTING
          </span>

          <h2>Financial Reports</h2>

          <p>
            Monitor JVP payment performance, revenue collection,
            and transaction activity from one place.
          </p>
        </div>

        <div className="finance-reports-header-actions">
          <button
            type="button"
            className="finance-report-refresh-button"
            onClick={() => loadReports(true)}
            disabled={refreshing}
          >
            <FaRedo className={refreshing ? "finance-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="finance-report-export-button"
            onClick={handleExport}
            disabled={!filteredPayments.length}
          >
            <FaDownload />
            Export CSV
          </button>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="finance-reports-error">
          <div className="finance-reports-error-icon">
            <FaExclamationTriangle />
          </div>

          <div>
            <strong>Unable to load complete report data</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => loadReports(true)}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="finance-report-summary-grid">
        <div className="finance-report-summary-card revenue">
          <div className="finance-report-summary-icon">
            <FaMoneyBillWave />
          </div>

          <div className="finance-report-summary-content">
            <span>Total Revenue</span>
            <strong>
              {formatCurrency(calculatedStats.successfulRevenue)}
            </strong>
            <small>
              From successful payments
            </small>
          </div>

          <div className="finance-report-summary-trend positive">
            <FaArrowUp />
          </div>
        </div>

        <div className="finance-report-summary-card successful">
          <div className="finance-report-summary-icon">
            <FaCheckCircle />
          </div>

          <div className="finance-report-summary-content">
            <span>Successful Payments</span>
            <strong>
              {formatNumber(calculatedStats.successfulCount)}
            </strong>
            <small>
              {formatCurrency(
                calculatedStats.successfulRevenue
              )} collected
            </small>
          </div>
        </div>

        <div className="finance-report-summary-card pending">
          <div className="finance-report-summary-icon">
            <FaClock />
          </div>

          <div className="finance-report-summary-content">
            <span>Pending Payments</span>
            <strong>
              {formatNumber(calculatedStats.pendingCount)}
            </strong>
            <small>
              {formatCurrency(
                calculatedStats.pendingValue
              )} awaiting action
            </small>
          </div>
        </div>

        <div className="finance-report-summary-card failed">
          <div className="finance-report-summary-icon">
            <FaTimesCircle />
          </div>

          <div className="finance-report-summary-content">
            <span>Failed Payments</span>
            <strong>
              {formatNumber(calculatedStats.failedCount)}
            </strong>
            <small>
              {formatCurrency(
                calculatedStats.failedValue
              )} unsuccessful
            </small>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="finance-reports-filter-card">
        <div className="finance-reports-filter-header">
          <div>
            <FaFilter />
            <div>
              <h3>Report Filters</h3>
              <span>
                Narrow down transactions for analysis
              </span>
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              className="finance-clear-filters"
              onClick={clearFilters}
            >
              <FaTimesCircle />
              Clear Filters
            </button>
          )}
        </div>

        <div className="finance-reports-filter-grid">
          <div className="finance-report-field search-field">
            <label htmlFor="report-search">
              Search
            </label>

            <div className="finance-report-input-icon">
              <FaSearch />

              <input
                id="report-search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Member or payment reference..."
              />
            </div>
          </div>

          <div className="finance-report-field">
            <label htmlFor="report-status">
              Payment Status
            </label>

            <select
              id="report-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="all">All Statuses</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="finance-report-field">
            <label htmlFor="report-method">
              Payment Method
            </label>

            <select
              id="report-method"
              value={methodFilter}
              onChange={(event) =>
                setMethodFilter(event.target.value)
              }
            >
              <option value="all">All Methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div className="finance-report-field">
            <label htmlFor="report-from">
              From
            </label>

            <div className="finance-report-date-input">
              <FaCalendarAlt />

              <input
                id="report-from"
                type="date"
                value={dateFrom}
                onChange={(event) =>
                  setDateFrom(event.target.value)
                }
              />
            </div>
          </div>

          <div className="finance-report-field">
            <label htmlFor="report-to">
              To
            </label>

            <div className="finance-report-date-input">
              <FaCalendarAlt />

              <input
                id="report-to"
                type="date"
                value={dateTo}
                onChange={(event) =>
                  setDateTo(event.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTERED OVERVIEW
      ====================================================== */}

      <div className="finance-report-period-card">
        <div className="finance-report-period-main">
          <div className="finance-report-period-icon">
            <FaChartBar />
          </div>

          <div>
            <span>Current Report View</span>

            <strong>
              {formatNumber(filteredSuccessfulCount)} successful
              transactions
            </strong>

            <p>
              {formatCurrency(filteredRevenue)} collected from
              the currently selected transactions.
            </p>
          </div>
        </div>

        <div className="finance-report-period-stat">
          <span>Total Records</span>
          <strong>
            {formatNumber(filteredPayments.length)}
          </strong>
        </div>
      </div>

      {/* ======================================================
          BREAKDOWNS
      ====================================================== */}

      <div className="finance-report-breakdown-grid">
        {/* PAYMENT METHODS */}

        <div className="finance-report-panel">
          <div className="finance-report-panel-header">
            <div className="finance-report-panel-title">
              <div className="finance-report-panel-icon">
                <FaChartPie />
              </div>

              <div>
                <h3>Payment Methods</h3>
                <span>
                  Successful revenue by payment method
                </span>
              </div>
            </div>
          </div>

          <div className="finance-breakdown-list">
            {methodBreakdown.length === 0 ? (
              <div className="finance-report-empty-small">
                No successful payment data available.
              </div>
            ) : (
              methodBreakdown.map(([method, data]) => {
                const percentage =
                  filteredRevenue > 0
                    ? (data.amount / filteredRevenue) * 100
                    : 0;

                return (
                  <div
                    className="finance-breakdown-item"
                    key={method}
                  >
                    <div className="finance-breakdown-top">
                      <div className="finance-breakdown-label">
                        <span className="finance-breakdown-dot" />
                        <strong>
                          {titleCase(method)}
                        </strong>
                      </div>

                      <strong>
                        {formatCurrency(data.amount)}
                      </strong>
                    </div>

                    <div className="finance-breakdown-progress">
                      <span
                        style={{
                          width: `${Math.min(
                            percentage,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="finance-breakdown-bottom">
                      <span>
                        {formatNumber(data.count)} transactions
                      </span>

                      <span>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PROVIDERS */}

        <div className="finance-report-panel">
          <div className="finance-report-panel-header">
            <div className="finance-report-panel-title">
              <div className="finance-report-panel-icon">
                <FaWallet />
              </div>

              <div>
                <h3>Payment Providers</h3>
                <span>
                  Successful transactions by provider
                </span>
              </div>
            </div>
          </div>

          <div className="finance-breakdown-list">
            {providerBreakdown.length === 0 ? (
              <div className="finance-report-empty-small">
                No provider data available.
              </div>
            ) : (
              providerBreakdown.map(([provider, data]) => {
                const percentage =
                  filteredRevenue > 0
                    ? (data.amount / filteredRevenue) * 100
                    : 0;

                return (
                  <div
                    className="finance-breakdown-item"
                    key={provider}
                  >
                    <div className="finance-breakdown-top">
                      <div className="finance-breakdown-label">
                        <span className="finance-breakdown-dot provider" />
                        <strong>
                          {titleCase(provider)}
                        </strong>
                      </div>

                      <strong>
                        {formatCurrency(data.amount)}
                      </strong>
                    </div>

                    <div className="finance-breakdown-progress">
                      <span
                        style={{
                          width: `${Math.min(
                            percentage,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="finance-breakdown-bottom">
                      <span>
                        {formatNumber(data.count)} transactions
                      </span>

                      <span>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          TRANSACTION TABLE
      ====================================================== */}

      <div className="finance-report-panel finance-report-transactions">
        <div className="finance-report-panel-header">
          <div className="finance-report-panel-title">
            <div className="finance-report-panel-icon">
              <FaMoneyBillWave />
            </div>

            <div>
              <h3>Transaction Activity</h3>
              <span>
                Detailed payment records matching the current
                filters
              </span>
            </div>
          </div>

          <div className="finance-report-result-count">
            {formatNumber(filteredPayments.length)} records
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="finance-report-empty">
            <div className="finance-report-empty-icon">
              <FaSearch />
            </div>

            <h3>No transactions found</h3>

            <p>
              No payment records match the selected filters.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="finance-report-table-wrapper">
            <table className="finance-report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Member</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Provider</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments
                  .slice(0, 100)
                  .map((payment, index) => {
                    const status = getPaymentStatus(payment);

                    return (
                      <tr
                        key={
                          payment?._id ||
                          payment?.reference ||
                          index
                        }
                      >
                        <td>
                          <span className="finance-report-date">
                            {formatDateTime(
                              getPaymentDate(payment)
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="finance-report-member">
                            <div className="finance-report-member-avatar">
                              <FaUsers />
                            </div>

                            <span>
                              {getMemberName(payment)}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="finance-report-reference">
                            {getReference(payment)}
                          </span>
                        </td>

                        <td>
                          <strong className="finance-report-amount">
                            {formatCurrency(
                              getPaymentAmount(payment)
                            )}
                          </strong>
                        </td>

                        <td>
                          {titleCase(
                            getPaymentMethod(payment)
                          )}
                        </td>

                        <td>
                          {titleCase(
                            getPaymentProvider(payment)
                          )}
                        </td>

                        <td>
                          <span
                            className={`finance-report-status status-${status}`}
                          >
                            {status === "successful" && (
                              <FaCheckCircle />
                            )}

                            {[
                              "pending",
                              "submitted",
                              "processing",
                            ].includes(status) && (
                              <FaClock />
                            )}

                            {[
                              "failed",
                              "cancelled",
                              "expired",
                            ].includes(status) && (
                              <FaTimesCircle />
                            )}

                            {titleCase(status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {filteredPayments.length > 100 && (
              <div className="finance-report-table-footer">
                Showing the first 100 matching records.
                Export the report to CSV for the complete
                filtered dataset.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================
          FOOTER NOTE
      ====================================================== */}

      <div className="finance-reports-footer-note">
        <FaChartBar />

        <div>
          <strong>Finance reporting note</strong>
          <p>
            Revenue calculations are based on successful
            payments only. Pending and failed transactions are
            excluded from collected revenue.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinanceReports;