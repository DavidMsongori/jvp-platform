import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiPlus,
  FiSearch,
  FiShield,
  FiThumbsDown,
  FiThumbsUp,
  FiUser,
  FiX,
} from "react-icons/fi";

import {
  addMeetingResolution,
  updateMeetingResolutionApproval,
} from "../../services/meeting.service";

import "./MeetingResolutions.css";

const EMPTY_RESOLUTION = {
  title: "",
  description: "",
  resolutionNumber: "",
  proposedBy: "",
  secondedBy: "",
  implementationDeadline: "",
  notes: "",
};

const APPROVAL_FILTERS = [
  {
    value: "all",
    label: "All resolutions",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

const getResolutionId = (resolution) => {
  return resolution?._id || resolution?.id || "";
};

const getPersonName = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  const member =
    value?.member ||
    value?.user?.member;

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
    value?.fullName ||
    value?.name ||
    value?.email ||
    value?.user?.fullName ||
    value?.user?.email ||
    ""
  );
};

const getResolutionStatus = (resolution) => {
  if (
    resolution?.approved === true ||
    resolution?.isApproved === true ||
    resolution?.approvalStatus === "approved" ||
    resolution?.status === "approved"
  ) {
    return "approved";
  }

  if (
    resolution?.approved === false &&
    (
      resolution?.approvalStatus === "rejected" ||
      resolution?.status === "rejected"
    )
  ) {
    return "rejected";
  }

  return "pending";
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const normalizeResolution = (
  resolution,
  index
) => {
  const id = getResolutionId(resolution);

  return {
    raw: resolution,

    id,

    key:
      id ||
      `${resolution?.title || "resolution"}-${index}`,

    title:
      resolution?.title ||
      resolution?.subject ||
      `Resolution ${index + 1}`,

    description:
      resolution?.description ||
      resolution?.resolution ||
      resolution?.content ||
      "",

    resolutionNumber:
      resolution?.resolutionNumber ||
      resolution?.number ||
      "",

    proposedBy: getPersonName(
      resolution?.proposedBy ||
      resolution?.movedBy
    ),

    secondedBy: getPersonName(
      resolution?.secondedBy
    ),

    createdBy: getPersonName(
      resolution?.createdBy ||
      resolution?.addedBy
    ),

    approvedBy: getPersonName(
      resolution?.approvedBy
    ),

    approvedAt:
      resolution?.approvedAt ||
      resolution?.approvalDate ||
      "",

    createdAt:
      resolution?.createdAt ||
      resolution?.addedAt ||
      "",

    implementationDeadline:
      resolution?.implementationDeadline ||
      resolution?.deadline ||
      resolution?.dueDate ||
      "",

    notes:
      resolution?.notes ||
      resolution?.remarks ||
      "",

    status: getResolutionStatus(resolution),
  };
};

const MeetingResolutions = ({
  meetingId,
  resolutions = [],
  canManage = false,
  canApprove = false,
  onMeetingRefresh,
}) => {
  const [showForm, setShowForm] =
    useState(false);

  const [formData, setFormData] =
    useState(EMPTY_RESOLUTION);

  const [localResolutions, setLocalResolutions] =
    useState(
      Array.isArray(resolutions)
        ? resolutions
        : []
    );

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [submitting, setSubmitting] =
    useState(false);

  const [
    updatingResolutionId,
    setUpdatingResolutionId,
  ] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    setLocalResolutions(
      Array.isArray(resolutions)
        ? resolutions
        : []
    );
  }, [resolutions]);

  const normalizedResolutions = useMemo(() => {
    return localResolutions.map(
      normalizeResolution
    );
  }, [localResolutions]);

  const filteredResolutions = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return normalizedResolutions.filter(
      (resolution) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            resolution.title,
            resolution.description,
            resolution.resolutionNumber,
            resolution.proposedBy,
            resolution.secondedBy,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(normalizedSearch)
            );

        const matchesStatus =
          statusFilter === "all" ||
          resolution.status === statusFilter;

        return matchesSearch && matchesStatus;
      }
    );
  }, [
    normalizedResolutions,
    search,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    return normalizedResolutions.reduce(
      (result, resolution) => {
        result.total += 1;

        if (resolution.status === "approved") {
          result.approved += 1;
        } else if (
          resolution.status === "rejected"
        ) {
          result.rejected += 1;
        } else {
          result.pending += 1;
        }

        return result;
      },
      {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      }
    );
  }, [normalizedResolutions]);

  const handleInputChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(EMPTY_RESOLUTION);
    setShowForm(false);
    setError("");
  };

  const handleAddResolution = async (
    event
  ) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError(
        "Please enter a title for the resolution."
      );

      return;
    }

    if (!formData.description.trim()) {
      setError(
        "Please enter the resolution details."
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const resolutionData = {
        title: formData.title.trim(),

        description:
          formData.description.trim(),

        resolutionNumber:
          formData.resolutionNumber.trim(),

        proposedBy:
          formData.proposedBy.trim(),

        secondedBy:
          formData.secondedBy.trim(),

        implementationDeadline:
          formData.implementationDeadline ||
          null,

        notes:
          formData.notes.trim(),
      };

      const response =
        await addMeetingResolution(
          meetingId,
          resolutionData
        );

      const createdResolution =
        response?.data?.resolution ||
        response?.resolution ||
        response?.data ||
        null;

      if (
        createdResolution &&
        typeof createdResolution === "object" &&
        !Array.isArray(createdResolution)
      ) {
        setLocalResolutions(
          (currentResolutions) => [
            ...currentResolutions,
            createdResolution,
          ]
        );
      }

      setSuccessMessage(
        "Resolution added successfully."
      );

      resetForm();

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to add the meeting resolution."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovalUpdate = async (
    resolution,
    approved
  ) => {
    if (!resolution.id) {
      setError(
        "This resolution does not have a valid ID."
      );

      return;
    }

    const actionLabel = approved
      ? "approve"
      : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} "${resolution.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingResolutionId(
        resolution.id
      );

      setError("");
      setSuccessMessage("");

      await updateMeetingResolutionApproval(
        meetingId,
        resolution.id,
        approved
      );

      setLocalResolutions(
        (currentResolutions) =>
          currentResolutions.map(
            (currentResolution) => {
              if (
                getResolutionId(
                  currentResolution
                ) !== resolution.id
              ) {
                return currentResolution;
              }

              return {
                ...currentResolution,
                approved,
                isApproved: approved,
                approvalStatus: approved
                  ? "approved"
                  : "rejected",
                status: approved
                  ? "approved"
                  : "rejected",
              };
            }
          )
      );

      setSuccessMessage(
        approved
          ? "Resolution approved successfully."
          : "Resolution rejected successfully."
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          `Unable to ${actionLabel} the resolution.`
      );
    } finally {
      setUpdatingResolutionId("");
    }
  };

  return (
    <section className="meeting-resolutions">
      <div className="meeting-resolutions__header">
        <div>
          <span className="meeting-resolutions__eyebrow">
            Meeting decisions
          </span>

          <h2>
            <FiShield />
            Resolutions
          </h2>

          <p>
            Record, review and approve formal
            decisions made during the meeting.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="meeting-resolutions__add-button"
            onClick={() =>
              setShowForm(
                (currentValue) =>
                  !currentValue
              )
            }
          >
            {showForm ? (
              <>
                <FiX />
                Close
              </>
            ) : (
              <>
                <FiPlus />
                Add resolution
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="meeting-resolutions__alert meeting-resolutions__alert--error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="meeting-resolutions__alert meeting-resolutions__alert--success">
          {successMessage}
        </div>
      )}

      <div className="meeting-resolutions__summary">
        <article>
          <span className="meeting-resolutions__summary-icon">
            <FiFileText />
          </span>

          <div>
            <small>Total</small>
            <strong>{summary.total}</strong>
          </div>
        </article>

        <article className="meeting-resolutions__summary-approved">
          <span className="meeting-resolutions__summary-icon">
            <FiCheckCircle />
          </span>

          <div>
            <small>Approved</small>
            <strong>
              {summary.approved}
            </strong>
          </div>
        </article>

        <article className="meeting-resolutions__summary-pending">
          <span className="meeting-resolutions__summary-icon">
            <FiClock />
          </span>

          <div>
            <small>Pending</small>
            <strong>{summary.pending}</strong>
          </div>
        </article>

        <article className="meeting-resolutions__summary-rejected">
          <span className="meeting-resolutions__summary-icon">
            <FiThumbsDown />
          </span>

          <div>
            <small>Rejected</small>
            <strong>
              {summary.rejected}
            </strong>
          </div>
        </article>
      </div>

      {canManage && showForm && (
        <form
          className="meeting-resolutions__form"
          onSubmit={handleAddResolution}
        >
          <div className="meeting-resolutions__form-header">
            <div>
              <h3>Add meeting resolution</h3>

              <p>
                Record the formal decision exactly
                as adopted by the meeting.
              </p>
            </div>
          </div>

          <div className="meeting-resolutions__form-grid">
            <label>
              <span>
                Resolution number
                <small>Optional</small>
              </span>

              <input
                type="text"
                name="resolutionNumber"
                value={
                  formData.resolutionNumber
                }
                onChange={handleInputChange}
                placeholder="Example: JVP/RES/2026/001"
                maxLength={100}
              />
            </label>

            <label>
              <span>Resolution title</span>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter the resolution title"
                maxLength={200}
                required
              />
            </label>

            <label className="meeting-resolutions__full-width">
              <span>Resolution details</span>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={7}
                placeholder="State the full resolution as adopted by the meeting."
                required
              />
            </label>

            <label>
              <span>
                Proposed by
                <small>Optional</small>
              </span>

              <input
                type="text"
                name="proposedBy"
                value={formData.proposedBy}
                onChange={handleInputChange}
                placeholder="Name of proposer"
                maxLength={150}
              />
            </label>

            <label>
              <span>
                Seconded by
                <small>Optional</small>
              </span>

              <input
                type="text"
                name="secondedBy"
                value={formData.secondedBy}
                onChange={handleInputChange}
                placeholder="Name of seconder"
                maxLength={150}
              />
            </label>

            <label>
              <span>
                Implementation deadline
                <small>Optional</small>
              </span>

              <input
                type="date"
                name="implementationDeadline"
                value={
                  formData.implementationDeadline
                }
                onChange={handleInputChange}
              />
            </label>

            <label>
              <span>
                Additional notes
                <small>Optional</small>
              </span>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Add implementation notes or conditions."
              />
            </label>
          </div>

          <div className="meeting-resolutions__form-footer">
            <button
              type="button"
              className="meeting-resolutions__cancel-button"
              onClick={resetForm}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="meeting-resolutions__submit-button"
              disabled={submitting}
            >
              <FiPlus />

              {submitting
                ? "Adding resolution..."
                : "Add resolution"}
            </button>
          </div>
        </form>
      )}

      <div className="meeting-resolutions__toolbar">
        <label className="meeting-resolutions__search">
          <FiSearch />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search resolutions"
          />
        </label>

        <label className="meeting-resolutions__filter">
          <span>Status</span>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            {APPROVAL_FILTERS.map(
              (filter) => (
                <option
                  key={filter.value}
                  value={filter.value}
                >
                  {filter.label}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      {!filteredResolutions.length ? (
        <div className="meeting-resolutions__empty">
          <div className="meeting-resolutions__empty-icon">
            <FiShield />
          </div>

          <h3>No resolutions found</h3>

          <p>
            Formal decisions made during the
            meeting will appear here.
          </p>

          {canManage &&
            !showForm &&
            !normalizedResolutions.length && (
              <button
                type="button"
                onClick={() =>
                  setShowForm(true)
                }
              >
                <FiPlus />
                Add the first resolution
              </button>
            )}
        </div>
      ) : (
        <div className="meeting-resolutions__list">
          {filteredResolutions.map(
            (resolution, index) => {
              const isUpdating =
                updatingResolutionId ===
                resolution.id;

              return (
                <article
                  key={resolution.key}
                  className={`meeting-resolutions__card meeting-resolutions__card--${resolution.status}`}
                >
                  <div className="meeting-resolutions__card-header">
                    <div className="meeting-resolutions__number">
                      {resolution.resolutionNumber ||
                        `RES-${String(
                          index + 1
                        ).padStart(3, "0")}`}
                    </div>

                    <span
                      className={`meeting-resolutions__status meeting-resolutions__status--${resolution.status}`}
                    >
                      {resolution.status ===
                      "approved" ? (
                        <FiCheckCircle />
                      ) : resolution.status ===
                        "rejected" ? (
                        <FiThumbsDown />
                      ) : (
                        <FiClock />
                      )}

                      {resolution.status}
                    </span>
                  </div>

                  <div className="meeting-resolutions__card-body">
                    <h3>{resolution.title}</h3>

                    <p>
                      {resolution.description}
                    </p>

                    {(resolution.proposedBy ||
                      resolution.secondedBy) && (
                      <div className="meeting-resolutions__movers">
                        {resolution.proposedBy && (
                          <span>
                            <FiUser />
                            Proposed by{" "}
                            <strong>
                              {
                                resolution.proposedBy
                              }
                            </strong>
                          </span>
                        )}

                        {resolution.secondedBy && (
                          <span>
                            <FiUser />
                            Seconded by{" "}
                            <strong>
                              {
                                resolution.secondedBy
                              }
                            </strong>
                          </span>
                        )}
                      </div>
                    )}

                    {resolution.notes && (
                      <div className="meeting-resolutions__notes">
                        <strong>Notes</strong>

                        <p>{resolution.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="meeting-resolutions__card-meta">
                    <div>
                      <span>Recorded</span>

                      <strong>
                        {formatDate(
                          resolution.createdAt
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Implementation deadline
                      </span>

                      <strong>
                        {formatDate(
                          resolution.implementationDeadline
                        )}
                      </strong>
                    </div>

                    {resolution.status ===
                      "approved" && (
                      <div>
                        <span>Approved</span>

                        <strong>
                          {resolution.approvedAt
                            ? formatDateTime(
                                resolution.approvedAt
                              )
                            : "Approved"}
                        </strong>
                      </div>
                    )}
                  </div>

                  {resolution.status ===
                    "approved" &&
                    resolution.approvedBy && (
                      <div className="meeting-resolutions__approval-details">
                        <FiCheck />

                        Approved by{" "}
                        <strong>
                          {resolution.approvedBy}
                        </strong>
                      </div>
                    )}

                  {canApprove &&
                    resolution.status !==
                      "approved" && (
                      <div className="meeting-resolutions__card-actions">
                        <button
                          type="button"
                          className="meeting-resolutions__reject-button"
                          onClick={() =>
                            handleApprovalUpdate(
                              resolution,
                              false
                            )
                          }
                          disabled={
                            isUpdating ||
                            !resolution.id
                          }
                        >
                          <FiThumbsDown />

                          {isUpdating
                            ? "Updating..."
                            : "Reject"}
                        </button>

                        <button
                          type="button"
                          className="meeting-resolutions__approve-button"
                          onClick={() =>
                            handleApprovalUpdate(
                              resolution,
                              true
                            )
                          }
                          disabled={
                            isUpdating ||
                            !resolution.id
                          }
                        >
                          <FiThumbsUp />

                          {isUpdating
                            ? "Updating..."
                            : "Approve"}
                        </button>
                      </div>
                    )}
                </article>
              );
            }
          )}
        </div>
      )}

      <div className="meeting-resolutions__footer">
        Showing {filteredResolutions.length} of{" "}
        {normalizedResolutions.length} resolutions
      </div>
    </section>
  );
};

export default MeetingResolutions;