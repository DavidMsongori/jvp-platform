import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addMeetingAgendaItem,
  removeMeetingAgendaItem,
  updateMeetingAgendaItem,
} from "../../services/meeting.service";

import "./MeetingAgenda.css";

/* ==========================================================
   CONSTANTS
========================================================== */

const INITIAL_FORM = {
  title: "",
  description: "",
  durationMinutes: 10,
  presenter: "",
  status: "pending",
  notes: "",
};

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "skipped",
    label: "Skipped",
  },
];

const STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  skipped: "Skipped",
};

/* ==========================================================
   HELPERS
========================================================== */

const getApiErrorMessage = (
  error,
  fallback
) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const getPersonName = (
  person
) => {
  if (!person) {
    return "Not assigned";
  }

  if (
    typeof person === "string"
  ) {
    return person;
  }

  const fullName = [
    person.firstName,
    person.middleName,
    person.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    person.name ||
    person.email ||
    "Not assigned"
  );
};

const formatDuration = (
  minutes
) => {
  const duration =
    Number(minutes) || 0;

  if (duration < 60) {
    return `${duration} min`;
  }

  const hours =
    Math.floor(duration / 60);

  const remainingMinutes =
    duration % 60;

  if (!remainingMinutes) {
    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    }`;
  }

  return `${hours} hr ${remainingMinutes} min`;
};

/* ==========================================================
   COMPONENT
========================================================== */

const MeetingAgenda = ({
  meetingId,
  agenda = [],
  participants = [],
  canManage = true,
  onMeetingRefresh,
}) => {
  const [
    formData,
    setFormData,
  ] = useState(
    INITIAL_FORM
  );

  const [
    editingItem,
    setEditingItem,
  ] = useState(null);

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    changingStatusId,
    setChangingStatusId,
  ] = useState("");

  const [
    deletingItemId,
    setDeletingItemId,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /* ========================================================
     DERIVED DATA
  ======================================================== */

  const sortedAgenda =
    useMemo(() => {
      return [...agenda].sort(
        (first, second) => {
          const firstOrder =
            first.order ??
            first.position ??
            first.sequence ??
            0;

          const secondOrder =
            second.order ??
            second.position ??
            second.sequence ??
            0;

          return (
            firstOrder -
            secondOrder
          );
        }
      );
    }, [agenda]);

  const totalDuration =
    useMemo(() => {
      return sortedAgenda.reduce(
        (total, item) =>
          total +
          (Number(
            item.durationMinutes
          ) || 0),
        0
      );
    }, [sortedAgenda]);

  const completedItems =
    useMemo(() => {
      return sortedAgenda.filter(
        (item) =>
          item.status ===
          "completed"
      ).length;
    }, [sortedAgenda]);

  /* ========================================================
     MODAL HANDLERS
  ======================================================== */

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(
      INITIAL_FORM
    );
    setError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const openEditModal = (
    item
  ) => {
    setEditingItem(item);

    setFormData({
      title:
        item.title || "",

      description:
        item.description || "",

      durationMinutes:
        item.durationMinutes ||
        10,

      presenter:
        item.presenter?._id ||
        item.presenter ||
        "",

      status:
        item.status ||
        "pending",

      notes:
        item.notes || "",
    });

    setError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (actionLoading) {
      return;
    }

    setModalOpen(false);
    setEditingItem(null);
    setFormData(
      INITIAL_FORM
    );
  };

  /* ========================================================
     FORM HANDLERS
  ======================================================== */

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,

        [name]:
          name ===
          "durationMinutes"
            ? Number(value)
            : value,
      })
    );
  };

  const validateForm = () => {
    if (
      !formData.title.trim()
    ) {
      setError(
        "Agenda item title is required."
      );

      return false;
    }

    if (
      Number(
        formData.durationMinutes
      ) < 1
    ) {
      setError(
        "Duration must be at least one minute."
      );

      return false;
    }

    return true;
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccessMessage("");

      if (!validateForm()) {
        return;
      }

      const payload = {
        title:
          formData.title.trim(),

        description:
          formData.description.trim(),

        durationMinutes:
          Number(
            formData.durationMinutes
          ),

        status:
          formData.status,

        notes:
          formData.notes.trim(),
      };

      if (formData.presenter) {
        payload.presenter =
          formData.presenter;
      }

      try {
        setActionLoading(true);

        if (
          editingItem?._id
        ) {
          await updateMeetingAgendaItem(
            meetingId,
            editingItem._id,
            payload
          );

          setSuccessMessage(
            "Agenda item updated successfully."
          );
        } else {
          await addMeetingAgendaItem(
            meetingId,
            payload
          );

          setSuccessMessage(
            "Agenda item added successfully."
          );
        }

        setModalOpen(false);
        setEditingItem(null);
        setFormData(
          INITIAL_FORM
        );

        if (onMeetingRefresh) {
          await onMeetingRefresh();
        }
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            editingItem
              ? "Unable to update the agenda item."
              : "Unable to add the agenda item."
          )
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* ========================================================
     DELETE
  ======================================================== */

  const handleDelete =
    async (item) => {
      const confirmed =
        window.confirm(
          `Delete "${item.title}" from the meeting agenda?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingItemId(
          item._id
        );

        setError("");
        setSuccessMessage("");

        await removeMeetingAgendaItem(
          meetingId,
          item._id
        );

        setSuccessMessage(
          "Agenda item deleted successfully."
        );

        if (onMeetingRefresh) {
          await onMeetingRefresh();
        }
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            "Unable to delete the agenda item."
          )
        );
      } finally {
        setDeletingItemId("");
      }
    };

  /* ========================================================
     STATUS
  ======================================================== */

  const handleStatusChange =
    async (
      item,
      newStatus
    ) => {
      try {
        setChangingStatusId(
          item._id
        );

        setError("");
        setSuccessMessage("");

        await updateMeetingAgendaItem(
          meetingId,
          item._id,
          {
            status: newStatus,
          }
        );

        setSuccessMessage(
          `Agenda item marked as ${
            STATUS_LABELS[
              newStatus
            ] || newStatus
          }.`
        );

        if (onMeetingRefresh) {
          await onMeetingRefresh();
        }
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            "Unable to update the agenda item status."
          )
        );
      } finally {
        setChangingStatusId("");
      }
    };

  /* ========================================================
     KEYBOARD CONTROL
  ======================================================== */

  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      if (
        event.key ===
          "Escape" &&
        modalOpen &&
        !actionLoading
      ) {
        closeModal();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    modalOpen,
    actionLoading,
  ]);

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <section className="meeting-agenda">
      <header className="meeting-agenda__header">
        <div>
          <p className="meeting-agenda__eyebrow">
            Meeting plan
          </p>

          <h2>
            Agenda Management
          </h2>

          <p>
            Prepare the meeting
            programme, assign
            presenters and track the
            progress of every agenda
            item.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="meeting-agenda-button meeting-agenda-button--primary"
            onClick={
              openCreateModal
            }
          >
            + Add Agenda Item
          </button>
        )}
      </header>

      {error && (
        <div
          className="meeting-agenda-alert meeting-agenda-alert--error"
          role="alert"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div
          className="meeting-agenda-alert meeting-agenda-alert--success"
          role="status"
        >
          <span>
            {successMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage(
                ""
              )
            }
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}

      <section className="meeting-agenda__summary">
        <article>
          <span>
            Agenda Items
          </span>

          <strong>
            {sortedAgenda.length}
          </strong>
        </article>

        <article>
          <span>
            Total Duration
          </span>

          <strong>
            {formatDuration(
              totalDuration
            )}
          </strong>
        </article>

        <article>
          <span>Completed</span>

          <strong>
            {completedItems}
          </strong>
        </article>

        <article>
          <span>Remaining</span>

          <strong>
            {Math.max(
              0,
              sortedAgenda.length -
                completedItems
            )}
          </strong>
        </article>
      </section>

      {!sortedAgenda.length ? (
        <div className="meeting-agenda-empty">
          <div className="meeting-agenda-empty__icon">
            AG
          </div>

          <h3>
            No agenda items yet
          </h3>

          <p>
            Create the first agenda
            item to begin preparing
            this meeting.
          </p>

          {canManage && (
            <button
              type="button"
              className="meeting-agenda-button meeting-agenda-button--primary"
              onClick={
                openCreateModal
              }
            >
              Create First Item
            </button>
          )}
        </div>
      ) : (
        <div className="meeting-agenda__list">
          {sortedAgenda.map(
            (item, index) => {
              const itemId =
                item._id;

              const status =
                item.status ||
                "pending";

              return (
                <article
                  key={
                    itemId ||
                    `${item.title}-${index}`
                  }
                  className={`meeting-agenda-item meeting-agenda-item--${status}`}
                >
                  <div className="meeting-agenda-item__number">
                    {index + 1}
                  </div>

                  <div className="meeting-agenda-item__content">
                    <div className="meeting-agenda-item__top">
                      <div>
                        <h3>
                          {item.title ||
                            `Agenda Item ${
                              index + 1
                            }`}
                        </h3>

                        <div className="meeting-agenda-item__meta">
                          <span>
                            {formatDuration(
                              item.durationMinutes
                            )}
                          </span>

                          <span>
                            Presenter:{" "}
                            <strong>
                              {getPersonName(
                                item.presenter
                              )}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <span
                        className={`meeting-agenda-status meeting-agenda-status--${status}`}
                      >
                        {STATUS_LABELS[
                          status
                        ] || status}
                      </span>
                    </div>

                    {item.description && (
                      <p className="meeting-agenda-item__description">
                        {
                          item.description
                        }
                      </p>
                    )}

                    {item.notes && (
                      <div className="meeting-agenda-item__notes">
                        <strong>
                          Notes:
                        </strong>{" "}
                        {item.notes}
                      </div>
                    )}

                    {canManage && (
                      <div className="meeting-agenda-item__footer">
                        <label className="meeting-agenda-status-control">
                          <span>
                            Status
                          </span>

                          <select
                            value={
                              status
                            }
                            onChange={(
                              event
                            ) =>
                              handleStatusChange(
                                item,
                                event
                                  .target
                                  .value
                              )
                            }
                            disabled={
                              changingStatusId ===
                              itemId
                            }
                          >
                            {STATUS_OPTIONS.map(
                              (
                                option
                              ) => (
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
                        </label>

                        <div className="meeting-agenda-item__actions">
                          <button
                            type="button"
                            className="meeting-agenda-button meeting-agenda-button--secondary"
                            onClick={() =>
                              openEditModal(
                                item
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="meeting-agenda-button meeting-agenda-button--danger-outline"
                            onClick={() =>
                              handleDelete(
                                item
                              )
                            }
                            disabled={
                              deletingItemId ===
                              itemId
                            }
                          >
                            {deletingItemId ===
                            itemId
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {modalOpen && (
        <div
          className="meeting-agenda-modal-backdrop"
          role="presentation"
          onMouseDown={
            closeModal
          }
        >
          <section
            className="meeting-agenda-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-modal-title"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <header className="meeting-agenda-modal__header">
              <div>
                <p className="meeting-agenda__eyebrow">
                  {editingItem
                    ? "Update item"
                    : "New item"}
                </p>

                <h2 id="agenda-modal-title">
                  {editingItem
                    ? "Edit Agenda Item"
                    : "Add Agenda Item"}
                </h2>
              </div>

              <button
                type="button"
                className="meeting-agenda-modal__close"
                onClick={
                  closeModal
                }
                aria-label="Close modal"
              >
                ×
              </button>
            </header>

            <form
              className="meeting-agenda-form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="meeting-agenda-form__body">
                <label className="meeting-agenda-form__full">
                  <span>
                    Agenda title *
                  </span>

                  <input
                    type="text"
                    name="title"
                    value={
                      formData.title
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    maxLength={180}
                    placeholder="For example: Confirmation of previous minutes"
                  />
                </label>

                <label className="meeting-agenda-form__full">
                  <span>
                    Description
                  </span>

                  <textarea
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={
                      handleInputChange
                    }
                    rows={4}
                    placeholder="Describe what will be discussed under this item..."
                  />
                </label>

                <label>
                  <span>
                    Duration in minutes
                    *
                  </span>

                  <input
                    type="number"
                    name="durationMinutes"
                    min="1"
                    max="600"
                    value={
                      formData.durationMinutes
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />
                </label>

                <label>
                  <span>Status</span>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleInputChange
                    }
                  >
                    {STATUS_OPTIONS.map(
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
                </label>

                <label className="meeting-agenda-form__full">
                  <span>
                    Presenter
                  </span>

                  <select
                    name="presenter"
                    value={
                      formData.presenter
                    }
                    onChange={
                      handleInputChange
                    }
                  >
                    <option value="">
                      Select presenter
                    </option>

                    {participants.map(
                      (
                        participant,
                        index
                      ) => {
                        const user =
                          participant.user ||
                          participant;

                        const userId =
                          user?._id ||
                          participant.userId;

                        if (!userId) {
                          return null;
                        }

                        return (
                          <option
                            key={
                              userId ||
                              index
                            }
                            value={
                              userId
                            }
                          >
                            {getPersonName(
                              user
                            )}
                          </option>
                        );
                      }
                    )}
                  </select>
                </label>

                <label className="meeting-agenda-form__full">
                  <span>Notes</span>

                  <textarea
                    name="notes"
                    value={
                      formData.notes
                    }
                    onChange={
                      handleInputChange
                    }
                    rows={3}
                    placeholder="Internal notes or preparation instructions..."
                  />
                </label>
              </div>

              <footer className="meeting-agenda-modal__footer">
                <button
                  type="button"
                  className="meeting-agenda-button meeting-agenda-button--secondary"
                  onClick={
                    closeModal
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="meeting-agenda-button meeting-agenda-button--primary"
                  disabled={
                    actionLoading
                  }
                >
                  {actionLoading
                    ? editingItem
                      ? "Saving..."
                      : "Adding..."
                    : editingItem
                      ? "Save Changes"
                      : "Add Agenda Item"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
};

export default MeetingAgenda;