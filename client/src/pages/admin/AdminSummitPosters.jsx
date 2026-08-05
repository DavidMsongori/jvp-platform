import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileImage,
  Filter,
  Image,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  confirmPosterPayment,
  generatePoster,
  getAdminPosterRequests,
  getAdminPosterStatistics,
  getPosterDownloadUrl,
  rejectPosterPayment,
  updatePosterNotes,
} from "../../services/summitPoster.service";

import "./AdminSummitPosters.css";

/* ==========================================================
   OPTIONS
========================================================== */

const COUNTY_OPTIONS = [
  {
    value: "",
    label: "All counties",
  },
  {
    value: "Kilifi",
    label: "Kilifi",
  },
  {
    value: "Mombasa",
    label: "Mombasa",
  },
  {
    value: "Kwale",
    label: "Kwale",
  },
  {
    value: "Taita Taveta",
    label: "Taita Taveta",
  },
  {
    value: "Tana River",
    label: "Tana River",
  },
  {
    value: "Lamu",
    label: "Lamu",
  },
];

const PAYMENT_STATUS_OPTIONS = [
  {
    value: "",
    label: "All payment statuses",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "submitted",
    label: "Submitted",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

const POSTER_STATUS_OPTIONS = [
  {
    value: "",
    label: "All poster statuses",
  },
  {
    value: "pending_payment",
    label: "Pending payment",
  },
  {
    value: "payment_submitted",
    label: "Payment submitted",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "generating",
    label: "Generating",
  },
  {
    value: "ready",
    label: "Ready",
  },
  {
    value: "downloaded",
    label: "Downloaded",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

/* ==========================================================
   HELPERS
========================================================== */

const formatLabel = (
  value
) => {
  if (!value) {
    return "-";
  }

  return String(value)
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

const formatAmount = (
  value
) => {
  return new Intl.NumberFormat(
    "en-KE"
  ).format(
    Number(value) || 0
  );
};

const formatDate = (
  value
) => {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

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

const getPayload = (
  response
) => {
  return (
    response?.data ||
    response ||
    {}
  );
};

const getImageUrl = (
  image
) => {
  return (
    image?.secureUrl ||
    image?.url ||
    ""
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

export default function AdminSummitPosters() {
  const [
    posters,
    setPosters,
  ] = useState([]);

  const [
    statistics,
    setStatistics,
  ] = useState({
    total: 0,
    pendingPayment: 0,
    paymentSubmitted: 0,
    paymentConfirmed: 0,
    ready: 0,
    downloaded: 0,
    confirmedRevenue: 0,
  });

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
    county: "",
    paymentStatus: "",
    status: "",
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
    statisticsLoading,
    setStatisticsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedPoster,
    setSelectedPoster,
  ] = useState(null);

  const [
    actionLoading,
    setActionLoading,
  ] = useState("");

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    copiedField,
    setCopiedField,
  ] = useState("");

  /* ========================================================
     LOAD POSTERS
  ======================================================== */

  const loadPosters =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getAdminPosterRequests({
              page:
                pagination.page,

              limit:
                pagination.limit,

              search:
                appliedSearch,

              county:
                filters.county,

              paymentStatus:
                filters.paymentStatus,

              status:
                filters.status,
            });

          const payload =
            getPayload(
              response
            );

          const result =
            payload?.data ||
            payload;

          setPosters(
            Array.isArray(
              result?.posters
            )
              ? result.posters
              : []
          );

          setPagination(
            (current) => ({
              ...current,
              ...(result?.pagination ||
                {}),
            })
          );
        } catch (
          requestError
        ) {
          setError(
            requestError?.message ||
            "Unable to load summit poster requests."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        pagination.page,
        pagination.limit,
        appliedSearch,
        filters.county,
        filters.paymentStatus,
        filters.status,
      ]
    );

  /* ========================================================
     LOAD STATISTICS
  ======================================================== */

  const loadStatistics =
    useCallback(
      async () => {
        try {
          setStatisticsLoading(
            true
          );

          const response =
            await getAdminPosterStatistics();

          const payload =
            getPayload(
              response
            );

          const result =
            payload?.data
              ?.statistics ||
            payload
              ?.statistics ||
            payload?.data ||
            {};

          setStatistics(
            (current) => ({
              ...current,
              ...result,
            })
          );
        } catch (
          requestError
        ) {
          console.error(
            "Unable to load poster statistics:",
            requestError
          );
        } finally {
          setStatisticsLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadPosters();
  }, [loadPosters]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

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

    if (
      name !== "search"
    ) {
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

  const clearFilters = () => {
    setFilters({
      search: "",
      county: "",
      paymentStatus: "",
      status: "",
    });

    setAppliedSearch("");

    setPagination(
      (current) => ({
        ...current,
        page: 1,
      })
    );
  };

  const refreshAll =
    async () => {
      await Promise.all([
        loadPosters(),
        loadStatistics(),
      ]);
    };

  /* ========================================================
     SELECT POSTER
  ======================================================== */

  const openPoster = (
    poster
  ) => {
    setSelectedPoster(
      poster
    );

    setActionMessage("");

    setRejectionReason(
      poster
        ?.paymentRejectedReason ||
        ""
    );
  };

  const closePoster = () => {
    if (actionLoading) {
      return;
    }

    setSelectedPoster(null);
    setActionMessage("");
    setRejectionReason("");
  };

  /* ========================================================
     CONFIRM PAYMENT
  ======================================================== */

  const handleConfirmPayment =
    async () => {
      if (
        !selectedPoster?._id
      ) {
        return;
      }

      try {
        setActionLoading(
          "confirm"
        );

        setActionMessage("");

        const response =
          await confirmPosterPayment(
            selectedPoster._id,
            {
              notes:
                selectedPoster.notes ||
                "",
            }
          );

        const payload =
          getPayload(
            response
          );

        const updated =
          payload?.data
            ?.poster ||
          payload?.poster ||
          null;

        if (updated) {
          setSelectedPoster(
            updated
          );
        }

        setActionMessage(
          "Payment confirmed successfully."
        );

        await refreshAll();
      } catch (
        requestError
      ) {
        setActionMessage(
          requestError?.message ||
          "Unable to confirm payment."
        );
      } finally {
        setActionLoading("");
      }
    };

  /* ========================================================
     REJECT PAYMENT
  ======================================================== */

  const handleRejectPayment =
    async () => {
      if (
        !selectedPoster?._id
      ) {
        return;
      }

      if (
        rejectionReason
          .trim()
          .length < 3
      ) {
        setActionMessage(
          "Enter a valid rejection reason."
        );

        return;
      }

      try {
        setActionLoading(
          "reject"
        );

        setActionMessage("");

        const response =
          await rejectPosterPayment(
            selectedPoster._id,
            {
              reason:
                rejectionReason.trim(),
            }
          );

        const payload =
          getPayload(
            response
          );

        const updated =
          payload?.data
            ?.poster ||
          payload?.poster ||
          null;

        if (updated) {
          setSelectedPoster(
            updated
          );
        }

        setActionMessage(
          "Payment submission rejected."
        );

        await refreshAll();
      } catch (
        requestError
      ) {
        setActionMessage(
          requestError?.message ||
          "Unable to reject payment."
        );
      } finally {
        setActionLoading("");
      }
    };

  /* ========================================================
     GENERATE POSTER
  ======================================================== */

  const handleGeneratePoster =
    async (
      force = false
    ) => {
      if (
        !selectedPoster?._id
      ) {
        return;
      }

      try {
        setActionLoading(
          force
            ? "regenerate"
            : "generate"
        );

        setActionMessage("");

        const response =
          await generatePoster(
            selectedPoster._id,
            {
              force,
            }
          );

        const payload =
          getPayload(
            response
          );

        const updated =
          payload?.data
            ?.poster ||
          payload?.poster ||
          null;

        if (updated) {
          setSelectedPoster(
            updated
          );
        }

        setActionMessage(
          force
            ? "Poster regenerated successfully."
            : "Poster generated successfully."
        );

        await refreshAll();
      } catch (
        requestError
      ) {
        setActionMessage(
          requestError?.message ||
          "Unable to generate the poster."
        );
      } finally {
        setActionLoading("");
      }
    };

  /* ========================================================
     UPDATE NOTES
  ======================================================== */

  const handleUpdateNotes =
    async () => {
      if (
        !selectedPoster?._id
      ) {
        return;
      }

      try {
        setActionLoading(
          "notes"
        );

        setActionMessage("");

        const response =
          await updatePosterNotes(
            selectedPoster._id,
            {
              notes:
                selectedPoster.notes ||
                "",
            }
          );

        const payload =
          getPayload(
            response
          );

        const updated =
          payload?.data
            ?.poster ||
          payload?.poster ||
          null;

        if (updated) {
          setSelectedPoster(
            updated
          );
        }

        setActionMessage(
          "Administrative notes updated."
        );

        await loadPosters();
      } catch (
        requestError
      ) {
        setActionMessage(
          requestError?.message ||
          "Unable to update notes."
        );
      } finally {
        setActionLoading("");
      }
    };

  /* ========================================================
     COPY
  ======================================================== */

  const copyValue =
    async (
      value,
      field
    ) => {
      if (!value) {
        return;
      }

      try {
        await navigator
          .clipboard
          .writeText(
            String(value)
          );

        setCopiedField(
          field
        );

        window.setTimeout(
          () => {
            setCopiedField("");
          },
          1600
        );
      } catch {
        setCopiedField("");
      }
    };

  /* ========================================================
     SUMMARY CARDS
  ======================================================== */

  const summaryCards =
    useMemo(
      () => [
        {
          label:
            "Total requests",
          value:
            statistics.total,
          icon:
            FileImage,
        },
        {
          label:
            "Payment submitted",
          value:
            statistics.paymentSubmitted,
          icon:
            CreditCard,
        },
        {
          label:
            "Confirmed payments",
          value:
            statistics.paymentConfirmed,
          icon:
            CheckCircle2,
        },
        {
          label:
            "Ready posters",
          value:
            statistics.ready,
          icon:
            Sparkles,
        },
        {
          label:
            "Downloaded",
          value:
            statistics.downloaded,
          icon:
            Download,
        },
        {
          label:
            "Confirmed revenue",
          value:
            `KES ${formatAmount(
              statistics.confirmedRevenue
            )}`,
          icon:
            CreditCard,
        },
      ],
      [
        statistics,
      ]
    );

  /* ========================================================
     MODAL VALUES
  ======================================================== */

  const originalPhotoUrl =
    getImageUrl(
      selectedPoster
        ?.originalPhoto
    );

  const previewPosterUrl =
    getImageUrl(
      selectedPoster
        ?.previewPoster
    );

  const finalPosterUrl =
    getImageUrl(
      selectedPoster
        ?.finalPoster
    );

  const secureDownloadUrl =
    selectedPoster
      ?.downloadToken
      ? getPosterDownloadUrl(
          selectedPoster
            .downloadToken
        )
      : "";

  const paymentCanBeConfirmed =
    selectedPoster
      ?.paymentStatus ===
      "submitted";

  const paymentCanBeRejected =
    [
      "submitted",
      "pending",
    ].includes(
      selectedPoster
        ?.paymentStatus
    );

  const posterCanBeGenerated =
    selectedPoster
      ?.paymentStatus ===
      "confirmed" &&
    [
      "approved",
      "generating",
    ].includes(
      selectedPoster
        ?.status
    );

  const posterCanBeRegenerated =
    selectedPoster
      ?.paymentStatus ===
      "confirmed" &&
    [
      "ready",
      "downloaded",
    ].includes(
      selectedPoster
        ?.status
    );

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="admin-summit-posters-page">
      <header className="admin-summit-posters-header">
        <div>
          <span>
            Summit administration
          </span>

          <h1>
            Attendance Posters
          </h1>

          <p>
            Verify Till payments, generate
            personalized summit posters and
            manage participant downloads.
          </p>
        </div>

        <button
          type="button"
          onClick={
            refreshAll
          }
          disabled={
            loading ||
            statisticsLoading
          }
        >
          <RefreshCw
            size={18}
            className={
              loading ||
              statisticsLoading
                ? "admin-summit-posters-spin"
                : ""
            }
          />

          Refresh
        </button>
      </header>

      <section className="admin-summit-posters-summary">
        {summaryCards.map(
          (card) => {
            const Icon =
              card.icon;

            return (
              <article
                key={
                  card.label
                }
              >
                <span>
                  <Icon
                    size={20}
                    aria-hidden="true"
                  />
                </span>

                <div>
                  <small>
                    {card.label}
                  </small>

                  <strong>
                    {statisticsLoading
                      ? "-"
                      : card.value}
                  </strong>
                </div>
              </article>
            );
          }
        )}
      </section>

      <section className="admin-summit-posters-filters">
        <form
          onSubmit={
            handleSearchSubmit
          }
        >
          <div className="admin-summit-posters-search">
            <Search
              size={18}
              aria-hidden="true"
            />

            <input
              type="search"
              name="search"
              value={
                filters.search
              }
              onChange={
                handleFilterChange
              }
              placeholder="Search name, email, phone, reference or M-Pesa code"
            />
          </div>

          <button type="submit">
            Search
          </button>
        </form>

        <div className="admin-summit-posters-filter-grid">
          <label>
            <span>
              <Filter
                size={15}
                aria-hidden="true"
              />

              County
            </span>

            <select
              name="county"
              value={
                filters.county
              }
              onChange={
                handleFilterChange
              }
            >
              {COUNTY_OPTIONS.map(
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
                aria-hidden="true"
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
              {PAYMENT_STATUS_OPTIONS.map(
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
              <FileImage
                size={15}
                aria-hidden="true"
              />

              Poster status
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
              {POSTER_STATUS_OPTIONS.map(
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
            className="admin-summit-posters-clear"
            onClick={
              clearFilters
            }
          >
            Clear filters
          </button>
        </div>
      </section>

      {error && (
        <div className="admin-summit-posters-error">
          <AlertCircle
            size={19}
            aria-hidden="true"
          />

          <span>
            {error}
          </span>
        </div>
      )}

      <section className="admin-summit-posters-table-card">
        {loading ? (
          <div className="admin-summit-posters-loading">
            <LoaderCircle
              size={34}
              className="admin-summit-posters-spin"
              aria-hidden="true"
            />

            <p>
              Loading poster requests...
            </p>
          </div>
        ) : posters.length ===
          0 ? (
          <div className="admin-summit-posters-empty">
            <FileImage
              size={40}
              aria-hidden="true"
            />

            <h2>
              No poster requests
            </h2>

            <p>
              No requests match the current
              filters.
            </p>
          </div>
        ) : (
          <div className="admin-summit-posters-table-wrapper">
            <table className="admin-summit-posters-table">
              <thead>
                <tr>
                  <th>
                    Participant
                  </th>

                  <th>
                    Reference
                  </th>

                  <th>
                    County
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Poster
                  </th>

                  <th>
                    M-Pesa code
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
                {posters.map(
                  (poster) => (
                    <tr
                      key={
                        poster._id
                      }
                    >
                      <td>
                        <div className="admin-summit-posters-participant">
                          <span>
                            {getImageUrl(
                              poster.originalPhoto
                            ) ? (
                              <img
                                src={getImageUrl(
                                  poster.originalPhoto
                                )}
                                alt=""
                              />
                            ) : (
                              <UserRound
                                size={18}
                              />
                            )}
                          </span>

                          <div>
                            <strong>
                              {
                                poster.fullName
                              }
                            </strong>

                            <small>
                              {
                                poster.email
                              }
                            </small>

                            <small>
                              {
                                poster.phoneNumber
                              }
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong className="admin-summit-posters-reference">
                          {
                            poster.posterReference
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          poster.county
                        }
                      </td>

                      <td>
                        <span
                          className={`admin-summit-posters-badge payment-${poster.paymentStatus}`}
                        >
                          {formatLabel(
                            poster.paymentStatus
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-summit-posters-badge status-${poster.status}`}
                        >
                          {formatLabel(
                            poster.status
                          )}
                        </span>
                      </td>

                      <td>
                        {
                          poster.mpesaTransactionCode ||
                          "-"
                        }
                      </td>

                      <td>
                        {formatDate(
                          poster.createdAt
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-summit-posters-view"
                          onClick={() =>
                            openPoster(
                              poster
                            )
                          }
                        >
                          <Eye
                            size={16}
                            aria-hidden="true"
                          />

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

      <footer className="admin-summit-posters-pagination">
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
              aria-hidden="true"
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
              aria-hidden="true"
            />
          </button>
        </div>
      </footer>

      {selectedPoster && (
        <div
          className="admin-summit-posters-modal-overlay"
          role="presentation"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
                event.currentTarget &&
              !actionLoading
            ) {
              closePoster();
            }
          }}
        >
          <div
            className="admin-summit-posters-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-summit-poster-title"
          >
            <header>
              <div>
                <span>
                  Attendance poster request
                </span>

                <h2 id="admin-summit-poster-title">
                  {
                    selectedPoster.fullName
                  }
                </h2>

                <p>
                  {
                    selectedPoster.posterReference
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closePoster
                }
                disabled={
                  Boolean(
                    actionLoading
                  )
                }
              >
                ×
              </button>
            </header>

            <div className="admin-summit-posters-modal-body">
              <section className="admin-summit-posters-modal-images">
                <article>
                  <div>
                    <span>
                      Participant photo
                    </span>

                    <h3>
                      Original upload
                    </h3>
                  </div>

                  {originalPhotoUrl ? (
                    <img
                      src={
                        originalPhotoUrl
                      }
                      alt={
                        selectedPoster.fullName
                      }
                    />
                  ) : (
                    <div className="admin-summit-posters-image-empty">
                      <Image
                        size={32}
                      />

                      No image
                    </div>
                  )}
                </article>

                <article>
                  <div>
                    <span>
                      Generated poster
                    </span>

                    <h3>
                      Preview
                    </h3>
                  </div>

                  {previewPosterUrl ? (
                    <img
                      src={
                        previewPosterUrl
                      }
                      alt={`Poster preview for ${selectedPoster.fullName}`}
                    />
                  ) : (
                    <div className="admin-summit-posters-image-empty">
                      <FileImage
                        size={32}
                      />

                      Not generated
                    </div>
                  )}
                </article>
              </section>

              <section className="admin-summit-posters-detail-grid">
                <div>
                  <small>
                    Email
                  </small>

                  <strong>
                    {
                      selectedPoster.email
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Phone
                  </small>

                  <strong>
                    {
                      selectedPoster.phoneNumber
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    County
                  </small>

                  <strong>
                    {
                      selectedPoster.county
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Social handle
                  </small>

                  <strong>
                    {
                      selectedPoster.socialHandle ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Till Number
                  </small>

                  <div className="admin-summit-posters-copy">
                    <strong>
                      {
                        selectedPoster.tillNumber
                      }
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        copyValue(
                          selectedPoster.tillNumber,
                          "till"
                        )
                      }
                    >
                      <Copy
                        size={14}
                      />

                      {copiedField ===
                      "till"
                        ? "Copied"
                        : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <small>
                    Amount
                  </small>

                  <strong>
                    KES{" "}
                    {formatAmount(
                      selectedPoster.amount
                    )}
                  </strong>
                </div>

                <div>
                  <small>
                    M-Pesa code
                  </small>

                  <div className="admin-summit-posters-copy">
                    <strong>
                      {
                        selectedPoster.mpesaTransactionCode ||
                        "-"
                      }
                    </strong>

                    {selectedPoster.mpesaTransactionCode && (
                      <button
                        type="button"
                        onClick={() =>
                          copyValue(
                            selectedPoster.mpesaTransactionCode,
                            "mpesa"
                          )
                        }
                      >
                        <Copy
                          size={14}
                        />

                        {copiedField ===
                        "mpesa"
                          ? "Copied"
                          : "Copy"}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <small>
                    Submitted
                  </small>

                  <strong>
                    {formatDate(
                      selectedPoster.createdAt
                    )}
                  </strong>
                </div>
              </section>

              <section className="admin-summit-posters-status-row">
                <div>
                  <small>
                    Payment status
                  </small>

                  <span
                    className={`admin-summit-posters-badge payment-${selectedPoster.paymentStatus}`}
                  >
                    {formatLabel(
                      selectedPoster.paymentStatus
                    )}
                  </span>
                </div>

                <div>
                  <small>
                    Poster status
                  </small>

                  <span
                    className={`admin-summit-posters-badge status-${selectedPoster.status}`}
                  >
                    {formatLabel(
                      selectedPoster.status
                    )}
                  </span>
                </div>

                <div>
                  <small>
                    Downloads
                  </small>

                  <strong>
                    {
                      selectedPoster.downloadCount ||
                      0
                    }
                  </strong>
                </div>
              </section>

              {paymentCanBeRejected && (
                <section className="admin-summit-posters-rejection">
                  <label>
                    <span>
                      Payment rejection reason
                    </span>

                    <textarea
                      rows="3"
                      value={
                        rejectionReason
                      }
                      onChange={(
                        event
                      ) =>
                        setRejectionReason(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        Boolean(
                          actionLoading
                        )
                      }
                      placeholder="Explain why the payment could not be verified..."
                    />
                  </label>

                  <button
                    type="button"
                    onClick={
                      handleRejectPayment
                    }
                    disabled={
                      Boolean(
                        actionLoading
                      )
                    }
                  >
                    {actionLoading ===
                    "reject" ? (
                      <LoaderCircle
                        size={17}
                        className="admin-summit-posters-spin"
                      />
                    ) : (
                      <XCircle
                        size={17}
                      />
                    )}

                    Reject payment
                  </button>
                </section>
              )}

              <section className="admin-summit-posters-notes">
                <label>
                  <span>
                    Administrative notes
                  </span>

                  <textarea
                    rows="4"
                    value={
                      selectedPoster.notes ||
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedPoster(
                        (current) => ({
                          ...current,
                          notes:
                            event.target
                              .value,
                        })
                      )
                    }
                    disabled={
                      Boolean(
                        actionLoading
                      )
                    }
                    placeholder="Add internal notes..."
                  />
                </label>

                <button
                  type="button"
                  onClick={
                    handleUpdateNotes
                  }
                  disabled={
                    Boolean(
                      actionLoading
                    )
                  }
                >
                  {actionLoading ===
                  "notes" ? (
                    <LoaderCircle
                      size={17}
                      className="admin-summit-posters-spin"
                    />
                  ) : (
                    <CheckCircle2
                      size={17}
                    />
                  )}

                  Save notes
                </button>
              </section>

              {actionMessage && (
                <div className="admin-summit-posters-action-message">
                  {
                    actionMessage
                  }
                </div>
              )}

              {(finalPosterUrl ||
                secureDownloadUrl) && (
                <section className="admin-summit-posters-download-links">
                  {finalPosterUrl && (
                    <a
                      href={
                        finalPosterUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye
                        size={17}
                      />

                      Open final poster
                    </a>
                  )}

                  {secureDownloadUrl && (
                    <a
                      href={
                        secureDownloadUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download
                        size={17}
                      />

                      Test secure download
                    </a>
                  )}
                </section>
              )}
            </div>

            <footer>
              <button
                type="button"
                onClick={
                  closePoster
                }
                disabled={
                  Boolean(
                    actionLoading
                  )
                }
              >
                Close
              </button>

              <div>
                {paymentCanBeConfirmed && (
                  <button
                    type="button"
                    className="confirm"
                    onClick={
                      handleConfirmPayment
                    }
                    disabled={
                      Boolean(
                        actionLoading
                      )
                    }
                  >
                    {actionLoading ===
                    "confirm" ? (
                      <LoaderCircle
                        size={17}
                        className="admin-summit-posters-spin"
                      />
                    ) : (
                      <CheckCircle2
                        size={17}
                      />
                    )}

                    Confirm payment
                  </button>
                )}

                {posterCanBeGenerated && (
                  <button
                    type="button"
                    className="generate"
                    onClick={() =>
                      handleGeneratePoster(
                        false
                      )
                    }
                    disabled={
                      Boolean(
                        actionLoading
                      )
                    }
                  >
                    {actionLoading ===
                    "generate" ? (
                      <LoaderCircle
                        size={17}
                        className="admin-summit-posters-spin"
                      />
                    ) : (
                      <Sparkles
                        size={17}
                      />
                    )}

                    Generate poster
                  </button>
                )}

                {posterCanBeRegenerated && (
                  <button
                    type="button"
                    className="generate"
                    onClick={() =>
                      handleGeneratePoster(
                        true
                      )
                    }
                    disabled={
                      Boolean(
                        actionLoading
                      )
                    }
                  >
                    {actionLoading ===
                    "regenerate" ? (
                      <LoaderCircle
                        size={17}
                        className="admin-summit-posters-spin"
                      />
                    ) : (
                      <RefreshCw
                        size={17}
                      />
                    )}

                    Regenerate poster
                  </button>
                )}
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}