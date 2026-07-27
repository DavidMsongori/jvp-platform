import {
  useMemo,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiCheck,
  FiLock,
  FiMicOff,
  FiMonitor,
  FiShield,
  FiUserCheck,
  FiUsers,
  FiVideoOff,
  FiX,
} from "react-icons/fi";

import "./HostControlsPanel.css";

/* ==========================================================
   TOGGLE CONTROL
========================================================== */

const HostControlToggle = ({
  icon: Icon,
  title,
  description,

  enabled = false,
  disabled = false,
  busy = false,

  onChange,
}) => {
  return (
    <div className="host-controls-panel__control">
      <div className="host-controls-panel__control-icon">
        {Icon && <Icon />}
      </div>

      <div className="host-controls-panel__control-content">
        <strong>{title}</strong>

        {description && (
          <span>{description}</span>
        )}
      </div>

      <button
        type="button"
        className={[
          "host-controls-panel__switch",

          enabled
            ? "host-controls-panel__switch--enabled"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() =>
          onChange?.(!enabled)
        }
        disabled={
          disabled ||
          busy
        }
        aria-pressed={enabled}
        aria-label={`${title}: ${
          enabled
            ? "enabled"
            : "disabled"
        }`}
      >
        <span />

        {busy && (
          <small>
            Updating
          </small>
        )}
      </button>
    </div>
  );
};

/* ==========================================================
   ACTION CONTROL
========================================================== */

const HostControlAction = ({
  icon: Icon,
  title,
  description,

  variant = "default",

  disabled = false,
  busy = false,

  onClick,
}) => {
  return (
    <button
      type="button"
      className={[
        "host-controls-panel__action",
        `host-controls-panel__action--${variant}`,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      disabled={
        disabled ||
        busy
      }
    >
      <span className="host-controls-panel__action-icon">
        {Icon && <Icon />}
      </span>

      <span className="host-controls-panel__action-content">
        <strong>{title}</strong>

        {description && (
          <small>
            {description}
          </small>
        )}
      </span>

      {busy ? (
        <span className="host-controls-panel__spinner" />
      ) : (
        <span className="host-controls-panel__action-arrow">
          ›
        </span>
      )}
    </button>
  );
};

/* ==========================================================
   CONFIRMATION MODAL
========================================================== */

const HostControlConfirmation = ({
  isOpen = false,

  title,
  message,

  confirmLabel = "Confirm",
  cancelLabel = "Cancel",

  danger = false,
  busy = false,

  onConfirm,
  onCancel,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="host-controls-panel__confirmation-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel?.();
        }
      }}
    >
      <section
        className="host-controls-panel__confirmation"
        role="dialog"
        aria-modal="true"
        aria-labelledby="host-control-confirmation-title"
      >
        <div className="host-controls-panel__confirmation-icon">
          <FiAlertTriangle />
        </div>

        <h3 id="host-control-confirmation-title">
          {title}
        </h3>

        <p>{message}</p>

        <div className="host-controls-panel__confirmation-actions">
          <button
            type="button"
            className="host-controls-panel__confirmation-cancel"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={[
              "host-controls-panel__confirmation-confirm",

              danger
                ? "host-controls-panel__confirmation-confirm--danger"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy
              ? "Please wait..."
              : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

const HostControlsPanel = ({
  isOpen = true,

  participantCount = 0,
  waitingParticipantCount = 0,

  meetingLocked = false,
  waitingRoomEnabled = true,

  participantUnmuteAllowed = true,
  participantVideoAllowed = true,
  participantScreenShareAllowed = true,
  participantChatAllowed = true,

  canManage = false,

  busyAction = "",
  error = null,

  className = "",

  onClose,

  onToggleMeetingLock,
  onToggleWaitingRoom,

  onToggleParticipantUnmute,
  onToggleParticipantVideo,
  onToggleParticipantScreenShare,
  onToggleParticipantChat,

  onMuteAll,
  onStopAllVideos,
  onOpenWaitingRoom,
  onEndMeeting,
}) => {
  const [
    confirmationType,
    setConfirmationType,
  ] = useState("");

  const confirmationContent =
    useMemo(() => {
      if (
        confirmationType ===
        "mute-all"
      ) {
        return {
          title:
            "Mute all participants?",
          message:
            "This will turn off the microphones of everyone currently in the meeting, except the host.",
          confirmLabel:
            "Mute everyone",
          danger: false,
        };
      }

      if (
        confirmationType ===
        "stop-videos"
      ) {
        return {
          title:
            "Stop all participant videos?",
          message:
            "This will turn off every participant camera currently active in the meeting.",
          confirmLabel:
            "Stop all videos",
          danger: false,
        };
      }

      if (
        confirmationType ===
        "end-meeting"
      ) {
        return {
          title:
            "End meeting for everyone?",
          message:
            "All participants will be disconnected and the meeting will be marked as ended.",
          confirmLabel:
            "End meeting",
          danger: true,
        };
      }

      return null;
    }, [confirmationType]);

  const handleConfirmAction =
    async () => {
      if (
        confirmationType ===
        "mute-all"
      ) {
        await onMuteAll?.();
      }

      if (
        confirmationType ===
        "stop-videos"
      ) {
        await onStopAllVideos?.();
      }

      if (
        confirmationType ===
        "end-meeting"
      ) {
        await onEndMeeting?.();
      }

      setConfirmationType("");
    };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <aside
        className={[
          "host-controls-panel",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Host controls"
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="host-controls-panel__header">
          <div className="host-controls-panel__header-icon">
            <FiShield />
          </div>

          <div className="host-controls-panel__header-content">
            <div>
              <h2>
                Host controls
              </h2>

              <span className="host-controls-panel__host-badge">
                Host
              </span>
            </div>

            <p>
              Manage participant
              permissions and meeting
              security.
            </p>
          </div>

          <button
            type="button"
            className="host-controls-panel__close"
            onClick={onClose}
            aria-label="Close host controls"
          >
            <FiX />
          </button>
        </header>

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <div className="host-controls-panel__summary">
          <div>
            <span className="host-controls-panel__summary-icon">
              <FiUsers />
            </span>

            <span>
              <strong>
                {participantCount}
              </strong>

              Participants
            </span>
          </div>

          <button
            type="button"
            onClick={
              onOpenWaitingRoom
            }
            disabled={
              !canManage
            }
          >
            <span className="host-controls-panel__summary-icon host-controls-panel__summary-icon--waiting">
              <FiUserCheck />
            </span>

            <span>
              <strong>
                {
                  waitingParticipantCount
                }
              </strong>

              Waiting
            </span>
          </button>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div
            className="host-controls-panel__error"
            role="alert"
          >
            <FiAlertTriangle />

            <span>
              {error?.message ||
                String(error)}
            </span>
          </div>
        )}

        <div className="host-controls-panel__content">
          {/* ==================================================
              SECURITY
          ================================================== */}

          <section className="host-controls-panel__section">
            <div className="host-controls-panel__section-heading">
              <span>
                Security
              </span>

              <small>
                Meeting access
              </small>
            </div>

            <HostControlToggle
              icon={FiLock}
              title="Lock meeting"
              description="Prevent new participants from joining."
              enabled={
                meetingLocked
              }
              disabled={
                !canManage
              }
              busy={
                busyAction ===
                "meeting-lock"
              }
              onChange={
                onToggleMeetingLock
              }
            />

            <HostControlToggle
              icon={FiUserCheck}
              title="Waiting room"
              description="Require participants to be admitted by a host."
              enabled={
                waitingRoomEnabled
              }
              disabled={
                !canManage
              }
              busy={
                busyAction ===
                "waiting-room"
              }
              onChange={
                onToggleWaitingRoom
              }
            />
          </section>

          {/* ==================================================
              PARTICIPANT PERMISSIONS
          ================================================== */}

          <section className="host-controls-panel__section">
            <div className="host-controls-panel__section-heading">
              <span>
                Participant permissions
              </span>

              <small>
                What participants can do
              </small>
            </div>

            <HostControlToggle
              icon={FiMicOff}
              title="Allow participants to unmute"
              description="Participants can turn their microphones back on."
              enabled={
                participantUnmuteAllowed
              }
              disabled={
                !canManage
              }
              busy={
                busyAction ===
                "participant-unmute"
              }
              onChange={
                onToggleParticipantUnmute
              }
            />

            <HostControlToggle
              icon={FiVideoOff}
              title="Allow participant video"
              description="Participants can turn their cameras on."
              enabled={
                participantVideoAllowed
              }
              disabled={
                !canManage
              }
              busy={
                busyAction ===
                "participant-video"
              }
              onChange={
                onToggleParticipantVideo
              }
            />

            <HostControlToggle
              icon={FiMonitor}
              title="Allow screen sharing"
              description="Participants can present their screens."
              enabled={
                participantScreenShareAllowed
              }
              disabled={
                !canManage
              }
              busy={
                busyAction ===
                "participant-screen-share"
              }
              onChange={
                onToggleParticipantScreenShare
              }
            />

            <HostControlToggle
              icon={FiCheck}
              title="Allow meeting chat"
              description="Participants can send messages in the meeting."
              enabled={
                participantChatAllowed
              }
              disabled={
                !canManage
              }
              busy={
                busyAction ===
                "participant-chat"
              }
              onChange={
                onToggleParticipantChat
              }
            />
          </section>

          {/* ==================================================
              IMMEDIATE ACTIONS
          ================================================== */}

          <section className="host-controls-panel__section">
            <div className="host-controls-panel__section-heading">
              <span>
                Meeting actions
              </span>

              <small>
                Apply to everyone
              </small>
            </div>

            <div className="host-controls-panel__actions">
              <HostControlAction
                icon={FiMicOff}
                title="Mute all participants"
                description="Turn off all participant microphones."
                disabled={
                  !canManage
                }
                busy={
                  busyAction ===
                  "mute-all"
                }
                onClick={() =>
                  setConfirmationType(
                    "mute-all"
                  )
                }
              />

              <HostControlAction
                icon={FiVideoOff}
                title="Stop all participant videos"
                description="Turn off all active participant cameras."
                disabled={
                  !canManage
                }
                busy={
                  busyAction ===
                  "stop-all-videos"
                }
                onClick={() =>
                  setConfirmationType(
                    "stop-videos"
                  )
                }
              />

              <HostControlAction
                icon={FiUserCheck}
                title="Open waiting room"
                description={`${waitingParticipantCount} participant${
                  waitingParticipantCount ===
                  1
                    ? ""
                    : "s"
                } waiting.`}
                disabled={
                  !canManage
                }
                onClick={
                  onOpenWaitingRoom
                }
              />
            </div>
          </section>

          {/* ==================================================
              DANGER ZONE
          ================================================== */}

          <section className="host-controls-panel__section host-controls-panel__section--danger">
            <div className="host-controls-panel__section-heading">
              <span>
                End meeting
              </span>

              <small>
                This affects everyone
              </small>
            </div>

            <HostControlAction
              icon={
                FiAlertTriangle
              }
              title="End meeting for everyone"
              description="Disconnect every participant and close the room."
              variant="danger"
              disabled={
                !canManage
              }
              busy={
                busyAction ===
                "end-meeting"
              }
              onClick={() =>
                setConfirmationType(
                  "end-meeting"
                )
              }
            />
          </section>
        </div>
      </aside>

      <HostControlConfirmation
        isOpen={Boolean(
          confirmationContent
        )}
        title={
          confirmationContent?.title
        }
        message={
          confirmationContent?.message
        }
        confirmLabel={
          confirmationContent
            ?.confirmLabel
        }
        danger={
          confirmationContent?.danger
        }
        busy={
          busyAction ===
            "mute-all" ||
          busyAction ===
            "stop-all-videos" ||
          busyAction ===
            "end-meeting"
        }
        onConfirm={
          handleConfirmAction
        }
        onCancel={() =>
          setConfirmationType("")
        }
      />
    </>
  );
};

export {
  HostControlToggle,
  HostControlAction,
  HostControlConfirmation,
};

export default HostControlsPanel;