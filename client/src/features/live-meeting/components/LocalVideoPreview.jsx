import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import "./LocalVideoPreview.css";

/* ==========================================================
   HELPERS
========================================================== */

const getInitials = (
  name = ""
) => {
  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "ME";
  }

  return words
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase()
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
          track.readyState ===
          "live"
      ) || null
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

const LocalVideoPreview = ({
  stream = null,

  screenStream = null,

  displayName = "You",

  profilePhoto = "",

  cameraEnabled = true,

  microphoneEnabled = true,

  screenSharing = false,

  mirrored = true,

  muted = true,

  compact = false,

  showName = true,

  showStatus = true,

  showPlaceholder = true,

  className = "",

  videoClassName = "",

  onVideoReady,

  onVideoError,
}) => {
  const videoRef =
    useRef(null);

  /*
   * While screen sharing, show the screen stream in the local
   * preview. Otherwise show the normal camera stream.
   */

  const activeStream =
    screenSharing &&
    screenStream
      ? screenStream
      : stream;

  const activeVideoTrack =
    useMemo(
      () =>
        getLiveVideoTrack(
          activeStream
        ),
      [activeStream]
    );

  const hasVideo =
    Boolean(
      activeStream &&
      activeVideoTrack &&
      cameraEnabled
    ) ||
    Boolean(
      screenSharing &&
      activeStream &&
      activeVideoTrack
    );

  const shouldMirror =
    mirrored &&
    !screenSharing;

  const initials =
    useMemo(
      () =>
        getInitials(
          displayName
        ),
      [displayName]
    );

  /* ========================================================
     ATTACH STREAM TO VIDEO ELEMENT
  ======================================================== */

  useEffect(() => {
    const videoElement =
      videoRef.current;

    if (!videoElement) {
      return undefined;
    }

    if (
      !activeStream ||
      !hasVideo
    ) {
      if (
        videoElement.srcObject
      ) {
        videoElement.pause();

        videoElement.srcObject =
          null;
      }

      return undefined;
    }

    if (
      videoElement.srcObject !==
      activeStream
    ) {
      videoElement.srcObject =
        activeStream;
    }

    const playVideo =
      async () => {
        try {
          await videoElement.play();

          if (
            typeof onVideoReady ===
            "function"
          ) {
            onVideoReady({
              stream:
                activeStream,

              videoElement,
            });
          }
        } catch (error) {
          /*
           * Muted local video should normally autoplay.
           * Some browsers may still delay playback until the
           * page receives a user interaction.
           */

          if (
            typeof onVideoError ===
            "function"
          ) {
            onVideoError({
              error,

              stream:
                activeStream,

              videoElement,
            });
          }
        }
      };

    playVideo();

    return () => {
      if (
        videoElement.srcObject ===
        activeStream
      ) {
        videoElement.pause();

        videoElement.srcObject =
          null;
      }
    };
  }, [
    activeStream,
    hasVideo,
    onVideoReady,
    onVideoError,
  ]);

  /* ========================================================
     TRACK END LISTENER
  ======================================================== */

  useEffect(() => {
    if (!activeVideoTrack) {
      return undefined;
    }

    const handleTrackEnded =
      () => {
        if (
          typeof onVideoError ===
          "function"
        ) {
          onVideoError({
            error: new Error(
              "The local video track ended."
            ),

            stream:
              activeStream,

            videoElement:
              videoRef.current,
          });
        }
      };

    activeVideoTrack.addEventListener?.(
      "ended",
      handleTrackEnded
    );

    return () => {
      activeVideoTrack.removeEventListener?.(
        "ended",
        handleTrackEnded
      );
    };
  }, [
    activeVideoTrack,
    activeStream,
    onVideoError,
  ]);

  /* ========================================================
     CLASS NAMES
  ======================================================== */

  const wrapperClassName = [
    "local-video-preview",

    compact
      ? "local-video-preview--compact"
      : "",

    screenSharing
      ? "local-video-preview--screen-sharing"
      : "",

    !hasVideo
      ? "local-video-preview--video-off"
      : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  const videoClasses = [
    "local-video-preview__video",

    shouldMirror
      ? "local-video-preview__video--mirrored"
      : "",

    videoClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={
        wrapperClassName
      }
      aria-label={`${displayName} local video preview`}
    >
      <div className="local-video-preview__media">
        {hasVideo ? (
          <video
            ref={videoRef}
            className={
              videoClasses
            }
            autoPlay
            playsInline
            muted={muted}
            aria-label={`${displayName} video`}
          />
        ) : (
          showPlaceholder && (
            <div className="local-video-preview__placeholder">
              {profilePhoto ? (
                <img
                  src={
                    profilePhoto
                  }
                  alt={
                    displayName
                  }
                  className="local-video-preview__avatar-image"
                />
              ) : (
                <span className="local-video-preview__initials">
                  {initials}
                </span>
              )}

              <p className="local-video-preview__camera-message">
                Camera is off
              </p>
            </div>
          )
        )}

        <div className="local-video-preview__gradient" />

        {screenSharing && (
          <div className="local-video-preview__screen-badge">
            <span
              className="local-video-preview__screen-icon"
              aria-hidden="true"
            >
              ▣
            </span>

            Sharing screen
          </div>
        )}

        {showStatus && (
          <div className="local-video-preview__status">
            <span
              className={[
                "local-video-preview__status-item",

                microphoneEnabled
                  ? ""
                  : "local-video-preview__status-item--disabled",
              ]
                .filter(Boolean)
                .join(" ")}
              title={
                microphoneEnabled
                  ? "Microphone on"
                  : "Microphone muted"
              }
              aria-label={
                microphoneEnabled
                  ? "Microphone on"
                  : "Microphone muted"
              }
            >
              {microphoneEnabled
                ? "🎙"
                : "🔇"}
            </span>

            <span
              className={[
                "local-video-preview__status-item",

                cameraEnabled
                  ? ""
                  : "local-video-preview__status-item--disabled",
              ]
                .filter(Boolean)
                .join(" ")}
              title={
                cameraEnabled
                  ? "Camera on"
                  : "Camera off"
              }
              aria-label={
                cameraEnabled
                  ? "Camera on"
                  : "Camera off"
              }
            >
              {cameraEnabled
                ? "▣"
                : "▢"}
            </span>
          </div>
        )}

        {showName && (
          <div className="local-video-preview__name">
            <span>
              {displayName}
            </span>

            <small>You</small>
          </div>
        )}
      </div>
    </article>
  );
};

export {
  getInitials,
  getLiveVideoTrack,
};

export default LocalVideoPreview;