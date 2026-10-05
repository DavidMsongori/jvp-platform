import { useEffect, useMemo, useState } from "react";
import {
  Search,
  CalendarDays,
  Sparkles,
  TicketCheck,
  ArrowUpRight,
  X,
} from "lucide-react";

import { useEvent } from "../../context/EventContext";

import EventStatistics from "../../components/dashboard/events/EventStatistics";
import FeaturedEvent from "../../components/dashboard/events/FeaturedEvent";
import EventCard from "../../components/dashboard/events/EventCard";
import RegistrationCard from "../../components/dashboard/events/RegistrationCard";

import "./Events.css";

const Events = () => {
  const {
    events = [],
    registrations = [],

    loading,
    error,

    loadEvents,
    loadMyRegistrations,
  } = useEvent();

  const [search, setSearch] = useState("");

  /* ===========================================================
     LOAD PAGE DATA
  =========================================================== */

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([
          loadEvents({
            isPublished: true,
            limit: 100,
          }),
          loadMyRegistrations(),
        ]);
      } catch (error) {
        console.error(error);
      }
    };

    initialize();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================================================
     FEATURED EVENT
  =========================================================== */

  const featuredEvent = useMemo(() => {
    if (!events.length) return null;

    return (
      events.find(
        (event) =>
          event.featured || event.isFeatured
      ) ||
      [...events].sort(
        (a, b) =>
          new Date(a.startDate) -
          new Date(b.startDate)
      )[0]
    );
  }, [events]);

  /* ===========================================================
     FILTER EVENTS
  =========================================================== */

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return events;

    return events.filter((event) => {
      return (
        event.title
          ?.toLowerCase()
          .includes(keyword) ||
        event.summary
          ?.toLowerCase()
          .includes(keyword) ||
        event.description
          ?.toLowerCase()
          .includes(keyword) ||
        event.category
          ?.toLowerCase()
          .includes(keyword) ||
        event.venue?.name
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [events, search]);

  /* ===========================================================
     SORT EVENTS
  =========================================================== */

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort(
      (a, b) =>
        new Date(a.startDate) -
        new Date(b.startDate)
    );
  }, [filteredEvents]);

  /* ===========================================================
     LOADING
  =========================================================== */

  if (loading) {
    return (
      <div className="member-events-page">
        <div className="events-loading">
          <div className="events-loading-spinner">
            <CalendarDays size={24} />
          </div>

          <h3>Loading Events</h3>

          <p>
            We're getting the latest JVP events
            for you.
          </p>
        </div>
      </div>
    );
  }

  /* ===========================================================
     ERROR
  =========================================================== */

  if (error) {
    return (
      <div className="member-events-page">
        <div className="events-error-state">
          <div className="events-error-icon">
            !
          </div>

          <h3>
            Unable to load events
          </h3>

          <p>
            {error?.response?.data?.message ||
              error?.message ||
              "Something went wrong while loading events."}
          </p>

          <button
            type="button"
            className="events-retry-btn"
            onClick={() =>
              Promise.all([
                loadEvents({
                  isPublished: true,
                  limit: 100,
                }),
                loadMyRegistrations(),
              ])
            }
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="member-events-page">

      {/* =======================================================
          PAGE INTRO
      ======================================================= */}

      <section className="member-events-hero">

        <div className="member-events-hero-content">

          <div className="events-eyebrow">
            <Sparkles size={14} />
            JVP Connect Events
          </div>

          <h1>
            Discover. Connect. Participate.
          </h1>

          <p>
            Discover upcoming JVP events, connect
            with other young people, register for
            activities and manage your participation.
          </p>

          <div className="events-hero-meta">

            <span>
              <CalendarDays size={15} />
              {events.length}{" "}
              {events.length === 1
                ? "event"
                : "events"}
            </span>

            <span className="hero-meta-divider">
              •
            </span>

            <span>
              <TicketCheck size={15} />
              {registrations.length}{" "}
              {registrations.length === 1
                ? "registration"
                : "registrations"}
            </span>

          </div>

        </div>

        <div className="member-events-hero-art">
          <div className="hero-calendar-card">

            <CalendarDays size={30} />

            <strong>
              Stay Connected
            </strong>

            <span>
              Never miss a JVP event
            </span>

          </div>
        </div>

      </section>

      {/* =======================================================
          STATISTICS
      ======================================================= */}

      <section className="member-events-statistics">
        <EventStatistics
          events={events}
          registrations={registrations}
        />
      </section>

      {/* =======================================================
          SEARCH
      ======================================================= */}

      <section className="events-discovery-toolbar">

        <div className="events-section-heading">

          <div className="events-heading-icon">
            <CalendarDays size={19} />
          </div>

          <div>
            <h2>Explore Events</h2>

            <p>
              Find an event that interests you.
            </p>
          </div>

        </div>

        <div className="member-events-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search events, categories or venues..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="events-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}

        </div>

      </section>

      {/* =======================================================
          SEARCH RESULT META
      ======================================================= */}

      {search && (
        <div className="events-search-result">

          <span>
            Showing{" "}
            <strong>
              {sortedEvents.length}
            </strong>{" "}
            result
            {sortedEvents.length !== 1
              ? "s"
              : ""}{" "}
            for "
            <strong>{search}</strong>"
          </span>

          <button
            type="button"
            onClick={() => setSearch("")}
          >
            Clear search
            <ArrowUpRight size={13} />
          </button>

        </div>
      )}

      {/* =======================================================
          FEATURED EVENT
      ======================================================= */}

      {featuredEvent && !search && (
        <section className="member-featured-section">

          <div className="member-section-label">
            <Sparkles size={16} />
            Featured Event
          </div>

          <FeaturedEvent
            event={featuredEvent}
          />

        </section>
      )}

      {/* =======================================================
          UPCOMING EVENTS
      ======================================================= */}

      <section className="member-events-section">

        <div className="member-section-header">

          <div>

            <div className="member-section-label">
              <CalendarDays size={16} />
              Events
            </div>

            <h2>
              {search
                ? "Search Results"
                : "Upcoming Events"}
            </h2>

            <p>
              {search
                ? "Events matching your search."
                : "Explore events happening across JVP."}
            </p>

          </div>

          <span className="events-result-count">
            {sortedEvents.length}{" "}
            {sortedEvents.length === 1
              ? "event"
              : "events"}
          </span>

        </div>

        {sortedEvents.length === 0 ? (
          <div className="member-events-empty">

            <div className="member-events-empty-icon">
              <CalendarDays size={27} />
            </div>

            <h3>
              No events found
            </h3>

            <p>
              {search
                ? "Try searching with a different keyword."
                : "There are no upcoming events available at the moment."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="events-reset-btn"
              >
                Clear Search
              </button>
            )}

          </div>
        ) : (
          <div className="member-events-grid">

            {sortedEvents.map((event) => {
              const registration =
                registrations.find(
                  (item) =>
                    item.event?._id ===
                      event._id ||
                    item.event === event._id
                );

              return (
                <EventCard
                  key={event._id}
                  event={event}
                  registration={registration}
                />
              );
            })}

          </div>
        )}

      </section>

      {/* =======================================================
          MY REGISTRATIONS
      ======================================================= */}

      <section className="member-events-section registrations-section">

        <div className="member-section-header">

          <div>

            <div className="member-section-label">
              <TicketCheck size={16} />
              Participation
            </div>

            <h2>
              My Registrations
            </h2>

            <p>
              Keep track of the events you've
              registered for.
            </p>

          </div>

          <span className="events-result-count">
            {registrations.length}{" "}
            {registrations.length === 1
              ? "registration"
              : "registrations"}
          </span>

        </div>

        {registrations.length === 0 ? (
          <div className="member-events-empty registration-empty">

            <div className="member-events-empty-icon">
              <TicketCheck size={27} />
            </div>

            <h3>
              No registrations yet
            </h3>

            <p>
              Register for an upcoming event and
              your participation will appear here.
            </p>

          </div>
        ) : (
          <div className="registrations-list">

            {registrations.map(
              (registration) => (
                <RegistrationCard
                  key={registration._id}
                  registration={registration}
                />
              )
            )}

          </div>
        )}

      </section>

    </div>
  );
};

export default Events;