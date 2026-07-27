import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLiveMeeting,
} from "../LiveMeetingContext";

/* ==========================================================
   DEFAULT MEDIA CONSTRAINTS
========================================================== */

const DEFAULT_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,

  channelCount: 2,

  sampleRate: 48000,

  sampleSize: 16,

  latency: 0,
};

const DEFAULT_VIDEO_CONSTRAINTS = {
  width: {
    ideal: 1280,
  },

  height: {
    ideal: 720,
  },

  frameRate: {
    ideal: 24,
    max: 30,
  },

  facingMode: "user",
};

/* ==========================================================
   MEDIA ERROR HELPERS
========================================================== */

const normalizeMediaError = (
  error
) => {
  const errorName =
    error?.name || "";

  switch (errorName) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return {
        code: "MEDIA_PERMISSION_DENIED",
        message:
          "Camera or microphone permission was denied. Allow access in your browser settings and try again.",
      };

    case "NotFoundError":
    case "DevicesNotFoundError":
      return {
        code: "MEDIA_DEVICE_NOT_FOUND",
        message:
          "No camera or microphone was found on this device.",
      };

    case "NotReadableError":
    case "TrackStartError":
      return {
        code: "MEDIA_DEVICE_BUSY",
        message:
          "Your camera or microphone is being used by another application.",
      };

    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return {
        code: "MEDIA_CONSTRAINT_FAILED",
        message:
          "The selected media device does not support the requested settings.",
      };

    case "SecurityError":
      return {
        code: "MEDIA_SECURITY_ERROR",
        message:
          "Camera and microphone access requires a secure HTTPS connection or localhost.",
      };

    case "AbortError":
      return {
        code: "MEDIA_REQUEST_ABORTED",
        message:
          "The browser stopped the camera or microphone request.",
      };

    default:
      return {
        code: "MEDIA_ACCESS_FAILED",
        message:
          error?.message ||
          "Unable to access the camera or microphone.",
      };
  }
};

/* ==========================================================
   DEVICE HELPERS
========================================================== */

const getTrackDeviceId = (
  track
) => {
  return (
    track?.getSettings?.()
      ?.deviceId || ""
  );
};

const stopTracks = (
  stream
) => {
  stream
    ?.getTracks?.()
    .forEach((track) => {
      try {
        track.stop();
      } catch {
        // Track may already be stopped.
      }
    });
};

const getSupportedConstraints = () => {
  if (
    !navigator?.mediaDevices
      ?.getSupportedConstraints
  ) {
    return {};
  }

  return navigator.mediaDevices
    .getSupportedConstraints();
};

/* ==========================================================
   CONSTRAINT BUILDERS
========================================================== */

const buildAudioConstraints = ({
  enabled,
  deviceId,
  overrides = {},
}) => {
  if (!enabled) {
    return false;
  }

  return {
    ...DEFAULT_AUDIO_CONSTRAINTS,
    ...overrides,

    ...(deviceId
      ? {
          deviceId: {
            exact: deviceId,
          },
        }
      : {}),
  };
};

const buildVideoConstraints = ({
  enabled,
  deviceId,
  facingMode,
  overrides = {},
}) => {
  if (!enabled) {
    return false;
  }

  return {
    ...DEFAULT_VIDEO_CONSTRAINTS,
    ...overrides,

    ...(deviceId
      ? {
          deviceId: {
            exact: deviceId,
          },
        }
      : {
          facingMode:
            facingMode ||
            overrides.facingMode ||
            DEFAULT_VIDEO_CONSTRAINTS
              .facingMode,
        }),
  };
};

/* ==========================================================
   HOOK
========================================================== */

const useLocalMedia = ({
  initialMicrophoneEnabled = false,
  initialCameraEnabled = false,

  autoRequest = false,

  audioConstraints = {},
  videoConstraints = {},

  preferredAudioInputId = "",
  preferredVideoInputId = "",

  initialFacingMode = "user",
} = {}) => {
  const {
    localMedia,

    localStreamRef,

    setLocalStream,
    stopLocalStream,

    updateLocalMedia,
  } = useLiveMeeting();

  const [
    streamVersion,
    setStreamVersion,
  ] = useState(0);

  const [
    requestingMedia,
    setRequestingMedia,
  ] = useState(false);

  const [
    permissionState,
    setPermissionState,
  ] = useState({
    microphone: "prompt",
    camera: "prompt",
  });

  const [
    devices,
    setDevices,
  ] = useState({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
  });

  const [
    selectedAudioInputId,
    setSelectedAudioInputId,
  ] = useState(
    preferredAudioInputId
  );

  const [
    selectedVideoInputId,
    setSelectedVideoInputId,
  ] = useState(
    preferredVideoInputId
  );

  const [
    selectedAudioOutputId,
    setSelectedAudioOutputId,
  ] = useState("");

  const [
    facingMode,
    setFacingMode,
  ] = useState(
    initialFacingMode
  );

  const [
    mediaError,
    setMediaError,
  ] = useState(null);

  const [
    hasRequestedMedia,
    setHasRequestedMedia,
  ] = useState(false);

  const mountedRef =
    useRef(true);

  const mediaRequestRef =
    useRef(null);

  const microphonePermissionRef =
    useRef(null);

  const cameraPermissionRef =
    useRef(null);

  const localStream =
    localStreamRef.current;

  /* ========================================================
     BROWSER SUPPORT
  ======================================================== */

  const isMediaSupported =
    useMemo(() => {
      return Boolean(
        navigator?.mediaDevices
          ?.getUserMedia
      );
    }, []);

  const supportedConstraints =
    useMemo(
      () =>
        getSupportedConstraints(),
      []
    );

  /* ========================================================
     TRACK INFORMATION
  ======================================================== */

  const audioTrack =
    useMemo(() => {
      return (
        localStreamRef.current
          ?.getAudioTracks?.()[0] ||
        null
      );
    }, [
      localStream,
      streamVersion,
    ]);

  const videoTrack =
    useMemo(() => {
      return (
        localStreamRef.current
          ?.getVideoTracks?.()[0] ||
        null
      );
    }, [
      localStream,
      streamVersion,
    ]);

  const hasAudioTrack =
    Boolean(audioTrack);

  const hasVideoTrack =
    Boolean(videoTrack);

  const microphoneEnabled =
    Boolean(
      audioTrack?.enabled &&
      audioTrack?.readyState ===
        "live"
    );

  const cameraEnabled =
    Boolean(
      videoTrack?.enabled &&
      videoTrack?.readyState ===
        "live"
    );

  /* ========================================================
     DEVICE ENUMERATION
  ======================================================== */

  const refreshDevices =
    useCallback(async () => {
      if (
        !navigator?.mediaDevices
          ?.enumerateDevices
      ) {
        return {
          audioInputs: [],
          audioOutputs: [],
          videoInputs: [],
        };
      }

      try {
        const deviceList =
          await navigator.mediaDevices
            .enumerateDevices();

        const nextDevices = {
          audioInputs:
            deviceList.filter(
              (device) =>
                device.kind ===
                "audioinput"
            ),

          audioOutputs:
            deviceList.filter(
              (device) =>
                device.kind ===
                "audiooutput"
            ),

          videoInputs:
            deviceList.filter(
              (device) =>
                device.kind ===
                "videoinput"
            ),
        };

        if (
          mountedRef.current
        ) {
          setDevices(
            nextDevices
          );

          setSelectedAudioInputId(
            (currentId) => {
              if (
                currentId &&
                nextDevices.audioInputs.some(
                  (device) =>
                    device.deviceId ===
                    currentId
                )
              ) {
                return currentId;
              }

              return (
                getTrackDeviceId(
                  localStreamRef.current
                    ?.getAudioTracks?.()[0]
                ) ||
                nextDevices
                  .audioInputs[0]
                  ?.deviceId ||
                ""
              );
            }
          );

          setSelectedVideoInputId(
            (currentId) => {
              if (
                currentId &&
                nextDevices.videoInputs.some(
                  (device) =>
                    device.deviceId ===
                    currentId
                )
              ) {
                return currentId;
              }

              return (
                getTrackDeviceId(
                  localStreamRef.current
                    ?.getVideoTracks?.()[0]
                ) ||
                nextDevices
                  .videoInputs[0]
                  ?.deviceId ||
                ""
              );
            }
          );
        }

        return nextDevices;
      } catch (error) {
        const normalizedError =
          normalizeMediaError(
            error
          );

        if (
          mountedRef.current
        ) {
          setMediaError(
            normalizedError
          );
        }

        return {
          audioInputs: [],
          audioOutputs: [],
          videoInputs: [],
        };
      }
    }, [localStreamRef]);

  /* ========================================================
     PERMISSION STATE
  ======================================================== */

  const watchPermission =
    useCallback(
      async (
        permissionName,
        stateKey,
        permissionRef
      ) => {
        if (
          !navigator?.permissions
            ?.query
        ) {
          return;
        }

        try {
          const permissionStatus =
            await navigator.permissions.query(
              {
                name: permissionName,
              }
            );

          permissionRef.current =
            permissionStatus;

          const updatePermissionState =
            () => {
              if (
                mountedRef.current
              ) {
                setPermissionState(
                  (currentState) => ({
                    ...currentState,
                    [stateKey]:
                      permissionStatus.state,
                  })
                );
              }
            };

          updatePermissionState();

          permissionStatus.onchange =
            updatePermissionState;
        } catch {
          /*
           * Some browsers do not support querying
           * camera or microphone permission state.
           */
        }
      },
      []
    );

  /* ========================================================
     STREAM TRACK EVENTS
  ======================================================== */

  const attachTrackListeners =
    useCallback(
      (stream) => {
        stream
          ?.getTracks?.()
          .forEach((track) => {
            track.onended = () => {
              if (
                !mountedRef.current
              ) {
                return;
              }

              setStreamVersion(
                (version) =>
                  version + 1
              );

              if (
                track.kind ===
                "audio"
              ) {
                updateLocalMedia({
                  microphoneEnabled:
                    false,
                }).catch(() => {});
              }

              if (
                track.kind ===
                "video"
              ) {
                updateLocalMedia({
                  cameraEnabled:
                    false,
                }).catch(() => {});
              }
            };

            track.onmute = () => {
              if (
                mountedRef.current
              ) {
                setStreamVersion(
                  (version) =>
                    version + 1
                );
              }
            };

            track.onunmute = () => {
              if (
                mountedRef.current
              ) {
                setStreamVersion(
                  (version) =>
                    version + 1
                );
              }
            };
          });
      },
      [updateLocalMedia]
    );

  /* ========================================================
     REQUEST MEDIA
  ======================================================== */

  const requestLocalMedia =
    useCallback(
      async ({
        microphoneEnabled:
          requestedMicrophoneEnabled =
            initialMicrophoneEnabled,

        cameraEnabled:
          requestedCameraEnabled =
            initialCameraEnabled,

        audioInputId =
          selectedAudioInputId,

        videoInputId =
          selectedVideoInputId,

        requestedFacingMode =
          facingMode,

        preserveExistingTracks =
          false,
      } = {}) => {
        if (!isMediaSupported) {
          const error = {
            code:
              "MEDIA_NOT_SUPPORTED",

            message:
              "This browser does not support camera and microphone access.",
          };

          setMediaError(error);

          throw Object.assign(
            new Error(
              error.message
            ),
            error
          );
        }

        if (
          !requestedMicrophoneEnabled &&
          !requestedCameraEnabled
        ) {
          stopLocalStream();

          setStreamVersion(
            (version) =>
              version + 1
          );

          await updateLocalMedia({
            microphoneEnabled:
              false,

            cameraEnabled:
              false,
          });

          return null;
        }

        if (
          mediaRequestRef.current
        ) {
          return mediaRequestRef.current;
        }

        setRequestingMedia(true);
        setMediaError(null);
        setHasRequestedMedia(true);

        const constraints = {
          audio:
            buildAudioConstraints({
              enabled:
                requestedMicrophoneEnabled,

              deviceId:
                audioInputId,

              overrides:
                audioConstraints,
            }),

          video:
            buildVideoConstraints({
              enabled:
                requestedCameraEnabled,

              deviceId:
                videoInputId,

              facingMode:
                requestedFacingMode,

              overrides:
                videoConstraints,
            }),
        };

        const mediaRequest =
          navigator.mediaDevices
            .getUserMedia(
              constraints
            )
            .then(
              async (
                newStream
              ) => {
                if (
                  !mountedRef.current
                ) {
                  stopTracks(
                    newStream
                  );

                  return null;
                }

                const previousStream =
                  localStreamRef.current;

                let finalStream =
                  newStream;

/* ========================================================
   BOOST MICROPHONE GAIN
======================================================== */

const microphoneTrack =
  newStream.getAudioTracks()[0];

if (microphoneTrack) {
  try {
    const audioContext =
      new AudioContext();

    const source =
      audioContext.createMediaStreamSource(
        new MediaStream([
          microphoneTrack,
        ])
      );

    const gainNode =
      audioContext.createGain();

    gainNode.gain.value = 2.0;

    const destination =
      audioContext.createMediaStreamDestination();

    source.connect(gainNode);
    gainNode.connect(destination);

    const boostedTrack =
      destination.stream.getAudioTracks()[0];

    if (boostedTrack) {
      newStream.removeTrack(
        microphoneTrack
      );

      microphoneTrack.stop();

      newStream.addTrack(
        boostedTrack
      );
    }
  } catch (error) {
    console.warn(
      "Unable to boost microphone",
      error
    );
  }
}

                if (
                  preserveExistingTracks &&
                  previousStream
                ) {
                  finalStream =
                    new MediaStream();

                  const newAudioTrack =
                    newStream
                      .getAudioTracks()[0];

                  const newVideoTrack =
                    newStream
                      .getVideoTracks()[0];

                  const previousAudioTrack =
                    previousStream
                      .getAudioTracks()[0];

                  const previousVideoTrack =
                    previousStream
                      .getVideoTracks()[0];

                  if (
                    requestedMicrophoneEnabled
                  ) {
                    if (
                      newAudioTrack
                    ) {
                      finalStream.addTrack(
                        newAudioTrack
                      );
                    }
                  } else if (
                    previousAudioTrack
                  ) {
                    finalStream.addTrack(
                      previousAudioTrack
                    );
                  }

                  if (
                    requestedCameraEnabled
                  ) {
                    if (
                      newVideoTrack
                    ) {
                      finalStream.addTrack(
                        newVideoTrack
                      );
                    }
                  } else if (
                    previousVideoTrack
                  ) {
                    finalStream.addTrack(
                      previousVideoTrack
                    );
                  }

                  previousStream
                    .getTracks()
                    .forEach(
                      (
                        previousTrack
                      ) => {
                        const trackStillUsed =
                          finalStream
                            .getTracks()
                            .some(
                              (
                                currentTrack
                              ) =>
                                currentTrack ===
                                previousTrack
                            );

                        if (
                          !trackStillUsed
                        ) {
                          previousTrack.stop();
                        }
                      }
                    );
                } else {
                  stopTracks(
                    previousStream
                  );
                }

                finalStream
                  .getAudioTracks()
                  .forEach(
                    (track) => {
                      track.enabled =
                        requestedMicrophoneEnabled;
                    }
                  );

                finalStream
                  .getVideoTracks()
                  .forEach(
                    (track) => {
                      track.enabled =
                        requestedCameraEnabled;
                    }
                  );

                attachTrackListeners(
                  finalStream
                );

                setLocalStream(
                  finalStream
                );

                const activeAudioTrack =
                  finalStream
                    .getAudioTracks()[0];

                const activeVideoTrack =
                  finalStream
                    .getVideoTracks()[0];

                const activeAudioId =
                  getTrackDeviceId(
                    activeAudioTrack
                  );

                const activeVideoId =
                  getTrackDeviceId(
                    activeVideoTrack
                  );

                if (
                  activeAudioId
                ) {
                  setSelectedAudioInputId(
                    activeAudioId
                  );
                }

                if (
                  activeVideoId
                ) {
                  setSelectedVideoInputId(
                    activeVideoId
                  );
                }

                setStreamVersion(
                  (version) =>
                    version + 1
                );

                await updateLocalMedia({
                  microphoneEnabled:
                    Boolean(
                      activeAudioTrack &&
                      activeAudioTrack.enabled
                    ),

                  cameraEnabled:
                    Boolean(
                      activeVideoTrack &&
                      activeVideoTrack.enabled
                    ),
                });

                await refreshDevices();

                return finalStream;
              }
            )
            .catch((error) => {
              const normalizedError =
                normalizeMediaError(
                  error
                );

              if (
                mountedRef.current
              ) {
                setMediaError(
                  normalizedError
                );
              }

              const mediaErrorObject =
                new Error(
                  normalizedError.message
                );

              mediaErrorObject.code =
                normalizedError.code;

              mediaErrorObject.cause =
                error;

              throw mediaErrorObject;
            })
            .finally(() => {
              mediaRequestRef.current =
                null;

              if (
                mountedRef.current
              ) {
                setRequestingMedia(
                  false
                );
              }
            });

        mediaRequestRef.current =
          mediaRequest;

        return mediaRequest;
      },
      [
        initialMicrophoneEnabled,
        initialCameraEnabled,

        selectedAudioInputId,
        selectedVideoInputId,

        facingMode,

        audioConstraints,
        videoConstraints,

        isMediaSupported,

        attachTrackListeners,
        setLocalStream,
        stopLocalStream,
        updateLocalMedia,
        refreshDevices,
        localStreamRef,
      ]
    );

  /* ========================================================
     MICROPHONE CONTROL
  ======================================================== */

  const enableMicrophone =
    useCallback(async () => {
      const currentStream =
        localStreamRef.current;

      const existingTrack =
        currentStream
          ?.getAudioTracks?.()[0];

      if (
        existingTrack &&
        existingTrack.readyState ===
          "live"
      ) {
        existingTrack.enabled =
          true;

        setStreamVersion(
          (version) =>
            version + 1
        );

        await updateLocalMedia({
          microphoneEnabled:
            true,
        });

        return currentStream;
      }

      return requestLocalMedia({
        microphoneEnabled: true,

        cameraEnabled:
          Boolean(
            currentStream
              ?.getVideoTracks?.()[0]
          ),

        preserveExistingTracks:
          true,
      });
    }, [
      localStreamRef,
      requestLocalMedia,
      updateLocalMedia,
    ]);

  const disableMicrophone =
    useCallback(async () => {
      const track =
        localStreamRef.current
          ?.getAudioTracks?.()[0];

      if (track) {
        track.enabled = false;
      }

      setStreamVersion(
        (version) =>
          version + 1
      );

      await updateLocalMedia({
        microphoneEnabled:
          false,
      });

      return localStreamRef.current;
    }, [
      localStreamRef,
      updateLocalMedia,
    ]);

  const toggleMicrophone =
    useCallback(async () => {
      if (microphoneEnabled) {
        return disableMicrophone();
      }

      return enableMicrophone();
    }, [
      microphoneEnabled,
      enableMicrophone,
      disableMicrophone,
    ]);

  /* ========================================================
     CAMERA CONTROL
  ======================================================== */

  const enableCamera =
    useCallback(async () => {
      const currentStream =
        localStreamRef.current;

      const existingTrack =
        currentStream
          ?.getVideoTracks?.()[0];

      if (
        existingTrack &&
        existingTrack.readyState ===
          "live"
      ) {
        existingTrack.enabled =
          true;

        setStreamVersion(
          (version) =>
            version + 1
        );

        await updateLocalMedia({
          cameraEnabled: true,
        });

        return currentStream;
      }

      return requestLocalMedia({
        microphoneEnabled:
          Boolean(
            currentStream
              ?.getAudioTracks?.()[0]
          ),

        cameraEnabled: true,

        preserveExistingTracks:
          true,
      });
    }, [
      localStreamRef,
      requestLocalMedia,
      updateLocalMedia,
    ]);

  const disableCamera =
    useCallback(async () => {
      const track =
        localStreamRef.current
          ?.getVideoTracks?.()[0];

      if (track) {
        track.enabled = false;
      }

      setStreamVersion(
        (version) =>
          version + 1
      );

      await updateLocalMedia({
        cameraEnabled: false,
      });

      return localStreamRef.current;
    }, [
      localStreamRef,
      updateLocalMedia,
    ]);

  const toggleCamera =
    useCallback(async () => {
      if (cameraEnabled) {
        return disableCamera();
      }

      return enableCamera();
    }, [
      cameraEnabled,
      enableCamera,
      disableCamera,
    ]);

  /* ========================================================
     DEVICE SWITCHING
  ======================================================== */


  const switchAudioInput =
    useCallback(
      async (deviceId) => {
        if (!deviceId) {
          throw new Error(
            "Audio input device ID is required."
          );
        }

        const currentStream =
          localStreamRef.current;

        const microphoneWasEnabled =
          Boolean(
            currentStream
              ?.getAudioTracks?.()[0]
              ?.enabled
          );

        const newAudioStream =
          await navigator.mediaDevices
            .getUserMedia({
              audio:
                buildAudioConstraints({
                  enabled: true,
                  deviceId,

                  overrides:
                    audioConstraints,
                }),

              video: false,
            });

        const newTrack =
          newAudioStream
            .getAudioTracks()[0];

        if (!newTrack) {
          stopTracks(
            newAudioStream
          );

          throw new Error(
            "The selected microphone did not provide an audio track."
          );
        }

        newTrack.enabled =
          microphoneWasEnabled;

        const nextStream =
          new MediaStream();

        const existingVideoTrack =
          currentStream
            ?.getVideoTracks?.()[0];

        nextStream.addTrack(
          newTrack
        );

        if (
          existingVideoTrack
        ) {
          nextStream.addTrack(
            existingVideoTrack
          );
        }

        const previousAudioTrack =
          currentStream
            ?.getAudioTracks?.()[0];

        previousAudioTrack?.stop();

        attachTrackListeners(
          nextStream
        );

        setLocalStream(
          nextStream
        );

        setSelectedAudioInputId(
          deviceId
        );

        setStreamVersion(
          (version) =>
            version + 1
        );

        await updateLocalMedia({
          microphoneEnabled:
            microphoneWasEnabled,
        });

        return nextStream;
      },
      [
        audioConstraints,
        attachTrackListeners,
        localStreamRef,
        setLocalStream,
        updateLocalMedia,
      ]
    );

  const switchVideoInput =
    useCallback(
      async (deviceId) => {
        if (!deviceId) {
          throw new Error(
            "Video input device ID is required."
          );
        }

        const currentStream =
          localStreamRef.current;

        const cameraWasEnabled =
          Boolean(
            currentStream
              ?.getVideoTracks?.()[0]
              ?.enabled
          );

        const newVideoStream =
          await navigator.mediaDevices
            .getUserMedia({
              audio: false,

              video:
                buildVideoConstraints({
                  enabled: true,
                  deviceId,

                  facingMode,

                  overrides:
                    videoConstraints,
                }),
            });

        const newTrack =
          newVideoStream
            .getVideoTracks()[0];

        if (!newTrack) {
          stopTracks(
            newVideoStream
          );

          throw new Error(
            "The selected camera did not provide a video track."
          );
        }

        newTrack.enabled =
          cameraWasEnabled;

        const nextStream =
          new MediaStream();

        const existingAudioTrack =
          currentStream
            ?.getAudioTracks?.()[0];

        if (
          existingAudioTrack
        ) {
          nextStream.addTrack(
            existingAudioTrack
          );
        }

        nextStream.addTrack(
          newTrack
        );

        const previousVideoTrack =
          currentStream
            ?.getVideoTracks?.()[0];

        previousVideoTrack?.stop();

        attachTrackListeners(
          nextStream
        );

        setLocalStream(
          nextStream
        );

        setSelectedVideoInputId(
          deviceId
        );

        setStreamVersion(
          (version) =>
            version + 1
        );

    
        await updateLocalMedia({
          cameraEnabled:
            cameraWasEnabled,
        });

        return nextStream;
      },
      [
        videoConstraints,
        facingMode,
        attachTrackListeners,
        localStreamRef,
        setLocalStream,
        updateLocalMedia,
      ]
    );

  /* ========================================================
     CAMERA FACING MODE
  ======================================================== */

  const switchFacingMode =
    useCallback(async () => {
      const nextFacingMode =
        facingMode === "user"
          ? "environment"
          : "user";

      setFacingMode(
        nextFacingMode
      );

      const currentStream =
        localStreamRef.current;

      const cameraWasEnabled =
        Boolean(
          currentStream
            ?.getVideoTracks?.()[0]
            ?.enabled
        );

      const newVideoStream =
        await navigator.mediaDevices
          .getUserMedia({
            audio: false,

            video:
              buildVideoConstraints({
                enabled: true,

                deviceId: "",

                facingMode:
                  nextFacingMode,

                overrides:
                  videoConstraints,
              }),
          });

      const newTrack =
        newVideoStream
          .getVideoTracks()[0];

      if (!newTrack) {
        stopTracks(
          newVideoStream
        );

        throw new Error(
          "Unable to switch camera."
        );
      }

      newTrack.enabled =
        cameraWasEnabled;

      const nextStream =
        new MediaStream();

      const existingAudioTrack =
        currentStream
          ?.getAudioTracks?.()[0];

      if (
        existingAudioTrack
      ) {
        nextStream.addTrack(
          existingAudioTrack
        );
      }

      nextStream.addTrack(
        newTrack
      );

      const previousVideoTrack =
        currentStream
          ?.getVideoTracks?.()[0];

      previousVideoTrack?.stop();

      attachTrackListeners(
        nextStream
      );

      setLocalStream(
        nextStream
      );

      setSelectedVideoInputId(
        getTrackDeviceId(
          newTrack
        )
      );

      setStreamVersion(
        (version) =>
          version + 1
      );

      await updateLocalMedia({
        cameraEnabled:
          cameraWasEnabled,
      });

      return nextStream;
    }, [
      facingMode,
      videoConstraints,
      attachTrackListeners,
      localStreamRef,
      setLocalStream,
      updateLocalMedia,
    ]);

  /* ========================================================
     AUDIO OUTPUT
  ======================================================== */

  const applyAudioOutput =
    useCallback(
      async (
        mediaElement,
        deviceId
      ) => {
        if (!mediaElement) {
          throw new Error(
            "A media element is required."
          );
        }

        if (
          typeof mediaElement
            .setSinkId !==
          "function"
        ) {
          throw new Error(
            "This browser does not support audio output selection."
          );
        }

        await mediaElement.setSinkId(
          deviceId
        );

        setSelectedAudioOutputId(
          deviceId
        );

        return deviceId;
      },
      []
    );

  /* ========================================================
     STOP INDIVIDUAL TRACKS
  ======================================================== */

  const stopMicrophone =
    useCallback(async () => {
      const currentStream =
        localStreamRef.current;

      const audioTracks =
        currentStream
          ?.getAudioTracks?.() ||
        [];

      audioTracks.forEach(
        (track) => {
          track.stop();

          currentStream.removeTrack(
            track
          );
        }
      );

      setStreamVersion(
        (version) =>
          version + 1
      );

      await updateLocalMedia({
        microphoneEnabled:
          false,
      });
    }, [
      localStreamRef,
      updateLocalMedia,
    ]);

  const stopCamera =
    useCallback(async () => {
      const currentStream =
        localStreamRef.current;

      const videoTracks =
        currentStream
          ?.getVideoTracks?.() ||
        [];

      videoTracks.forEach(
        (track) => {
          track.stop();

          currentStream.removeTrack(
            track
          );
        }
      );

      setStreamVersion(
        (version) =>
          version + 1
      );

      await updateLocalMedia({
        cameraEnabled: false,
      });
    }, [
      localStreamRef,
      updateLocalMedia,
    ]);

  const stopAllMedia =
    useCallback(async () => {
      stopLocalStream();

      setStreamVersion(
        (version) =>
          version + 1
      );

      await updateLocalMedia({
        microphoneEnabled:
          false,

        cameraEnabled:
          false,
      });
    }, [
      stopLocalStream,
      updateLocalMedia,
    ]);

  /* ========================================================
     CLEAR ERROR
  ======================================================== */

  const clearMediaError =
    useCallback(() => {
      setMediaError(null);
    }, []);

  /* ========================================================
     DEVICE CHANGE LISTENER
  ======================================================== */

  useEffect(() => {
    if (
      !navigator?.mediaDevices
    ) {
      return undefined;
    }

    const handleDeviceChange =
      () => {
        refreshDevices();
      };

    navigator.mediaDevices.addEventListener?.(
      "devicechange",
      handleDeviceChange
    );

    return () => {
      navigator.mediaDevices.removeEventListener?.(
        "devicechange",
        handleDeviceChange
      );
    };
  }, [refreshDevices]);

  /* ========================================================
     PERMISSION WATCHERS
  ======================================================== */

  useEffect(() => {
    watchPermission(
      "microphone",
      "microphone",
      microphonePermissionRef
    );

    watchPermission(
      "camera",
      "camera",
      cameraPermissionRef
    );

    return () => {
      if (
        microphonePermissionRef.current
      ) {
        microphonePermissionRef.current.onchange =
          null;
      }

      if (
        cameraPermissionRef.current
      ) {
        cameraPermissionRef.current.onchange =
          null;
      }
    };
  }, [watchPermission]);

  /* ========================================================
     INITIAL DEVICE LOAD
  ======================================================== */

 useEffect(() => {
  refreshDevices({
    askForPermission: false,
  });
}, []);

  /* ========================================================
     OPTIONAL AUTO REQUEST
  ======================================================== */

  useEffect(() => {
    if (
      !autoRequest ||
      hasRequestedMedia
    ) {
      return;
    }

    requestLocalMedia().catch(
      () => {
        /*
         * The consuming component will display mediaError.
         */
      }
    );
  }, [
    autoRequest,
    hasRequestedMedia,
    requestLocalMedia,
  ]);

  /* ========================================================
     UNMOUNT CLEANUP
  ======================================================== */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current =
        false;

      if (
        mediaRequestRef.current
      ) {
        mediaRequestRef.current =
          null;
      }
    };
  }, []);

  /* ========================================================
     DERIVED DEVICE LABELS
  ======================================================== */

  const audioInputs =
    useMemo(() => {
      return devices.audioInputs.map(
        (
          device,
          index
        ) => ({
          ...device,

          displayLabel:
            device.label ||
            `Microphone ${index + 1}`,
        })
      );
    }, [devices.audioInputs]);

  const videoInputs =
    useMemo(() => {
      return devices.videoInputs.map(
        (
          device,
          index
        ) => ({
          ...device,

          displayLabel:
            device.label ||
            `Camera ${index + 1}`,
        })
      );
    }, [devices.videoInputs]);

  const audioOutputs =
    useMemo(() => {
      return devices.audioOutputs.map(
        (
          device,
          index
        ) => ({
          ...device,

          displayLabel:
            device.label ||
            `Speaker ${index + 1}`,
        })
      );
    }, [devices.audioOutputs]);

  /* ========================================================
     RETURN
  ======================================================== */

  return {
    localStream:
      localStreamRef.current,

    audioTrack,
    videoTrack,

    hasAudioTrack,
    hasVideoTrack,

    microphoneEnabled,
    cameraEnabled,

    contextMicrophoneEnabled:
      localMedia
        .microphoneEnabled,

    contextCameraEnabled:
      localMedia.cameraEnabled,

    requestingMedia,
    hasRequestedMedia,

    mediaError,
    clearMediaError,

    permissionState,

    isMediaSupported,
    supportedConstraints,

    audioInputs,
    videoInputs,
    audioOutputs,

    selectedAudioInputId,
    selectedVideoInputId,
    selectedAudioOutputId,

    facingMode,

    requestLocalMedia,

    enableMicrophone,
    disableMicrophone,
    toggleMicrophone,
    stopMicrophone,

    enableCamera,
    disableCamera,
    toggleCamera,
    stopCamera,

    switchAudioInput,
    switchVideoInput,
    switchFacingMode,

    applyAudioOutput,

    refreshDevices,

    stopAllMedia,

    streamVersion,
  };
};

export {
  DEFAULT_AUDIO_CONSTRAINTS,
  DEFAULT_VIDEO_CONSTRAINTS,
  buildAudioConstraints,
  buildVideoConstraints,
  normalizeMediaError,
};

export default useLocalMedia;