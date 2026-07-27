import {
  useMemo,
  useState,
} from "react";

import {
  FiChevronDown,
  FiChevronUp,
  FiMic,
  FiMicOff,
  FiMoreVertical,
  FiSearch,
  FiShield,
  FiUserCheck,
  FiUserMinus,
  FiUsers,
  FiVideo,
  FiVideoOff,
  FiX,
} from "react-icons/fi";

import "./ParticipantsPanel.css";

/* ==========================================================
   HELPERS
========================================================== */

const getParticipantId = (
  participant
) => {
  return String(
    participant?.socketId ||
      participant?.userId ||
      participant?.user?._id ||
      participant?.user?.id ||
      participant?._id ||
      participant?.id ||
      ""
  );
};

const getParticipantName = (
  participant
) => {
  const user =
    participant?.user || {};

  return (
    participant?.displayName ||
    participant?.fullName ||
    participant?.name ||
    [
      participant?.firstName,
      participant?.middleName,
      participant?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user?.displayName ||
    user?.fullName ||
    user?.name ||
    [
      user?.firstName,
      user?.middleName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    participant?.email ||
    user?.email ||
    "Participant"
  );
};

const getParticipantPhoto = (
  participant
) => {
  return (
    participant?.profilePhoto ||
    participant?.avatar ||
    participant?.photo ||
    participant?.user?.profilePhoto ||
    participant?.user?.avatar ||
    participant?.user?.photo ||
    ""
  );
};

const getParticipantInitials = (
  participant
) => {
  const name =
    getParticipantName(
      participant
    );

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part
        .charAt(0)
        .toUpperCase()
    )
    .join("");
};

const getParticipantRole = (
  participant
) => {
  const role =
    participant?.meetingRole ||
    participant?.role ||
    participant?.participantRole ||
    "participant";

  if (
    role === "co_host" ||
    role === "co-host"
  ) {
    return "Co-host";
  }

  if (role === "host") {
    return "Host";
  }

  if (
    role === "moderator" ||
    role === "manager"
  ) {
    return "Manager";
  }

  return "Participant";
};

const participantIsConnected = (
  participant
) => {
  return (
    participant?.isConnected ??
    participant?.connected ??
    participant?.isInRoom ??
    participant?.joined ??
    true
  );
};

const participantMicrophoneEnabled = (
  participant
) => {
  return Boolean(
    participant?.microphoneEnabled ??
      participant?.microphone ??
      participant?.media
        ?.microphone ??
      false
  );
};

const participantCameraEnabled = (
  participant
) => {
  return Boolean(
    participant?.cameraEnabled ??
      participant?.camera ??
      participant?.media
        ?.camera ??
      false
  );
};

const participantRaisedHand = (
  participant
) => {
  return Boolean(
    participant?.raisedHand ??
      participant?.handRaised
  );
};

const participantIsWaiting = (
  participant
) => {
  return Boolean(
    participant?.waiting ||
      participant?.inWaitingRoom ||
      participant?.attendanceStatus ===
        "waiting"
  );
};

/* ==========================================================
   PARTICIPANT ROW
========================================================== */

const ParticipantRow = ({
  participant,

  currentUserId = "",

  canManage = false,

  expanded = false,

  onToggleExpanded,

  onMute,
  onRemove,
  onAdmit,
  onMakeCoHost,
}) => {
  const participantId =
    getParticipantId(
      participant
    );

  const name =
    getParticipantName(
      participant
    );

  const photo =
    getParticipantPhoto(
      participant
    );

  const initials =
    getParticipantInitials(
      participant
    );

  const role =
    getParticipantRole(
      participant
    );

  const connected =
    participantIsConnected(
      participant
    );

  const microphoneEnabled =
    participantMicrophoneEnabled(
      participant
    );

  const cameraEnabled =
    participantCameraEnabled(
      participant
    );

  const raisedHand =
    participantRaisedHand(
      participant
    );

  const waiting =
    participantIsWaiting(
      participant
    );

  const isCurrentUser =
    Boolean(
      currentUserId &&
      participantId ===
        String(currentUserId)
    );

  const isHost =
    role === "Host";

  return (
    <article
      className={[
        "participants-panel__participant",

        !connected
          ? "participants-panel__participant--disconnected"
          : "",

        waiting
          ? "participants-panel__participant--waiting"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="participants-panel__participant-main">
        <div className="participants-panel__avatar-wrap">
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="participants-panel__avatar"
            />
          ) : (
            <span className="participants-panel__initials">
              {initials || "JV"}
            </span>
          )}

          <span
            className={[
              "participants-panel__connection-dot",

              connected
                ? "participants-panel__connection-dot--online"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            title={
              connected
                ? "Connected"
                : "Disconnected"
            }
          />
        </div>

        <div className="participants-panel__identity">
          <div className="participants-panel__name-row">
            <strong>
              {name}
            </strong>

            {isCurrentUser && (
              <span className="participants-panel__you-badge">
                You
              </span>
            )}

            {raisedHand && (
              <span
                className="participants-panel__hand-badge"
                title="Hand raised"
              >
                ✋
              </span>
            )}
          </div>

          <div className="participants-panel__meta">
            <span
              className={[
                "participants-panel__role",

                role === "Host"
                  ? "participants-panel__role--host"
                  : "",

                role === "Co-host"
                  ? "participants-panel__role--cohost"
                  : "",

                role === "Manager"
                  ? "participants-panel__role--manager"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {role}
            </span>

            <span>
              {waiting
                ? "Waiting room"
                : connected
                  ? "In meeting"
                  : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="participants-panel__media-status">
          <span
            className={[
              "participants-panel__media-icon",

              microphoneEnabled
                ? ""
                : "participants-panel__media-icon--off",
            ]
              .filter(Boolean)
              .join(" ")}
            title={
              microphoneEnabled
                ? "Microphone on"
                : "Microphone muted"
            }
          >
            {microphoneEnabled ? (
              <FiMic />
            ) : (
              <FiMicOff />
            )}
          </span>

          <span
            className={[
              "participants-panel__media-icon",

              cameraEnabled
                ? ""
                : "participants-panel__media-icon--off",
            ]
              .filter(Boolean)
              .join(" ")}
            title={
              cameraEnabled
                ? "Camera on"
                : "Camera off"
            }
          >
            {cameraEnabled ? (
              <FiVideo />
            ) : (
              <FiVideoOff />
            )}
          </span>
        </div>

        {canManage &&
          !isCurrentUser && (
            <button
              type="button"
              className="participants-panel__more-button"
              onClick={() =>
                onToggleExpanded?.(
                  participantId
                )
              }
              aria-label={`Manage ${name}`}
              aria-expanded={
                expanded
              }
            >
              {expanded ? (
                <FiChevronUp />
              ) : (
                <FiMoreVertical />
              )}
            </button>
          )}
      </div>

      {expanded &&
        canManage &&
        !isCurrentUser && (
          <div className="participants-panel__actions">
            {waiting && (
              <button
                type="button"
                onClick={() =>
                  onAdmit?.(
                    participant
                  )
                }
              >
                <FiUserCheck />
                Admit
              </button>
            )}

            {!waiting && (
              <button
                type="button"
                onClick={() =>
                  onMute?.(
                    participant
                  )
                }
                disabled={
                  !microphoneEnabled
                }
              >
                <FiMicOff />
                Mute
              </button>
            )}

            {!isHost &&
              !waiting && (
                <button
                  type="button"
                  onClick={() =>
                    onMakeCoHost?.(
                      participant
                    )
                  }
                >
                  <FiShield />
                  Make co-host
                </button>
              )}

            {!isHost && (
              <button
                type="button"
                className="participants-panel__danger-action"
                onClick={() =>
                  onRemove?.(
                    participant
                  )
                }
              >
                <FiUserMinus />
                Remove
              </button>
            )}
          </div>
        )}
    </article>
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

const ParticipantsPanel = ({
  participants = [],

  currentUser = null,

  canManage = false,

  isOpen = true,

  showWaitingRoom = true,

  className = "",

  onClose,

  onMuteParticipant,
  onRemoveParticipant,
  onAdmitParticipant,
  onMakeCoHost,
}) => {
  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    expandedParticipantId,
    setExpandedParticipantId,
  ] = useState("");

  const [
    waitingExpanded,
    setWaitingExpanded,
  ] = useState(true);

  const currentUserId =
    String(
      currentUser?._id ||
        currentUser?.id ||
        currentUser?.userId ||
        ""
    );

  const normalizedParticipants =
    useMemo(() => {
      const seen =
        new Set();

      return (
        Array.isArray(
          participants
        )
          ? participants
          : []
      ).filter(
        (participant) => {
          const id =
            getParticipantId(
              participant
            );

          if (
            !id ||
            seen.has(id)
          ) {
            return false;
          }

          seen.add(id);

          return true;
        }
      );
    }, [participants]);

  const filteredParticipants =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      if (!query) {
        return normalizedParticipants;
      }

      return normalizedParticipants.filter(
        (participant) => {
          const name =
            getParticipantName(
              participant
            ).toLowerCase();

          const role =
            getParticipantRole(
              participant
            ).toLowerCase();

          return (
            name.includes(query) ||
            role.includes(query)
          );
        }
      );
    }, [
      normalizedParticipants,
      searchTerm,
    ]);

  const waitingParticipants =
    useMemo(
      () =>
        filteredParticipants.filter(
          participantIsWaiting
        ),
      [filteredParticipants]
    );

  const inRoomParticipants =
    useMemo(
      () =>
        filteredParticipants.filter(
          (participant) =>
            !participantIsWaiting(
              participant
            )
        ),
      [filteredParticipants]
    );

  const totalCount =
    normalizedParticipants.length;

  const waitingCount =
    normalizedParticipants.filter(
      participantIsWaiting
    ).length;

  const rootClassName = [
    "participants-panel",

    !isOpen
      ? "participants-panel--closed"
      : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleToggleExpanded =
    (participantId) => {
      setExpandedParticipantId(
        (currentId) =>
          currentId ===
          participantId
            ? ""
            : participantId
      );
    };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={rootClassName}
      aria-label="Meeting participants"
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="participants-panel__header">
        <div>
          <div className="participants-panel__title-row">
            <FiUsers />

            <h2>
              Participants
            </h2>

            <span className="participants-panel__count">
              {totalCount}
            </span>
          </div>

          <p>
            View participants and
            manage access to the
            meeting.
          </p>
        </div>

        <button
          type="button"
          className="participants-panel__close-button"
          onClick={onClose}
          aria-label="Close participants panel"
        >
          <FiX />
        </button>
      </header>

      {/* ====================================================
          SEARCH
      ==================================================== */}

      <div className="participants-panel__search">
        <FiSearch />

        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(
              event.target.value
            )
          }
          placeholder="Search participants"
          aria-label="Search participants"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() =>
              setSearchTerm("")
            }
            aria-label="Clear search"
          >
            <FiX />
          </button>
        )}
      </div>

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <div className="participants-panel__content">
        {showWaitingRoom &&
          waitingCount > 0 && (
            <section className="participants-panel__group">
              <button
                type="button"
                className="participants-panel__group-header"
                onClick={() =>
                  setWaitingExpanded(
                    (current) =>
                      !current
                  )
                }
                aria-expanded={
                  waitingExpanded
                }
              >
                <span>
                  Waiting room
                </span>

                <span>
                  {waitingCount}

                  {waitingExpanded ? (
                    <FiChevronUp />
                  ) : (
                    <FiChevronDown />
                  )}
                </span>
              </button>

              {waitingExpanded && (
                <div className="participants-panel__list">
                  {waitingParticipants.map(
                    (participant) => {
                      const participantId =
                        getParticipantId(
                          participant
                        );

                      return (
                        <ParticipantRow
                          key={
                            participantId
                          }
                          participant={
                            participant
                          }
                          currentUserId={
                            currentUserId
                          }
                          canManage={
                            canManage
                          }
                          expanded={
                            expandedParticipantId ===
                            participantId
                          }
                          onToggleExpanded={
                            handleToggleExpanded
                          }
                          onAdmit={
                            onAdmitParticipant
                          }
                          onRemove={
                            onRemoveParticipant
                          }
                        />
                      );
                    }
                  )}
                </div>
              )}
            </section>
          )}

        <section className="participants-panel__group">
          <div className="participants-panel__group-header participants-panel__group-header--static">
            <span>
              In meeting
            </span>

            <span>
              {
                inRoomParticipants.length
              }
            </span>
          </div>

          <div className="participants-panel__list">
            {inRoomParticipants.length >
            0 ? (
              inRoomParticipants.map(
                (participant) => {
                  const participantId =
                    getParticipantId(
                      participant
                    );

                  return (
                    <ParticipantRow
                      key={
                        participantId
                      }
                      participant={
                        participant
                      }
                      currentUserId={
                        currentUserId
                      }
                      canManage={
                        canManage
                      }
                      expanded={
                        expandedParticipantId ===
                        participantId
                      }
                      onToggleExpanded={
                        handleToggleExpanded
                      }
                      onMute={
                        onMuteParticipant
                      }
                      onRemove={
                        onRemoveParticipant
                      }
                      onMakeCoHost={
                        onMakeCoHost
                      }
                    />
                  );
                }
              )
            ) : (
              <div className="participants-panel__empty">
                <FiUsers />

                <strong>
                  No participants found
                </strong>

                <span>
                  Participants will
                  appear here when they
                  join.
                </span>
              </div>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
};

export {
  ParticipantRow,
  getParticipantId,
  getParticipantName,
  getParticipantRole,
  participantIsWaiting,
};

export default ParticipantsPanel;