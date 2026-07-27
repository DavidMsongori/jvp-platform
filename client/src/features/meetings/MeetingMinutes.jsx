import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiFileText,
  FiSave,
  FiShield,
  FiUser,
} from "react-icons/fi";

import {
  approveMeetingMinutes,
  saveMeetingMinutes,
} from "../../services/meeting.service";

import "./MeetingMinutes.css";

const EMPTY_MINUTES = {
  title: "",
  attendanceSummary: "",
  openingRemarks: "",
  discussions: "",
  decisions: "",
  closingRemarks: "",
  preparedBy: "",
};

const getMinutesValue = (
  minutes,
  possibleKeys,
  fallback = ""
) => {
  for (const key of possibleKeys) {
    if (
      minutes?.[key] !== undefined &&
      minutes?.[key] !== null
    ) {
      return minutes[key];
    }
  }

  return fallback;
};

const normalizeMeetingMinutes = (minutes) => {
  if (!minutes) {
    return EMPTY_MINUTES;
  }

  return {
    title: getMinutesValue(
      minutes,
      ["title", "minutesTitle"],
      ""
    ),

    attendanceSummary: getMinutesValue(
      minutes,
      [
        "attendanceSummary",
        "attendance",
        "attendanceNotes",
      ],
      ""
    ),

    openingRemarks: getMinutesValue(
      minutes,
      [
        "openingRemarks",
        "opening",
        "openingNotes",
      ],
      ""
    ),

    discussions: getMinutesValue(
      minutes,
      [
        "discussions",
        "discussion",
        "deliberations",
        "body",
        "content",
      ],
      ""
    ),

    decisions: getMinutesValue(
      minutes,
      [
        "decisions",
        "resolutions",
        "conclusions",
      ],
      ""
    ),

    closingRemarks: getMinutesValue(
      minutes,
      [
        "closingRemarks",
        "closing",
        "closingNotes",
      ],
      ""
    ),

    preparedBy: getMinutesValue(
      minutes,
      [
        "preparedByName",
        "preparedBy",
        "secretary",
      ],
      ""
    ),
  };
};

const getPersonName = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  const member = value.member;

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
    value.fullName ||
    value.name ||
    value.email ||
    ""
  );
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

const MeetingMinutes = ({
  meetingId,
  meetingTitle = "",
  minutes = null,
  canManage = false,
  canApprove = false,
  onMeetingRefresh,
}) => {
  const normalizedInitialMinutes = useMemo(
    () => normalizeMeetingMinutes(minutes),
    [minutes]
  );

  const [formData, setFormData] = useState(
    normalizedInitialMinutes
  );

  const [isEditing, setIsEditing] = useState(
    !minutes
  );

  const [saving, setSaving] = useState(false);
  const [approving, setApproving] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    setFormData(normalizedInitialMinutes);

    if (minutes) {
      setIsEditing(false);
    }
  }, [normalizedInitialMinutes, minutes]);

  const isApproved = Boolean(
    minutes?.approved ||
      minutes?.isApproved ||
      minutes?.approvalStatus === "approved" ||
      minutes?.status === "approved"
  );

  const approvedBy = getPersonName(
    minutes?.approvedBy
  );

  const preparedBy = getPersonName(
    minutes?.preparedBy
  );

  const lastUpdatedAt =
    minutes?.updatedAt ||
    minutes?.savedAt ||
    minutes?.createdAt;

  const approvedAt =
    minutes?.approvedAt ||
    minutes?.approvalDate;

  const hasMinutesContent = useMemo(() => {
    return Object.values(formData).some(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0
    );
  }, [formData]);

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

  const handleSaveMinutes = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError(
        "Please enter a title for the meeting minutes."
      );

      return;
    }

    if (!formData.discussions.trim()) {
      setError(
        "Please enter the main meeting discussions."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const minutesData = {
        title: formData.title.trim(),

        attendanceSummary:
          formData.attendanceSummary.trim(),

        openingRemarks:
          formData.openingRemarks.trim(),

        discussions:
          formData.discussions.trim(),

        decisions:
          formData.decisions.trim(),

        closingRemarks:
          formData.closingRemarks.trim(),

        preparedBy:
          formData.preparedBy.trim(),
      };

      await saveMeetingMinutes(
        meetingId,
        minutesData
      );

      setSuccessMessage(
        "Meeting minutes saved successfully."
      );

      setIsEditing(false);

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to save the meeting minutes."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleApproveMinutes = async () => {
    const confirmed = window.confirm(
      "Approve these meeting minutes? Approved minutes should only be changed through an authorized review."
    );

    if (!confirmed) {
      return;
    }

    try {
      setApproving(true);
      setError("");
      setSuccessMessage("");

      await approveMeetingMinutes(meetingId);

      setSuccessMessage(
        "Meeting minutes approved successfully."
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to approve the meeting minutes."
      );
    } finally {
      setApproving(false);
    }
  };

  const handleCancelEditing = () => {
    setFormData(normalizedInitialMinutes);
    setIsEditing(false);
    setError("");
  };

  const renderMinutesSection = (
    title,
    content
  ) => {
    if (!content?.trim()) {
      return null;
    }

    return (
      <article className="meeting-minutes__content-section">
        <h3>{title}</h3>

        <div className="meeting-minutes__content-text">
          {content
            .split("\n")
            .map((paragraph, index) => (
              <p key={`${title}-${index}`}>
                {paragraph || "\u00A0"}
              </p>
            ))}
        </div>
      </article>
    );
  };

  return (
    <section className="meeting-minutes">
      <div className="meeting-minutes__header">
        <div>
          <span className="meeting-minutes__eyebrow">
            Official meeting record
          </span>

          <h2>
            <FiFileText />
            Minutes
          </h2>

          <p>
            Prepare, review and approve the official
            record of the meeting.
          </p>
        </div>

        <div className="meeting-minutes__header-actions">
          {isApproved ? (
            <span className="meeting-minutes__approved-label">
              <FiCheckCircle />
              Approved
            </span>
          ) : (
            <span className="meeting-minutes__draft-label">
              <FiClock />
              Draft
            </span>
          )}

          {canManage &&
            !isEditing &&
            !isApproved && (
              <button
                type="button"
                className="meeting-minutes__edit-button"
                onClick={() =>
                  setIsEditing(true)
                }
              >
                <FiEdit3 />
                Edit minutes
              </button>
            )}

          {canApprove &&
            !isApproved &&
            hasMinutesContent &&
            !isEditing && (
              <button
                type="button"
                className="meeting-minutes__approve-button"
                onClick={handleApproveMinutes}
                disabled={approving}
              >
                <FiShield />

                {approving
                  ? "Approving..."
                  : "Approve minutes"}
              </button>
            )}
        </div>
      </div>

      {error && (
        <div className="meeting-minutes__alert meeting-minutes__alert--error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="meeting-minutes__alert meeting-minutes__alert--success">
          {successMessage}
        </div>
      )}

      {isApproved && (
        <div className="meeting-minutes__approval-banner">
          <div>
            <FiCheckCircle />

            <div>
              <strong>
                These minutes have been approved
              </strong>

              <span>
                This is the official meeting record.
              </span>
            </div>
          </div>

          {(approvedBy || approvedAt) && (
            <div className="meeting-minutes__approval-details">
              {approvedBy && (
                <span>
                  Approved by{" "}
                  <strong>{approvedBy}</strong>
                </span>
              )}

              {approvedAt && (
                <span>
                  {formatDateTime(approvedAt)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {isEditing ? (
        <form
          className="meeting-minutes__form"
          onSubmit={handleSaveMinutes}
        >
          <div className="meeting-minutes__form-heading">
            <div>
              <h3>
                {minutes
                  ? "Edit meeting minutes"
                  : "Prepare meeting minutes"}
              </h3>

              <p>
                Enter the official record carefully.
                The minutes can be approved after they
                are saved.
              </p>
            </div>
          </div>

          <div className="meeting-minutes__form-grid">
            <label className="meeting-minutes__full-width">
              <span>Minutes title</span>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={
                  meetingTitle
                    ? `Minutes of ${meetingTitle}`
                    : "Minutes of the meeting"
                }
                maxLength={200}
                required
              />
            </label>

            <label>
              <span>
                Prepared by
                <small>Optional</small>
              </span>

              <input
                type="text"
                name="preparedBy"
                value={formData.preparedBy}
                onChange={handleInputChange}
                placeholder="Secretary or minute taker"
                maxLength={120}
              />
            </label>

            <label>
              <span>
                Attendance summary
                <small>Optional</small>
              </span>

              <textarea
                name="attendanceSummary"
                value={
                  formData.attendanceSummary
                }
                onChange={handleInputChange}
                rows={4}
                placeholder="Summarize attendees, apologies and absentees."
              />
            </label>

            <label className="meeting-minutes__full-width">
              <span>
                Opening remarks
                <small>Optional</small>
              </span>

              <textarea
                name="openingRemarks"
                value={formData.openingRemarks}
                onChange={handleInputChange}
                rows={5}
                placeholder="Record opening remarks, confirmation of quorum and introductory matters."
              />
            </label>

            <label className="meeting-minutes__full-width">
              <span>
                Discussions and deliberations
              </span>

              <textarea
                name="discussions"
                value={formData.discussions}
                onChange={handleInputChange}
                rows={12}
                placeholder="Record the key matters discussed under each agenda item."
                required
              />
            </label>

            <label className="meeting-minutes__full-width">
              <span>
                Decisions and resolutions
                <small>Optional</small>
              </span>

              <textarea
                name="decisions"
                value={formData.decisions}
                onChange={handleInputChange}
                rows={7}
                placeholder="Record decisions, resolutions and assigned responsibilities."
              />
            </label>

            <label className="meeting-minutes__full-width">
              <span>
                Closing remarks
                <small>Optional</small>
              </span>

              <textarea
                name="closingRemarks"
                value={formData.closingRemarks}
                onChange={handleInputChange}
                rows={5}
                placeholder="Record final remarks, the next meeting and adjournment."
              />
            </label>
          </div>

          <div className="meeting-minutes__form-footer">
            {minutes && (
              <button
                type="button"
                className="meeting-minutes__cancel-button"
                onClick={handleCancelEditing}
                disabled={saving}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="meeting-minutes__save-button"
              disabled={saving}
            >
              <FiSave />

              {saving
                ? "Saving minutes..."
                : "Save minutes"}
            </button>
          </div>
        </form>
      ) : !hasMinutesContent ? (
        <div className="meeting-minutes__empty">
          <div className="meeting-minutes__empty-icon">
            <FiFileText />
          </div>

          <h3>No minutes prepared</h3>

          <p>
            The official meeting record has not yet
            been prepared.
          </p>

          {canManage && (
            <button
              type="button"
              onClick={() =>
                setIsEditing(true)
              }
            >
              <FiEdit3 />
              Prepare minutes
            </button>
          )}
        </div>
      ) : (
        <div className="meeting-minutes__document">
          <div className="meeting-minutes__document-header">
            <div>
              <span>
                Jumuiya ya Vijana wa Pwani
              </span>

              <h1>
                {formData.title ||
                  `Minutes of ${
                    meetingTitle || "Meeting"
                  }`}
              </h1>
            </div>

            <div className="meeting-minutes__document-status">
              {isApproved
                ? "Approved record"
                : "Draft record"}
            </div>
          </div>

          <div className="meeting-minutes__document-meta">
            {(formData.preparedBy ||
              preparedBy) && (
              <div>
                <FiUser />

                <span>
                  Prepared by{" "}
                  <strong>
                    {formData.preparedBy ||
                      preparedBy}
                  </strong>
                </span>
              </div>
            )}

            {lastUpdatedAt && (
              <div>
                <FiClock />

                <span>
                  Last updated{" "}
                  <strong>
                    {formatDateTime(
                      lastUpdatedAt
                    )}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {renderMinutesSection(
            "Attendance",
            formData.attendanceSummary
          )}

          {renderMinutesSection(
            "Opening remarks",
            formData.openingRemarks
          )}

          {renderMinutesSection(
            "Discussions and deliberations",
            formData.discussions
          )}

          {renderMinutesSection(
            "Decisions and resolutions",
            formData.decisions
          )}

          {renderMinutesSection(
            "Closing remarks",
            formData.closingRemarks
          )}

          <div className="meeting-minutes__document-footer">
            <span>
              End of official meeting minutes
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default MeetingMinutes;