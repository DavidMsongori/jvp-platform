import React from "react";
import {
  Archive,
  CalendarDays,
  CheckCircle,
  Edit,
  Eye,
  MapPin,
  Star,
  Trash2,
  Upload,
  Users,
} from "lucide-react";

import "./EventsTable.css";

const formatDate = (date) => {
  if (!date) return "Date TBA";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date TBA";
  }

  return parsedDate.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getEventTitle = (event) => {
  return event?.title || "Untitled Event";
};

const getEventSummary = (event) => {
  return event?.summary || "";
};

const getEventCategory = (event) => {
  return event?.category || "General";
};

const getEventImage = (event) => {
  return event?.coverImage?.url || "";
};

const getEventLocation = (event) => {
  if (event?.eventType === "virtual") {
    return {
      primary: "Virtual Event",
      secondary: event?.virtualPlatform || "Online",
      virtual: true,
    };
  }

  return {
    primary: event?.venue?.name || "Venue TBA",
    secondary: event?.venue?.county || "",
    virtual: false,
  };
};

const getRegistrationCount = (event) => {
  const count = Number(event?.registeredParticipants);

  return Number.isFinite(count) && count >= 0 ? count : 0;
};

const getCapacity = (event) => {
  const capacity = Number(event?.registration?.capacity);

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return null;
  }

  return capacity;
};

const getCapacityPercentage = (event) => {
  const registered = getRegistrationCount(event);
  const capacity = getCapacity(event);

  if (!capacity) {
    return null;
  }

  return Math.min(100, Math.round((registered / capacity) * 100));
};

const getStatus = (event) => {
  if (event?.isArchived) {
    return "archived";
  }

  if (event?.isPublished) {
    return "published";
  }

  return "draft";
};

const getStatusClass = (status) => {
  switch (status) {
    case "published":
      return "status-success";

    case "draft":
      return "status-draft";

    case "archived":
      return "status-archived";

    default:
      return "status-default";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "published":
      return "Published";

    case "draft":
      return "Draft";

    case "archived":
      return "Archived";

    default:
      return "Unknown";
  }
};

const EventsTable = ({
  events = [],
  loading = false,
  submitting = false,
  onView,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
}) => {
  if (loading) {
    return (
      <div className="events-table-wrapper">
        <div className="events-table-loading">
          <div className="events-table-spinner" />
          <span>Loading events...</span>
        </div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="events-table-wrapper">
        <div className="events-table-empty">
          <div className="events-empty-icon">
            <CalendarDays size={28} strokeWidth={1.7} />
          </div>

          <h3>No events found</h3>

          <p>
            There are no events matching your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="events-table-wrapper">
      <div className="events-table-scroll">
        <table className="events-table">
          <thead>
            <tr>
              <th className="event-main-column">Event</th>
              <th>Date & Time</th>
              <th>Venue</th>
              <th>Registrations</th>
              <th>Status</th>
              <th className="event-actions-column">Actions</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => {
              const id = event?._id || event?.id;
              const title = getEventTitle(event);
              const summary = getEventSummary(event);
              const category = getEventCategory(event);
              const image = getEventImage(event);
              const location = getEventLocation(event);

              const registered = getRegistrationCount(event);
              const capacity = getCapacity(event);
              const percentage = getCapacityPercentage(event);

              const status = getStatus(event);

              return (
                <tr
                  key={id || `${title}-${event?.startDate || ""}`}
                  className={event?.isArchived ? "event-row-archived" : ""}
                >
                  {/* EVENT */}
                  <td className="event-main-cell">
                    <div className="event-primary">
                      <div className="event-thumbnail">
                        {image ? (
                          <img
                            src={image}
                            alt={title}
                            loading="lazy"
                          />
                        ) : (
                          <CalendarDays
                            size={20}
                            strokeWidth={1.7}
                          />
                        )}

                        {event?.isFeatured && (
                          <span
                            className="event-featured-indicator"
                            title="Featured event"
                          >
                            <Star
                              size={10}
                              fill="currentColor"
                            />
                          </span>
                        )}
                      </div>

                      <div className="event-title-block">
                        <button
                          type="button"
                          className="event-title"
                          onClick={() => onView?.(event)}
                          disabled={submitting}
                        >
                          {title}
                        </button>

                        <div className="event-meta">
                          <span className="event-category">
                            {category}
                          </span>

                          {summary && (
                            <span className="event-description">
                              {summary}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* DATE & TIME */}
                  <td className="event-date-cell">
                    <div className="event-date">
                      <div className="event-date-primary">
                        <CalendarDays
                          size={14}
                          strokeWidth={1.8}
                        />

                        <span>
                          {formatDate(event?.startDate)}
                        </span>
                      </div>

                      {formatTime(event?.startDate) && (
                        <small>
                          {formatTime(event?.startDate)}
                        </small>
                      )}

                      {event?.endDate &&
                        formatDate(event?.endDate) !==
                          formatDate(event?.startDate) && (
                          <small className="event-end-date">
                            Ends {formatDate(event?.endDate)}
                          </small>
                        )}
                    </div>
                  </td>

                  {/* VENUE */}
                  <td className="event-location-cell">
                    <div
                      className={`event-location ${
                        location.virtual ? "is-virtual" : ""
                      }`}
                    >
                      <span className="event-location-icon">
                        <MapPin
                          size={14}
                          strokeWidth={1.8}
                        />
                      </span>

                      <div className="event-location-text">
                        <span className="event-location-primary">
                          {location.primary}
                        </span>

                        {location.secondary && (
                          <small>
                            {location.secondary}
                          </small>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* REGISTRATIONS */}
                  <td className="event-registration-cell">
                    <div className="event-registrations">
                      <div className="registration-count">
                        <Users
                          size={14}
                          strokeWidth={1.8}
                        />

                        <strong>{registered}</strong>

                        {capacity && (
                          <span className="registration-capacity">
                            / {capacity}
                          </span>
                        )}
                      </div>

                      {capacity && (
                        <div className="registration-progress">
                          <div className="registration-progress-track">
                            <span
                              className="registration-progress-fill"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>

                          <span className="registration-percentage">
                            {percentage}%
                          </span>
                        </div>
                      )}

                      {!capacity && (
                        <span className="registration-label">
                          registered
                        </span>
                      )}
                    </div>
                  </td>

                  {/* STATUS */}
                  <td>
                    <div className="event-status-wrapper">
                      <span
                        className={`event-status ${getStatusClass(
                          status
                        )}`}
                      >
                        <span className="status-dot" />

                        {getStatusLabel(status)}
                      </span>

                      {event?.isFeatured && (
                        <span className="featured-badge">
                          <Star
                            size={11}
                            fill="currentColor"
                          />
                          Featured
                        </span>
                      )}
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="event-actions-cell">
                    <div className="event-actions">
                      {/* VIEW */}
                      <button
                        type="button"
                        className="event-action-btn"
                        title="View event"
                        aria-label={`View ${title}`}
                        onClick={() => onView?.(event)}
                        disabled={submitting}
                      >
                        <Eye size={16} strokeWidth={1.8} />
                      </button>

                      {/* EDIT */}
                      <button
                        type="button"
                        className="event-action-btn"
                        title="Edit event"
                        aria-label={`Edit ${title}`}
                        onClick={() => onEdit?.(event)}
                        disabled={submitting}
                      >
                        <Edit size={16} strokeWidth={1.8} />
                      </button>

                      {/* PUBLISH */}
                      {status === "draft" && (
                        <button
                          type="button"
                          className="event-action-btn publish"
                          title="Publish event"
                          aria-label={`Publish ${title}`}
                          onClick={() => onPublish?.(event)}
                          disabled={submitting}
                        >
                          <Upload
                            size={16}
                            strokeWidth={1.8}
                          />
                        </button>
                      )}

                      {/* ARCHIVE */}
                      {status !== "archived" && (
                        <button
                          type="button"
                          className="event-action-btn archive"
                          title="Archive event"
                          aria-label={`Archive ${title}`}
                          onClick={() => onArchive?.(event)}
                          disabled={submitting}
                        >
                          <Archive
                            size={16}
                            strokeWidth={1.8}
                          />
                        </button>
                      )}

                      {/* DELETE */}
                      <button
                        type="button"
                        className="event-action-btn danger"
                        title="Delete event"
                        aria-label={`Delete ${title}`}
                        onClick={() => onDelete?.(event)}
                        disabled={submitting}
                      >
                        <Trash2
                          size={16}
                          strokeWidth={1.8}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventsTable;