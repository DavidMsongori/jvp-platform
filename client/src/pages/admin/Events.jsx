import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaPlus,
  FaSyncAlt,
} from "react-icons/fa";

import {
  getEvents,
  deleteEvent,
} from "../../services/admin.service";

import EventSummary from "../../components/admin/events/EventSummary";
import EventFilters from "../../components/admin/events/EventFilters";
import EventsTable from "../../components/admin/events/EventTable";

import "./Events.css";

function Events() {
  const navigate = useNavigate();

  /* ==========================================================
     STATE
  ========================================================== */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState({});
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({});

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    county: "",
    status: "",
    sortBy: "startDate",
    order: "asc",
  });

  /* ==========================================================
     LOAD EVENTS
  ========================================================== */

  const loadEvents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getEvents(filters);

      const data = response?.data || {};

      setSummary(data.summary || {});
      setEvents(Array.isArray(data.events) ? data.events : []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error("Failed to load events:", error);

      setEvents([]);
      setSummary({});
      setPagination({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [filters]);

  /* ==========================================================
     CREATE EVENT
  ========================================================== */

  const handleCreate = () => {
    navigate("/admin/events/create");
  };

  /* ==========================================================
     REFRESH
  ========================================================== */

  const handleRefresh = () => {
    loadEvents(true);
  };

  /* ==========================================================
     DELETE EVENT
  ========================================================== */

  const handleDelete = async (event) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"?`
    );

    if (!confirmed) return;

    try {
      await deleteEvent(event._id);

      await loadEvents(true);
    } catch (error) {
      console.error("Failed to delete event:", error);

      alert(
        error.response?.data?.message ||
          "Unable to delete event. Please try again."
      );
    }
  };

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="admin-events-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <section className="events-page-header">

        <div className="events-header-content">

          <div className="events-header-icon">
            <FaCalendarAlt />
          </div>

          <div>
            <div className="events-breadcrumb">
              Administration
              <span>/</span>
              Events
            </div>

            <h1 className="events-page-title">
              Events Management
            </h1>

            <p className="events-page-subtitle">
              Create, organize, monitor, and manage JVP events
              across the Coast region.
            </p>
          </div>

        </div>

        <div className="events-header-actions">

          <button
            type="button"
            className="events-refresh-button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <FaSyncAlt
              className={
                refreshing
                  ? "events-spin"
                  : ""
              }
            />

            <span>
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </span>
          </button>

          <button
            type="button"
            className="events-create-button"
            onClick={handleCreate}
          >
            <FaPlus />

            <span>
              Create Event
            </span>
          </button>

        </div>

      </section>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <section className="events-summary-section">

        <div className="events-section-heading">

          <div>
            <h2>Event Overview</h2>

            <p>
              Current event activity and status summary.
            </p>
          </div>

        </div>

        <EventSummary
          summary={summary}
        />

      </section>

      {/* ======================================================
          MANAGEMENT WORKSPACE
      ====================================================== */}

      <section className="events-management-card">

        <div className="events-management-header">

          <div>
            <h2>
              Manage Events
            </h2>

            <p>
              Search, filter, sort, and manage registered
              JVP events.
            </p>
          </div>

          <div className="events-count-badge">
            {pagination?.total ??
              events.length}{" "}
            Events
          </div>

        </div>

        {/* ====================================================
            FILTERS
        ==================================================== */}

        <div className="events-filters-wrapper">

          <EventFilters
            filters={filters}
            setFilters={setFilters}
            onCreate={handleCreate}
          />

        </div>

        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="events-table-wrapper">

          <EventsTable
            events={events}
            loading={loading}
            pagination={pagination}
            filters={filters}
            setFilters={setFilters}
            onDelete={handleDelete}
          />

        </div>

      </section>

    </div>
  );
}

export default Events;