import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
  FiSearch,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";

import {
  inviteMeetingParticipants,
  removeMeetingParticipant,
} from "../../services/meeting.service";

import {
  getMeetingDirectory,
} from "../../services/user.service";

import "./MeetingParticipants.css";

const DIRECTORY_LIMIT = 12;

const getParticipantUserId = (participant) => {
  if (!participant) {
    return "";
  }

  if (typeof participant.user === "string") {
    return participant.user;
  }

  return (
    participant.user?._id ||
    participant.user?.id ||
    participant.userId ||
    ""
  );
};

const getParticipantName = (participant) => {
  if (!participant) {
    return "Unknown participant";
  }

  const user = participant.user;

  if (user && typeof user === "object") {
    const member = user.member;

    const memberName = [
      member?.firstName,
      member?.middleName,
      member?.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      memberName ||
      user.fullName ||
      user.name ||
      user.email ||
      "Unknown participant"
    );
  }

  return (
    participant.fullName ||
    participant.name ||
    participant.email ||
    "Unknown participant"
  );
};

const MeetingParticipants = ({
  meetingId,
  participants = [],
  canManage = false,
  onMeetingRefresh,
}) => {
  const [directoryUsers, setDirectoryUsers] =
    useState([]);

  const [selectedUserIds, setSelectedUserIds] =
    useState([]);

  const [search, setSearch] = useState("");
  const [county, setCounty] = useState("");
  const [leadershipOnly, setLeadershipOnly] =
    useState(false);

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: DIRECTORY_LIMIT,
    total: 0,
    pages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loadingDirectory, setLoadingDirectory] =
    useState(false);

  const [inviting, setInviting] = useState(false);

  const [removingUserId, setRemovingUserId] =
    useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const existingParticipantIds = useMemo(() => {
    return new Set(
      participants
        .map(getParticipantUserId)
        .filter(Boolean)
        .map(String)
    );
  }, [participants]);

  const availableDirectoryUsers = useMemo(() => {
    return directoryUsers.filter(
      (user) =>
        !existingParticipantIds.has(
          String(user.userId)
        )
    );
  }, [
    directoryUsers,
    existingParticipantIds,
  ]);

  const selectedUsers = useMemo(() => {
    const selectedSet = new Set(
      selectedUserIds.map(String)
    );

    return availableDirectoryUsers.filter((user) =>
      selectedSet.has(String(user.userId))
    );
  }, [
    availableDirectoryUsers,
    selectedUserIds,
  ]);

  const loadDirectory = useCallback(async () => {
    if (!canManage) {
      return;
    }

    try {
      setLoadingDirectory(true);
      setError("");

      const response =
        await getMeetingDirectory({
          page,
          limit: DIRECTORY_LIMIT,
          search,
          county,
          leadershipOnly,
          excludeMe: true,
        });

      setDirectoryUsers(
        Array.isArray(response?.data)
          ? response.data
          : []
      );

      setPagination(
        response?.pagination || {
          page,
          limit: DIRECTORY_LIMIT,
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to load the member directory."
      );
    } finally {
      setLoadingDirectory(false);
    }
  }, [
    canManage,
    county,
    leadershipOnly,
    page,
    search,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDirectory();
    }, 350);

    return () => clearTimeout(timer);
  }, [loadDirectory]);

  useEffect(() => {
    setPage(1);
  }, [search, county, leadershipOnly]);

  useEffect(() => {
    setSelectedUserIds((currentIds) =>
      currentIds.filter(
        (userId) =>
          !existingParticipantIds.has(
            String(userId)
          )
      )
    );
  }, [existingParticipantIds]);

  const toggleSelectedUser = (userId) => {
    setSelectedUserIds((currentIds) => {
      const exists = currentIds.some(
        (id) => String(id) === String(userId)
      );

      if (exists) {
        return currentIds.filter(
          (id) =>
            String(id) !== String(userId)
        );
      }

      return [...currentIds, userId];
    });
  };

  const handleInviteParticipants = async () => {
    if (!selectedUsers.length) {
      return;
    }

    try {
      setInviting(true);
      setError("");
      setSuccessMessage("");

      const invitationPayload =
        selectedUsers.map((user) => ({
          user: user.userId,
          role: "participant",
        }));

      await inviteMeetingParticipants(
        meetingId,
        invitationPayload
      );

      setSuccessMessage(
        `${selectedUsers.length} participant${
          selectedUsers.length === 1 ? "" : "s"
        } invited successfully.`
      );

      setSelectedUserIds([]);

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }

      await loadDirectory();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to invite the selected participants."
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveParticipant = async (
    participant
  ) => {
    const participantUserId =
      getParticipantUserId(participant);

    if (!participantUserId) {
      setError(
        "This participant does not have a valid user ID."
      );
      return;
    }

    const confirmed = window.confirm(
      `Remove ${getParticipantName(
        participant
      )} from this meeting?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingUserId(
        String(participantUserId)
      );

      setError("");
      setSuccessMessage("");

      await removeMeetingParticipant(
        meetingId,
        participantUserId
      );

      setSuccessMessage(
        "Participant removed successfully."
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }

      await loadDirectory();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to remove the participant."
      );
    } finally {
      setRemovingUserId("");
    }
  };

  return (
    <section className="meeting-participants">
      <div className="meeting-participants__header">
        <div>
          <span className="meeting-participants__eyebrow">
            Meeting participants
          </span>

          <h2>
            <FiUsers />
            Participants
          </h2>

          <p>
            View invited users and add members from
            the JVP Connect directory.
          </p>
        </div>

        <div className="meeting-participants__count">
          <strong>{participants.length}</strong>
          <span>
            participant
            {participants.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {error && (
        <div className="meeting-participants__alert meeting-participants__alert--error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="meeting-participants__alert meeting-participants__alert--success">
          {successMessage}
        </div>
      )}

      <div className="meeting-participants__current">
        <div className="meeting-participants__section-heading">
          <div>
            <h3>Current participants</h3>
            <p>
              Users already invited to this meeting.
            </p>
          </div>
        </div>

        {!participants.length ? (
          <div className="meeting-participants__empty">
            <FiUsers />

            <h4>No participants yet</h4>

            <p>
              Invite members from the directory below.
            </p>
          </div>
        ) : (
          <div className="meeting-participants__current-list">
            {participants.map(
              (participant, index) => {
                const participantUserId =
                  getParticipantUserId(
                    participant
                  );

                const participantName =
                  getParticipantName(
                    participant
                  );

                const participantEmail =
                  participant.user?.email ||
                  participant.email ||
                  "";

                const participantRole =
                  participant.role ||
                  "participant";

                const avatarUrl =
                  participant.user?.member
                    ?.profilePhoto ||
                  participant.profilePhoto ||
                  "";

                return (
                  <article
                    className="meeting-participants__participant-card"
                    key={
                      participant._id ||
                      participantUserId ||
                      index
                    }
                  >
                    <div className="meeting-participants__avatar">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={participantName}
                        />
                      ) : (
                        <span>
                          {participantName
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="meeting-participants__participant-details">
                      <h4>{participantName}</h4>

                      {participantEmail && (
                        <p>{participantEmail}</p>
                      )}

                      <span className="meeting-participants__role">
                        {participantRole}
                      </span>
                    </div>

                    {canManage && (
                      <button
                        type="button"
                        className="meeting-participants__remove-button"
                        onClick={() =>
                          handleRemoveParticipant(
                            participant
                          )
                        }
                        disabled={
                          removingUserId ===
                          String(
                            participantUserId
                          )
                        }
                        aria-label={`Remove ${participantName}`}
                      >
                        <FiX />

                        {removingUserId ===
                        String(
                          participantUserId
                        )
                          ? "Removing"
                          : "Remove"}
                      </button>
                    )}
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>

      {canManage && (
        <div className="meeting-participants__directory">
          <div className="meeting-participants__section-heading">
            <div>
              <h3>Invite participants</h3>
              <p>
                Search all active JVP Connect users.
              </p>
            </div>

            {selectedUsers.length > 0 && (
              <button
                type="button"
                className="meeting-participants__invite-button"
                onClick={
                  handleInviteParticipants
                }
                disabled={inviting}
              >
                <FiUserPlus />

                {inviting
                  ? "Inviting..."
                  : `Invite ${selectedUsers.length}`}
              </button>
            )}
          </div>

          <div className="meeting-participants__filters">
            <label className="meeting-participants__search">
              <FiSearch />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, email or member number"
              />
            </label>

            <label>
              <span>County</span>

              <select
                value={county}
                onChange={(event) =>
                  setCounty(event.target.value)
                }
              >
                <option value="">
                  All counties
                </option>
                <option value="Mombasa">
                  Mombasa
                </option>
                <option value="Kwale">
                  Kwale
                </option>
                <option value="Kilifi">
                  Kilifi
                </option>
                <option value="Tana River">
                  Tana River
                </option>
                <option value="Lamu">
                  Lamu
                </option>
                <option value="Taita Taveta">
                  Taita Taveta
                </option>
              </select>
            </label>

            <label className="meeting-participants__checkbox">
              <input
                type="checkbox"
                checked={leadershipOnly}
                onChange={(event) =>
                  setLeadershipOnly(
                    event.target.checked
                  )
                }
              />

              <span>Leaders only</span>
            </label>
          </div>

          {loadingDirectory ? (
            <div className="meeting-participants__loading">
              Loading member directory...
            </div>
          ) : !availableDirectoryUsers.length ? (
            <div className="meeting-participants__empty">
              <FiSearch />

              <h4>No users found</h4>

              <p>
                Try changing the search or filters.
              </p>
            </div>
          ) : (
            <div className="meeting-participants__directory-grid">
              {availableDirectoryUsers.map(
                (user) => {
                  const selected =
                    selectedUserIds.some(
                      (userId) =>
                        String(userId) ===
                        String(user.userId)
                    );

                  return (
                    <button
                      type="button"
                      key={user.userId}
                      className={`meeting-participants__directory-card ${
                        selected
                          ? "meeting-participants__directory-card--selected"
                          : ""
                      }`}
                      onClick={() =>
                        toggleSelectedUser(
                          user.userId
                        )
                      }
                    >
                      <span className="meeting-participants__selection">
                        {selected && <FiCheck />}
                      </span>

                      <span className="meeting-participants__avatar meeting-participants__avatar--large">
                        {user.profilePhoto ? (
                          <img
                            src={user.profilePhoto}
                            alt={user.fullName}
                          />
                        ) : (
                          <span>
                            {user.fullName
                              ?.charAt(0)
                              .toUpperCase() ||
                              "U"}
                          </span>
                        )}
                      </span>

                      <span className="meeting-participants__directory-details">
                        <strong>
                          {user.fullName}
                        </strong>

                        <small>
                          {user.displayLeadership ||
                            "Member"}
                        </small>

                        <span>
                          <FiMapPin />
                          {[
                            user.county,
                            user.constituency,
                          ]
                            .filter(Boolean)
                            .join(" • ") ||
                            "Location not provided"}
                        </span>

                        <em>
                          {user.memberNumber ||
                            user.email}
                        </em>
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          )}

          <div className="meeting-participants__pagination">
            <span>
              Page {pagination.page || page} of{" "}
              {pagination.pages || 1}
            </span>

            <div>
              <button
                type="button"
                onClick={() =>
                  setPage((currentPage) =>
                    Math.max(
                      currentPage - 1,
                      1
                    )
                  )
                }
                disabled={
                  loadingDirectory ||
                  !pagination.hasPreviousPage
                }
              >
                <FiChevronLeft />
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage(
                    (currentPage) =>
                      currentPage + 1
                  )
                }
                disabled={
                  loadingDirectory ||
                  !pagination.hasNextPage
                }
              >
                Next
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MeetingParticipants;