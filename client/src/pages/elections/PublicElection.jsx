import React, { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaClock,
  FaExclamationCircle,
  FaMapMarkerAlt,
  FaRegCalendarCheck,
  FaSpinner,
  FaTimesCircle,
  FaUserCheck,
  FaVoteYea,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import "./publicelection.css";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (date) => {
  if (!date) return "Not specified";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not specified";
  }

  return parsed.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "Not specified";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not specified";
  }

  return parsed.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatScope = (scope) => {
  if (!scope) return "Regional";

  const labels = {
    regional: "Regional",
    county: "County",
    constituency: "Constituency",
    ward: "Ward",
  };

  return (
    labels[String(scope).toLowerCase()] ||
    String(scope).charAt(0).toUpperCase() +
      String(scope).slice(1)
  );
};

const getElectionType = (election) =>
  String(election?.type || "elective").toLowerCase();

const isDatePassed = (date) => {
  if (!date) return false;

  return new Date(date).getTime() < Date.now();
};

const isDateActive = (start, end) => {
  if (!start || !end) return false;

  const now = Date.now();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  return now >= startTime && now <= endTime;
};

/* =========================================================
   COMPONENT
========================================================= */

const PublicElection = () => {
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     FETCH PUBLIC ELECTIONS
  ======================================================= */

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/elections`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Unable to load elections."
          );
        }

        /*
         * Supports either:
         *   [ ...elections ]
         *
         * or:
         *   { elections: [...] }
         *
         * or:
         *   { data: [...] }
         */

        const electionList = Array.isArray(data)
          ? data
          : Array.isArray(data?.elections)
          ? data.elections
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setElections(electionList);
      } catch (err) {
        console.error("Public elections error:", err);

        setError(
          err?.message ||
            "We could not load the available elections. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  /* =======================================================
     FILTER PUBLICLY RELEVANT ELECTIONS
  ======================================================= */

  const publicElections = useMemo(() => {
    return elections
      .filter((election) => {
        const status = String(
          election?.status || ""
        ).toLowerCase();

        return [
          "open",
          "voting",
          "closed",
          "results",
        ].includes(status);
      })
      .sort((a, b) => {
        const aDate = new Date(
          a?.applicationStart || a?.createdAt || 0
        ).getTime();

        const bDate = new Date(
          b?.applicationStart || b?.createdAt || 0
        ).getTime();

        return bDate - aDate;
      });
  }, [elections]);

  /* =======================================================
     ACTION ROUTING
  ======================================================= */

  const handleAction = (election, action) => {
    const electionId =
      election?._id || election?.id;

    if (!electionId) return;

    let destination = `/elections/${electionId}`;

    if (action === "apply") {
      destination = `/elections/${electionId}/apply`;
    }

    if (action === "vote") {
      destination = `/elections/${electionId}/vote`;
    }

    if (action === "results") {
      destination = `/elections/${electionId}/results`;
    }

    /*
     * Apply and Vote require authentication.
     * Preserve the intended destination so the login
     * page can redirect the user after successful login.
     */

    if (
      action === "apply" ||
      action === "vote"
    ) {
      navigate(
        `/login?redirect=${encodeURIComponent(
          destination
        )}`
      );

      return;
    }

    navigate(destination);
  };

  /* =======================================================
     STATUS
  ======================================================= */

  const getStatus = (election) => {
    const status = String(
      election?.status || ""
    ).toLowerCase();

    const type = getElectionType(election);

    if (status === "results") {
      return {
        label: "Results Published",
        className: "results",
        icon: <FaCheckCircle />,
      };
    }

    if (status === "closed") {
      return {
        label: "Closed",
        className: "closed",
        icon: <FaTimesCircle />,
      };
    }

    if (status === "voting") {
      return {
        label: "Voting Open",
        className: "voting",
        icon: <FaVoteYea />,
      };
    }

    if (status === "open") {
      return {
        label:
          type === "nomination"
            ? "Applications Open"
            : "Applications Open",
        className: "open",
        icon: <FaUserCheck />,
      };
    }

    return {
      label: "Unavailable",
      className: "closed",
      icon: <FaExclamationCircle />,
    };
  };

  /* =======================================================
     ELECTION LOCATION
  ======================================================= */

  const getLocation = (election) => {
    const parts = [];

    if (election?.ward) {
      parts.push(election.ward);
    }

    if (election?.constituency) {
      parts.push(election.constituency);
    }

    if (election?.county) {
      parts.push(election.county);
    }

    if (parts.length === 0) {
      return "Jumuiya ya Vijana wa Pwani";
    }

    return parts.join(" • ");
  };

  /* =======================================================
     ELECTION POSITION COUNT
  ======================================================= */

  const getPositionCount = (election) => {
    if (!Array.isArray(election?.positions)) {
      return 0;
    }

    return election.positions.length;
  };

  /* =======================================================
     APPLICATION / VOTING INFORMATION
  ======================================================= */

  const getAction = (election) => {
    const status = String(
      election?.status || ""
    ).toLowerCase();

    const type = getElectionType(election);

    if (status === "results") {
      return {
        label: "View Results",
        type: "results",
        icon: <FaArrowRight />,
      };
    }

    if (
      status === "voting" &&
      type === "elective"
    ) {
      return {
        label: "Vote Now",
        type: "vote",
        icon: <FaVoteYea />,
      };
    }

    if (status === "open") {
      return {
        label: "Apply Now",
        type: "apply",
        icon: <FaUserCheck />,
      };
    }

    return null;
  };

  /* =======================================================
     PAGE CONTENT
  ======================================================= */

  const pageContent = () => {
    /* =====================================================
       LOADING STATE
    ===================================================== */

    if (loading) {
      return (
        <div className="public-election-page">
          <section className="public-election-loading">
            <div className="public-election-spinner">
              <FaSpinner />
            </div>

            <h2>Loading Elections</h2>

            <p>
              Please wait while we retrieve the current
              JVP elections.
            </p>
          </section>
        </div>
      );
    }

    /* =====================================================
       ERROR STATE
    ===================================================== */

    if (error) {
      return (
        <div className="public-election-page">
          <section className="public-election-empty">
            <div className="public-election-empty-icon error">
              <FaExclamationCircle />
            </div>

            <h2>Unable to Load Elections</h2>

            <p>{error}</p>

            <button
              type="button"
              className="public-election-retry-btn"
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>
          </section>
        </div>
      );
    }

    /* =====================================================
       MAIN PAGE
    ===================================================== */

    return (
      <div className="public-election-page">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="public-election-hero">
          <div className="public-election-hero-overlay" />

          <div className="public-election-hero-content">
            <span className="public-election-eyebrow">
              JVP CONNECT
            </span>

            <h1>JVP Elections</h1>

            <p>
              Participate in the leadership and
              governance of Jumuiya ya Vijana wa Pwani.
            </p>

            <div className="public-election-hero-actions">
              <span>
                <FaCheckCircle />
                Transparent
              </span>

              <span>
                <FaUserCheck />
                Inclusive
              </span>

              <span>
                <FaVoteYea />
                Youth-Led
              </span>
            </div>
          </div>
        </section>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main className="public-election-container">

          <div className="public-election-section-heading">
            <div>
              <span className="public-election-section-eyebrow">
                PARTICIPATE
              </span>

              <h2>Current Elections</h2>

              <p>
                Explore available JVP elections and take
                part in the process.
              </p>
            </div>

            <div className="public-election-count">
              <strong>
                {publicElections.length}
              </strong>

              <span>
                {publicElections.length === 1
                  ? "Election"
                  : "Elections"}
              </span>
            </div>
          </div>

          {/* =================================================
              NO ELECTIONS
          ================================================= */}

          {publicElections.length === 0 ? (
            <section className="public-election-empty">
              <div className="public-election-empty-icon">
                <FaCalendarAlt />
              </div>

              <h2>No Elections Available</h2>

              <p>
                There are currently no public elections
                available. Please check back later for
                upcoming JVP elections and leadership
                opportunities.
              </p>
            </section>
          ) : (
            /* =================================================
               ELECTION GRID
            ================================================= */

            <div className="public-election-grid">
              {publicElections.map((election) => {
                const type =
                  getElectionType(election);

                const status =
                  getStatus(election);

                const action =
                  getAction(election);

                const applicationActive =
                  isDateActive(
                    election?.applicationStart,
                    election?.applicationEnd
                  );

                const votingActive =
                  isDateActive(
                    election?.votingStart,
                    election?.votingEnd
                  );

                const applicationClosed =
                  isDatePassed(
                    election?.applicationEnd
                  );

                return (
                  <article
                    className="public-election-card"
                    key={
                      election?._id ||
                      election?.id
                    }
                  >
                    {/* Card Top */}

                    <div className="public-election-card-top">
                      <div
                        className={`public-election-type ${type}`}
                      >
                        {type === "nomination" ? (
                          <FaUserCheck />
                        ) : (
                          <FaVoteYea />
                        )}

                        {type === "nomination"
                          ? "Nomination"
                          : "Elective"}
                      </div>

                      <div
                        className={`public-election-status ${status.className}`}
                      >
                        {status.icon}
                        {status.label}
                      </div>
                    </div>

                    {/* Card Content */}

                    <div className="public-election-card-content">
                      <h3>
                        {election?.name ||
                          "JVP Leadership Election"}
                      </h3>

                      {election?.description && (
                        <p className="public-election-description">
                          {election.description}
                        </p>
                      )}

                      <div className="public-election-meta">

                        <div className="public-election-meta-item">
                          <span className="meta-icon">
                            <FaMapMarkerAlt />
                          </span>

                          <div>
                            <small>Scope</small>

                            <strong>
                              {formatScope(
                                election?.scope
                              )}
                            </strong>
                          </div>
                        </div>

                        <div className="public-election-meta-item">
                          <span className="meta-icon">
                            <FaMapMarkerAlt />
                          </span>

                          <div>
                            <small>Location</small>

                            <strong>
                              {getLocation(
                                election
                              )}
                            </strong>
                          </div>
                        </div>

                        <div className="public-election-meta-item">
                          <span className="meta-icon">
                            <FaRegCalendarCheck />
                          </span>

                          <div>
                            <small>
                              Applications
                            </small>

                            <strong>
                              {formatDate(
                                election?.applicationStart
                              )}{" "}
                              –{" "}
                              {formatDate(
                                election?.applicationEnd
                              )}
                            </strong>
                          </div>
                        </div>

                        {type === "elective" &&
                          election?.votingStart &&
                          election?.votingEnd && (
                            <div className="public-election-meta-item">
                              <span className="meta-icon voting">
                                <FaVoteYea />
                              </span>

                              <div>
                                <small>
                                  Voting
                                </small>

                                <strong>
                                  {formatDateTime(
                                    election?.votingStart
                                  )}{" "}
                                  –{" "}
                                  {formatDateTime(
                                    election?.votingEnd
                                  )}
                                </strong>
                              </div>
                            </div>
                          )}

                      </div>

                      {/* Position count */}

                      <div className="public-election-position-info">
                        <FaUserCheck />

                        <span>
                          {getPositionCount(
                            election
                          )}{" "}
                          {getPositionCount(
                            election
                          ) === 1
                            ? "position"
                            : "positions"}{" "}
                          available
                        </span>
                      </div>

                      {/* Live information */}

                      {type === "elective" &&
                        votingActive && (
                          <div className="public-election-live-note">
                            <span className="live-dot" />
                            Voting is currently open
                          </div>
                        )}

                      {type === "nomination" &&
                        applicationActive && (
                          <div className="public-election-live-note nomination">
                            <span className="live-dot" />
                            Applications are currently
                            open
                          </div>
                        )}

                      {type === "elective" &&
                        status.className === "open" &&
                        applicationClosed && (
                          <div className="public-election-info-note">
                            <FaClock />

                            Applications have closed.
                            Voting will proceed according
                            to the published election
                            schedule.
                          </div>
                        )}
                    </div>

                    {/* Card Footer */}

                    <div className="public-election-card-footer">

                      <button
                        type="button"
                        className="public-election-details-btn"
                        onClick={() =>
                          handleAction(
                            election,
                            "details"
                          )
                        }
                      >
                        View Details
                        <FaChevronRight />
                      </button>

                      {action && (
                        <button
                          type="button"
                          className={`public-election-action-btn ${action.type}`}
                          onClick={() =>
                            handleAction(
                              election,
                              action.type
                            )
                          }
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      )}

                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* =================================================
              PUBLIC INFORMATION
          ================================================= */}

          <section className="public-election-help">

            <div className="public-election-help-icon">
              <FaUserCheck />
            </div>

            <div>
              <h3>Ready to participate?</h3>

              <p>
                You will need to log in to your JVP
                Connect account before applying for a
                position or casting your vote.
              </p>
            </div>

          </section>

        </main>
      </div>
    );
  };

  return (
    <>
      <Navbar />

      {pageContent()}

      <Footer />
    </>
  );
};

export default PublicElection;