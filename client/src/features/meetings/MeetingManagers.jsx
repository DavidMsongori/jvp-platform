import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAward,
  FiCheck,
  FiChevronDown,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";

import {
  addMeetingManagers,
  changeMeetingHost,
  removeMeetingManager,
} from "../../services/meeting.service";

import "./MeetingManagers.css";

const getUserId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  /*
   * Meeting participants are subdocuments.
   * Their own _id is not the User ID.
   * Always prefer the nested user reference.
   */
  if (value?.user) {
    if (typeof value.user === "string") {
      return value.user;
    }

    return (
      value.user?._id ||
      value.user?.id ||
      value.user?.userId ||
      ""
    );
  }

  /*
   * Fall back to a direct User object.
   */
  return (
    value?.userId ||
    value?._id ||
    value?.id ||
    ""
  );
};

const getUserObject = (value) => {
  if (!value) {
    return null;
  }

  if (value?.user && typeof value.user === "object") {
    return value.user;
  }

  return value;
};

const getMemberObject = (value) => {
  const user = getUserObject(value);

  return (
    value?.member ||
    user?.member ||
    value?.user?.member ||
    null
  );
};

const getUserName = (value) => {
  if (!value) {
    return "Unknown user";
  }

  const user = getUserObject(value);
  const member = getMemberObject(value);

  const memberName = [
    member?.firstName,
    member?.middleName,
    member?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const userName = [
    user?.firstName,
    user?.middleName,
    user?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    memberName ||
    userName ||
    user?.fullName ||
    value?.fullName ||
    user?.name ||
    value?.name ||
    user?.email ||
    value?.email ||
    "Unknown user"
  );
};

const getUserEmail = (value) => {
  const user = getUserObject(value);

  return (
    user?.email ||
    value?.email ||
    ""
  );
};

const getUserPhone = (value) => {
  const user = getUserObject(value);
  const member = getMemberObject(value);

  return (
    member?.phone ||
    user?.phone ||
    value?.phone ||
    ""
  );
};

const getUserCounty = (value) => {
  const user = getUserObject(value);
  const member = getMemberObject(value);

  return (
    member?.county ||
    user?.county ||
    value?.county ||
    ""
  );
};

const getUserPosition = (value) => {
  const user = getUserObject(value);

  return (
    value?.displayPosition ||
    value?.leadershipPosition ||
    user?.displayPosition ||
    user?.leadershipPosition ||
    value?.position ||
    user?.position ||
    ""
  );
};

const getProfilePhoto = (value) => {
  const user = getUserObject(value);
  const member = getMemberObject(value);

  return (
    member?.profilePhoto ||
    user?.profilePhoto ||
    value?.profilePhoto ||
    ""
  );
};

const getInitials = (value) => {
  return getUserName(value)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase()
    )
    .join("") || "JV";
};

const normalizeManager = (
  value,
  role,
  index
) => {
  return {
    raw: value,
    id: String(getUserId(value) || ""),
    key:
      String(getUserId(value) || "") ||
      `${role}-${index}-${getUserName(value)}`,
    name: getUserName(value),
    email: getUserEmail(value),
    phone: getUserPhone(value),
    county: getUserCounty(value),
    position: getUserPosition(value),
    profilePhoto: getProfilePhoto(value),
    role,
  };
};

const normalizeParticipant = (
  participant,
  index
) => {
  const user =
    participant?.user ||
    participant;

  const userId =
    String(
      getUserId(user) ||
      getUserId(participant) ||
      ""
    );

  return {
    raw: participant,
    user,

    /*
     * This must be the User collection ID,
     * not the meeting participant subdocument ID.
     */
    id: userId,

    key:
      userId ||
      `participant-${index}`,

    name:
      getUserName(participant),

    email:
      getUserEmail(participant),

    phone:
      getUserPhone(participant),

    county:
      getUserCounty(participant),

    position:
      getUserPosition(participant),

    profilePhoto:
      getProfilePhoto(participant),
  };
};

const MeetingManagerAvatar = ({
  person,
  large = false,
}) => {
  return (
    <div
      className={`meeting-managers__avatar ${
        large
          ? "meeting-managers__avatar--large"
          : ""
      }`}
    >
      {person.profilePhoto ? (
        <img
          src={person.profilePhoto}
          alt={person.name}
        />
      ) : (
        <span>{getInitials(person.raw)}</span>
      )}
    </div>
  );
};

const MeetingManagers = ({
  meetingId,
  host = null,
  coHosts = [],
  moderators = [],
  participants = [],
  canManage = false,
  canChangeHost = false,
  onMeetingRefresh,
}) => {
  const [localHost, setLocalHost] =
    useState(host);

  const [localCoHosts, setLocalCoHosts] =
    useState(
      Array.isArray(coHosts)
        ? coHosts
        : []
    );

  const [
    localModerators,
    setLocalModerators,
  ] = useState(
    Array.isArray(moderators)
      ? moderators
      : []
  );

  const [showManagerForm, setShowManagerForm] =
    useState(false);

  const [showHostForm, setShowHostForm] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [selectedCoHosts, setSelectedCoHosts] =
    useState([]);

  const [
    selectedModerators,
    setSelectedModerators,
  ] = useState([]);

  const [selectedHostId, setSelectedHostId] =
    useState("");

  const [savingManagers, setSavingManagers] =
    useState(false);

  const [changingHost, setChangingHost] =
    useState(false);

  const [
    removingManagerId,
    setRemovingManagerId,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    setLocalHost(host);
  }, [host]);

  useEffect(() => {
    setLocalCoHosts(
      Array.isArray(coHosts)
        ? coHosts
        : []
    );
  }, [coHosts]);

  useEffect(() => {
    setLocalModerators(
      Array.isArray(moderators)
        ? moderators
        : []
    );
  }, [moderators]);

  const normalizedHost = useMemo(() => {
    if (!localHost) {
      return null;
    }

    return normalizeManager(
      localHost,
      "host",
      0
    );
  }, [localHost]);

  const normalizedCoHosts = useMemo(() => {
    return localCoHosts.map(
      (manager, index) =>
        normalizeManager(
          manager,
          "co_host",
          index
        )
    );
  }, [localCoHosts]);

  const normalizedModerators = useMemo(() => {
    return localModerators.map(
      (manager, index) =>
        normalizeManager(
          manager,
          "moderator",
          index
        )
    );
  }, [localModerators]);

  const normalizedParticipants = useMemo(() => {
    const items = Array.isArray(participants)
      ? participants
      : [];

    const uniqueParticipants = new Map();

    items
      .map(normalizeParticipant)
      .filter((participant) =>
        Boolean(participant.id)
      )
      .forEach((participant) => {
        uniqueParticipants.set(
          participant.id,
          participant
        );
      });

    return Array.from(
      uniqueParticipants.values()
    );
  }, [participants]);

  const hostId =
    normalizedHost?.id || "";

  const existingCoHostIds = useMemo(() => {
    return new Set(
      normalizedCoHosts
        .map((manager) => manager.id)
        .filter(Boolean)
    );
  }, [normalizedCoHosts]);

  const existingModeratorIds = useMemo(() => {
    return new Set(
      normalizedModerators
        .map((manager) => manager.id)
        .filter(Boolean)
    );
  }, [normalizedModerators]);

  const managerCandidateIds = useMemo(() => {
    return new Set([
      hostId,
      ...existingCoHostIds,
      ...existingModeratorIds,
    ]);
  }, [
    hostId,
    existingCoHostIds,
    existingModeratorIds,
  ]);

  const availableParticipants = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return normalizedParticipants.filter(
      (participant) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            participant.name,
            participant.email,
            participant.phone,
            participant.county,
            participant.position,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(normalizedSearch)
            );

        return matchesSearch;
      }
    );
  }, [
    normalizedParticipants,
    search,
  ]);

  const hostCandidates = useMemo(() => {
    return normalizedParticipants.filter(
      (participant) =>
        participant.id !== hostId
    );
  }, [
    normalizedParticipants,
    hostId,
  ]);

  const toggleSelectedManager = (
    userId,
    managerType
  ) => {
    if (!userId || userId === hostId) {
      return;
    }

    if (managerType === "co_host") {
      setSelectedModerators(
        (current) =>
          current.filter(
            (id) => id !== userId
          )
      );

      setSelectedCoHosts(
        (current) =>
          current.includes(userId)
            ? current.filter(
                (id) => id !== userId
              )
            : [...current, userId]
      );

      return;
    }

    setSelectedCoHosts(
      (current) =>
        current.filter(
          (id) => id !== userId
        )
    );

    setSelectedModerators(
      (current) =>
        current.includes(userId)
          ? current.filter(
              (id) => id !== userId
            )
          : [...current, userId]
    );
  };

  const resetManagerForm = () => {
    setSelectedCoHosts([]);
    setSelectedModerators([]);
    setSearch("");
    setShowManagerForm(false);
    setError("");
  };

  const handleSaveManagers = async () => {
    if (
      !selectedCoHosts.length &&
      !selectedModerators.length
    ) {
      setError(
        "Select at least one co-host or moderator."
      );

      return;
    }

    try {
      setSavingManagers(true);
      setError("");
      setSuccessMessage("");

      const coHostIds = Array.from(
        new Set([
          ...normalizedCoHosts
            .map((manager) => manager.id)
            .filter(Boolean),
          ...selectedCoHosts,
        ])
      );

      const moderatorIds = Array.from(
        new Set([
          ...normalizedModerators
            .map((manager) => manager.id)
            .filter(Boolean),
          ...selectedModerators,
        ])
      ).filter(
        (id) => !coHostIds.includes(id)
      );

      await addMeetingManagers(
        meetingId,
        {
          coHosts: coHostIds,
          moderators: moderatorIds,
        }
      );

      setSuccessMessage(
        "Meeting managers updated successfully."
      );

      resetManagerForm();

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to update meeting managers."
      );
    } finally {
      setSavingManagers(false);
    }
  };

  const handleRemoveManager = async (
    manager
  ) => {
    if (!manager.id) {
      setError(
        "This manager does not have a valid user ID."
      );

      return;
    }

    const confirmed = window.confirm(
      `Remove ${manager.name} as ${
        manager.role === "co_host"
          ? "co-host"
          : "moderator"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingManagerId(manager.id);
      setError("");
      setSuccessMessage("");

      await removeMeetingManager(
        meetingId,
        manager.id
      );

      if (manager.role === "co_host") {
        setLocalCoHosts(
          (current) =>
            current.filter(
              (item) =>
                String(getUserId(item)) !==
                manager.id
            )
        );
      } else {
        setLocalModerators(
          (current) =>
            current.filter(
              (item) =>
                String(getUserId(item)) !==
                manager.id
            )
        );
      }

      setSuccessMessage(
        "Meeting manager removed successfully."
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to remove the meeting manager."
      );
    } finally {
      setRemovingManagerId("");
    }
  };

  const handleChangeHost = async () => {
    if (!selectedHostId) {
      setError(
        "Select the new meeting host."
      );

      return;
    }

    const selectedHost =
      hostCandidates.find(
        (participant) =>
          participant.id === selectedHostId
      );

    const confirmed = window.confirm(
      `Transfer hosting rights to ${
        selectedHost?.name ||
        "this participant"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setChangingHost(true);
      setError("");
      setSuccessMessage("");

      await changeMeetingHost(
        meetingId,
        selectedHostId
      );

      if (selectedHost) {
        setLocalHost(selectedHost.raw);
      }

      setSelectedHostId("");
      setShowHostForm(false);

      setSuccessMessage(
        "Meeting host changed successfully."
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to change the meeting host."
      );
    } finally {
      setChangingHost(false);
    }
  };

  const renderManagerCard = (
    manager
  ) => {
    const isRemoving =
      removingManagerId === manager.id;

    return (
      <article
        key={manager.key}
        className="meeting-managers__manager-card"
      >
        <MeetingManagerAvatar
          person={manager}
        />

        <div className="meeting-managers__manager-details">
          <strong>{manager.name}</strong>

          <span>
            {manager.position ||
              manager.email ||
              "Meeting participant"}
          </span>

          {manager.county && (
            <small>
              {manager.county}
            </small>
          )}
        </div>

        {canManage && (
          <button
            type="button"
            className="meeting-managers__remove-button"
            onClick={() =>
              handleRemoveManager(manager)
            }
            disabled={
              isRemoving ||
              !manager.id
            }
            aria-label={`Remove ${manager.name}`}
          >
            <FiTrash2 />

            {isRemoving
              ? "Removing..."
              : "Remove"}
          </button>
        )}
      </article>
    );
  };

  return (
    <section className="meeting-managers">
      <div className="meeting-managers__header">
        <div>
          <span className="meeting-managers__eyebrow">
            Meeting leadership
          </span>

          <h2>
            <FiUsers />
            Hosts, Co-hosts and Moderators
          </h2>

          <p>
            Assign meeting leadership roles and
            control who can manage the live room.
          </p>
        </div>

        {canManage && (
          <div className="meeting-managers__header-actions">
            {canChangeHost && (
            <button
              type="button"
              className="meeting-managers__secondary-button"
              onClick={() =>
                setShowHostForm(
                  (current) => !current
                )
              }
            >
             <FiAward />

              {showHostForm
                ? "Close host transfer"
                : "Change host"}
            </button>
            )}

            <button
              type="button"
              className="meeting-managers__primary-button"
              onClick={() =>
                setShowManagerForm(
                  (current) => !current
                )
              }
            >
              {showManagerForm ? (
                <FiX />
              ) : (
                <FiUserCheck />
              )}

              {showManagerForm
                ? "Close manager form"
                : "Add managers"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="meeting-managers__alert meeting-managers__alert--error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="meeting-managers__alert meeting-managers__alert--success">
          {successMessage}
        </div>
      )}

      <div className="meeting-managers__summary">
        <article>
          <span>
            <FiAward />
          </span>

          <div>
            <small>Host</small>
            <strong>
              {normalizedHost ? 1 : 0}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <FiUserCheck />
          </span>

          <div>
            <small>Co-hosts</small>
            <strong>
              {normalizedCoHosts.length}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <FiShield />
          </span>

          <div>
            <small>Moderators</small>
            <strong>
              {normalizedModerators.length}
            </strong>
          </div>
        </article>
      </div>

      {canChangeHost && showHostForm && (
        <section className="meeting-managers__form-panel">
          <div className="meeting-managers__form-heading">
            <div>
              <h3>Change meeting host</h3>

              <p>
                Transfer the main hosting role to
                another participant.
              </p>
            </div>
          </div>

          <div className="meeting-managers__host-transfer">
            <label>
              <span>New meeting host</span>

              <div className="meeting-managers__select-wrapper">
                <FiUser />

                <select
                  value={selectedHostId}
                  onChange={(event) =>
                    setSelectedHostId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select participant
                  </option>

                  {hostCandidates.map(
                    (participant) => (
                      <option
                        key={participant.id}
                        value={participant.id}
                      >
                        {participant.name}
                        {participant.position
                          ? ` — ${participant.position}`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                <FiChevronDown />
              </div>
            </label>

            <button
              type="button"
              className="meeting-managers__transfer-button"
              onClick={handleChangeHost}
              disabled={
                changingHost ||
                !selectedHostId
              }
            >
              <FiAward />

              {changingHost
                ? "Changing host..."
                : "Transfer host role"}
            </button>
          </div>
        </section>
      )}

      {canManage && showManagerForm && (
        <section className="meeting-managers__form-panel">
          <div className="meeting-managers__form-heading">
            <div>
              <h3>Add meeting managers</h3>

              <p>
                Select participants and assign them
                as co-hosts or moderators.
              </p>
            </div>
          </div>

          <label className="meeting-managers__search">
            <FiSearch />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search participants"
            />
          </label>

          <div className="meeting-managers__candidate-list">
            {availableParticipants.length ? (
              availableParticipants.map(
                (participant) => {
                  const isHost =
                    participant.id === hostId;

                  const isExistingCoHost =
                    existingCoHostIds.has(
                      participant.id
                    );

                  const isExistingModerator =
                    existingModeratorIds.has(
                      participant.id
                    );

                  const coHostSelected =
                    selectedCoHosts.includes(
                      participant.id
                    );

                  const moderatorSelected =
                    selectedModerators.includes(
                      participant.id
                    );

                  return (
                    <article
                      key={participant.key}
                      className="meeting-managers__candidate"
                    >
                      <MeetingManagerAvatar
                        person={participant}
                      />

                      <div className="meeting-managers__candidate-details">
                        <strong>
                          {participant.name}
                        </strong>

                        <span>
                          {participant.position ||
                            participant.email ||
                            "Meeting participant"}
                        </span>

                        {participant.county && (
                          <small>
                            {participant.county}
                          </small>
                        )}
                      </div>

                      <div className="meeting-managers__candidate-actions">
                        {isHost ? (
                          <span className="meeting-managers__role-label meeting-managers__role-label--host">
                            <FiAward />
                            Host
                          </span>
                        ) : isExistingCoHost ? (
                          <span className="meeting-managers__role-label meeting-managers__role-label--cohost">
                            <FiUserCheck />
                            Co-host
                          </span>
                        ) : isExistingModerator ? (
                          <span className="meeting-managers__role-label meeting-managers__role-label--moderator">
                            <FiShield />
                            Moderator
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={
                                coHostSelected
                                  ? "meeting-managers__role-button meeting-managers__role-button--selected"
                                  : "meeting-managers__role-button"
                              }
                              onClick={() =>
                                toggleSelectedManager(
                                  participant.id,
                                  "co_host"
                                )
                              }
                            >
                              {coHostSelected && (
                                <FiCheck />
                              )}

                              Co-host
                            </button>

                            <button
                              type="button"
                              className={
                                moderatorSelected
                                  ? "meeting-managers__role-button meeting-managers__role-button--selected"
                                  : "meeting-managers__role-button"
                              }
                              onClick={() =>
                                toggleSelectedManager(
                                  participant.id,
                                  "moderator"
                                )
                              }
                            >
                              {moderatorSelected && (
                                <FiCheck />
                              )}

                              Moderator
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                }
              )
            ) : (
              <div className="meeting-managers__candidate-empty">
                No matching participants found.
              </div>
            )}
          </div>

          <div className="meeting-managers__form-footer">
            <div>
              <span>
                {selectedCoHosts.length} co-host
                {selectedCoHosts.length === 1
                  ? ""
                  : "s"}
              </span>

              <span>
                {selectedModerators.length} moderator
                {selectedModerators.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <div>
              <button
                type="button"
                className="meeting-managers__secondary-button"
                onClick={resetManagerForm}
                disabled={savingManagers}
              >
                Cancel
              </button>

              <button
                type="button"
                className="meeting-managers__primary-button"
                onClick={handleSaveManagers}
                disabled={
                  savingManagers ||
                  (
                    !selectedCoHosts.length &&
                    !selectedModerators.length
                  )
                }
              >
                <FiCheck />

                {savingManagers
                  ? "Saving..."
                  : "Save managers"}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="meeting-managers__host-card">
        <div className="meeting-managers__host-badge">
          <FiAward />
          Primary host
        </div>

        {normalizedHost ? (
          <div className="meeting-managers__host-content">
            <MeetingManagerAvatar
              person={normalizedHost}
              large
            />

            <div>
              <h3>
                {normalizedHost.name}
              </h3>

              <p>
                {normalizedHost.position ||
                  normalizedHost.email ||
                  "Meeting host"}
              </p>

              {normalizedHost.county && (
                <span>
                  {normalizedHost.county}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="meeting-managers__empty-host">
            <FiUser />
            No meeting host has been assigned.
          </div>
        )}
      </section>

      <div className="meeting-managers__groups">
        <section className="meeting-managers__group">
          <div className="meeting-managers__group-header">
            <div>
              <span>
                <FiUserCheck />
              </span>

              <div>
                <h3>Co-hosts</h3>

                <p>
                  Assist the host with room and
                  participant management.
                </p>
              </div>
            </div>

            <strong>
              {normalizedCoHosts.length}
            </strong>
          </div>

          <div className="meeting-managers__manager-list">
            {normalizedCoHosts.length ? (
              normalizedCoHosts.map(
                renderManagerCard
              )
            ) : (
              <div className="meeting-managers__empty">
                <FiUserCheck />

                <span>
                  No co-hosts assigned.
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="meeting-managers__group">
          <div className="meeting-managers__group-header">
            <div>
              <span>
                <FiShield />
              </span>

              <div>
                <h3>Moderators</h3>

                <p>
                  Help manage discussions and
                  participant conduct.
                </p>
              </div>
            </div>

            <strong>
              {normalizedModerators.length}
            </strong>
          </div>

          <div className="meeting-managers__manager-list">
            {normalizedModerators.length ? (
              normalizedModerators.map(
                renderManagerCard
              )
            ) : (
              <div className="meeting-managers__empty">
                <FiShield />

                <span>
                  No moderators assigned.
                </span>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
};

export default MeetingManagers;