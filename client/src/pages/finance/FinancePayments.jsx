import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaFilter,
  FaMoneyBillWave,
  FaRedo,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import api from "../../services/api";

import "./FinancePayments.css";

/* ==========================================================
   CONSTANTS
========================================================== */

const PAGE_SIZE = 15;

const PAYMENT_STATUSES = [
  "all",
  "pending",
  "submitted",
  "processing",
  "successful",
  "failed",
  "cancelled",
  "expired",
  "refunded",
];

const PROVIDERS = [
  "all",
  "intasend",
  "mpesa_direct",
  "manual",
];

const METHODS = [
  "all",
  "mpesa",
  "card",
  "bank",
  "cash",
  "unknown",
];

/* ==========================================================
   HELPERS
========================================================== */

const formatCurrency = (amount) => {
  const value = Number(amount || 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-KE").format(
    Number(value || 0)
  );
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

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
  if (!value) {
    return "—";
  }

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

const formatTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const capitalize = (value) => {
  if (!value) {
    return "—";
  }

  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

/* ==========================================================
   RESPONSE HELPERS
========================================================== */

const getPaymentCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.payments)) {
    return payload.payments;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data?.payments)) {
    return payload.data.payments;
  }

  if (Array.isArray(payload?.data?.results)) {
    return payload.data.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const getPagination = (payload) => {
  const source =
    payload?.pagination ||
    payload?.data?.pagination ||
    payload?.meta ||
    payload?.data?.meta ||
    {};

  return {
    page: Number(source.page || 1),
    pages: Number(
      source.pages ||
        source.totalPages ||
        source.lastPage ||
        1
    ),
    total: Number(
      source.total ||
        source.totalItems ||
        source.count ||
        0
    ),
    limit: Number(
      source.limit || PAGE_SIZE
    ),
  };
};

/* ==========================================================
   PAYMENT HELPERS
========================================================== */

const getPaymentReference = (payment) => {
  return (
    payment?.reference ||
    payment?.paymentReference ||
    payment?.transactionReference ||
    payment?.transactionId ||
    payment?._id ||
    "—"
  );
};

const getPaymentStatus = (payment) => {
  return String(
    payment?.status ||
      payment?.paymentStatus ||
      "unknown"
  ).toLowerCase();
};

const getPaymentAmount = (payment) => {
  return Number(
    payment?.amount ||
      payment?.totalAmount ||
      payment?.paidAmount ||
      payment?.paymentAmount ||
      0
  );
};

const getPaymentMember = (payment) => {
  const member =
    payment?.member ||
    payment?.user ||
    payment?.customer ||
    payment?.payer ||
    {};

  const name =
    member?.name ||
    member?.fullName ||
    [
      member?.firstName,
      member?.lastName,
    ]
      .filter(Boolean)
      .join(" ");

  return {
    name:
      name ||
      payment?.memberName ||
      payment?.customerName ||
      payment?.payerName ||
      "Unknown Member",

    email:
      member?.email ||
      payment?.email ||
      payment?.customerEmail ||
      "—",

    phone:
      member?.phone ||
      member?.phoneNumber ||
      payment?.phone ||
      payment?.phoneNumber ||
      "—",
  };
};

const getPaymentProvider = (payment) => {
  return String(
    payment?.provider ||
      payment?.paymentProvider ||
      "unknown"
  ).toLowerCase();
};

const getPaymentMethod = (payment) => {
  return String(
    payment?.method ||
      payment?.paymentMethod ||
      "unknown"
  ).toLowerCase();
};

const getPaymentDate = (payment) => {
  return (
    payment?.paidAt ||
    payment?.completedAt ||
    payment?.createdAt ||
    payment?.updatedAt
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

const FinancePayments = () => {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: PAGE_SIZE,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const [method, setMethod] = useState("all");

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  /* ========================================================
     LOAD PAYMENTS
  ======================================================== */

  const loadPayments = useCallback(
    async (options = {}) => {
      const requestedPage = Number(
        options.page || 1
      );

      const isRefresh = Boolean(
        options.refresh
      );

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams();

        params.set(
          "page",
          String(requestedPage)
        );

        params.set(
          "limit",
          String(PAGE_SIZE)
        );

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (status !== "all") {
          params.set(
            "status",
            status
          );
        }

        if (provider !== "all") {
          params.set(
            "provider",
            provider
          );
        }

        if (method !== "all") {
          params.set(
            "method",
            method
          );
        }

        const response = await api.get(
          `/payments/admin/all?${params.toString()}`
        );

        const payload = response?.data;

        const collection =
          getPaymentCollection(payload);

        const nextPagination =
          getPagination(payload);

        setPayments(collection);

        setPagination({
          page:
            nextPagination.page ||
            requestedPage,

          pages:
            nextPagination.pages || 1,

          total:
            nextPagination.total || 0,

          limit:
            nextPagination.limit ||
            PAGE_SIZE,
        });
      } catch (err) {
        console.error(
          "Finance payments error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load payment records."
        );

        setPayments([]);

        setPagination((previous) => ({
          ...previous,
          page: requestedPage,
        }));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      method,
      provider,
      search,
      status,
    ]
  );

  /* ========================================================
     FILTER LOAD
  ======================================================== */

  useEffect(() => {
    loadPayments({
      page: 1,
    });
  }, [
    search,
    status,
    provider,
    method,
    loadPayments,
  ]);

  /* ========================================================
     SEARCH
  ======================================================== */

  const handleSearch = (event) => {
    event.preventDefault();

    const nextSearch =
      searchInput.trim();

    if (nextSearch === search) {
      loadPayments({
        page: 1,
        refresh: true,
      });

      return;
    }

    setSearch(nextSearch);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  /* ========================================================
     FILTERS
  ======================================================== */

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setProvider("all");
    setMethod("all");
  };

  const hasFilters =
    Boolean(search) ||
    status !== "all" ||
    provider !== "all" ||
    method !== "all";

  /* ========================================================
     PAGINATION
  ======================================================== */

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > pagination.pages ||
      page === pagination.page
    ) {
      return;
    }

    loadPayments({
      page,
    });
  };

  const visiblePageNumbers = useMemo(() => {
    const totalPages = Math.max(
      Number(pagination.pages) || 1,
      1
    );

    const currentPage =
      Number(pagination.page) || 1;

    if (totalPages <= 7) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1
      );
    }

    const pageSet = new Set([
      1,
      totalPages,
      currentPage,
      currentPage - 1,
      currentPage + 1,
    ]);

    return Array.from(pageSet)
      .filter(
        (page) =>
          page >= 1 &&
          page <= totalPages
      )
      .sort(
        (a, b) => a - b
      );
  }, [
    pagination.page,
    pagination.pages,
  ]);

  /* ========================================================
     SUMMARY
  ======================================================== */

  const summary = useMemo(() => {
    const successful =
      payments.filter(
        (payment) =>
          getPaymentStatus(payment) ===
          "successful"
      );

    const pending =
      payments.filter((payment) =>
        [
          "pending",
          "submitted",
          "processing",
        ].includes(
          getPaymentStatus(payment)
        )
      );

    const successfulAmount =
      successful.reduce(
        (sum, payment) =>
          sum +
          getPaymentAmount(payment),
        0
      );

    return {
      successful:
        successful.length,

      pending:
        pending.length,

      successfulAmount,
    };
  }, [payments]);

  /* ========================================================
     PAYMENT ROW
  ======================================================== */

  const renderPaymentRow = (payment) => {
    const member =
      getPaymentMember(payment);

    const paymentStatus =
      getPaymentStatus(payment);

    const paymentReference =
      getPaymentReference(payment);

    const paymentDate =
      getPaymentDate(payment);

    return (
      <tr
        key={
          payment?._id ||
          paymentReference
        }
      >
        <td>
          <div className="finance-reference">
            <strong>
              {paymentReference}
            </strong>

            <span>
              {payment?._id &&
              payment._id !==
                paymentReference
                ? `ID: ${payment._id}`
                : "Payment transaction"}
            </span>
          </div>
        </td>

        <td>
          <div className="finance-member-cell">
            <strong>
              {member.name}
            </strong>

            <span>
              {member.email}
            </span>

            {member.phone !== "—" && (
              <small>
                {member.phone}
              </small>
            )}
          </div>
        </td>

        <td>
          <strong className="finance-amount">
            {formatCurrency(
              getPaymentAmount(payment)
            )}
          </strong>
        </td>

        <td>
          <span className="finance-method">
            {capitalize(
              getPaymentMethod(payment)
            )}
          </span>
        </td>

        <td>
          <span className="finance-provider">
            {capitalize(
              getPaymentProvider(payment)
            )}
          </span>
        </td>

        <td>
          <span
            className={`finance-payment-status finance-status-${paymentStatus}`}
          >
            <span className="finance-status-dot" />

            {capitalize(
              paymentStatus
            )}
          </span>
        </td>

        <td>
          <div className="finance-date-cell">
            <strong>
              {formatDate(paymentDate)}
            </strong>

            <span>
              {formatTime(paymentDate)}
            </span>
          </div>
        </td>

        <td>
          <button
            type="button"
            className="finance-view-button"
            onClick={() =>
              setSelectedPayment(payment)
            }
            title="View payment"
          >
            <FaEye />

            <span>
              View
            </span>
          </button>
        </td>
      </tr>
    );
  };

  /* ========================================================
     PAGINATION
  ======================================================== */

  const renderPagination = () => {
    if (pagination.pages <= 1) {
      return null;
    }

    return (
      <div className="finance-pagination">
        <div className="finance-pagination-info">
          Showing{" "}
          <strong>
            {formatNumber(
              (pagination.page - 1) *
                pagination.limit +
                1
            )}
          </strong>{" "}
          –{" "}
          <strong>
            {formatNumber(
              Math.min(
                pagination.page *
                  pagination.limit,
                pagination.total
              )
            )}
          </strong>{" "}
          of{" "}
          <strong>
            {formatNumber(
              pagination.total
            )}
          </strong>
        </div>

        <div className="finance-pagination-controls">
          <button
            type="button"
            disabled={
              pagination.page <= 1
            }
            onClick={() =>
              goToPage(
                pagination.page - 1
              )
            }
            aria-label="Previous page"
          >
            <FaChevronLeft />
          </button>

          {visiblePageNumbers.map(
            (page, index) => {
              const previous =
                visiblePageNumbers[
                  index - 1
                ];

              const showGap =
                previous &&
                page - previous > 1;

              return (
                <span
                  key={page}
                  className="finance-pagination-group"
                >
                  {showGap && (
                    <span className="finance-pagination-gap">
                      …
                    </span>
                  )}

                  <button
                    type="button"
                    className={
                      page ===
                      pagination.page
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      goToPage(page)
                    }
                  >
                    {page}
                  </button>
                </span>
              );
            }
          )}

          <button
            type="button"
            disabled={
              pagination.page >=
              pagination.pages
            }
            onClick={() =>
              goToPage(
                pagination.page + 1
              )
            }
            aria-label="Next page"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    );
  };

  /* ========================================================
     PAYMENT MODAL
  ======================================================== */

  const renderPaymentModal = () => {
    if (!selectedPayment) {
      return null;
    }

    const member =
      getPaymentMember(
        selectedPayment
      );

    return (
      <div
        className="finance-payment-modal-backdrop"
        onMouseDown={() =>
          setSelectedPayment(null)
        }
      >
        <div
          className="finance-payment-modal"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <div className="finance-payment-modal-header">
            <div>
              <span>
                PAYMENT DETAILS
              </span>

              <h3>
                {getPaymentReference(
                  selectedPayment
                )}
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedPayment(null)
              }
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          <div className="finance-payment-modal-body">
            <div className="finance-payment-detail-highlight">
              <span>
                Payment Amount
              </span>

              <strong>
                {formatCurrency(
                  getPaymentAmount(
                    selectedPayment
                  )
                )}
              </strong>
            </div>

            <div className="finance-payment-detail-grid">
              <div>
                <span>
                  Status
                </span>

                <strong>
                  {capitalize(
                    getPaymentStatus(
                      selectedPayment
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Provider
                </span>

                <strong>
                  {capitalize(
                    getPaymentProvider(
                      selectedPayment
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Method
                </span>

                <strong>
                  {capitalize(
                    getPaymentMethod(
                      selectedPayment
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Date
                </span>

                <strong>
                  {formatDateTime(
                    getPaymentDate(
                      selectedPayment
                    )
                  )}
                </strong>
              </div>
            </div>

            <div className="finance-payment-detail-section">
              <h4>
                Member Information
              </h4>

              <div className="finance-payment-detail-grid">
                <div>
                  <span>
                    Name
                  </span>

                  <strong>
                    {member.name}
                  </strong>
                </div>

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {member.email}
                  </strong>
                </div>

                <div>
                  <span>
                    Phone
                  </span>

                  <strong>
                    {member.phone}
                  </strong>
                </div>

                <div>
                  <span>
                    Reference
                  </span>

                  <strong>
                    {getPaymentReference(
                      selectedPayment
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {selectedPayment?.manualMpesa
              ?.transactionCode && (
              <div className="finance-payment-detail-section">
                <h4>
                  M-Pesa Information
                </h4>

                <div className="finance-mpesa-code">
                  {
                    selectedPayment
                      .manualMpesa
                      .transactionCode
                  }
                </div>
              </div>
            )}
          </div>

          <div className="finance-payment-modal-footer">
            <button
              type="button"
              onClick={() =>
                setSelectedPayment(null)
              }
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="finance-payments-page">
      <section className="finance-payments-header">
        <div>
          <button
            type="button"
            className="finance-page-back"
            onClick={() =>
              navigate("/finance")
            }
          >
            <FaArrowLeft />
            Back to Dashboard
          </button>

          <div className="finance-payments-title-row">
            <div className="finance-payments-title-icon">
              <FaMoneyBillWave />
            </div>

            <div>
              <span className="finance-section-label">
                FINANCE WORKSPACE
              </span>

              <h2>
                Payment Records
              </h2>

              <p>
                Review, search and monitor
                JVP payment transactions.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="finance-refresh-button"
          onClick={() =>
            loadPayments({
              page: pagination.page,
              refresh: true,
            })
          }
          disabled={refreshing}
        >
          <FaRedo
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
      </section>

      <section className="finance-payment-summary">
        <div className="finance-payment-summary-card">
          <span>
            Records on Page
          </span>

          <strong>
            {formatNumber(
              payments.length
            )}
          </strong>
        </div>

        <div className="finance-payment-summary-card">
          <span>
            Total Records
          </span>

          <strong>
            {formatNumber(
              pagination.total
            )}
          </strong>
        </div>

        <div className="finance-payment-summary-card">
          <span>
            Successful
          </span>

          <strong>
            {formatNumber(
              summary.successful
            )}
          </strong>
        </div>

        <div className="finance-payment-summary-card">
          <span>
            Successful Amount
          </span>

          <strong>
            {formatCurrency(
              summary.successfulAmount
            )}
          </strong>
        </div>
      </section>

      <section className="finance-payments-filter-panel">
        <div className="finance-filter-heading">
          <FaFilter />

          <div>
            <strong>
              Search & Filters
            </strong>

            <span>
              Find specific transactions
            </span>
          </div>
        </div>

        <form
          className="finance-payment-search"
          onSubmit={handleSearch}
        >
          <div className="finance-search-wrapper">
            <FaSearch />

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search reference, member, email or phone..."
            />

            {searchInput && (
              <button
                type="button"
                className="finance-search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="finance-search-button"
          >
            Search
          </button>
        </form>

        <div className="finance-payment-filters">
          <div className="finance-filter-field">
            <label htmlFor="payment-status">
              Status
            </label>

            <select
              id="payment-status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
            >
              {PAYMENT_STATUSES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {capitalize(item)}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="finance-filter-field">
            <label htmlFor="payment-provider">
              Provider
            </label>

            <select
              id="payment-provider"
              value={provider}
              onChange={(event) =>
                setProvider(
                  event.target.value
                )
              }
            >
              {PROVIDERS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {capitalize(item)}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="finance-filter-field">
            <label htmlFor="payment-method">
              Method
            </label>

            <select
              id="payment-method"
              value={method}
              onChange={(event) =>
                setMethod(
                  event.target.value
                )
              }
            >
              {METHODS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {capitalize(item)}
                  </option>
                )
              )}
            </select>
          </div>

          {hasFilters && (
            <button
              type="button"
              className="finance-clear-filters"
              onClick={clearFilters}
            >
              <FaTimes />
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="finance-payment-error">
          <div>
            <strong>
              Unable to load payments
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              loadPayments({
                page:
                  pagination.page,
                refresh: true,
              })
            }
          >
            Try Again
          </button>
        </div>
      )}

      <section className="finance-payment-table-panel">
        <div className="finance-table-header">
          <div>
            <h3>
              Transaction Ledger
            </h3>

            <span>
              {pagination.total > 0
                ? `${formatNumber(
                    pagination.total
                  )} payment record${
                    pagination.total === 1
                      ? ""
                      : "s"
                  }`
                : "No payment records"}
            </span>
          </div>

          {hasFilters && (
            <span className="finance-filter-active">
              Filters active
            </span>
          )}
        </div>

        {loading && (
          <div className="finance-payments-loading">
            <div className="finance-loading-spinner" />

            <p>
              Loading payment records...
            </p>
          </div>
        )}

        {!loading &&
          payments.length === 0 && (
            <div className="finance-payments-empty">
              <div className="finance-empty-icon">
                <FaMoneyBillWave />
              </div>

              <h3>
                No payment records found
              </h3>

              <p>
                There are no transactions
                matching your current
                search and filters.
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
          )}

        {!loading &&
          payments.length > 0 && (
            <>
              <div className="finance-payment-table-wrapper">
                <table className="finance-payment-table">
                  <thead>
                    <tr>
                      <th>
                        Transaction
                      </th>

                      <th>
                        Member
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Method
                      </th>

                      <th>
                        Provider
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Date
                      </th>

                      <th aria-label="Actions" />
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map(
                      renderPaymentRow
                    )}
                  </tbody>
                </table>
              </div>

              {renderPagination()}
            </>
          )}
      </section>

      {renderPaymentModal()}
    </div>
  );
};

export default FinancePayments;