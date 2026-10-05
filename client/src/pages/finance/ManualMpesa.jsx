import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaCheck,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaExclamationTriangle,
  FaMobileAlt,
  FaRedo,
  FaSearch,
  FaTimes,
  FaTimesCircle,
} from "react-icons/fa";

import api from "../../services/api";

import "./ManualMpesa.css";

/* ==========================================================
   CONSTANTS
========================================================== */

const PAGE_SIZE = 15;

/* ==========================================================
   HELPERS
========================================================== */

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
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

const getCollection = (payload) => {
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

  if (Array.isArray(payload?.data?.results)) {
    return payload.data.results;
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

const getReference = (payment) => {
  return (
    payment?.reference ||
    payment?.paymentReference ||
    payment?.transactionReference ||
    payment?._id ||
    "—"
  );
};

const getAmount = (payment) => {
  return Number(
    payment?.amount ||
      payment?.totalAmount ||
      payment?.paidAmount ||
      0
  );
};

const getMember = (payment) => {
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
      "Unknown Member",

    email:
      member?.email ||
      payment?.email ||
      "—",

    phone:
      member?.phone ||
      member?.phoneNumber ||
      payment?.phone ||
      payment?.phoneNumber ||
      "—",
  };
};

const getMpesaCode = (payment) => {
  return (
    payment?.manualMpesa
      ?.transactionCode ||
    payment?.manualMpesa?.code ||
    payment?.transactionCode ||
    payment?.mpesaCode ||
    payment?.mpesaTransactionCode ||
    payment?.metadata
      ?.transactionCode ||
    "—"
  );
};

const getStatus = (payment) => {
  return String(
    payment?.status ||
      payment?.paymentStatus ||
      "submitted"
  ).toLowerCase();
};

/* ==========================================================
   COMPONENT
========================================================== */

const ManualMpesa = () => {
  const navigate = useNavigate();

  const [payments, setPayments] =
    useState([]);

  const [pagination, setPagination] =
    useState({
      page: 1,
      pages: 1,
      total: 0,
      limit: PAGE_SIZE,
    });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [processingReference, setProcessingReference] =
    useState("");

  const [notification, setNotification] =
    useState({
      type: "",
      message: "",
    });

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [actionModal, setActionModal] =
    useState(null);

  /* ========================================================
     LOAD QUEUE
  ======================================================== */

  const loadQueue = useCallback(
    async (options = {}) => {
      const requestedPage =
        options.page ||
        pagination.page ||
        1;

      const isRefresh =
        Boolean(options.refresh);

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params =
          new URLSearchParams();

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

        const response = await api.get(
          `/payments/admin/manual-mpesa?${params.toString()}`
        );

        const payload =
          response?.data;

        const collection =
          getCollection(payload);

        setPayments(collection);

        const nextPagination =
          getPagination(payload);

        setPagination({
          ...nextPagination,
          page:
            nextPagination.page ||
            requestedPage,
          limit:
            nextPagination.limit ||
            PAGE_SIZE,
        });
      } catch (err) {
        console.error(
          "Manual M-Pesa queue error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load the manual M-Pesa queue."
        );

        setPayments([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pagination.page, search]
  );

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    loadQueue({
      page: 1,
    });
  }, [search]);

  /* ========================================================
     SEARCH
  ======================================================== */

  const handleSearch = (event) => {
    event.preventDefault();

    const nextSearch =
      searchInput.trim();

    if (nextSearch === search) {
      loadQueue({
        page: pagination.page,
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
     NOTIFICATION
  ======================================================== */

  const showNotification = (
    type,
    message
  ) => {
    setNotification({
      type,
      message,
    });

    window.setTimeout(() => {
      setNotification({
        type: "",
        message: "",
      });
    }, 5000);
  };

  /* ========================================================
     ACTION CONFIRMATION
  ======================================================== */

  const requestApprove = (
    payment
  ) => {
    setActionModal({
      type: "approve",
      payment,
    });
  };

  const requestReject = (
    payment
  ) => {
    setActionModal({
      type: "reject",
      payment,
    });
  };

  const closeActionModal = () => {
    if (processingReference) {
      return;
    }

    setActionModal(null);
  };

  /* ========================================================
     APPROVE / REJECT
  ======================================================== */

  const executeAction = async () => {
    if (!actionModal?.payment) {
      return;
    }

    const payment =
      actionModal.payment;

    const reference =
      getReference(payment);

    if (
      !reference ||
      reference === "—"
    ) {
      showNotification(
        "error",
        "This payment does not have a valid reference."
      );

      return;
    }

    const isApprove =
      actionModal.type ===
      "approve";

    try {
      setProcessingReference(
        reference
      );

      const endpoint = isApprove
        ? `/payments/admin/approve/${encodeURIComponent(
            reference
          )}`
        : `/payments/admin/fail/${encodeURIComponent(
            reference
          )}`;

      await api.patch(endpoint);

      showNotification(
        "success",
        isApprove
          ? "M-Pesa payment approved successfully."
          : "M-Pesa payment marked as failed."
      );

      setActionModal(null);
      setSelectedPayment(null);

      await loadQueue({
        page: pagination.page,
        refresh: true,
      });
    } catch (err) {
      console.error(
        "Manual M-Pesa action error:",
        err
      );

      showNotification(
        "error",
        err?.response?.data
          ?.message ||
          err?.message ||
          `Unable to ${
            isApprove
              ? "approve"
              : "reject"
          } this payment.`
      );
    } finally {
      setProcessingReference("");
    }
  };

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

    loadQueue({
      page,
    });
  };

  const pageNumbers = useMemo(() => {
    const totalPages =
      Math.max(
        pagination.pages || 1,
        1
      );

    const currentPage =
      pagination.page || 1;

    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) =>
          index + 1
      );
    }

    const pages = new Set([
      1,
      totalPages,
      currentPage,
      currentPage - 1,
      currentPage + 1,
    ]);

    return Array.from(pages)
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
    const totalAmount =
      payments.reduce(
        (sum, payment) =>
          sum + getAmount(payment),
        0
      );

    const submitted =
      payments.filter(
        (payment) =>
          [
            "submitted",
            "pending",
            "processing",
          ].includes(
            getStatus(payment)
          )
      ).length;

    return {
      count: payments.length,
      totalAmount,
      submitted,
    };
  }, [payments]);

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="manual-mpesa-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <section className="manual-mpesa-header">

        <div>

          <button
            type="button"
            className="manual-mpesa-back"
            onClick={() =>
              navigate("/finance")
            }
          >
            <FaArrowLeft />
            Back to Dashboard
          </button>

          <div className="manual-mpesa-title-row">

            <div className="manual-mpesa-title-icon">
              <FaMobileAlt />
            </div>

            <div>
              <span className="manual-mpesa-label">
                FINANCE WORKSPACE
              </span>

              <h2>
                Manual M-Pesa Verification
              </h2>

              <p>
                Verify member-submitted
                M-Pesa payments before
                membership activation.
              </p>
            </div>

          </div>

        </div>

        <button
          type="button"
          className="manual-mpesa-refresh"
          onClick={() =>
            loadQueue({
              page:
                pagination.page,
              refresh: true,
            })
          }
          disabled={refreshing}
        >
          <FaRedo
            className={
              refreshing
                ? "manual-mpesa-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh Queue"}
        </button>

      </section>

      {/* ====================================================
          NOTIFICATION
      ==================================================== */}

      {notification.message && (
        <div
          className={`manual-mpesa-notification manual-mpesa-notification-${notification.type}`}
        >
          {notification.type ===
          "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationTriangle />
          )}

          <span>
            {notification.message}
          </span>

          <button
            type="button"
            onClick={() =>
              setNotification({
                type: "",
                message: "",
              })
            }
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* ====================================================
          SUMMARY
      ==================================================== */}

      <section className="manual-mpesa-summary">

        <div className="manual-mpesa-summary-card">

          <div className="manual-mpesa-summary-icon pending">
            <FaClock />
          </div>

          <div>
            <span>
              Queue on Page
            </span>

            <strong>
              {summary.count}
            </strong>
          </div>

        </div>

        <div className="manual-mpesa-summary-card">

          <div className="manual-mpesa-summary-icon amount">
            <FaMobileAlt />
          </div>

          <div>
            <span>
              Submitted Amount
            </span>

            <strong>
              {formatCurrency(
                summary.totalAmount
              )}
            </strong>
          </div>

        </div>

        <div className="manual-mpesa-summary-card">

          <div className="manual-mpesa-summary-icon awaiting">
            <FaClock />
          </div>

          <div>
            <span>
              Awaiting Verification
            </span>

            <strong>
              {summary.submitted}
            </strong>
          </div>

        </div>

        <div className="manual-mpesa-summary-card">

          <div className="manual-mpesa-summary-icon verified">
            <FaCheckCircle />
          </div>

          <div>
            <span>
              Total Queue Records
            </span>

            <strong>
              {pagination.total}
            </strong>
          </div>

        </div>

      </section>

      {/* ====================================================
          SEARCH
      ==================================================== */}

      <section className="manual-mpesa-search-panel">

        <div>
          <h3>
            Verification Queue
          </h3>

          <p>
            Search by M-Pesa code,
            payment reference, member
            name, email or phone number.
          </p>
        </div>

        <form
          className="manual-mpesa-search-form"
          onSubmit={handleSearch}
        >

          <div className="manual-mpesa-search-input">

            <FaSearch />

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search M-Pesa code, member or reference..."
            />

            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}

          </div>

          <button
            type="submit"
            className="manual-mpesa-search-button"
          >
            Search
          </button>

        </form>

      </section>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="manual-mpesa-error">

          <div>
            <strong>
              Verification queue unavailable
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              loadQueue({
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

      {/* ====================================================
          QUEUE TABLE
      ==================================================== */}

      <section className="manual-mpesa-table-panel">

        {loading ? (
          <div className="manual-mpesa-loading">

            <div className="manual-mpesa-loader" />

            <p>
              Loading verification
              queue...
            </p>

          </div>
        ) : payments.length === 0 ? (
          <div className="manual-mpesa-empty">

            <div className="manual-mpesa-empty-icon">
              <FaCheckCircle />
            </div>

            <h3>
              Verification queue is clear
            </h3>

            <p>
              There are currently no
              manual M-Pesa payments
              awaiting verification.
            </p>

          </div>
        ) : (
          <>

            <div className="manual-mpesa-table-wrapper">

              <table className="manual-mpesa-table">

                <thead>
                  <tr>
                    <th>M-Pesa Code</th>
                    <th>Member</th>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {payments.map(
                    (payment) => {
                      const member =
                        getMember(
                          payment
                        );

                      const reference =
                        getReference(
                          payment
                        );

                      const code =
                        getMpesaCode(
                          payment
                        );

                      const status =
                        getStatus(
                          payment
                        );

                      const processing =
                        processingReference ===
                        reference;

                      return (
                        <tr
                          key={
                            payment?._id ||
                            reference
                          }
                        >

                          <td>
                            <div className="manual-mpesa-code-cell">

                              <strong>
                                {code}
                              </strong>

                              <span>
                                M-Pesa
                              </span>

                            </div>
                          </td>

                          <td>
                            <div className="manual-mpesa-member">

                              <strong>
                                {member.name}
                              </strong>

                              <span>
                                {member.email}
                              </span>

                              {member.phone !==
                                "—" && (
                                <small>
                                  {member.phone}
                                </small>
                              )}

                            </div>
                          </td>

                          <td>
                            <span className="manual-mpesa-reference">
                              {reference}
                            </span>
                          </td>

                          <td>
                            <strong className="manual-mpesa-amount">
                              {formatCurrency(
                                getAmount(
                                  payment
                                )
                              )}
                            </strong>
                          </td>

                          <td>
                            <div className="manual-mpesa-date">

                              <strong>
                                {formatDate(
                                  payment?.createdAt ||
                                    payment?.submittedAt
                                )}
                              </strong>

                              <span>
                                {formatDateTime(
                                  payment?.createdAt ||
                                    payment?.submittedAt
                                )}
                              </span>

                            </div>
                          </td>

                          <td>
                            <span
                              className={`manual-mpesa-status status-${status}`}
                            >
                              <span />
                              {status
                                .replace(
                                  /[_-]/g,
                                  " "
                                )
                                .replace(
                                  /\b\w/g,
                                  (letter) =>
                                    letter.toUpperCase()
                                )}
                            </span>
                          </td>

                          <td>
                            <div className="manual-mpesa-actions">

                              <button
                                type="button"
                                className="manual-mpesa-view"
                                onClick={() =>
                                  setSelectedPayment(
                                    payment
                                  )
                                }
                                disabled={
                                  processing
                                }
                              >
                                View
                              </button>

                              <button
                                type="button"
                                className="manual-mpesa-approve"
                                onClick={() =>
                                  requestApprove(
                                    payment
                                  )
                                }
                                disabled={
                                  processing
                                }
                              >
                                <FaCheck />
                                Approve
                              </button>

                              <button
                                type="button"
                                className="manual-mpesa-reject"
                                onClick={() =>
                                  requestReject(
                                    payment
                                  )
                                }
                                disabled={
                                  processing
                                }
                              >
                                <FaTimes />
                                Fail
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

            {/* ==================================================
                PAGINATION
            ================================================== */}

            {pagination.pages > 1 && (
              <div className="manual-mpesa-pagination">

                <span>
                  Showing{" "}
                  <strong>
                    {Math.min(
                      (pagination.page - 1) *
                        pagination.limit +
                        1,
                      pagination.total
                    )}
                  </strong>{" "}
                  –{" "}
                  <strong>
                    {Math.min(
                      pagination.page *
                        pagination.limit,
                      pagination.total
                    )}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {pagination.total}
                  </strong>
                </span>

                <div>

                  <button
                    type="button"
                    disabled={
                      pagination.page <=
                      1
                    }
                    onClick={() =>
                      goToPage(
                        pagination.page - 1
                      )
                    }
                  >
                    <FaChevronLeft />
                  </button>

                  {pageNumbers.map(
                    (page) => (
                      <button
                        type="button"
                        key={page}
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
                    )
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
                  >
                    <FaChevronRight />
                  </button>

                </div>

              </div>
            )}

          </>
        )}

      </section>

      {/* ====================================================
          PAYMENT DETAILS MODAL
      ==================================================== */}

      {selectedPayment && (
        <div
          className="manual-mpesa-modal-backdrop"
          onMouseDown={() =>
            setSelectedPayment(null)
          }
        >

          <div
            className="manual-mpesa-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="manual-mpesa-modal-header">

              <div>
                <span>
                  M-PESA VERIFICATION
                </span>

                <h3>
                  Payment Details
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPayment(null)
                }
              >
                <FaTimes />
              </button>

            </div>

            <div className="manual-mpesa-modal-body">

              <div className="manual-mpesa-code-highlight">

                <span>
                  M-Pesa Confirmation Code
                </span>

                <strong>
                  {getMpesaCode(
                    selectedPayment
                  )}
                </strong>

              </div>

              <div className="manual-mpesa-detail-grid">

                <div>
                  <span>
                    Member
                  </span>

                  <strong>
                    {
                      getMember(
                        selectedPayment
                      ).name
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Amount
                  </span>

                  <strong>
                    {formatCurrency(
                      getAmount(
                        selectedPayment
                      )
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Phone
                  </span>

                  <strong>
                    {
                      getMember(
                        selectedPayment
                      ).phone
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Reference
                  </span>

                  <strong>
                    {getReference(
                      selectedPayment
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Status
                  </span>

                  <strong>
                    {getStatus(
                      selectedPayment
                    )
                      .replace(
                        /[_-]/g,
                        " "
                      )
                      .replace(
                        /\b\w/g,
                        (letter) =>
                          letter.toUpperCase()
                      )}
                  </strong>
                </div>

                <div>
                  <span>
                    Submitted
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedPayment?.createdAt ||
                        selectedPayment?.submittedAt
                    )}
                  </strong>
                </div>

              </div>

              <div className="manual-mpesa-verification-warning">
                <FaExclamationTriangle />

                <p>
                  Confirm that the M-Pesa
                  confirmation code and
                  amount correspond with
                  the payment before
                  approving the transaction.
                </p>
              </div>

            </div>

            <div className="manual-mpesa-modal-footer">

              <button
                type="button"
                className="manual-mpesa-modal-close"
                onClick={() =>
                  setSelectedPayment(null)
                }
              >
                Close
              </button>

              <button
                type="button"
                className="manual-mpesa-modal-approve"
                onClick={() => {
                  setSelectedPayment(
                    null
                  );

                  requestApprove(
                    selectedPayment
                  );
                }}
              >
                <FaCheck />
                Approve Payment
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ====================================================
          ACTION CONFIRMATION MODAL
      ==================================================== */}

      {actionModal && (
        <div
          className="manual-mpesa-confirm-backdrop"
          onMouseDown={
            closeActionModal
          }
        >

          <div
            className="manual-mpesa-confirm-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div
              className={`manual-mpesa-confirm-icon ${
                actionModal.type ===
                "approve"
                  ? "approve"
                  : "reject"
              }`}
            >
              {actionModal.type ===
              "approve" ? (
                <FaCheckCircle />
              ) : (
                <FaTimesCircle />
              )}
            </div>

            <h3>
              {actionModal.type ===
              "approve"
                ? "Approve M-Pesa Payment?"
                : "Mark Payment as Failed?"}
            </h3>

            <p>
              {actionModal.type ===
              "approve"
                ? "This will approve the submitted payment and allow the membership payment workflow to be completed."
                : "This will mark the submitted payment as failed. Make sure you have verified the transaction before proceeding."}
            </p>

            <div className="manual-mpesa-confirm-payment">

              <span>
                M-Pesa Code
              </span>

              <strong>
                {getMpesaCode(
                  actionModal.payment
                )}
              </strong>

              <span>
                Amount
              </span>

              <strong>
                {formatCurrency(
                  getAmount(
                    actionModal.payment
                  )
                )}
              </strong>

            </div>

            <div className="manual-mpesa-confirm-actions">

              <button
                type="button"
                className="manual-mpesa-cancel-action"
                onClick={
                  closeActionModal
                }
                disabled={
                  Boolean(
                    processingReference
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  actionModal.type ===
                  "approve"
                    ? "manual-mpesa-confirm-approve"
                    : "manual-mpesa-confirm-reject"
                }
                onClick={
                  executeAction
                }
                disabled={
                  Boolean(
                    processingReference
                  )
                }
              >
                {processingReference ? (
                  <>
                    <span className="manual-mpesa-button-spinner" />
                    Processing...
                  </>
                ) : actionModal.type ===
                  "approve" ? (
                  <>
                    <FaCheck />
                    Confirm Approval
                  </>
                ) : (
                  <>
                    <FaTimes />
                    Confirm Failure
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default ManualMpesa;