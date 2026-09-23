import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getElections,
  getMyApplications,
} from "../../services/election.service";

import "./Elections.css";

/* ==========================================================
   HELPERS
========================================================== */

const formatDate = (date) => {
  if (!date) return "Not specified";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not specified";
  }

  return parsedDate.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getScopeLabel = (election) => {
  switch (election?.scope) {
    case "regional":
      return "Regional";

    case "county":
      return election?.county
        ? `County — ${election.county}`
        : "County";

    case "constituency":
      return election?.constituency
        ? `Constituency — ${election.constituency}`
        : "Constituency";

    case "ward":
      return election?.ward
        ? `Ward — ${election.ward}`
        : "Ward";

    default:
      return election?.scope || "Election";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "draft":
      return "Draft";

    case "open":
      return "Applications Open";

    case "voting":
      return "Voting Open";

    case "closed":
      return "Voting Closed";

    case "results":
      return "Results Published";

    case "cancelled":
      return "Cancelled";

    default:
      return status || "Unknown";
  }
};

const getApplicationStatusLabel = (status) => {
  switch (status) {
    case "submitted":
      return "Submitted";

    case "review":
      return "Under Review";

    case "vetted":
      return "Vetted";

    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "withdrawn":
      return "Withdrawn";

    default:
      return status || "Unknown";
  }
};

const getApplicationElectionId = (application) => {
  return (
    application?.election?._id ||
    application?.election ||
    application?.electionId ||
    null
  );
};

const getApplicationPositionId = (application) => {
  return (
    application?.position?._id ||
    application?.position ||
    application?.positionId ||
    null
  );
};

const getElectionApplication = (
  applications,
  electionId
) => {
  if (!Array.isArray(applications)) {
    return [];
  }

  return applications.filter((application) => {
    const applicationElectionId =
      getApplicationElectionId(application);

    return (
      applicationElectionId &&
      String(applicationElectionId) ===
        String(electionId)
    );
  });
};

const getPrimaryAction = (election) => {
  switch (election?.status) {
    case "open":
      return "View & Apply";

    case "voting":
      return "Vote Now";

    case "results":
      return "View Results";

    case "closed":
      return "View Election";

    default:
      return "View Election";
  }
};

/* ==========================================================
   COMPONENT
========================================================== */

const Elections = () => {
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ========================================================
     LOAD DASHBOARD DATA
  ======================================================== */

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          electionsResponse,
          applicationsResponse,
        ] = await Promise.all([
          getElections(),
          getMyApplications(),
        ]);

        const electionData =
          electionsResponse?.data;

        const applicationData =
          applicationsResponse?.data;

        setElections(
          Array.isArray(electionData)
            ? electionData
            : []
        );

        setApplications(
          Array.isArray(applicationData)
            ? applicationData
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load election dashboard:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load the election dashboard. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  /* ========================================================
     DASHBOARD STATISTICS
  ======================================================== */

  const statistics = useMemo(() => {
    const activeElections = elections.filter(
      (election) =>
        election.status === "open" ||
        election.status === "voting"
    ).length;

    const votingOpen = elections.filter(
      (election) =>
        election.status === "voting"
    ).length;

    const underReview = applications.filter(
      (application) =>
        [
          "submitted",
          "review",
          "vetted",
        ].includes(application.status)
    ).length;

    const approved = applications.filter(
      (application) =>
        application.status === "approved"
    ).length;

    return {
      activeElections,
      votingOpen,
      totalApplications: applications.length,
      underReview,
      approved,
    };
  }, [elections, applications]);

  /* ========================================================
     ELECTION GROUPS
  ======================================================== */

  const currentElections = useMemo(() => {
    return elections.filter((election) =>
      [
        "open",
        "voting",
        "results",
      ].includes(election.status)
    );
  }, [elections]);

  const otherElections = useMemo(() => {
    return elections.filter((election) =>
      [
        "closed",
        "draft",
        "cancelled",
      ].includes(election.status)
    );
  }, [elections]);

  /* ========================================================
     NAVIGATION
  ======================================================== */

  const handleElectionAction = (election) => {
    navigate(
      `/dashboard/elections/${election._id}`
    );
  };

  const handleApplicationAction = (
    election,
    application
  ) => {
    const positionId =
      getApplicationPositionId(application);

    if (
      election?.status === "open" &&
      positionId
    ) {
      navigate(
        `/dashboard/elections/${election._id}/positions/${positionId}/apply`
      );

      return;
    }

    navigate(
      `/dashboard/elections/${election._id}`
    );
  };

  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (loading) {
    return (
      <div className="elections-page">
        <div className="elections-container">
          <div className="elections-loading">
            <div className="elections-spinner"></div>

            <p>
              Loading your election dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================
     ERROR STATE
  ======================================================== */

  if (error) {
    return (
      <div className="elections-page">
        <div className="elections-container">
          <div className="elections-error">
            <div className="elections-error-icon">
              !
            </div>

            <h3>
              Unable to Load Election Dashboard
            </h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="elections-primary-btn"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="elections-page">

      {/* ====================================================
          HERO
      ==================================================== */}

      <section className="elections-hero">

        <div className="elections-container">

          <div className="elections-hero-content">

            <span className="elections-eyebrow">
              JVP CONNECT • DEMOCRATIC PARTICIPATION
            </span>

            <h1>
              JVP Elections
            </h1>

            <p>
              Your digital space to participate in
              JVP leadership, apply for positions,
              vote, and follow election outcomes.
            </p>

          </div>

        </div>

      </section>

      {/* ====================================================
          DASHBOARD CONTENT
      ==================================================== */}

      <main className="elections-container">

        {/* ==================================================
            WELCOME / SECTION HEADER
        ================================================== */}

        <section className="elections-section-header">

          <div>

            <span className="elections-section-label">
              Election Dashboard
            </span>

            <h2>
              Your Democratic Participation
            </h2>

            <p>
              Follow current elections, manage your
              applications, participate in voting,
              and review your election activity.
            </p>

          </div>

        </section>

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section className="elections-stats-grid">

          <div className="elections-stat-card">

            <div className="elections-stat-icon">
              🏛️
            </div>

            <div className="elections-stat-content">
              <span>Active Elections</span>

              <strong>
                {statistics.activeElections}
              </strong>

              <small>
                Open or currently voting
              </small>
            </div>

          </div>

          <div className="elections-stat-card">

            <div className="elections-stat-icon">
              🗳️
            </div>

            <div className="elections-stat-content">
              <span>Voting Open</span>

              <strong>
                {statistics.votingOpen}
              </strong>

              <small>
                Elections accepting votes
              </small>
            </div>

          </div>

          <div className="elections-stat-card">

            <div className="elections-stat-icon">
              📋
            </div>

            <div className="elections-stat-content">
              <span>My Applications</span>

              <strong>
                {statistics.totalApplications}
              </strong>

              <small>
                Submitted applications
              </small>
            </div>

          </div>

          <div className="elections-stat-card">

            <div className="elections-stat-icon">
              ⏳
            </div>

            <div className="elections-stat-content">
              <span>Under Review</span>

              <strong>
                {statistics.underReview}
              </strong>

              <small>
                Awaiting final decision
              </small>
            </div>

          </div>

          <div className="elections-stat-card">

            <div className="elections-stat-icon">
              ✓
            </div>

            <div className="elections-stat-content">
              <span>Approved</span>

              <strong>
                {statistics.approved}
              </strong>

              <small>
                Approved applications
              </small>
            </div>

          </div>

        </section>

        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="elections-actions-section">

          <div className="elections-section-mini-heading">

            <div>
              <span>
                QUICK ACTIONS
              </span>

              <h2>
                Manage Your Election Activity
              </h2>
            </div>

          </div>

          <div className="elections-actions-grid">

            <button
              type="button"
              className="elections-action-card"
              onClick={() =>
                navigate(
                  "/dashboard/elections/my-applications"
                )
              }
            >

              <div className="elections-action-icon">
                📋
              </div>

              <div>
                <strong>
                  My Applications
                </strong>

                <span>
                  Track applications and their
                  current status.
                </span>
              </div>

              <b>→</b>

            </button>

            <button
              type="button"
              className="elections-action-card"
              onClick={() =>
                navigate(
                  "/dashboard/elections/my-votes"
                )
              }
            >

              <div className="elections-action-icon">
                🗳️
              </div>

              <div>
                <strong>
                  My Votes
                </strong>

                <span>
                  Review your voting participation
                  and election history.
                </span>
              </div>

              <b>→</b>

            </button>

          </div>

        </section>

        {/* ==================================================
            CURRENT ELECTIONS
        ================================================== */}

        <section className="elections-list-section">

          <div className="elections-section-heading">

            <div>

              <span>
                CURRENT ELECTIONS
              </span>

              <h2>
                Participate in JVP Leadership
              </h2>

              <p>
                Elections currently open for
                applications, voting, or with
                published results.
              </p>

            </div>

            <span className="elections-count-badge">
              {currentElections.length}{" "}
              {currentElections.length === 1
                ? "Election"
                : "Elections"}
            </span>

          </div>

          {currentElections.length === 0 ? (

            <div className="elections-empty">

              <div className="elections-empty-icon">
                🗳️
              </div>

              <h3>
                No Current Elections
              </h3>

              <p>
                There are currently no open or active
                elections available on JVP Connect.
              </p>

            </div>

          ) : (

            <div className="elections-grid">

              {currentElections.map((election) => {

                const electionApplications =
                  getElectionApplication(
                    applications,
                    election._id
                  );

                const hasApplication =
                  electionApplications.length > 0;

                const approvedApplication =
                  electionApplications.find(
                    (application) =>
                      application.status ===
                      "approved"
                  );

                return (
                  <article
                    key={election._id}
                    className={`election-card election-card-${election.status}`}
                  >

                    {/* CARD HEADER */}

                    <div className="election-card-header">

                      <span
                        className={`election-status election-status-${election.status}`}
                      >
                        {getStatusLabel(
                          election.status
                        )}
                      </span>

                      <span className="election-scope">
                        {getScopeLabel(election)}
                      </span>

                    </div>

                    {/* APPLICATION INDICATOR */}

                    {hasApplication && (
                      <div className="election-application-banner">

                        <span>
                          ✓
                        </span>

                        <div>
                          <strong>
                            You have an application
                          </strong>

                          <small>
                            {getApplicationStatusLabel(
                              electionApplications[0]
                                ?.status
                            )}
                          </small>
                        </div>

                      </div>
                    )}

                    {/* CARD CONTENT */}

                    <div className="election-card-content">

                      <h3>
                        {election.name}
                      </h3>

                      {election.description && (
                        <p className="election-description">
                          {election.description}
                        </p>
                      )}

                      <div className="election-meta">

                        <div className="election-meta-item">

                          <span className="election-meta-icon">
                            📋
                          </span>

                          <div>
                            <small>
                              Applications
                            </small>

                            <strong>
                              {formatDate(
                                election.applicationStart
                              )}{" "}
                              —{" "}
                              {formatDate(
                                election.applicationEnd
                              )}
                            </strong>
                          </div>

                        </div>

                        <div className="election-meta-item">

                          <span className="election-meta-icon">
                            🗳️
                          </span>

                          <div>
                            <small>
                              Voting
                            </small>

                            <strong>
                              {formatDate(
                                election.votingStart
                              )}{" "}
                              —{" "}
                              {formatDate(
                                election.votingEnd
                              )}
                            </strong>
                          </div>

                        </div>

                        <div className="election-meta-item">

                          <span className="election-meta-icon">
                            🏛️
                          </span>

                          <div>
                            <small>
                              Positions
                            </small>

                            <strong>
                              {election.positions?.length ||
                                0}{" "}
                              position
                              {election.positions?.length ===
                              1
                                ? ""
                                : "s"}
                            </strong>
                          </div>

                        </div>

                      </div>

                    </div>

                    {/* CARD FOOTER */}

                    <div className="election-card-footer">

                      <button
                        type="button"
                        className="elections-primary-btn election-view-btn"
                        onClick={() =>
                          handleElectionAction(
                            election
                          )
                        }
                      >

                        {getPrimaryAction(
                          election
                        )}

                        <span>
                          →
                        </span>

                      </button>

                      {/* Application status */}

                      {election.status === "open" &&
                        hasApplication && (
                          <button
                            type="button"
                            className="election-secondary-link"
                            onClick={() =>
                              handleApplicationAction(
                                election,
                                electionApplications[0]
                              )
                            }
                          >
                            View application status
                          </button>
                        )}

                      {/* Approved application */}

                      {election.status === "voting" &&
                        approvedApplication && (
                          <div className="election-approved-note">
                            <span>✓</span>
                            Your application was approved.
                            You may now participate in
                            voting.
                          </div>
                        )}

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* ==================================================
            OTHER ELECTIONS
        ================================================== */}

        {otherElections.length > 0 && (
          <section className="elections-list-section elections-other-section">

            <div className="elections-section-heading">

              <div>

                <span>
                  ELECTION ARCHIVE
                </span>

                <h2>
                  Other Elections
                </h2>

                <p>
                  View closed, upcoming, draft, or
                  cancelled election records.
                </p>

              </div>

              <span className="elections-count-badge">
                {otherElections.length}
              </span>

            </div>

            <div className="elections-grid">

              {otherElections.map((election) => (

                <article
                  key={election._id}
                  className="election-card election-card-secondary"
                >

                  <div className="election-card-header">

                    <span
                      className={`election-status election-status-${election.status}`}
                    >
                      {getStatusLabel(
                        election.status
                      )}
                    </span>

                    <span className="election-scope">
                      {getScopeLabel(election)}
                    </span>

                  </div>

                  <div className="election-card-content">

                    <h3>
                      {election.name}
                    </h3>

                    {election.description && (
                      <p className="election-description">
                        {election.description}
                      </p>
                    )}

                    <div className="election-meta">

                      <div className="election-meta-item">

                        <span className="election-meta-icon">
                          🗓️
                        </span>

                        <div>
                          <small>
                            Election Period
                          </small>

                          <strong>
                            {formatDate(
                              election.votingStart
                            )}{" "}
                            —{" "}
                            {formatDate(
                              election.votingEnd
                            )}
                          </strong>
                        </div>

                      </div>

                      <div className="election-meta-item">

                        <span className="election-meta-icon">
                          🏛️
                        </span>

                        <div>
                          <small>
                            Positions
                          </small>

                          <strong>
                            {election.positions?.length ||
                              0}{" "}
                            position
                            {election.positions?.length ===
                            1
                              ? ""
                              : "s"}
                          </strong>
                        </div>

                      </div>

                    </div>

                  </div>

                  <div className="election-card-footer">

                    <button
                      type="button"
                      className="elections-outline-btn election-view-btn"
                      onClick={() =>
                        handleElectionAction(
                          election
                        )
                      }
                    >
                      View Election
                      <span>→</span>
                    </button>

                  </div>

                </article>

              ))}

            </div>

          </section>
        )}

      </main>

    </div>
  );
};

export default Elections;