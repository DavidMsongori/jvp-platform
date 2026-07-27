import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLiveMeeting,
  useLiveMeetingParticipants,
} from "../LiveMeetingContext";

import useLocalMedia from "../hooks/useLocalMedia";
import useWebRTC from "../hooks/useWebRTC";
import useScreenShare from "../hooks/useScreenShare";
import useMediaDevices from "../hooks/useMediaDevices";

import VideoGrid from "./VideoGrid";
import MeetingToolbar from "./MeetingToolbar";
import ParticipantsPanel from "./ParticipantsPanel";

import "./LiveMeetingRoom.css";

/* ==========================================================
   HELPERS
========================================================== */

const getUserDisplayName = (
  user
) => {
  if (!user) {
    return "You";
  }

  return (
    user.displayName ||
    user.fullName ||
    user.name ||
    [
      user.firstName,
      user.middleName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user.email ||
    "You"
  );
};

const getUserProfilePhoto = (
  user
) => {
  return (
    user?.profilePhoto ||
    user?.avatar ||
    user?.photo ||
    user?.member?.profilePhoto ||
    ""
  );
};

const getMeetingTitle = (
  meeting
) => {
  return (
    meeting?.title ||
    meeting?.name ||
    meeting?.meetingTitle ||
    "Live Meeting"
  );
};

const formatMeetingDuration = (
  seconds
) => {
  const safeSeconds =
    Math.max(
      0,
      Number(seconds) || 0
    );

  const hours =
    Math.floor(
      safeSeconds / 3600
    );

  const minutes =
    Math.floor(
      (
        safeSeconds % 3600
      ) / 60
    );

  const remainingSeconds =
    safeSeconds % 60;

  if (hours > 0) {
    return [
      hours,
      minutes,
      remainingSeconds,
    ]
      .map((value) =>
        String(value).padStart(
          2,
          "0"
        )
      )
      .join(":");
  }

  return [
    minutes,
    remainingSeconds,
  ]
    .map((value) =>
      String(value).padStart(
        2,
        "0"
      )
    )
    .join(":");
};

const getStatusLabel = ({
  socketStatus,
  joined,
  waiting,
  admitted,
}) => {
  if (
    socketStatus ===
      "connecting" ||
    socketStatus ===
      "reconnecting"
  ) {
    return "Connecting";
  }

  if (
    socketStatus ===
      "disconnected"
  ) {
    return "Disconnected";
  }

  if (waiting) {
    return "Waiting for admission";
  }

  if (
    joined &&
    admitted
  ) {
    return "Connected";
  }

  if (joined) {
    return "Joining";
  }

  return "Not joined";
};

/* ==========================================================
   ICONS
========================================================== */

const MicrophoneIcon = ({
  enabled,
}) => (
  <span
    aria-hidden="true"
    className="live-meeting-room__button-icon"
  >
    {enabled ? "🎙" : "🔇"}
  </span>
);

const CameraIcon = ({
  enabled,
}) => (
  <span
    aria-hidden="true"
    className="live-meeting-room__button-icon"
  >
    {enabled ? "▣" : "▢"}
  </span>
);

const ScreenShareIcon = () => (
  <span
    aria-hidden="true"
    className="live-meeting-room__button-icon"
  >
    ▤
  </span>
);

/* ==========================================================
   COMPONENT
========================================================== */

const LiveMeetingRoom = ({
  meeting: meetingProp = null,

  currentUser:
    currentUserProp = null,

  rtcConfiguration,

  autoStartMedia = true,

  defaultLayout = "auto",

  onLeave,

  onOpenChat,

  onOpenParticipants,

  onOpenSettings,

  className = "",
}) => {
  const liveMeeting =
    useLiveMeeting();

  const participantContext =
    useLiveMeetingParticipants?.() ||
    {};

  const meeting =
    meetingProp ||
    liveMeeting.meeting ||
    null;

  const currentUser =
    currentUserProp ||
    liveMeeting.currentUser ||
    liveMeeting.user ||
    null;

  const participants =
    participantContext.participants ||
    liveMeeting.participants ||
    [];

  const {
    socketStatus =
      "disconnected",

    joined = false,
    waiting = false,
    admitted = false,

    joining = false,
    leaving = false,

    raisedHand = false,

    roomStatus,

    leaveMeeting,

    setRaisedHand,
    toggleRaisedHand,

    localStreamRef,
    remoteStreamsRef,
  } = liveMeeting;

  /* ========================================================
     MEDIA HOOKS
  ======================================================== */

  const localMedia =
    useLocalMedia({
      autoStart:
        autoStartMedia &&
        joined &&
        admitted,
    });

  const webRTC =
    useWebRTC({
      rtcConfiguration,
    });

  const screenShare =
    useScreenShare({
      webRTC,
    });

  const mediaDevices =
    useMediaDevices({
      localMedia,
      webRTC,
    });

  /* ========================================================
     LOCAL STATE
  ======================================================== */

  const [
    layout,
    setLayout,
  ] = useState(
    defaultLayout
  );

  const [
    controlsVisible,
    setControlsVisible,
  ] = useState(true);

  const [
    deviceMenuOpen,
    setDeviceMenuOpen,
  ] = useState(false);

  const [
  participantsPanelOpen,
  setParticipantsPanelOpen,
] = useState(false);

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [
    actionError,
    setActionError,
  ] = useState(null);

  const [
    actionBusy,
    setActionBusy,
  ] = useState("");

  /* ========================================================
     RESOLVED MEDIA VALUES
  ======================================================== */

  const localStream =
    localMedia.localStream ||
    localMedia.stream ||
    localStreamRef?.current ||
    null;

  const currentRemoteStreams =
    webRTC.remoteStreams ||
    webRTC.remoteStreamsRef
      ?.current ||
    remoteStreamsRef?.current ||
    null;

  const microphoneEnabled =
    localMedia.microphoneEnabled ??
    localMedia.microphone ??
    liveMeeting.localMedia
      ?.microphone ??
    false;

  const cameraEnabled =
    localMedia.cameraEnabled ??
    localMedia.camera ??
    liveMeeting.localMedia
      ?.camera ??
    false;

  const screenSharing =
    screenShare.screenSharing ??
    liveMeeting.localMedia
      ?.screenSharing ??
    false;

  const displayName =
    getUserDisplayName(
      currentUser
    );

  const profilePhoto =
    getUserProfilePhoto(
      currentUser
    );

  const participantCount =
    participants.length + 1;

  const meetingTitle =
    getMeetingTitle(meeting);

  const connectionLabel =
    getStatusLabel({
      socketStatus,
      joined,
      waiting,
      admitted,
    });

  const isConnected =
    socketStatus ===
      "connected" &&
    joined &&
    admitted;

  const roomEnded =
    roomStatus === "ended" ||
    meeting?.status === "ended";

  /* ========================================================
     MEETING TIMER
  ======================================================== */

  useEffect(() => {
    if (
      !joined ||
      !admitted ||
      roomEnded
    ) {
      return undefined;
    }

    const startedAt =
      meeting?.startedAt ||
      meeting?.actualStartTime ||
      new Date().toISOString();

    const updateTimer = () => {
      const startTime =
        new Date(
          startedAt
        ).getTime();

      if (
        Number.isNaN(startTime)
      ) {
        return;
      }

      setElapsedSeconds(
        Math.max(
          0,
          Math.floor(
            (
              Date.now() -
              startTime
            ) / 1000
          )
        )
      );
    };

    updateTimer();

    const timer =
      window.setInterval(
        updateTimer,
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    joined,
    admitted,
    roomEnded,
    meeting?.startedAt,
    meeting?.actualStartTime,
  ]);

  /* ========================================================
     ERROR COLLECTION
  ======================================================== */

  const visibleError =
    actionError ||
    localMedia.mediaError ||
    localMedia.error ||
    screenShare.screenShareError ||
    mediaDevices.deviceError ||
    webRTC.error ||
    null;

  const visibleErrorMessage =
    visibleError?.message ||
    visibleError?.code ||
    String(
      visibleError || ""
    );

  const clearErrors =
    useCallback(() => {
      setActionError(null);

      localMedia.clearMediaError?.();
      localMedia.clearError?.();

      screenShare
        .clearScreenShareError?.();

      mediaDevices
        .clearDeviceError?.();

      webRTC.clearError?.();
    }, [
      localMedia,
      screenShare,
      mediaDevices,
      webRTC,
    ]);

  /* ========================================================
     MICROPHONE
  ======================================================== */

  const handleToggleMicrophone =
    useCallback(async () => {
      if (
        actionBusy ||
        !isConnected
      ) {
        return;
      }

      setActionBusy(
        "microphone"
      );

      setActionError(null);

      try {
        if (
          typeof localMedia
            .toggleMicrophone ===
          "function"
        ) {
          await localMedia
            .toggleMicrophone();
        } else if (
          typeof localMedia
            .toggleAudio ===
          "function"
        ) {
          await localMedia
            .toggleAudio();
        } else {
          throw new Error(
            "Microphone controls are unavailable."
          );
        }
      } catch (error) {
        setActionError(error);
      } finally {
        setActionBusy("");
      }
    }, [
      actionBusy,
      isConnected,
      localMedia,
    ]);

  /* ========================================================
     CAMERA
  ======================================================== */

  const handleToggleCamera =
    useCallback(async () => {
      if (
        actionBusy ||
        !isConnected
      ) {
        return;
      }

      setActionBusy("camera");
      setActionError(null);

      try {
        if (
          typeof localMedia
            .toggleCamera ===
          "function"
        ) {
          await localMedia
            .toggleCamera();
        } else if (
          typeof localMedia
            .toggleVideo ===
          "function"
        ) {
          await localMedia
            .toggleVideo();
        } else {
          throw new Error(
            "Camera controls are unavailable."
          );
        }
      } catch (error) {
        setActionError(error);
      } finally {
        setActionBusy("");
      }
    }, [
      actionBusy,
      isConnected,
      localMedia,
    ]);

  /* ========================================================
     SCREEN SHARE
  ======================================================== */

  const handleToggleScreenShare =
    useCallback(async () => {
      if (
        actionBusy ||
        !isConnected
      ) {
        return;
      }

      setActionBusy(
        "screen-share"
      );

      setActionError(null);

      try {
        await screenShare
          .toggleScreenShare();
      } catch (error) {
        setActionError(error);
      } finally {
        setActionBusy("");
      }
    }, [
      actionBusy,
      isConnected,
      screenShare,
    ]);

  /* ========================================================
     RAISED HAND
  ======================================================== */

  const handleToggleRaisedHand =
    useCallback(async () => {
      if (
        actionBusy ||
        !isConnected
      ) {
        return;
      }

      setActionBusy(
        "raised-hand"
      );

      setActionError(null);

      try {
        if (
          typeof toggleRaisedHand ===
          "function"
        ) {
          await toggleRaisedHand();
        } else if (
          typeof setRaisedHand ===
          "function"
        ) {
          await setRaisedHand(
            !raisedHand
          );
        } else {
          throw new Error(
            "Raised-hand controls are unavailable."
          );
        }
      } catch (error) {
        setActionError(error);
      } finally {
        setActionBusy("");
      }
    }, [
      actionBusy,
      isConnected,
      toggleRaisedHand,
      setRaisedHand,
      raisedHand,
    ]);

const handleToggleParticipantsPanel =
  useCallback(() => {
    setParticipantsPanelOpen(
      (current) => !current
    );
  }, []);



  /* ========================================================
     LEAVE MEETING
  ======================================================== */

  const handleLeaveMeeting =
    useCallback(async () => {
      if (
        actionBusy ||
        leaving
      ) {
        return;
      }

      setParticipantsPanelOpen(false);
      setActionBusy("leave");
      setActionError(null);

      try {
        if (
          screenShare
            .screenSharing
        ) {
          await screenShare
            .stopScreenShare({
              notifyServer: true,
              restoreCamera:
                false,
              reason:
                "meeting-left",
            });
        }

        localMedia.stopLocalMedia?.();
        localMedia.stopLocalStream?.();

        if (
          typeof leaveMeeting ===
          "function"
        ) {
          await leaveMeeting();
        }

        if (
          typeof onLeave ===
          "function"
        ) {
          onLeave({
            meeting,
          });
        }
      } catch (error) {
        setActionError(error);
      } finally {
        setActionBusy("");
      }
    }, [
      actionBusy,
      leaving,
      screenShare,
      localMedia,
      leaveMeeting,
      onLeave,
      meeting,
    ]);

  /* ========================================================
     DEVICE SELECTION
  ======================================================== */

  const handleMicrophoneChange =
    useCallback(
      async (event) => {
        const deviceId =
          event.target.value;

        try {
          setActionError(null);

          await mediaDevices
            .selectAudioInput(
              deviceId
            );
        } catch (error) {
          setActionError(error);
        }
      },
      [mediaDevices]
    );

  const handleCameraChange =
    useCallback(
      async (event) => {
        const deviceId =
          event.target.value;

        try {
          setActionError(null);

          await mediaDevices
            .selectVideoInput(
              deviceId
            );
        } catch (error) {
          setActionError(error);
        }
      },
      [mediaDevices]
    );

  const handleSpeakerChange =
    useCallback(
      async (event) => {
        const deviceId =
          event.target.value;

        try {
          setActionError(null);

          const mediaElements =
            Array.from(
              document.querySelectorAll(
                ".participant-video__video"
              )
            );

          await mediaDevices
            .selectAudioOutput(
              deviceId,
              mediaElements
            );
        } catch (error) {
          setActionError(error);
        }
      },
      [mediaDevices]
    );

  /* ========================================================
     KEYBOARD CONTROLS
  ======================================================== */

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        const target =
          event.target;

        const tagName =
          target?.tagName
            ?.toLowerCase();

        const isTyping =
          tagName === "input" ||
          tagName ===
            "textarea" ||
          tagName ===
            "select" ||
          target?.isContentEditable;

        if (isTyping) {
          return;
        }

        if (
          event.key.toLowerCase() ===
          "m"
        ) {
          event.preventDefault();

          handleToggleMicrophone();
        }

        if (
          event.key.toLowerCase() ===
          "v"
        ) {
          event.preventDefault();

          handleToggleCamera();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    handleToggleMicrophone,
    handleToggleCamera,
  ]);

  /* ========================================================
     PAGE TITLE
  ======================================================== */

  useEffect(() => {
    const previousTitle =
      document.title;

    document.title =
      `${meetingTitle} | JVP Connect`;

    return () => {
      document.title =
        previousTitle;
    };
  }, [meetingTitle]);

  /* ========================================================
     GRID PROPS
  ======================================================== */

  const videoGridProps =
    useMemo(
      () => ({
        participants,

        remoteStreams:
          currentRemoteStreams,

        localStream,

        localScreenStream:
          screenShare
            .screenStream,

        currentUser,

        localDisplayName:
          displayName,

        localProfilePhoto:
          profilePhoto,

        localMicrophoneEnabled:
          microphoneEnabled,

        localCameraEnabled:
          cameraEnabled,

        localScreenSharing:
          screenSharing,

        audioOutputDeviceId:
          mediaDevices
            .selectedAudioOutputId,

        layout,

        prioritizeScreenShare:
          true,

        allowPinning: true,

        showParticipantCount:
          false,
      }),
      [
        participants,
        currentRemoteStreams,
        localStream,
        screenShare
          .screenStream,
        currentUser,
        displayName,
        profilePhoto,
        microphoneEnabled,
        cameraEnabled,
        screenSharing,
        mediaDevices
          .selectedAudioOutputId,
        layout,
      ]
    );

  /* ========================================================
     ROOT CLASSES
  ======================================================== */

  const rootClassName = [
    "live-meeting-room",

    controlsVisible
      ? ""
      : "live-meeting-room--controls-hidden",

    screenSharing
      ? "live-meeting-room--sharing-screen"
      : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  /* ========================================================
     WAITING ROOM
  ======================================================== */

  if (
    waiting ||
    (
      joined &&
      !admitted
    )
  ) {
    return (
      <section
        className={`${rootClassName} live-meeting-room--waiting`}
      >
        <div className="live-meeting-room__waiting-card">
          <div className="live-meeting-room__waiting-icon">
            ⏳
          </div>

          <span className="live-meeting-room__eyebrow">
            {meetingTitle}
          </span>

          <h2>
            Waiting for the host
          </h2>

          <p>
            You have joined the
            waiting room. The host
            will admit you when the
            meeting is ready.
          </p>

          <div className="live-meeting-room__waiting-user">
            {profilePhoto ? (
              <img
                src={
                  profilePhoto
                }
                alt={
                  displayName
                }
              />
            ) : (
              <span>
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}

            <div>
              <strong>
                {displayName}
              </strong>

              <small>
                Waiting for admission
              </small>
            </div>
          </div>

          <button
            type="button"
            className="live-meeting-room__waiting-leave"
            onClick={
              handleLeaveMeeting
            }
            disabled={
              leaving ||
              actionBusy ===
                "leave"
            }
          >
            Leave waiting room
          </button>
        </div>
      </section>
    );
  }

  /* ========================================================
     ROOM ENDED
  ======================================================== */

  if (roomEnded) {
    return (
      <section
        className={`${rootClassName} live-meeting-room--ended`}
      >
        <div className="live-meeting-room__ended-card">
          <div className="live-meeting-room__ended-icon">
            ✓
          </div>

          <h2>
            Meeting ended
          </h2>

          <p>
            The host has ended{" "}
            <strong>
              {meetingTitle}
            </strong>
            .
          </p>

          <button
            type="button"
            onClick={
              handleLeaveMeeting
            }
          >
            Return to meeting details
          </button>
        </div>
      </section>
    );
  }

  /* ========================================================
     MAIN ROOM
  ======================================================== */

  return (
    <section
      className={
        rootClassName
      }
      onMouseMove={() =>
        setControlsVisible(
          true
        )
      }
      aria-label={`${meetingTitle} live room`}
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="live-meeting-room__header">
        <div className="live-meeting-room__meeting-info">
          <div className="live-meeting-room__meeting-logo">
            JVP
          </div>

          <div className="live-meeting-room__meeting-heading">
            <h1>
              {meetingTitle}
            </h1>

            <div className="live-meeting-room__meeting-meta">
              <span
                className={[
                  "live-meeting-room__connection",

                  isConnected
                    ? "live-meeting-room__connection--online"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span />

                {connectionLabel}
              </span>

              <span>
                {formatMeetingDuration(
                  elapsedSeconds
                )}
              </span>

              <span>
                {participantCount}{" "}
                {participantCount === 1
                  ? "participant"
                  : "participants"}
              </span>
            </div>
          </div>
        </div>

        <div className="live-meeting-room__header-actions">
          <div
            className="live-meeting-room__layout-switcher"
            aria-label="Video layout"
          >
            <button
              type="button"
              className={
                layout === "grid"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setLayout("grid")
              }
              title="Grid layout"
            >
              ⠿
            </button>

            <button
              type="button"
              className={
                layout ===
                "spotlight"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setLayout(
                  "spotlight"
                )
              }
              title="Spotlight layout"
            >
              ▣
            </button>

            <button
              type="button"
              className={
                layout === "auto"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setLayout("auto")
              }
              title="Automatic layout"
            >
              A
            </button>
          </div>

          <button
            type="button"
            className="live-meeting-room__header-button"
            onClick={() =>
              setControlsVisible(
                (
                  current
                ) => !current
              )
            }
          >
            {controlsVisible
              ? "Hide controls"
              : "Show controls"}
          </button>
        </div>
      </header>

      {/* ====================================================
          ERROR NOTICE
      ==================================================== */}

      {visibleErrorMessage && (
        <div
          className="live-meeting-room__error"
          role="alert"
        >
          <span>
            {visibleErrorMessage}
          </span>

          <button
            type="button"
            onClick={
              clearErrors
            }
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* ====================================================
          VIDEO AREA
      ==================================================== */}

      <main className="live-meeting-room__stage">
        <VideoGrid
          {...videoGridProps}
        />

        {!isConnected && (
          <div className="live-meeting-room__connection-overlay">
            <div className="live-meeting-room__connection-spinner" />

            <strong>
              {joining
                ? "Joining meeting"
                : "Reconnecting"}
            </strong>

            <span>
              Please wait while the
              connection is restored.
            </span>
          </div>
        )}
      </main>

{participantsPanelOpen && (
  <ParticipantsPanel
    participants={
      participants
    }
    currentUser={
      currentUser
    }
    canManage={
      true
    }
    isOpen={
      participantsPanelOpen
    }
    onClose={() =>
      setParticipantsPanelOpen(false)
    }
  />
)}


      {/* ====================================================
          DEVICE MENU
      ==================================================== */}

      {deviceMenuOpen && (
        <div className="live-meeting-room__device-menu">
          <div className="live-meeting-room__device-menu-header">
            <div>
              <strong>
                Audio and video
              </strong>

              <small>
                Select the devices
                used in this meeting.
              </small>
            </div>

            <button
              type="button"
              onClick={() =>
                setDeviceMenuOpen(
                  false
                )
              }
              aria-label="Close device settings"
            >
              ×
            </button>
          </div>

          <label className="live-meeting-room__device-field">
            <span>
              Microphone
            </span>

            <select
              value={
                mediaDevices
                  .selectedAudioInputId
              }
              onChange={
                handleMicrophoneChange
              }
              disabled={
                mediaDevices.deviceBusy
              }
            >
              {mediaDevices
                .microphones
                .length === 0 && (
                <option value="">
                  No microphone found
                </option>
              )}

              {mediaDevices
                .microphones
                .map(
                  (
                    microphone
                  ) => (
                    <option
                      key={
                        microphone.deviceId
                      }
                      value={
                        microphone.deviceId
                      }
                    >
                      {
                        microphone.label
                      }
                    </option>
                  )
                )}
            </select>
          </label>

          <label className="live-meeting-room__device-field">
            <span>
              Camera
            </span>

            <select
              value={
                mediaDevices
                  .selectedVideoInputId
              }
              onChange={
                handleCameraChange
              }
              disabled={
                mediaDevices.deviceBusy
              }
            >
              {mediaDevices
                .cameras.length ===
                0 && (
                <option value="">
                  No camera found
                </option>
              )}

              {mediaDevices
                .cameras.map(
                  (camera) => (
                    <option
                      key={
                        camera.deviceId
                      }
                      value={
                        camera.deviceId
                      }
                    >
                      {camera.label}
                    </option>
                  )
                )}
            </select>
          </label>

          <label className="live-meeting-room__device-field">
            <span>
              Speaker
            </span>

            <select
              value={
                mediaDevices
                  .selectedAudioOutputId
              }
              onChange={
                handleSpeakerChange
              }
              disabled={
                !mediaDevices
                  .audioOutputSelectionSupported ||
                mediaDevices.deviceBusy
              }
            >
              {mediaDevices
                .speakers.length ===
                0 && (
                <option value="">
                  Default speaker
                </option>
              )}

              {mediaDevices
                .speakers.map(
                  (speaker) => (
                    <option
                      key={
                        speaker.deviceId
                      }
                      value={
                        speaker.deviceId
                      }
                    >
                      {speaker.label}
                    </option>
                  )
                )}
            </select>
          </label>

          <button
            type="button"
            className="live-meeting-room__refresh-devices"
            onClick={() =>
              mediaDevices
                .refreshDevices({
                  askForPermission:
                    true,
                })
                .catch(
                  setActionError
                )
            }
            disabled={
              mediaDevices.deviceBusy
            }
          >
            {mediaDevices
              .loadingDevices
              ? "Refreshing..."
              : "Refresh devices"}
          </button>
        </div>
      )}

      {/* ====================================================
          TOOLBAR
      ==================================================== */}

      <MeetingToolbar
  microphoneEnabled={
    microphoneEnabled
  }
  cameraEnabled={
    cameraEnabled
  }
  screenSharing={
    screenSharing
  }
  raisedHand={
    raisedHand
  }
  participantCount={
    participantCount
  }
  unreadChatCount={0}
  connected={
    isConnected
  }
  microphoneBusy={
    actionBusy ===
    "microphone"
  }
  cameraBusy={
    actionBusy ===
    "camera"
  }
  screenShareBusy={
    screenShare
      .screenShareBusy ||
    actionBusy ===
      "screen-share"
  }
  raisedHandBusy={
    actionBusy ===
    "raised-hand"
  }
  leaving={
    leaving ||
    actionBusy ===
      "leave"
  }
  microphoneAllowed
  cameraAllowed
  screenShareAllowed
  chatAllowed
  deviceMenuOpen={
    deviceMenuOpen
  }
  controlsVisible={
    controlsVisible
  }
  onToggleMicrophone={
    handleToggleMicrophone
  }
  onToggleCamera={
    handleToggleCamera
  }
  onToggleScreenShare={
    handleToggleScreenShare
  }
  onToggleRaisedHand={
    handleToggleRaisedHand
  }
  onToggleDeviceMenu={() =>
    setDeviceMenuOpen(
      (current) =>
        !current
    )
  }
 onOpenParticipants={
  handleToggleParticipantsPanel
}
  onOpenChat={
    onOpenChat
  }
  onOpenMore={
    onOpenSettings
  }
  onLeave={
    handleLeaveMeeting
  }
/>
    </section>
  );
};

export {
  getUserDisplayName,
  getUserProfilePhoto,
  getMeetingTitle,
  formatMeetingDuration,
  getStatusLabel,
};

export default LiveMeetingRoom;