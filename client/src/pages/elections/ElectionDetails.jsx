import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getElection,
  getAspirants,
  getMyVotes,
  getResults,
} from "../../services/election.service";

import "./ElectionDetails.css";

const formatDate = (date) => {
  if (!date) {
    return "Not specified";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not specified";
  }

  return parsedDate.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

const getScopeLabel = (election) => {
  if (!election) {
    return "JVP Election";
  }

  switch (election.scope) {
    case "regional":
      return "Regional Election";

    case "county":
      return election.county
        ? `County Election — ${election.county}`
        : "County Election";

    case "constituency":
      return election.constituency
        ? `Constituency Election — ${election.constituency}`
        : "Constituency Election";

    case "ward":
      return election.ward
        ? `Ward Election — ${election.ward}`
        : "Ward Election";

    default:
      return "JVP Election";
  }
};

const normalizeArray = (value, possibleKeys = []) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    for (const key of possibleKeys) {
      if (Array.isArray(value[key])) {
        return value[key];
      }
    }
  }

  return [];
};

const ElectionDetails = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);

  const [aspirants, setAspirants] = useState([]);
  const [myVotes, setMyVotes] = useState([]);
  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingAspirants, setLoadingAspirants] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  const [error, setError] = useState("");

  /*
   * ---------------------------------------------------------
   * LOAD ELECTION
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const loadElection = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getElection(electionId);

        const electionData = response?.data || null;

        if (!electionData) {
          throw new Error(
            "The requested election could not be found."
          );
        }

        setElection(electionData);
      } catch (err) {
        console.error("Failed to load election:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load this election. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadElection();
  }, [electionId]);

  /*
   * ---------------------------------------------------------
   * LOAD ELECTION-SPECIFIC DATA
   * ---------------------------------------------------------
   *
   * Voting:
   *   - Aspirants
   *   - My votes
   *
   * Results:
   *   - Published results
   *
   * The response normalization prevents the page from crashing
   * if the backend wraps arrays inside another object.
   */

  useEffect(() => {
    if (!election) {
      return;
    }

    const loadElectionData = async () => {
      try {
        setError("");

        if (election.status === "voting") {
          setLoadingAspirants(true);

          const [
            aspirantsResponse,
            votesResponse,
          ] = await Promise.all([
            getAspirants(electionId),
            getMyVotes(electionId),
          ]);

          const aspirantsData =
            aspirantsResponse?.data;

          const votesData =
            votesResponse?.data;

          const normalizedAspirants =
            normalizeArray(aspirantsData, [
              "aspirants",
              "data",
            ]);

          const normalizedVotes =
            normalizeArray(votesData, [
              "votes",
              "data",
            ]);

          setAspirants(normalizedAspirants);
          setMyVotes(normalizedVotes);
        }

        if (election.status === "results") {
          setLoadingResults(true);

          const resultsResponse =
            await getResults(electionId);

          console.log(
            "Election results response:",
            resultsResponse
          );

          const resultsData =
            resultsResponse?.data;

          const normalizedResults =
            normalizeArray(resultsData, [
              "results",
              "data",
            ]);

          setResults(normalizedResults);
        }
      } catch (err) {
        console.error(
          "Failed to load election information:",
          err
        );

        /*
         * Do not allow a malformed/empty API response to
         * crash the entire React component.
         */
        setAspirants([]);
        setMyVotes([]);
        setResults([]);
      } finally {
        setLoadingAspirants(false);
        setLoadingResults(false);
      }
    };

    loadElectionData();
  }, [election, electionId]);

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  const hasVotedForPosition = (positionId) => {
    if (!Array.isArray(myVotes)) {
      return false;
    }

    return myVotes.some(
      (vote) =>
        String(vote.positionId) ===
        String(positionId)
    );
  };

  const getAspirantsForPosition = (positionId) => {
    if (!Array.isArray(aspirants)) {
      return [];
    }

    return aspirants.filter(
      (aspirant) =>
        String(aspirant.positionId) ===
        String(positionId)
    );
  };

  const getResultsForPosition = (positionId) => {
    if (!Array.isArray(results)) {
      return [];
    }

    return results.filter(
      (result) =>
        String(result.positionId) ===
        String(positionId)
    );
  };

  /*
   * ---------------------------------------------------------
   * LOADING STATE
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="election-details-page">
        <div className="election-details-container">
          <div className="election-details-loading">
            <div className="election-details-spinner"></div>

            <p>Loading election...</p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR STATE
   * ---------------------------------------------------------
   */

  if (error || !election) {
    return (
      <div className="election-details-page">
        <div className="election-details-container">
          <div className="election-details-error">
            <div className="election-details-error-icon">
              !
            </div>

            <h2>Unable to Load Election</h2>

            <p>
              {error ||
                "The requested election could not be found."}
            </p>

            <button
              type="button"
              className="election-details-primary-btn"
              onClick={() =>
                navigate("/dashboard/elections")
              }
            >
              ← Back to Elections
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * MAIN PAGE
   * ---------------------------------------------------------
   */

  return (
    <div className="election-details-page">
      <div className="election-details-container">

        {/* Back */}
        <button
          type="button"
          className="election-back-btn"
          onClick={() =>
            navigate("/dashboard/elections")
          }
        >
          ← Back to Elections
        </button>

        {/* Hero */}
        <section className="election-details-hero">
          <div className="election-details-hero-content">

            <div className="election-details-topline">
              <span
                className={`election-details-status election-details-status-${election.status}`}
              >
                {getStatusLabel(election.status)}
              </span>

              <span className="election-details-scope">
                {getScopeLabel(election)}
              </span>
            </div>

            <h1>{election.name}</h1>

            {election.description && (
              <p className="election-details-description">
                {election.description}
              </p>
            )}
          </div>
        </section>

        {/* Election information */}
        <section className="election-details-info-grid">

          <div className="election-info-card">
            <span className="election-info-icon">
              📋
            </span>

            <div>
              <small>Application Period</small>

              <strong>
                {formatDate(
                  election.applicationStart
                )}
              </strong>

              <span>to</span>

              <strong>
                {formatDate(
                  election.applicationEnd
                )}
              </strong>
            </div>
          </div>

          <div className="election-info-card">
            <span className="election-info-icon">
              🗳️
            </span>

            <div>
              <small>Voting Period</small>

              <strong>
                {formatDate(
                  election.votingStart
                )}
              </strong>

              <span>to</span>

              <strong>
                {formatDate(
                  election.votingEnd
                )}
              </strong>
            </div>
          </div>

          <div className="election-info-card">
            <span className="election-info-icon">
              🏛️
            </span>

            <div>
              <small>Available Positions</small>

              <strong>
                {Array.isArray(
                  election.positions
                )
                  ? election.positions.length
                  : 0}
              </strong>

              <span>
                {election.positions?.length === 1
                  ? "Position"
                  : "Positions"}
              </span>
            </div>
          </div>
        </section>

        {/* Positions */}
        <section className="election-positions-section">

          <div className="election-section-heading">
            <div>
              <span className="election-section-label">
                Leadership Opportunities
              </span>

              <h2>Election Positions</h2>

              <p>
                Review the positions available in this
                election and participate according to the
                current election stage.
              </p>
            </div>
          </div>

          <div className="election-positions-list">

            {Array.isArray(election.positions) &&
            election.positions.length > 0 ? (

              election.positions.map(
                (position, index) => {

                  const positionAspirants =
                    getAspirantsForPosition(
                      position._id
                    );

                  const positionResults =
                    getResultsForPosition(
                      position._id
                    );

                  const voted =
                    hasVotedForPosition(
                      position._id
                    );

                  return (
                    <article
                      key={position._id}
                      className="election-position-card"
                    >

                      {/* Position number */}
                      <div className="election-position-number">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div className="election-position-main">

                        {/* Position heading */}
                        <div className="election-position-heading">

                          <div>
                            <span className="election-position-level">
                              {position.level}
                            </span>

                            <h3>
                              {position.name}
                            </h3>
                          </div>

                          {position.maxWinners > 1 && (
                            <span className="election-winners-badge">
                              {position.maxWinners} winners
                            </span>
                          )}
                        </div>

                        {/* Location */}
                        <div className="election-position-location">

                          {position.county && (
                            <span>
                              📍 {position.county}
                            </span>
                          )}

                          {position.constituency && (
                            <span>
                              •{" "}
                              {
                                position.constituency
                              }
                            </span>
                          )}

                          {position.ward && (
                            <span>
                              • {position.ward}
                            </span>
                          )}
                        </div>

                        {/* =================================================
                            APPLICATIONS OPEN
                           ================================================= */}

                        {election.status === "open" && (
                          <div className="election-position-action">

                            <p>
                              Interested in serving in
                              this position?
                            </p>

                            <button
                              type="button"
                              className="election-details-primary-btn"
                              onClick={() =>
                                navigate(
                                  `/dashboard/elections/${electionId}/positions/${position._id}/apply`
                                )
                              }
                            >
                              Apply for Position →
                            </button>

                          </div>
                        )}

                        {/* =================================================
                            VOTING OPEN
                           ================================================= */}

                        {election.status === "voting" && (
                          <div className="election-position-action">

                            {loadingAspirants ? (
                              <p>
                                Loading candidates...
                              </p>
                            ) : (
                              <>
                                <div className="election-position-voting-status">

                                  {voted ? (
                                    <span className="election-voted-badge">
                                      ✓ Vote Submitted
                                    </span>
                                  ) : (
                                    <span>
                                      {
                                        positionAspirants.length
                                      }{" "}
                                      candidate
                                      {positionAspirants.length ===
                                      1
                                        ? ""
                                        : "s"}{" "}
                                      available
                                    </span>
                                  )}

                                </div>

                                <button
                                  type="button"
                                  className="election-details-primary-btn"
                                  onClick={() =>
                                    navigate(
                                      `/dashboard/elections/${electionId}/positions/${position._id}/vote`
                                    )
                                  }
                                >
                                  {voted
                                    ? "View Candidates"
                                    : "Vote Now"}{" "}
                                  →
                                </button>
                              </>
                            )}

                          </div>
                        )}

                        {/* =================================================
                            VOTING CLOSED
                           ================================================= */}

                        {election.status === "closed" && (
                          <div className="election-position-notice">

                            <span>🔒</span>

                            <p>
                              Voting has closed. Results
                              will be available once
                              officially published.
                            </p>

                          </div>
                        )}

                        {/* =================================================
                            RESULTS
                           ================================================= */}

                        {election.status === "results" && (
                          <div className="election-results-preview">

                            {loadingResults ? (
                              <p>
                                Loading results...
                              </p>
                            ) : positionResults.length ===
                              0 ? (
                              <p>
                                No votes were recorded
                                for this position.
                              </p>
                            ) : (
                              <div className="election-results-list">

                                {positionResults.map(
                                  (
                                    result,
                                    resultIndex
                                  ) => (
                                    <div
                                      key={
                                        result.aspirantId ||
                                        result.aspirant?._id ||
                                        result._id ||
                                        resultIndex
                                      }
                                      className="election-result-row"
                                    >

                                      <div className="election-result-rank">
                                        {resultIndex +
                                          1}
                                      </div>

                                      <div className="election-result-name">

                                        <strong>
                                          {result
                                            .aspirant
                                            ?.name ||
                                            result.name ||
                                            "Aspirant"}
                                        </strong>

                                      </div>

                                      <div className="election-result-votes">

                                        <strong>
                                          {Number(
                                            result.votes ??
                                              result.voteCount ??
                                              0
                                          )}
                                        </strong>

                                        <span>
                                          votes
                                        </span>

                                      </div>
                                    </div>
                                  )
                                )}

                              </div>
                            )}

                          </div>
                        )}

                        {/* =================================================
                            DRAFT
                           ================================================= */}

                        {election.status === "draft" && (
                          <div className="election-position-notice">

                            <span>📝</span>

                            <p>
                              This election has not yet
                              been opened for
                              applications.
                            </p>

                          </div>
                        )}

                        {/* =================================================
                            CANCELLED
                           ================================================= */}

                        {election.status ===
                          "cancelled" && (
                          <div className="election-position-notice election-position-notice-danger">

                            <span>⚠️</span>

                            <p>
                              This election has been
                              cancelled.
                            </p>

                          </div>
                        )}

                      </div>
                    </article>
                  );
                }
              )

            ) : (

              <div className="election-no-positions">

                <h3>
                  No Positions Added
                </h3>

                <p>
                  Positions for this election have not
                  yet been published.
                </p>

              </div>

            )}

          </div>
        </section>

      </div>
    </div>
  );
};

export default ElectionDetails;