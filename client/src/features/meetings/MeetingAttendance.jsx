import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiDownload,
  FiSearch,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

import {
  getMeetingAttendance,
  updateParticipantAttendance,
} from "../../services/meeting.service";

import "./MeetingAttendance.css";

const ATTENDANCE_OPTIONS = [
  {
    value: "present",
    label: "Present",
  },
  {
    value: "late",
    label: "Late",
  },
  {
    value: "absent",
    label: "Absent",
  },
  {
    value: "excused",
    label: "Excused",
  },
  {
    value: "left_early",
    label: "Left early",
  },
];

const ATTENDANCE_LABELS = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  excused: "Excused",
  left_early: "Left early",
  pending: "Pending",
  not_marked: "Not marked",
};

const INVITATION_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  tentative: "Tentative",
};

const getId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id || value.id || "";
};

const getAttendanceUser = (record) => {
  return (
    record?.user ||
    record?.participant?.user ||
    record?.participant ||
    record?.member?.user ||
    record
  );
};

const getAttendanceUserId = (record) => {
  const user = getAttendanceUser(record);

  return (
    getId(user) ||
    getId(record?.userId) ||
    getId(record?.participantUserId)
  );
};

const getFullName = (record) => {
  const user = getAttendanceUser(record);

  const member =
    user?.member ||
    record?.member ||
    record?.participant?.member;

  const composedName = [
    member?.firstName,
    member?.middleName,
    member?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    composedName ||
    user?.fullName ||
    record?.fullName ||
    user?.name ||
    user?.email ||
    "Unknown participant"
  );
};

const getEmail = (record) => {
  const user = getAttendanceUser(record);

  return (
    user?.email ||
    record?.email ||
    record?.participant?.email ||
    ""
  );
};

const getProfilePhoto = (record) => {
  const user = getAttendanceUser(record);

  return (
    user?.member?.profilePhoto ||
    record?.member?.profilePhoto ||
    user?.profilePhoto ||
    record?.profilePhoto ||
    ""
  );
};

const getLeadershipLabel = (record) => {
  const user = getAttendanceUser(record);

  return (
    user?.displayLeadership ||
    record?.displayLeadership ||
    user?.member?.displayLeadership ||
    record?.leadershipLabel ||
    record?.position ||
    "Member"
  );
};

const getCounty = (record) => {
  const user = getAttendanceUser(record);

  return (
    user?.member?.county ||
    record?.member?.county ||
    user?.county ||
    record?.county ||
    ""
  );
};

const getAttendanceStatus = (record) => {
  return (
    record?.attendanceStatus ||
    record?.status ||
    record?.participant?.attendanceStatus ||
    "pending"
  );
};

const getInvitationStatus = (record) => {
  return (
    record?.invitationStatus ||
    record?.participant?.invitationStatus ||
    "pending"
  );
};

const getJoinedAt = (record) => {
  return (
    record?.joinedAt ||
    record?.joinTime ||
    record?.participant?.joinedAt ||
    null
  );
};

const getLeftAt = (record) => {
  return (
    record?.leftAt ||
    record?.leaveTime ||
    record?.participant?.leftAt ||
    null
  );
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDuration = (
  joinedAt,
  leftAt,
  suppliedDuration
) => {
  if (
    typeof suppliedDuration === "number" &&
    suppliedDuration >= 0
  ) {
    const totalMinutes = Math.round(
      suppliedDuration / 60
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  if (!joinedAt) {
    return "—";
  }

  const start = new Date(joinedAt);
  const end = leftAt
    ? new Date(leftAt)
    : new Date();

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return "—";
  }

  const difference =
    end.getTime() - start.getTime();

  if (difference < 0) {
    return "—";
  }

  const totalMinutes = Math.floor(
    difference / 60000
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

const normalizeAttendanceResponse = (response) => {
  const possibleRecords = [
    response?.data?.attendance,
    response?.data?.participants,
    response?.data?.records,
    response?.data,
    response?.attendance,
    response?.participants,
  ];

  const records = possibleRecords.find(
    Array.isArray
  );

  return records || [];
};

const MeetingAttendance = ({
  meetingId,
  canManage = false,
  onMeetingRefresh,
}) => {
  const [attendanceRecords, setAttendanceRecords] =
    useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [countyFilter, setCountyFilter] =
    useState("all");

  const [selectedUserIds, setSelectedUserIds] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] =
    useState("");

  const [bulkUpdating, setBulkUpdating] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadAttendance = useCallback(async () => {
    if (!meetingId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await getMeetingAttendance(meetingId);

      setAttendanceRecords(
        normalizeAttendanceResponse(response)
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to load meeting attendance."
      );
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const normalizedRecords = useMemo(() => {
    return attendanceRecords.map(
      (record, index) => {
        const joinedAt = getJoinedAt(record);
        const leftAt = getLeftAt(record);

        return {
          raw: record,
          key:
            record?._id ||
            getAttendanceUserId(record) ||
            index,
          userId: getAttendanceUserId(record),
          fullName: getFullName(record),
          email: getEmail(record),
          profilePhoto: getProfilePhoto(record),
          displayLeadership:
            getLeadershipLabel(record),
          county: getCounty(record),
          attendanceStatus:
            getAttendanceStatus(record),
          invitationStatus:
            getInvitationStatus(record),
          joinedAt,
          leftAt,
          duration: formatDuration(
            joinedAt,
            leftAt,
            record?.duration ||
              record?.durationSeconds
          ),
        };
      }
    );
  }, [attendanceRecords]);

  const counties = useMemo(() => {
    return [
      ...new Set(
        normalizedRecords
          .map((record) => record.county)
          .filter(Boolean)
      ),
    ].sort((first, second) =>
      first.localeCompare(second)
    );
  }, [normalizedRecords]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return normalizedRecords.filter((record) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          record.fullName,
          record.email,
          record.displayLeadership,
          record.county,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(normalizedSearch)
          );

      const matchesStatus =
        statusFilter === "all" ||
        record.attendanceStatus === statusFilter;

      const matchesCounty =
        countyFilter === "all" ||
        record.county === countyFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCounty
      );
    });
  }, [
    normalizedRecords,
    search,
    statusFilter,
    countyFilter,
  ]);

  const attendanceSummary = useMemo(() => {
    const summary = {
      total: normalizedRecords.length,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      left_early: 0,
      pending: 0,
    };

    normalizedRecords.forEach((record) => {
      const status = record.attendanceStatus;

      if (
        Object.prototype.hasOwnProperty.call(
          summary,
          status
        )
      ) {
        summary[status] += 1;
      } else {
        summary.pending += 1;
      }
    });

    const attended =
      summary.present +
      summary.late +
      summary.left_early;

    const attendanceRate = summary.total
      ? Math.round(
          (attended / summary.total) * 100
        )
      : 0;

    return {
      ...summary,
      attended,
      attendanceRate,
    };
  }, [normalizedRecords]);

  const allVisibleSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((record) =>
      selectedUserIds.includes(record.userId)
    );

  const toggleUserSelection = (userId) => {
    if (!userId) {
      return;
    }

    setSelectedUserIds((currentIds) => {
      if (currentIds.includes(userId)) {
        return currentIds.filter(
          (currentId) => currentId !== userId
        );
      }

      return [...currentIds, userId];
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleUserIds = filteredRecords
      .map((record) => record.userId)
      .filter(Boolean);

    if (allVisibleSelected) {
      setSelectedUserIds((currentIds) =>
        currentIds.filter(
          (userId) =>
            !visibleUserIds.includes(userId)
        )
      );

      return;
    }

    setSelectedUserIds((currentIds) => [
      ...new Set([
        ...currentIds,
        ...visibleUserIds,
      ]),
    ]);
  };

  const handleAttendanceUpdate = async (
    userId,
    attendanceStatus
  ) => {
    if (
      !meetingId ||
      !userId ||
      !attendanceStatus
    ) {
      return;
    }

    try {
      setUpdatingUserId(userId);
      setError("");
      setSuccessMessage("");

      await updateParticipantAttendance(
        meetingId,
        userId,
        attendanceStatus
      );

      setAttendanceRecords((currentRecords) =>
        currentRecords.map((record) => {
          if (
            getAttendanceUserId(record) !== userId
          ) {
            return record;
          }

          return {
            ...record,
            attendanceStatus,
          };
        })
      );

      setSuccessMessage(
        "Attendance updated successfully."
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to update attendance."
      );
    } finally {
      setUpdatingUserId("");
    }
  };

  const handleBulkAttendanceUpdate = async (
    attendanceStatus
  ) => {
    if (!selectedUserIds.length) {
      return;
    }

    try {
      setBulkUpdating(true);
      setError("");
      setSuccessMessage("");

      await Promise.all(
        selectedUserIds.map((userId) =>
          updateParticipantAttendance(
            meetingId,
            userId,
            attendanceStatus
          )
        )
      );

      setAttendanceRecords((currentRecords) =>
        currentRecords.map((record) => {
          const userId =
            getAttendanceUserId(record);

          if (!selectedUserIds.includes(userId)) {
            return record;
          }

          return {
            ...record,
            attendanceStatus,
          };
        })
      );

      setSuccessMessage(
        `${selectedUserIds.length} attendance record${
          selectedUserIds.length === 1
            ? ""
            : "s"
        } updated successfully.`
      );

      setSelectedUserIds([]);

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to update the selected attendance records."
      );
    } finally {
      setBulkUpdating(false);
    }
  };

  const exportAttendance = () => {
    const headings = [
      "Name",
      "Email",
      "Leadership",
      "County",
      "Invitation",
      "Attendance",
      "Joined",
      "Left",
      "Duration",
    ];

    const rows = filteredRecords.map((record) => [
      record.fullName,
      record.email,
      record.displayLeadership,
      record.county,
      INVITATION_LABELS[
        record.invitationStatus
      ] || record.invitationStatus,
      ATTENDANCE_LABELS[
        record.attendanceStatus
      ] || record.attendanceStatus,
      formatDateTime(record.joinedAt),
      formatDateTime(record.leftAt),
      record.duration,
    ]);

    const csvContent = [headings, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const safeValue = String(
              value ?? ""
            ).replace(/"/g, '""');

            return `"${safeValue}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const downloadUrl =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = `meeting-attendance-${meetingId}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(downloadUrl);
  };

  if (loading) {
    return (
      <section className="meeting-attendance">
        <div className="meeting-attendance__loading">
          <div className="meeting-attendance__spinner" />

          <p>Loading attendance register...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="meeting-attendance">
      <div className="meeting-attendance__header">
        <div>
          <span className="meeting-attendance__eyebrow">
            Meeting register
          </span>

          <h2>
            <FiUserCheck />
            Attendance
          </h2>

          <p>
            Review participant attendance, meeting
            entry times and attendance status.
          </p>
        </div>

        <button
          type="button"
          className="meeting-attendance__export-button"
          onClick={exportAttendance}
          disabled={!filteredRecords.length}
        >
          <FiDownload />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="meeting-attendance__alert meeting-attendance__alert--error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="meeting-attendance__alert meeting-attendance__alert--success">
          {successMessage}
        </div>
      )}

      <div className="meeting-attendance__summary">
        <article className="meeting-attendance__summary-card">
          <span className="meeting-attendance__summary-icon">
            <FiUsers />
          </span>

          <div>
            <small>Total invited</small>
            <strong>
              {attendanceSummary.total}
            </strong>
          </div>
        </article>

        <article className="meeting-attendance__summary-card meeting-attendance__summary-card--present">
          <span className="meeting-attendance__summary-icon">
            <FiCheckCircle />
          </span>

          <div>
            <small>Present</small>
            <strong>
              {attendanceSummary.present}
            </strong>
          </div>
        </article>

        <article className="meeting-attendance__summary-card meeting-attendance__summary-card--late">
          <span className="meeting-attendance__summary-icon">
            <FiClock />
          </span>

          <div>
            <small>Late</small>
            <strong>
              {attendanceSummary.late}
            </strong>
          </div>
        </article>

        <article className="meeting-attendance__summary-card meeting-attendance__summary-card--absent">
          <span className="meeting-attendance__summary-icon">
            <FiUsers />
          </span>

          <div>
            <small>Absent</small>
            <strong>
              {attendanceSummary.absent}
            </strong>
          </div>
        </article>

        <article className="meeting-attendance__summary-card meeting-attendance__summary-card--rate">
          <div>
            <small>Attendance rate</small>

            <strong>
              {attendanceSummary.attendanceRate}%
            </strong>

            <div className="meeting-attendance__progress">
              <span
                style={{
                  width: `${attendanceSummary.attendanceRate}%`,
                }}
              />
            </div>
          </div>
        </article>
      </div>

      <div className="meeting-attendance__toolbar">
        <label className="meeting-attendance__search">
          <FiSearch />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search participant, email, position or county"
          />
        </label>

        <label className="meeting-attendance__filter">
          <span>Status</span>

          <div>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All statuses
              </option>

              {ATTENDANCE_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}

              <option value="pending">
                Pending
              </option>
            </select>

            <FiChevronDown />
          </div>
        </label>

        <label className="meeting-attendance__filter">
          <span>County</span>

          <div>
            <select
              value={countyFilter}
              onChange={(event) =>
                setCountyFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All counties
              </option>

              {counties.map((county) => (
                <option
                  key={county}
                  value={county}
                >
                  {county}
                </option>
              ))}
            </select>

            <FiChevronDown />
          </div>
        </label>
      </div>

      {canManage &&
        selectedUserIds.length > 0 && (
          <div className="meeting-attendance__bulk-actions">
            <span>
              {selectedUserIds.length} selected
            </span>

            <div>
              <button
                type="button"
                onClick={() =>
                  handleBulkAttendanceUpdate(
                    "present"
                  )
                }
                disabled={bulkUpdating}
              >
                Mark present
              </button>

              <button
                type="button"
                onClick={() =>
                  handleBulkAttendanceUpdate(
                    "late"
                  )
                }
                disabled={bulkUpdating}
              >
                Mark late
              </button>

              <button
                type="button"
                onClick={() =>
                  handleBulkAttendanceUpdate(
                    "absent"
                  )
                }
                disabled={bulkUpdating}
              >
                Mark absent
              </button>

              <button
                type="button"
                onClick={() =>
                  handleBulkAttendanceUpdate(
                    "excused"
                  )
                }
                disabled={bulkUpdating}
              >
                Mark excused
              </button>
            </div>
          </div>
        )}

      {!filteredRecords.length ? (
        <div className="meeting-attendance__empty">
          <FiUserCheck />

          <h3>No attendance records found</h3>

          <p>
            Attendance records will appear when
            participants are added to the meeting.
          </p>
        </div>
      ) : (
        <div className="meeting-attendance__table-wrapper">
          <table className="meeting-attendance__table">
            <thead>
              <tr>
                {canManage && (
                  <th className="meeting-attendance__checkbox-column">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={
                        toggleSelectAllVisible
                      }
                      aria-label="Select all visible participants"
                    />
                  </th>
                )}

                <th>Participant</th>
                <th>Invitation</th>
                <th>Attendance</th>
                <th>Joined</th>
                <th>Left</th>
                <th>Duration</th>

                {canManage && <th>Action</th>}
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record) => {
                const isUpdating =
                  updatingUserId ===
                  record.userId;

                return (
                  <tr key={record.key}>
                    {canManage && (
                      <td className="meeting-attendance__checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(
                            record.userId
                          )}
                          onChange={() =>
                            toggleUserSelection(
                              record.userId
                            )
                          }
                          disabled={!record.userId}
                          aria-label={`Select ${record.fullName}`}
                        />
                      </td>
                    )}

                    <td>
                      <div className="meeting-attendance__participant">
                        <div className="meeting-attendance__avatar">
                          {record.profilePhoto ? (
                            <img
                              src={
                                record.profilePhoto
                              }
                              alt={
                                record.fullName
                              }
                            />
                          ) : (
                            <span>
                              {record.fullName
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div>
                          <strong>
                            {record.fullName}
                          </strong>

                          <small>
                            {
                              record.displayLeadership
                            }
                          </small>

                          <span>
                            {[
                              record.email,
                              record.county,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`meeting-attendance__badge meeting-attendance__badge--invitation-${record.invitationStatus}`}
                      >
                        {INVITATION_LABELS[
                          record.invitationStatus
                        ] ||
                          record.invitationStatus}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`meeting-attendance__badge meeting-attendance__badge--${record.attendanceStatus}`}
                      >
                        {ATTENDANCE_LABELS[
                          record.attendanceStatus
                        ] ||
                          record.attendanceStatus}
                      </span>
                    </td>

                    <td>
                      {formatDateTime(
                        record.joinedAt
                      )}
                    </td>

                    <td>
                      {formatDateTime(
                        record.leftAt
                      )}
                    </td>

                    <td>{record.duration}</td>

                    {canManage && (
                      <td>
                        <select
                          className="meeting-attendance__status-select"
                          value={
                            record.attendanceStatus
                          }
                          onChange={(event) =>
                            handleAttendanceUpdate(
                              record.userId,
                              event.target.value
                            )
                          }
                          disabled={
                            isUpdating ||
                            !record.userId
                          }
                        >
                          <option value="pending">
                            Pending
                          </option>

                          {ATTENDANCE_OPTIONS.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {
                                  option.label
                                }
                              </option>
                            )
                          )}
                        </select>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="meeting-attendance__footer">
        Showing {filteredRecords.length} of{" "}
        {normalizedRecords.length} attendance
        records
      </div>
    </section>
  );
};

export default MeetingAttendance;