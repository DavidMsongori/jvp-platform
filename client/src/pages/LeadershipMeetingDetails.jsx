import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  cancelMeeting,
  deleteMeeting,
  endMeeting,
  getMeetingAttendance,
  getMeetingById,
  joinMeeting,
  leaveMeeting,
  scheduleMeeting,
  startMeeting,
} from "../services/meeting.service";

import { useAuth } from "../context/AuthContext";

import "./LeadershipMeetingDetails.css";

import MeetingAgenda from "../features/meetings/MeetingAgenda";
import MeetingParticipants from "../features/meetings/MeetingParticipants";
import MeetingAttendance from "../features/meetings/MeetingAttendance";
import MeetingDocuments from "../features/meetings//MeetingDocuments";
import MeetingMinutes from "../features/meetings//MeetingMinutes";
import MeetingResolutions from "../features/meetings/MeetingResolutions";
import MeetingActionItems from "../features/meetings/MeetingActionItems";
import MeetingLiveRoom from "../features/meetings/MeetingLiveRoom";
import MeetingManagers from "../features/meetings/MeetingManagers";
import MeetingLiveRoomControls from "../features/meetings/MeetingLiveRoomControls";
import MeetingRecordingControls from "../features/meetings/MeetingRecordingControls";

/* ==========================================================
   CONSTANTS
========================================================== */

const WORKSPACE_TABS = [
  {
    id: "overview",
    label: "Overview",
  },
  {
    id: "agenda",
    label: "Agenda",
  },
  {
    id: "participants",
    label: "Participants",
  },
  {
  id: "managers",
  label: "Managers",
},
  {
    id: "attendance",
    label: "Attendance",
  },
  {
    id: "documents",
    label: "Documents",
  },
  {
    id: "minutes",
    label: "Minutes",
  },
  {
    id: "resolutions",
    label: "Resolutions",
  },
  {
    id: "action-items",
    label: "Action Items",
  },
  {
    id: "recording",
    label: "Recording",
  },
  {
  id: "room-controls",
  label: "Room Controls",
},
  {
    id: "live-room",
    label: "Live Room",
  },
];

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

const PARTICIPANT_STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  tentative: "Tentative",
};

const ATTENDANCE_STATUS_LABELS = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
  not_recorded: "Not Recorded",
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

const getMeetingFromResponse = (
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

const getAttendanceFromResponse = (
  response
) => {
  const payload =
    getResponsePayload(response);

  return {
    records:
      payload?.attendance ||
      payload?.records ||
      payload?.participants ||
      [],

    summary:
      payload?.summary || {},
  };
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

const formatDateTime = (
  value
) => {
  if (!value) {
    return "Not available";
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
      dateStyle: "full",
      timeStyle: "short",
      timeZone:
        "Africa/Nairobi",
    }
  ).format(date);
};

const formatShortDate = (
  value
) => {
  if (!value) {
    return "Not available";
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
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone:
        "Africa/Nairobi",
    }
  ).format(date);
};

const getDurationMinutes = (
  start,
  end
) => {
  if (!start || !end) {
    return 0;
  }

  const startDate =
    new Date(start);

  const endDate =
    new Date(end);

  if (
    Number.isNaN(
      startDate.getTime()
    ) ||
    Number.isNaN(
      endDate.getTime()
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      (endDate - startDate) /
        60000
    )
  );
};

const formatDuration = (
  minutes
) => {
  if (!minutes) {
    return "0 minutes";
  }

  const hours =
    Math.floor(minutes / 60);

  const remainingMinutes =
    minutes % 60;

  if (
    hours &&
    remainingMinutes
  ) {
    return `${hours} hr ${remainingMinutes} min`;
  }

  if (hours) {
    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    }`;
  }

  return `${remainingMinutes} minutes`;
};

/* ==========================================================
   USER HELPERS
========================================================== */

const getUserName = (
  user
) => {
  if (!user) {
    return "Unknown user";
  }

  if (
    typeof user === "string"
  ) {
    return user;
  }

  const fullName = [
    user.firstName,
    user.middleName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    user.name ||
    user.email ||
    "Unknown user"
  );
};

const getUserEmail = (
  user
) => {
  if (
    !user ||
    typeof user === "string"
  ) {
    return "";
  }

  return user.email || "";
};

const getInitials = (
  user
) => {
  const name =
    getUserName(user);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase()
    )
    .join("");

  return initials || "JV";
};

/* ==========================================================
   SMALL COMPONENTS
========================================================== */

const EmptySection = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="leadership-details-empty">
      <div className="leadership-details-empty__icon">
        JV
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {actionLabel &&
        onAction && (
          <button
            type="button"
            className="leadership-details-button leadership-details-button--primary"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
    </div>
  );
};

const UserAvatar = ({
  user,
}) => {
  return (
    <div
      className="leadership-details-avatar"
      aria-hidden="true"
    >
      {getInitials(user)}
    </div>
  );
};

/* ==========================================================
   MAIN COMPONENT
========================================================== */

const LeadershipMeetingDetails =
  () => {
    const {
      meetingId,
    } = useParams();

    const navigate =
      useNavigate();

    const { user } = useAuth();


    const [
      meeting,
      setMeeting,
    ] = useState(null);

    const [
      activeTab,
      setActiveTab,
    ] = useState("overview");

    const [
  enterLiveRoom,
  setEnterLiveRoom,
] = useState(false);

    const [
      attendance,
      setAttendance,
    ] = useState({
      records: [],
      summary: {},
    });

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      attendanceLoading,
      setAttendanceLoading,
    ] = useState(false);

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
      sidebarOpen,
      setSidebarOpen,
    ] = useState(false);

    /* ========================================================
       LOAD MEETING
    ======================================================== */

    const loadMeeting =
      useCallback(async () => {
        if (!meetingId) {
          setError(
            "Meeting ID is missing."
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await getMeetingById(
              meetingId
            );

          setMeeting(
            getMeetingFromResponse(
              response
            )
          );
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load the meeting."
            )
          );
        } finally {
          setLoading(false);
        }
      }, [meetingId]);

    const loadAttendance =
      useCallback(async () => {
        if (!meetingId) {
          return;
        }

        try {
          setAttendanceLoading(
            true
          );

          const response =
            await getMeetingAttendance(
              meetingId
            );

          setAttendance(
            getAttendanceFromResponse(
              response
            )
          );
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load attendance records."
            )
          );
        } finally {
          setAttendanceLoading(
            false
          );
        }
      }, [meetingId]);

    useEffect(() => {
      loadMeeting();
    }, [loadMeeting]);

    useEffect(() => {
      if (
        activeTab ===
        "attendance"
      ) {
        loadAttendance();
      }
    }, [
      activeTab,
      loadAttendance,
    ]);

    /* ========================================================
       DERIVED DATA
    ======================================================== */

    const durationMinutes =
      useMemo(() => {
        if (!meeting) {
          return 0;
        }

        return (
          meeting.durationMinutes ||
          getDurationMinutes(
            meeting.scheduledStart,
            meeting.scheduledEnd
          )
        );
      }, [meeting]);

    const participantCount =
      meeting?.participants
        ?.length || 0;

    const agendaCount =
      meeting?.agenda?.length ||
      0;

    const documentCount =
      meeting?.documents
        ?.length || 0;

    const resolutionCount =
      meeting?.resolutions
        ?.length || 0;

    const actionItemCount =
      meeting?.actionItems
        ?.length || 0;

    const completedActionItems =
      meeting?.actionItems?.filter(
        (item) =>
          item.status ===
            "completed" ||
          Boolean(
            item.completedAt
          )
      ).length || 0;

    const pendingActionItems =
      Math.max(
        0,
        actionItemCount -
          completedActionItems
      );

    const isOnlineMeeting = [
      "jvp_connect",
      "hybrid",
    ].includes(meeting?.format);

  /* ========================================================
   CURRENT USER PERMISSIONS
======================================================== */

const currentUserId =
  String(
    user?._id ||
    user?.id ||
    user?.userId ||
    ""
  );

const getId = (value) =>
  String(
    value?._id ||
    value?.id ||
    value?.user?._id ||
    value?.user?.id ||
    value?.user ||
    value ||
    ""
  );

const isHost =
  getId(meeting?.host) ===
  currentUserId;

const isCoHost =
  Array.isArray(meeting?.coHosts) &&
  meeting.coHosts.some(
    (coHost) =>
      getId(coHost) ===
      currentUserId
  );

const isModerator =
  Array.isArray(meeting?.moderators) &&
  meeting.moderators.some(
    (moderator) =>
      getId(moderator) ===
      currentUserId
  );

const canManageMeeting =
  isHost ||
  isCoHost;

const canStartMeeting =
  isHost ||
  isCoHost;

const canEndMeeting =
  isHost;  

    /* ========================================================
       ACTION HANDLER
    ======================================================== */

    const runMeetingAction =
      async ({
        action,
        success,
        confirmation,
        redirectAfter = false,
      }) => {
        if (
          confirmation &&
          !window.confirm(
            confirmation
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

          if (redirectAfter) {
            navigate(
              "/workspace/leadership/meetings"
            );

            return;
          }

          await loadMeeting();
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "The meeting action failed."
            )
          );
        } finally {
          setActionLoading(
            false
          );
        }
      };

    const handleSchedule =
      () => {
        runMeetingAction({
          action: () =>
            scheduleMeeting(
              meetingId
            ),

          success:
            "Meeting scheduled successfully.",

          confirmation:
            "Schedule this meeting now?",
        });
      };

    const handleStart = () => {
      runMeetingAction({
        action: () =>
          startMeeting(
            meetingId
          ),

        success:
          "Meeting started successfully.",

        confirmation:
          "Start this meeting now?",
      });
    };

    const handleEnd = () => {
      runMeetingAction({
        action: () =>
          endMeeting(
            meetingId
          ),

        success:
          "Meeting ended successfully.",

        confirmation:
          "End this live meeting now?",
      });
    };

    const handleCancel =
      async () => {
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
              meetingId,
              reason.trim()
            ),

          success:
            "Meeting cancelled successfully.",
        });
      };

    const handleDelete =
      () => {
        runMeetingAction({
          action: () =>
            deleteMeeting(
              meetingId
            ),

          success:
            "Meeting deleted successfully.",

          confirmation:
            "Delete this meeting? It will be moved to the deleted meeting records.",

          redirectAfter: true,
        });
      };

    const handleJoin = async () => {
  try {
    setActionLoading(true);
    setError("");
    setSuccessMessage("");

    await joinMeeting(meetingId);

    await loadMeeting();

    setActiveTab("live-room");
    setEnterLiveRoom(true);

    setSuccessMessage(
      "Entering the live meeting room..."
    );
  } catch (requestError) {
    setError(
      getApiErrorMessage(
        requestError,
        "Unable to join the meeting."
      )
    );
  } finally {
    setActionLoading(false);
  }
};

    const handleLeave =
      () => {
        runMeetingAction({
          action: () =>
            leaveMeeting(
              meetingId
            ),

          success:
            "You left the meeting successfully.",

          confirmation:
            "Leave this meeting now?",
        });
      };

    /* ========================================================
       STATUS
    ======================================================== */

    const renderStatusBadge =
      (status) => {
        return (
          <span
            className={`leadership-details-status leadership-details-status--${
              status || "unknown"
            }`}
          >
            {STATUS_LABELS[
              status
            ] ||
              status ||
              "Unknown"}
          </span>
        );
      };

    /* ========================================================
       OVERVIEW
    ======================================================== */

    const renderOverview =
      () => {
        return (
          <div className="leadership-details-tab-panel">
            <section className="leadership-details-overview-grid">
              <article className="leadership-details-card leadership-details-card--wide">
                <div className="leadership-details-card__header">
                  <div>
                    <p className="leadership-details-card__eyebrow">
                      Meeting
                      information
                    </p>

                    <h2>
                      Overview
                    </h2>
                  </div>
                </div>

                <div className="leadership-details-information-grid">
                  <div>
                    <span>
                      Meeting type
                    </span>

                    <strong>
                      {MEETING_TYPE_LABELS[
                        meeting.meetingType
                      ] ||
                        meeting.meetingType ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Format
                    </span>

                    <strong>
                      {FORMAT_LABELS[
                        meeting.format
                      ] ||
                        meeting.format ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Leadership level
                    </span>

                    <strong>
                      {meeting.leadershipLevel ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Department
                    </span>

                    <strong>
                      {meeting.department ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Scope
                    </span>

                    <strong>
                      {meeting.scope
                        ?.level ||
                        "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Time zone
                    </span>

                    <strong>
                      {meeting.timezone ||
                        "Africa/Nairobi"}
                    </strong>
                  </div>
                </div>
              </article>

              <article className="leadership-details-card">
                <div className="leadership-details-card__header">
                  <div>
                    <p className="leadership-details-card__eyebrow">
                      Schedule
                    </p>

                    <h2>
                      Date and Time
                    </h2>
                  </div>
                </div>

                <div className="leadership-details-timeline">
                  <div className="leadership-details-timeline__item">
                    <span className="leadership-details-timeline__dot" />

                    <div>
                      <small>
                        Starts
                      </small>

                      <strong>
                        {formatDateTime(
                          meeting.scheduledStart
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="leadership-details-timeline__line" />

                  <div className="leadership-details-timeline__item">
                    <span className="leadership-details-timeline__dot" />

                    <div>
                      <small>
                        Ends
                      </small>

                      <strong>
                        {formatDateTime(
                          meeting.scheduledEnd
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="leadership-details-duration">
                  <span>
                    Scheduled
                    duration
                  </span>

                  <strong>
                    {formatDuration(
                      durationMinutes
                    )}
                  </strong>
                </div>
              </article>

              <article className="leadership-details-card">
                <div className="leadership-details-card__header">
                  <div>
                    <p className="leadership-details-card__eyebrow">
                      Leadership
                    </p>

                    <h2>
                      Host and
                      Managers
                    </h2>
                  </div>
                </div>

                <div className="leadership-details-person-list">
                  <div className="leadership-details-person">
                    <UserAvatar
                      user={
                        meeting.host
                      }
                    />

                    <div>
                      <strong>
                        {getUserName(
                          meeting.host
                        )}
                      </strong>

                      <span>
                        Host
                      </span>
                    </div>
                  </div>

                  <div className="leadership-details-manager-counts">
                    <div>
                      <strong>
                        {meeting
                          .coHosts
                          ?.length ||
                          0}
                      </strong>

                      <span>
                        Co-hosts
                      </span>
                    </div>

                    <div>
                      <strong>
                        {meeting
                          .moderators
                          ?.length ||
                          0}
                      </strong>

                      <span>
                        Moderators
                      </span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="leadership-details-card leadership-details-card--wide">
                <div className="leadership-details-card__header">
                  <div>
                    <p className="leadership-details-card__eyebrow">
                      Purpose
                    </p>

                    <h2>
                      Meeting
                      Description
                    </h2>
                  </div>
                </div>

                <p className="leadership-details-description">
                  {meeting.description ||
                    "No meeting description has been provided."}
                </p>
              </article>

              {[
                "physical",
                "hybrid",
              ].includes(
                meeting.format
              ) && (
                <article className="leadership-details-card">
                  <div className="leadership-details-card__header">
                    <div>
                      <p className="leadership-details-card__eyebrow">
                        Location
                      </p>

                      <h2>
                        Venue
                      </h2>
                    </div>
                  </div>

                  <div className="leadership-details-venue">
                    <strong>
                      {meeting.venue
                        ?.name ||
                        "Venue not provided"}
                    </strong>

                    <span>
                      {meeting.venue
                        ?.address ||
                        ""}
                    </span>

                    <span>
                      {meeting.venue
                        ?.county ||
                        ""}
                    </span>

                    {meeting.venue
                      ?.mapUrl && (
                      <a
                        href={
                          meeting
                            .venue
                            .mapUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open location
                      </a>
                    )}
                  </div>
                </article>
              )}

              {isOnlineMeeting && (
                <article className="leadership-details-card">
                  <div className="leadership-details-card__header">
                    <div>
                      <p className="leadership-details-card__eyebrow">
                        Online meeting
                      </p>

                      <h2>
                        JVP Connect
                        Room
                      </h2>
                    </div>
                  </div>

                  <div className="leadership-details-room-preview">
                    <span>
                      Room code
                    </span>

                    <strong>
                      {meeting.liveRoom
                        ?.roomCode ||
                        "Not generated"}
                    </strong>

                    <small>
                      {meeting.liveRoom
                        ?.roomLocked
                        ? "Room locked"
                        : "Room available"}
                    </small>
                  </div>
                </article>
              )}
            </section>
          </div>
        );
      };

    /* ========================================================
   AGENDA
======================================================== */

const renderAgenda = () => {
  return (
    <div className="leadership-details-tab-panel">
      <MeetingAgenda
        meetingId={meetingId}
        agenda={meeting?.agenda || []}
        participants={
          meeting?.participants || []
        }
      canManage={canManageMeeting}
        onMeetingRefresh={loadMeeting}
      />
    </div>
  );
};

    /* ========================================================
       PARTICIPANTS
    ======================================================== */

   const renderParticipants = () => {
  return (
    <MeetingParticipants
      meetingId={meetingId}
      participants={meeting?.participants || []}
      canManage={canManageMeeting}
      onMeetingRefresh={loadMeeting}
    />
  );
};

/* ========================================================
       HOST, CO-HOSTS AND MANAGERS
    ======================================================== */

const renderManagers = () => {
  return (
    <MeetingManagers
      meetingId={meetingId}
      host={meeting?.host || null}
      coHosts={meeting?.coHosts || []}
      moderators={meeting?.moderators || []}
      participants={meeting?.participants || []}
      canManage={canManageMeeting}
      onMeetingRefresh={loadMeeting}
    />
  );
};

    /* ========================================================
       ATTENDANCE
    ======================================================== */

   const renderAttendance = () => {
  return (
    <MeetingAttendance
      meetingId={meetingId}
      canManage={canManageMeeting}
      onMeetingRefresh={loadMeeting}
    />
  );
};

    /* ========================================================
       DOCUMENTS
    ======================================================== */

   const renderDocuments = () => {
  return (
    <MeetingDocuments
      meetingId={meetingId}
      documents={meeting?.documents || []}
      canManage={canManageMeeting}
      onMeetingRefresh={loadMeeting}
    />
  );
};

    /* ========================================================
       MINUTES
    ======================================================== */

    const renderMinutes = () => {
  return (
    <MeetingMinutes
      meetingId={meetingId}
      meetingTitle={meeting?.title || ""}
      minutes={meeting?.minutes || null}
      canManage={canManageMeeting}
      canApprove={true}
      onMeetingRefresh={loadMeeting}
    />
  );
};

    /* ========================================================
       RESOLUTIONS
    ======================================================== */

   const renderResolutions = () => {
  return (
    <MeetingResolutions
      meetingId={meetingId}
      resolutions={meeting?.resolutions || []}
      canManage={canManageMeeting}
      canApprove={true}
      onMeetingRefresh={loadMeeting}
    />
  );
};

    /* ========================================================
       ACTION ITEMS
    ======================================================== */

    const renderActionItems = () => {
  return (
    <MeetingActionItems
      meetingId={meetingId}
      actionItems={meeting?.actionItems || []}
      canManage={canManageMeeting}
      onMeetingRefresh={loadMeeting}
    />
  );
};

    /* ========================================================
       RECORDING
    ======================================================== */

   const renderRecording = () => {
  return (
    <MeetingRecordingControls
      meetingId={meetingId}
      meetingStatus={
        meeting?.status || ""
      }
      recording={
        meeting?.recording || null
      }
      canManage={canManageMeeting}
      onMeetingRefresh={loadMeeting}
    />
  );
};

 /* ========================================================
       LIVE ROOM CONTROLS
    ======================================================== */
const renderRoomControls = () => {
  return (
    <MeetingLiveRoomControls
      meetingId={meetingId}
      meeting={meeting}
      canManage={canManageMeeting}
      onMeetingRefresh={loadMeeting}
    />
  );
};


    /* ========================================================
       LIVE ROOM
    ======================================================== */

   const renderLiveRoom = () => {
  return (
    <MeetingLiveRoom
      meetingId={meetingId}
      meeting={meeting}
      currentUser={user}
      currentUserId={
        user?._id ||
        user?.id ||
        user?.userId ||
        ""
      }
      authToken={
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        ""
      }
       canManage={canManageMeeting}
  enterRoom={enterLiveRoom}
  onMeetingRefresh={loadMeeting}
  onLiveRoomExit={() => {
    setEnterLiveRoom(false);
    setActiveTab("overview");
  }}
/>
  );
};

    /* ========================================================
       TAB CONTENT
    ======================================================== */

    const renderActiveTab =
      () => {
        switch (activeTab) {
          case "agenda":
            return renderAgenda();

          case "participants":
            return renderParticipants();

          case "managers":
  return renderManagers();  

          case "attendance":
            return renderAttendance();

          case "documents":
            return renderDocuments();

          case "minutes":
            return renderMinutes();

          case "resolutions":
            return renderResolutions();

          case "action-items":
            return renderActionItems();

          case "recording":
            return renderRecording();

          case "room-controls":
  return renderRoomControls();  

          case "live-room":
            return renderLiveRoom();

          case "overview":
          default:
            return renderOverview();
        }
      };

    /* ========================================================
       LOADING AND ERROR
    ======================================================== */

    if (loading) {
      return (
        <main className="leadership-details-page">
          <div className="leadership-details-loading">
            <div className="leadership-details-spinner" />

            <h2>
              Loading meeting
            </h2>

            <p>
              Retrieving the meeting
              workspace...
            </p>
          </div>
        </main>
      );
    }

    if (
      !meeting &&
      error
    ) {
      return (
        <main className="leadership-details-page">
          <div className="leadership-details-error-state">
            <div className="leadership-details-error-state__icon">
              !
            </div>

            <h1>
              Meeting unavailable
            </h1>

            <p>{error}</p>

            <div>
              <button
                type="button"
                className="leadership-details-button leadership-details-button--primary"
                onClick={
                  loadMeeting
                }
              >
                Try Again
              </button>

              <Link
                to="/workspace/leadership/meetings"
                className="leadership-details-button leadership-details-button--secondary"
              >
                Back to Meetings
              </Link>
            </div>
          </div>
        </main>
      );
    }

    /* ========================================================
       PAGE
    ======================================================== */

    return (
      <main className="leadership-details-page">
        <header className="leadership-details-header">
          <div className="leadership-details-header__top">
            <Link
              to="/workspace/leadership/meetings"
              className="leadership-details-back-link"
            >
              ← Leadership Meetings
            </Link>

        
          </div>

          <div className="leadership-details-header__main">
            <div className="leadership-details-header__identity">
              <div className="leadership-details-header__badges">
                {renderStatusBadge(
                  meeting.status
                )}

                <span className="leadership-details-format-badge">
                  {FORMAT_LABELS[
                    meeting.format
                  ] ||
                    meeting.format}
                </span>

                {meeting.meetingNumber && (
                  <span className="leadership-details-number-badge">
                    {
                      meeting.meetingNumber
                    }
                  </span>
                )}
              </div>

              <h1>
                {meeting.title}
              </h1>

              <p>
                {meeting.description ||
                  "Manage this leadership meeting from the JVP Connect workspace."}
              </p>

              <div className="leadership-details-header__schedule">
                <span>
                  {formatDateTime(
                    meeting.scheduledStart
                  )}
                </span>

                <span aria-hidden="true">
                  •
                </span>

                <span>
                  {formatDuration(
                    durationMinutes
                  )}
                </span>

                {meeting.liveRoom
                  ?.roomCode && (
                  <>
                    <span aria-hidden="true">
                      •
                    </span>

                    <span>
                      Room{" "}
                      {
                        meeting
                          .liveRoom
                          .roomCode
                      }
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="leadership-details-header__actions">
              {isHost &&
  [
    "draft",
    "postponed",
  ].includes(meeting.status) && (
                <button
                  type="button"
                  className="leadership-details-button leadership-details-button--primary"
                  onClick={
                    handleSchedule
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Schedule Meeting
                </button>
              )}

              {meeting.status ===
  "scheduled" &&
  canStartMeeting && (
                <button
                  type="button"
                  className="leadership-details-button leadership-details-button--success"
                  onClick={
                    handleStart
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Start Meeting
                </button>
              )}

              {meeting.status ===
                "live" && (
                <>
                  <button
  type="button"
  className="leadership-details-button leadership-details-button--light"
 onClick={() => {
  setEnterLiveRoom(true);
  setActiveTab("live-room");
}}
>
  Join Room
</button>

                  {canEndMeeting && (
  <button
    type="button"
    className="leadership-details-button leadership-details-button--danger"
    onClick={handleEnd}
    disabled={actionLoading}
  >
    End Meeting
  </button>
)}
                </>
              )}

             {isHost &&
  ![
    "completed",
    "cancelled",
  ].includes(meeting.status) && (
                <button
                  type="button"
                  className="leadership-details-button leadership-details-button--light"
                  onClick={
                    handleCancel
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <section className="leadership-details-header__stats">
            <article>
              <span>
                Participants
              </span>

              <strong>
                {participantCount}
              </strong>
            </article>

            <article>
              <span>
                Agenda
              </span>

              <strong>
                {agendaCount}
              </strong>
            </article>

            <article>
              <span>
                Documents
              </span>

              <strong>
                {documentCount}
              </strong>
            </article>

            <article>
              <span>
                Resolutions
              </span>

              <strong>
                {resolutionCount}
              </strong>
            </article>

            <article>
              <span>
                Action Items
              </span>

              <strong>
                {actionItemCount}
              </strong>
            </article>
          </section>
        </header>

        {error && (
          <div
            className="leadership-details-alert leadership-details-alert--error"
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
            className="leadership-details-alert leadership-details-alert--success"
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

       <section className="leadership-details-workspace">
  <nav
    className="leadership-details-tabs"
    aria-label="Meeting workspace sections"
  >
    {WORKSPACE_TABS.map((tab) => {
      let count = null;

      if (tab.id === "agenda") {
        count = agendaCount;
      }

      if (tab.id === "participants") {
        count = participantCount;
      }

      if (tab.id === "documents") {
        count = documentCount;
      }

      if (tab.id === "resolutions") {
        count = resolutionCount;
      }

      if (tab.id === "action-items") {
        count = actionItemCount;
      }

      return (
        <button
          key={tab.id}
          type="button"
          className={
            activeTab === tab.id
              ? "leadership-details-tabs__button leadership-details-tabs__button--active"
              : "leadership-details-tabs__button"
          }
          onClick={() => setActiveTab(tab.id)}
        >
          <span>{tab.label}</span>

          {count !== null && (
            <strong>{count}</strong>
          )}
        </button>
      );
    })}
  </nav>

  <section className="leadership-details-content">
    {renderActiveTab()}
  </section>
</section>
      </main>
    );
  };

export default LeadershipMeetingDetails;