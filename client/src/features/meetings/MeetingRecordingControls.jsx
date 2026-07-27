import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiFile,
  FiLink,
  FiPlay,
  FiRefreshCw,
  FiSave,
  FiStopCircle,
  FiVideo,
} from "react-icons/fi";

import {
  completeMeetingRecording,
  startMeetingRecording,
  stopMeetingRecording,
} from "../../services/meeting.service";

import "./MeetingRecordingControls.css";

const EMPTY_COMPLETION_FORM = {
  recordingUrl: "",
  fileUrl: "",
  durationSeconds: "",
  fileSize: "",
  fileName: "",
  provider: "",
  notes: "",
};

const getRecordingStatus = (
  recording
) => {
  const status = String(
    recording?.status ||
      recording?.recordingStatus ||
      "not_started"
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const allowedStatuses = [
    "not_started",
    "recording",
    "processing",
    "completed",
    "failed",
    "stopped",
  ];

  return allowedStatuses.includes(status)
    ? status
    : "not_started";
};

const formatLabel = (value) => {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  }).format(date);
};

const formatDuration = (
  seconds
) => {
  const totalSeconds =
    Number(seconds) || 0;

  if (totalSeconds <= 0) {
    return "Not available";
  }

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const remainingSeconds =
    totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
};

const formatFileSize = (
  value
) => {
  const bytes = Number(value);

  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "Not available";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  let size = bytes;
  let unitIndex = 0;

  while (
    size >= 1024 &&
    unitIndex < units.length - 1
  ) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(
    unitIndex === 0 ? 0 : 1
  )} ${units[unitIndex]}`;
};

const isHttpUrl = (value) => {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return [
      "http:",
      "https:",
    ].includes(url.protocol);
  } catch {
    return false;
  }
};

const MeetingRecordingControls = ({
  meetingId,
  meetingStatus = "",
  recording = null,
  canManage = false,
  onMeetingRefresh,
}) => {
  const [
    localRecording,
    setLocalRecording,
  ] = useState(recording || {});

  const [
    completionForm,
    setCompletionForm,
  ] = useState(
    EMPTY_COMPLETION_FORM
  );

  const [
    showCompletionForm,
    setShowCompletionForm,
  ] = useState(false);

  const [starting, setStarting] =
    useState(false);

  const [stopping, setStopping] =
    useState(false);

  const [completing, setCompleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    setLocalRecording(
      recording || {}
    );
  }, [recording]);

  const recordingStatus =
    getRecordingStatus(
      localRecording
    );

  const recordingUrl =
    localRecording?.recordingUrl ||
    localRecording?.url ||
    localRecording?.fileUrl ||
    "";

  const durationSeconds =
    localRecording?.durationSeconds ||
    localRecording?.duration ||
    0;

  const fileSize =
    localRecording?.fileSize ||
    localRecording?.size ||
    0;

  const canStart = useMemo(() => {
    return (
      canManage &&
      meetingStatus === "live" &&
      [
        "not_started",
        "stopped",
        "failed",
      ].includes(recordingStatus)
    );
  }, [
    canManage,
    meetingStatus,
    recordingStatus,
  ]);

  const canStop = useMemo(() => {
    return (
      canManage &&
      recordingStatus === "recording"
    );
  }, [
    canManage,
    recordingStatus,
  ]);

  const canComplete = useMemo(() => {
    return (
      canManage &&
      [
        "stopped",
        "processing",
        "failed",
      ].includes(recordingStatus)
    );
  }, [
    canManage,
    recordingStatus,
  ]);

  const handleCompletionChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setCompletionForm(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      })
    );
  };

  const refreshMeeting = async () => {
    if (onMeetingRefresh) {
      await onMeetingRefresh();
    }
  };

  const handleStartRecording =
    async () => {
      if (!canStart) {
        setError(
          meetingStatus !== "live"
            ? "The meeting must be live before recording can start."
            : "You do not have permission to start this recording."
        );

        return;
      }

      const confirmed =
        window.confirm(
          "Start recording this meeting? Ensure participants have been informed and consent requirements have been met."
        );

      if (!confirmed) {
        return;
      }

      try {
        setStarting(true);
        setError("");
        setSuccessMessage("");

        const response =
          await startMeetingRecording(
            meetingId
          );

        const updatedRecording =
          response?.data?.recording ||
          response?.recording ||
          response?.data ||
          null;

        setLocalRecording(
          (currentRecording) => ({
            ...currentRecording,
            ...(updatedRecording &&
            typeof updatedRecording ===
              "object"
              ? updatedRecording
              : {}),
            status: "recording",
            startedAt:
              updatedRecording?.startedAt ||
              new Date().toISOString(),
          })
        );

        setSuccessMessage(
          "Meeting recording started successfully."
        );

        await refreshMeeting();
      } catch (requestError) {
        setError(
          requestError?.response?.data
            ?.message ||
            "Unable to start the meeting recording."
        );
      } finally {
        setStarting(false);
      }
    };

  const handleStopRecording =
    async () => {
      const confirmed =
        window.confirm(
          "Stop the current meeting recording?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setStopping(true);
        setError("");
        setSuccessMessage("");

        const response =
          await stopMeetingRecording(
            meetingId
          );

        const updatedRecording =
          response?.data?.recording ||
          response?.recording ||
          response?.data ||
          null;

        setLocalRecording(
          (currentRecording) => ({
            ...currentRecording,
            ...(updatedRecording &&
            typeof updatedRecording ===
              "object"
              ? updatedRecording
              : {}),
            status:
              updatedRecording?.status ||
              "stopped",
            stoppedAt:
              updatedRecording?.stoppedAt ||
              new Date().toISOString(),
          })
        );

        setSuccessMessage(
          "Meeting recording stopped successfully."
        );

        setShowCompletionForm(true);

        await refreshMeeting();
      } catch (requestError) {
        setError(
          requestError?.response?.data
            ?.message ||
            "Unable to stop the meeting recording."
        );
      } finally {
        setStopping(false);
      }
    };

  const handleCompleteRecording =
    async (event) => {
      event.preventDefault();

      const recordingUrlValue =
        completionForm.recordingUrl.trim();

      const fileUrlValue =
        completionForm.fileUrl.trim();

      if (
        !recordingUrlValue &&
        !fileUrlValue
      ) {
        setError(
          "Provide either a recording URL or a file URL."
        );

        return;
      }

      if (
        !isHttpUrl(recordingUrlValue) ||
        !isHttpUrl(fileUrlValue)
      ) {
        setError(
          "Recording links must be valid HTTP or HTTPS URLs."
        );

        return;
      }

      const parsedDuration =
        completionForm.durationSeconds
          ? Number(
              completionForm.durationSeconds
            )
          : undefined;

      const parsedFileSize =
        completionForm.fileSize
          ? Number(
              completionForm.fileSize
            )
          : undefined;

      if (
        parsedDuration !== undefined &&
        (
          !Number.isFinite(
            parsedDuration
          ) ||
          parsedDuration < 0
        )
      ) {
        setError(
          "Recording duration must be a valid positive number."
        );

        return;
      }

      if (
        parsedFileSize !== undefined &&
        (
          !Number.isFinite(
            parsedFileSize
          ) ||
          parsedFileSize < 0
        )
      ) {
        setError(
          "File size must be a valid positive number."
        );

        return;
      }

      try {
        setCompleting(true);
        setError("");
        setSuccessMessage("");

        const recordingData = {
          recordingUrl:
            recordingUrlValue ||
            undefined,

          fileUrl:
            fileUrlValue ||
            undefined,

          durationSeconds:
            parsedDuration,

          fileSize:
            parsedFileSize,

          fileName:
            completionForm.fileName.trim() ||
            undefined,

          provider:
            completionForm.provider.trim() ||
            undefined,

          notes:
            completionForm.notes.trim() ||
            undefined,
        };

        const response =
          await completeMeetingRecording(
            meetingId,
            recordingData
          );

        const completedRecording =
          response?.data?.recording ||
          response?.recording ||
          response?.data ||
          recordingData;

        setLocalRecording(
          (currentRecording) => ({
            ...currentRecording,
            ...completedRecording,
            status: "completed",
            completedAt:
              completedRecording
                ?.completedAt ||
              new Date().toISOString(),
          })
        );

        setCompletionForm(
          EMPTY_COMPLETION_FORM
        );

        setShowCompletionForm(false);

        setSuccessMessage(
          "Meeting recording completed successfully."
        );

        await refreshMeeting();
      } catch (requestError) {
        setError(
          requestError?.response?.data
            ?.message ||
            "Unable to complete the meeting recording."
        );
      } finally {
        setCompleting(false);
      }
    };

  const resetCompletionForm = () => {
    setCompletionForm(
      EMPTY_COMPLETION_FORM
    );

    setError("");
  };

  return (
    <section className="meeting-recording-controls">
      <div className="meeting-recording-controls__header">
        <div>
          <span className="meeting-recording-controls__eyebrow">
            Meeting media
          </span>

          <h2>
            <FiVideo />
            Recording Controls
          </h2>

          <p>
            Start, stop and complete the official
            meeting recording.
          </p>
        </div>

        <span
          className={`meeting-recording-controls__status meeting-recording-controls__status--${recordingStatus}`}
        >
          {recordingStatus ===
          "recording" ? (
            <span className="meeting-recording-controls__pulse" />
          ) : recordingStatus ===
            "completed" ? (
            <FiCheckCircle />
          ) : (
            <FiClock />
          )}

          {formatLabel(
            recordingStatus
          )}
        </span>
      </div>

      {error && (
        <div className="meeting-recording-controls__alert meeting-recording-controls__alert--error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="meeting-recording-controls__alert meeting-recording-controls__alert--success">
          {successMessage}
        </div>
      )}

      {!canManage && (
        <div className="meeting-recording-controls__notice">
          <FiAlertTriangle />

          <div>
            <strong>
              View-only access
            </strong>

            <span>
              Only authorized meeting managers can
              operate recording controls.
            </span>
          </div>
        </div>
      )}

      <div className="meeting-recording-controls__summary">
        <article>
          <span>
            <FiClock />
          </span>

          <div>
            <small>Started</small>

            <strong>
              {formatDateTime(
                localRecording?.startedAt
              )}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <FiStopCircle />
          </span>

          <div>
            <small>Stopped</small>

            <strong>
              {formatDateTime(
                localRecording?.stoppedAt
              )}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <FiVideo />
          </span>

          <div>
            <small>Duration</small>

            <strong>
              {formatDuration(
                durationSeconds
              )}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <FiFile />
          </span>

          <div>
            <small>File size</small>

            <strong>
              {formatFileSize(
                fileSize
              )}
            </strong>
          </div>
        </article>
      </div>

      <section className="meeting-recording-controls__control-panel">
        <div className="meeting-recording-controls__visual">
          <div
            className={`meeting-recording-controls__recording-icon meeting-recording-controls__recording-icon--${recordingStatus}`}
          >
            <FiVideo />
          </div>

          <div>
            <h3>
              {recordingStatus ===
              "recording"
                ? "Recording in progress"
                : recordingStatus ===
                    "completed"
                  ? "Recording completed"
                  : "Recording ready"}
            </h3>

            <p>
              {recordingStatus ===
              "recording"
                ? "The meeting is currently being recorded."
                : recordingStatus ===
                    "completed"
                  ? "The recording has been processed and saved."
                  : meetingStatus ===
                      "live"
                    ? "You may start recording this live meeting."
                    : "The meeting must be live before recording can begin."}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="meeting-recording-controls__actions">
            {recordingStatus !==
              "recording" &&
              recordingStatus !==
                "completed" && (
                <button
                  type="button"
                  className="meeting-recording-controls__start-button"
                  onClick={
                    handleStartRecording
                  }
                  disabled={
                    starting ||
                    !canStart
                  }
                >
                  <FiPlay />

                  {starting
                    ? "Starting..."
                    : "Start recording"}
                </button>
              )}

            {recordingStatus ===
              "recording" && (
              <button
                type="button"
                className="meeting-recording-controls__stop-button"
                onClick={
                  handleStopRecording
                }
                disabled={
                  stopping ||
                  !canStop
                }
              >
                <FiStopCircle />

                {stopping
                  ? "Stopping..."
                  : "Stop recording"}
              </button>
            )}

            {canComplete &&
              !showCompletionForm && (
                <button
                  type="button"
                  className="meeting-recording-controls__complete-button"
                  onClick={() =>
                    setShowCompletionForm(
                      true
                    )
                  }
                >
                  <FiCheckCircle />
                  Complete recording
                </button>
              )}
          </div>
        )}
      </section>

      {recordingStatus ===
        "recording" && (
        <div className="meeting-recording-controls__active-banner">
          <span className="meeting-recording-controls__active-indicator" />

          <div>
            <strong>
              Recording is active
            </strong>

            <p>
              Ensure participants remain aware that
              the meeting is being recorded.
            </p>
          </div>
        </div>
      )}

      {showCompletionForm &&
        canManage && (
          <form
            className="meeting-recording-controls__completion-form"
            onSubmit={
              handleCompleteRecording
            }
          >
            <div className="meeting-recording-controls__form-header">
              <div>
                <h3>
                  Complete meeting recording
                </h3>

                <p>
                  Add the processed recording
                  details and final access link.
                </p>
              </div>
            </div>

            <div className="meeting-recording-controls__form-grid">
              <label className="meeting-recording-controls__full-width">
                <span>
                  Recording URL
                  <small>
                    Provide this or a file URL
                  </small>
                </span>

                <div className="meeting-recording-controls__input-icon">
                  <FiLink />

                  <input
                    type="url"
                    name="recordingUrl"
                    value={
                      completionForm.recordingUrl
                    }
                    onChange={
                      handleCompletionChange
                    }
                    placeholder="https://example.com/recording"
                  />
                </div>
              </label>

              <label className="meeting-recording-controls__full-width">
                <span>
                  Direct file URL
                  <small>Optional</small>
                </span>

                <div className="meeting-recording-controls__input-icon">
                  <FiFile />

                  <input
                    type="url"
                    name="fileUrl"
                    value={
                      completionForm.fileUrl
                    }
                    onChange={
                      handleCompletionChange
                    }
                    placeholder="https://example.com/meeting-recording.mp4"
                  />
                </div>
              </label>

              <label>
                <span>
                  File name
                  <small>Optional</small>
                </span>

                <input
                  type="text"
                  name="fileName"
                  value={
                    completionForm.fileName
                  }
                  onChange={
                    handleCompletionChange
                  }
                  placeholder="meeting-recording.mp4"
                />
              </label>

              <label>
                <span>
                  Recording provider
                  <small>Optional</small>
                </span>

                <input
                  type="text"
                  name="provider"
                  value={
                    completionForm.provider
                  }
                  onChange={
                    handleCompletionChange
                  }
                  placeholder="JVP Connect, Zoom or Jitsi"
                />
              </label>

              <label>
                <span>
                  Duration in seconds
                  <small>Optional</small>
                </span>

                <input
                  type="number"
                  name="durationSeconds"
                  value={
                    completionForm.durationSeconds
                  }
                  onChange={
                    handleCompletionChange
                  }
                  min="0"
                  placeholder="3600"
                />
              </label>

              <label>
                <span>
                  File size in bytes
                  <small>Optional</small>
                </span>

                <input
                  type="number"
                  name="fileSize"
                  value={
                    completionForm.fileSize
                  }
                  onChange={
                    handleCompletionChange
                  }
                  min="0"
                  placeholder="104857600"
                />
              </label>

              <label className="meeting-recording-controls__full-width">
                <span>
                  Notes
                  <small>Optional</small>
                </span>

                <textarea
                  name="notes"
                  value={
                    completionForm.notes
                  }
                  onChange={
                    handleCompletionChange
                  }
                  rows={4}
                  placeholder="Add processing notes, access instructions or other recording details."
                />
              </label>
            </div>

            <div className="meeting-recording-controls__form-footer">
              <button
                type="button"
                className="meeting-recording-controls__reset-button"
                onClick={
                  resetCompletionForm
                }
                disabled={completing}
              >
                <FiRefreshCw />
                Reset
              </button>

              <button
                type="button"
                className="meeting-recording-controls__cancel-button"
                onClick={() =>
                  setShowCompletionForm(
                    false
                  )
                }
                disabled={completing}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="meeting-recording-controls__save-button"
                disabled={completing}
              >
                <FiSave />

                {completing
                  ? "Completing..."
                  : "Save completed recording"}
              </button>
            </div>
          </form>
        )}

      {recordingStatus ===
        "completed" && (
        <section className="meeting-recording-controls__completed-card">
          <div className="meeting-recording-controls__completed-header">
            <div>
              <FiCheckCircle />

              <div>
                <h3>
                  Recording available
                </h3>

                <p>
                  The final meeting recording has
                  been processed.
                </p>
              </div>
            </div>

            {recordingUrl && (
              <a
                href={recordingUrl}
                target="_blank"
                rel="noreferrer"
              >
                <FiExternalLink />
                Open recording
              </a>
            )}
          </div>

          <div className="meeting-recording-controls__completed-details">
            <div>
              <span>Completed</span>

              <strong>
                {formatDateTime(
                  localRecording
                    ?.completedAt
                )}
              </strong>
            </div>

            <div>
              <span>Provider</span>

              <strong>
                {localRecording?.provider ||
                  "Not specified"}
              </strong>
            </div>

            <div>
              <span>File name</span>

              <strong>
                {localRecording?.fileName ||
                  "Not specified"}
              </strong>
            </div>

            <div>
              <span>Duration</span>

              <strong>
                {formatDuration(
                  durationSeconds
                )}
              </strong>
            </div>
          </div>

          {localRecording?.notes && (
            <div className="meeting-recording-controls__completed-notes">
              <strong>Recording notes</strong>

              <p>
                {localRecording.notes}
              </p>
            </div>
          )}
        </section>
      )}
    </section>
  );
};

export default MeetingRecordingControls;