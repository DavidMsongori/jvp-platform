import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLiveMeeting,
} from "../LiveMeetingContext";

/* ==========================================================
   DEFAULT SCREEN-SHARE CONSTRAINTS
========================================================== */

const DEFAULT_SCREEN_SHARE_CONSTRAINTS = {
  video: {
    cursor: "always",

    displaySurface: "monitor",

    frameRate: {
      ideal: 15,
      max: 30,
    },
  },

  audio: false,
};

/* ==========================================================
   ERROR NORMALIZATION
========================================================== */

const normalizeScreenShareError = (
  error
) => {
  const errorName =
    error?.name || "";

  switch (errorName) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return {
        code:
          "SCREEN_SHARE_PERMISSION_DENIED",

        message:
          "Screen sharing permission was denied or the selection window was closed.",
      };

    case "NotFoundError":
      return {
        code:
          "SCREEN_SHARE_SOURCE_NOT_FOUND",

        message:
          "No screen, window or browser tab was available for sharing.",
      };

    case "NotReadableError":
      return {
        code:
          "SCREEN_SHARE_NOT_READABLE",

        message:
          "The selected screen could not be captured. Another application or browser policy may be blocking access.",
      };

    case "AbortError":
      return {
        code:
          "SCREEN_SHARE_ABORTED",

        message:
          "The screen sharing request was interrupted.",
      };

    case "InvalidStateError":
      return {
        code:
          "SCREEN_SHARE_INVALID_STATE",

        message:
          "Screen sharing must be started directly from a user action such as clicking a button.",
      };

    case "OverconstrainedError":
      return {
        code:
          "SCREEN_SHARE_CONSTRAINT_FAILED",

        message:
          "The selected screen does not support the requested capture settings.",
      };

    case "TypeError":
      return {
        code:
          "SCREEN_SHARE_INVALID_CONSTRAINTS",

        message:
          "The screen sharing constraints are invalid or unsupported by this browser.",
      };

    default:
      return {
        code:
          "SCREEN_SHARE_FAILED",

        message:
          error?.message ||
          "Unable to start screen sharing.",
      };
  }
};

/* ==========================================================
   STREAM HELPERS
========================================================== */

const stopMediaStream = (
  stream
) => {
  stream
    ?.getTracks?.()
    .forEach((track) => {
      try {
        track.onended = null;
        track.stop();
      } catch {
        // Track may already be stopped.
      }
    });
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

const getLiveAudioTrack = (
  stream
) => {
  return (
    stream
      ?.getAudioTracks?.()
      .find(
        (track) =>
          track.readyState ===
          "live"
      ) || null
  );
};

/* ==========================================================
   HOOK
========================================================== */

const useScreenShare = ({
  webRTC = null,

  constraints =
    DEFAULT_SCREEN_SHARE_CONSTRAINTS,

  shareSystemAudio = false,

  replaceCameraTrack = true,

  restoreCameraOnStop = true,

  onScreenShareStarted,

  onScreenShareStopped,

  onError,
} = {}) => {
  const {
    meetingId,

    isJoined,
    isAdmitted,

    localMedia,

    localStreamRef,
    screenStreamRef,

    setScreenStream,
    stopScreenStream,

    setScreenSharing,
  } = useLiveMeeting();

  const [
    screenSharing,
    setScreenSharingState,
  ] = useState(false);

  const [
    startingScreenShare,
    setStartingScreenShare,
  ] = useState(false);

  const [
    stoppingScreenShare,
    setStoppingScreenShare,
  ] = useState(false);

  const [
    screenShareError,
    setScreenShareError,
  ] = useState(null);

  const [
    screenStreamVersion,
    setScreenStreamVersion,
  ] = useState(0);

  const [
    selectedSurface,
    setSelectedSurface,
  ] = useState("");

  const mountedRef =
    useRef(true);

  const startingRef =
    useRef(false);

  const stoppingRef =
    useRef(false);

  const previousCameraTrackRef =
    useRef(null);

  const previousCameraEnabledRef =
    useRef(false);

  const stopRequestedRef =
    useRef(false);

  /* ========================================================
     BROWSER SUPPORT
  ======================================================== */

  const isScreenShareSupported =
    Boolean(
      navigator?.mediaDevices
        ?.getDisplayMedia
    );

  /* ========================================================
     CURRENT STREAM AND TRACKS
  ======================================================== */

  const screenStream =
    screenStreamRef.current;

  const screenVideoTrack =
    getLiveVideoTrack(
      screenStream
    );

  const screenAudioTrack =
    getLiveAudioTrack(
      screenStream
    );

  const hasScreenVideoTrack =
    Boolean(screenVideoTrack);

  const hasScreenAudioTrack =
    Boolean(screenAudioTrack);

  /* ========================================================
     ERROR HANDLING
  ======================================================== */

  const handleScreenShareError =
    useCallback(
      (
        error,
        metadata = {}
      ) => {
        const normalized =
          normalizeScreenShareError(
            error
          );

        const payload = {
          ...normalized,

          originalError:
            error,

          metadata,
        };

        if (mountedRef.current) {
          setScreenShareError(
            payload
          );
        }

        if (
          typeof onError ===
          "function"
        ) {
          onError(payload);
        }

        return payload;
      },
      [onError]
    );

  const clearScreenShareError =
    useCallback(() => {
      setScreenShareError(null);
    }, []);

  /* ========================================================
     BUILD DISPLAY CONSTRAINTS
  ======================================================== */

  const buildDisplayConstraints =
    useCallback(
      (
        overrides = {}
      ) => {
        const mergedVideo =
          typeof constraints.video ===
          "object"
            ? {
                ...constraints.video,

                ...(typeof overrides.video ===
                "object"
                  ? overrides.video
                  : {}),
              }
            : constraints.video;

        return {
          ...constraints,
          ...overrides,

          video:
            overrides.video ===
            false
              ? false
              : mergedVideo ||
                true,

          audio:
            overrides.audio ??
            (
              shareSystemAudio
                ? true
                : constraints.audio ??
                  false
            ),
        };
      },
      [
        constraints,
        shareSystemAudio,
      ]
    );

  /* ========================================================
     REPLACE VIDEO TRACK IN ALL PEERS
  ======================================================== */

  const replaceOutgoingVideoTrack =
    useCallback(
      async (
        track,
        stream
      ) => {
        if (
          !replaceCameraTrack
        ) {
          return;
        }

        if (
          typeof webRTC
            ?.replaceTrackForAllPeers !==
          "function"
        ) {
          return;
        }

        await webRTC.replaceTrackForAllPeers(
          "video",
          track || null,
          stream || null
        );
      },
      [
        replaceCameraTrack,
        webRTC,
      ]
    );

  /* ========================================================
     OPTIONAL SCREEN AUDIO REPLACEMENT

     By default, screen audio is not sent because replacing the
     microphone with system audio would remove the participant's
     voice. Mixing microphone and system audio requires Web Audio
     API support and will be implemented separately.
  ======================================================== */

  const replaceOutgoingAudioTrack =
    useCallback(
      async (
        track,
        stream
      ) => {
        if (!track) {
          return;
        }

        if (
          typeof webRTC
            ?.replaceTrackForAllPeers !==
          "function"
        ) {
          return;
        }

        await webRTC.replaceTrackForAllPeers(
          "audio",
          track,
          stream
        );
      },
      [webRTC]
    );

  /* ========================================================
     RESTORE CAMERA TRACK
  ======================================================== */

  const restoreCameraTrack =
    useCallback(async () => {
      if (
        !restoreCameraOnStop
      ) {
        return null;
      }

      const currentLocalStream =
        localStreamRef.current;

      const currentCameraTrack =
        getLiveVideoTrack(
          currentLocalStream
        );

      const fallbackCameraTrack =
        previousCameraTrackRef.current;

      const cameraTrack =
        currentCameraTrack ||
        (
          fallbackCameraTrack
            ?.readyState ===
          "live"
            ? fallbackCameraTrack
            : null
        );

      if (cameraTrack) {
        cameraTrack.enabled =
          previousCameraEnabledRef.current;
      }

      await replaceOutgoingVideoTrack(
        cameraTrack,
        currentLocalStream
      );

      if (
        typeof webRTC
          ?.requestRenegotiationForAllPeers ===
        "function"
      ) {
        await webRTC.requestRenegotiationForAllPeers(
          {
            reason:
              "screen-share-stopped",
          }
        );
      }

      return cameraTrack;
    }, [
      restoreCameraOnStop,
      localStreamRef,
      replaceOutgoingVideoTrack,
      webRTC,
    ]);

  /* ========================================================
     STOP SCREEN SHARE
  ======================================================== */

  const stopScreenShare =
    useCallback(
      async ({
        notifyServer = true,
        restoreCamera = true,
        reason = "manual",
      } = {}) => {
        if (
          stoppingRef.current
        ) {
          return;
        }

        stoppingRef.current =
          true;

        stopRequestedRef.current =
          true;

        if (mountedRef.current) {
          setStoppingScreenShare(
            true
          );

          setScreenShareError(
            null
          );
        }

        try {
          const activeScreenStream =
            screenStreamRef.current;

          const tracks =
            activeScreenStream
              ?.getTracks?.() ||
            [];

          tracks.forEach(
            (track) => {
              track.onended =
                null;

              try {
                track.stop();
              } catch {
                // Track may already be stopped.
              }
            }
          );

          setScreenStream(null);

          if (
            restoreCamera
          ) {
            await restoreCameraTrack();
          } else {
            await replaceOutgoingVideoTrack(
              null,
              null
            );
          }

          if (notifyServer) {
            try {
              await setScreenSharing(
                false
              );
            } catch (error) {
              handleScreenShareError(
                error,
                {
                  action:
                    "notify-screen-share-stopped",

                  reason,
                }
              );
            }
          }

          if (mountedRef.current) {
            setScreenSharingState(
              false
            );

            setSelectedSurface(
              ""
            );

            setScreenStreamVersion(
              (version) =>
                version + 1
            );
          }

          previousCameraTrackRef.current =
            null;

          previousCameraEnabledRef.current =
            false;

          if (
            typeof onScreenShareStopped ===
            "function"
          ) {
            onScreenShareStopped({
              meetingId,
              reason,
            });
          }
        } finally {
          stoppingRef.current =
            false;

          stopRequestedRef.current =
            false;

          if (mountedRef.current) {
            setStoppingScreenShare(
              false
            );
          }
        }
      },
      [
        screenStreamRef,
        setScreenStream,
        restoreCameraTrack,
        replaceOutgoingVideoTrack,
        setScreenSharing,
        handleScreenShareError,
        onScreenShareStopped,
        meetingId,
      ]
    );

  /* ========================================================
     SCREEN TRACK ENDED

     This event fires when the participant presses the browser's
     built-in "Stop sharing" button.
  ======================================================== */

  const handleScreenTrackEnded =
    useCallback(() => {
      if (
        stopRequestedRef.current
      ) {
        return;
      }

      stopScreenShare({
        notifyServer: true,
        restoreCamera: true,
        reason:
          "browser-stopped-sharing",
      }).catch((error) => {
        handleScreenShareError(
          error,
          {
            action:
              "handle-screen-track-ended",
          }
        );
      });
    }, [
      stopScreenShare,
      handleScreenShareError,
    ]);

  /* ========================================================
     START SCREEN SHARE
  ======================================================== */

  const startScreenShare =
    useCallback(
      async (
        overrides = {}
      ) => {
        if (
          startingRef.current
        ) {
          return (
            screenStreamRef.current ||
            null
          );
        }

        if (
          screenSharing &&
          screenStreamRef.current
        ) {
          return screenStreamRef.current;
        }

        if (
          !isScreenShareSupported
        ) {
          const error =
            new Error(
              "This browser does not support screen sharing."
            );

          error.name =
            "NotSupportedError";

          const normalized = {
            code:
              "SCREEN_SHARE_NOT_SUPPORTED",

            message:
              "This browser does not support screen sharing.",
          };

          setScreenShareError(
            normalized
          );

          throw error;
        }

        if (
          !isJoined ||
          !isAdmitted
        ) {
          const error =
            new Error(
              "You must join the meeting before sharing your screen."
            );

          error.code =
            "MEETING_NOT_JOINED";

          setScreenShareError({
            code:
              "MEETING_NOT_JOINED",

            message:
              error.message,
          });

          throw error;
        }

        startingRef.current =
          true;

        if (mountedRef.current) {
          setStartingScreenShare(
            true
          );

          setScreenShareError(
            null
          );
        }

        try {
          const displayConstraints =
            buildDisplayConstraints(
              overrides
            );

          const capturedStream =
            await navigator.mediaDevices
              .getDisplayMedia(
                displayConstraints
              );

          const capturedVideoTrack =
            getLiveVideoTrack(
              capturedStream
            );

          if (
            !capturedVideoTrack
          ) {
            stopMediaStream(
              capturedStream
            );

            throw new Error(
              "The selected screen did not provide a video track."
            );
          }

          const currentCameraTrack =
            getLiveVideoTrack(
              localStreamRef.current
            );

          previousCameraTrackRef.current =
            currentCameraTrack;

          previousCameraEnabledRef.current =
            Boolean(
              currentCameraTrack
                ?.enabled
            );

          capturedVideoTrack.onended =
            handleScreenTrackEnded;

          const trackSettings =
            capturedVideoTrack
              .getSettings?.() ||
            {};

          const displaySurface =
            trackSettings
              .displaySurface ||
            "";

          setScreenStream(
            capturedStream
          );

          await replaceOutgoingVideoTrack(
            capturedVideoTrack,
            capturedStream
          );

          const capturedAudioTrack =
            getLiveAudioTrack(
              capturedStream
            );

          if (
            capturedAudioTrack &&
            overrides
              ?.replaceMicrophoneWithScreenAudio ===
              true
          ) {
            await replaceOutgoingAudioTrack(
              capturedAudioTrack,
              capturedStream
            );
          }

          if (
            typeof webRTC
              ?.requestRenegotiationForAllPeers ===
            "function"
          ) {
            await webRTC.requestRenegotiationForAllPeers(
              {
                reason:
                  "screen-share-started",
              }
            );
          }

          await setScreenSharing(
            true
          );

          if (mountedRef.current) {
            setScreenSharingState(
              true
            );

            setSelectedSurface(
              displaySurface
            );

            setScreenStreamVersion(
              (version) =>
                version + 1
            );
          }

          if (
            typeof onScreenShareStarted ===
            "function"
          ) {
            onScreenShareStarted({
              meetingId,

              stream:
                capturedStream,

              track:
                capturedVideoTrack,

              displaySurface,
            });
          }

          return capturedStream;
        } catch (error) {
          const activeStream =
            screenStreamRef.current;

          if (activeStream) {
            stopMediaStream(
              activeStream
            );

            setScreenStream(
              null
            );
          }

          if (mountedRef.current) {
            setScreenSharingState(
              false
            );

            setScreenStreamVersion(
              (version) =>
                version + 1
            );
          }

          const normalized =
            handleScreenShareError(
              error,
              {
                action:
                  "start-screen-share",
              }
            );

          const thrownError =
            new Error(
              normalized.message
            );

          thrownError.code =
            normalized.code;

          thrownError.cause =
            error;

          throw thrownError;
        } finally {
          startingRef.current =
            false;

          if (mountedRef.current) {
            setStartingScreenShare(
              false
            );
          }
        }
      },
      [
        screenSharing,
        screenStreamRef,
        isScreenShareSupported,
        isJoined,
        isAdmitted,
        buildDisplayConstraints,
        localStreamRef,
        handleScreenTrackEnded,
        setScreenStream,
        replaceOutgoingVideoTrack,
        replaceOutgoingAudioTrack,
        webRTC,
        setScreenSharing,
        onScreenShareStarted,
        meetingId,
        handleScreenShareError,
      ]
    );

  /* ========================================================
     TOGGLE SCREEN SHARE
  ======================================================== */

  const toggleScreenShare =
    useCallback(async () => {
      if (
        screenSharing ||
        screenStreamRef.current
      ) {
        await stopScreenShare();

        return null;
      }

      return startScreenShare();
    }, [
      screenSharing,
      screenStreamRef,
      startScreenShare,
      stopScreenShare,
    ]);

  /* ========================================================
     UPDATE SCREEN-SHARE TRACK SETTINGS
  ======================================================== */

  const applyScreenShareConstraints =
    useCallback(
      async (
        videoConstraints
      ) => {
        const activeTrack =
          getLiveVideoTrack(
            screenStreamRef.current
          );

        if (!activeTrack) {
          throw new Error(
            "There is no active screen-sharing track."
          );
        }

        if (
          typeof activeTrack
            .applyConstraints !==
          "function"
        ) {
          throw new Error(
            "This browser does not support updating screen-sharing constraints."
          );
        }

        await activeTrack.applyConstraints(
          videoConstraints
        );

        setScreenStreamVersion(
          (version) =>
            version + 1
        );

        return activeTrack
          .getSettings?.() ||
          {};
      },
      [screenStreamRef]
    );

  /* ========================================================
     CONTEXT SYNCHRONIZATION
  ======================================================== */

  useEffect(() => {
    setScreenSharingState(
      Boolean(
        localMedia
          ?.screenSharing
      )
    );
  }, [
    localMedia?.screenSharing,
  ]);

  /* ========================================================
     MEETING LEAVE / REMOVAL CLEANUP
  ======================================================== */

  useEffect(() => {
    if (
      isJoined &&
      isAdmitted
    ) {
      return;
    }

    if (
      !screenStreamRef.current
    ) {
      return;
    }

    stopScreenShare({
      notifyServer: false,
      restoreCamera: false,
      reason:
        "meeting-left",
    }).catch(() => {
      // Cleanup should not block unmounting or navigation.
    });
  }, [
    isJoined,
    isAdmitted,
    screenStreamRef,
    stopScreenShare,
  ]);

  /* ========================================================
     UNMOUNT CLEANUP
  ======================================================== */

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;

      const activeStream =
        screenStreamRef.current;

      activeStream
        ?.getTracks?.()
        .forEach((track) => {
          track.onended =
            null;

          try {
            track.stop();
          } catch {
            // Track may already be stopped.
          }
        });
    };
  }, [screenStreamRef]);

  /* ========================================================
     RETURN
  ======================================================== */

  return {
    screenStream:
      screenStreamRef.current,

    screenVideoTrack,
    screenAudioTrack,

    screenSharing,

    hasScreenVideoTrack,
    hasScreenAudioTrack,

    selectedSurface,

    isScreenShareSupported,

    startingScreenShare,
    stoppingScreenShare,

    screenShareBusy:
      startingScreenShare ||
      stoppingScreenShare,

    screenShareError,
    clearScreenShareError,

    startScreenShare,
    stopScreenShare,
    toggleScreenShare,

    applyScreenShareConstraints,

    screenStreamVersion,
  };
};

export {
  DEFAULT_SCREEN_SHARE_CONSTRAINTS,
  normalizeScreenShareError,
  stopMediaStream,
  getLiveVideoTrack,
  getLiveAudioTrack,
};

export default useScreenShare;