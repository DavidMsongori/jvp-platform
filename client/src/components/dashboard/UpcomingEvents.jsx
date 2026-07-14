import { Link } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  ArrowRight,
} from "lucide-react";

import "./UpcomingEvents.css";

function UpcomingEvents({ events = [] }) {
  return (
    <section className="upcoming-events">

      <div className="widget-header">

        <div>

          <h2>Upcoming Events</h2>

          <p>
            Events you've registered for.
          </p>

        </div>

        <Link
          to="/events"
          className="widget-link"
        >
          View All

          <ArrowRight size={18} />

        </Link>

      </div>

      {events.length === 0 ? (

        <div className="events-empty">

          <CalendarDays size={52} />

          <h3>No Upcoming Events</h3>

          <p>
            You haven't registered for any
            upcoming events yet.
          </p>

          <Link
            to="/events"
            className="browse-events-btn"
          >
            Browse Events
          </Link>

        </div>

      ) : (

        <div className="events-list">

          {events.map((registration) => {

            const event = registration.event;

            return (

              <div
                key={registration._id}
                className="event-card"
              >

                <div className="event-date">

                  <span className="day">
                    {new Date(
                      event.startDate
                    ).getDate()}
                  </span>

                  <span className="month">
                    {new Date(
                      event.startDate
                    ).toLocaleString(
                      "default",
                      {
                        month: "short",
                      }
                    )}
                  </span>

                </div>

                <div className="event-info">

                  <h3>{event.title}</h3>

                  <div className="event-meta">

                    <span>

                      <MapPin size={15} />

                      {event.venue}

                    </span>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      )}

    </section>
  );
}

export default UpcomingEvents;