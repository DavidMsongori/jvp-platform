import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./ParticipantVideo.css";

/* ==========================================================
   HELPERS
========================================================== */

const getInitials = (
  name = ""
) => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
};

const getLiveVideoTrack = (
  stream
) => {
  return (
    stream
      ?.getVideoTracks?.()
      .find(
        (track) =>
          track.readyState === "live"
      ) || null
  );
};

const getLiveAudioTrack = (
  stream
) => {
  return (
    stream
      ?.getAudioTracks?.()
      .find(
        (track) =>
          track.readyState === "live"
      ) || null
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

const ParticipantVideo = ({
  participant = null,

  stream = null,

  displayName = "",

  profilePhoto = "",

  microphoneEnabled = true,

  cameraEnabled = true,

  screenSharing = false,

  raisedHand = false,

  isSpeaking = false,

  isHost = false,

  isCoHost = false,

  isManager = false,

  isConnected = true,

  audioOutputDeviceId = "",

  compact = false,

  featured = false,

  pinned = false,

  muted = false,

  showName = true,

  showStatus = true,

  showRole = true,

  showConnectionStatus = true,

  showPlaceholder = true,

  className = "",

  videoClassName = "",

  onVideoReady,

  onVideoError,

  onClick,

  onDoubleClick,
}) => {
  const videoRef =
    useRef(null);

  const [
    playbackError,
    setPlaybackError,
  ] = useState(null);

  const [
    videoTrackVersion,
    setVideoTrackVersion,
  ] = useState(0);

  /* ========================================================
     NORMALIZED PARTICIPANT DATA
  ======================================================== */

  const resolvedDisplayName =
    displayName ||
    participant?.displayName ||
    participant?.name ||
    participant?.fullName ||
    participant?.user?.name ||
    "Participant";

  const resolvedProfilePhoto =
    profilePhoto ||
    participant?.profilePhoto ||
    participant?.avatar ||
    participant?.photo ||
    participant?.user?.profilePhoto ||
    "";

  const resolvedMicrophoneEnabled =
    participant?.microphoneEnabled ??
    participant?.microphone ??
    participant?.media?.microphone ??
    microphoneEnabled;

  const resolvedCameraEnabled =
    participant?.cameraEnabled ??
    participant?.camera ??
    participant?.media?.camera ??
    cameraEnabled;

  const resolvedScreenSharing =
    participant?.screenSharing ??
    participant?.media?.screenSharing ??
    screenSharing;

  const resolvedRaisedHand =
    participant?.raisedHand ??
    participant?.handRaised ??
    raisedHand;

  const resolvedIsSpeaking =
    participant?.isSpeaking ??
    participant?.speaking ??
    isSpeaking;

  const resolvedIsConnected =
    participant?.isConnected ??
    participant?.connected ??
    isConnected;

  const initials =
    useMemo(
      () =>
        getInitials(
          resolvedDisplayName
        ),
      [resolvedDisplayName]
    );

  /* ========================================================
     STREAM TRACKS
  ======================================================== */

  const videoTrack =
    useMemo(
      () =>
        getLiveVideoTrack(
          stream
        ),
      [
        stream,
        videoTrackVersion,
      ]
    );

  const audioTrack =
    useMemo(
      () =>
        getLiveAudioTrack(
          stream
        ),
      [stream]
    );

  const hasVideo =
    Boolean(
      stream &&
      videoTrack &&
      (
        resolvedCameraEnabled ||
        resolvedScreenSharing
      )
    );

  const hasAudio =
    Boolean(
      stream &&
      audioTrack
    );

  /* ========================================================
     ATTACH REMOTE STREAM
  ======================================================== */

  useEffect(() => {
    const videoElement =
      videoRef.current;

    if (!videoElement) {
      return undefined;
    }

    if (!stream) {
      videoElement.pause();

      videoElement.srcObject =
        null;

      return undefined;
    }

    if (
      videoElement.srcObject !==
      stream
    ) {
      videoElement.srcObject =
        stream;
    }

    const startPlayback =
      async () => {
        try {
          await videoElement.play();

          setPlaybackError(null);

          if (
            typeof onVideoReady ===
            "function"
          ) {
            onVideoReady({
              participant,
              stream,
              videoElement,
            });
          }
        } catch (error) {
          setPlaybackError(
            error
          );

          if (
            typeof onVideoError ===
            "function"
          ) {
            onVideoError({
              participant,
              error,
              stream,
              videoElement,
            });
          }
        }
      };

    startPlayback();

    return () => {
      if (
        videoElement.srcObject ===
        stream
      ) {
        videoElement.pause();

        videoElement.srcObject =
          null;
      }
    };
  }, [
    participant,
    stream,
    onVideoReady,
    onVideoError,
  ]);

  /* ========================================================
     AUDIO OUTPUT DEVICE
  ======================================================== */

  useEffect(() => {
    const videoElement =
      videoRef.current;

    if (
      !videoElement ||
      !audioOutputDeviceId ||
      typeof videoElement.setSinkId !==
        "function"
    ) {
      return;
    }

    videoElement
      .setSinkId(
        audioOutputDeviceId
      )
      .catch((error) => {
        if (
          typeof onVideoError ===
          "function"
        ) {
          onVideoError({
            participant,
            error,
            stream,
            videoElement,
            action:
              "set-audio-output",
          });
        }
      });
  }, [
    audioOutputDeviceId,
    participant,
    stream,
    onVideoError,
  ]);

  /* ========================================================
     VIDEO TRACK LIFECYCLE
  ======================================================== */

  useEffect(() => {
    if (!videoTrack) {
      return undefined;
    }

    const refreshTrackState =
      () => {
        setVideoTrackVersion(
          (version) =>
            version + 1
        );
      };

    videoTrack.addEventListener?.(
      "ended",
      refreshTrackState
    );

    videoTrack.addEventListener?.(
      "mute",
      refreshTrackState
    );

    videoTrack.addEventListener?.(
      "unmute",
      refreshTrackState
    );

    return () => {
      videoTrack.removeEventListener?.(
        "ended",
        refreshTrackState
      );

      videoTrack.removeEventListener?.(
        "mute",
        refreshTrackState
      );

      videoTrack.removeEventListener?.(
        "unmute",
        refreshTrackState
      );
    };
  }, [videoTrack]);

  /* ========================================================
     ROLE LABEL
  ======================================================== */

  const roleLabel =
    useMemo(() => {
      if (isHost) {
        return "Host";
      }

      if (isCoHost) {
        return "Co-host";
      }

      if (isManager) {
        return "Manager";
      }

      return "";
    }, [
      isHost,
      isCoHost,
      isManager,
    ]);

  /* ========================================================
     CLASSES
  ======================================================== */

  const wrapperClasses = [
    "participant-video",

    compact
      ? "participant-video--compact"
      : "",

    featured
      ? "participant-video--featured"
      : "",

    pinned
      ? "participant-video--pinned"
      : "",

    resolvedScreenSharing
      ? "participant-video--screen-sharing"
      : "",

    resolvedIsSpeaking
      ? "participant-video--speaking"
      : "",

    !resolvedIsConnected
      ? "participant-video--disconnected"
      : "",

    !hasVideo
      ? "participant-video--video-off"
      : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  const videoClasses = [
    "participant-video__video",

    videoClassName,
  ]
    .filter(Boolean)
    .join(" ");

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <article
      className={
        wrapperClasses
      }
      aria-label={`${resolvedDisplayName} video`}
      onClick={onClick}
      onDoubleClick={
        onDoubleClick
      }
      data-participant-id={
        participant?.userId ||
        participant?._id ||
        participant?.id ||
        ""
      }
    >
      <div className="participant-video__media">
        {stream ? (
          <video
            ref={videoRef}
            className={
              videoClasses
            }
            autoPlay
            playsInline
            muted={muted}
            aria-label={`${resolvedDisplayName} media`}
          />
        ) : null}

        {!hasVideo &&
          showPlaceholder && (
            <div className="participant-video__placeholder">
              {resolvedProfilePhoto ? (
                <img
                  src={
                    resolvedProfilePhoto
                  }
                  alt={
                    resolvedDisplayName
                  }
                  className="participant-video__avatar"
                />
              ) : (
                <span className="participant-video__initials">
                  {initials}
                </span>
              )}

              <p className="participant-video__camera-message">
                {resolvedIsConnected
                  ? "Camera is off"
                  : "Participant disconnected"}
              </p>
            </div>
          )}

        <div className="participant-video__gradient" />

        {resolvedScreenSharing && (
          <div className="participant-video__screen-badge">
            <span aria-hidden="true">
              ▣
            </span>

            Presenting
          </div>
        )}

        {resolvedRaisedHand && (
          <div
            className="participant-video__hand-badge"
            title="Hand raised"
            aria-label="Hand raised"
          >
            ✋
          </div>
        )}

        {pinned && (
          <div
            className="participant-video__pin-badge"
            title="Pinned participant"
            aria-label="Pinned participant"
          >
            📌
          </div>
        )}

        {showConnectionStatus &&
          !resolvedIsConnected && (
            <div className="participant-video__connection-badge">
              Reconnecting
            </div>
          )}

        {showStatus && (
          <div className="participant-video__status">
            <span
              className={[
                "participant-video__status-item",

                resolvedMicrophoneEnabled
                  ? ""
                  : "participant-video__status-item--disabled",
              ]
                .filter(Boolean)
                .join(" ")}
              title={
                resolvedMicrophoneEnabled
                  ? "Microphone on"
                  : "Microphone muted"
              }
              aria-label={
                resolvedMicrophoneEnabled
                  ? "Microphone on"
                  : "Microphone muted"
              }
            >
              {resolvedMicrophoneEnabled
                ? "🎙"
                : "🔇"}
            </span>

            <span
              className={[
                "participant-video__status-item",

                resolvedCameraEnabled
                  ? ""
                  : "participant-video__status-item--disabled",
              ]
                .filter(Boolean)
                .join(" ")}
              title={
                resolvedCameraEnabled
                  ? "Camera on"
                  : "Camera off"
              }
              aria-label={
                resolvedCameraEnabled
                  ? "Camera on"
                  : "Camera off"
              }
            >
              {resolvedCameraEnabled
                ? "▣"
                : "▢"}
            </span>
          </div>
        )}

        <div className="participant-video__footer">
          {showName && (
            <div className="participant-video__identity">
              <span className="participant-video__name">
                {resolvedDisplayName}
              </span>

              {showRole &&
                roleLabel && (
                  <small className="participant-video__role">
                    {roleLabel}
                  </small>
                )}
            </div>
          )}

          {resolvedIsSpeaking && (
            <div
              className="participant-video__speaking-indicator"
              aria-label="Participant is speaking"
            >
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {playbackError && (
          <button
            type="button"
            className="participant-video__playback-button"
            onClick={async (
              event
            ) => {
              event.stopPropagation();

              try {
                await videoRef.current?.play();

                setPlaybackError(
                  null
                );
              } catch {
                // Keep the retry button visible.
              }
            }}
          >
            Click to play audio
          </button>
        )}

        {!hasAudio &&
          resolvedMicrophoneEnabled &&
          resolvedIsConnected && (
            <span
              className="participant-video__audio-warning"
              title="No remote audio track is available"
              aria-label="No remote audio track is available"
            >
              !
            </span>
          )}
      </div>
    </article>
  );
};

export {
  getInitials,
  getLiveVideoTrack,
  getLiveAudioTrack,
};

export default ParticipantVideo;