import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt } from "react-icons/fa";

import {
  getEvents,
  deleteEvent,
} from "../../services/admin.service";

import EventSummary from "../../components/admin/events/EventSummary";
import EventFilters from "../../components/admin/events/EventFilters";
import EventsTable from "../../components/admin/events/EventsTable";

import "../../components/admin/events/Events.css";

function Events() {
  const navigate = useNavigate();

  /* ==========================================
     STATE
  ========================================== */

  const [loading, setLoading] = useState(true);

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

  /* ==========================================
     LOAD EVENTS
  ========================================== */

  const loadEvents = async () => {
    try {
      setLoading(true);

      const response = await getEvents(filters);

      setSummary(response.data.summary || {});

      setEvents(response.data.events || []);

      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error(
        "Failed to load events:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [filters]);

  /* ==========================================
     CREATE EVENT
  ========================================== */

  const handleCreate = () => {
    navigate("/admin/events/create");
  };

  /* ==========================================
     DELETE EVENT
  ========================================== */

  const handleDelete = async (event) => {
    const confirmed = window.confirm(
      `Delete "${event.title}"?`
    );

    if (!confirmed) return;

    try {
      await deleteEvent(event._id);

      loadEvents();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Unable to delete event."
      );
    }
  };

  /* ==========================================
     PAGE
  ========================================== */

  return (
    <div className="admin-page">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FaCalendarAlt />
            Events
          </h1>

          <p className="page-subtitle">
            Manage all JVP events.
          </p>
        </div>
      </div>

      {/* ======================================
          SUMMARY
      ====================================== */}

      <EventSummary summary={summary} />

      {/* ======================================
          FILTERS
      ====================================== */}

      <EventFilters
        filters={filters}
        setFilters={setFilters}
        onCreate={handleCreate}
      />

      {/* ======================================
          TABLE
      ====================================== */}

      <EventsTable
        events={events}
        loading={loading}
        pagination={pagination}
        filters={filters}
        setFilters={setFilters}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default Events;