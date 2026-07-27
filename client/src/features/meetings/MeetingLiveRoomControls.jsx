import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheck,
  FiLock,
  FiMessageSquare,
  FiMic,
  FiMonitor,
  FiRefreshCw,
  FiSettings,
  FiShield,
  FiUnlock,
  FiUsers,
  FiVideo,
} from "react-icons/fi";

import {
  updateLiveRoomSettings,
} from "../../services/meeting.service";

import "./MeetingLiveRoomControls.css";

const DEFAULT_SETTINGS = {
  roomEnabled: true,
  roomLocked: false,
  waitingRoomEnabled: true,
  autoAdmitParticipants: false,
  muteParticipantsOnEntry: true,
  participantsCanUseMicrophone: true,
  participantsCanUseCamera: true,
  participantsCanShareScreen: false,
  participantsCanChat: true,
};

const getBoolean = (
  value,
  fallback
) => {
  return typeof value === "boolean"
    ? value
    : fallback;
};

const normalizeLiveRoomSettings = (
  liveRoom
) => {
  const settings =
    liveRoom?.settings ||
    liveRoom ||
    {};

  return {
    roomEnabled: getBoolean(
      settings.roomEnabled ??
        settings.enabled,
      DEFAULT_SETTINGS.roomEnabled
    ),

    roomLocked: getBoolean(
      settings.roomLocked ??
        settings.locked,
      DEFAULT_SETTINGS.roomLocked
    ),

    waitingRoomEnabled: getBoolean(
      settings.waitingRoomEnabled ??
        settings.waitingRoom,
      DEFAULT_SETTINGS
        .waitingRoomEnabled
    ),

    autoAdmitParticipants: getBoolean(
      settings.autoAdmitParticipants ??
        settings.autoAdmit,
      DEFAULT_SETTINGS
        .autoAdmitParticipants
    ),

    muteParticipantsOnEntry: getBoolean(
      settings.muteParticipantsOnEntry ??
        settings.muteOnEntry,
      DEFAULT_SETTINGS
        .muteParticipantsOnEntry
    ),

    participantsCanUseMicrophone:
      getBoolean(
        settings
          .participantsCanUseMicrophone ??
          settings.allowMicrophone,
        DEFAULT_SETTINGS
          .participantsCanUseMicrophone
      ),

    participantsCanUseCamera:
      getBoolean(
        settings
          .participantsCanUseCamera ??
          settings.allowCamera,
        DEFAULT_SETTINGS
          .participantsCanUseCamera
      ),

    participantsCanShareScreen:
      getBoolean(
        settings
          .participantsCanShareScreen ??
          settings.allowScreenShare,
        DEFAULT_SETTINGS
          .participantsCanShareScreen
      ),

    participantsCanChat: getBoolean(
      settings.participantsCanChat ??
        settings.allowChat,
      DEFAULT_SETTINGS
        .participantsCanChat
    ),
  };
};

const SETTING_GROUPS = [
  {
    title: "Room access",
    description:
      "Control whether participants can enter the live meeting room.",
    settings: [
      {
        name: "roomEnabled",
        label: "Enable live room",
        description:
          "Allow participants to access the live meeting room.",
        icon: FiVideo,
      },
      {
        name: "roomLocked",
        label: "Lock room",
        description:
          "Prevent additional participants from joining the room.",
        icon: FiLock,
      },
      {
        name: "waitingRoomEnabled",
        label: "Enable waiting room",
        description:
          "Hold participants until a host admits them.",
        icon: FiUsers,
      },
      {
        name: "autoAdmitParticipants",
        label: "Auto-admit participants",
        description:
          "Allow participants to enter without approval.",
        icon: FiUnlock,
      },
    ],
  },
  {
    title: "Participant permissions",
    description:
      "Choose the features participants may use during the meeting.",
    settings: [
      {
        name: "participantsCanUseMicrophone",
        label: "Allow microphones",
        description:
          "Participants may unmute themselves.",
        icon: FiMic,
      },
      {
        name: "participantsCanUseCamera",
        label: "Allow cameras",
        description:
          "Participants may enable their cameras.",
        icon: FiVideo,
      },
      {
        name: "participantsCanShareScreen",
        label: "Allow screen sharing",
        description:
          "Participants may present their screens.",
        icon: FiMonitor,
      },
      {
        name: "participantsCanChat",
        label: "Allow room chat",
        description:
          "Participants may send messages in the live room.",
        icon: FiMessageSquare,
      },
    ],
  },
  {
    title: "Entry behaviour",
    description:
      "Set the default participant state when entering the room.",
    settings: [
      {
        name: "muteParticipantsOnEntry",
        label: "Mute participants on entry",
        description:
          "Participants enter with their microphones switched off.",
        icon: FiShield,
      },
    ],
  },
];

const MeetingLiveRoomControls = ({
  meetingId,
  liveRoom = null,
  canManage = false,
  onMeetingRefresh,
}) => {
  const initialSettings = useMemo(
    () =>
      normalizeLiveRoomSettings(
        liveRoom
      ),
    [liveRoom]
  );

  const [settings, setSettings] =
    useState(initialSettings);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const hasChanges = useMemo(() => {
    return Object.keys(
      DEFAULT_SETTINGS
    ).some(
      (key) =>
        settings[key] !==
        initialSettings[key]
    );
  }, [
    settings,
    initialSettings,
  ]);

  const enabledPermissions = useMemo(() => {
    return [
      settings
        .participantsCanUseMicrophone,
      settings
        .participantsCanUseCamera,
      settings
        .participantsCanShareScreen,
      settings.participantsCanChat,
    ].filter(Boolean).length;
  }, [settings]);

  const handleToggle = (
    settingName
  ) => {
    if (!canManage) {
      return;
    }

    setError("");
    setSuccessMessage("");

    setSettings(
      (currentSettings) => {
        const updatedSettings = {
          ...currentSettings,
          [settingName]:
            !currentSettings[
              settingName
            ],
        };

        if (
          settingName ===
            "roomEnabled" &&
          currentSettings.roomEnabled
        ) {
          updatedSettings.roomLocked =
            false;
        }

        if (
          settingName ===
            "waitingRoomEnabled" &&
          currentSettings
            .waitingRoomEnabled
        ) {
          updatedSettings
            .autoAdmitParticipants =
            false;
        }

        if (
          settingName ===
            "autoAdmitParticipants" &&
          !currentSettings
            .autoAdmitParticipants
        ) {
          updatedSettings
            .waitingRoomEnabled =
            true;
        }

        return updatedSettings;
      }
    );
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setError("");
    setSuccessMessage("");
  };

  const handleSave = async () => {
    if (!canManage) {
      setError(
        "You do not have permission to update live room settings."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateLiveRoomSettings(
        meetingId,
        settings
      );

      setSuccessMessage(
        "Live room controls updated successfully."
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data
          ?.message ||
          "Unable to update the live room controls."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="meeting-room-controls">
      <div className="meeting-room-controls__header">
        <div>
          <span className="meeting-room-controls__eyebrow">
            Meeting administration
          </span>

          <h2>
            <FiSettings />
            Live Room Controls
          </h2>

          <p>
            Manage room access, participant
            permissions and entry behaviour.
          </p>
        </div>

        <div className="meeting-room-controls__room-state">
          <span
            className={
              settings.roomEnabled
                ? "meeting-room-controls__room-state-dot meeting-room-controls__room-state-dot--active"
                : "meeting-room-controls__room-state-dot"
            }
          />

          <div>
            <small>Room status</small>

            <strong>
              {!settings.roomEnabled
                ? "Disabled"
                : settings.roomLocked
                  ? "Locked"
                  : "Open"}
            </strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="meeting-room-controls__alert meeting-room-controls__alert--error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="meeting-room-controls__alert meeting-room-controls__alert--success">
          {successMessage}
        </div>
      )}

      <div className="meeting-room-controls__summary">
        <article>
          <span>
            {settings.roomLocked ? (
              <FiLock />
            ) : (
              <FiUnlock />
            )}
          </span>

          <div>
            <small>Room access</small>

            <strong>
              {settings.roomLocked
                ? "Locked"
                : "Open"}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <FiUsers />
          </span>

          <div>
            <small>Waiting room</small>

            <strong>
              {settings
                .waitingRoomEnabled
                ? "Enabled"
                : "Disabled"}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <FiShield />
          </span>

          <div>
            <small>
              Participant permissions
            </small>

            <strong>
              {enabledPermissions}/4
              enabled
            </strong>
          </div>
        </article>
      </div>

      {!canManage && (
        <div className="meeting-room-controls__notice">
          <FiShield />

          <div>
            <strong>
              View-only access
            </strong>

            <span>
              Only the host, co-hosts or
              authorized meeting managers can
              change these controls.
            </span>
          </div>
        </div>
      )}

      <div className="meeting-room-controls__groups">
        {SETTING_GROUPS.map(
          (group) => (
            <section
              key={group.title}
              className="meeting-room-controls__group"
            >
              <div className="meeting-room-controls__group-header">
                <h3>{group.title}</h3>

                <p>
                  {group.description}
                </p>
              </div>

              <div className="meeting-room-controls__settings-list">
                {group.settings.map(
                  (setting) => {
                    const Icon =
                      setting.icon;

                    const isDisabled =
                      !canManage ||
                      (
                        !settings.roomEnabled &&
                        setting.name !==
                          "roomEnabled"
                      );

                    return (
                      <article
                        key={
                          setting.name
                        }
                        className={
                          settings[
                            setting.name
                          ]
                            ? "meeting-room-controls__setting meeting-room-controls__setting--enabled"
                            : "meeting-room-controls__setting"
                        }
                      >
                        <div className="meeting-room-controls__setting-icon">
                          <Icon />
                        </div>

                        <div className="meeting-room-controls__setting-content">
                          <strong>
                            {
                              setting.label
                            }
                          </strong>

                          <span>
                            {
                              setting.description
                            }
                          </span>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={
                            settings[
                              setting.name
                            ]
                          }
                          aria-label={
                            setting.label
                          }
                          className={
                            settings[
                              setting.name
                            ]
                              ? "meeting-room-controls__switch meeting-room-controls__switch--active"
                              : "meeting-room-controls__switch"
                          }
                          onClick={() =>
                            handleToggle(
                              setting.name
                            )
                          }
                          disabled={
                            isDisabled
                          }
                        >
                          <span />
                        </button>
                      </article>
                    );
                  }
                )}
              </div>
            </section>
          )
        )}
      </div>

      {canManage && (
        <div className="meeting-room-controls__footer">
          <div>
            {hasChanges ? (
              <span className="meeting-room-controls__unsaved">
                Unsaved changes
              </span>
            ) : (
              <span>
                All settings are saved
              </span>
            )}
          </div>

          <div className="meeting-room-controls__footer-actions">
            <button
              type="button"
              className="meeting-room-controls__reset-button"
              onClick={handleReset}
              disabled={
                saving ||
                !hasChanges
              }
            >
              <FiRefreshCw />
              Reset
            </button>

            <button
              type="button"
              className="meeting-room-controls__save-button"
              onClick={handleSave}
              disabled={
                saving ||
                !hasChanges
              }
            >
              <FiCheck />

              {saving
                ? "Saving..."
                : "Save controls"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default MeetingLiveRoomControls;