import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Filter,
  LoaderCircle,
  Package,
  RefreshCw,
  Search,
  Store,
  UsersRound,
} from "lucide-react";

import {
  getSummitExhibitors,
  updateSummitExhibitor,
} from "../../../services/summitExhibitor.service";

import "./AdminExhibitors.css";

/* ==========================================================
   OPTIONS
========================================================== */

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All statuses",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "payment_pending",
    label: "Payment pending",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const PAYMENT_OPTIONS = [
  {
    value: "",
    label: "All payments",
  },
  {
    value: "not_requested",
    label: "Not requested",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "refunded",
    label: "Refunded",
  },
];

const PACKAGE_OPTIONS = [
  {
    value: "",
    label: "All packages",
  },
  {
    value: "youth",
    label: "Youth",
  },
  {
    value: "bronze",
    label: "Bronze",
  },
  {
    value: "silver",
    label: "Silver",
  },
  {
    value: "gold",
    label: "Gold",
  },
  {
    value: "premium",
    label: "Premium",
  },
];

/* ==========================================================
   HELPERS
========================================================== */

const formatLabel = (value) => {
  if (!value) {
    return "-";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const formatAmount = (amount) =>
  new Intl.NumberFormat(
    "en-KE"
  ).format(Number(amount) || 0);

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};

const getPayload = (response) =>
  response?.data ||
  response ||
  {};

/* ==========================================================
   COMPONENT
========================================================== */

export default function AdminExhibitors() {
  const [
    exhibitors,
    setExhibitors,
  ] = useState([]);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [
    filters,
    setFilters,
  ] = useState({
    search: "",
    status: "",
    paymentStatus: "",
    packageId: "",
  });

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedExhibitor,
    setSelectedExhibitor,
  ] = useState(null);

  const [
    updateLoading,
    setUpdateLoading,
  ] = useState(false);

  const [
    updateMessage,
    setUpdateMessage,
  ] = useState("");

  /* ========================================================
     LOAD EXHIBITORS
  ======================================================== */

  const loadExhibitors =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getSummitExhibitors({
            page:
              pagination.page,

            limit:
              pagination.limit,

            status:
              filters.status,

            paymentStatus:
              filters.paymentStatus,

            packageId:
              filters.packageId,

            search:
              appliedSearch,
          });

        const payload =
          getPayload(response);

        const result =
          payload?.data ||
          payload;

        setExhibitors(
          Array.isArray(
            result?.exhibitors
          )
            ? result.exhibitors
            : []
        );

        setPagination(
          (current) => ({
            ...current,
            ...(result?.pagination ||
              {}),
          })
        );
      } catch (requestError) {
        console.error(
          "Unable to load exhibitors:",
          requestError
        );

        setError(
          requestError?.response
            ?.data?.message ||
            requestError?.message ||
            "Unable to load exhibitor registrations."
        );
      } finally {
        setLoading(false);
      }
    }, [
      pagination.page,
      pagination.limit,
      filters.status,
      filters.paymentStatus,
      filters.packageId,
      appliedSearch,
    ]);

  useEffect(() => {
    loadExhibitors();
  }, [loadExhibitors]);

  /* ========================================================
     FILTERS
  ======================================================== */

  const handleFilterChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFilters(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    if (name !== "search") {
      setPagination(
        (current) => ({
          ...current,
          page: 1,
        })
      );
    }
  };

  const handleSearchSubmit = (
    event
  ) => {
    event.preventDefault();

    setAppliedSearch(
      filters.search.trim()
    );

    setPagination(
      (current) => ({
        ...current,
        page: 1,
      })
    );
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      paymentStatus: "",
      packageId: "",
    });

    setAppliedSearch("");

    setPagination(
      (current) => ({
        ...current,
        page: 1,
      })
    );
  };

  /* ========================================================
     SUMMARY
  ======================================================== */

  const summary = useMemo(() => {
    return {
      total:
        pagination.total || 0,

      pending:
        exhibitors.filter(
          (item) =>
            item.status ===
            "pending"
        ).length,

      confirmed:
        exhibitors.filter(
          (item) =>
            item.status ===
            "confirmed"
        ).length,

      paid:
        exhibitors.filter(
          (item) =>
            item.paymentStatus ===
            "paid"
        ).length,
    };
  }, [
    exhibitors,
    pagination.total,
  ]);

  /* ========================================================
     UPDATE EXHIBITOR
  ======================================================== */

  const handleUpdate =
    async () => {
      if (
        !selectedExhibitor?._id
      ) {
        return;
      }

      try {
        setUpdateLoading(true);
        setUpdateMessage("");

        const response =
          await updateSummitExhibitor(
            selectedExhibitor._id,
            {
              status:
                selectedExhibitor.status,

              paymentStatus:
                selectedExhibitor
                  .paymentStatus,

              adminNotes:
                selectedExhibitor
                  .adminNotes ||
                "",
            }
          );

        const payload =
          getPayload(response);

        const updated =
          payload?.data
            ?.exhibitor ||
          payload?.exhibitor ||
          payload?.data ||
          null;

        if (updated) {
          setSelectedExhibitor(
            updated
          );
        }

        setUpdateMessage(
          "Exhibitor registration updated successfully."
        );

        await loadExhibitors();
      } catch (requestError) {
        console.error(
          "Unable to update exhibitor:",
          requestError
        );

        setUpdateMessage(
          requestError?.response
            ?.data?.message ||
            requestError?.message ||
            "Unable to update exhibitor registration."
        );
      } finally {
        setUpdateLoading(false);
      }
    };

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="admin-exhibitors-page">
      <header className="admin-exhibitors-header">
        <div>
          <span>
            Summit administration
          </span>

          <h1>
            Registered Exhibitors
          </h1>

          <p>
            Review exhibitor applications,
            confirm packages and manage
            payment status.
          </p>
        </div>

        <button
          type="button"
          onClick={loadExhibitors}
          disabled={loading}
        >
          <RefreshCw
            size={18}
            className={
              loading
                ? "admin-exhibitors-spin"
                : ""
            }
          />

          Refresh
        </button>
      </header>

      <section className="admin-exhibitors-summary">
        <article>
          <span>
            <UsersRound
              size={20}
            />
          </span>

          <div>
            <small>
              Total applications
            </small>

            <strong>
              {summary.total}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <Store size={20} />
          </span>

          <div>
            <small>
              Pending on page
            </small>

            <strong>
              {summary.pending}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <CheckCircle2
              size={20}
            />
          </span>

          <div>
            <small>
              Confirmed on page
            </small>

            <strong>
              {summary.confirmed}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <CreditCard
              size={20}
            />
          </span>

          <div>
            <small>
              Paid on page
            </small>

            <strong>
              {summary.paid}
            </strong>
          </div>
        </article>
      </section>

      <section className="admin-exhibitors-filters">
        <form
          onSubmit={
            handleSearchSubmit
          }
        >
          <div className="admin-exhibitors-search">
            <Search size={18} />

            <input
              type="search"
              name="search"
              value={
                filters.search
              }
              onChange={
                handleFilterChange
              }
              placeholder="Search organization, contact, email or phone"
            />
          </div>

          <button type="submit">
            Search
          </button>
        </form>

        <div className="admin-exhibitors-filter-grid">
          <label>
            <span>
              <Filter size={15} />
              Status
            </span>

            <select
              name="status"
              value={
                filters.status
              }
              onChange={
                handleFilterChange
              }
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>
              <CreditCard
                size={15}
              />
              Payment
            </span>

            <select
              name="paymentStatus"
              value={
                filters.paymentStatus
              }
              onChange={
                handleFilterChange
              }
            >
              {PAYMENT_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>
              <Package
                size={15}
              />
              Package
            </span>

            <select
              name="packageId"
              value={
                filters.packageId
              }
              onChange={
                handleFilterChange
              }
            >
              {PACKAGE_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </label>

          <button
            type="button"
            className="admin-exhibitors-clear"
            onClick={
              handleClearFilters
            }
          >
            Clear filters
          </button>
        </div>
      </section>

      {error && (
        <div className="admin-exhibitors-error">
          <AlertCircle
            size={19}
          />

          <span>{error}</span>
        </div>
      )}

      <section className="admin-exhibitors-table-card">
        {loading ? (
          <div className="admin-exhibitors-loading">
            <LoaderCircle
              size={34}
              className="admin-exhibitors-spin"
            />

            <p>
              Loading exhibitor
              registrations...
            </p>
          </div>
        ) : exhibitors.length ===
          0 ? (
          <div className="admin-exhibitors-empty">
            <Store size={38} />

            <h2>
              No exhibitor applications
            </h2>

            <p>
              No registrations match the
              current filters.
            </p>
          </div>
        ) : (
          <div className="admin-exhibitors-table-wrapper">
            <table className="admin-exhibitors-table">
              <thead>
                <tr>
                  <th>
                    Organization
                  </th>

                  <th>
                    Package
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    County
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Submitted
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {exhibitors.map(
                  (exhibitor) => (
                    <tr
                      key={
                        exhibitor._id
                      }
                    >
                      <td>
                        <div className="admin-exhibitors-organization">
                          <span>
                            <Building2
                              size={18}
                            />
                          </span>

                          <div>
                            <strong>
                              {
                                exhibitor.organizationName
                              }
                            </strong>

                            <small>
                              {formatLabel(
                                exhibitor.organizationType
                              )}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>
                          {
                            exhibitor.packageName
                          }
                        </strong>

                        <small className="admin-exhibitors-amount">
                          KES{" "}
                          {formatAmount(
                            exhibitor.packageAmount
                          )}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {
                            exhibitor.contactPerson
                          }
                        </strong>

                        <small>
                          {
                            exhibitor.email
                          }
                        </small>

                        <small>
                          {
                            exhibitor.phone
                          }
                        </small>
                      </td>

                      <td>
                        {
                          exhibitor.county
                        }
                      </td>

                      <td>
                        <span
                          className={`admin-exhibitors-badge status-${exhibitor.status}`}
                        >
                          {formatLabel(
                            exhibitor.status
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-exhibitors-badge payment-${exhibitor.paymentStatus}`}
                        >
                          {formatLabel(
                            exhibitor.paymentStatus
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          exhibitor.submittedAt ||
                            exhibitor.createdAt
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-exhibitors-view"
                          onClick={() => {
                            setSelectedExhibitor(
                              exhibitor
                            );

                            setUpdateMessage(
                              ""
                            );
                          }}
                        >
                          <Eye size={16} />

                          View
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="admin-exhibitors-pagination">
        <span>
          Page {pagination.page} of{" "}
          {pagination.totalPages}
        </span>

        <div>
          <button
            type="button"
            disabled={
              !pagination.hasPreviousPage ||
              loading
            }
            onClick={() =>
              setPagination(
                (current) => ({
                  ...current,
                  page:
                    current.page -
                    1,
                })
              )
            }
          >
            <ChevronLeft
              size={17}
            />

            Previous
          </button>

          <button
            type="button"
            disabled={
              !pagination.hasNextPage ||
              loading
            }
            onClick={() =>
              setPagination(
                (current) => ({
                  ...current,
                  page:
                    current.page +
                    1,
                })
              )
            }
          >
            Next

            <ChevronRight
              size={17}
            />
          </button>
        </div>
      </footer>

      {selectedExhibitor && (
        <div
          className="admin-exhibitors-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !updateLoading
            ) {
              setSelectedExhibitor(
                null
              );
            }
          }}
        >
          <div
            className="admin-exhibitors-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-exhibitor-title"
          >
            <header>
              <div>
                <span>
                  Exhibitor application
                </span>

                <h2 id="admin-exhibitor-title">
                  {
                    selectedExhibitor.organizationName
                  }
                </h2>

                <p>
                  {
                    selectedExhibitor.packageName
                  }{" "}
                  package · KES{" "}
                  {formatAmount(
                    selectedExhibitor.packageAmount
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedExhibitor(
                    null
                  )
                }
                disabled={
                  updateLoading
                }
              >
                ×
              </button>
            </header>

            <div className="admin-exhibitors-modal-body">
              <section className="admin-exhibitors-detail-grid">
                <div>
                  <small>
                    Contact person
                  </small>

                  <strong>
                    {
                      selectedExhibitor.contactPerson
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Email
                  </small>

                  <strong>
                    {
                      selectedExhibitor.email
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Phone
                  </small>

                  <strong>
                    {
                      selectedExhibitor.phone
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    County
                  </small>

                  <strong>
                    {
                      selectedExhibitor.county
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Organization type
                  </small>

                  <strong>
                    {formatLabel(
                      selectedExhibitor.organizationType
                    )}
                  </strong>
                </div>

                <div>
                  <small>
                    Submitted
                  </small>

                  <strong>
                    {formatDate(
                      selectedExhibitor.submittedAt ||
                        selectedExhibitor.createdAt
                    )}
                  </strong>
                </div>
              </section>

              <section className="admin-exhibitors-description">
                <h3>
                  Products or services
                </h3>

                <p>
                  {
                    selectedExhibitor.productsOrServices
                  }
                </p>
              </section>

              <section className="admin-exhibitors-description">
                <h3>
                  Exhibition requirements
                </h3>

                <p>
                  {selectedExhibitor.exhibitionRequirements ||
                    "No special requirements were provided."}
                </p>
              </section>

              <div className="admin-exhibitors-update-grid">
                <label>
                  <span>
                    Application status
                  </span>

                  <select
                    value={
                      selectedExhibitor.status
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedExhibitor(
                        (current) => ({
                          ...current,
                          status:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    disabled={
                      updateLoading
                    }
                  >
                    {STATUS_OPTIONS.filter(
                      (option) =>
                        option.value
                    ).map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Payment status
                  </span>

                  <select
                    value={
                      selectedExhibitor.paymentStatus
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedExhibitor(
                        (current) => ({
                          ...current,
                          paymentStatus:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    disabled={
                      updateLoading
                    }
                  >
                    {PAYMENT_OPTIONS.filter(
                      (option) =>
                        option.value
                    ).map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="full-width">
                  <span>
                    Admin notes
                  </span>

                  <textarea
                    rows="5"
                    value={
                      selectedExhibitor.adminNotes ||
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedExhibitor(
                        (current) => ({
                          ...current,
                          adminNotes:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    disabled={
                      updateLoading
                    }
                    placeholder="Add internal notes..."
                  />
                </label>
              </div>

              {updateMessage && (
                <div className="admin-exhibitors-update-message">
                  {updateMessage}
                </div>
              )}
            </div>

            <footer>
              <button
                type="button"
                onClick={() =>
                  setSelectedExhibitor(
                    null
                  )
                }
                disabled={
                  updateLoading
                }
              >
                Close
              </button>

              <button
                type="button"
                className="primary"
                onClick={
                  handleUpdate
                }
                disabled={
                  updateLoading
                }
              >
                {updateLoading ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="admin-exhibitors-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2
                      size={17}
                    />

                    Save changes
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}