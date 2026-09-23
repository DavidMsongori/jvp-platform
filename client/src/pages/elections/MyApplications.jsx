import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMyApplications,
  withdrawApplication,
} from "../../services/election.service";

import "./MyApplications.css";

const formatDate = (date) => {
  if (!date) return "Not specified";

  return new Date(date).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusLabel = (status) => {
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

const getStatusClass = (status) => {
  switch (status) {
    case "submitted":
      return "my-application-status-submitted";

    case "review":
      return "my-application-status-review";

    case "vetted":
      return "my-application-status-vetted";

    case "approved":
      return "my-application-status-approved";

    case "rejected":
      return "my-application-status-rejected";

    case "withdrawn":
      return "my-application-status-withdrawn";

    default:
      return "";
  }
};

const getElectionStatusLabel = (status) => {
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

const getElectionStatusClass = (status) => {
  switch (status) {
    case "open":
      return "my-election-status-open";

    case "voting":
      return "my-election-status-voting";

    case "closed":
      return "my-election-status-closed";

    case "results":
      return "my-election-status-results";

    case "cancelled":
      return "my-election-status-cancelled";

    default:
      return "";
  }
};

const MyApplications = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getMyApplications();

        setApplications(response?.data || []);
      } catch (err) {
        console.error("Failed to load applications:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load your election applications. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const handleWithdraw = async (application) => {
    const confirmed = window.confirm(
      `Are you sure you want to withdraw your application for ${
        application.position?.name || "this position"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setWithdrawingId(application._id);
      setError("");
      setSuccess("");

      const response = await withdrawApplication(application._id);

      setApplications((previous) =>
        previous.map((item) =>
          String(item._id) === String(application._id)
            ? {
                ...item,
                status: "withdrawn",
              }
            : item
        )
      );

      setSuccess(
        response?.message ||
          "Your application has been withdrawn successfully."
      );
    } catch (err) {
      console.error("Failed to withdraw application:", err);

      setError(
        err.response?.data?.message ||
          "Unable to withdraw your application. Please try again."
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  const getPositionName = (application) => {
    return (
      application.position?.name ||
      application.positionName ||
      "Election Position"
    );
  };

  const getElectionName = (application) => {
    return (
      application.election?.name ||
      application.electionName ||
      "JVP Election"
    );
  };

  const getElectionId = (application) => {
    if (application.election?._id) {
      return application.election._id;
    }

    if (application.election) {
      return application.election;
    }

    return application.electionId;
  };

  const canWithdraw = (application) => {
    return ["submitted", "review", "vetted"].includes(
      application.status
    );
  };

  if (loading) {
    return (
      <div className="my-applications-page">
        <div className="my-applications-container">
          <div className="my-applications-loading">
            <div className="my-applications-spinner"></div>

            <p>Loading your applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-applications-page">
      <div className="my-applications-container">
        {/* Header */}
        <section className="my-applications-header">
          <div className="my-applications-header-content">
            <span className="my-applications-eyebrow">
              JVP ELECTIONS
            </span>

            <h1>My Applications</h1>

            <p>
              Track your election applications, vetting status, and
              participation in JVP leadership elections.
            </p>
          </div>

          <div className="my-applications-header-stat">
            <strong>{applications.length}</strong>

            <span>
              {applications.length === 1
                ? "Application"
                : "Applications"}
            </span>
          </div>
        </section>

        {/* Alerts */}
        {error && (
          <div className="my-applications-alert my-applications-alert-error">
            <span>!</span>

            <p>{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="my-applications-alert my-applications-alert-success">
            <span>✓</span>

            <p>{success}</p>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {/* Empty State */}
        {applications.length === 0 ? (
          <section className="my-applications-empty">
            <div className="my-applications-empty-icon">
              🗳️
            </div>

            <span className="my-applications-empty-label">
              No Applications Yet
            </span>

            <h2>You have not applied for any election position.</h2>

            <p>
              When JVP elections are open for applications, you can
              submit your application for an available leadership
              position.
            </p>

            <button
              type="button"
              className="my-applications-primary-btn"
              onClick={() =>
                navigate("/dashboard/elections")
              }
            >
              Explore Elections →
            </button>
          </section>
        ) : (
          <>
            {/* Summary */}
            <section className="my-applications-summary">
              <div className="my-application-summary-card">
                <span className="my-summary-icon">📋</span>

                <div>
                  <small>Total Applications</small>

                  <strong>{applications.length}</strong>
                </div>
              </div>

              <div className="my-application-summary-card">
                <span className="my-summary-icon">⏳</span>

                <div>
                  <small>Under Review</small>

                  <strong>
                    {
                      applications.filter((application) =>
                        ["submitted", "review", "vetted"].includes(
                          application.status
                        )
                      ).length
                    }
                  </strong>
                </div>
              </div>

              <div className="my-application-summary-card">
                <span className="my-summary-icon">✓</span>

                <div>
                  <small>Approved</small>

                  <strong>
                    {
                      applications.filter(
                        (application) =>
                          application.status === "approved"
                      ).length
                    }
                  </strong>
                </div>
              </div>

              <div className="my-application-summary-card">
                <span className="my-summary-icon">!</span>

                <div>
                  <small>Rejected</small>

                  <strong>
                    {
                      applications.filter(
                        (application) =>
                          application.status === "rejected"
                      ).length
                    }
                  </strong>
                </div>
              </div>
            </section>

            {/* Applications */}
            <section className="my-applications-list-section">
              <div className="my-applications-section-heading">
                <div>
                  <span>APPLICATION HISTORY</span>

                  <h2>Your Election Applications</h2>

                  <p>
                    Review the positions you have applied for and
                    monitor the progress of each application.
                  </p>
                </div>

                <button
                  type="button"
                  className="my-applications-outline-btn"
                  onClick={() =>
                    navigate("/dashboard/elections")
                  }
                >
                  Browse Elections
                </button>
              </div>

              <div className="my-applications-list">
                {applications.map((application) => {
                  const electionId =
                    getElectionId(application);

                  const positionName =
                    getPositionName(application);

                  const electionName =
                    getElectionName(application);

                  return (
                    <article
                      key={application._id}
                      className="my-application-card"
                    >
                      <div className="my-application-card-top">
                        <div className="my-application-position-icon">
                          🏛️
                        </div>

                        <div className="my-application-main">
                          <div className="my-application-title-row">
                            <div>
                              <span className="my-application-label">
                                POSITION APPLIED FOR
                              </span>

                              <h3>{positionName}</h3>
                            </div>

                            <span
                              className={`my-application-status ${getStatusClass(
                                application.status
                              )}`}
                            >
                              {getStatusLabel(
                                application.status
                              )}
                            </span>
                          </div>

                          <div className="my-application-election">
                            <span>Election</span>

                            <strong>{electionName}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="my-application-details">
                        <div className="my-application-detail">
                          <span>Submitted</span>

                          <strong>
                            {formatDate(
                              application.createdAt ||
                                application.submittedAt
                            )}
                          </strong>
                        </div>

                        <div className="my-application-detail">
                          <span>Last Updated</span>

                          <strong>
                            {formatDate(
                              application.updatedAt
                            )}
                          </strong>
                        </div>

                        {application.election?.status && (
                          <div className="my-application-detail">
                            <span>Election Status</span>

                            <strong
                              className={`my-election-status ${getElectionStatusClass(
                                application.election.status
                              )}`}
                            >
                              {getElectionStatusLabel(
                                application.election.status
                              )}
                            </strong>
                          </div>
                        )}
                      </div>

                      {application.remarks && (
                        <div className="my-application-remarks">
                          <span>Review Remarks</span>

                          <p>{application.remarks}</p>
                        </div>
                      )}

                      <div className="my-application-card-footer">
                        <div className="my-application-status-note">
                          {application.status === "approved" && (
                            <>
                              <span>✓</span>

                              <p>
                                Your application has been approved.
                                You are now an official aspirant.
                              </p>
                            </>
                          )}

                          {application.status === "rejected" && (
                            <>
                              <span>!</span>

                              <p>
                                Your application was not approved.
                                Review any remarks provided above.
                              </p>
                            </>
                          )}

                          {application.status === "withdrawn" && (
                            <>
                              <span>↩</span>

                              <p>
                                You have withdrawn this
                                application.
                              </p>
                            </>
                          )}

                          {[
                            "submitted",
                            "review",
                            "vetted",
                          ].includes(application.status) && (
                            <>
                              <span>⏳</span>

                              <p>
                                Your application is currently
                                progressing through the election
                                vetting process.
                              </p>
                            </>
                          )}
                        </div>

                        <div className="my-application-actions">
                          {electionId && (
                            <button
                              type="button"
                              className="my-application-view-btn"
                              onClick={() =>
                                navigate(
                                  `/dashboard/elections/${electionId}`
                                )
                              }
                            >
                              View Election
                            </button>
                          )}

                          {canWithdraw(application) && (
                            <button
                              type="button"
                              className="my-application-withdraw-btn"
                              disabled={
                                withdrawingId ===
                                application._id
                              }
                              onClick={() =>
                                handleWithdraw(application)
                              }
                            >
                              {withdrawingId ===
                              application._id
                                ? "Withdrawing..."
                                : "Withdraw"}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default MyApplications;