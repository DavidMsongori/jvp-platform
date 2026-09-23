import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getElection,
  getAspirants,
} from "../../services/election.service";

import "./Aspirants.css";

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

const formatDate = (date) => {
  if (!date) {
    return "Not specified";
  }

  return new Date(date).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name) => {
  if (!name) {
    return "JVP";
  }

  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const Aspirants = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [aspirants, setAspirants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingAspirants, setLoadingAspirants] = useState(false);

  const [error, setError] = useState("");

  const [selectedPosition, setSelectedPosition] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadElection = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getElection(electionId);

        if (!response?.data) {
          throw new Error(
            "Election information could not be found."
          );
        }

        setElection(response.data);
      } catch (err) {
        console.error("Failed to load election:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load this election."
        );
      } finally {
        setLoading(false);
      }
    };

    loadElection();
  }, [electionId]);

  useEffect(() => {
    if (!election) {
      return;
    }

    const loadAspirants = async () => {
      try {
        setLoadingAspirants(true);
        setError("");

        const response = await getAspirants(electionId);

        setAspirants(response?.data || []);
      } catch (err) {
        console.error("Failed to load aspirants:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load aspirants for this election."
        );
      } finally {
        setLoadingAspirants(false);
      }
    };

    loadAspirants();
  }, [election, electionId]);

  const positions = useMemo(() => {
    if (!election?.positions) {
      return [];
    }

    return election.positions;
  }, [election]);

  const filteredAspirants = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return aspirants.filter((aspirant) => {
      const matchesPosition =
        selectedPosition === "all" ||
        String(aspirant.positionId) ===
          String(selectedPosition);

      if (!matchesPosition) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const name = (
        aspirant.name ||
        ""
      ).toLowerCase();

      const manifesto = (
        aspirant.manifesto ||
        ""
      ).toLowerCase();

      const position = positions.find(
        (item) =>
          String(item._id) ===
          String(aspirant.positionId)
      );

      const positionName = (
        position?.name ||
        ""
      ).toLowerCase();

      return (
        name.includes(normalizedSearch) ||
        manifesto.includes(normalizedSearch) ||
        positionName.includes(normalizedSearch)
      );
    });
  }, [
    aspirants,
    positions,
    selectedPosition,
    searchTerm,
  ]);

  const getPosition = (positionId) => {
    return positions.find(
      (position) =>
        String(position._id) === String(positionId)
    );
  };

  const handleVote = (aspirant) => {
    const position = getPosition(aspirant.positionId);

    if (!position) {
      return;
    }

    navigate(
      `/dashboard/elections/${electionId}/positions/${position._id}/vote`
    );
  };

  if (loading) {
    return (
      <div className="aspirants-page">
        <div className="aspirants-container">
          <div className="aspirants-loading">
            <div className="aspirants-spinner"></div>
            <p>Loading election...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="aspirants-page">
        <div className="aspirants-container">
          <div className="aspirants-error">
            <div className="aspirants-error-icon">
              !
            </div>

            <h2>Election Unavailable</h2>

            <p>
              {error ||
                "The requested election could not be found."}
            </p>

            <button
              type="button"
              className="aspirants-primary-btn"
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

  return (
    <div className="aspirants-page">
      <div className="aspirants-container">
        {/* Back */}
        <button
          type="button"
          className="aspirants-back-btn"
          onClick={() =>
            navigate(
              `/dashboard/elections/${electionId}`
            )
          }
        >
          ← Back to Election
        </button>

        {/* Hero */}
        <section className="aspirants-hero">
          <div className="aspirants-hero-content">
            <span className="aspirants-eyebrow">
              JVP ELECTIONS
            </span>

            <h1>Meet the Aspirants</h1>

            <p>
              Review the approved aspirants participating in
              this election and learn more about their
              leadership vision and manifesto.
            </p>

            <div className="aspirants-election-name">
              <strong>{election.name}</strong>

              <span>
                {getScopeLabel(election)}
              </span>
            </div>
          </div>

          <div className="aspirants-hero-stat">
            <strong>{aspirants.length}</strong>

            <span>
              {aspirants.length === 1
                ? "Aspirant"
                : "Aspirants"}
            </span>
          </div>
        </section>

        {/* Election information */}
        <section className="aspirants-info-bar">
          <div className="aspirants-info-item">
            <span>Election Status</span>

            <strong
              className={`aspirants-election-status aspirants-status-${election.status}`}
            >
              {getStatusLabel(election.status)}
            </strong>
          </div>

          <div className="aspirants-info-item">
            <span>Voting Starts</span>

            <strong>
              {formatDate(election.votingStart)}
            </strong>
          </div>

          <div className="aspirants-info-item">
            <span>Voting Ends</span>

            <strong>
              {formatDate(election.votingEnd)}
            </strong>
          </div>

          <div className="aspirants-info-item">
            <span>Positions</span>

            <strong>
              {positions.length}
            </strong>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="aspirants-alert">
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

        {/* Filters */}
        <section className="aspirants-controls">
          <div className="aspirants-controls-heading">
            <div>
              <span>PARTICIPANTS</span>

              <h2>Approved Aspirants</h2>
            </div>

            <span className="aspirants-count">
              {filteredAspirants.length} shown
            </span>
          </div>

          <div className="aspirants-filters">
            <div className="aspirants-search">
              <span>⌕</span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search aspirants..."
              />
            </div>

            <div className="aspirants-position-filter">
              <label htmlFor="aspirant-position">
                Position
              </label>

              <select
                id="aspirant-position"
                value={selectedPosition}
                onChange={(event) =>
                  setSelectedPosition(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All Positions
                </option>

                {positions.map((position) => (
                  <option
                    key={position._id}
                    value={position._id}
                  >
                    {position.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Aspirants */}
        <section className="aspirants-results">
          {loadingAspirants ? (
            <div className="aspirants-inline-loading">
              <div className="aspirants-spinner"></div>

              <p>Loading aspirants...</p>
            </div>
          ) : filteredAspirants.length === 0 ? (
            <div className="aspirants-empty">
              <div className="aspirants-empty-icon">
                🏛️
              </div>

              <h3>No Aspirants Found</h3>

              <p>
                No approved aspirants match your current
                search or position filter.
              </p>

              {(searchTerm ||
                selectedPosition !== "all") && (
                <button
                  type="button"
                  className="aspirants-secondary-btn"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedPosition("all");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="aspirants-grid">
              {filteredAspirants.map((aspirant) => {
                const position = getPosition(
                  aspirant.positionId
                );

                return (
                  <article
                    key={aspirant._id}
                    className="aspirant-card"
                  >
                    <div className="aspirant-card-top">
                      <div className="aspirant-photo-wrapper">
                        {aspirant.photo ? (
                          <img
                            src={aspirant.photo}
                            alt={aspirant.name}
                            className="aspirant-photo"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";

                              event.currentTarget.nextElementSibling.style.display =
                                "flex";
                            }}
                          />
                        ) : null}

                        <div
                          className="aspirant-photo-placeholder"
                          style={{
                            display: aspirant.photo
                              ? "none"
                              : "flex",
                          }}
                        >
                          {getInitials(
                            aspirant.name
                          )}
                        </div>
                      </div>

                      <div className="aspirant-status">
                        <span>
                          ✓ Approved Aspirant
                        </span>
                      </div>
                    </div>

                    <div className="aspirant-card-body">
                      <span className="aspirant-position-label">
                        {position?.level ||
                          "Leadership Position"}
                      </span>

                      <h3>
                        {aspirant.name ||
                          "JVP Aspirant"}
                      </h3>

                      <div className="aspirant-position-name">
                        <span>Contesting for</span>

                        <strong>
                          {position?.name ||
                            "Election Position"}
                        </strong>
                      </div>

                      {position?.county && (
                        <div className="aspirant-location">
                          📍 {position.county}

                          {position.constituency
                            ? ` • ${position.constituency}`
                            : ""}

                          {position.ward
                            ? ` • ${position.ward}`
                            : ""}
                        </div>
                      )}

                      <div className="aspirant-manifesto">
                        <span>MANIFESTO</span>

                        {aspirant.manifesto ? (
                          <p>
                            {aspirant.manifesto}
                          </p>
                        ) : (
                          <p className="aspirant-no-manifesto">
                            No manifesto has been
                            provided.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="aspirant-card-footer">
                      {election.status ===
                        "voting" && (
                        <button
                          type="button"
                          className="aspirant-vote-btn"
                          onClick={() =>
                            handleVote(aspirant)
                          }
                        >
                          Vote for Position →
                        </button>
                      )}

                      {election.status === "open" && (
                        <div className="aspirant-stage-note">
                          Applications are currently
                          open. Voting has not started.
                        </div>
                      )}

                      {election.status === "closed" && (
                        <div className="aspirant-stage-note">
                          Voting has closed for this
                          election.
                        </div>
                      )}

                      {election.status ===
                        "results" && (
                        <div className="aspirant-stage-note">
                          Election results have been
                          published.
                        </div>
                      )}

                      {election.status === "draft" && (
                        <div className="aspirant-stage-note">
                          This election has not yet
                          opened.
                        </div>
                      )}

                      {election.status ===
                        "cancelled" && (
                        <div className="aspirant-stage-note aspirant-stage-note-danger">
                          This election has been
                          cancelled.
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Aspirants;