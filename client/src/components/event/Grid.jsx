import EventCard from "./EventCard";
import EmptyState from "./EmptyState";
import Skeleton from "./Skeleton";

import "./Grid.css";

const getEventId = (event, index) =>
  event?._id || event?.id || event?.slug || `event-${index}`;

const Grid = ({
  events = [],
  loading = false,
  error = "",
  onRetry,
}) => {
  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <section className="events-grid-section">
        <div className="events-grid-container">
          <div className="events-grid-heading events-grid-heading--loading">
            <div>
              <span className="events-grid-eyebrow">JVP CONNECT</span>
              <h2>Upcoming Events</h2>
            </div>
          </div>

          <div className="events-grid events-grid--loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`event-skeleton-${index}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ==========================================
     ERROR
  ========================================== */

  if (error) {
    return (
      <section className="events-grid-section">
        <div className="events-grid-container">
          <div className="events-error">
            <div className="events-error__icon">!</div>

            <div className="events-error__content">
              <span className="events-grid-eyebrow">
                EVENTS
              </span>

              <h3>Unable to load events</h3>

              <p>
                {error ||
                  "Something went wrong while loading JVP events. Please try again."}
              </p>

              {onRetry && (
                <button
                  type="button"
                  className="events-error__button"
                  onClick={onRetry}
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ==========================================
     EMPTY
  ========================================== */

  if (!events.length) {
    return (
      <section className="events-grid-section">
        <div className="events-grid-container">
          <div className="events-grid-heading">
            <div>
              <span className="events-grid-eyebrow">
                JVP CONNECT
              </span>
              <h2>Upcoming Events</h2>
            </div>

            <span className="events-grid-count">
              0 events
            </span>
          </div>

          <EmptyState />
        </div>
      </section>
    );
  }

  /* ==========================================
     SUCCESS
  ========================================== */

  return (
    <section className="events-grid-section">
      <div className="events-grid-container">
        <div className="events-grid-heading">
          <div>
            <span className="events-grid-eyebrow">
              JVP CONNECT
            </span>

            <h2>Upcoming Events</h2>
          </div>

          <span className="events-grid-count">
            {events.length}{" "}
            {events.length === 1 ? "event" : "events"}
          </span>
        </div>

        <div className="events-grid">
          {events.map((event, index) => (
            <EventCard
              key={getEventId(event, index)}
              event={event}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Grid;