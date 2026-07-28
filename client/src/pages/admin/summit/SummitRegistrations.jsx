import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Download,
  Eye,
  Filter,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Ticket,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import {
  useSummit,
} from "../../../context/SummitContext";

import "./SummitRegistrations.css";

/* ==========================================
   CONFIGURATION
========================================== */

const SUMMIT_EVENT_ID =
  import.meta.env.VITE_SUMMIT_EVENT_ID;

const PAGE_SIZE_OPTIONS = [
  10,
  20,
  50,
  100,
];

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
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

const TICKET_STATUS_OPTIONS = [
  {
    value: "",
    label: "All ticket statuses",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "generated",
    label: "Generated",
  },
  {
    value: "sent",
    label: "Sent",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const CHECK_IN_OPTIONS = [
  {
    value: "",
    label: "All participants",
  },
  {
    value: "true",
    label: "Checked in",
  },
  {
    value: "false",
    label: "Not checked in",
  },
];

/* ==========================================
   HELPERS
========================================== */

const ensureNumber = (
  value,
  fallback = 0
) => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
};

const formatNumber = (value) => {
  return new Intl.NumberFormat(
    "en-KE"
  ).format(ensureNumber(value));
};

const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
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

const formatStatus = (value) => {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
};

const getStatusClassName = (
  status
) => {
  const normalized = String(
    status || ""
  ).toLowerCase();

  if (
    [
      "confirmed",
      "active",
      "completed",
      "generated",
      "sent",
      "checked_in",
      "checked in",
    ].includes(normalized)
  ) {
    return "is-success";
  }

  if (
    [
      "pending",
      "processing",
      "pending_payment",
    ].includes(normalized)
  ) {
    return "is-warning";
  }

  if (
    [
      "cancelled",
      "rejected",
      "expired",
      "inactive",
    ].includes(normalized)
  ) {
    return "is-danger";
  }

  return "is-neutral";
};

const getParticipantName = (
  registration
) => {
  const directName =
    registration?.fullName ||
    registration?.participantName ||
    registration?.name;

  if (
    directName &&
    typeof directName === "string"
  ) {
    return directName;
  }

  const participant =
    registration?.participant;

  if (
    participant &&
    typeof participant === "object"
  ) {
    const participantName =
      participant?.fullName ||
      participant?.name ||
      [
        participant?.firstName,
        participant?.middleName,
        participant?.lastName,
      ]
        .filter(Boolean)
        .join(" ");

    if (participantName) {
      return participantName;
    }
  }

  return [
    registration?.firstName,
    registration?.middleName,
    registration?.lastName,
  ]
    .filter(Boolean)
    .join(" ") ||
    "Unnamed participant";
};

const getInitials = (name) => {
  return String(name || "NA")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
};

const getRegistrationEmail = (
  registration
) => {
  const email =
    registration?.email ||
    registration?.participantEmail ||
    registration?.participant?.email ||
    "";

  return typeof email === "string"
    ? email
    : "";
};

const getRegistrationPhone = (
  registration
) => {
  const phone =
    registration?.phone ||
    registration?.phoneNumber ||
    registration?.participantPhone ||
    registration?.participant?.phone ||
    registration?.participant
      ?.phoneNumber ||
    "";

  return typeof phone === "string"
    ? phone
    : "";
};

const getCountyDetails = (
  registration
) => {
  const county =
    registration?.county;

  if (!county) {
    return {
      name: "Not provided",
      code:
        registration?.countyCode ||
        "",
    };
  }

  if (typeof county === "string") {
    return {
      name: county,
      code:
        registration?.countyCode ||
        "",
    };
  }

  return {
    name:
      county?.county ||
      county?.countyName ||
      county?.name ||
      "Not provided",

    code:
      county?.countyCode ||
      county?.code ||
      registration?.countyCode ||
      "",
  };
};

const getRegistrationId = (
  registration
) => {
  return (
    registration?._id ||
    registration?.id ||
    ""
  );
};

const getRegistrationStatus = (
  registration
) => {
  return (
    registration?.status ||
    registration?.registrationStatus ||
    "pending"
  );
};

const getTicketStatus = (
  registration
) => {
  return (
    registration?.ticketStatus ||
    registration?.ticket?.status ||
    (
      registration?.ticketNumber
        ? "generated"
        : "pending"
    )
  );
};

const isCheckedIn = (
  registration
) => {
  return Boolean(
    registration?.checkedIn ||
    registration?.isCheckedIn ||
    registration?.checkIn
      ?.checkedIn ||
    registration?.attendance
      ?.checkedIn
  );
};

const getRegisteredDate = (
  registration
) => {
  return (
    registration?.registeredAt ||
    registration?.createdAt ||
    registration?.submittedAt ||
    null
  );
};

const getTicketNumber = (
  registration
) => {
  return (
    registration?.ticketNumber ||
    registration?.ticket
      ?.ticketNumber ||
    ""
  );
};

const buildExportRows = (
  registrations
) => {
  return registrations.map(
    (registration) => {
      const county =
        getCountyDetails(
          registration
        );

      return {
        Name:
          getParticipantName(
            registration
          ),
        Email:
          getRegistrationEmail(
            registration
          ),
        Phone:
          getRegistrationPhone(
            registration
          ),
        County: county.name,
        "County Code":
          county.code,
        Status: formatStatus(
          getRegistrationStatus(
            registration
          )
        ),
        "Ticket Number":
          getTicketNumber(
            registration
          ),
        "Ticket Status":
          formatStatus(
            getTicketStatus(
              registration
            )
          ),
        "Checked In":
          isCheckedIn(
            registration
          )
            ? "Yes"
            : "No",
        "Registered At":
          formatDateTime(
            getRegisteredDate(
              registration
            )
          ),
      };
    }
  );
};

const escapeCsvValue = (value) => {
  const stringValue = String(
    value ?? ""
  );

  return `"${stringValue.replace(
    /"/g,
    '""'
  )}"`;
};

const exportToCsv = (
  registrations
) => {
  if (!registrations.length) {
    return;
  }

  const rows =
    buildExportRows(
      registrations
    );

  const headers =
    Object.keys(rows[0]);

  const csvContent = [
    headers
      .map(escapeCsvValue)
      .join(","),
    ...rows.map((row) =>
      headers
        .map((header) =>
          escapeCsvValue(
            row[header]
          )
        )
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(
    [csvContent],
    {
      type:
        "text/csv;charset=utf-8;",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download =
    "summit-registrations.csv";

  document.body.appendChild(
    anchor
  );

  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
};

/* ==========================================
   LOADING ROW
========================================== */

const LoadingRow = () => {
  return (
    <tr className="summit-registration-loading-row">
      <td colSpan="9">
        <div className="summit-registration-loading-content">
          <RefreshCw
            size={22}
            className="is-spinning"
          />

          <span>
            Loading summit
            registrations...
          </span>
        </div>
      </td>
    </tr>
  );
};

/* ==========================================
   EMPTY STATE
========================================== */

const EmptyState = ({
  hasFilters,
  onReset,
}) => {
  return (
    <div className="summit-registrations-empty">
      <div className="summit-empty-icon">
        <Users
          size={32}
          aria-hidden="true"
        />
      </div>

      <h3>
        {hasFilters
          ? "No matching registrations"
          : "No summit registrations yet"}
      </h3>

      <p>
        {hasFilters
          ? "No participants match the current search and filter settings."
          : "Participant registrations will appear here once registration begins."}
      </p>

      {hasFilters && (
        <button
          type="button"
          className="summit-registrations-secondary-button"
          onClick={onReset}
        >
          <X size={17} />
          Clear filters
        </button>
      )}
    </div>
  );
};

/* ==========================================
   MAIN COMPONENT
========================================== */

const SummitRegistrations = () => {
  const {
    registrations,
    registrationFilters,
    pagination,
    registrationsLoading,
    registrationsError,
    fetchAdminRegistrations,
    updateRegistrationFilters,
    resetRegistrationFilters,
  } = useSummit();

  const [
    searchInput,
    setSearchInput,
  ] = useState(
    registrationFilters?.search ||
      ""
  );

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  const [
    selectedIds,
    setSelectedIds,
  ] = useState([]);

  /* ========================================
     LOAD REGISTRATIONS
  ======================================== */

  const loadRegistrations =
    useCallback(
      async (
        filters =
          registrationFilters
      ) => {
        if (!SUMMIT_EVENT_ID) {
          return;
        }

        await fetchAdminRegistrations(
          SUMMIT_EVENT_ID,
          filters
        );
      },
      [
        fetchAdminRegistrations,
        registrationFilters,
      ]
    );

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  /* ========================================
     DERIVED DATA
  ======================================== */

  const safeRegistrations =
    useMemo(
      () =>
        Array.isArray(
          registrations
        )
          ? registrations
          : [],
      [registrations]
    );

  const currentPage =
    ensureNumber(
      pagination?.page,
      1
    );

  const totalPages =
    Math.max(
      ensureNumber(
        pagination?.totalPages,
        1
      ),
      1
    );

  const totalRecords =
    ensureNumber(
      pagination?.total,
      safeRegistrations.length
    );

  const pageLimit =
    ensureNumber(
      pagination?.limit,
      registrationFilters?.limit ||
        20
    );

  const firstRecord =
    totalRecords > 0
      ? (currentPage - 1) *
          pageLimit +
        1
      : 0;

  const lastRecord =
    Math.min(
      currentPage * pageLimit,
      totalRecords
    );

  const activeFilterCount =
    useMemo(() => {
      const values = [
        registrationFilters?.status,
        registrationFilters
          ?.ticketStatus,
        registrationFilters
          ?.checkedIn,
        registrationFilters?.county,
        registrationFilters
          ?.participantType,
      ];

      return values.filter(
        (value) =>
          value !== "" &&
          value !== null &&
          value !== undefined
      ).length;
    }, [registrationFilters]);

  const hasFilters =
    Boolean(
      registrationFilters?.search
    ) ||
    activeFilterCount > 0;

  const allVisibleSelected =
    safeRegistrations.length >
      0 &&
    safeRegistrations.every(
      (registration) =>
        selectedIds.includes(
          getRegistrationId(
            registration
          )
        )
    );

  /* ========================================
     SEARCH
  ======================================== */

  const handleSearchSubmit = (
    event
  ) => {
    event.preventDefault();

    const filters = {
      ...registrationFilters,
      search:
        searchInput.trim(),
      page: 1,
    };

    updateRegistrationFilters({
      search:
        searchInput.trim(),
      page: 1,
    });

    loadRegistrations(filters);
  };

  const clearSearch = () => {
    setSearchInput("");

    const filters = {
      ...registrationFilters,
      search: "",
      page: 1,
    };

    updateRegistrationFilters({
      search: "",
      page: 1,
    });

    loadRegistrations(filters);
  };

  /* ========================================
     FILTERS
  ======================================== */

  const handleFilterChange = (
    key,
    value
  ) => {
    const filters = {
      ...registrationFilters,
      [key]: value,
      page: 1,
    };

    updateRegistrationFilters({
      [key]: value,
      page: 1,
    });

    loadRegistrations(filters);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedIds([]);

    resetRegistrationFilters();

    loadRegistrations({
      page: 1,
      limit: 20,
      county: "",
      countyCode: "",
      participantType: "",
      status: "",
      ticketStatus: "",
      checkedIn: "",
      search: "",
      sortBy: "registeredAt",
      sortOrder: "desc",
    });
  };

  /* ========================================
     PAGINATION
  ======================================== */

  const goToPage = (page) => {
    const safePage = Math.min(
      Math.max(page, 1),
      totalPages
    );

    const filters = {
      ...registrationFilters,
      page: safePage,
    };

    updateRegistrationFilters({
      page: safePage,
    });

    loadRegistrations(filters);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleLimitChange = (
    event
  ) => {
    const limit =
      ensureNumber(
        event.target.value,
        20
      );

    const filters = {
      ...registrationFilters,
      limit,
      page: 1,
    };

    updateRegistrationFilters({
      limit,
      page: 1,
    });

    loadRegistrations(filters);
  };

  /* ========================================
     SELECTION
  ======================================== */

  const toggleRegistration = (
    registrationId
  ) => {
    setSelectedIds(
      (current) =>
        current.includes(
          registrationId
        )
          ? current.filter(
              (id) =>
                id !==
                registrationId
            )
          : [
              ...current,
              registrationId,
            ]
    );
  };

  const toggleAllVisible = () => {
    const visibleIds =
      safeRegistrations
        .map(
          getRegistrationId
        )
        .filter(Boolean);

    if (allVisibleSelected) {
      setSelectedIds(
        (current) =>
          current.filter(
            (id) =>
              !visibleIds.includes(
                id
              )
          )
      );

      return;
    }

    setSelectedIds(
      (current) =>
        Array.from(
          new Set([
            ...current,
            ...visibleIds,
          ])
        )
    );
  };

  /* ========================================
     RENDER
  ======================================== */

  if (!SUMMIT_EVENT_ID) {
    return (
      <main className="summit-registrations-page">
        <section className="summit-registrations-state summit-registrations-error-state">
          <AlertCircle size={34} />

          <h1>
            Summit event ID is
            missing
          </h1>

          <p>
            Add
            <code>
              VITE_SUMMIT_EVENT_ID
            </code>
            to the client environment
            file and restart the
            frontend.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="summit-registrations-page">
      {/* ======================================
          HEADER
      ====================================== */}

      <header className="summit-registrations-header">
        <div>
          <Link
            to="/admin/summit"
            className="summit-registrations-back-link"
          >
            <ArrowLeft size={17} />
            Summit dashboard
          </Link>

          <div className="summit-registrations-title-row">
            <span className="summit-registrations-title-icon">
              <Users size={24} />
            </span>

            <div>
              <p>
                Summit management
              </p>

              <h1>
                Participant
                registrations
              </h1>
            </div>
          </div>

          <p className="summit-registrations-description">
            Search, review and
            manage all registrations
            submitted for the Coast
            Youth Summit.
          </p>
        </div>

        <div className="summit-registrations-header-actions">
          <button
            type="button"
            className="summit-registrations-secondary-button"
            onClick={() =>
              exportToCsv(
                safeRegistrations
              )
            }
            disabled={
              safeRegistrations.length ===
              0
            }
          >
            <Download size={18} />
            Export page
          </button>

          <button
            type="button"
            className="summit-registrations-primary-button"
            onClick={() =>
              loadRegistrations()
            }
            disabled={
              registrationsLoading
            }
          >
            <RefreshCw
              size={18}
              className={
                registrationsLoading
                  ? "is-spinning"
                  : ""
              }
            />
            Refresh
          </button>
        </div>
      </header>

      {/* ======================================
          SUMMARY
      ====================================== */}

      <section className="summit-registration-summary-grid">
        <article className="summit-registration-summary-card">
          <span>
            <Users size={20} />
          </span>

          <div>
            <small>
              Total registrations
            </small>

            <strong>
              {formatNumber(
                totalRecords
              )}
            </strong>
          </div>
        </article>

        <article className="summit-registration-summary-card">
          <span>
            <BadgeCheck
              size={20}
            />
          </span>

          <div>
            <small>
              Current page
            </small>

            <strong>
              {formatNumber(
                safeRegistrations.length
              )}
            </strong>
          </div>
        </article>

        <article className="summit-registration-summary-card">
          <span>
            <UserCheck
              size={20}
            />
          </span>

          <div>
            <small>
              Checked in on page
            </small>

            <strong>
              {formatNumber(
                safeRegistrations.filter(
                  isCheckedIn
                ).length
              )}
            </strong>
          </div>
        </article>

        <article className="summit-registration-summary-card">
          <span>
            <Ticket size={20} />
          </span>

          <div>
            <small>
              Tickets generated
            </small>

            <strong>
              {formatNumber(
                safeRegistrations.filter(
                  (registration) =>
                    Boolean(
                      getTicketNumber(
                        registration
                      )
                    )
                ).length
              )}
            </strong>
          </div>
        </article>
      </section>

      {/* ======================================
          ERROR
      ====================================== */}

      {registrationsError && (
        <div
          className="summit-registrations-alert"
          role="alert"
        >
          <AlertCircle
            size={19}
          />

          <span>
            {registrationsError}
          </span>

          <button
            type="button"
            onClick={() =>
              loadRegistrations()
            }
            aria-label="Retry loading registrations"
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================
          TOOLBAR
      ====================================== */}

      <section className="summit-registrations-toolbar">
        <form
          className="summit-registrations-search"
          onSubmit={
            handleSearchSubmit
          }
        >
          <Search
            size={18}
            aria-hidden="true"
          />

          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              setSearchInput(
                event.target.value
              )
            }
            placeholder="Search name, email, phone or ticket number"
            aria-label="Search summit registrations"
          />

          {searchInput && (
            <button
              type="button"
              className="summit-search-clear"
              onClick={
                clearSearch
              }
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}

          <button
            type="submit"
            className="summit-search-submit"
          >
            Search
          </button>
        </form>

        <button
          type="button"
          className={`summit-filter-toggle ${
            showFilters
              ? "is-active"
              : ""
          }`}
          onClick={() =>
            setShowFilters(
              (current) =>
                !current
            )
          }
        >
          <Filter size={18} />
          Filters

          {activeFilterCount >
            0 && (
            <span>
              {activeFilterCount}
            </span>
          )}
        </button>
      </section>

      {/* ======================================
          FILTER PANEL
      ====================================== */}

      {showFilters && (
        <section className="summit-registration-filter-panel">
          <div className="summit-registration-filter-grid">
            <label>
              <span>
                Registration status
              </span>

              <select
                value={
                  registrationFilters
                    ?.status || ""
                }
                onChange={(event) =>
                  handleFilterChange(
                    "status",
                    event.target.value
                  )
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
                Ticket status
              </span>

              <select
                value={
                  registrationFilters
                    ?.ticketStatus ||
                  ""
                }
                onChange={(event) =>
                  handleFilterChange(
                    "ticketStatus",
                    event.target.value
                  )
                }
              >
                {TICKET_STATUS_OPTIONS.map(
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
                Check-in status
              </span>

              <select
                value={
                  registrationFilters
                    ?.checkedIn || ""
                }
                onChange={(event) =>
                  handleFilterChange(
                    "checkedIn",
                    event.target.value
                  )
                }
              >
                {CHECK_IN_OPTIONS.map(
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
                County
              </span>

              <input
                type="text"
                value={
                  registrationFilters
                    ?.county || ""
                }
                onChange={(event) =>
                  updateRegistrationFilters({
                    county:
                      event.target.value,
                  })
                }
                onBlur={(event) =>
                  handleFilterChange(
                    "county",
                    event.target.value.trim()
                  )
                }
                placeholder="Enter county"
              />
            </label>

            <label>
              <span>
                Sort by
              </span>

              <select
                value={
                  registrationFilters
                    ?.sortBy ||
                  "registeredAt"
                }
                onChange={(event) =>
                  handleFilterChange(
                    "sortBy",
                    event.target.value
                  )
                }
              >
                <option value="registeredAt">
                  Registration date
                </option>

                <option value="firstName">
                  Participant name
                </option>

                <option value="status">
                  Registration status
                </option>

                <option value="county">
                  County
                </option>
              </select>
            </label>

            <label>
              <span>
                Sort order
              </span>

              <select
                value={
                  registrationFilters
                    ?.sortOrder ||
                  "desc"
                }
                onChange={(event) =>
                  handleFilterChange(
                    "sortOrder",
                    event.target.value
                  )
                }
              >
                <option value="desc">
                  Newest first
                </option>

                <option value="asc">
                  Oldest first
                </option>
              </select>
            </label>
          </div>

          <div className="summit-registration-filter-footer">
            <span>
              {activeFilterCount}
              {" "}
              active filter
              {activeFilterCount === 1
                ? ""
                : "s"}
            </span>

            <button
              type="button"
              onClick={
                handleResetFilters
              }
            >
              <X size={16} />
              Reset filters
            </button>
          </div>
        </section>
      )}

      {/* ======================================
          SELECTED ACTION BAR
      ====================================== */}

      {selectedIds.length >
        0 && (
        <section className="summit-selected-action-bar">
          <div>
            <Check size={18} />

            <strong>
              {selectedIds.length}
            </strong>

            <span>
              registration
              {selectedIds.length ===
              1
                ? ""
                : "s"}
              selected
            </span>
          </div>

          <div>
            <button
              type="button"
              onClick={() =>
                exportToCsv(
                  safeRegistrations.filter(
                    (registration) =>
                      selectedIds.includes(
                        getRegistrationId(
                          registration
                        )
                      )
                  )
                )
              }
            >
              <Download
                size={16}
              />
              Export selected
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedIds([])
              }
            >
              <X size={16} />
              Clear selection
            </button>
          </div>
        </section>
      )}

      {/* ======================================
          TABLE
      ====================================== */}

      <section className="summit-registrations-table-card">
        <div className="summit-registrations-table-wrapper">
          <table className="summit-registrations-table">
            <thead>
              <tr>
                <th className="summit-checkbox-column">
                  <label className="summit-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        allVisibleSelected
                      }
                      onChange={
                        toggleAllVisible
                      }
                      aria-label="Select all registrations on this page"
                    />

                    <span />
                  </label>
                </th>

                <th>
                  Participant
                </th>

                <th>
                  Contact
                </th>

                <th>
                  County
                </th>

                <th>
                  Registration
                </th>

                <th>
                  Ticket
                </th>

                <th>
                  Check-in
                </th>

                <th>
                  Registered
                </th>

                <th className="summit-actions-column">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {registrationsLoading &&
              safeRegistrations.length ===
                0 ? (
                <LoadingRow />
              ) : (
                safeRegistrations.map(
                  (registration) => {
                    const registrationId =
                      getRegistrationId(
                        registration
                      );

                    const participantName =
                      getParticipantName(
                        registration
                      );

                    const email =
                      getRegistrationEmail(
                        registration
                      );

                    const phone =
                      getRegistrationPhone(
                        registration
                      );

                    const county =
                      getCountyDetails(
                        registration
                      );

                    const status =
                      getRegistrationStatus(
                        registration
                      );

                    const ticketStatus =
                      getTicketStatus(
                        registration
                      );

                    const ticketNumber =
                      getTicketNumber(
                        registration
                      );

                    const checkedIn =
                      isCheckedIn(
                        registration
                      );

                    const selected =
                      selectedIds.includes(
                        registrationId
                      );

                    return (
                      <tr
                        key={
                          registrationId ||
                          ticketNumber ||
                          email
                        }
                        className={
                          selected
                            ? "is-selected"
                            : ""
                        }
                      >
                        <td className="summit-checkbox-column">
                          <label className="summit-checkbox">
                            <input
                              type="checkbox"
                              checked={
                                selected
                              }
                              onChange={() =>
                                toggleRegistration(
                                  registrationId
                                )
                              }
                              aria-label={`Select ${participantName}`}
                            />

                            <span />
                          </label>
                        </td>

                        <td>
                          <div className="summit-registration-participant">
                            <span className="summit-registration-avatar">
                              {getInitials(
                                participantName
                              )}
                            </span>

                            <div>
                              <strong>
                                {
                                  participantName
                                }
                              </strong>

                              <small>
                                {registration
                                  ?.participantType ||
                                  registration
                                    ?.category ||
                                  "Participant"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="summit-registration-contact">
                            <span>
                              <Mail
                                size={14}
                              />

                              {email ||
                                "No email"}
                            </span>

                            <small>
                              {phone ||
                                "No phone"}
                            </small>
                          </div>
                        </td>

                        <td>
                          <div className="summit-registration-county">
                            <MapPin
                              size={15}
                            />

                            <span>
                              <strong>
                                {
                                  county.name
                                }
                              </strong>

                              {county.code && (
                                <small>
                                  {
                                    county.code
                                  }
                                </small>
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`summit-registration-badge ${getStatusClassName(
                              status
                            )}`}
                          >
                            {formatStatus(
                              status
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="summit-registration-ticket">
                            <span
                              className={`summit-registration-badge ${getStatusClassName(
                                ticketStatus
                              )}`}
                            >
                              {formatStatus(
                                ticketStatus
                              )}
                            </span>

                            {ticketNumber && (
                              <small>
                                {
                                  ticketNumber
                                }
                              </small>
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`summit-check-in-indicator ${
                              checkedIn
                                ? "is-checked-in"
                                : "is-not-checked-in"
                            }`}
                          >
                            {checkedIn ? (
                              <Check
                                size={14}
                              />
                            ) : (
                              <CircleX
                                size={14}
                              />
                            )}

                            {checkedIn
                              ? "Checked in"
                              : "Not checked in"}
                          </span>
                        </td>

                        <td>
                          <time className="summit-registration-date">
                            {formatDateTime(
                              getRegisteredDate(
                                registration
                              )
                            )}
                          </time>
                        </td>

                        <td className="summit-actions-column">
                          <Link
                            to={`/admin/summit/registrations/${registrationId}`}
                            className="summit-view-registration-button"
                            aria-label={`View ${participantName}`}
                          >
                            <Eye
                              size={17}
                            />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>

        {!registrationsLoading &&
          safeRegistrations.length ===
            0 && (
            <EmptyState
              hasFilters={
                hasFilters
              }
              onReset={
                handleResetFilters
              }
            />
          )}

        {/* ====================================
            PAGINATION
        ===================================== */}

        <footer className="summit-registrations-pagination">
          <div className="summit-pagination-summary">
            <span>
              Showing{" "}
              <strong>
                {formatNumber(
                  firstRecord
                )}
              </strong>
              {" "}to{" "}
              <strong>
                {formatNumber(
                  lastRecord
                )}
              </strong>
              {" "}of{" "}
              <strong>
                {formatNumber(
                  totalRecords
                )}
              </strong>
            </span>

            <label>
              Rows per page

              <select
                value={
                  registrationFilters
                    ?.limit ||
                  pageLimit
                }
                onChange={
                  handleLimitChange
                }
              >
                {PAGE_SIZE_OPTIONS.map(
                  (size) => (
                    <option
                      value={size}
                      key={size}
                    >
                      {size}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <div className="summit-pagination-controls">
            <button
              type="button"
              onClick={() =>
                goToPage(1)
              }
              disabled={
                currentPage <= 1 ||
                registrationsLoading
              }
              aria-label="Go to first page"
            >
              <ChevronLeft
                size={16}
              />
              <ChevronLeft
                size={16}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                goToPage(
                  currentPage - 1
                )
              }
              disabled={
                currentPage <= 1 ||
                registrationsLoading
              }
            >
              <ChevronLeft
                size={17}
              />
              Previous
            </button>

            <span>
              Page{" "}
              <strong>
                {currentPage}
              </strong>
              {" "}of{" "}
              <strong>
                {totalPages}
              </strong>
            </span>

            <button
              type="button"
              onClick={() =>
                goToPage(
                  currentPage + 1
                )
              }
              disabled={
                currentPage >=
                  totalPages ||
                registrationsLoading
              }
            >
              Next
              <ChevronRight
                size={17}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                goToPage(
                  totalPages
                )
              }
              disabled={
                currentPage >=
                  totalPages ||
                registrationsLoading
              }
              aria-label="Go to last page"
            >
              <ChevronRight
                size={16}
              />
              <ChevronRight
                size={16}
              />
            </button>
          </div>
        </footer>
      </section>

      <div className="summit-registration-footer-note">
        <CalendarDays size={16} />

        Registration information is
        loaded directly from the
        Summit administration API.
      </div>
    </main>
  );
};

export default SummitRegistrations;