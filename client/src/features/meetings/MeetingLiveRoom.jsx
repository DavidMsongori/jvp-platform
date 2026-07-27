import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheck,
  FiClock,
  FiCopy,
  FiExternalLink,
  FiLogIn,
  FiLogOut,
  FiMic,
  FiMicOff,
  FiMonitor,
  FiPhoneOff,
  FiSettings,
  FiShield,
  FiUsers,
  FiVideo,
  FiVideoOff,
  FiX,
} from "react-icons/fi";

import {
  joinMeeting,
  leaveMeeting,
  respondToMeetingInvitation,
  updateLiveRoomSettings,
} from "../../services/meeting.service";

import LiveMeetingRoom from "../../features/live-meeting/components/LiveMeetingRoom";

import {
  LiveMeetingProvider,
} from "../../features/live-meeting/LiveMeetingContext";

import "./MeetingLiveRoom.css";

const DEFAULT_SETTINGS = {
  roomEnabled: true,
  waitingRoomEnabled: true,
  participantsCanUseMicrophone: true,
  participantsCanUseCamera: true,
  participantsCanShareScreen: false,
  participantsCanChat: true,
  autoAdmitParticipants: false,
  muteParticipantsOnEntry: true,
};

const INVITATION_OPTIONS = [
  {
    value: "accepted",
    label: "Accept",
  },
  {
    value: "tentative",
    label: "Maybe",
  },
  {
    value: "declined",
    label: "Decline",
  },
];

const normalizeBoolean = (
  value,
  fallback = false
) => {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
};

const getRoomSettings = (meeting) => {
  const settings =
    meeting?.liveRoomSettings ||
    meeting?.roomSettings ||
    meeting?.liveRoom ||
    {};

  return {
    roomEnabled: normalizeBoolean(
      settings.roomEnabled ??
        settings.enabled,
      DEFAULT_SETTINGS.roomEnabled
    ),

    waitingRoomEnabled: normalizeBoolean(
      settings.waitingRoomEnabled ??
        settings.waitingRoom,
      DEFAULT_SETTINGS.waitingRoomEnabled
    ),

    participantsCanUseMicrophone:
      normalizeBoolean(
        settings.participantsCanUseMicrophone ??
          settings.allowMicrophone,
        DEFAULT_SETTINGS
          .participantsCanUseMicrophone
      ),

    participantsCanUseCamera:
      normalizeBoolean(
        settings.participantsCanUseCamera ??
          settings.allowCamera,
        DEFAULT_SETTINGS
          .participantsCanUseCamera
      ),

    participantsCanShareScreen:
      normalizeBoolean(
        settings.participantsCanShareScreen ??
          settings.allowScreenShare,
        DEFAULT_SETTINGS
          .participantsCanShareScreen
      ),

    participantsCanChat: normalizeBoolean(
      settings.participantsCanChat ??
        settings.allowChat,
      DEFAULT_SETTINGS.participantsCanChat
    ),

    autoAdmitParticipants:
      normalizeBoolean(
        settings.autoAdmitParticipants ??
          settings.autoAdmit,
        DEFAULT_SETTINGS
          .autoAdmitParticipants
      ),

    muteParticipantsOnEntry:
      normalizeBoolean(
        settings.muteParticipantsOnEntry ??
          settings.muteOnEntry,
        DEFAULT_SETTINGS
          .muteParticipantsOnEntry
      ),
  };
};

const getCurrentParticipant = (
  meeting,
  currentUserId
) => {
  const participants = Array.isArray(
    meeting?.participants
  )
    ? meeting.participants
    : [];

  return participants.find((participant) => {
    const participantUserId =
      participant?.user?._id ||
      participant?.user?.id ||
      participant?.user ||
      participant?.userId ||
      participant?.participantUserId;

    return (
      String(participantUserId || "") ===
      String(currentUserId || "")
    );
  });
};

const getInvitationStatus = (
  meeting,
  currentUserId
) => {
  const participant =
    getCurrentParticipant(
      meeting,
      currentUserId
    );

  return (
    participant?.invitationStatus ||
    participant?.response ||
    participant?.rsvpStatus ||
    "pending"
  );
};

const getMeetingStatus = (meeting) => {
  return (
    meeting?.status ||
    meeting?.meetingStatus ||
    "scheduled"
  );
};

const getRoomCode = (meeting) => {
  return (
    meeting?.roomCode ||
    meeting?.liveRoomCode ||
    meeting?.code ||
    ""
  );
};

const getRoomUrl = (meeting) => {
  return (
    meeting?.roomUrl ||
    meeting?.meetingUrl ||
    meeting?.liveRoomUrl ||
    ""
  );
};

const getParticipantCount = (meeting) => {
  if (
    typeof meeting?.activeParticipantCount ===
    "number"
  ) {
    return meeting.activeParticipantCount;
  }

  if (
    Array.isArray(
      meeting?.activeParticipants
    )
  ) {
    return meeting.activeParticipants.length;
  }

  if (Array.isArray(meeting?.participants)) {
    return meeting.participants.filter(
      (participant) =>
        participant?.isInRoom ||
        participant?.joined ||
        participant?.attendanceStatus ===
          "present"
    ).length;
  }

  return 0;
};

const MeetingLiveRoom = ({
  meetingId,
  meeting = null,

  currentUser = null,
  currentUserId = "",

  authToken = "",

  canManage = false,
  enterRoom = false,
  onMeetingRefresh,
}) => {
  const resolvedCurrentUserId =
    currentUserId ||
    currentUser?._id ||
    currentUser?.id ||
    currentUser?.userId ||
    "";

  const initialSettings = useMemo(
    () => getRoomSettings(meeting),
    [meeting]
  );

  const [settings, setSettings] =
    useState(initialSettings);

  const [showSettings, setShowSettings] =
    useState(false);

 const [isJoined, setIsJoined] = useState(
  Boolean(
    getCurrentParticipant(
      meeting,
      resolvedCurrentUserId
    )?.isInRoom ||
      getCurrentParticipant(
        meeting,
        resolvedCurrentUserId
      )?.joined
  )
);

  const [microphoneEnabled, setMicrophoneEnabled] =
    useState(false);

  const [cameraEnabled, setCameraEnabled] =
    useState(false);

  const [joining, setJoining] =
    useState(false);

  const [leaving, setLeaving] =
    useState(false);

  const [savingSettings, setSavingSettings] =
    useState(false);

  const [
    respondingInvitation,
    setRespondingInvitation,
  ] = useState("");

  const [copied, setCopied] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

 useEffect(() => {
  const participant =
    getCurrentParticipant(
      meeting,
      resolvedCurrentUserId
    );

  const participantJoined =
    Boolean(
      participant?.isInRoom ||
        participant?.joined ||
        participant?.attendanceStatus ===
          "present"
    );

  setIsJoined(
    enterRoom ||
    participantJoined
  );
}, [
  meeting,
  resolvedCurrentUserId,
  enterRoom,
]);

  const meetingStatus =
    getMeetingStatus(meeting);

  const roomCode = getRoomCode(meeting);
  const roomUrl = getRoomUrl(meeting);

 const invitationStatus =
  getInvitationStatus(
    meeting,
    resolvedCurrentUserId
  );

  const activeParticipantCount =
    getParticipantCount(meeting);

  const roomIsAvailable =
    settings.roomEnabled &&
    !["cancelled", "completed"].includes(
      meetingStatus
    );

  const handleInvitationResponse = async (
    responseStatus
  ) => {
    try {
      setRespondingInvitation(
        responseStatus
      );

      setError("");
      setSuccessMessage("");

      await respondToMeetingInvitation(
        meetingId,
        responseStatus
      );

      setSuccessMessage(
        `Invitation ${
          responseStatus === "accepted"
            ? "accepted"
            : responseStatus === "declined"
              ? "declined"
              : "marked as tentative"
        } successfully.`
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to update your invitation response."
      );
    } finally {
      setRespondingInvitation("");
    }
  };

  const handleJoinMeeting = async () => {
    if (!roomIsAvailable) {
      setError(
        "The live room is not currently available."
      );

      return;
    }

    try {
      setJoining(true);
      setError("");
      setSuccessMessage("");

      await joinMeeting(meetingId);

      setIsJoined(true);

      setSuccessMessage(
        settings.waitingRoomEnabled
          ? "You have joined the meeting waiting room."
          : "You have joined the meeting."
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to join the meeting."
      );
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveMeeting = async () => {
    const confirmed = window.confirm(
      "Leave this live meeting room?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLeaving(true);
      setError("");
      setSuccessMessage("");

      await leaveMeeting(meetingId);

      setIsJoined(false);
      setMicrophoneEnabled(false);
      setCameraEnabled(false);

      setSuccessMessage(
        "You have left the meeting room."
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to leave the meeting."
      );
    } finally {
      setLeaving(false);
    }
  };

const handleLiveRoomExit =
  async () => {
    setIsJoined(false);
    setMicrophoneEnabled(false);
    setCameraEnabled(false);

    try {
      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (refreshError) {
      console.error(
        "Unable to refresh meeting after leaving:",
        refreshError
      );
    }
  };


  const handleSettingsChange = (
    event
  ) => {
    const {
      name,
      checked,
    } = event.target;

    setSettings((currentSettings) => ({
      ...currentSettings,
      [name]: checked,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      setError("");
      setSuccessMessage("");

      await updateLiveRoomSettings(
        meetingId,
        settings
      );

      setSuccessMessage(
        "Live room settings updated successfully."
      );

      setShowSettings(false);

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to update the live room settings."
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCopyRoomCode = async () => {
    if (!roomCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        roomCode
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setError(
        "Unable to copy the room code."
      );
    }
  };

  const handleOpenExternalRoom = () => {
    if (!roomUrl) {
      return;
    }

    window.open(
      roomUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

if (isJoined) {
  return (
    <LiveMeetingProvider
      meetingId={meetingId}
      meeting={meeting}
      currentUser={currentUser}
      authToken={authToken}
    >
      <LiveMeetingRoom
        meeting={meeting}
        currentUser={currentUser}
        onLeave={
          handleLiveRoomExit
        }
        onOpenChat={() => {
          console.log(
            "Open meeting chat"
          );
        }}
        onOpenParticipants={() => {
          console.log(
            "Open participants panel"
          );
        }}
        onOpenSettings={() => {
          console.log(
            "Open meeting settings"
          );
        }}
      />
    </LiveMeetingProvider>
  );
}


  return (
    <section className="meeting-live-room">
      <div className="meeting-live-room__header">
        <div>
          <span className="meeting-live-room__eyebrow">
            Virtual meeting space
          </span>

          <h2>
            <FiVideo />
            Live Room
          </h2>

          <p>
            Join the live meeting, manage room
            permissions and respond to your meeting
            invitation.
          </p>
        </div>

        <div className="meeting-live-room__header-actions">
          <span
            className={`meeting-live-room__status meeting-live-room__status--${meetingStatus}`}
          >
            <span />
            {meetingStatus}
          </span>

          {canManage && (
            <button
              type="button"
              className="meeting-live-room__settings-button"
              onClick={() =>
                setShowSettings(
                  (currentValue) =>
                    !currentValue
                )
              }
            >
              {showSettings ? (
                <FiX />
              ) : (
                <FiSettings />
              )}

              {showSettings
                ? "Close settings"
                : "Room settings"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="meeting-live-room__alert meeting-live-room__alert--error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="meeting-live-room__alert meeting-live-room__alert--success">
          {successMessage}
        </div>
      )}

      <div className="meeting-live-room__summary">
        <article>
          <span>
            <FiUsers />
          </span>

          <div>
            <small>In room</small>
            <strong>
              {activeParticipantCount}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <FiShield />
          </span>

          <div>
            <small>Waiting room</small>
            <strong>
              {settings.waitingRoomEnabled
                ? "Enabled"
                : "Disabled"}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <FiClock />
          </span>

          <div>
            <small>Room status</small>
            <strong>
              {roomIsAvailable
                ? "Available"
                : "Unavailable"}
            </strong>
          </div>
        </article>
      </div>

      {showSettings && canManage && (
        <div className="meeting-live-room__settings-panel">
          <div className="meeting-live-room__settings-header">
            <div>
              <h3>Live room settings</h3>

              <p>
                Control how participants access and
                interact with the meeting room.
              </p>
            </div>
          </div>

          <div className="meeting-live-room__settings-grid">
            <label>
              <div>
                <strong>Enable live room</strong>

                <span>
                  Allow participants to access this
                  meeting room.
                </span>
              </div>

              <input
                type="checkbox"
                name="roomEnabled"
                checked={
                  settings.roomEnabled
                }
                onChange={
                  handleSettingsChange
                }
              />
            </label>

            <label>
              <div>
                <strong>Waiting room</strong>

                <span>
                  Hold participants until they are
                  admitted.
                </span>
              </div>

              <input
                type="checkbox"
                name="waitingRoomEnabled"
                checked={
                  settings.waitingRoomEnabled
                }
                onChange={
                  handleSettingsChange
                }
              />
            </label>

            <label>
              <div>
                <strong>
                  Auto-admit participants
                </strong>

                <span>
                  Allow participants to enter without
                  host approval.
                </span>
              </div>

              <input
                type="checkbox"
                name="autoAdmitParticipants"
                checked={
                  settings.autoAdmitParticipants
                }
                onChange={
                  handleSettingsChange
                }
              />
            </label>

            <label>
              <div>
                <strong>Mute on entry</strong>

                <span>
                  Join participants with microphones
                  muted.
                </span>
              </div>

              <input
                type="checkbox"
                name="muteParticipantsOnEntry"
                checked={
                  settings.muteParticipantsOnEntry
                }
                onChange={
                  handleSettingsChange
                }
              />
            </label>

            <label>
              <div>
                <strong>Allow microphones</strong>

                <span>
                  Participants may unmute themselves.
                </span>
              </div>

              <input
                type="checkbox"
                name="participantsCanUseMicrophone"
                checked={
                  settings
                    .participantsCanUseMicrophone
                }
                onChange={
                  handleSettingsChange
                }
              />
            </label>

            <label>
              <div>
                <strong>Allow cameras</strong>

                <span>
                  Participants may enable video.
                </span>
              </div>

              <input
                type="checkbox"
                name="participantsCanUseCamera"
                checked={
                  settings.participantsCanUseCamera
                }
                onChange={
                  handleSettingsChange
                }
              />
            </label>

            <label>
              <div>
                <strong>
                  Allow screen sharing
                </strong>

                <span>
                  Participants may share their
                  screens.
                </span>
              </div>

              <input
                type="checkbox"
                name="participantsCanShareScreen"
                checked={
                  settings
                    .participantsCanShareScreen
                }
                onChange={
                  handleSettingsChange
                }
              />
            </label>

            <label>
              <div>
                <strong>Allow room chat</strong>

                <span>
                  Participants may send messages in
                  the live room.
                </span>
              </div>

              <input
                type="checkbox"
                name="participantsCanChat"
                checked={
                  settings.participantsCanChat
                }
                onChange={
                  handleSettingsChange
                }
              />
            </label>
          </div>

          <div className="meeting-live-room__settings-footer">
            <button
              type="button"
              onClick={() =>
                setSettings(
                  initialSettings
                )
              }
              disabled={savingSettings}
            >
              Reset
            </button>

            <button
              type="button"
              className="meeting-live-room__save-settings"
              onClick={handleSaveSettings}
              disabled={savingSettings}
            >
              <FiCheck />

              {savingSettings
                ? "Saving..."
                : "Save settings"}
            </button>
          </div>
        </div>
      )}

      <div className="meeting-live-room__invitation">
        <div>
          <h3>Meeting invitation</h3>

          <p>
            Your current response is{" "}
            <strong>
              {invitationStatus}
            </strong>
            .
          </p>
        </div>

        <div>
          {INVITATION_OPTIONS.map(
            (option) => (
              <button
                key={option.value}
                type="button"
                className={`meeting-live-room__response-button meeting-live-room__response-button--${option.value}`}
                onClick={() =>
                  handleInvitationResponse(
                    option.value
                  )
                }
                disabled={
                  Boolean(
                    respondingInvitation
                  ) ||
                  invitationStatus ===
                    option.value
                }
              >
                {respondingInvitation ===
                option.value
                  ? "Updating..."
                  : option.label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="meeting-live-room__room">
      
      <div className="meeting-live-room__stage">
  <div className="meeting-live-room__stage-empty">
    <div className="meeting-live-room__stage-icon">
      <FiVideo />
    </div>

    <h3>Ready to join?</h3>

    <p>
      Check your microphone and camera
      preferences before entering the live
      meeting room.
    </p>
  </div>
</div>

        <aside className="meeting-live-room__sidebar">
          <div className="meeting-live-room__room-info">
            <h3>Room access</h3>

            {roomCode ? (
              <div className="meeting-live-room__room-code">
                <span>Room code</span>

                <div>
                  <strong>{roomCode}</strong>

                  <button
                    type="button"
                    onClick={
                      handleCopyRoomCode
                    }
                  >
                    {copied ? (
                      <FiCheck />
                    ) : (
                      <FiCopy />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p>
                No room code has been assigned.
              </p>
            )}

            {roomUrl && (
              <button
                type="button"
                className="meeting-live-room__external-button"
                onClick={
                  handleOpenExternalRoom
                }
              >
                <FiExternalLink />
                Open external meeting link
              </button>
            )}
          </div>

          <div className="meeting-live-room__device-controls">
            <h3>Device controls</h3>

            <div>
              <button
                type="button"
                className={
                  microphoneEnabled
                    ? "is-active"
                    : ""
                }
                onClick={() =>
                  setMicrophoneEnabled(
                    (currentValue) =>
                      !currentValue
                  )
                }
                disabled={
                  !settings
                    .participantsCanUseMicrophone
                }
              >
                {microphoneEnabled ? (
                  <FiMic />
                ) : (
                  <FiMicOff />
                )}

                <span>
                  {microphoneEnabled
                    ? "Microphone on"
                    : "Microphone off"}
                </span>
              </button>

              <button
                type="button"
                className={
                  cameraEnabled
                    ? "is-active"
                    : ""
                }
                onClick={() =>
                  setCameraEnabled(
                    (currentValue) =>
                      !currentValue
                  )
                }
                disabled={
                  !settings
                    .participantsCanUseCamera
                }
              >
                {cameraEnabled ? (
                  <FiVideo />
                ) : (
                  <FiVideoOff />
                )}

                <span>
                  {cameraEnabled
                    ? "Camera on"
                    : "Camera off"}
                </span>
              </button>

              <button
                type="button"
                disabled={
                  !settings
                    .participantsCanShareScreen ||
                  !isJoined
                }
              >
                <FiMonitor />
                <span>Share screen</span>
              </button>
            </div>
          </div>

          <button
  type="button"
  className="meeting-live-room__join-button"
  onClick={handleJoinMeeting}
  disabled={
    joining ||
    !roomIsAvailable ||
    invitationStatus === "declined"
  }
>
  <FiLogIn />

  {joining
    ? "Joining..."
    : "Join live room"}
</button>
        </aside>
      </div>
    </section>
  );
};

export default MeetingLiveRoom;