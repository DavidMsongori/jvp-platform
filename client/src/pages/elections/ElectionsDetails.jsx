import React, { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaClock,
  FaExclamationCircle,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaRegCalendarCheck,
  FaShieldAlt,
  FaSpinner,
  FaTimesCircle,
  FaUserCheck,
  FaVoteYea,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

import "./electiondetails.css";

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
    weekday: "short",
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
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatScope = (scope) => {
  const labels = {
    regional: "Regional",
    county: "County",
    constituency: "Constituency",
    ward: "Ward",
  };

  if (!scope) return "Regional";

  return (
    labels[String(scope).toLowerCase()] ||
    String(scope).charAt(0).toUpperCase() +
      String(scope).slice(1)
  );
};

const formatLevel = (level) => {
  if (!level) return "Position";

  const labels = {
    regional: "Regional Position",
    county: "County Position",
    constituency: "Constituency Position",
    ward: "Ward Position",
  };

  return (
    labels[String(level).toLowerCase()] ||
    String(level).charAt(0).toUpperCase() +
      String(level).slice(1)
  );
};

const getElectionType = (election) =>
  String(election?.type || "elective").toLowerCase();

const getElectionLocation = (election) => {
  const parts = [];

  if (election?.ward) parts.push(election.ward);
  if (election?.constituency) parts.push(election.constituency);
  if (election?.county) parts.push(election.county);

  if (parts.length === 0) {
    return "Jumuiya ya Vijana wa Pwani";
  }

  return parts.join(" • ");
};

const isCurrentlyActive = (start, end) => {
  if (!start || !end) return false;

  const now = Date.now();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  return now >= startTime && now <= endTime;
};

/* =========================================================
   COMPONENT
========================================================= */

const ElectionsDetails = () => {
  const navigate = useNavigate();
  const { electionId } = useParams();

  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     FETCH ELECTION
  ======================================================= */

  useEffect(() => {
    const fetchElection = async () => {
      if (!electionId) {
        setError("Election could not be identified.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/elections/${electionId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Unable to load election details."
          );
        }

        const electionData =
          data?.election ||
          data?.data ||
          data;

        setElection(electionData);
      } catch (err) {
        console.error("Election details error:", err);

        setError(
          err?.message ||
            "We could not load this election. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchElection();
  }, [electionId]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const type = useMemo(
    () => getElectionType(election),
    [election]
  );

  const status = String(
    election?.status || ""
  ).toLowerCase();

  const positions = Array.isArray(election?.positions)
    ? election.positions
    : [];

  const applicationsActive = isCurrentlyActive(
    election?.applicationStart,
    election?.applicationEnd
  );

  const votingActive = isCurrentlyActive(
    election?.votingStart,
    election?.votingEnd
  );

  /* =======================================================
     STATUS
  ======================================================= */

  const getStatus = () => {
    if (status === "results") {
      return {
        label: "Results Published",
        className: "results",
        icon: <FaCheckCircle />,
      };
    }

    if (status === "closed") {
      return {
        label: "Election Closed",
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
        label: "Applications Open",
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

  const electionStatus = getStatus();

  /* =======================================================
     ACTIONS
  ======================================================= */

  const goToLogin = (destination) => {
    navigate(
      `/login?redirect=${encodeURIComponent(destination)}`
    );
  };

  const handleApply = () => {
    goToLogin(`/elections/${electionId}/apply`);
  };

  const handleVote = () => {
    goToLogin(`/elections/${electionId}/vote`);
  };

  const handleResults = () => {
    navigate(`/elections/${electionId}/results`);
  };

  const handleBack = () => {
    navigate("/elections");
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="election-details-page">
        <div className="election-details-loading">
          <div className="election-details-spinner">
            <FaSpinner />
          </div>

          <h2>Loading Election</h2>

          <p>
            Please wait while we retrieve the election
            information.
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !election) {
    return (
      <div className="election-details-page">
        <div className="election-details-error-page">
          <div className="election-details-error-icon">
            <FaExclamationCircle />
          </div>

          <h2>Election Not Available</h2>

          <p>
            {error ||
              "The requested election could not be found."}
          </p>

          <button
            type="button"
            className="election-details-primary-btn"
            onClick={handleBack}
          >
            <FaArrowLeft />
            Back to Elections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="election-details-page">
      {/* =====================================================
          TOP HERO
      ===================================================== */}

      <section className="election-details-hero">
        <div className="election-details-hero-pattern" />

        <div className="election-details-hero-content">
          <button
            type="button"
            className="election-details-back-btn"
            onClick={handleBack}
          >
            <FaArrowLeft />
            Back to Elections
          </button>

          <div className="election-details-hero-row">
            <div className="election-details-hero-main">
              <div className="election-details-badges">
                <span
                  className={`election-details-type ${type}`}
                >
                  {type === "nomination" ? (
                    <FaUserCheck />
                  ) : (
                    <FaVoteYea />
                  )}

                  {type === "nomination"
                    ? "Nomination Exercise"
                    : "Elective Exercise"}
                </span>

                <span
                  className={`election-details-status ${electionStatus.className}`}
                >
                  {electionStatus.icon}
                  {electionStatus.label}
                </span>
              </div>

              <h1>
                {election.name ||
                  "JVP Leadership Election"}
              </h1>

              {election.description && (
                <p className="election-details-hero-description">
                  {election.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <main className="election-details-container">
        {/* ===================================================
            QUICK INFO
        =================================================== */}

        <section className="election-details-quick-info">
          <div className="quick-info-item">
            <span className="quick-info-icon">
              <FaMapMarkerAlt />
            </span>

            <div>
              <small>Scope</small>
              <strong>
                {formatScope(election.scope)}
              </strong>
            </div>
          </div>

          <div className="quick-info-item">
            <span className="quick-info-icon">
              <FaMapMarkerAlt />
            </span>

            <div>
              <small>Location</small>
              <strong>
                {getElectionLocation(election)}
              </strong>
            </div>
          </div>

          <div className="quick-info-item">
            <span className="quick-info-icon">
              <FaUserCheck />
            </span>

            <div>
              <small>Positions</small>
              <strong>
                {positions.length}{" "}
                {positions.length === 1
                  ? "Position"
                  : "Positions"}
              </strong>
            </div>
          </div>

          <div className="quick-info-item">
            <span className="quick-info-icon">
              <FaCalendarAlt />
            </span>

            <div>
              <small>Exercise</small>
              <strong>
                {type === "nomination"
                  ? "Nomination"
                  : "Election"}
              </strong>
            </div>
          </div>
        </section>

        {/* ===================================================
            TWO COLUMN LAYOUT
        =================================================== */}

        <div className="election-details-layout">
          <div className="election-details-main-column">
            {/* ===============================================
                POSITIONS
            =============================================== */}

            <section className="election-details-card">
              <div className="election-details-card-header">
                <div className="election-details-card-heading">
                  <span className="card-heading-icon">
                    <FaUserCheck />
                  </span>

                  <div>
                    <span>OPPORTUNITIES</span>
                    <h2>Available Positions</h2>
                  </div>
                </div>

                <span className="position-count">
                  {positions.length}
                </span>
              </div>

              <div className="election-details-card-body">
                {positions.length === 0 ? (
                  <div className="no-positions">
                    <FaInfoCircle />
                    <p>
                      Position information will be published
                      by JVP.
                    </p>
                  </div>
                ) : (
                  <div className="election-details-positions">
                    {positions.map((position, index) => (
                      <div
                        className="election-details-position"
                        key={
                          position?._id ||
                          position?.id ||
                          index
                        }
                      >
                        <div className="position-index">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="position-content">
                          <div className="position-title-row">
                            <h3>
                              {position?.name ||
                                "Leadership Position"}
                            </h3>

                            <span>
                              {formatLevel(
                                position?.level
                              )}
                            </span>
                          </div>

                          {position?.description && (
                            <p>
                              {position.description}
                            </p>
                          )}

                          <div className="position-meta">
                            {position?.county && (
                              <span>
                                <FaMapMarkerAlt />
                                {position.county}
                              </span>
                            )}

                            {position?.constituency && (
                              <span>
                                <FaMapMarkerAlt />
                                {position.constituency}
                              </span>
                            )}

                            {position?.ward && (
                              <span>
                                <FaMapMarkerAlt />
                                {position.ward}
                              </span>
                            )}

                            {position?.maxWinners && (
                              <span>
                                <FaUserCheck />
                                Maximum{" "}
                                {position.maxWinners}{" "}
                                winner
                                {position.maxWinners === 1
                                  ? ""
                                  : "s"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* ===============================================
                TIMELINE
            =============================================== */}

            <section className="election-details-card">
              <div className="election-details-card-header">
                <div className="election-details-card-heading">
                  <span className="card-heading-icon">
                    <FaRegCalendarCheck />
                  </span>

                  <div>
                    <span>SCHEDULE</span>
                    <h2>Election Timeline</h2>
                  </div>
                </div>
              </div>

              <div className="election-details-card-body">
                <div className="election-details-timeline">
                  {/* APPLICATION */}
                  <div
                    className={`timeline-item ${
                      applicationsActive ? "active" : ""
                    }`}
                  >
                    <div className="timeline-marker">
                      <FaUserCheck />
                    </div>

                    <div className="timeline-content">
                      <div className="timeline-title">
                        <h3>Applications</h3>

                        {applicationsActive && (
                          <span>OPEN NOW</span>
                        )}
                      </div>

                      <p>
                        Candidates may submit applications
                        during this period.
                      </p>

                      <div className="timeline-date">
                        <FaCalendarAlt />

                        <span>
                          {formatDateTime(
                            election.applicationStart
                          )}{" "}
                          —{" "}
                          {formatDateTime(
                            election.applicationEnd
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* VOTING */}
                  {type === "elective" &&
                    election.votingStart &&
                    election.votingEnd && (
                      <div
                        className={`timeline-item ${
                          votingActive ? "active voting" : ""
                        }`}
                      >
                        <div className="timeline-marker">
                          <FaVoteYea />
                        </div>

                        <div className="timeline-content">
                          <div className="timeline-title">
                            <h3>Voting</h3>

                            {votingActive && (
                              <span>VOTING OPEN</span>
                            )}
                          </div>

                          <p>
                            Eligible JVP members may cast
                            their votes for approved
                            candidates.
                          </p>

                          <div className="timeline-date">
                            <FaCalendarAlt />

                            <span>
                              {formatDateTime(
                                election.votingStart
                              )}{" "}
                              —{" "}
                              {formatDateTime(
                                election.votingEnd
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* NOMINATION */}
                  {type === "nomination" && (
                    <div className="timeline-item nomination">
                      <div className="timeline-marker">
                        <FaShieldAlt />
                      </div>

                      <div className="timeline-content">
                        <div className="timeline-title">
                          <h3>Vetting & Appointment</h3>
                        </div>

                        <p>
                          Applications will be reviewed and
                          vetted by the designated JVP
                          vetting committee. Approved
                          applicants proceed to appointment.
                        </p>

                        {election.vettingCommittee && (
                          <div className="committee-note">
                            <FaShieldAlt />

                            <div>
                              <small>
                                VETTING COMMITTEE
                              </small>

                              <strong>
                                {election.vettingCommittee}
                              </strong>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ===============================================
                PARTICIPATION NOTE
            =============================================== */}

            <section className="election-details-information">
              <div className="information-icon">
                <FaShieldAlt />
              </div>

              <div>
                <h3>Secure Participation</h3>

                <p>
                  Applications and voting are available only
                  to authenticated JVP Connect members. Your
                  account will be checked against the
                  applicable eligibility requirements before
                  you proceed.
                </p>
              </div>
            </section>
          </div>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="election-details-sidebar">
            {/* ACTION CARD */}
            <section className="election-details-action-card">
              <div className="action-card-icon">
                {type === "nomination" ? (
                  <FaUserCheck />
                ) : (
                  <FaVoteYea />
                )}
              </div>

              <h2>
                {status === "voting"
                  ? "Voting is Open"
                  : status === "open"
                  ? type === "nomination"
                    ? "Applications are Open"
                    : "Applications are Open"
                  : status === "results"
                  ? "Results are Available"
                  : "Election Information"}
              </h2>

              <p>
                {status === "voting"
                  ? "Eligible members can now participate in the voting process."
                  : status === "open"
                  ? "Review the available positions and participate in the election process."
                  : status === "results"
                  ? "View the officially published results for this election."
                  : "Review the election information and schedule."}
              </p>

              {status === "open" && (
                <button
                  type="button"
                  className="election-details-action-primary"
                  onClick={handleApply}
                >
                  <FaUserCheck />
                  Apply Now
                  <FaArrowRight />
                </button>
              )}

              {status === "voting" &&
                type === "elective" && (
                  <button
                    type="button"
                    className="election-details-action-primary voting"
                    onClick={handleVote}
                  >
                    <FaVoteYea />
                    Vote Now
                    <FaArrowRight />
                  </button>
                )}

              {status === "results" && (
                <button
                  type="button"
                  className="election-details-action-primary results"
                  onClick={handleResults}
                >
                  <FaCheckCircle />
                  View Results
                  <FaArrowRight />
                </button>
              )}

              {(status === "closed" ||
                !["open", "voting", "results"].includes(
                  status
                )) && (
                <div className="action-card-closed">
                  <FaClock />
                  <span>
                    This election is currently not accepting
                    applications or votes.
                  </span>
                </div>
              )}

              <div className="action-login-note">
                <FaShieldAlt />
                Login is required to participate.
              </div>
            </section>

            {/* APPLICATION PERIOD */}
            <section className="election-details-sidebar-card">
              <div className="sidebar-card-title">
                <FaCalendarAlt />
                <h3>Application Period</h3>
              </div>

              <div className="sidebar-date">
                <span>Opens</span>
                <strong>
                  {formatDateTime(
                    election.applicationStart
                  )}
                </strong>
              </div>

              <div className="sidebar-date">
                <span>Closes</span>
                <strong>
                  {formatDateTime(
                    election.applicationEnd
                  )}
                </strong>
              </div>
            </section>

            {/* VOTING PERIOD */}
            {type === "elective" &&
              election.votingStart &&
              election.votingEnd && (
                <section className="election-details-sidebar-card">
                  <div className="sidebar-card-title">
                    <FaVoteYea />
                    <h3>Voting Period</h3>
                  </div>

                  <div className="sidebar-date">
                    <span>Opens</span>
                    <strong>
                      {formatDateTime(
                        election.votingStart
                      )}
                    </strong>
                  </div>

                  <div className="sidebar-date">
                    <span>Closes</span>
                    <strong>
                      {formatDateTime(
                        election.votingEnd
                      )}
                    </strong>
                  </div>
                </section>
              )}

            {/* LOCATION */}
            <section className="election-details-sidebar-card">
              <div className="sidebar-card-title">
                <FaMapMarkerAlt />
                <h3>Election Scope</h3>
              </div>

              <div className="scope-display">
                <strong>
                  {formatScope(election.scope)}
                </strong>

                <span>
                  {getElectionLocation(election)}
                </span>
              </div>
            </section>
          </aside>
        </div>

        {/* ===================================================
            BOTTOM CTA
        =================================================== */}

        {status === "open" && (
          <section className="election-details-bottom-cta">
            <div>
              <span>READY TO PARTICIPATE?</span>

              <h2>
                Make your voice count in JVP leadership.
              </h2>

              <p>
                Log in to JVP Connect to apply for an available
                position.
              </p>
            </div>

            <button
              type="button"
              onClick={handleApply}
            >
              <FaUserCheck />
              Apply Now
              <FaArrowRight />
            </button>
          </section>
        )}

        {status === "voting" &&
          type === "elective" && (
            <section className="election-details-bottom-cta voting">
              <div>
                <span>VOTING IS OPEN</span>

                <h2>
                  Participate in the JVP leadership election.
                </h2>

                <p>
                  Log in to JVP Connect to cast your vote.
                </p>
              </div>

              <button
                type="button"
                onClick={handleVote}
              >
                <FaVoteYea />
                Vote Now
                <FaArrowRight />
              </button>
            </section>
          )}

        {status === "results" && (
          <section className="election-details-bottom-cta results">
            <div>
              <span>OFFICIAL RESULTS</span>

              <h2>
                The results for this election are now
                available.
              </h2>

              <p>
                View the published results on JVP Connect.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResults}
            >
              <FaCheckCircle />
              View Results
              <FaArrowRight />
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

export default ElectionsDetails;