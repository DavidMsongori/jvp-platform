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
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  MapPinned,
  RefreshCw,
  ScanLine,
  Ticket,
  UserCheck,
  Users,
} from "lucide-react";

import {
  useSummit,
} from "../../../context/SummitContext";

import {
  getSummitExhibitors,
} from "../../../services/summitExhibitor.service";

import "./SummitDashboard.css";

/* ==========================================
   CONFIGURATION
========================================== */

const SUMMIT_EVENT_ID =
  import.meta.env.VITE_SUMMIT_EVENT_ID;

/* ==========================================
   HELPERS
========================================== */

const ensureNumber = (
  value,
  fallback = 0
) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
};

const formatNumber = (value) => {
  return new Intl.NumberFormat(
    "en-KE"
  ).format(ensureNumber(value));
};

const formatDate = (
  value,
  options = {}
) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...options,
    }
  ).format(date);
};

const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
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


const formatExhibitorStatus = (
  value
) => {
  if (!value) {
    return "Pending";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
};

const getInitials = (name) => {
  if (!name) {
    return "NA";
  }

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
};

const getStatusClassName = (
  status
) => {
  const normalizedStatus = String(
    status || ""
  ).toLowerCase();

  if (
    [
      "confirmed",
      "active",
      "checked_in",
      "checked in",
      "completed",
    ].includes(normalizedStatus)
  ) {
    return "is-success";
  }

  if (
    [
      "pending",
      "pending_payment",
      "processing",
    ].includes(normalizedStatus)
  ) {
    return "is-warning";
  }

  if (
    [
      "cancelled",
      "inactive",
      "expired",
      "rejected",
    ].includes(normalizedStatus)
  ) {
    return "is-danger";
  }

  return "is-neutral";
};

const getDashboardPayload = (
  dashboard
) => {
  if (!dashboard) {
    return {};
  }

  return (
    dashboard.dashboard ||
    dashboard.statistics ||
    dashboard
  );
};

const getSummitEvent = (
  dashboard
) => {
  if (!dashboard) {
    return {};
  }

  return (
    dashboard.summitEvent ||
    dashboard.event ||
    dashboard.summit ||
    dashboard.dashboard
      ?.summitEvent ||
    {}
  );
};

const getCountyStatistics = (
  dashboard
) => {
  const payload =
    getDashboardPayload(
      dashboard
    );

  const countyData =
    dashboard?.countyStatistics ||
    dashboard?.counties ||
    payload?.countyStatistics ||
    payload?.counties ||
    [];

  return Array.isArray(countyData)
    ? countyData
    : [];
};

const getRecentRegistrations = (
  dashboard
) => {
  const payload =
    getDashboardPayload(
      dashboard
    );

  const registrations =
    dashboard
      ?.recentRegistrations ||
    dashboard?.registrations ||
    payload?.recentRegistrations ||
    payload?.registrations ||
    [];

  return Array.isArray(
    registrations
  )
    ? registrations
    : [];
};

const getCountyName = (countyRecord) => {
  if (!countyRecord) {
    return "Unknown county";
  }

  const countyValue =
    countyRecord?.county ??
    countyRecord?.countyName ??
    countyRecord?.name ??
    countyRecord?._id;

  if (typeof countyValue === "string") {
    return countyValue;
  }

  if (
    countyValue &&
    typeof countyValue === "object"
  ) {
    return (
      countyValue?.county ||
      countyValue?.countyName ||
      countyValue?.name ||
      "Unknown county"
    );
  }

  return "Unknown county";
};

const getCountyCode = (
  countyRecord
) => {
  if (!countyRecord) {
    return "";
  }

  const countyValue =
    countyRecord?.county;

  return (
    countyRecord?.countyCode ||
    countyRecord?.code ||
    countyValue?.countyCode ||
    countyValue?.code ||
    ""
  );
};

const getCountyRegistered = (
  county
) => {
  return ensureNumber(
    county?.registered ??
      county?.totalRegistered ??
      county?.registrations ??
      county?.count ??
      county?.total
  );
};

const getCountyCapacity = (
  county
) => {
  return ensureNumber(
    county?.capacity ??
      county?.allocatedSlots ??
      county?.quota ??
      county?.maximumSlots ??
      county?.maxCapacity
  );
};

const getParticipantName = (
  registration
) => {
  return (
    registration?.fullName ||
    registration?.participantName ||
    [
      registration?.firstName,
      registration?.middleName,
      registration?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Unnamed participant"
  );
};

const getVenueDetails = (event) => {
  const venue =
    event?.venue ||
    event?.location ||
    event?.venueName;

  if (!venue) {
    return {
      name: "",
      address: "",
      county: "",
      mapUrl: "",
      displayText: "",
    };
  }

  if (typeof venue === "string") {
    return {
      name: venue,
      address: "",
      county: "",
      mapUrl: "",
      displayText: venue,
    };
  }

  const name =
    venue?.name ||
    venue?.venueName ||
    "";

  const address =
    venue?.address ||
    venue?.physicalAddress ||
    "";

  const county =
    venue?.county ||
    "";

  const mapUrl =
    venue?.mapUrl ||
    venue?.googleMapsUrl ||
    "";

  const displayText = [
    name,
    address,
    county,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    name,
    address,
    county,
    mapUrl,
    displayText,
  };
};

/* ==========================================
   LOADING SKELETON
========================================== */

const SummitDashboardSkeleton =
  () => {
    return (
      <div
        className="summit-admin-dashboard"
        aria-busy="true"
        aria-label="Loading summit dashboard"
      >
        <div className="summit-dashboard-header summit-skeleton-header">
          <div>
            <div className="summit-skeleton summit-skeleton-title" />
            <div className="summit-skeleton summit-skeleton-subtitle" />
          </div>

          <div className="summit-skeleton summit-skeleton-button" />
        </div>

        <div className="summit-stat-grid">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              className="summit-stat-card"
              key={index}
            >
              <div className="summit-skeleton summit-skeleton-icon" />
              <div className="summit-skeleton summit-skeleton-stat-label" />
              <div className="summit-skeleton summit-skeleton-stat-value" />
              <div className="summit-skeleton summit-skeleton-stat-footer" />
            </div>
          ))}
        </div>

       <div className="summit-dashboard-grid summit-dashboard-grid-three">
          <div className="summit-dashboard-panel">
            <div className="summit-skeleton summit-skeleton-panel-title" />

            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                className="summit-skeleton summit-skeleton-row"
                key={index}
              />
            ))}
          </div>

          <div className="summit-dashboard-panel">
            <div className="summit-skeleton summit-skeleton-panel-title" />

            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                className="summit-skeleton summit-skeleton-row"
                key={index}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

/* ==========================================
   STAT CARD
========================================== */

const SummitStatCard = ({
  title,
  value,
  helper,
  icon: Icon,
  variant,
  progress,
}) => {
  const safeProgress = Math.min(
    Math.max(
      ensureNumber(progress),
      0
    ),
    100
  );

  return (
    <article
      className={`summit-stat-card ${variant}`}
    >
      <div className="summit-stat-card-top">
        <div className="summit-stat-icon">
          <Icon
            size={22}
            aria-hidden="true"
          />
        </div>

        {progress !==
          undefined && (
          <span className="summit-stat-percent">
            {Math.round(
              safeProgress
            )}
            %
          </span>
        )}
      </div>

      <p className="summit-stat-label">
        {title}
      </p>

      <h3 className="summit-stat-value">
        {formatNumber(value)}
      </h3>

      <p className="summit-stat-helper">
        {helper}
      </p>

      {progress !==
        undefined && (
        <div
          className="summit-stat-progress"
          role="progressbar"
          aria-label={`${title} progress`}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={Math.round(
            safeProgress
          )}
        >
          <span
            style={{
              width: `${safeProgress}%`,
            }}
          />
        </div>
      )}
    </article>
  );
};

/* ==========================================
   MAIN COMPONENT
========================================== */

const SummitDashboard = () => {
  const {
    adminDashboard,
    dashboardLoading,
    dashboardError,
    fetchAdminDashboard,
  } = useSummit();

    const [
    recentExhibitors,
    setRecentExhibitors,
  ] = useState([]);

  const [
    exhibitorsLoading,
    setExhibitorsLoading,
  ] = useState(true);

  const [
    totalExhibitors,
    setTotalExhibitors,
  ] = useState(0);

  const [
    exhibitorsError,
    setExhibitorsError,
  ] = useState("");

  const loadDashboard =
    useCallback(async () => {
      if (!SUMMIT_EVENT_ID) {
        return;
      }

      await fetchAdminDashboard(
        SUMMIT_EVENT_ID
      );
    }, [
      fetchAdminDashboard,
    ]);

  const loadRecentExhibitors =
    useCallback(async () => {
      try {
        setExhibitorsLoading(
          true
        );

        setExhibitorsError("");

        const response =
          await getSummitExhibitors({
            summitEventId:
              SUMMIT_EVENT_ID,

            page: 1,
            limit: 6,
          });

        const result =
          response?.data?.data ||
          response?.data ||
          response ||
          {};

        setRecentExhibitors(
          Array.isArray(
            result?.exhibitors
          )
            ? result.exhibitors
            : []
        );

        setTotalExhibitors(
          ensureNumber(
            result?.pagination
              ?.total
          )
        );
      } catch (error) {
        console.error(
          "Unable to load recent exhibitors:",
          error
        );

        setRecentExhibitors(
          []
        );

        setTotalExhibitors(
          0
        );

        setExhibitorsError(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Unable to load exhibitors."
        );
      } finally {
        setExhibitorsLoading(
          false
        );
      }
    }, []);



  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

   useEffect(() => {
    loadRecentExhibitors();
  }, [
    loadRecentExhibitors,
  ]);

  const dashboardData =
    useMemo(
      () =>
        getDashboardPayload(
          adminDashboard
        ),
      [adminDashboard]
    );

  const summitEvent = useMemo(
    () =>
      getSummitEvent(
        adminDashboard
      ),
    [adminDashboard]
  );

  const countyStatistics =
    useMemo(
      () =>
        getCountyStatistics(
          adminDashboard
        ),
      [adminDashboard]
    );

  const recentRegistrations =
    useMemo(
      () =>
        getRecentRegistrations(
          adminDashboard
        ),
      [adminDashboard]
    );

  const statistics =
    useMemo(() => {
      const totalRegistered =
        ensureNumber(
          dashboardData
            ?.totalRegistered ??
            dashboardData
              ?.totalRegistrations ??
            dashboardData
              ?.registeredParticipants ??
            adminDashboard
              ?.totalRegistered
        );

      const totalCapacity =
        ensureNumber(
          dashboardData
            ?.totalCapacity ??
            dashboardData
              ?.capacity ??
            dashboardData
              ?.maximumCapacity ??
            summitEvent
              ?.totalCapacity
        );

      const backendRemainingSlots =
        dashboardData
          ?.remainingSlots ??
        adminDashboard
          ?.remainingSlots;

      const remainingSlots =
        backendRemainingSlots !==
        undefined
          ? ensureNumber(
              backendRemainingSlots
            )
          : Math.max(
              totalCapacity -
                totalRegistered,
              0
            );

      const confirmed =
        ensureNumber(
          dashboardData
            ?.confirmed ??
            dashboardData
              ?.confirmedRegistrations ??
            dashboardData
              ?.totalConfirmed ??
            adminDashboard
              ?.confirmedRegistrations
        );

      const checkedIn =
        ensureNumber(
          dashboardData
            ?.checkedIn ??
            dashboardData
              ?.checkedInParticipants ??
            dashboardData
              ?.totalCheckedIn ??
            adminDashboard
              ?.checkedInParticipants
        );

      const cancelled =
        ensureNumber(
          dashboardData
            ?.cancelled ??
            dashboardData
              ?.cancelledRegistrations ??
            dashboardData
              ?.totalCancelled ??
            adminDashboard
              ?.cancelledRegistrations
        );

      const issuedTickets =
        ensureNumber(
          dashboardData
            ?.ticketsGenerated ??
            dashboardData
              ?.generatedTickets ??
            dashboardData
              ?.totalTickets ??
            totalRegistered
        );

      const registrationProgress =
        totalCapacity > 0
          ? (totalRegistered /
              totalCapacity) *
            100
          : 0;

      const checkInProgress =
        confirmed > 0
          ? (checkedIn /
              confirmed) *
            100
          : 0;

      return {
        totalRegistered,
        totalCapacity,
        remainingSlots,
        confirmed,
        checkedIn,
        cancelled,
        issuedTickets,
        registrationProgress,
        checkInProgress,
      };
    }, [
      adminDashboard,
      dashboardData,
      summitEvent,
    ]);

  const summitTitle =
    summitEvent?.title ||
    summitEvent?.name ||
    adminDashboard
      ?.summitTitle ||
    "Coast Youth Summit 2026";

  const summitDate =
    summitEvent?.startDate ||
    summitEvent?.eventDate ||
    summitEvent?.date;

    

const summitVenue = getVenueDetails(summitEvent);

  if (
    dashboardLoading &&
    !adminDashboard
  ) {
    return (
      <SummitDashboardSkeleton />
    );
  }

  if (!SUMMIT_EVENT_ID) {
    return (
      <main className="summit-admin-dashboard">
        <section className="summit-dashboard-state summit-dashboard-state-error">
          <div className="summit-state-icon">
            <AlertCircle
              size={30}
              aria-hidden="true"
            />
          </div>

          <h1>
            Summit event ID is
            missing
          </h1>

          <p>
            Add the following
            variable to the
            client environment
            file, then restart
            the development
            server.
          </p>

          <code>
            VITE_SUMMIT_EVENT_ID=your_summit_event_id
          </code>
        </section>
      </main>
    );
  }

  if (
    dashboardError &&
    !adminDashboard
  ) {
    return (
      <main className="summit-admin-dashboard">
        <section className="summit-dashboard-state summit-dashboard-state-error">
          <div className="summit-state-icon">
            <AlertCircle
              size={30}
              aria-hidden="true"
            />
          </div>

          <h1>
            Unable to load the
            summit dashboard
          </h1>

          <p>
            {dashboardError}
          </p>

          <button
            type="button"
            className="summit-primary-button"
            onClick={
              loadDashboard
            }
            disabled={
              dashboardLoading
            }
          >
            <RefreshCw
              size={18}
              className={
                dashboardLoading
                  ? "is-spinning"
                  : ""
              }
            />

            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="summit-admin-dashboard">
      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <header className="summit-dashboard-header">
        <div className="summit-dashboard-heading">
          <div className="summit-dashboard-eyebrow">
            <CalendarDays
              size={16}
              aria-hidden="true"
            />
            Summit management
          </div>

          <h1>{summitTitle}</h1>

          <div className="summit-dashboard-meta">
            {summitDate && (
              <span>
                <Clock3
                  size={16}
                  aria-hidden="true"
                />
                {formatDate(
                  summitDate,
                  {
                    weekday:
                      "short",
                  }
                )}
              </span>
            )}

            {summitVenue.displayText && (
  summitVenue.mapUrl ? (
    <a
      href={summitVenue.mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="summit-dashboard-location-link"
    >
      <MapPinned
        size={16}
        aria-hidden="true"
      />

      <span>
        {summitVenue.displayText}
      </span>
    </a>
  ) : (
    <span>
      <MapPinned
        size={16}
        aria-hidden="true"
      />

      {summitVenue.displayText}
    </span>
  )
)}
          </div>
        </div>

        <div className="summit-dashboard-header-actions">
          <button
            type="button"
            className="summit-secondary-button"
            onClick={
              loadDashboard
            }
            disabled={
              dashboardLoading
            }
          >
            <RefreshCw
              size={18}
              className={
                dashboardLoading
                  ? "is-spinning"
                  : ""
              }
            />

            Refresh
          </button>

          <Link
            to="/admin/summit/check-in"
            className="summit-primary-button"
          >
            <ScanLine
              size={18}
              aria-hidden="true"
            />
            Open check-in
          </Link>
        </div>
      </header>

      {dashboardError && (
        <div
          className="summit-inline-alert"
          role="alert"
        >
          <AlertCircle
            size={18}
            aria-hidden="true"
          />

          <span>
            {dashboardError}
            The previously
            loaded information
            is still displayed.
          </span>
        </div>
      )}

      {/* ======================================
          STATISTICS
      ====================================== */}

      <section
        className="summit-stat-grid"
        aria-label="Summit statistics"
      >
        <SummitStatCard
          title="Total registered"
          value={
            statistics
              .totalRegistered
          }
          helper={
            statistics
              .totalCapacity >
            0
              ? `of ${formatNumber(
                  statistics
                    .totalCapacity
                )} available slots`
              : "Registered participants"
          }
          icon={Users}
          variant="summit-stat-card-primary"
          progress={
            statistics
              .totalCapacity >
            0
              ? statistics
                  .registrationProgress
              : undefined
          }
        />

        <SummitStatCard
          title="Remaining slots"
          value={
            statistics
              .remainingSlots
          }
          helper={
            statistics
              .remainingSlots >
            0
              ? "Registration capacity available"
              : "Registration capacity reached"
          }
          icon={Ticket}
          variant="summit-stat-card-accent"
        />

        <SummitStatCard
          title="Confirmed"
          value={
            statistics.confirmed
          }
          helper={`${formatNumber(
            statistics
              .cancelled
          )} cancelled registrations`}
          icon={BadgeCheck}
          variant="summit-stat-card-success"
        />

        <SummitStatCard
          title="Checked in"
          value={
            statistics.checkedIn
          }
          helper={
            statistics.confirmed >
            0
              ? `${formatNumber(
                  statistics.confirmed -
                    statistics.checkedIn
                )} confirmed participants pending`
              : "No confirmed participants yet"
          }
          icon={UserCheck}
          variant="summit-stat-card-info"
          progress={
            statistics.confirmed >
            0
              ? statistics
                  .checkInProgress
              : undefined
          }
        />
      </section>

      {/* ======================================
          QUICK ACTIONS
      ====================================== */}

      <section className="summit-quick-actions">
        <div className="summit-quick-actions-copy">
          <h2>
            Summit operations
          </h2>

          <p>
            Manage participants,
            tickets, check-in and
            summit communication.
          </p>
        </div>

        <div className="summit-quick-action-links">
          <Link
            to="/admin/summit/registrations"
            className="summit-quick-action-card"
          >
            <span className="summit-quick-action-icon">
              <Users
                size={21}
                aria-hidden="true"
              />
            </span>

            <span>
              <strong>
                Registrations
              </strong>
              <small>
                Search and manage
                participants
              </small>
            </span>

            <ArrowRight
              size={18}
              aria-hidden="true"
            />
          </Link>

          <Link
            to="/admin/summit/check-in"
            className="summit-quick-action-card"
          >
            <span className="summit-quick-action-icon">
              <ScanLine
                size={21}
                aria-hidden="true"
              />
            </span>

            <span>
              <strong>
                Participant
                check-in
              </strong>
              <small>
                Scan or enter
                ticket numbers
              </small>
            </span>

            <ArrowRight
              size={18}
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      {/* ======================================
          COUNTY AND RECENT REGISTRATIONS
      ====================================== */}

      <div className="summit-dashboard-grid">
        {/* COUNTY DISTRIBUTION */}

        <section className="summit-dashboard-panel">
          <div className="summit-panel-header">
            <div>
              <p className="summit-panel-eyebrow">
                Distribution
              </p>

              <h2>
                County
                registrations
              </h2>
            </div>

            <MapPinned
              size={21}
              aria-hidden="true"
            />
          </div>

          {countyStatistics.length >
          0 ? (
            <div className="summit-county-list">
              {countyStatistics.map(
                (
                  county,
                  index
                ) => {
                  const countyName =
                    getCountyName(
                      county
                    );

                  const countyCode =
                    getCountyCode(
                      county
                    );

                  const registered =
                    getCountyRegistered(
                      county
                    );

                  const capacity =
                    getCountyCapacity(
                      county
                    );

                  const progress =
                    capacity > 0
                      ? Math.min(
                          (registered /
                            capacity) *
                            100,
                          100
                        )
                      : 0;

                  return (
                    <article
                      className="summit-county-row"
                      key={
                        countyCode ||
                        countyName ||
                        index
                      }
                    >
                      <div className="summit-county-row-top">
                        <div>
                          <strong>
                            {
                              countyName
                            }
                          </strong>

                          {countyCode && (
                            <span>
                              {
                                countyCode
                              }
                            </span>
                          )}
                        </div>

                        <p>
                          <strong>
                            {formatNumber(
                              registered
                            )}
                          </strong>

                          {capacity >
                            0 && (
                            <>
                              {" "}
                              /{" "}
                              {formatNumber(
                                capacity
                              )}
                            </>
                          )}
                        </p>
                      </div>

                      {capacity >
                        0 && (
                        <div
                          className="summit-county-progress"
                          role="progressbar"
                          aria-label={`${countyName} registration capacity`}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-valuenow={Math.round(
                            progress
                          )}
                        >
                          <span
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      )}

                      <div className="summit-county-row-footer">
                        <span>
                          {capacity >
                          0
                            ? `${Math.round(
                                progress
                              )}% filled`
                            : "Registrations"}
                        </span>

                        {capacity >
                          0 && (
                          <span>
                            {formatNumber(
                              Math.max(
                                capacity -
                                  registered,
                                0
                              )
                            )}{" "}
                            remaining
                          </span>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <div className="summit-panel-empty">
              <MapPinned
                size={30}
                aria-hidden="true"
              />

              <h3>
                No county
                statistics
              </h3>

              <p>
                County registration
                data will appear
                when participants
                register.
              </p>
            </div>
          )}
        </section>

        {/* RECENT REGISTRATIONS */}

        <section className="summit-dashboard-panel">
          <div className="summit-panel-header">
            <div>
              <p className="summit-panel-eyebrow">
                Latest activity
              </p>

              <h2>
                Recent
                registrations
              </h2>
            </div>

            <Link
              to="/admin/summit/registrations"
              className="summit-panel-link"
            >
              View all
              <ArrowRight
                size={16}
                aria-hidden="true"
              />
            </Link>
          </div>

          {recentRegistrations.length >
          0 ? (
            <div className="summit-recent-list">
              {recentRegistrations
                .slice(0, 6)
                .map(
                  (
                    registration,
                    index
                  ) => {
                    const participantName =
                      getParticipantName(
                        registration
                      );

                    const registrationId =
                      registration?._id ||
                      registration?.id;

                    const status =
                      registration?.status ||
                      "confirmed";

                    return (
                      <Link
                        className="summit-recent-row"
                        key={
                          registrationId ||
                          registration
                            ?.ticketNumber ||
                          index
                        }
                        to={
                          registrationId
                            ? `/admin/summit/registrations/${registrationId}`
                            : "/admin/summit/registrations"
                        }
                      >
                        <span className="summit-participant-avatar">
                          {getInitials(
                            participantName
                          )}
                        </span>

                        <span className="summit-participant-details">
                          <strong>
                            {
                              participantName
                            }
                          </strong>

                         <small>
  {getCountyName(
    registration
  )}

  {registration?.ticketNumber
    ? ` • ${registration.ticketNumber}`
    : ""}
</small>
                        </span>

                        <span className="summit-recent-meta">
                          <span
                            className={`summit-status-badge ${getStatusClassName(
                              status
                            )}`}
                          >
                            {formatStatus(
                              status
                            )}
                          </span>

                          <time>
                            {formatDateTime(
                              registration?.registeredAt ||
                                registration?.createdAt
                            )}
                          </time>
                        </span>
                      </Link>
                    );
                  }
                )}
            </div>
          ) : (
            <div className="summit-panel-empty">
              <Users
                size={30}
                aria-hidden="true"
              />

              <h3>
                No registrations
                yet
              </h3>

              <p>
                New participant
                registrations will
                appear here.
              </p>
            </div>
          )}
               </section>

        {/* RECENT EXHIBITORS */}

        <section className="summit-dashboard-panel summit-dashboard-exhibitors">
          <div className="summit-panel-header">
            <div>
              <p className="summit-panel-eyebrow">
                Exhibitor activity
              </p>

              <h2>
                Recent exhibitors
              </h2>
            </div>

            <Link
              to="/admin/summit/exhibitors"
              className="summit-panel-link"
            >
              View all

              <ArrowRight
                size={16}
                aria-hidden="true"
              />
            </Link>
          </div>

          {exhibitorsLoading ? (
            <div className="summit-panel-empty">
              <RefreshCw
                size={28}
                className="is-spinning"
                aria-hidden="true"
              />

              <h3>
                Loading exhibitors
              </h3>

              <p>
                Retrieving recent
                exhibitor applications.
              </p>
            </div>
          ) : exhibitorsError ? (
            <div className="summit-panel-empty">
              <AlertCircle
                size={30}
                aria-hidden="true"
              />

              <h3>
                Unable to load
                exhibitors
              </h3>

              <p>
                {exhibitorsError}
              </p>

              <button
                type="button"
                className="summit-secondary-button"
                onClick={
                  loadRecentExhibitors
                }
              >
                Try again
              </button>
            </div>
          ) : recentExhibitors.length >
            0 ? (
            <>
              <div className="summit-recent-list">
                {recentExhibitors.map(
                  (
                    exhibitor,
                    index
                  ) => {
                    const organizationName =
                      exhibitor.organizationName ||
                      "Unnamed organization";

                    const exhibitorId =
                      exhibitor._id ||
                      exhibitor.id;

                    const status =
                      exhibitor.status ||
                      "pending";

                    return (
                      <Link
                        className="summit-recent-row"
                        key={
                          exhibitorId ||
                          index
                        }
                        to="/admin/summit/exhibitors"
                      >
                        <span className="summit-participant-avatar">
                          {getInitials(
                            organizationName
                          )}
                        </span>

                        <span className="summit-participant-details">
                          <strong>
                            {
                              organizationName
                            }
                          </strong>

                          <small>
                            {exhibitor.packageName ||
                              formatStatus(
                                exhibitor.packageId
                              )}

                            {exhibitor.county
                              ? ` • ${exhibitor.county}`
                              : ""}
                          </small>
                        </span>

                        <span className="summit-recent-meta">
                          <span
                            className={`summit-status-badge ${getStatusClassName(
                              status
                            )}`}
                          >
                            {formatStatus(
                              status
                            )}
                          </span>

                          <time>
                            {formatDateTime(
                              exhibitor.submittedAt ||
                                exhibitor.createdAt
                            )}
                          </time>
                        </span>
                      </Link>
                    );
                  }
                )}
              </div>

              <div className="summit-exhibitor-total">
                <span>
                  Total exhibitor
                  applications
                </span>

                <strong>
                  {formatNumber(
                    totalExhibitors
                  )}
                </strong>
              </div>
            </>
          ) : (
            <div className="summit-panel-empty">
              <Users
                size={30}
                aria-hidden="true"
              />

              <h3>
                No exhibitors yet
              </h3>

              <p>
                New exhibitor
                applications will appear
                here.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ======================================
          SUMMARY FOOTER
      ====================================== */}

      <section className="summit-summary-strip">
        <div>
          <span className="summit-summary-icon">
            <Ticket
              size={20}
              aria-hidden="true"
            />
          </span>

          <div>
            <strong>
              {formatNumber(
                statistics
                  .issuedTickets
              )}
            </strong>
            <span>
              Tickets generated
            </span>
          </div>
        </div>

        <div>
          <span className="summit-summary-icon">
            <CheckCircle2
              size={20}
              aria-hidden="true"
            />
          </span>

          <div>
            <strong>
              {formatNumber(
                statistics.confirmed
              )}
            </strong>
            <span>
              Confirmed
              registrations
            </span>
          </div>
        </div>

        <div>
          <span className="summit-summary-icon">
            <Download
              size={20}
              aria-hidden="true"
            />
          </span>

          <div>
            <strong>
              {formatNumber(
                statistics.checkedIn
              )}
            </strong>
            <span>
              Participants checked
              in
            </span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default SummitDashboard;