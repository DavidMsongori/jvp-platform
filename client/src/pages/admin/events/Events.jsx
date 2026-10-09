import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Archive,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Download,
  Plus,
  RefreshCw,
  Search,
  Star,
  X,
} from "lucide-react";

import { useEvent } from "../../../context/EventContext";

import EventsTable from "./EventsTable";

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

  /* =====================================================
     LOAD EVENTS
  ===================================================== */

  useEffect(() => {
    if (typeof loadEvents === "function") {
      loadEvents();
    }
  }, [loadEvents]);

  /* =====================================================
     DATE HELPERS
  ===================================================== */

  const isValidDate = useCallback((value) => {
    if (!value) return false;

    return !Number.isNaN(new Date(value).getTime());
  }, []);

  const formatDate = useCallback(
    (value) => {
      if (!isValidDate(value)) return "Date TBA";

      return new Date(value).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    [isValidDate]
  );

  const formatTime = useCallback(
    (value) => {
      if (!isValidDate(value)) return "";

      return new Date(value).toLocaleTimeString("en-KE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [isValidDate]
  );

  /* =====================================================
     EVENT HELPERS
  ===================================================== */

  const getCapacity = useCallback(
    (event) => event.registration?.capacity ?? null,
    []
  );

  const getRegistered = useCallback(
    (event) => Number(event.registeredParticipants ?? 0),
    []
  );

  const isCompleted = useCallback(
    (event, now = new Date()) =>
      isValidDate(event.endDate) &&
      new Date(event.endDate) < now,
    [isValidDate]
  );

  const isUpcoming = useCallback(
    (event, now = new Date()) =>
      isValidDate(event.startDate) &&
      new Date(event.startDate) > now &&
      !event.isArchived,
    [isValidDate]
  );

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
        (event) => isUpcoming(event, now)
      ).length,

      completed: events.filter(
        (event) => isCompleted(event, now)
      ).length,
    };
  }, [events, isUpcoming, isCompleted]);

  /* =====================================================
     CATEGORY OPTIONS
  ===================================================== */

  const categories = useMemo(() => {
    const values = events
      .map((event) => event.category?.trim())
      .filter(Boolean);

    return [
      "all",
      ...Array.from(new Set(values)).sort((a, b) =>
        a.localeCompare(b)
      ),
    ];
  }, [events]);

  /* =====================================================
     SEARCH & FILTER
  ===================================================== */

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return events.filter((event) => {
      const searchableFields = [
        event.title,
        event.summary,
        event.category,
        event.venue?.name,
        event.venue?.county,
        event.virtualPlatform,
      ];

      const matchesSearch =
        !keyword ||
        searchableFields.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(keyword)
        );

      let matchesStatus = true;

      switch (statusFilter) {
        case "published":
          matchesStatus = Boolean(event.isPublished);
          break;

        case "draft":
          matchesStatus = !event.isPublished;
          break;

        case "featured":
          matchesStatus = Boolean(event.isFeatured);
          break;

        case "archived":
          matchesStatus = Boolean(event.isArchived);
          break;

        case "upcoming":
          matchesStatus = isUpcoming(event);
          break;

        case "completed":
          matchesStatus = isCompleted(event);
          break;

        default:
          matchesStatus = true;
      }

      const matchesCategory =
        categoryFilter === "all" ||
        event.category?.toLowerCase() ===
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
    isUpcoming,
    isCompleted,
  ]);

  /* =====================================================
     REFRESH
  ===================================================== */

  const handleRefresh = useCallback(async () => {
    try {
      await loadEvents?.();
    } catch (error) {
      console.error(
        "Failed to refresh events:",
        error
      );
    }
  }, [loadEvents]);

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = useCallback(
    async (event) => {
      const confirmed = window.confirm(
        `Permanently delete "${
          event.title || "this event"
        }"? This action cannot be undone.`
      );

      if (!confirmed) return;

      try {
        await deleteEvent?.(event._id);
      } catch (error) {
        console.error(
          "Failed to delete event:",
          error
        );

        window.alert(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to delete event."
        );
      }
    },
    [deleteEvent]
  );

  /* =====================================================
     PUBLISH
  ===================================================== */

  const handlePublish = useCallback(
    async (event) => {
      try {
        await publishEvent?.(event._id);
      } catch (error) {
        console.error(
          "Failed to publish event:",
          error
        );

        window.alert(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to publish event."
        );
      }
    },
    [publishEvent]
  );

  /* =====================================================
     ARCHIVE
  ===================================================== */

  const handleArchive = useCallback(
    async (event) => {
      const confirmed = window.confirm(
        `Archive "${
          event.title || "this event"
        }"?`
      );

      if (!confirmed) return;

      try {
        await archiveEvent?.(event._id);
      } catch (error) {
        console.error(
          "Failed to archive event:",
          error
        );

        window.alert(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to archive event."
        );
      }
    },
    [archiveEvent]
  );

  /* =====================================================
     CSV EXPORT
  ===================================================== */

  const handleExport = useCallback(() => {
    if (!filteredEvents.length) {
      window.alert(
        "There are no events to export."
      );

      return;
    }

    const escapeCsv = (value) => {
      const text = String(value ?? "");

      return `"${text.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Event",
      "Category",
      "Start Date",
      "Start Time",
      "End Date",
      "End Time",
      "Venue",
      "County",
      "Event Type",
      "Registered Participants",
      "Capacity",
      "Published",
      "Featured",
      "Archived",
    ];

    const rows = filteredEvents.map((event) => [
      event.title,
      event.category,
      formatDate(event.startDate),
      formatTime(event.startDate),
      formatDate(event.endDate),
      formatTime(event.endDate),

      event.eventType === "virtual"
        ? event.virtualPlatform ||
          "Virtual Event"
        : event.venue?.name ||
          "Venue TBA",

      event.venue?.county || "",

      event.eventType || "physical",

      getRegistered(event),

      getCapacity(event) ?? "Unlimited",

      event.isPublished ? "Yes" : "No",

      event.isFeatured ? "Yes" : "No",

      event.isArchived ? "Yes" : "No",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map(escapeCsv).join(",")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF", csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download = `jvp-events-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  }, [
    filteredEvents,
    formatDate,
    formatTime,
    getRegistered,
    getCapacity,
  ]);

  /* =====================================================
     CLEAR FILTERS
  ===================================================== */

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
  }, []);

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    categoryFilter !== "all";

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="events-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <section className="events-header">
        <div className="events-header-main">
          <div className="events-breadcrumb">
            <span>Administration</span>
            <span>/</span>
            <strong>Events</strong>
          </div>

          <div className="events-title-row">
            <div className="events-title-icon">
              <CalendarDays size={22} />
            </div>

            <div>
              <h1>Events</h1>

              <p>
                Create, manage and monitor
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
            disabled={
              loading || submitting
            }
          >
            <RefreshCw
              size={15}
              className={
                loading ? "spin" : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            className="events-btn events-btn-secondary"
            onClick={handleExport}
            disabled={
              !filteredEvents.length
            }
          >
            <Download size={15} />

            Export CSV
          </button>

          <Link
            to="/admin/events/create"
            className="events-btn events-btn-primary"
          >
            <Plus size={17} />

            Create Event
          </Link>
        </div>
      </section>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <section className="events-stat-grid">
        <article className="events-stat-card">
          <div className="events-stat-icon green">
            <CalendarDays size={18} />
          </div>

          <div className="events-stat-content">
            <span>Total Events</span>
            <strong>
              {statistics.total}
            </strong>
          </div>

          <span className="events-stat-trend">
            All events
          </span>
        </article>

        <article className="events-stat-card">
          <div className="events-stat-icon blue">
            <CheckCircle size={18} />
          </div>

          <div className="events-stat-content">
            <span>Published</span>
            <strong>
              {statistics.published}
            </strong>
          </div>

          <span className="events-stat-trend">
            Live
          </span>
        </article>

        <article className="events-stat-card">
          <div className="events-stat-icon amber">
            <Clock size={18} />
          </div>

          <div className="events-stat-content">
            <span>Drafts</span>
            <strong>
              {statistics.drafts}
            </strong>
          </div>

          <span className="events-stat-trend">
            Unpublished
          </span>
        </article>

        <article className="events-stat-card">
          <div className="events-stat-icon purple">
            <Star size={18} />
          </div>

          <div className="events-stat-content">
            <span>Featured</span>
            <strong>
              {statistics.featured}
            </strong>
          </div>

          <span className="events-stat-trend">
            Highlighted
          </span>
        </article>

        <article className="events-stat-card">
          <div className="events-stat-icon teal">
            <Calendar size={18} />
          </div>

          <div className="events-stat-content">
            <span>Upcoming</span>
            <strong>
              {statistics.upcoming}
            </strong>
          </div>

          <span className="events-stat-trend">
            Scheduled
          </span>
        </article>

        <article className="events-stat-card">
          <div className="events-stat-icon slate">
            <Archive size={18} />
          </div>

          <div className="events-stat-content">
            <span>Completed</span>
            <strong>
              {statistics.completed}
            </strong>
          </div>

          <span className="events-stat-trend">
            Finished
          </span>
        </article>
      </section>

      {/* =================================================
          EVENT MANAGEMENT
      ================================================= */}

      <section className="events-management-card">
        <div className="events-management-header">
          <div>
            <h2>Event Management</h2>

            <p>
              Manage events, schedules,
              registrations and publication.
            </p>
          </div>

          <div className="events-count">
            <strong>
              {filteredEvents.length}
            </strong>

            <span>
              {filteredEvents.length === 1
                ? "event"
                : "events"}
            </span>
          </div>
        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="events-toolbar">
          <div className="events-search">
            <Search size={16} />

            <input
              type="search"
              placeholder="Search events, categories or venues..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              aria-label="Search events"
            />

            {search && (
              <button
                type="button"
                className="events-search-clear"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="events-filters">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              aria-label="Filter events by status"
            >
              <option value="all">
                All Statuses
              </option>

              <option value="published">
                Published
              </option>

              <option value="draft">
                Drafts
              </option>

              <option value="featured">
                Featured
              </option>

              <option value="archived">
                Archived
              </option>

              <option value="upcoming">
                Upcoming
              </option>

              <option value="completed">
                Completed
              </option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              aria-label="Filter events by category"
            >
              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category === "all"
                      ? "All Categories"
                      : category}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* =================================================
            RESULTS META
        ================================================= */}

        <div className="events-results-meta">
          <span>
            Showing{" "}
            <strong>
              {filteredEvents.length}
            </strong>{" "}
            of{" "}
            <strong>
              {events.length}
            </strong>{" "}
            events
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* =================================================
            EVENTS TABLE COMPONENT
        ================================================= */}

        <EventsTable
          events={filteredEvents}
          loading={loading}
          onView={(event) => {
            window.location.href =
              `/admin/events/${event._id}`;
          }}
          onEdit={(event) => {
            window.location.href =
              `/admin/events/edit/${event._id}`;
          }}
          onDelete={handleDelete}
          onPublish={handlePublish}
          onArchive={handleArchive}
          submitting={submitting}
        />

        {/* =================================================
            FOOTER
        ================================================= */}

        {!loading &&
          filteredEvents.length > 0 && (
            <div className="events-table-footer">
              <span>
                Displaying{" "}
                {filteredEvents.length}{" "}
                {filteredEvents.length === 1
                  ? "event"
                  : "events"}
              </span>

              <button
                type="button"
                className="events-footer-refresh"
                onClick={handleRefresh}
                disabled={
                  loading ||
                  submitting
                }
              >
                <RefreshCw size={14} />

                Refresh list
              </button>
            </div>
          )}
      </section>
    </div>
  );
};

export default Events;