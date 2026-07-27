import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiCamera,
  FiCheck,
  FiChevronDown,
  FiMic,
  FiMonitor,
  FiRefreshCw,
  FiSettings,
  FiVolume2,
  FiVideo,
  FiX,
} from "react-icons/fi";

import "./DeviceSettingsPanel.css";

/* ==========================================================
   HELPERS
========================================================== */

const normalizeDevices = (
  devices = [],
  kind = ""
) => {
  if (!Array.isArray(devices)) {
    return [];
  }

  return devices
    .filter(Boolean)
    .filter((device) => {
      if (!kind) {
        return true;
      }

      return (
        !device?.kind ||
        device.kind === kind
      );
    })
    .map((device, index) => ({
      deviceId:
        device?.deviceId ||
        device?.id ||
        "",

      groupId:
        device?.groupId ||
        "",

      kind:
        device?.kind ||
        kind,

      label:
        device?.label ||
        device?.name ||
        `${getDeviceTypeLabel(
          kind
        )} ${index + 1}`,
    }));
};

const getDeviceTypeLabel = (
  kind
) => {
  switch (kind) {
    case "audioinput":
      return "Microphone";

    case "videoinput":
      return "Camera";

    case "audiooutput":
      return "Speaker";

    default:
      return "Device";
  }
};

const getSelectedDeviceLabel = ({
  devices,
  selectedDeviceId,
  fallback,
}) => {
  const selectedDevice =
    devices.find(
      (device) =>
        String(
          device.deviceId
        ) ===
        String(
          selectedDeviceId
        )
    );

  return (
    selectedDevice?.label ||
    fallback
  );
};

/* ==========================================================
   DEVICE SELECT
========================================================== */

const DeviceSelect = ({
  icon: Icon,
  label,
  value = "",
  devices = [],
  disabled = false,
  placeholder = "Select a device",
  onChange,
}) => {
  return (
    <label className="device-settings-panel__field">
      <span className="device-settings-panel__field-label">
        {Icon && <Icon />}

        <span>{label}</span>
      </span>

      <span className="device-settings-panel__select-wrap">
        <select
          value={value || ""}
          disabled={disabled}
          onChange={(event) =>
            onChange?.(
              event.target.value
            )
          }
        >
          <option value="">
            {placeholder}
          </option>

          {devices.map(
            (device) => (
              <option
                key={
                  device.deviceId ||
                  `${device.kind}-${device.label}`
                }
                value={
                  device.deviceId
                }
              >
                {device.label}
              </option>
            )
          )}
        </select>

        <FiChevronDown />
      </span>
    </label>
  );
};

/* ==========================================================
   AUDIO LEVEL
========================================================== */

const AudioLevelMeter = ({
  level = 0,
  active = false,
}) => {
  const normalizedLevel =
    Math.max(
      0,
      Math.min(
        100,
        Number(level) || 0
      )
    );

  return (
    <div
      className={[
        "device-settings-panel__audio-meter",

        active
          ? "device-settings-panel__audio-meter--active"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Microphone level ${Math.round(
        normalizedLevel
      )} percent`}
    >
      {Array.from({
        length: 12,
      }).map((_, index) => {
        const threshold =
          ((index + 1) / 12) *
          100;

        const enabled =
          active &&
          normalizedLevel >=
            threshold;

        return (
          <span
            key={index}
            className={
              enabled
                ? "device-settings-panel__audio-bar--active"
                : ""
            }
          />
        );
      })}
    </div>
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

const DeviceSettingsPanel = ({
  isOpen = true,

  microphoneDevices = [],
  cameraDevices = [],
  speakerDevices = [],

  selectedMicrophoneId = "",
  selectedCameraId = "",
  selectedSpeakerId = "",

  microphoneEnabled = true,
  cameraEnabled = true,

  microphoneLevel = 0,

  localStream = null,

  loading = false,
  refreshing = false,
  applying = false,

  microphoneSupported = true,
  cameraSupported = true,
  speakerSelectionSupported = true,

  className = "",

  onClose,

  onRefreshDevices,

  onSelectMicrophone,
  onSelectCamera,
  onSelectSpeaker,

  onApply,
}) => {
  const videoRef =
    useRef(null);

  const [
    microphoneId,
    setMicrophoneId,
  ] = useState(
    selectedMicrophoneId || ""
  );

  const [
    cameraId,
    setCameraId,
  ] = useState(
    selectedCameraId || ""
  );

  const [
    speakerId,
    setSpeakerId,
  ] = useState(
    selectedSpeakerId || ""
  );

  const [
    error,
    setError,
  ] = useState("");

  const normalizedMicrophones =
    useMemo(
      () =>
        normalizeDevices(
          microphoneDevices,
          "audioinput"
        ),
      [microphoneDevices]
    );

  const normalizedCameras =
    useMemo(
      () =>
        normalizeDevices(
          cameraDevices,
          "videoinput"
        ),
      [cameraDevices]
    );

  const normalizedSpeakers =
    useMemo(
      () =>
        normalizeDevices(
          speakerDevices,
          "audiooutput"
        ),
      [speakerDevices]
    );

  const hasChanges =
    String(microphoneId) !==
      String(
        selectedMicrophoneId || ""
      ) ||
    String(cameraId) !==
      String(
        selectedCameraId || ""
      ) ||
    String(speakerId) !==
      String(
        selectedSpeakerId || ""
      );

  const cameraLabel =
    getSelectedDeviceLabel({
      devices:
        normalizedCameras,
      selectedDeviceId:
        cameraId,
      fallback:
        "Camera preview",
    });

  useEffect(() => {
    setMicrophoneId(
      selectedMicrophoneId ||
        ""
    );
  }, [
    selectedMicrophoneId,
  ]);

  useEffect(() => {
    setCameraId(
      selectedCameraId || ""
    );
  }, [
    selectedCameraId,
  ]);

  useEffect(() => {
    setSpeakerId(
      selectedSpeakerId || ""
    );
  }, [
    selectedSpeakerId,
  ]);

  useEffect(() => {
    const videoElement =
      videoRef.current;

    if (!videoElement) {
      return undefined;
    }

    if (
      localStream instanceof
      MediaStream
    ) {
      videoElement.srcObject =
        localStream;

      videoElement
        .play()
        .catch(() => {});
    } else {
      videoElement.srcObject =
        null;
    }

    return () => {
      if (videoElement) {
        videoElement.srcObject =
          null;
      }
    };
  }, [localStream]);

  const handleMicrophoneChange =
    async (deviceId) => {
      setMicrophoneId(
        deviceId
      );
      setError("");

      try {
        await onSelectMicrophone?.(
          deviceId
        );
      } catch (changeError) {
        setError(
          changeError?.message ||
            "Unable to change microphone."
        );
      }
    };

  const handleCameraChange =
    async (deviceId) => {
      setCameraId(deviceId);
      setError("");

      try {
        await onSelectCamera?.(
          deviceId
        );
      } catch (changeError) {
        setError(
          changeError?.message ||
            "Unable to change camera."
        );
      }
    };

  const handleSpeakerChange =
    async (deviceId) => {
      setSpeakerId(deviceId);
      setError("");

      try {
        await onSelectSpeaker?.(
          deviceId
        );
      } catch (changeError) {
        setError(
          changeError?.message ||
            "Unable to change speaker."
        );
      }
    };

  const handleRefresh =
    async () => {
      if (
        typeof onRefreshDevices !==
        "function"
      ) {
        return;
      }

      setError("");

      try {
        await onRefreshDevices();
      } catch (refreshError) {
        setError(
          refreshError?.message ||
            "Unable to refresh devices."
        );
      }
    };

  const handleApply =
    async () => {
      if (
        typeof onApply !==
        "function"
      ) {
        onClose?.();
        return;
      }

      setError("");

      try {
        await onApply({
          microphoneId,
          cameraId,
          speakerId,
        });
      } catch (applyError) {
        setError(
          applyError?.message ||
            "Unable to apply device settings."
        );
      }
    };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={[
        "device-settings-panel",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Device settings"
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="device-settings-panel__header">
        <div>
          <div className="device-settings-panel__title-row">
            <FiSettings />

            <h2>
              Device settings
            </h2>
          </div>

          <p>
            Choose the microphone,
            camera and speaker used
            in this meeting.
          </p>
        </div>

        <button
          type="button"
          className="device-settings-panel__close-button"
          onClick={onClose}
          aria-label="Close device settings"
        >
          <FiX />
        </button>
      </header>

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <div className="device-settings-panel__content">
        {error && (
          <div
            className="device-settings-panel__error"
            role="alert"
          >
            <FiAlertCircle />

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              aria-label="Dismiss error"
            >
              <FiX />
            </button>
          </div>
        )}

        <section className="device-settings-panel__section">
          <div className="device-settings-panel__section-heading">
            <div>
              <FiVideo />

              <div>
                <h3>
                  Camera preview
                </h3>

                <span>
                  {cameraLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="device-settings-panel__preview">
            {cameraEnabled &&
            localStream ? (
              <video
                ref={videoRef}
                muted
                autoPlay
                playsInline
              />
            ) : (
              <div className="device-settings-panel__preview-empty">
                <FiCamera />

                <strong>
                  Camera is off
                </strong>

                <span>
                  Turn on your
                  camera to preview
                  your video.
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="device-settings-panel__section">
          <div className="device-settings-panel__section-heading">
            <div>
              <FiMic />

              <div>
                <h3>
                  Audio
                </h3>

                <span>
                  Select your input
                  and output devices.
                </span>
              </div>
            </div>
          </div>

          <div className="device-settings-panel__fields">
            <DeviceSelect
              icon={FiMic}
              label="Microphone"
              value={
                microphoneId
              }
              devices={
                normalizedMicrophones
              }
              disabled={
                loading ||
                applying ||
                !microphoneSupported
              }
              placeholder={
                microphoneSupported
                  ? "Default microphone"
                  : "Microphone unavailable"
              }
              onChange={
                handleMicrophoneChange
              }
            />

            <div className="device-settings-panel__microphone-test">
              <div>
                <span>
                  Microphone level
                </span>

                <small>
                  {microphoneEnabled
                    ? "Speak to test your microphone"
                    : "Microphone is muted"}
                </small>
              </div>

              <AudioLevelMeter
                level={
                  microphoneLevel
                }
                active={
                  microphoneEnabled
                }
              />
            </div>

            <DeviceSelect
              icon={FiVolume2}
              label="Speaker"
              value={speakerId}
              devices={
                normalizedSpeakers
              }
              disabled={
                loading ||
                applying ||
                !speakerSelectionSupported
              }
              placeholder={
                speakerSelectionSupported
                  ? "Default speaker"
                  : "Browser default speaker"
              }
              onChange={
                handleSpeakerChange
              }
            />

            {!speakerSelectionSupported && (
              <p className="device-settings-panel__support-note">
                Your browser does
                not support changing
                the speaker from this
                panel. The system
                default will be used.
              </p>
            )}
          </div>
        </section>

        <section className="device-settings-panel__section">
          <div className="device-settings-panel__section-heading">
            <div>
              <FiCamera />

              <div>
                <h3>
                  Video
                </h3>

                <span>
                  Select the camera
                  used in the meeting.
                </span>
              </div>
            </div>
          </div>

          <div className="device-settings-panel__fields">
            <DeviceSelect
              icon={FiCamera}
              label="Camera"
              value={cameraId}
              devices={
                normalizedCameras
              }
              disabled={
                loading ||
                applying ||
                !cameraSupported
              }
              placeholder={
                cameraSupported
                  ? "Default camera"
                  : "Camera unavailable"
              }
              onChange={
                handleCameraChange
              }
            />
          </div>
        </section>

        <button
          type="button"
          className="device-settings-panel__refresh-button"
          onClick={
            handleRefresh
          }
          disabled={
            refreshing ||
            applying
          }
        >
          <FiRefreshCw
            className={
              refreshing
                ? "device-settings-panel__spin"
                : ""
            }
          />

          <span>
            {refreshing
              ? "Refreshing devices..."
              : "Refresh device list"}
          </span>
        </button>
      </div>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer className="device-settings-panel__footer">
        <button
          type="button"
          className="device-settings-panel__cancel-button"
          onClick={onClose}
          disabled={applying}
        >
          Cancel
        </button>

        <button
          type="button"
          className="device-settings-panel__apply-button"
          onClick={
            handleApply
          }
          disabled={
            applying ||
            loading
          }
        >
          <FiCheck />

          <span>
            {applying
              ? "Applying..."
              : hasChanges
                ? "Apply changes"
                : "Done"}
          </span>
        </button>
      </footer>
    </aside>
  );
};

export {
  AudioLevelMeter,
  DeviceSelect,
  getDeviceTypeLabel,
  normalizeDevices,
};

export default DeviceSettingsPanel;