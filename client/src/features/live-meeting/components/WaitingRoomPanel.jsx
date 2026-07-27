import {
  useMemo,
  useState,
} from "react";

import {
  FiCheck,
  FiClock,
  FiSearch,
  FiUserCheck,
  FiUserMinus,
  FiUsers,
  FiX,
} from "react-icons/fi";

import "./WaitingRoomPanel.css";

/* ==========================================================
   HELPERS
========================================================== */

const getWaitingParticipantId = (
  participant
) => {
  return String(
    participant?.participantId ||
      participant?.socketId ||
      participant?.userId ||
      participant?.user?._id ||
      participant?.user?.id ||
      participant?._id ||
      participant?.id ||
      ""
  );
};

const getWaitingParticipantName = (
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

const getWaitingParticipantPhoto = (
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

const getWaitingParticipantInitials = (
  participant
) => {
  return getWaitingParticipantName(
    participant
  )
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

const getWaitingParticipantTime = (
  participant
) => {
  const value =
    participant?.waitingSince ||
    participant?.requestedAt ||
    participant?.joinedAt ||
    participant?.createdAt ||
    null;

  if (!value) {
    return "Waiting";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Waiting";
  }

  return `Waiting since ${new Intl.DateTimeFormat(
    "en-KE",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date)}`;
};

/* ==========================================================
   WAITING PARTICIPANT ROW
========================================================== */

const WaitingParticipantRow = ({
  participant,

  selected = false,
  processing = false,

  onToggleSelected,
  onAdmit,
  onReject,
}) => {
  const participantId =
    getWaitingParticipantId(
      participant
    );

  const name =
    getWaitingParticipantName(
      participant
    );

  const photo =
    getWaitingParticipantPhoto(
      participant
    );

  const initials =
    getWaitingParticipantInitials(
      participant
    );

  return (
    <article className="waiting-room-panel__participant">
      <button
        type="button"
        className={[
          "waiting-room-panel__select",

          selected
            ? "waiting-room-panel__select--active"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() =>
          onToggleSelected?.(
            participantId
          )
        }
        aria-label={
          selected
            ? `Deselect ${name}`
            : `Select ${name}`
        }
        aria-pressed={selected}
        disabled={processing}
      >
        {selected && <FiCheck />}
      </button>

      <div className="waiting-room-panel__avatar-wrap">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="waiting-room-panel__avatar"
          />
        ) : (
          <span className="waiting-room-panel__initials">
            {initials || "JV"}
          </span>
        )}

        <span className="waiting-room-panel__waiting-dot" />
      </div>

      <div className="waiting-room-panel__participant-info">
        <strong>{name}</strong>

        <span>
          <FiClock />

          {getWaitingParticipantTime(
            participant
          )}
        </span>
      </div>

      <div className="waiting-room-panel__participant-actions">
        <button
          type="button"
          className="waiting-room-panel__admit-button"
          onClick={() =>
            onAdmit?.(
              participant
            )
          }
          disabled={processing}
        >
          <FiUserCheck />

          <span>
            {processing
              ? "Please wait"
              : "Admit"}
          </span>
        </button>

        <button
          type="button"
          className="waiting-room-panel__reject-button"
          onClick={() =>
            onReject?.(
              participant
            )
          }
          disabled={processing}
          aria-label={`Reject ${name}`}
          title="Reject participant"
        >
          <FiUserMinus />
        </button>
      </div>
    </article>
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

const WaitingRoomPanel = ({
  participants = [],

  isOpen = true,

  canManage = false,

  processingParticipantId = "",

  bulkProcessing = false,

  className = "",

  onClose,

  onAdmitParticipant,
  onRejectParticipant,

  onAdmitSelected,
  onRejectSelected,

  onAdmitAll,
}) => {
  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedParticipantIds,
    setSelectedParticipantIds,
  ] = useState([]);

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
          const participantId =
            getWaitingParticipantId(
              participant
            );

          if (
            !participantId ||
            seen.has(
              participantId
            )
          ) {
            return false;
          }

          seen.add(
            participantId
          );

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
            getWaitingParticipantName(
              participant
            ).toLowerCase();

          const email =
            String(
              participant?.email ||
                participant?.user
                  ?.email ||
                ""
            ).toLowerCase();

          return (
            name.includes(query) ||
            email.includes(query)
          );
        }
      );
    }, [
      normalizedParticipants,
      searchTerm,
    ]);

  const selectedParticipants =
    useMemo(() => {
      const selectedIds =
        new Set(
          selectedParticipantIds.map(
            String
          )
        );

      return normalizedParticipants.filter(
        (participant) =>
          selectedIds.has(
            getWaitingParticipantId(
              participant
            )
          )
      );
    }, [
      normalizedParticipants,
      selectedParticipantIds,
    ]);

  const allVisibleSelected =
    filteredParticipants.length >
      0 &&
    filteredParticipants.every(
      (participant) =>
        selectedParticipantIds.includes(
          getWaitingParticipantId(
            participant
          )
        )
    );

  const handleToggleSelected =
    (participantId) => {
      setSelectedParticipantIds(
        (currentIds) => {
          if (
            currentIds.includes(
              participantId
            )
          ) {
            return currentIds.filter(
              (currentId) =>
                currentId !==
                participantId
            );
          }

          return [
            ...currentIds,
            participantId,
          ];
        }
      );
    };

  const handleToggleSelectAll =
    () => {
      if (allVisibleSelected) {
        const visibleIds =
          new Set(
            filteredParticipants.map(
              getWaitingParticipantId
            )
          );

        setSelectedParticipantIds(
          (currentIds) =>
            currentIds.filter(
              (participantId) =>
                !visibleIds.has(
                  participantId
                )
            )
        );

        return;
      }

      setSelectedParticipantIds(
        (currentIds) => {
          const nextIds =
            new Set(currentIds);

          filteredParticipants.forEach(
            (participant) => {
              nextIds.add(
                getWaitingParticipantId(
                  participant
                )
              );
            }
          );

          return Array.from(
            nextIds
          );
        }
      );
    };

  const handleAdmitSelected =
    async () => {
      if (
        selectedParticipants.length ===
        0
      ) {
        return;
      }

      await onAdmitSelected?.(
        selectedParticipants
      );

      setSelectedParticipantIds(
        []
      );
    };

  const handleRejectSelected =
    async () => {
      if (
        selectedParticipants.length ===
        0
      ) {
        return;
      }

      await onRejectSelected?.(
        selectedParticipants
      );

      setSelectedParticipantIds(
        []
      );
    };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={[
        "waiting-room-panel",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Waiting room"
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="waiting-room-panel__header">
        <div>
          <div className="waiting-room-panel__title-row">
            <FiClock />

            <h2>
              Waiting room
            </h2>

            <span className="waiting-room-panel__count">
              {
                normalizedParticipants.length
              }
            </span>
          </div>

          <p>
            Review and admit people
            requesting access to the
            meeting.
          </p>
        </div>

        <button
          type="button"
          className="waiting-room-panel__close-button"
          onClick={onClose}
          aria-label="Close waiting room"
        >
          <FiX />
        </button>
      </header>

      {/* ====================================================
          SEARCH
      ==================================================== */}

      <div className="waiting-room-panel__search">
        <FiSearch />

        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(
              event.target.value
            )
          }
          placeholder="Search waiting participants"
          aria-label="Search waiting participants"
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
          MANAGEMENT TOOLBAR
      ==================================================== */}

      {canManage &&
        normalizedParticipants.length >
          0 && (
          <div className="waiting-room-panel__management">
            <button
              type="button"
              className={[
                "waiting-room-panel__select-all",

                allVisibleSelected
                  ? "waiting-room-panel__select-all--active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={
                handleToggleSelectAll
              }
              disabled={
                bulkProcessing
              }
            >
              <span>
                {allVisibleSelected && (
                  <FiCheck />
                )}
              </span>

              Select visible
            </button>

            <button
              type="button"
              className="waiting-room-panel__admit-all-button"
              onClick={() =>
                onAdmitAll?.(
                  normalizedParticipants
                )
              }
              disabled={
                bulkProcessing
              }
            >
              <FiUserCheck />

              Admit all
            </button>
          </div>
        )}

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <div className="waiting-room-panel__content">
        {filteredParticipants.length >
        0 ? (
          <div className="waiting-room-panel__list">
            {filteredParticipants.map(
              (participant) => {
                const participantId =
                  getWaitingParticipantId(
                    participant
                  );

                return (
                  <WaitingParticipantRow
                    key={
                      participantId
                    }
                    participant={
                      participant
                    }
                    selected={selectedParticipantIds.includes(
                      participantId
                    )}
                    processing={
                      String(
                        processingParticipantId
                      ) ===
                        participantId ||
                      bulkProcessing
                    }
                    onToggleSelected={
                      handleToggleSelected
                    }
                    onAdmit={
                      canManage
                        ? onAdmitParticipant
                        : undefined
                    }
                    onReject={
                      canManage
                        ? onRejectParticipant
                        : undefined
                    }
                  />
                );
              }
            )}
          </div>
        ) : (
          <div className="waiting-room-panel__empty">
            <div className="waiting-room-panel__empty-icon">
              <FiUsers />
            </div>

            <strong>
              {searchTerm
                ? "No matching participants"
                : "Nobody is waiting"}
            </strong>

            <span>
              {searchTerm
                ? "Try searching using a different name or email."
                : "New requests to join the meeting will appear here."}
            </span>
          </div>
        )}
      </div>

      {/* ====================================================
          SELECTED ACTIONS
      ==================================================== */}

      {canManage &&
        selectedParticipants.length >
          0 && (
          <footer className="waiting-room-panel__footer">
            <div>
              <strong>
                {
                  selectedParticipants.length
                }{" "}
                selected
              </strong>

              <button
                type="button"
                onClick={() =>
                  setSelectedParticipantIds(
                    []
                  )
                }
                disabled={
                  bulkProcessing
                }
              >
                Clear
              </button>
            </div>

            <div className="waiting-room-panel__bulk-actions">
              <button
                type="button"
                className="waiting-room-panel__bulk-reject"
                onClick={
                  handleRejectSelected
                }
                disabled={
                  bulkProcessing
                }
              >
                <FiUserMinus />

                Reject
              </button>

              <button
                type="button"
                className="waiting-room-panel__bulk-admit"
                onClick={
                  handleAdmitSelected
                }
                disabled={
                  bulkProcessing
                }
              >
                <FiUserCheck />

                Admit
              </button>
            </div>
          </footer>
        )}
    </aside>
  );
};

export {
  WaitingParticipantRow,
  getWaitingParticipantId,
  getWaitingParticipantName,
};

export default WaitingRoomPanel;