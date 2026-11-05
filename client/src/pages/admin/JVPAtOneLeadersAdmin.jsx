
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaSyncAlt,
  FaUsers,
} from "react-icons/fa";

import { getJVPAtOneLeaderRegistrations } from "../../services/jvpAtOneService";
import "./JVPAtOneLeadersAdmin.css";

const COUNTIES = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
];

const COUNTY_CONSTITUENCIES = {
  Mombasa: ["Changamwe", "Jomvu", "Kisauni", "Nyali", "Likoni", "Mvita"],
  Kwale: ["Msambweni", "Lungalunga", "Matuga", "Kinango"],
  Kilifi: [
    "Kilifi North",
    "Kilifi South",
    "Kaloleni",
    "Rabai",
    "Ganze",
    "Malindi",
    "Magarini",
  ],
  "Tana River": ["Garsen", "Galole", "Bura"],
  Lamu: ["Lamu East", "Lamu West"],
  "Taita Taveta": ["Voi", "Wundanyi", "Taveta", "Mwatate"],
};

export default function JVPAtOneLeadersAdmin() {
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [county, setCounty] = useState("");
  const [constituency, setConstituency] = useState("");
  const [status, setStatus] = useState("registered");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRegistrations = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await getJVPAtOneLeaderRegistrations(
          {
            search,
            county,
            constituency,
            status,
            page,
            limit: 20,
          },
          token
        );

       const result = response?.data ?? response;

const leaders = Array.isArray(result)
  ? result
  : Array.isArray(result?.data)
    ? result.data
    : Array.isArray(result?.registrations)
      ? result.registrations
      : [];

setRegistrations(leaders);

setPagination(
  result?.pagination ?? response?.pagination ?? {
    page,
    limit: 20,
    total: leaders.length,
    totalPages: 1,
  }
);
      } catch (err) {
        setError(
          err.message || "Failed to load leaders registrations."
        );
      } finally {
        setLoading(false);
      }
    },
    [search, county, constituency, status]
  );

  useEffect(() => {
    loadRegistrations(1);
  }, [loadRegistrations]);

  const handleCountyChange = (event) => {
    setCounty(event.target.value);
    setConstituency("");
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="jvp-admin-container">
      <div className="jvp-admin-header">
        <div>
          <Link to="/admin/jvp-at-one" className="jvp-back-link">
            <FaArrowLeft /> Back to Dashboard
          </Link>

          <h1>JVP @ 1 Leaders Registrations</h1>
          <p>
            View leaders registered for the anniversary event across
            the six coastal counties.
          </p>
        </div>

        <button
          type="button"
          className="jvp-refresh-btn"
          onClick={() => loadRegistrations(pagination.page)}
          disabled={loading}
        >
          <FaSyncAlt /> Refresh
        </button>
      </div>

      <div className="jvp-admin-stats">
        <div className="jvp-stat-card">
          <div className="jvp-stat-icon">
            <FaUsers />
          </div>
          <div>
            <h3>{pagination.total ?? 0}</h3>
            <p>Leader Registrations</p>
          </div>
        </div>
      </div>

      <div className="jvp-section">
        <div className="jvp-section-header">
          <h2>Registered Leaders</h2>
        </div>

        <form
          className="jvp-filter-form"
          onSubmit={(event) => {
            event.preventDefault();
            loadRegistrations(1);
          }}
        >
          <div className="jvp-search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search name, phone, town or location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select value={county} onChange={handleCountyChange}>
            <option value="">All Counties</option>
            {COUNTIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={constituency}
            onChange={(event) => setConstituency(event.target.value)}
            disabled={!county}
          >
            <option value="">All Constituencies</option>
            {(COUNTY_CONSTITUENCIES[county] || []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="registered">Registered</option>
            <option value="cancelled">Cancelled</option>
            <option value="all">All Statuses</option>
          </select>

          <button type="submit" className="jvp-filter-btn">
            Apply Filters
          </button>
        </form>

        {error && <div className="jvp-error-message">{error}</div>}

        <div className="jvp-table-wrapper">
          <table className="jvp-registrations-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Position</th>
                <th>Phone Number</th>
                <th>County</th>
                <th>Constituency</th>
                <th>Ward</th>
                <th>Pick-up Town</th>
                <th>T-Shirt Size</th>
                <th>Date Registered</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11">Loading leaders registrations...</td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan="11">No leaders registrations found.</td>
                </tr>
              ) : (
                registrations.map((leader, index) => (
                  <tr key={leader._id || leader.id}>
                    <td>
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td>{leader.fullName}</td>
                    <td>{leader.position}</td>  
                    <td>{leader.phone}</td>
                    <td>{leader.county}</td>
                    <td>{leader.constituency}</td>
                    <td>{leader.ward}</td>
                    <td>{leader.pickupTown}</td>
                    <td>{leader.tShirtSize}</td>
                    <td>{formatDate(leader.createdAt)}</td>
                    <td>
                      <span
                        className={`jvp-status-badge ${leader.registrationStatus}`}
                      >
                        {leader.registrationStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="jvp-pagination">
          <span>
            Showing {registrations.length} of {pagination.total ?? 0} leaders
          </span>

          <div>
            <button
              type="button"
              onClick={() => loadRegistrations(pagination.page - 1)}
              disabled={loading || pagination.page <= 1}
            >
              Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() => loadRegistrations(pagination.page + 1)}
              disabled={
                loading || pagination.page >= (pagination.totalPages || 1)
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
