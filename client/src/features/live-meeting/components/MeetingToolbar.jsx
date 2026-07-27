import { useMemo } from "react";

import {
  FiChevronUp,
  FiMessageSquare,
  FiMic,
  FiMicOff,
  FiMonitor,
  FiPhoneOff,
  FiSettings,
  FiUsers,
  FiVideo,
  FiVideoOff,
} from "react-icons/fi";

import "./MeetingToolbar.css";

/* ==========================================================
   TOOLBAR BUTTON
========================================================== */

const ToolbarButton = ({
  icon,
  label,
  badge = null,

  active = false,
  danger = false,
  disabledState = false,

  disabled = false,
  title = "",

  onClick,

  className = "",
}) => {
  const buttonClassName = [
    "meeting-toolbar__button",

    active
      ? "meeting-toolbar__button--active"
      : "",

    danger
      ? "meeting-toolbar__button--danger"
      : "",

    disabledState
      ? "meeting-toolbar__button--media-off"
      : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      aria-label={label}
    >
      <span className="meeting-toolbar__button-icon">
        {icon}
      </span>

      <span className="meeting-toolbar__button-label">
        {label}
      </span>

      {badge !== null &&
        badge !== undefined && (
          <span className="meeting-toolbar__button-badge">
            {badge}
          </span>
        )}
    </button>
  );
};

/* ==========================================================
   MEETING TOOLBAR
========================================================== */

const MeetingToolbar = ({
  microphoneEnabled = false,
  cameraEnabled = false,
  screenSharing = false,
  raisedHand = false,

  participantCount = 0,
  unreadChatCount = 0,

  connected = true,

  microphoneBusy = false,
  cameraBusy = false,
  screenShareBusy = false,
  raisedHandBusy = false,
  leaving = false,

  microphoneAllowed = true,
  cameraAllowed = true,
  screenShareAllowed = true,
  chatAllowed = true,

  deviceMenuOpen = false,

  compact = false,
  controlsVisible = true,

  onToggleMicrophone,
  onToggleCamera,
  onToggleScreenShare,
  onToggleRaisedHand,

  onToggleDeviceMenu,
  onOpenParticipants,
  onOpenChat,
  onOpenMore,
  onLeave,

  className = "",
}) => {
  const microphoneDisabled =
    !connected ||
    !microphoneAllowed ||
    microphoneBusy ||
    leaving;

  const cameraDisabled =
    !connected ||
    !cameraAllowed ||
    cameraBusy ||
    leaving;

  const screenShareDisabled =
    !connected ||
    !screenShareAllowed ||
    screenShareBusy ||
    leaving;

  const raisedHandDisabled =
    !connected ||
    raisedHandBusy ||
    leaving;

  const rootClassName = [
    "meeting-toolbar",

    compact
      ? "meeting-toolbar--compact"
      : "",

    controlsVisible
      ? ""
      : "meeting-toolbar--hidden",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  const participantBadge =
    useMemo(
      () =>
        Math.max(
          0,
          Number(participantCount) || 0
        ),
      [participantCount]
    );

  const chatBadge =
    useMemo(
      () =>
        Math.max(
          0,
          Number(unreadChatCount) || 0
        ),
      [unreadChatCount]
    );

  return (
    <footer
      className={rootClassName}
      aria-label="Meeting controls"
    >
      {/* ====================================================
          LEFT CONTROLS
      ==================================================== */}

      <div className="meeting-toolbar__section meeting-toolbar__section--left">
        <div className="meeting-toolbar__split-control">
          <ToolbarButton
            icon={
              microphoneEnabled ? (
                <FiMic />
              ) : (
                <FiMicOff />
              )
            }
            label={
              microphoneEnabled
                ? "Mute"
                : "Unmute"
            }
            disabledState={
              !microphoneEnabled
            }
            disabled={
              microphoneDisabled
            }
            onClick={
              onToggleMicrophone
            }
            title={
              microphoneAllowed
                ? microphoneEnabled
                  ? "Mute microphone"
                  : "Unmute microphone"
                : "Microphone use is disabled"
            }
            className="meeting-toolbar__button--split-main"
          />

          <button
            type="button"
            className={[
              "meeting-toolbar__device-arrow",

              deviceMenuOpen
                ? "meeting-toolbar__device-arrow--active"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={
              onToggleDeviceMenu
            }
            disabled={
              leaving
            }
            title="Audio and video devices"
            aria-label="Open audio and video devices"
            aria-expanded={
              deviceMenuOpen
            }
          >
            <FiChevronUp />
          </button>
        </div>

        <ToolbarButton
          icon={
            cameraEnabled ? (
              <FiVideo />
            ) : (
              <FiVideoOff />
            )
          }
          label={
            cameraEnabled
              ? "Stop video"
              : "Start video"
          }
          disabledState={
            !cameraEnabled
          }
          disabled={
            cameraDisabled
          }
          onClick={
            onToggleCamera
          }
          title={
            cameraAllowed
              ? cameraEnabled
                ? "Turn camera off"
                : "Turn camera on"
              : "Camera use is disabled"
          }
        />
      </div>

      {/* ====================================================
          CENTRE CONTROLS
      ==================================================== */}

      <div className="meeting-toolbar__section meeting-toolbar__section--centre">
        <ToolbarButton
          icon={<FiMonitor />}
          label={
            screenSharing
              ? "Stop sharing"
              : "Share screen"
          }
          active={
            screenSharing
          }
          disabled={
            screenShareDisabled
          }
          onClick={
            onToggleScreenShare
          }
          title={
            screenShareAllowed
              ? screenSharing
                ? "Stop sharing your screen"
                : "Share your screen"
              : "Screen sharing is disabled"
          }
        />

        <ToolbarButton
          icon={
            <span
              className="meeting-toolbar__hand-icon"
              aria-hidden="true"
            >
              ✋
            </span>
          }
          label={
            raisedHand
              ? "Lower hand"
              : "Raise hand"
          }
          active={
            raisedHand
          }
          disabled={
            raisedHandDisabled
          }
          onClick={
            onToggleRaisedHand
          }
        />

        <ToolbarButton
          icon={<FiUsers />}
          label="Participants"
          badge={
            participantBadge
          }
          disabled={
            leaving
          }
          onClick={
            onOpenParticipants
          }
        />

        <ToolbarButton
          icon={<FiMessageSquare />}
          label="Chat"
          badge={
            chatBadge > 0
              ? chatBadge
              : null
          }
          disabled={
            !chatAllowed ||
            leaving
          }
          onClick={
            onOpenChat
          }
          title={
            chatAllowed
              ? "Open meeting chat"
              : "Meeting chat is disabled"
          }
        />

        <ToolbarButton
          icon={<FiSettings />}
          label="More"
          disabled={
            leaving
          }
          onClick={
            onOpenMore
          }
        />
      </div>

      {/* ====================================================
          LEAVE CONTROL
      ==================================================== */}

      <div className="meeting-toolbar__section meeting-toolbar__section--right">
        <button
          type="button"
          className="meeting-toolbar__leave-button"
          onClick={onLeave}
          disabled={leaving}
        >
          <FiPhoneOff />

          <span>
            {leaving
              ? "Leaving..."
              : "Leave meeting"}
          </span>
        </button>
      </div>
    </footer>
  );
};

export {
  ToolbarButton,
};

export default MeetingToolbar;