import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  cancelMeeting,
  createMeeting,
  deleteMeeting,
  endMeeting,
  getMeetingById,
  getMeetings,
  getMeetingStatistics,
  scheduleMeeting,
  startMeeting,
} from "../../services/meeting.service";

import "./LeadershipMeeting.css";

/* ==========================================================
   CONSTANTS
========================================================== */

const INITIAL_FILTERS = {
  search: "",
  status: "",
  meetingType: "",
  format: "",
  page: 1,
  limit: 10,
  sortBy: "upcoming",
};

const INITIAL_MEETING_FORM = {
  title: "",
  description: "",
  meetingType: "regional_executive",
  format: "jvp_connect",
  leadershipLevel: "regional",
  department: "executive",
  scheduledStart: "",
  scheduledEnd: "",
  timezone: "Africa/Nairobi",

  scope: {
    level: "custom",
    county: "",
    constituency: "",
    ward: "",
    committee: "",
  },

  venue: {
    name: "",
    address: "",
    county: "",
    mapUrl: "",
  },

  liveRoom: {
    enabled: true,
    waitingRoomEnabled: true,
    requireAuthentication: true,
    allowGuests: false,
    allowParticipantScreenShare: false,
    allowParticipantChat: true,
    allowParticipantMicrophone: true,
    allowParticipantCamera: true,
    muteParticipantsOnEntry: true,
    disableCameraOnEntry: true,
    maximumParticipants: 50,
    mediaMode: "peer_to_peer",
  },

  recording: {
    enabled: false,
    consentRequired: true,
  },
};

const STATUS_LABELS = {
  draft: "Draft",
  scheduled: "Scheduled",
  postponed: "Postponed",
  live: "Live",
  completed: "Completed",
  cancelled: "Cancelled",
};

const MEETING_TYPE_LABELS = {
  regional_executive:
    "Regional Executive Meeting",
  county_leadership:
    "County Leadership Meeting",
  constituency_leadership:
    "Constituency Leadership Meeting",
  ward_leadership:
    "Ward Leadership Meeting",
  committee:
    "Committee Meeting",
  department:
    "Department Meeting",
  special:
    "Special Meeting",
  emergency:
    "Emergency Meeting",
  annual_general:
    "Annual General Meeting",
  other:
    "Other Meeting",
};

const FORMAT_LABELS = {
  jvp_connect: "JVP Connect",
  physical: "Physical",
  hybrid: "Hybrid",
};

/* ==========================================================
   RESPONSE HELPERS
========================================================== */

const getResponsePayload = (
  response
) => {
  return (
    response?.data?.data ||
    response?.data ||
    response ||
    {}
  );
};

const getMeetingCollection = (
  response
) => {
  const payload =
    getResponsePayload(response);

  return {
    meetings:
      payload?.meetings ||
      payload?.data?.meetings ||
      [],

    pagination:
      payload?.pagination ||
      payload?.data?.pagination ||
      {},
  };
};

const getSingleMeeting = (
  response
) => {
  const payload =
    getResponsePayload(response);

  return (
    payload?.meeting ||
    payload?.data?.meeting ||
    payload
  );
};

const getApiErrorMessage = (
  error,
  fallbackMessage
) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

/* ==========================================================
   DATE HELPERS
========================================================== */

const formatDate = (
  value
) => {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Nairobi",
    }
  ).format(date);
};

const formatShortDate = (
  value
) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Nairobi",
    }
  ).format(date);
};

const toISOStringFromLocalInput = (
  value
) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return date.toISOString();
};

/* ==========================================================
   COMPONENT
========================================================== */

const LeadershipMeeting = () => {
    const navigate = useNavigate();
  const [
    meetings,
    setMeetings,
  ] = useState([]);

  const [
    statistics,
    setStatistics,
  ] = useState({});

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [
    filters,
    setFilters,
  ] = useState(
    INITIAL_FILTERS
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    createModalOpen,
    setCreateModalOpen,
  ] = useState(false);

  const [
    detailsModalOpen,
    setDetailsModalOpen,
  ] = useState(false);

  const [
    selectedMeeting,
    setSelectedMeeting,
  ] = useState(null);

  const [
    formData,
    setFormData,
  ] = useState(
    INITIAL_MEETING_FORM
  );

  /* ========================================================
     DATA LOADING
  ======================================================== */

  const loadMeetings =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const query = {
          page: filters.page,
          limit: filters.limit,
          sortBy: filters.sortBy,
        };

        if (filters.search.trim()) {
          query.search =
            filters.search.trim();
        }

        if (filters.status) {
          query.status =
            filters.status;
        }

        if (filters.meetingType) {
          query.meetingType =
            filters.meetingType;
        }

        if (filters.format) {
          query.format =
            filters.format;
        }

        const response =
          await getMeetings(query);

        const result =
          getMeetingCollection(
            response
          );

        setMeetings(
          result.meetings
        );

        setPagination(
          (previous) => ({
            ...previous,
            ...result.pagination,
          })
        );
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            "Unable to load meetings."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [filters]);

  const loadStatistics =
    useCallback(async () => {
      try {
        const response =
          await getMeetingStatistics();

        const payload =
          getResponsePayload(
            response
          );

        setStatistics(
          payload?.statistics ||
            payload ||
            {}
        );
      } catch (requestError) {
        console.error(
          "Meeting statistics error:",
          requestError
        );
      }
    }, []);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        loadMeetings();
      }, 250);

    return () =>
      window.clearTimeout(
        timeoutId
      );
  }, [loadMeetings]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  /* ========================================================
     DERIVED STATISTICS
  ======================================================== */

  const dashboardStatistics =
    useMemo(() => {
      const localStatistics =
        meetings.reduce(
          (summary, meeting) => {
            const status =
              meeting?.status;

            if (
              Object.hasOwn(
                summary,
                status
              )
            ) {
              summary[status] += 1;
            }

            return summary;
          },
          {
            draft: 0,
            scheduled: 0,
            live: 0,
            completed: 0,
          }
        );

      return {
        total:
          statistics.totalMeetings ??
          statistics.total ??
          pagination.total ??
          meetings.length,

        upcoming:
          statistics.upcomingMeetings ??
          statistics.upcoming ??
          localStatistics.scheduled,

        live:
          statistics.liveMeetings ??
          statistics.live ??
          localStatistics.live,

        completed:
          statistics.completedMeetings ??
          statistics.completed ??
          localStatistics.completed,
      };
    }, [
      meetings,
      pagination.total,
      statistics,
    ]);

  /* ========================================================
     FILTER HANDLERS
  ======================================================== */

  const handleFilterChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
      page:
        name === "page"
          ? Number(value)
          : 1,
    }));
  };

  const resetFilters = () => {
    setFilters(
      INITIAL_FILTERS
    );
  };

  const changePage = (
    page
  ) => {
    if (
      page < 1 ||
      page >
        (pagination.totalPages ||
          1)
    ) {
      return;
    }

    setFilters((previous) => ({
      ...previous,
      page,
    }));
  };

  /* ========================================================
     CREATE MEETING
  ======================================================== */

  const openCreateModal = () => {
    setFormData(
      INITIAL_MEETING_FORM
    );

    setError("");
    setSuccessMessage("");
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (actionLoading) {
      return;
    }

    setCreateModalOpen(false);
  };

  const handleFormChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    const fieldValue =
      type === "checkbox"
        ? checked
        : value;

    if (
      name.startsWith("scope.")
    ) {
      const field =
        name.split(".")[1];

      setFormData(
        (previous) => ({
          ...previous,
          scope: {
            ...previous.scope,
            [field]:
              fieldValue,
          },
        })
      );

      return;
    }

    if (
      name.startsWith("venue.")
    ) {
      const field =
        name.split(".")[1];

      setFormData(
        (previous) => ({
          ...previous,
          venue: {
            ...previous.venue,
            [field]:
              fieldValue,
          },
        })
      );

      return;
    }

    if (
      name.startsWith(
        "liveRoom."
      )
    ) {
      const field =
        name.split(".")[1];

      setFormData(
        (previous) => ({
          ...previous,
          liveRoom: {
            ...previous.liveRoom,
            [field]:
              field ===
              "maximumParticipants"
                ? Number(
                    fieldValue
                  )
                : fieldValue,
          },
        })
      );

      return;
    }

    if (
      name.startsWith(
        "recording."
      )
    ) {
      const field =
        name.split(".")[1];

      setFormData(
        (previous) => ({
          ...previous,
          recording: {
            ...previous.recording,
            [field]:
              fieldValue,
          },
        })
      );

      return;
    }

    setFormData(
      (previous) => ({
        ...previous,
        [name]: fieldValue,
      })
    );
  };

  const handleCreateMeeting =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccessMessage("");

      if (
        !formData.title.trim()
      ) {
        setError(
          "Meeting title is required."
        );

        return;
      }

      if (
        !formData.scheduledStart ||
        !formData.scheduledEnd
      ) {
        setError(
          "Meeting start and end times are required."
        );

        return;
      }

      const startDate =
        new Date(
          formData.scheduledStart
        );

      const endDate =
        new Date(
          formData.scheduledEnd
        );

      if (
        Number.isNaN(
          startDate.getTime()
        ) ||
        Number.isNaN(
          endDate.getTime()
        )
      ) {
        setError(
          "Enter valid meeting dates."
        );

        return;
      }

      if (
        endDate <= startDate
      ) {
        setError(
          "Meeting end time must be after the start time."
        );

        return;
      }

      try {
        setActionLoading(true);

        const payload = {
          ...formData,

          title:
            formData.title.trim(),

          description:
            formData.description.trim(),

          scheduledStart:
            toISOStringFromLocalInput(
              formData.scheduledStart
            ),

          scheduledEnd:
            toISOStringFromLocalInput(
              formData.scheduledEnd
            ),
        };

        await createMeeting(
          payload
        );

        setCreateModalOpen(false);

        setSuccessMessage(
          "Meeting created successfully."
        );

        await Promise.all([
          loadMeetings(),
          loadStatistics(),
        ]);
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            "Unable to create the meeting."
          )
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* ========================================================
     MEETING DETAILS
  ======================================================== */

  const refreshSelectedMeeting =
    async () => {
      if (
        !selectedMeeting?._id
      ) {
        return;
      }

      const response =
        await getMeetingById(
          selectedMeeting._id
        );

      setSelectedMeeting(
        getSingleMeeting(
          response
        )
      );
    };

  const runMeetingAction =
    async ({
      action,
      success,
      confirmMessage,
    }) => {
      if (
        confirmMessage &&
        !window.confirm(
          confirmMessage
        )
      ) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");
        setSuccessMessage("");

        await action();

        setSuccessMessage(
          success
        );

        await Promise.all([
          loadMeetings(),
          loadStatistics(),
          refreshSelectedMeeting(),
        ]);
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            "The meeting action failed."
          )
        );
      } finally {
        setActionLoading(false);
      }
    };

  const handleScheduleMeeting =
    (meeting) => {
      runMeetingAction({
        action: () =>
          scheduleMeeting(
            meeting._id
          ),

        success:
          "Meeting scheduled successfully.",

        confirmMessage:
          "Schedule this meeting now?",
      });
    };

  const handleStartMeeting = (
    meeting
  ) => {
    runMeetingAction({
      action: () =>
        startMeeting(
          meeting._id
        ),

      success:
        "Meeting started successfully.",

      confirmMessage:
        "Start this meeting now?",
    });
  };

  const handleEndMeeting = (
    meeting
  ) => {
    runMeetingAction({
      action: () =>
        endMeeting(meeting._id),

      success:
        "Meeting ended successfully.",

      confirmMessage:
        "End this live meeting?",
    });
  };

  const handleCancelMeeting =
    async (meeting) => {
      const reason =
        window.prompt(
          "Enter the reason for cancelling this meeting:"
        );

      if (
        reason === null
      ) {
        return;
      }

      if (!reason.trim()) {
        setError(
          "A cancellation reason is required."
        );

        return;
      }

      await runMeetingAction({
        action: () =>
          cancelMeeting(
            meeting._id,
            reason.trim()
          ),

        success:
          "Meeting cancelled successfully.",
      });
    };

  const handleDeleteMeeting = (
    meeting
  ) => {
    runMeetingAction({
      action: () =>
        deleteMeeting(
          meeting._id
        ),

      success:
        "Meeting deleted successfully.",

      confirmMessage:
        "Delete this meeting? It will be moved to the deleted meetings records.",
    });

    setDetailsModalOpen(
      false
    );
  };

  /* ========================================================
     RENDER HELPERS
  ======================================================== */

  const renderStatusBadge = (
    status
  ) => {
    return (
      <span
        className={`leadership-meeting-status leadership-meeting-status--${
          status || "unknown"
        }`}
      >
        {STATUS_LABELS[
          status
        ] || status || "Unknown"}
      </span>
    );
  };

  const openMeetingDetails = (meetingId) => {
  navigate(
    `/workspace/leadership/meetings/${meetingId}`
  );
};

  const renderMeetingActions = (
    meeting,
    compact = false
  ) => {
    return (
      <div
        className={`leadership-meeting-actions ${
          compact
            ? "leadership-meeting-actions--compact"
            : ""
        }`}
      >
        <button
          type="button"
          className="leadership-meeting-button leadership-meeting-button--secondary"
          onClick={() =>
            openMeetingDetails(
              meeting._id
            )
          }
          disabled={actionLoading}
        >
          View
        </button>

        {[
          "draft",
          "postponed",
        ].includes(
          meeting.status
        ) && (
          <button
            type="button"
            className="leadership-meeting-button leadership-meeting-button--primary"
            onClick={() =>
              handleScheduleMeeting(
                meeting
              )
            }
            disabled={
              actionLoading
            }
          >
            Schedule
          </button>
        )}

        {meeting.status ===
          "scheduled" && (
          <button
            type="button"
            className="leadership-meeting-button leadership-meeting-button--success"
            onClick={() =>
              handleStartMeeting(
                meeting
              )
            }
            disabled={
              actionLoading
            }
          >
            Start
          </button>
        )}

        {meeting.status ===
          "live" && (
          <button
            type="button"
            className="leadership-meeting-button leadership-meeting-button--danger"
            onClick={() =>
              handleEndMeeting(
                meeting
              )
            }
            disabled={
              actionLoading
            }
          >
            End
          </button>
        )}
      </div>
    );
  };

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <main className="leadership-meeting-page">
      <section className="leadership-meeting-hero">
        <div className="leadership-meeting-hero__content">
          <p className="leadership-meeting-eyebrow">
            JVP Connect
          </p>

          <h1>
            Leadership Meetings
          </h1>

          <p>
            Schedule, conduct and
            manage JVP leadership
            meetings, attendance,
            resolutions and action
            items from one workspace.
          </p>
        </div>

        <div className="leadership-meeting-hero__actions">
          <button
            type="button"
            className="leadership-meeting-button leadership-meeting-button--light"
            onClick={() => {
              loadMeetings();
              loadStatistics();
            }}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            className="leadership-meeting-button leadership-meeting-button--hero"
            onClick={
              openCreateModal
            }
          >
            + Create Meeting
          </button>
        </div>
      </section>

      {error && (
        <div
          className="leadership-meeting-alert leadership-meeting-alert--error"
          role="alert"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div
          className="leadership-meeting-alert leadership-meeting-alert--success"
          role="status"
        >
          <span>
            {successMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage(
                ""
              )
            }
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}

      <section className="leadership-meeting-stats">
        <article className="leadership-meeting-stat-card">
          <span>Total Meetings</span>
          <strong>
            {
              dashboardStatistics.total
            }
          </strong>
          <small>
            All leadership meetings
          </small>
        </article>

        <article className="leadership-meeting-stat-card">
          <span>Upcoming</span>
          <strong>
            {
              dashboardStatistics.upcoming
            }
          </strong>
          <small>
            Scheduled meetings
          </small>
        </article>

        <article className="leadership-meeting-stat-card leadership-meeting-stat-card--live">
          <span>Live Now</span>
          <strong>
            {
              dashboardStatistics.live
            }
          </strong>
          <small>
            Meetings in progress
          </small>
        </article>

        <article className="leadership-meeting-stat-card">
          <span>Completed</span>
          <strong>
            {
              dashboardStatistics.completed
            }
          </strong>
          <small>
            Concluded meetings
          </small>
        </article>
      </section>

      <section className="leadership-meeting-panel">
        <div className="leadership-meeting-panel__header">
          <div>
            <h2>
              Meeting Register
            </h2>

            <p>
              Review and manage all
              meetings accessible to
              your account.
            </p>
          </div>

          <div className="leadership-meeting-result-count">
            {pagination.total ??
              meetings.length}{" "}
            meeting
            {(pagination.total ??
              meetings.length) ===
            1
              ? ""
              : "s"}
          </div>
        </div>

        <div className="leadership-meeting-filters">
          <label className="leadership-meeting-search">
            <span className="sr-only">
              Search meetings
            </span>

            <input
              type="search"
              name="search"
              value={
                filters.search
              }
              onChange={
                handleFilterChange
              }
              placeholder="Search title, number or room code..."
            />
          </label>

          <select
            name="status"
            value={
              filters.status
            }
            onChange={
              handleFilterChange
            }
            aria-label="Filter by status"
          >
            <option value="">
              All statuses
            </option>

            {Object.entries(
              STATUS_LABELS
            ).map(
              ([
                value,
                label,
              ]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              )
            )}
          </select>

          <select
            name="meetingType"
            value={
              filters.meetingType
            }
            onChange={
              handleFilterChange
            }
            aria-label="Filter by meeting type"
          >
            <option value="">
              All meeting types
            </option>

            {Object.entries(
              MEETING_TYPE_LABELS
            ).map(
              ([
                value,
                label,
              ]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              )
            )}
          </select>

          <select
            name="format"
            value={
              filters.format
            }
            onChange={
              handleFilterChange
            }
            aria-label="Filter by format"
          >
            <option value="">
              All formats
            </option>

            {Object.entries(
              FORMAT_LABELS
            ).map(
              ([
                value,
                label,
              ]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              )
            )}
          </select>

          <select
            name="sortBy"
            value={
              filters.sortBy
            }
            onChange={
              handleFilterChange
            }
            aria-label="Sort meetings"
          >
            <option value="upcoming">
              Meeting date
            </option>

            <option value="oldest">
              Oldest first
            </option>

            <option value="recently_created">
              Recently created
            </option>

            <option value="recently_updated">
              Recently updated
            </option>
          </select>

          <button
            type="button"
            className="leadership-meeting-button leadership-meeting-button--secondary"
            onClick={
              resetFilters
            }
          >
            Reset
          </button>
        </div>

        {loading ? (
          <div className="leadership-meeting-loading">
            <div className="leadership-meeting-spinner" />

            <p>
              Loading meetings...
            </p>
          </div>
        ) : meetings.length ===
          0 ? (
          <div className="leadership-meeting-empty">
            <div className="leadership-meeting-empty__icon">
              JM
            </div>

            <h3>
              No meetings found
            </h3>

            <p>
              Create a meeting or
              adjust your current
              filters.
            </p>

            <button
              type="button"
              className="leadership-meeting-button leadership-meeting-button--primary"
              onClick={
                openCreateModal
              }
            >
              Create First Meeting
            </button>
          </div>
        ) : (
          <>
            <div className="leadership-meeting-table-wrapper">
              <table className="leadership-meeting-table">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>
                      Date and time
                    </th>
                    <th>Format</th>
                    <th>Participants</th>
                    <th>Status</th>
                    <th>
                      <span className="sr-only">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {meetings.map(
                    (meeting) => (
                      <tr
                        key={
                          meeting._id
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="leadership-meeting-title-button"
                            onClick={() =>
                              openMeetingDetails(
                                meeting._id
                              )
                            }
                          >
                            {
                              meeting.title
                            }
                          </button>

                          <div className="leadership-meeting-number">
                            {meeting.meetingNumber ||
                              "Number pending"}
                          </div>

                          <div className="leadership-meeting-type">
                            {MEETING_TYPE_LABELS[
                              meeting
                                .meetingType
                            ] ||
                              meeting.meetingType}
                          </div>
                        </td>

                        <td>
                          <strong>
                            {formatShortDate(
                              meeting.scheduledStart
                            )}
                          </strong>

                          <span className="leadership-meeting-table-subtext">
                            {formatDate(
                              meeting.scheduledStart
                            )}
                          </span>
                        </td>

                        <td>
                          {FORMAT_LABELS[
                            meeting
                              .format
                          ] ||
                            meeting.format}
                        </td>

                        <td>
                          {meeting
                            .participants
                            ?.length || 0}
                        </td>

                        <td>
                          {renderStatusBadge(
                            meeting.status
                          )}
                        </td>

                        <td>
                          {renderMeetingActions(
                            meeting,
                            true
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="leadership-meeting-mobile-list">
              {meetings.map(
                (meeting) => (
                  <article
                    key={
                      meeting._id
                    }
                    className="leadership-meeting-mobile-card"
                  >
                    <div className="leadership-meeting-mobile-card__top">
                      {renderStatusBadge(
                        meeting.status
                      )}

                      <span>
                        {meeting.meetingNumber}
                      </span>
                    </div>

                    <h3>
                      {meeting.title}
                    </h3>

                    <p>
                      {formatDate(
                        meeting.scheduledStart
                      )}
                    </p>

                    <dl>
                      <div>
                        <dt>Format</dt>
                        <dd>
                          {FORMAT_LABELS[
                            meeting
                              .format
                          ] ||
                            meeting.format}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Participants
                        </dt>
                        <dd>
                          {meeting
                            .participants
                            ?.length ||
                            0}
                        </dd>
                      </div>
                    </dl>

                    {renderMeetingActions(
                      meeting
                    )}
                  </article>
                )
              )}
            </div>
          </>
        )}

        {!loading &&
          meetings.length > 0 && (
            <div className="leadership-meeting-pagination">
              <button
                type="button"
                className="leadership-meeting-button leadership-meeting-button--secondary"
                onClick={() =>
                  changePage(
                    filters.page - 1
                  )
                }
                disabled={
                  !pagination.hasPreviousPage ||
                  filters.page <= 1
                }
              >
                Previous
              </button>

              <span>
                Page{" "}
                {pagination.page ||
                  filters.page}{" "}
                of{" "}
                {pagination.totalPages ||
                  1}
              </span>

              <button
                type="button"
                className="leadership-meeting-button leadership-meeting-button--secondary"
                onClick={() =>
                  changePage(
                    filters.page + 1
                  )
                }
                disabled={
                  !pagination.hasNextPage ||
                  filters.page >=
                    (pagination.totalPages ||
                      1)
                }
              >
                Next
              </button>
            </div>
          )}
      </section>

      {/* ====================================================
          CREATE MEETING MODAL
      ==================================================== */}

      {createModalOpen && (
        <div
          className="leadership-meeting-modal-backdrop"
          role="presentation"
          onMouseDown={
            closeCreateModal
          }
        >
          <section
            className="leadership-meeting-modal leadership-meeting-modal--form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-meeting-title"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <header className="leadership-meeting-modal__header">
              <div>
                <p className="leadership-meeting-eyebrow">
                  New meeting
                </p>

                <h2 id="create-meeting-title">
                  Create Leadership
                  Meeting
                </h2>
              </div>

              <button
                type="button"
                className="leadership-meeting-modal__close"
                onClick={
                  closeCreateModal
                }
                aria-label="Close modal"
              >
                ×
              </button>
            </header>

            <form
              onSubmit={
                handleCreateMeeting
              }
              className="leadership-meeting-form"
            >
              <div className="leadership-meeting-form__grid">
                <label className="leadership-meeting-form__full">
                  <span>
                    Meeting title *
                  </span>

                  <input
                    type="text"
                    name="title"
                    value={
                      formData.title
                    }
                    onChange={
                      handleFormChange
                    }
                    maxLength={180}
                    required
                    placeholder="Regional Executive Meeting"
                  />
                </label>

                <label className="leadership-meeting-form__full">
                  <span>
                    Description
                  </span>

                  <textarea
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={
                      handleFormChange
                    }
                    rows={4}
                    placeholder="Outline the purpose of the meeting..."
                  />
                </label>

                <label>
                  <span>
                    Meeting type
                  </span>

                  <select
                    name="meetingType"
                    value={
                      formData.meetingType
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    {Object.entries(
                      MEETING_TYPE_LABELS
                    ).map(
                      ([
                        value,
                        label,
                      ]) => (
                        <option
                          key={
                            value
                          }
                          value={
                            value
                          }
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>Format</span>

                  <select
                    name="format"
                    value={
                      formData.format
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    {Object.entries(
                      FORMAT_LABELS
                    ).map(
                      ([
                        value,
                        label,
                      ]) => (
                        <option
                          key={
                            value
                          }
                          value={
                            value
                          }
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Leadership level
                  </span>

                  <select
                    name="leadershipLevel"
                    value={
                      formData.leadershipLevel
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    <option value="regional">
                      Regional
                    </option>

                    <option value="county">
                      County
                    </option>

                    <option value="constituency">
                      Constituency
                    </option>

                    <option value="ward">
                      Ward
                    </option>

                    <option value="committee">
                      Committee
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    Department
                  </span>

                  <input
                    type="text"
                    name="department"
                    value={
                      formData.department
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="executive"
                  />
                </label>

                <label>
                  <span>
                    Start date and
                    time *
                  </span>

                  <input
                    type="datetime-local"
                    name="scheduledStart"
                    value={
                      formData.scheduledStart
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />
                </label>

                <label>
                  <span>
                    End date and time
                    *
                  </span>

                  <input
                    type="datetime-local"
                    name="scheduledEnd"
                    value={
                      formData.scheduledEnd
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />
                </label>

                {[
                  "physical",
                  "hybrid",
                ].includes(
                  formData.format
                ) && (
                  <>
                    <div className="leadership-meeting-form__section-title leadership-meeting-form__full">
                      Venue
                    </div>

                    <label>
                      <span>
                        Venue name
                      </span>

                      <input
                        type="text"
                        name="venue.name"
                        value={
                          formData
                            .venue
                            .name
                        }
                        onChange={
                          handleFormChange
                        }
                      />
                    </label>

                    <label>
                      <span>
                        Venue county
                      </span>

                      <input
                        type="text"
                        name="venue.county"
                        value={
                          formData
                            .venue
                            .county
                        }
                        onChange={
                          handleFormChange
                        }
                      />
                    </label>

                    <label className="leadership-meeting-form__full">
                      <span>
                        Address
                      </span>

                      <input
                        type="text"
                        name="venue.address"
                        value={
                          formData
                            .venue
                            .address
                        }
                        onChange={
                          handleFormChange
                        }
                      />
                    </label>
                  </>
                )}

                {[
                  "jvp_connect",
                  "hybrid",
                ].includes(
                  formData.format
                ) && (
                  <>
                    <div className="leadership-meeting-form__section-title leadership-meeting-form__full">
                      Live room
                      settings
                    </div>

                    <label>
                      <span>
                        Maximum
                        participants
                      </span>

                      <input
                        type="number"
                        name="liveRoom.maximumParticipants"
                        min="2"
                        max="500"
                        value={
                          formData
                            .liveRoom
                            .maximumParticipants
                        }
                        onChange={
                          handleFormChange
                        }
                      />
                    </label>

                    <label>
                      <span>
                        Media mode
                      </span>

                      <select
                        name="liveRoom.mediaMode"
                        value={
                          formData
                            .liveRoom
                            .mediaMode
                        }
                        onChange={
                          handleFormChange
                        }
                      >
                        <option value="peer_to_peer">
                          Peer to peer
                        </option>

                        <option value="mesh">
                          Mesh
                        </option>

                        <option value="sfu">
                          SFU
                        </option>
                      </select>
                    </label>

                    <label className="leadership-meeting-checkbox">
                      <input
                        type="checkbox"
                        name="liveRoom.waitingRoomEnabled"
                        checked={
                          formData
                            .liveRoom
                            .waitingRoomEnabled
                        }
                        onChange={
                          handleFormChange
                        }
                      />

                      <span>
                        Enable waiting
                        room
                      </span>
                    </label>

                    <label className="leadership-meeting-checkbox">
                      <input
                        type="checkbox"
                        name="recording.enabled"
                        checked={
                          formData
                            .recording
                            .enabled
                        }
                        onChange={
                          handleFormChange
                        }
                      />

                      <span>
                        Enable meeting
                        recording
                      </span>
                    </label>
                  </>
                )}
              </div>

              <footer className="leadership-meeting-modal__footer">
                <button
                  type="button"
                  className="leadership-meeting-button leadership-meeting-button--secondary"
                  onClick={
                    closeCreateModal
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="leadership-meeting-button leadership-meeting-button--primary"
                  disabled={
                    actionLoading
                  }
                >
                  {actionLoading
                    ? "Creating..."
                    : "Create Meeting"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* ====================================================
          MEETING DETAILS MODAL
      ==================================================== */}

      {detailsModalOpen &&
        selectedMeeting && (
          <div
            className="leadership-meeting-modal-backdrop"
            role="presentation"
            onMouseDown={() =>
              setDetailsModalOpen(
                false
              )
            }
          >
            <section
              className="leadership-meeting-modal leadership-meeting-modal--details"
              role="dialog"
              aria-modal="true"
              aria-labelledby="meeting-details-title"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <header className="leadership-meeting-modal__header">
                <div>
                  <div className="leadership-meeting-details__badges">
                    {renderStatusBadge(
                      selectedMeeting.status
                    )}

                    <span className="leadership-meeting-room-code">
                      {selectedMeeting
                        .liveRoom
                        ?.roomCode
                        ? `Room ${selectedMeeting.liveRoom.roomCode}`
                        : "No room code"}
                    </span>
                  </div>

                  <h2 id="meeting-details-title">
                    {
                      selectedMeeting.title
                    }
                  </h2>

                  <p>
                    {selectedMeeting.meetingNumber}
                  </p>
                </div>

                <button
                  type="button"
                  className="leadership-meeting-modal__close"
                  onClick={() =>
                    setDetailsModalOpen(
                      false
                    )
                  }
                  aria-label="Close modal"
                >
                  ×
                </button>
              </header>

              <div className="leadership-meeting-details">
                <section className="leadership-meeting-details__summary">
                  <article>
                    <span>
                      Start time
                    </span>

                    <strong>
                      {formatDate(
                        selectedMeeting.scheduledStart
                      )}
                    </strong>
                  </article>

                  <article>
                    <span>
                      End time
                    </span>

                    <strong>
                      {formatDate(
                        selectedMeeting.scheduledEnd
                      )}
                    </strong>
                  </article>

                  <article>
                    <span>Format</span>

                    <strong>
                      {FORMAT_LABELS[
                        selectedMeeting
                          .format
                      ] ||
                        selectedMeeting.format}
                    </strong>
                  </article>

                  <article>
                    <span>
                      Participants
                    </span>

                    <strong>
                      {selectedMeeting
                        .participants
                        ?.length || 0}
                    </strong>
                  </article>
                </section>

                <section className="leadership-meeting-details__section">
                  <h3>
                    Description
                  </h3>

                  <p>
                    {selectedMeeting.description ||
                      "No meeting description has been provided."}
                  </p>
                </section>

                <section className="leadership-meeting-details__section">
                  <h3>
                    Meeting records
                  </h3>

                  <div className="leadership-meeting-record-grid">
                    <article>
                      <strong>
                        {selectedMeeting
                          .agenda
                          ?.length || 0}
                      </strong>
                      <span>
                        Agenda items
                      </span>
                    </article>

                    <article>
                      <strong>
                        {selectedMeeting
                          .documents
                          ?.length || 0}
                      </strong>
                      <span>
                        Documents
                      </span>
                    </article>

                    <article>
                      <strong>
                        {selectedMeeting
                          .resolutions
                          ?.length || 0}
                      </strong>
                      <span>
                        Resolutions
                      </span>
                    </article>

                    <article>
                      <strong>
                        {selectedMeeting
                          .actionItems
                          ?.length || 0}
                      </strong>
                      <span>
                        Action items
                      </span>
                    </article>
                  </div>
                </section>

                <section className="leadership-meeting-details__section">
                  <h3>
                    Minutes and
                    recording
                  </h3>

                  <div className="leadership-meeting-record-grid">
                    <article>
                      <strong>
                        {selectedMeeting
                          .minutes
                          ?.status ||
                          "not_started"}
                      </strong>
                      <span>
                        Minutes status
                      </span>
                    </article>

                    <article>
                      <strong>
                        {selectedMeeting
                          .recording
                          ?.status ||
                          "not_started"}
                      </strong>
                      <span>
                        Recording
                        status
                      </span>
                    </article>

                    <article>
                      <strong>
                        {selectedMeeting
                          .isOnline
                          ? "Online"
                          : "Physical"}
                      </strong>
                      <span>
                        Meeting mode
                      </span>
                    </article>

                    <article>
                      <strong>
                        {selectedMeeting.durationMinutes ||
                          0}{" "}
                        min
                      </strong>
                      <span>
                        Scheduled
                        duration
                      </span>
                    </article>
                  </div>
                </section>
              </div>

              <footer className="leadership-meeting-modal__footer leadership-meeting-modal__footer--details">
                <div>
                  {![
                    "completed",
                    "cancelled",
                  ].includes(
                    selectedMeeting.status
                  ) && (
                    <button
                      type="button"
                      className="leadership-meeting-button leadership-meeting-button--warning"
                      onClick={() =>
                        handleCancelMeeting(
                          selectedMeeting
                        )
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      Cancel Meeting
                    </button>
                  )}

                  {selectedMeeting.status !==
                    "live" && (
                    <button
                      type="button"
                      className="leadership-meeting-button leadership-meeting-button--danger-outline"
                      onClick={() =>
                        handleDeleteMeeting(
                          selectedMeeting
                        )
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      Delete
                    </button>
                  )}
                </div>

                {renderMeetingActions(
                  selectedMeeting
                )}
              </footer>
            </section>
          </div>
        )}
    </main>
  );
};

export default LeadershipMeeting;