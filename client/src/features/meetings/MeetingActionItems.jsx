import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiList,
  FiPlus,
  FiSearch,
  FiUser,
  FiX,
} from "react-icons/fi";

import {
  addMeetingActionItem,
  updateMeetingActionItem,
} from "../../services/meeting.service";

import "./MeetingActionItems.css";

const EMPTY_ACTION_ITEM = {
  title: "",
  description: "",
  assignedTo: "",
  dueDate: "",
  priority: "medium",
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
    label: "In progress",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "overdue",
    label: "Overdue",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const PRIORITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "high",
    label: "High",
  },
  {
    value: "urgent",
    label: "Urgent",
  },
];

const getActionItemId = (actionItem) => {
  return actionItem?._id || actionItem?.id || "";
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

  const fullName = [
    member?.firstName,
    member?.middleName,
    member?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    fullName ||
    value?.fullName ||
    value?.name ||
    value?.email ||
    value?.user?.fullName ||
    value?.user?.email ||
    ""
  );
};

const normalizeStatus = (value) => {
  const normalizedValue = String(
    value || "pending"
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const availableStatuses =
    STATUS_OPTIONS.map(
      (option) => option.value
    );

  return availableStatuses.includes(
    normalizedValue
  )
    ? normalizedValue
    : "pending";
};

const normalizePriority = (value) => {
  const normalizedValue = String(
    value || "medium"
  )
    .trim()
    .toLowerCase();

  const availablePriorities =
    PRIORITY_OPTIONS.map(
      (option) => option.value
    );

  return availablePriorities.includes(
    normalizedValue
  )
    ? normalizedValue
    : "medium";
};

const formatLabel = (value) => {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

const formatDate = (value) => {
  if (!value) {
    return "No deadline";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const isPastDue = (dueDate, status) => {
  if (
    !dueDate ||
    status === "completed" ||
    status === "cancelled"
  ) {
    return false;
  }

  const deadline = new Date(dueDate);

  if (Number.isNaN(deadline.getTime())) {
    return false;
  }

  deadline.setHours(23, 59, 59, 999);

  return deadline.getTime() < Date.now();
};

const normalizeActionItem = (
  actionItem,
  index
) => {
  const id = getActionItemId(actionItem);

  const status = normalizeStatus(
    actionItem?.status ||
      actionItem?.actionStatus
  );

  const dueDate =
    actionItem?.dueDate ||
    actionItem?.deadline ||
    actionItem?.implementationDeadline ||
    "";

  const calculatedStatus =
    isPastDue(dueDate, status) &&
    status !== "completed"
      ? "overdue"
      : status;

  return {
    raw: actionItem,

    id,

    key:
      id ||
      `${actionItem?.title || "action-item"}-${index}`,

    title:
      actionItem?.title ||
      actionItem?.task ||
      actionItem?.subject ||
      `Action item ${index + 1}`,

    description:
      actionItem?.description ||
      actionItem?.details ||
      actionItem?.action ||
      "",

    assignedTo: getPersonName(
      actionItem?.assignedTo ||
      actionItem?.assignee ||
      actionItem?.responsiblePerson
    ),

    dueDate,

    priority: normalizePriority(
      actionItem?.priority
    ),

    status: calculatedStatus,

    notes:
      actionItem?.notes ||
      actionItem?.remarks ||
      "",

    createdAt:
      actionItem?.createdAt ||
      actionItem?.addedAt ||
      "",

    completedAt:
      actionItem?.completedAt ||
      "",
  };
};

const MeetingActionItems = ({
  meetingId,
  actionItems = [],
  canManage = false,
  onMeetingRefresh,
}) => {
  const [localActionItems, setLocalActionItems] =
    useState(
      Array.isArray(actionItems)
        ? actionItems
        : []
    );

  const [formData, setFormData] =
    useState(EMPTY_ACTION_ITEM);

  const [showForm, setShowForm] =
    useState(false);

  const [editingActionItem, setEditingActionItem] =
    useState(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [priorityFilter, setPriorityFilter] =
    useState("all");

  const [submitting, setSubmitting] =
    useState(false);

  const [
    updatingActionItemId,
    setUpdatingActionItemId,
  ] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    setLocalActionItems(
      Array.isArray(actionItems)
        ? actionItems
        : []
    );
  }, [actionItems]);

  const normalizedActionItems = useMemo(() => {
    return localActionItems.map(
      normalizeActionItem
    );
  }, [localActionItems]);

  const filteredActionItems = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return normalizedActionItems.filter(
      (actionItem) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            actionItem.title,
            actionItem.description,
            actionItem.assignedTo,
            actionItem.notes,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(normalizedSearch)
            );

        const matchesStatus =
          statusFilter === "all" ||
          actionItem.status === statusFilter;

        const matchesPriority =
          priorityFilter === "all" ||
          actionItem.priority ===
            priorityFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority
        );
      }
    );
  }, [
    normalizedActionItems,
    search,
    statusFilter,
    priorityFilter,
  ]);

  const summary = useMemo(() => {
    return normalizedActionItems.reduce(
      (result, actionItem) => {
        result.total += 1;

        if (
          Object.prototype.hasOwnProperty.call(
            result,
            actionItem.status
          )
        ) {
          result[actionItem.status] += 1;
        }

        return result;
      },
      {
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        overdue: 0,
        cancelled: 0,
      }
    );
  }, [normalizedActionItems]);

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
    setFormData(EMPTY_ACTION_ITEM);
    setEditingActionItem(null);
    setShowForm(false);
    setError("");
  };

  const startEditing = (actionItem) => {
    setEditingActionItem(actionItem);

    setFormData({
      title: actionItem.title || "",
      description:
        actionItem.description || "",
      assignedTo:
        actionItem.assignedTo || "",
      dueDate: actionItem.dueDate
        ? String(actionItem.dueDate).slice(
            0,
            10
          )
        : "",
      priority:
        actionItem.priority || "medium",
      status:
        actionItem.status || "pending",
      notes: actionItem.notes || "",
    });

    setShowForm(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError(
        "Please enter an action item title."
      );

      return;
    }

    if (!formData.description.trim()) {
      setError(
        "Please enter the action item details."
      );

      return;
    }

    if (!formData.assignedTo.trim()) {
      setError(
        "Please enter the person responsible for this action item."
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const actionItemData = {
        title: formData.title.trim(),

        description:
          formData.description.trim(),

        assignedTo:
          formData.assignedTo.trim(),

        dueDate:
          formData.dueDate || null,

        priority: formData.priority,

        status: formData.status,

        notes: formData.notes.trim(),
      };

      if (editingActionItem) {
        await updateMeetingActionItem(
          meetingId,
          editingActionItem.id,
          actionItemData
        );

        setLocalActionItems(
          (currentItems) =>
            currentItems.map((item) => {
              if (
                getActionItemId(item) !==
                editingActionItem.id
              ) {
                return item;
              }

              return {
                ...item,
                ...actionItemData,
              };
            })
        );

        setSuccessMessage(
          "Action item updated successfully."
        );
      } else {
        const response =
          await addMeetingActionItem(
            meetingId,
            actionItemData
          );

        const createdActionItem =
          response?.data?.actionItem ||
          response?.actionItem ||
          response?.data ||
          null;

        if (
          createdActionItem &&
          typeof createdActionItem ===
            "object" &&
          !Array.isArray(createdActionItem)
        ) {
          setLocalActionItems(
            (currentItems) => [
              ...currentItems,
              createdActionItem,
            ]
          );
        }

        setSuccessMessage(
          "Action item added successfully."
        );
      }

      resetForm();

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          `Unable to ${
            editingActionItem
              ? "update"
              : "add"
          } the action item.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusUpdate = async (
    actionItem,
    status
  ) => {
    if (!actionItem.id) {
      setError(
        "This action item does not have a valid ID."
      );

      return;
    }

    try {
      setUpdatingActionItemId(
        actionItem.id
      );

      setError("");
      setSuccessMessage("");

      await updateMeetingActionItem(
        meetingId,
        actionItem.id,
        {
          status,
        }
      );

      setLocalActionItems(
        (currentItems) =>
          currentItems.map((item) => {
            if (
              getActionItemId(item) !==
              actionItem.id
            ) {
              return item;
            }

            return {
              ...item,
              status,
              completedAt:
                status === "completed"
                  ? new Date().toISOString()
                  : item?.completedAt,
            };
          })
      );

      setSuccessMessage(
        "Action item status updated successfully."
      );

      if (onMeetingRefresh) {
        await onMeetingRefresh();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to update the action item status."
      );
    } finally {
      setUpdatingActionItemId("");
    }
  };

  return (
    <section className="meeting-action-items">
      <div className="meeting-action-items__header">
        <div>
          <span className="meeting-action-items__eyebrow">
            Follow-up tracker
          </span>

          <h2>
            <FiList />
            Action Items
          </h2>

          <p>
            Track responsibilities, deadlines and
            progress arising from meeting decisions.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="meeting-action-items__add-button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
          >
            {showForm ? (
              <>
                <FiX />
                Close
              </>
            ) : (
              <>
                <FiPlus />
                Add action item
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="meeting-action-items__alert meeting-action-items__alert--error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="meeting-action-items__alert meeting-action-items__alert--success">
          {successMessage}
        </div>
      )}

      <div className="meeting-action-items__summary">
        <article>
          <span>
            <FiList />
          </span>

          <div>
            <small>Total</small>
            <strong>{summary.total}</strong>
          </div>
        </article>

        <article className="meeting-action-items__summary-pending">
          <span>
            <FiClock />
          </span>

          <div>
            <small>Pending</small>
            <strong>{summary.pending}</strong>
          </div>
        </article>

        <article className="meeting-action-items__summary-progress">
          <span>
            <FiEdit3 />
          </span>

          <div>
            <small>In progress</small>
            <strong>
              {summary.in_progress}
            </strong>
          </div>
        </article>

        <article className="meeting-action-items__summary-completed">
          <span>
            <FiCheckCircle />
          </span>

          <div>
            <small>Completed</small>
            <strong>
              {summary.completed}
            </strong>
          </div>
        </article>

        <article className="meeting-action-items__summary-overdue">
          <span>
            <FiAlertCircle />
          </span>

          <div>
            <small>Overdue</small>
            <strong>{summary.overdue}</strong>
          </div>
        </article>
      </div>

      {canManage && showForm && (
        <form
          className="meeting-action-items__form"
          onSubmit={handleSubmit}
        >
          <div className="meeting-action-items__form-header">
            <div>
              <h3>
                {editingActionItem
                  ? "Edit action item"
                  : "Add action item"}
              </h3>

              <p>
                Assign responsibility and define a
                clear completion deadline.
              </p>
            </div>
          </div>

          <div className="meeting-action-items__form-grid">
            <label>
              <span>Action item title</span>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Example: Prepare youth policy brief"
                maxLength={200}
                required
              />
            </label>

            <label>
              <span>Responsible person</span>

              <input
                type="text"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                placeholder="Name of person responsible"
                maxLength={150}
                required
              />
            </label>

            <label className="meeting-action-items__full-width">
              <span>Action item details</span>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Describe the task, expected result and relevant instructions."
                required
              />
            </label>

            <label>
              <span>
                Due date
                <small>Optional</small>
              </span>

              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
              />
            </label>

            <label>
              <span>Priority</span>

              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                {PRIORITY_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>Status</span>

              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>
                Notes
                <small>Optional</small>
              </span>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Add supporting notes or dependencies."
              />
            </label>
          </div>

          <div className="meeting-action-items__form-footer">
            <button
              type="button"
              className="meeting-action-items__cancel-button"
              onClick={resetForm}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="meeting-action-items__submit-button"
              disabled={submitting}
            >
              {editingActionItem ? (
                <FiEdit3 />
              ) : (
                <FiPlus />
              )}

              {submitting
                ? "Saving..."
                : editingActionItem
                  ? "Update action item"
                  : "Add action item"}
            </button>
          </div>
        </form>
      )}

      <div className="meeting-action-items__toolbar">
        <label className="meeting-action-items__search">
          <FiSearch />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search action items"
          />
        </label>

        <label className="meeting-action-items__filter">
          <span>Status</span>

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

            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="meeting-action-items__filter">
          <span>Priority</span>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              All priorities
            </option>

            {PRIORITY_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      {!filteredActionItems.length ? (
        <div className="meeting-action-items__empty">
          <div className="meeting-action-items__empty-icon">
            <FiList />
          </div>

          <h3>No action items found</h3>

          <p>
            Tasks and responsibilities arising from
            this meeting will appear here.
          </p>

          {canManage &&
            !showForm &&
            !normalizedActionItems.length && (
              <button
                type="button"
                onClick={() =>
                  setShowForm(true)
                }
              >
                <FiPlus />
                Add the first action item
              </button>
            )}
        </div>
      ) : (
        <div className="meeting-action-items__list">
          {filteredActionItems.map(
            (actionItem) => {
              const isUpdating =
                updatingActionItemId ===
                actionItem.id;

              return (
                <article
                  key={actionItem.key}
                  className={`meeting-action-items__card meeting-action-items__card--${actionItem.status}`}
                >
                  <div className="meeting-action-items__card-header">
                    <div>
                      <span
                        className={`meeting-action-items__priority meeting-action-items__priority--${actionItem.priority}`}
                      >
                        {formatLabel(
                          actionItem.priority
                        )}{" "}
                        priority
                      </span>

                      <h3>{actionItem.title}</h3>
                    </div>

                    <span
                      className={`meeting-action-items__status meeting-action-items__status--${actionItem.status}`}
                    >
                      {actionItem.status ===
                      "completed" ? (
                        <FiCheckCircle />
                      ) : actionItem.status ===
                        "overdue" ? (
                        <FiAlertCircle />
                      ) : (
                        <FiClock />
                      )}

                      {formatLabel(
                        actionItem.status
                      )}
                    </span>
                  </div>

                  <div className="meeting-action-items__card-body">
                    <p>
                      {actionItem.description}
                    </p>

                    <div className="meeting-action-items__details">
                      <div>
                        <FiUser />

                        <span>
                          Assigned to
                          <strong>
                            {actionItem.assignedTo ||
                              "Not assigned"}
                          </strong>
                        </span>
                      </div>

                      <div>
                        <FiCalendar />

                        <span>
                          Due date
                          <strong>
                            {formatDate(
                              actionItem.dueDate
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {actionItem.notes && (
                      <div className="meeting-action-items__notes">
                        <strong>Notes</strong>

                        <p>{actionItem.notes}</p>
                      </div>
                    )}
                  </div>

                  {canManage && (
                    <div className="meeting-action-items__card-actions">
                      <button
                        type="button"
                        className="meeting-action-items__edit-button"
                        onClick={() =>
                          startEditing(actionItem)
                        }
                        disabled={isUpdating}
                      >
                        <FiEdit3 />
                        Edit
                      </button>

                      <select
                        value={actionItem.status}
                        onChange={(event) =>
                          handleQuickStatusUpdate(
                            actionItem,
                            event.target.value
                          )
                        }
                        disabled={
                          isUpdating ||
                          !actionItem.id
                        }
                      >
                        {STATUS_OPTIONS.map(
                          (option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>

                      {actionItem.status !==
                        "completed" && (
                        <button
                          type="button"
                          className="meeting-action-items__complete-button"
                          onClick={() =>
                            handleQuickStatusUpdate(
                              actionItem,
                              "completed"
                            )
                          }
                          disabled={
                            isUpdating ||
                            !actionItem.id
                          }
                        >
                          <FiCheckCircle />

                          {isUpdating
                            ? "Updating..."
                            : "Mark complete"}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            }
          )}
        </div>
      )}

      <div className="meeting-action-items__footer">
        Showing {filteredActionItems.length} of{" "}
        {normalizedActionItems.length} action items
      </div>
    </section>
  );
};

export default MeetingActionItems;