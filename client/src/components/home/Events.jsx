import { useEffect, useMemo } from "react";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useEvent } from "../../context/EventContext";

import "./Events.css";

function formatDate(event) {
  const rawDate =
    event?.startDate ||
    event?.date ||
    event?.startAt;

  if (!rawDate) {
    return {
      month: "JVP",
      day: "EVENT",
    };
  }

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return {
      month: "JVP",
      day: "EVENT",
    };
  }

  return {
    month: date
      .toLocaleDateString("en-US", {
        month: "short",
      })
      .toUpperCase(),

    day: date.toLocaleDateString("en-US", {
      day: "2-digit",
    }),
  };
}

/**
 * Safely converts both old string locations
 * and the new structured location object.
 */
function getLocation(event) {
  const location =
    event?.location ||
    event?.venue ||
    event?.county;

  if (!location) {
    return "Coast Region";
  }

  // Old event format
  if (typeof location === "string") {
    return location;
  }

  // New event format
  if (typeof location === "object") {
    return (
      location?.name ||
      location?.address ||
      location?.city ||
      location?.county ||
      "Coast Region"
    );
  }

  return "Coast Region";
}

function getEventLink(event) {
  if (event?.slug) {
    return `/events/${event.slug}`;
  }

  if (event?._id) {
    return `/events/${event._id}`;
  }

  if (event?.id) {
    return `/events/${event.id}`;
  }

  return "/events";
}

function Events() {
  const {
    events,
    loading,
    loadEvents,
  } = useEvent();

  /*
   * IMPORTANT:
   * Keep this effect with an empty dependency array.
   *
   * loadEvents may be recreated by EventContext when its
   * internal state changes. Including it in the dependency
   * array can therefore cause an infinite fetch loop.
   */
  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      try {
        await loadEvents({
          page: 1,
          limit: 6,
          search: "",
          category: "",
          eventType: "",
          featured: "",
          sort: "date_asc",
        });
      } catch (error) {
        if (mounted) {
          console.error(
            "Unable to load homepage events:",
            error
          );
        }
      }
    };

    fetchEvents();

    return () => {
      mounted = false;
    };

    // Intentionally runs only once when the homepage mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcomingEvents = useMemo(() => {
    if (!Array.isArray(events)) {
      return [];
    }

    return events
      .filter((event) => !event?.hasEnded)
      .slice(0, 3);
  }, [events]);

  return (
    <section
      className="home-events"
      id="events"
    >
      <div className="home-events__container">

        {/* Header */}
        <div className="home-events__header">
          <div>
            <span className="home-events__eyebrow">
              WHAT'S HAPPENING
            </span>

            <h2>
              Upcoming Events
            </h2>

            <p>
              Join JVP activities, forums and initiatives
              happening across the Coast Region.
            </p>
          </div>

          <Link
            to="/events"
            className="home-events__view-all"
          >
            View all events
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Loading */}
        {loading ? (
          <div
            className="home-events__loading"
            aria-label="Loading events"
          >
            <span />
            <span />
            <span />
          </div>

        ) : upcomingEvents.length > 0 ? (

          /* Events */
          <div className="home-events__grid">
            {upcomingEvents.map((event, index) => {
              const date = formatDate(event);

              return (
                <article
                  className="home-event-card"
                  key={
                    event?._id ||
                    event?.id ||
                    event?.slug ||
                    index
                  }
                >

                  {/* Date / Featured */}
                  <div className="home-event-card__top">
                    <div className="home-event-card__date">
                      <span>
                        {date.month}
                      </span>

                      <strong>
                        {date.day}
                      </strong>
                    </div>

                    {event?.featured && (
                      <span className="home-event-card__featured">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="home-event-card__content">
                    <h3>
                      {event?.title ||
                        event?.name ||
                        "JVP Event"}
                    </h3>

                    <div className="home-event-card__location">
                      <MapPin size={14} />

                      <span>
                        {getLocation(event)}
                      </span>
                    </div>

                    {event?.description && (
                      <p>
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Link */}
                  <Link
                    to={getEventLink(event)}
                    className="home-event-card__link"
                  >
                    View event
                    <ArrowRight size={15} />
                  </Link>

                </article>
              );
            })}
          </div>

        ) : (

          /* Empty */
          <div className="home-events__empty">
            <div className="home-events__empty-icon">
              <CalendarDays size={22} />
            </div>

            <div>
              <h3>
                No upcoming events
              </h3>

              <p>
                New JVP activities and opportunities
                will appear here when published.
              </p>
            </div>

            <Link to="/events">
              Explore events
              <ArrowRight size={15} />
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}

export default Events;