import { useNavigate } from "react-router-dom";
import EventActions from "./EventActions";
import "./Events.css";

function EventsTable({
  events = [],
  loading,
  pagination = {},
  filters,
  setFilters,
  onDelete,
}) {
  const navigate = useNavigate();

  /* ==========================================
     PAGINATION
  ========================================== */

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > (pagination.totalPages || 1)
    ) {
      return;
    }

    setFilters((previous) => ({
      ...previous,
      page,
    }));
  };

  /* ==========================================
     STATUS
  ========================================== */

  const getStatus = (event) => {
    const now = new Date();

    if (event.status) {
      return {
        label:
          event.status.charAt(0).toUpperCase() +
          event.status.slice(1),
        className: event.status,
      };
    }

    if (
      event.endDate &&
      new Date(event.endDate) < now
    ) {
      return {
        label: "Completed",
        className: "completed",
      };
    }

    if (
      event.startDate &&
      new Date(event.startDate) <= now
    ) {
      return {
        label: "Ongoing",
        className: "ongoing",
      };
    }

    return {
      label: "Upcoming",
      className: "upcoming",
    };
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="table-loading">
        Loading events...
      </div>
    );
  }

  /* ==========================================
     EMPTY
  ========================================== */

  if (!events.length) {
    return (
      <div className="table-empty">
        <h3>No Events Found</h3>

        <p>
          There are currently no events to
          display.
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="events-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Venue</th>
            <th>County</th>
            <th>Start Date</th>
            <th>Capacity</th>
            <th>Registered</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {events.map((event) => {
            const status = getStatus(event);

            return (
              <tr
                key={event._id}
                className="clickable-row"
                onClick={() =>
                  navigate(
                    `/admin/events/${event._id}`
                  )
                }
              >
                <td>
                  <div className="event-cell">
                    <strong>
                      {event.title}
                    </strong>

                    <small>
                      {event.category ||
                        "General Event"}
                    </small>
                  </div>
                </td>

                <td>
                  {event.venue || "-"}
                </td>

                <td>
                  {event.county || "-"}
                </td>

                <td>
                  {event.startDate
                    ? new Date(
                        event.startDate
                      ).toLocaleDateString()
                    : "-"}
                </td>

                <td>
                  {event.capacity ?? "-"}
                </td>

                <td>
                  {event.registeredCount ??
                    0}
                </td>

                <td>
                  <span
                    className={`badge event-status ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>

                <td
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <EventActions
                    event={event}
                    onView={(event) =>
                      navigate(
                        `/admin/events/${event._id}`
                      )
                    }
                    onEdit={(event) =>
                      navigate(
                        `/admin/events/${event._id}/edit`
                      )
                    }
                    onRegistrations={(
                      event
                    ) =>
                      navigate(
                        `/admin/events/${event._id}/registrations`
                      )
                    }
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="table-pagination">
        <button
          disabled={!pagination.hasPreviousPage}
          onClick={() =>
            goToPage(
              pagination.page - 1
            )
          }
        >
          Previous
        </button>

        <span>
          Showing{" "}
          {((pagination.page || 1) - 1) *
            (pagination.limit || 10) +
            1}
          {" - "}
          {Math.min(
            (pagination.page || 1) *
              (pagination.limit || 10),
            pagination.total ||
              events.length
          )}
          {" "}of{" "}
          {pagination.total ||
            events.length}
        </span>

        <button
          disabled={!pagination.hasNextPage}
          onClick={() =>
            goToPage(
              pagination.page + 1
            )
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default EventsTable;