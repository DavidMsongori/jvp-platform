import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getElection,
  getAspirants,
  getMyVotes,
  castVote,
} from "../../services/election.service";

import "./Voting.css";

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

const getInitials = (name) => {
  if (!name) {
    return "JVP";
  }

  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[
    words.length - 1
  ][0]}`.toUpperCase();
};

const Voting = () => {
  const { electionId, positionId } = useParams();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [position, setPosition] = useState(null);
  const [aspirants, setAspirants] = useState([]);
  const [myVotes, setMyVotes] = useState([]);

  const [selectedAspirant, setSelectedAspirant] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [showConfirmation, setShowConfirmation] =
    useState(false);

  /*
   * ---------------------------------------------------------
   * LOAD ELECTION, POSITION, ASPIRANTS AND MY VOTES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const loadVotingData = async () => {
      try {
        setLoading(true);
        setError("");

        const electionResponse =
          await getElection(electionId);

        const electionData =
          electionResponse?.data || null;

        if (!electionData) {
          throw new Error(
            "The requested election could not be found."
          );
        }

        setElection(electionData);

        const selectedPosition =
          electionData.positions?.find(
            (item) =>
              String(item._id) ===
              String(positionId)
          );

        if (!selectedPosition) {
          throw new Error(
            "The selected election position could not be found."
          );
        }

        setPosition(selectedPosition);

        const [
          aspirantsResponse,
          votesResponse,
        ] = await Promise.all([
          getAspirants(electionId),
          getMyVotes(electionId),
        ]);

        const aspirantsData =
          normalizeArray(
            aspirantsResponse?.data,
            ["aspirants", "data"]
          );

        const votesData =
          normalizeArray(
            votesResponse?.data,
            ["votes", "data"]
          );

        const positionAspirants =
          aspirantsData.filter(
            (aspirant) =>
              String(aspirant.positionId) ===
              String(positionId)
          );

        setAspirants(positionAspirants);
        setMyVotes(votesData);
      } catch (err) {
        console.error(
          "Failed to load voting information:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load the voting page. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadVotingData();
  }, [electionId, positionId]);

  /*
   * ---------------------------------------------------------
   * CHECK WHETHER MEMBER HAS ALREADY VOTED
   * ---------------------------------------------------------
   */

  const existingVote = useMemo(() => {
    if (!Array.isArray(myVotes)) {
      return null;
    }

    return (
      myVotes.find(
        (vote) =>
          String(vote.positionId) ===
          String(positionId)
      ) || null
    );
  }, [myVotes, positionId]);

  const hasAlreadyVoted = Boolean(existingVote);

  /*
   * ---------------------------------------------------------
   * CURRENT ASPIRANT SELECTION
   * ---------------------------------------------------------
   */

  const selectedCandidate = useMemo(() => {
    return (
      aspirants.find(
        (aspirant) =>
          String(aspirant._id) ===
          String(selectedAspirant)
      ) || null
    );
  }, [aspirants, selectedAspirant]);

  /*
   * ---------------------------------------------------------
   * SELECT ASPIRANT
   * ---------------------------------------------------------
   */

  const handleSelectAspirant = (aspirantId) => {
    if (hasAlreadyVoted || submitting) {
      return;
    }

    setSelectedAspirant(aspirantId);
    setError("");
  };

  /*
   * ---------------------------------------------------------
   * OPEN CONFIRMATION
   * ---------------------------------------------------------
   */

  const handleContinueToConfirmation = () => {
    if (!election || !position) {
      setError(
        "Election information is unavailable."
      );
      return;
    }

    if (election.status !== "voting") {
      setError(
        "Voting is not currently open for this election."
      );
      return;
    }

    if (hasAlreadyVoted) {
      setError(
        "You have already voted for this position."
      );
      return;
    }

    if (!selectedAspirant) {
      setError(
        "Please select an aspirant before continuing."
      );
      return;
    }

    setError("");
    setShowConfirmation(true);
  };

  /*
   * ---------------------------------------------------------
   * CAST VOTE
   * ---------------------------------------------------------
   */

  const handleCastVote = async () => {
    if (!selectedCandidate) {
      setError(
        "Please select an aspirant before submitting your vote."
      );
      setShowConfirmation(false);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await castVote(
        electionId,
        positionId,
        selectedCandidate._id
      );

      console.log("Vote response:", response);

      setShowConfirmation(false);
      setSuccess(true);

      /*
       * Keep local state synchronized so the page knows that
       * this position has already received a vote.
       */
      setMyVotes((previousVotes) => [
        ...(Array.isArray(previousVotes)
          ? previousVotes
          : []),
        {
          positionId,
          aspirantId:
            selectedCandidate._id,
          aspirant: selectedCandidate,
        },
      ]);
    } catch (err) {
      console.error(
        "Failed to cast vote:",
        err
      );

      setShowConfirmation(false);

      setError(
        err.response?.data?.message ||
          "Unable to submit your vote. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="voting-page">
        <div className="voting-container">
          <div className="voting-loading">
            <div className="voting-spinner"></div>

            <p>Preparing ballot...</p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR / MISSING DATA
   * ---------------------------------------------------------
   */

  if (error && (!election || !position)) {
    return (
      <div className="voting-page">
        <div className="voting-container">
          <div className="voting-error-page">

            <div className="voting-error-icon">
              !
            </div>

            <h2>Voting Unavailable</h2>

            <p>{error}</p>

            <button
              type="button"
              className="voting-primary-btn"
              onClick={() =>
                navigate(
                  `/dashboard/elections/${electionId}`
                )
              }
            >
              ← Back to Election
            </button>

          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * SUCCESS SCREEN
   * ---------------------------------------------------------
   */

  if (success) {
    return (
      <div className="voting-page">
        <div className="voting-container">

          <div className="voting-success">

            <div className="voting-success-icon">
              ✓
            </div>

            <span className="voting-success-label">
              VOTE RECORDED
            </span>

            <h1>
              Your vote has been successfully submitted.
            </h1>

            <p>
              Your vote for{" "}
              <strong>
                {selectedCandidate?.name ||
                  "your selected aspirant"}
              </strong>{" "}
              for the position of{" "}
              <strong>
                {position?.name}
              </strong>{" "}
              has been recorded.
            </p>

            <div className="voting-success-notice">
              <span>🔐</span>

              <p>
                Your vote has been securely recorded in
                the JVP election system. You cannot vote
                again for this position.
              </p>
            </div>

            <div className="voting-success-actions">

              <button
                type="button"
                className="voting-primary-btn"
                onClick={() =>
                  navigate(
                    `/dashboard/elections/${electionId}`
                  )
                }
              >
                Return to Election
              </button>

              <button
                type="button"
                className="voting-secondary-btn"
                onClick={() =>
                  navigate(
                    `/dashboard/elections/${electionId}/aspirants`
                  )
                }
              >
                View Aspirants
              </button>

            </div>

          </div>

        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * MAIN BALLOT
   * ---------------------------------------------------------
   */

  return (
    <div className="voting-page">
      <div className="voting-container">

        {/* Back button */}

        <button
          type="button"
          className="voting-back-btn"
          onClick={() =>
            navigate(
              `/dashboard/elections/${electionId}`
            )
          }
        >
          ← Back to Election
        </button>

        {/* Header */}

        <section className="voting-header">

          <div className="voting-header-content">

            <span className="voting-eyebrow">
              JVP ELECTRONIC VOTING
            </span>

            <h1>
              Cast Your Vote
            </h1>

            <p>
              Carefully review the aspirants and select
              one candidate for this position.
            </p>

          </div>

          <div className="voting-live-badge">
            <span className="voting-live-dot"></span>
            Voting Open
          </div>

        </section>

        {/* Election context */}

        <section className="voting-context">

          <div className="voting-context-item">
            <span>Election</span>

            <strong>
              {election?.name}
            </strong>
          </div>

          <div className="voting-context-item">
            <span>Position</span>

            <strong>
              {position?.name}
            </strong>
          </div>

          <div className="voting-context-item">
            <span>Voting Ends</span>

            <strong>
              {formatDate(
                election?.votingEnd
              )}
            </strong>
          </div>

        </section>

        {/* Error */}

        {error && (
          <div className="voting-alert">

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

        {/* Already voted */}

        {hasAlreadyVoted && (
          <div className="voting-already-voted">

            <div className="voting-already-icon">
              ✓
            </div>

            <div>
              <strong>
                You have already voted for this position.
              </strong>

              <p>
                Your vote has been recorded. You cannot
                submit another vote for this position.
              </p>
            </div>

          </div>
        )}

        {/* Ballot instructions */}

        <section className="voting-instructions">

          <div className="voting-instructions-icon">
            🗳️
          </div>

          <div>
            <strong>
              How to vote
            </strong>

            <p>
              Select one aspirant below, review your
              selection carefully, then click{" "}
              <strong>
                Continue to Confirmation
              </strong>
              .
            </p>
          </div>

        </section>

        {/* Aspirants */}

        <section className="voting-ballot-section">

          <div className="voting-section-heading">

            <div>
              <span>
                BALLOT
              </span>

              <h2>
                Select an Aspirant
              </h2>

              <p>
                {aspirants.length}{" "}
                {aspirants.length === 1
                  ? "aspirant is"
                  : "aspirants are"}{" "}
                contesting this position.
              </p>
            </div>

            {!hasAlreadyVoted && (
              <span className="voting-selection-count">
                {selectedAspirant
                  ? "1 selected"
                  : "No selection"}
              </span>
            )}

          </div>

          {aspirants.length === 0 ? (

            <div className="voting-empty">

              <div className="voting-empty-icon">
                👤
              </div>

              <h3>
                No Aspirants Available
              </h3>

              <p>
                There are currently no approved aspirants
                available for this position.
              </p>

              <button
                type="button"
                className="voting-secondary-btn"
                onClick={() =>
                  navigate(
                    `/dashboard/elections/${electionId}`
                  )
                }
              >
                Back to Election
              </button>

            </div>

          ) : (

            <div className="voting-candidate-list">

              {aspirants.map((aspirant, index) => {

                const isSelected =
                  String(selectedAspirant) ===
                  String(aspirant._id);

                return (
                  <button
                    type="button"
                    key={aspirant._id}
                    className={`voting-candidate-card ${
                      isSelected
                        ? "voting-candidate-selected"
                        : ""
                    } ${
                      hasAlreadyVoted
                        ? "voting-candidate-disabled"
                        : ""
                    }`}
                    onClick={() =>
                      handleSelectAspirant(
                        aspirant._id
                      )
                    }
                    disabled={hasAlreadyVoted}
                  >

                    <div className="voting-candidate-number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div className="voting-candidate-photo-wrapper">

                      {aspirant.photo ? (
                        <img
                          src={aspirant.photo}
                          alt={
                            aspirant.name ||
                            "Aspirant"
                          }
                          className="voting-candidate-photo"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";

                            if (
                              event.currentTarget
                                .nextElementSibling
                            ) {
                              event.currentTarget.nextElementSibling.style.display =
                                "flex";
                            }
                          }}
                        />
                      ) : null}

                      <div
                        className="voting-candidate-placeholder"
                        style={{
                          display:
                            aspirant.photo
                              ? "none"
                              : "flex",
                        }}
                      >
                        {getInitials(
                          aspirant.name
                        )}
                      </div>

                    </div>

                    <div className="voting-candidate-content">

                      <span className="voting-candidate-label">
                        ASPIRANT
                      </span>

                      <h3>
                        {aspirant.name ||
                          "JVP Aspirant"}
                      </h3>

                      {aspirant.manifesto ? (
                        <p>
                          {aspirant.manifesto}
                        </p>
                      ) : (
                        <p className="voting-no-manifesto">
                          No manifesto provided.
                        </p>
                      )}

                    </div>

                    <div
                      className={`voting-radio ${
                        isSelected
                          ? "voting-radio-selected"
                          : ""
                      }`}
                    >
                      {isSelected && (
                        <span>✓</span>
                      )}
                    </div>

                  </button>
                );
              })}

            </div>
          )}

        </section>

        {/* Bottom action */}

        {aspirants.length > 0 &&
          !hasAlreadyVoted && (
            <section className="voting-action-bar">

              <div className="voting-action-summary">

                <span>
                  Your selection
                </span>

                <strong>
                  {selectedCandidate?.name ||
                    "No aspirant selected"}
                </strong>

              </div>

              <button
                type="button"
                className="voting-submit-btn"
                disabled={
                  !selectedAspirant ||
                  submitting
                }
                onClick={
                  handleContinueToConfirmation
                }
              >
                Continue to Confirmation
                <span>→</span>
              </button>

            </section>
          )}

      </div>

      {/* =====================================================
          CONFIRMATION MODAL
         ===================================================== */}

      {showConfirmation &&
        selectedCandidate && (
          <div
            className="voting-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="voting-confirmation-title"
          >

            <div className="voting-confirmation-modal">

              <button
                type="button"
                className="voting-modal-close"
                onClick={() =>
                  setShowConfirmation(false)
                }
                disabled={submitting}
                aria-label="Close confirmation"
              >
                ×
              </button>

              <div className="voting-confirmation-icon">
                🗳️
              </div>

              <span className="voting-confirmation-label">
                CONFIRM YOUR VOTE
              </span>

              <h2 id="voting-confirmation-title">
                Are you sure?
              </h2>

              <p>
                You are about to cast your vote for:
              </p>

              <div className="voting-confirmation-candidate">

                <div className="voting-confirmation-photo">

                  {selectedCandidate.photo ? (
                    <img
                      src={selectedCandidate.photo}
                      alt={
                        selectedCandidate.name
                      }
                    />
                  ) : (
                    <span>
                      {getInitials(
                        selectedCandidate.name
                      )}
                    </span>
                  )}

                </div>

                <div>
                  <strong>
                    {selectedCandidate.name}
                  </strong>

                  <span>
                    {position?.name}
                  </span>
                </div>

              </div>

              <div className="voting-confirmation-warning">

                <span>⚠️</span>

                <p>
                  Once submitted, your vote cannot be
                  changed or submitted again for this
                  position.
                </p>

              </div>

              <div className="voting-confirmation-actions">

                <button
                  type="button"
                  className="voting-secondary-btn"
                  onClick={() =>
                    setShowConfirmation(false)
                  }
                  disabled={submitting}
                >
                  Go Back
                </button>

                <button
                  type="button"
                  className="voting-confirm-btn"
                  onClick={handleCastVote}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="voting-button-spinner"></span>
                      Recording Vote...
                    </>
                  ) : (
                    <>
                      Confirm & Cast Vote
                      <span>✓</span>
                    </>
                  )}
                </button>

              </div>

            </div>

          </div>
        )}
    </div>
  );
};

export default Voting;