import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ==========================================================
   CONSTANTS
========================================================== */

const STORAGE_KEYS = {
  audioInput:
    "jvp-live-meeting-audio-input",

  videoInput:
    "jvp-live-meeting-video-input",

  audioOutput:
    "jvp-live-meeting-audio-output",
};

const DEVICE_KINDS = {
  audioInput: "audioinput",
  videoInput: "videoinput",
  audioOutput: "audiooutput",
};

/* ==========================================================
   HELPERS
========================================================== */

const isBrowser =
  typeof window !== "undefined";

const isMediaDevicesSupported = () => {
  return Boolean(
    typeof navigator !==
      "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices
        .enumerateDevices ===
        "function"
  );
};

const getStoredValue = (
  key
) => {
  if (!isBrowser) {
    return "";
  }

  try {
    return (
      window.localStorage.getItem(
        key
      ) || ""
    );
  } catch {
    return "";
  }
};

const setStoredValue = (
  key,
  value
) => {
  if (!isBrowser) {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(
        key,
        value
      );
    } else {
      window.localStorage.removeItem(
        key
      );
    }
  } catch {
    // Storage may be unavailable.
  }
};

const normalizeDevice = (
  device,
  index
) => {
  const kind =
    device?.kind || "";

  let fallbackLabel =
    "Media device";

  if (
    kind ===
    DEVICE_KINDS.audioInput
  ) {
    fallbackLabel = `Microphone ${
      index + 1
    }`;
  }

  if (
    kind ===
    DEVICE_KINDS.videoInput
  ) {
    fallbackLabel = `Camera ${
      index + 1
    }`;
  }

  if (
    kind ===
    DEVICE_KINDS.audioOutput
  ) {
    fallbackLabel = `Speaker ${
      index + 1
    }`;
  }

  return {
    deviceId:
      device?.deviceId || "",

    groupId:
      device?.groupId || "",

    kind,

    label:
      device?.label ||
      fallbackLabel,

    raw: device,
  };
};

const normalizeMediaDeviceError = (
  error
) => {
  const name =
    error?.name || "";

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return {
        code:
          "MEDIA_PERMISSION_DENIED",

        message:
          "Permission to access media devices was denied.",
      };

    case "NotFoundError":
      return {
        code:
          "MEDIA_DEVICE_NOT_FOUND",

        message:
          "No suitable media device was found.",
      };

    case "NotReadableError":
      return {
        code:
          "MEDIA_DEVICE_NOT_READABLE",

        message:
          "The selected media device could not be accessed. It may already be in use.",
      };

    case "OverconstrainedError":
      return {
        code:
          "MEDIA_DEVICE_CONSTRAINT_FAILED",

        message:
          "The selected media device does not support the requested settings.",
      };

    case "SecurityError":
      return {
        code:
          "MEDIA_SECURITY_ERROR",

        message:
          "The browser blocked access to media devices.",
      };

    default:
      return {
        code:
          "MEDIA_DEVICE_ERROR",

        message:
          error?.message ||
          "Unable to access media devices.",
      };
  }
};

const deviceExists = (
  devices,
  deviceId
) => {
  if (!deviceId) {
    return false;
  }

  return devices.some(
    (device) =>
      device.deviceId ===
      deviceId
  );
};

/* ==========================================================
   HOOK
========================================================== */

const useMediaDevices = ({
  localMedia = null,

  webRTC = null,

  rememberSelection = true,

  autoRefresh = true,

  requestLabels = false,

  onDevicesChanged,

  onDeviceSelected,

  onError,
} = {}) => {
  const mountedRef =
    useRef(true);

  const refreshingRef =
    useRef(false);

  const initialRefreshDoneRef =
  useRef(false);  

  const [
    devices,
    setDevices,
  ] = useState([]);

  const [
    selectedAudioInputId,
    setSelectedAudioInputId,
  ] = useState(() => {
    return rememberSelection
      ? getStoredValue(
          STORAGE_KEYS.audioInput
        )
      : "";
  });

  const [
    selectedVideoInputId,
    setSelectedVideoInputId,
  ] = useState(() => {
    return rememberSelection
      ? getStoredValue(
          STORAGE_KEYS.videoInput
        )
      : "";
  });

  const [
    selectedAudioOutputId,
    setSelectedAudioOutputId,
  ] = useState(() => {
    return rememberSelection
      ? getStoredValue(
          STORAGE_KEYS.audioOutput
        )
      : "";
  });

  const [
    loadingDevices,
    setLoadingDevices,
  ] = useState(false);

  const [
    switchingDevice,
    setSwitchingDevice,
  ] = useState(false);

  const [
    deviceError,
    setDeviceError,
  ] = useState(null);

  const [
    permissionLabelsAvailable,
    setPermissionLabelsAvailable,
  ] = useState(false);

  /* ========================================================
     SUPPORT
  ======================================================== */

  const mediaDevicesSupported =
    isMediaDevicesSupported();

  const audioOutputSelectionSupported =
    Boolean(
      typeof HTMLMediaElement !==
        "undefined" &&
        HTMLMediaElement.prototype &&
        typeof HTMLMediaElement
          .prototype.setSinkId ===
          "function"
    );

  /* ========================================================
     DERIVED DEVICE LISTS
  ======================================================== */

  const microphones =
    useMemo(() => {
      return devices.filter(
        (device) =>
          device.kind ===
          DEVICE_KINDS.audioInput
      );
    }, [devices]);

  const cameras =
    useMemo(() => {
      return devices.filter(
        (device) =>
          device.kind ===
          DEVICE_KINDS.videoInput
      );
    }, [devices]);

  const speakers =
    useMemo(() => {
      return devices.filter(
        (device) =>
          device.kind ===
          DEVICE_KINDS.audioOutput
      );
    }, [devices]);

  const selectedMicrophone =
    useMemo(() => {
      return (
        microphones.find(
          (device) =>
            device.deviceId ===
            selectedAudioInputId
        ) || null
      );
    }, [
      microphones,
      selectedAudioInputId,
    ]);

  const selectedCamera =
    useMemo(() => {
      return (
        cameras.find(
          (device) =>
            device.deviceId ===
            selectedVideoInputId
        ) || null
      );
    }, [
      cameras,
      selectedVideoInputId,
    ]);

  const selectedSpeaker =
    useMemo(() => {
      return (
        speakers.find(
          (device) =>
            device.deviceId ===
            selectedAudioOutputId
        ) || null
      );
    }, [
      speakers,
      selectedAudioOutputId,
    ]);

  /* ========================================================
     ERROR HANDLING
  ======================================================== */

  const handleError =
    useCallback(
      (
        error,
        metadata = {}
      ) => {
        const normalized =
          normalizeMediaDeviceError(
            error
          );

        const payload = {
          ...normalized,

          originalError:
            error,

          metadata,
        };

        if (mountedRef.current) {
          setDeviceError(
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

  const clearDeviceError =
    useCallback(() => {
      setDeviceError(null);
    }, []);

  /* ========================================================
     REQUEST PERMISSION FOR DEVICE LABELS

     Browsers may return blank labels before camera or
     microphone permission has been granted.
  ======================================================== */

  const requestDevicePermission =
    useCallback(async () => {
      if (
        !mediaDevicesSupported ||
        typeof navigator.mediaDevices
          .getUserMedia !==
          "function"
      ) {
        throw new Error(
          "Media devices are not supported by this browser."
        );
      }

      let permissionStream;

      try {
        permissionStream =
          await navigator.mediaDevices
            .getUserMedia({
              audio: true,
              video: true,
            });

        setPermissionLabelsAvailable(
          true
        );

        return true;
      } catch (error) {
        handleError(error, {
          action:
            "request-device-permission",
        });

        throw error;
      } finally {
        permissionStream
          ?.getTracks?.()
          .forEach((track) => {
            try {
              track.stop();
            } catch {
              // Track may already be stopped.
            }
          });
      }
    }, [
      mediaDevicesSupported,
      handleError,
    ]);

  /* ========================================================
     REFRESH DEVICE LIST
  ======================================================== */

  const refreshDevices =
    useCallback(
      async ({
        askForPermission = false,
      } = {}) => {
        if (
          !mediaDevicesSupported
        ) {
          const error =
            new Error(
              "Media device enumeration is not supported by this browser."
            );

          handleError(error, {
            action:
              "enumerate-devices",
          });

          return [];
        }

        if (
          refreshingRef.current
        ) {
          return devices;
        }

        refreshingRef.current =
          true;

        if (mountedRef.current) {
          setLoadingDevices(true);
          setDeviceError(null);
        }

        try {
          if (
            askForPermission ||
            requestLabels
          ) {
            try {
              await requestDevicePermission();
            } catch {
              /*
               * Continue enumerating devices even when
               * permission is denied. The browser may still
               * return device IDs with blank labels.
               */
            }
          }

          const rawDevices =
            await navigator.mediaDevices
              .enumerateDevices();

          const kindCounts = {
            audioinput: 0,
            videoinput: 0,
            audiooutput: 0,
          };

          const normalizedDevices =
            rawDevices.map(
              (device) => {
                const index =
                  kindCounts[
                    device.kind
                  ] || 0;

                kindCounts[
                  device.kind
                ] = index + 1;

                return normalizeDevice(
                  device,
                  index
                );
              }
            );

          const labelsAvailable =
            normalizedDevices.some(
              (device) =>
                Boolean(
                  device.raw
                    ?.label
                )
            );

          if (mountedRef.current) {
            setDevices(
              normalizedDevices
            );

            setPermissionLabelsAvailable(
              labelsAvailable
            );
          }

          const nextMicrophones =
            normalizedDevices.filter(
              (device) =>
                device.kind ===
                DEVICE_KINDS.audioInput
            );

          const nextCameras =
            normalizedDevices.filter(
              (device) =>
                device.kind ===
                DEVICE_KINDS.videoInput
            );

          const nextSpeakers =
            normalizedDevices.filter(
              (device) =>
                device.kind ===
                DEVICE_KINDS.audioOutput
            );

          /*
           * If a remembered device no longer exists,
           * select the first available device.
           */

          if (
            !deviceExists(
              nextMicrophones,
              selectedAudioInputId
            )
          ) {
            const fallbackId =
              nextMicrophones[0]
                ?.deviceId || "";

            setSelectedAudioInputId(
              fallbackId
            );

            if (
              rememberSelection
            ) {
              setStoredValue(
                STORAGE_KEYS.audioInput,
                fallbackId
              );
            }
          }

          if (
            !deviceExists(
              nextCameras,
              selectedVideoInputId
            )
          ) {
            const fallbackId =
              nextCameras[0]
                ?.deviceId || "";

            setSelectedVideoInputId(
              fallbackId
            );

            if (
              rememberSelection
            ) {
              setStoredValue(
                STORAGE_KEYS.videoInput,
                fallbackId
              );
            }
          }

          if (
            !deviceExists(
              nextSpeakers,
              selectedAudioOutputId
            )
          ) {
            const fallbackId =
              nextSpeakers[0]
                ?.deviceId || "";

            setSelectedAudioOutputId(
              fallbackId
            );

            if (
              rememberSelection
            ) {
              setStoredValue(
                STORAGE_KEYS.audioOutput,
                fallbackId
              );
            }
          }

          if (
            typeof onDevicesChanged ===
            "function"
          ) {
            onDevicesChanged({
              devices:
                normalizedDevices,

              microphones:
                nextMicrophones,

              cameras:
                nextCameras,

              speakers:
                nextSpeakers,
            });
          }

          return normalizedDevices;
        } catch (error) {
          handleError(error, {
            action:
              "enumerate-devices",
          });

          throw error;
        } finally {
          refreshingRef.current =
            false;

          if (mountedRef.current) {
            setLoadingDevices(
              false
            );
          }
        }
      },
      [
  mediaDevicesSupported,
  requestLabels,
  requestDevicePermission,
  rememberSelection,
  onDevicesChanged,
  handleError,
]
    );

  /* ========================================================
     SELECT MICROPHONE
  ======================================================== */

  const selectAudioInput =
    useCallback(
      async (
        deviceId,
        {
          switchTrack = true,
        } = {}
      ) => {
        const nextDeviceId =
          String(
            deviceId || ""
          );

        if (!nextDeviceId) {
          throw new Error(
            "A microphone device ID is required."
          );
        }

        if (
          !deviceExists(
            microphones,
            nextDeviceId
          )
        ) {
          throw new Error(
            "The selected microphone is no longer available."
          );
        }

        setSwitchingDevice(true);
        setDeviceError(null);

        try {
          let stream = null;

          if (
            switchTrack &&
            typeof localMedia
              ?.switchAudioInput ===
              "function"
          ) {
            stream =
              await localMedia.switchAudioInput(
                nextDeviceId
              );

            const audioTrack =
              stream
                ?.getAudioTracks?.()
                .find(
                  (track) =>
                    track.readyState ===
                    "live"
                ) || null;

            if (
              audioTrack &&
              typeof webRTC
                ?.replaceTrackForAllPeers ===
                "function"
            ) {
              await webRTC.replaceTrackForAllPeers(
                "audio",
                audioTrack,
                stream
              );
            }
          }

          setSelectedAudioInputId(
            nextDeviceId
          );

          if (
            rememberSelection
          ) {
            setStoredValue(
              STORAGE_KEYS.audioInput,
              nextDeviceId
            );
          }

          if (
            typeof onDeviceSelected ===
            "function"
          ) {
            onDeviceSelected({
              kind:
                DEVICE_KINDS.audioInput,

              deviceId:
                nextDeviceId,

              device:
                microphones.find(
                  (device) =>
                    device.deviceId ===
                    nextDeviceId
                ) || null,

              stream,
            });
          }

          return stream;
        } catch (error) {
          handleError(error, {
            action:
              "select-audio-input",

            deviceId:
              nextDeviceId,
          });

          throw error;
        } finally {
          if (mountedRef.current) {
            setSwitchingDevice(
              false
            );
          }
        }
      },
      [
        microphones,
        localMedia,
        webRTC,
        rememberSelection,
        onDeviceSelected,
        handleError,
      ]
    );

  /* ========================================================
     SELECT CAMERA
  ======================================================== */

  const selectVideoInput =
    useCallback(
      async (
        deviceId,
        {
          switchTrack = true,
        } = {}
      ) => {
        const nextDeviceId =
          String(
            deviceId || ""
          );

        if (!nextDeviceId) {
          throw new Error(
            "A camera device ID is required."
          );
        }

        if (
          !deviceExists(
            cameras,
            nextDeviceId
          )
        ) {
          throw new Error(
            "The selected camera is no longer available."
          );
        }

        setSwitchingDevice(true);
        setDeviceError(null);

        try {
          let stream = null;

          if (
            switchTrack &&
            typeof localMedia
              ?.switchVideoInput ===
              "function"
          ) {
            stream =
              await localMedia.switchVideoInput(
                nextDeviceId
              );

            const videoTrack =
              stream
                ?.getVideoTracks?.()
                .find(
                  (track) =>
                    track.readyState ===
                    "live"
                ) || null;

            if (
              videoTrack &&
              typeof webRTC
                ?.replaceTrackForAllPeers ===
                "function"
            ) {
              await webRTC.replaceTrackForAllPeers(
                "video",
                videoTrack,
                stream
              );
            }
          }

          setSelectedVideoInputId(
            nextDeviceId
          );

          if (
            rememberSelection
          ) {
            setStoredValue(
              STORAGE_KEYS.videoInput,
              nextDeviceId
            );
          }

          if (
            typeof onDeviceSelected ===
            "function"
          ) {
            onDeviceSelected({
              kind:
                DEVICE_KINDS.videoInput,

              deviceId:
                nextDeviceId,

              device:
                cameras.find(
                  (device) =>
                    device.deviceId ===
                    nextDeviceId
                ) || null,

              stream,
            });
          }

          return stream;
        } catch (error) {
          handleError(error, {
            action:
              "select-video-input",

            deviceId:
              nextDeviceId,
          });

          throw error;
        } finally {
          if (mountedRef.current) {
            setSwitchingDevice(
              false
            );
          }
        }
      },
      [
        cameras,
        localMedia,
        webRTC,
        rememberSelection,
        onDeviceSelected,
        handleError,
      ]
    );

  /* ========================================================
     SELECT AUDIO OUTPUT
  ======================================================== */

  const selectAudioOutput =
    useCallback(
      async (
        deviceId,
        mediaElements = []
      ) => {
        const nextDeviceId =
          String(
            deviceId || ""
          );

        if (!nextDeviceId) {
          throw new Error(
            "A speaker device ID is required."
          );
        }

        if (
          !audioOutputSelectionSupported
        ) {
          const error =
            new Error(
              "This browser does not support selecting an audio output device."
            );

          handleError(error, {
            action:
              "select-audio-output",
          });

          throw error;
        }

        setSwitchingDevice(true);
        setDeviceError(null);

        try {
          const elements =
            Array.isArray(
              mediaElements
            )
              ? mediaElements
              : [mediaElements];

          const validElements =
            elements.filter(
              (element) =>
                element &&
                typeof element.setSinkId ===
                  "function"
            );

          await Promise.all(
            validElements.map(
              (element) =>
                element.setSinkId(
                  nextDeviceId
                )
            )
          );

          setSelectedAudioOutputId(
            nextDeviceId
          );

          if (
            rememberSelection
          ) {
            setStoredValue(
              STORAGE_KEYS.audioOutput,
              nextDeviceId
            );
          }

          if (
            typeof onDeviceSelected ===
            "function"
          ) {
            onDeviceSelected({
              kind:
                DEVICE_KINDS.audioOutput,

              deviceId:
                nextDeviceId,

              device:
                speakers.find(
                  (device) =>
                    device.deviceId ===
                    nextDeviceId
                ) || null,

              mediaElements:
                validElements,
            });
          }

          return true;
        } catch (error) {
          handleError(error, {
            action:
              "select-audio-output",

            deviceId:
              nextDeviceId,
          });

          throw error;
        } finally {
          if (mountedRef.current) {
            setSwitchingDevice(
              false
            );
          }
        }
      },
      [
        audioOutputSelectionSupported,
        speakers,
        rememberSelection,
        onDeviceSelected,
        handleError,
      ]
    );

  /* ========================================================
     APPLY SELECTED OUTPUT TO ONE MEDIA ELEMENT
  ======================================================== */

  const applySelectedAudioOutput =
    useCallback(
      async (
        mediaElement
      ) => {
        if (
          !mediaElement ||
          !selectedAudioOutputId
        ) {
          return false;
        }

        if (
          typeof mediaElement
            .setSinkId !==
          "function"
        ) {
          return false;
        }

        await mediaElement.setSinkId(
          selectedAudioOutputId
        );

        return true;
      },
      [selectedAudioOutputId]
    );

  /* ========================================================
     RESET SAVED DEVICE SELECTIONS
  ======================================================== */

  const resetDeviceSelections =
    useCallback(() => {
      setSelectedAudioInputId(
        ""
      );

      setSelectedVideoInputId(
        ""
      );

      setSelectedAudioOutputId(
        ""
      );

      setStoredValue(
        STORAGE_KEYS.audioInput,
        ""
      );

      setStoredValue(
        STORAGE_KEYS.videoInput,
        ""
      );

      setStoredValue(
        STORAGE_KEYS.audioOutput,
        ""
      );
    }, []);

  /* ========================================================
     INITIAL REFRESH
  ======================================================== */

 useEffect(() => {
  mountedRef.current = true;

  if (
    autoRefresh &&
    mediaDevicesSupported &&
    !initialRefreshDoneRef.current
  ) {
    initialRefreshDoneRef.current =
      true;

    refreshDevices().catch(() => {
      // Error is already stored by refreshDevices.
    });
  }

  return () => {
    mountedRef.current = false;
  };
}, [
  autoRefresh,
  mediaDevicesSupported,
  refreshDevices,
]);

  /* ========================================================
     DEVICE CHANGE LISTENER
  ======================================================== */

  useEffect(() => {
    if (
      !mediaDevicesSupported
    ) {
      return undefined;
    }

    const handleDeviceChange =
      () => {
        refreshDevices().catch(
          () => {
            // Error is already handled.
          }
        );
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
  }, [
    mediaDevicesSupported,
    refreshDevices,
  ]);

  /* ========================================================
     RETURN
  ======================================================== */

  return {
    devices,

    microphones,
    cameras,
    speakers,

    selectedAudioInputId,
    selectedVideoInputId,
    selectedAudioOutputId,

    selectedMicrophone,
    selectedCamera,
    selectedSpeaker,

    mediaDevicesSupported,
    audioOutputSelectionSupported,
    permissionLabelsAvailable,

    loadingDevices,
    switchingDevice,

    deviceBusy:
      loadingDevices ||
      switchingDevice,

    deviceError,
    clearDeviceError,

    refreshDevices,
    requestDevicePermission,

    selectAudioInput,
    selectVideoInput,
    selectAudioOutput,

    applySelectedAudioOutput,

    resetDeviceSelections,
  };
};

export {
  STORAGE_KEYS,
  DEVICE_KINDS,
  normalizeDevice,
  normalizeMediaDeviceError,
};

export default useMediaDevices;