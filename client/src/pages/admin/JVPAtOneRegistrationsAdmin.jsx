import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaUsers,
  FaSearch,
  FaFilter,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSyncAlt,
  FaExclamationCircle,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
} from "react-icons/fa";

import { getJVPAtOneRegistrations } from "../../services/jvpAtOneService";

import "./JVPAtOneAdmin.css";

const CONSTITUENCIES = ["Lamu East", "Lamu West"];

const WARDS = {
  "Lamu East": ["Faza", "Kiunga", "Basuba"],
  "Lamu West": [
    "Shela",
    "Mkomani",
    "Hindi",
    "Mkunumbi",
    "Hongwe",
    "Bahari",
    "Witu",
    "Mpeketoni",
  ],
};

export default function JVPAtOneRegistrationsAdmin() {
  const [registrations, setRegistrations] = useState([]);
  const [registrationLoading, setRegistrationLoading] = useState(true);
  const [registrationError, setRegistrationError] = useState("");

  const [registrationPagination, setRegistrationPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [constituencyFilter, setConstituencyFilter] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("registered");
  const [page, setPage] = useState(1);

  const loadRegistrations = useCallback(async () => {
    setRegistrationLoading(true);
    setRegistrationError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await getJVPAtOneRegistrations(
        {
          search,
          constituency: constituencyFilter,
          ward: wardFilter,
          status: statusFilter,
          page,
          limit: 20,
        },
        token
      );

      const data = response?.data ?? response;

      setRegistrations(
        Array.isArray(data?.registrations)
          ? data.registrations
          : Array.isArray(data?.data?.registrations)
            ? data.data.registrations
            : []
      );

      const pagination = data?.pagination ?? data?.data?.pagination;

      if (pagination) {
        setRegistrationPagination({
          total: Number(pagination.total) || 0,
          page: Number(pagination.page) || page,
          limit: Number(pagination.limit) || 20,
          totalPages: Math.max(
            1,
            Number(pagination.totalPages) || 1
          ),
        });
      } else {
        setRegistrationPagination({
          total: 0,
          page,
          limit: 20,
          totalPages: 1,
        });
      }
    } catch (err) {
      setRegistrations([]);
      setRegistrationError(
        err.message || "Unable to load registered youths."
      );
    } finally {
      setRegistrationLoading(false);
    }
  }, [search, constituencyFilter, wardFilter, statusFilter, page]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleConstituencyChange = (event) => {
    setConstituencyFilter(event.target.value);
    setWardFilter("");
    setPage(1);
  };

  const handleWardChange = (event) => {
    setWardFilter(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="jvp-one-admin">
      <header className="jvp-one-admin-header">
        <div>
          <span className="jvp-one-eyebrow">
            JUMUIYA YA VIJANA WA PWANI
          </span>

          <h1>Registered Youths</h1>

          <p>
            View and manage youth registrations from Lamu County
            for the JVP @ 1 anniversary celebration.
          </p>
        </div>

        <button
          type="button"
          className="jvp-one-refresh"
          onClick={loadRegistrations}
          disabled={registrationLoading}
        >
          <FaSyncAlt />
          Refresh
        </button>
      </header>

      <div style={{ marginBottom: "20px" }}>
        <Link
          to="/admin/jvp-at-one"
          className="jvp-one-back-link"
        >
          <FaArrowLeft />
          Back to JVP @ 1 Dashboard
        </Link>
      </div>

      <section className="jvp-one-registrations">
        <div className="jvp-one-gallery-heading">
          <div>
            <h2>
              <FaUsers /> Registered youths
            </h2>

            <p>
              Search, filter and view all youth registrations.
            </p>
          </div>

          <span className="jvp-one-count">
            {registrationPagination.total}{" "}
            {registrationPagination.total === 1
              ? "registration"
              : "registrations"}
          </span>
        </div>

        <div className="jvp-one-registration-filters">
          <div className="jvp-one-search-field">
            <FaSearch />
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search name or phone number"
              aria-label="Search registered youths"
            />
          </div>

          <div className="jvp-one-filter-field">
            <FaFilter />
            <select
              value={constituencyFilter}
              onChange={handleConstituencyChange}
              aria-label="Filter by constituency"
            >
              <option value="">All constituencies</option>
              {CONSTITUENCIES.map((constituency) => (
                <option key={constituency} value={constituency}>
                  {constituency}
                </option>
              ))}
            </select>
          </div>

          <div className="jvp-one-filter-field">
            <FaMapMarkerAlt />
            <select
              value={wardFilter}
              onChange={handleWardChange}
              aria-label="Filter by ward"
              disabled={!constituencyFilter}
            >
              <option value="">All wards</option>
              {(WARDS[constituencyFilter] || []).map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
          </div>

          <div className="jvp-one-filter-field">
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              aria-label="Filter by registration status"
            >
              <option value="registered">Registered</option>
              <option value="cancelled">Cancelled</option>
              <option value="all">All statuses</option>
            </select>
          </div>
        </div>

        {registrationError && (
          <div className="jvp-one-alert error" role="alert">
            <FaExclamationCircle />
            <span>{registrationError}</span>

            <button
              type="button"
              onClick={loadRegistrations}
              className="jvp-one-inline-retry"
            >
              Try again
            </button>
          </div>
        )}

        {registrationLoading ? (
          <div className="jvp-one-empty">
            <FaSyncAlt className="jvp-one-loading-icon" />
            <p>Loading registrations...</p>
          </div>
        ) : registrationError ? null : registrations.length === 0 ? (
          <div className="jvp-one-empty">
            <FaUsers />
            <h3>No registrations found</h3>
            <p>
              Try changing your search or filters to see other
              registrations.
            </p>
          </div>
        ) : (
          <>
            <div className="jvp-one-table-wrapper">
              <table className="jvp-one-registration-table">
                <thead>
                  <tr>
                    <th>Youth</th>
                    <th>Phone number</th>
                    <th>Constituency</th>
                    <th>Ward</th>
                    <th>Date registered</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {registrations.map((registration, index) => {
                    const id =
                      registration._id ||
                      registration.id ||
                      `${registration.phone}-${index}`;

                    const status =
                      registration.registrationStatus || "registered";

                    return (
                      <tr key={id}>
                        <td>
                          <div className="jvp-one-youth-name">
                            <span className="jvp-one-avatar">
                              {(registration.fullName || "Y")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>

                            <strong>
                              {registration.fullName || "Unnamed youth"}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <span className="jvp-one-table-detail">
                            <FaPhone />
                            {registration.phone || "—"}
                          </span>
                        </td>

                        <td>{registration.constituency || "—"}</td>

                        <td>{registration.ward || "—"}</td>

                        <td>
                          <span className="jvp-one-table-detail">
                            <FaCalendarAlt />
                            {formatDate(registration.createdAt)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`jvp-one-status ${status.toLowerCase()}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="jvp-one-pagination">
              <span>
                Page {registrationPagination.page} of{" "}
                {registrationPagination.totalPages}
              </span>

              <div>
                <button
                  type="button"
                  onClick={() => setPage((current) => current - 1)}
                  disabled={page <= 1 || registrationLoading}
                  aria-label="Previous page"
                >
                  <FaChevronLeft />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={
                    page >= registrationPagination.totalPages ||
                    registrationLoading
                  }
                  aria-label="Next page"
                >
                  Next
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}