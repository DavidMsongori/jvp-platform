import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";

import {
  Calendar,
  CalendarDays,
  Plus,
  Search,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Archive,
  Users,
  Star,
  Clock,
  MapPin,
  MoreHorizontal,
} from "lucide-react";

import { useEvent } from "../../../context/EventContext";

import "./Events.css";

const Events = () => {
  const {
    events = [],
    loading = false,
    submitting = false,
    loadEvents,
    deleteEvent,
    publishEvent,
    archiveEvent,
  } = useEvent();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadEvents();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const statistics = useMemo(() => {
    const now = new Date();

    return {
      total: events.length,

      published: events.filter(
        (event) => event.isPublished
      ).length,

      drafts: events.filter(
        (event) => !event.isPublished
      ).length,

      featured: events.filter(
        (event) => event.isFeatured
      ).length,

      upcoming: events.filter(
        (event) =>
          event.startDate &&
          new Date(event.startDate) > now &&
          !event.isArchived
      ).length,

      completed: events.filter(
        (event) =>
          event.endDate &&
          new Date(event.endDate) < now
      ).length,
    };
  }, [events]);

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categories = useMemo(() => {
    const values = events
      .map((event) => event.category)
      .filter(Boolean);

    return ["all", ...new Set(values)];
  }, [events]);

  /* =====================================================
     FILTER EVENTS
  ===================================================== */

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        keyword === "" ||
        event.title?.toLowerCase().includes(keyword) ||
        event.summary?.toLowerCase().includes(keyword) ||
        event.category?.toLowerCase().includes(keyword) ||
        event.venue?.name?.toLowerCase().includes(keyword);

      let matchesStatus = true;

      switch (statusFilter) {
        case "published":
          matchesStatus = event.isPublished;
          break;

        case "draft":
          matchesStatus = !event.isPublished;
          break;

        case "featured":
          matchesStatus = event.isFeatured;
          break;

        case "archived":
          matchesStatus = event.isArchived;
          break;

        default:
          matchesStatus = true;
      }

      const matchesCategory =
        categoryFilter === "all"
          ? true
          : event.category?.toLowerCase() ===
            categoryFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    events,
    search,
    statusFilter,
    categoryFilter,
  ]);

  /* =====================================================
     ACTIONS
  ===================================================== */

  const handleRefresh = useCallback(async () => {
    try {
      await loadEvents();
    } catch (error) {
      console.error(error);
    }
  }, [loadEvents]);

  const handleDelete = useCallback(
    async (id) => {
      const confirmed = window.confirm(
        "Are you sure you want to permanently delete this event?"
      );

      if (!confirmed) return;

      try {
        await deleteEvent(id);
      } catch (error) {
        console.error(error);

        alert(
          error?.response?.data?.message ||
            "Failed to delete event."
        );
      }
    },
    [deleteEvent]
  );

  const handlePublish = useCallback(
    async (id) => {
      try {
        await publishEvent(id);
      } catch (error) {
        console.error(error);

        alert(
          error?.response?.data?.message ||
            "Failed to publish event."
        );
      }
    },
    [publishEvent]
  );

  const handleArchive = useCallback(
    async (id) => {
      try {
        await archiveEvent(id);
      } catch (error) {
        console.error(error);

        alert(
          error?.response?.data?.message ||
            "Failed to archive event."
        );
      }
    },
    [archiveEvent]
  );

  /* =====================================================
     HELPERS
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-KE",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString(
      "en-KE",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getCapacity = (event) =>
    event.registration?.capacity ?? null;

  const getRegistered = (event) =>
    event.registeredParticipants ?? 0;

  const getCapacityPercentage = (event) => {
    const capacity = getCapacity(event);

    if (!capacity) return 0;

    return Math.min(
      100,
      Math.round(
        (getRegistered(event) / capacity) * 100
      )
    );
  };

  return (
    <div className="events-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="events-header">

        <div className="events-header-main">

          <div className="events-breadcrumb">
            <span>Administration</span>
            <span>/</span>
            <strong>Events</strong>
          </div>

          <div className="events-title-row">

            <div className="events-title-icon">
              <CalendarDays size={25} />
            </div>

            <div>
              <h1>Events</h1>

              <p>
                Create, manage, publish and monitor
                JVP Connect events.
              </p>
            </div>

          </div>

        </div>

        <div className="events-header-actions">

          <button
            type="button"
            className="events-btn events-btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            className="events-btn events-btn-secondary"
          >
            <Download size={17} />
            Export
          </button>

          <Link
            to="/admin/events/create"
            className="events-btn events-btn-primary"
          >
            <Plus size={18} />
            Create Event
          </Link>

        </div>

      </section>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section className="events-stat-grid">

        <article className="events-stat-card">

          <div className="events-stat-icon green">
            <CalendarDays size={20} />
          </div>

          <div>
            <span>Total Events</span>
            <strong>{statistics.total}</strong>
          </div>

          <div className="events-stat-trend">
            All events
          </div>

        </article>

        <article className="events-stat-card">

          <div className="events-stat-icon blue">
            <CheckCircle size={20} />
          </div>

          <div>
            <span>Published</span>
            <strong>{statistics.published}</strong>
          </div>

          <div className="events-stat-trend">
            Live
          </div>

        </article>

        <article className="events-stat-card">

          <div className="events-stat-icon amber">
            <Clock size={20} />
          </div>

          <div>
            <span>Drafts</span>
            <strong>{statistics.drafts}</strong>
          </div>

          <div className="events-stat-trend">
            Pending
          </div>

        </article>

        <article className="events-stat-card">

          <div className="events-stat-icon purple">
            <Star size={20} />
          </div>

          <div>
            <span>Featured</span>
            <strong>{statistics.featured}</strong>
          </div>

          <div className="events-stat-trend">
            Highlighted
          </div>

        </article>

        <article className="events-stat-card">

          <div className="events-stat-icon teal">
            <Calendar size={20} />
          </div>

          <div>
            <span>Upcoming</span>
            <strong>{statistics.upcoming}</strong>
          </div>

          <div className="events-stat-trend">
            Scheduled
          </div>

        </article>

        <article className="events-stat-card">

          <div className="events-stat-icon slate">
            <Archive size={20} />
          </div>

          <div>
            <span>Completed</span>
            <strong>{statistics.completed}</strong>
          </div>

          <div className="events-stat-trend">
            Finished
          </div>

        </article>

      </section>

      {/* =====================================================
          MANAGEMENT CARD
      ===================================================== */}

      <section className="events-management-card">

        <div className="events-management-header">

          <div>
            <h2>Event Management</h2>

            <p>
              Manage your organization's events,
              registrations and publication status.
            </p>
          </div>

          <div className="events-count">
            <strong>{filteredEvents.length}</strong>
            <span>events</span>
          </div>

        </div>

        {/* =====================================================
            TOOLBAR
        ===================================================== */}

        <div className="events-toolbar">

          <div className="events-search">

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
                onClick={() => setSearch("")}
                className="events-search-clear"
                aria-label="Clear search"
              >
                ×
              </button>
            )}

          </div>

          <div className="events-filters">

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="all">
                All Status
              </option>

              <option value="published">
                Published
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="featured">
                Featured
              </option>

              <option value="archived">
                Archived
              </option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category === "all"
                    ? "All Categories"
                    : category}
                </option>
              ))}
            </select>

          </div>

        </div>

        {/* =====================================================
            RESULTS META
        ===================================================== */}

        <div className="events-results-meta">

          <div>
            Showing{" "}
            <strong>
              {filteredEvents.length}
            </strong>{" "}
            of{" "}
            <strong>
              {events.length}
            </strong>{" "}
            events
          </div>

          {(search ||
            statusFilter !== "all" ||
            categoryFilter !== "all") && (
            <button
              type="button"
              className="clear-filters"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              Clear filters
            </button>
          )}

        </div>

        {/* =====================================================
            TABLE
        ===================================================== */}

        <div className="events-table-wrapper">

          <table className="events-table">

            <thead>
              <tr>
                <th>Event</th>
                <th>Date & Time</th>
                <th>Venue</th>
                <th>Registrations</th>
                <th>Status</th>
                <th className="actions-column">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="events-table-state"
                  >
                    <div className="table-loading">
                      <RefreshCw
                        size={22}
                        className="spin"
                      />
                      <span>
                        Loading events...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="events-table-state"
                  >
                    <div className="empty-events">

                      <div className="empty-events-icon">
                        <CalendarDays size={28} />
                      </div>

                      <h3>
                        No events found
                      </h3>

                      <p>
                        Try adjusting your filters
                        or create a new event.
                      </p>

                      <Link
                        to="/admin/events/create"
                        className="events-btn events-btn-primary"
                      >
                        <Plus size={17} />
                        Create Event
                      </Link>

                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {

                  const capacity =
                    getCapacity(event);

                  const registered =
                    getRegistered(event);

                  const percentage =
                    getCapacityPercentage(event);

                  const isArchived =
                    Boolean(event.isArchived);

                  const isPublished =
                    Boolean(event.isPublished);

                  const isFeatured =
                    Boolean(event.isFeatured);

                  return (
                    <tr key={event._id}>

                      {/* EVENT */}

                      <td>

                        <div className="event-cell">

                          <div className="event-cover">

                            {event.coverImage?.url ? (
                              <img
                                src={event.coverImage.url}
                                alt={event.title}
                              />
                            ) : (
                              <div className="event-cover-placeholder">
                                <Calendar size={21} />
                              </div>
                            )}

                          </div>

                          <div className="event-details">

                            <div className="event-title-row-small">

                              <h4>
                                {event.title}
                              </h4>

                              {isFeatured && (
                                <span className="event-featured-badge">
                                  <Star size={11} />
                                  Featured
                                </span>
                              )}

                            </div>

                            <p>
                              {event.summary ||
                                "No event summary available."}
                            </p>

                            <span className="event-category">
                              {event.category ||
                                "General"}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* DATE */}

                      <td>

                        <div className="event-date-cell">

                          <strong>
                            {formatDate(
                              event.startDate
                            )}
                          </strong>

                          <span>
                            {formatTime(
                              event.startDate
                            )}
                          </span>

                          <div className="date-divider">
                            →
                          </div>

                          <strong>
                            {formatDate(
                              event.endDate
                            )}
                          </strong>

                          <span>
                            {formatTime(
                              event.endDate
                            )}
                          </span>

                        </div>

                      </td>

                      {/* VENUE */}

                      <td>

                        <div className="event-venue">

                          <div className="venue-icon">
                            <MapPin size={15} />
                          </div>

                          <div>
                            <strong>
                              {event.eventType ===
                              "virtual"
                                ? "Virtual Event"
                                : event.venue?.name ||
                                  "Venue TBA"}
                            </strong>

                            <span>
                              {event.eventType ===
                              "virtual"
                                ? event.virtualPlatform ||
                                  "Online"
                                : event.venue?.county ||
                                  ""}
                            </span>
                          </div>

                        </div>

                      </td>

                      {/* REGISTRATIONS */}

                      <td>

                        <div className="registration-cell">

                          <div className="registration-top">

                            <strong>
                              {registered}
                            </strong>

                            <span>
                              {capacity
                                ? ` / ${capacity}`
                                : " / Unlimited"}
                            </span>

                          </div>

                          {capacity && (
                            <div className="capacity-bar">
                              <div
                                className="capacity-progress"
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>
                          )}

                          <small>
                            {capacity
                              ? `${percentage}% full`
                              : "Open registration"}
                          </small>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td>

                        <div className="event-status-stack">

                          {isPublished ? (
                            <span className="status-badge published">
                              <span />
                              Published
                            </span>
                          ) : (
                            <span className="status-badge draft">
                              <span />
                              Draft
                            </span>
                          )}

                          {isArchived && (
                            <span className="status-badge archived">
                              <span />
                              Archived
                            </span>
                          )}

                        </div>

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="event-actions">

                          <Link
                            to={`/admin/events/${event._id}`}
                            className="event-action-btn"
                            title="View Event"
                            aria-label="View Event"
                          >
                            <Eye size={17} />
                          </Link>

                          <Link
                            to={`/admin/events/edit/${event._id}`}
                            className="event-action-btn"
                            title="Edit Event"
                            aria-label="Edit Event"
                          >
                            <Edit size={17} />
                          </Link>

                          {!isPublished && (
                            <button
                              type="button"
                              className="event-action-btn success"
                              onClick={() =>
                                handlePublish(
                                  event._id
                                )
                              }
                              disabled={submitting}
                              title="Publish Event"
                              aria-label="Publish Event"
                            >
                              <CheckCircle
                                size={17}
                              />
                            </button>
                          )}

                          {!isArchived && (
                            <button
                              type="button"
                              className="event-action-btn warning"
                              onClick={() =>
                                handleArchive(
                                  event._id
                                )
                              }
                              disabled={submitting}
                              title="Archive Event"
                              aria-label="Archive Event"
                            >
                              <Archive size={17} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="event-action-btn danger"
                            onClick={() =>
                              handleDelete(
                                event._id
                              )
                            }
                            disabled={submitting}
                            title="Delete Event"
                            aria-label="Delete Event"
                          >
                            <Trash2 size={17} />
                          </button>

                          <button
                            type="button"
                            className="event-action-btn more"
                            title="More Actions"
                            aria-label="More Actions"
                          >
                            <MoreHorizontal
                              size={17}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
};

export default Events;