import {
  Eye,
  Pencil,
  Trash2,
  Star,
  Calendar,
  Users,
} from "lucide-react";

import "./Event.css";

const EventTable = ({
  events,
  loading,
  error,
  onView,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="table-state">
        Loading events...
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-state error">
        {error}
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="table-state">
        No events have been created yet.
      </div>
    );
  }

  return (
    <div className="event-table-wrapper">

      <table className="event-table">

        <thead>
          <tr>
            <th>Event</th>
            <th>Category</th>
            <th>Status</th>
            <th>Date</th>
            <th>Venue</th>
            <th>Registered</th>
            <th>Featured</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {events.map((event) => {

            const registered =
              event.registeredParticipants || 0;

            const capacity =
              event.maxParticipants || 0;

            const percentage =
              capacity > 0
                ? Math.min(
                    Math.round(
                      (registered / capacity) * 100
                    ),
                    100
                  )
                : 0;

            return (

              <tr key={event._id}>

                {/* EVENT */}

                <td className="event-main-cell">

                  <div className="event-title-cell">

                    <img
                      src={
                        event.coverImage?.secureUrl ||
                        event.coverImage?.url ||
                        "/images/event-placeholder.jpg"
                      }
                      alt={event.title}
                    />

                    <div className="event-title-content">

                      <strong
                        title={event.title}
                      >
                        {event.title}
                      </strong>

                      <span>
                        {event.eventType || "Event"}
                      </span>

                    </div>

                  </div>

                </td>

                {/* CATEGORY */}

                <td>

                  <span className="category-badge">

                    {event.category || "General"}

                  </span>

                </td>

                {/* STATUS */}

                <td>

                  <span
                    className={`status-badge ${event.status}`}
                  >

                    {event.status}

                  </span>

                </td>

                {/* DATE */}

                <td>

                  <div className="date-cell">

                    <Calendar size={15} />

                    <span>

                      {new Date(
                        event.startDate
                      ).toLocaleDateString(
                        "en-KE",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}

                    </span>

                  </div>

                </td>

                {/* VENUE */}

                <td>

                  <div className="venue-cell">

                    <strong>

                      {event.venue?.name ||
                        "TBA"}

                    </strong>

                    {event.venue?.city && (

                      <span>

                        {event.venue.city}

                      </span>

                    )}

                  </div>

                </td>

                {/* REGISTRATIONS */}

                <td>

                  <div className="registration-cell">

                    <div className="registration-count">

                      <Users size={15} />

                      <strong>

                        {registered}

                      </strong>

                      {capacity > 0 && (

                        <span>

                          / {capacity}

                        </span>

                      )}

                    </div>

                    {capacity > 0 && (

                      <div className="registration-progress">

                        <div
                          className="registration-progress-bar"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    )}

                  </div>

                </td>

                {/* FEATURED */}

                <td>

                  {event.isFeatured ? (

                    <Star
                      size={18}
                      fill="currentColor"
                      className="featured-icon"
                    />

                  ) : (

                    <span className="not-featured">
                      —
                    </span>

                  )}

                </td>

                {/* ACTIONS */}

                <td>

                  <div className="table-actions">

                    <button
                      className="view-btn"
                      onClick={() =>
                        onView(event)
                      }
                      title="View event"
                    >

                      <Eye size={17} />

                    </button>

                    <button
                      className="edit-btn"
                      onClick={() =>
                        onEdit(event)
                      }
                      title="Edit event"
                    >

                      <Pencil size={17} />

                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        onDelete(event)
                      }
                      title="Delete event"
                    >

                      <Trash2 size={17} />

                    </button>

                  </div>

                </td>

              </tr>

            );

          })}

        </tbody>

      </table>

    </div>
  );
};

export default EventTable;