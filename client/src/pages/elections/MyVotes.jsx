import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMyVotes } from "../../services/election.service";

import "./MyVotes.css";

const formatDate = (date) => {
  if (!date) return "Date not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date not available";
  }

  return parsedDate.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getElectionName = (vote) => {
  return (
    vote?.election?.name ||
    vote?.electionName ||
    vote?.electionTitle ||
    "JVP Election"
  );
};

const getPositionName = (vote) => {
  return (
    vote?.position?.name ||
    vote?.positionName ||
    vote?.positionTitle ||
    "Election Position"
  );
};

const getAspirantName = (vote) => {
  if (vote?.aspirant?.name) {
    return vote.aspirant.name;
  }

  if (vote?.candidate?.name) {
    return vote.candidate.name;
  }

  if (vote?.aspirantName) {
    return vote.aspirantName;
  }

  if (vote?.candidateName) {
    return vote.candidateName;
  }

  if (vote?.name) {
    return vote.name;
  }

  return "Candidate";
};

const getVoteDate = (vote) => {
  return (
    vote?.createdAt ||
    vote?.votedAt ||
    vote?.submittedAt ||
    vote?.date ||
    vote?.timestamp ||
    null
  );
};

const getElectionId = (vote) => {
  return (
    vote?.election?._id ||
    vote?.electionId ||
    vote?.election?._id?.toString?.() ||
    null
  );
};

const getPositionLevel = (vote) => {
  return (
    vote?.position?.level ||
    vote?.level ||
    "JVP Leadership"
  );
};

const getPositionLocation = (vote) => {
  const position = vote?.position || {};

  const parts = [
    position.county || vote?.county,
    position.constituency || vote?.constituency,
    position.ward || vote?.ward,
  ].filter(Boolean);

  return parts.join(" • ");
};

const MyVotes = () => {
  const navigate = useNavigate();

  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMyVotes = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getMyVotes();

        let voteData = response?.data;

        /*
         * Support different API response structures.
         */
        if (Array.isArray(voteData)) {
          setVotes(voteData);
          return;
        }

        if (Array.isArray(voteData?.votes)) {
          setVotes(voteData.votes);
          return;
        }

        if (Array.isArray(voteData?.results)) {
          setVotes(voteData.results);
          return;
        }

        if (Array.isArray(voteData?.data)) {
          setVotes(voteData.data);
          return;
        }

        setVotes([]);
      } catch (err) {
        console.error("Failed to load my votes:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load your voting history. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMyVotes();
  }, []);

  const handleViewElection = (vote) => {
    const electionId = getElectionId(vote);

    if (electionId) {
      navigate(`/dashboard/elections/${electionId}`);
    }
  };

  const totalVotes = votes.length;

  const uniqueElections = [
    ...new Set(
      votes
        .map((vote) => getElectionId(vote))
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];

  if (loading) {
    return (
      <div className="my-votes-page">
        <div className="my-votes-container">
          <div className="my-votes-loading">
            <div className="my-votes-spinner"></div>
            <p>Loading your voting history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-votes-page">
      <div className="my-votes-container">

        {/* ==============================
            PAGE HEADER
        ============================== */}

        <section className="my-votes-header">
          <div className="my-votes-header-content">
            <button
              type="button"
              className="my-votes-back-btn"
              onClick={() => navigate("/dashboard/elections")}
            >
              ← Back to Elections
            </button>

            <span className="my-votes-eyebrow">
              JVP ELECTIONS
            </span>

            <h1>My Votes</h1>

            <p>
              View your voting history and the candidates you
              selected in JVP elections.
            </p>
          </div>
        </section>

        {/* ==============================
            ERROR
        ============================== */}

        {error && (
          <div className="my-votes-alert my-votes-alert-error">
            <span className="my-votes-alert-icon">!</span>

            <div>
              <strong>Unable to load voting history</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* ==============================
            SUMMARY
        ============================== */}

        <section className="my-votes-summary">
          <div className="my-votes-summary-card">
            <div className="my-votes-summary-icon">
              🗳️
            </div>

            <div>
              <span>Total Votes</span>
              <strong>{totalVotes}</strong>
            </div>
          </div>

          <div className="my-votes-summary-card">
            <div className="my-votes-summary-icon">
              🏛️
            </div>

            <div>
              <span>Elections Participated</span>
              <strong>{uniqueElections.length}</strong>
            </div>
          </div>

          <div className="my-votes-summary-card">
            <div className="my-votes-summary-icon">
              ✓
            </div>

            <div>
              <span>Voting Status</span>
              <strong>
                {totalVotes > 0 ? "Participated" : "No Votes"}
              </strong>
            </div>
          </div>
        </section>

        {/* ==============================
            CONTENT
        ============================== */}

        <section className="my-votes-content">

          <div className="my-votes-section-heading">
            <div>
              <span>VOTING RECORD</span>

              <h2>Your Voting History</h2>

              <p>
                Every vote you have submitted through the JVP
                digital election platform is listed below.
              </p>
            </div>
          </div>

          {/* ==============================
              EMPTY STATE
          ============================== */}

          {!error && votes.length === 0 && (
            <div className="my-votes-empty">
              <div className="my-votes-empty-icon">
                🗳️
              </div>

              <h3>No Votes Yet</h3>

              <p>
                You have not participated in any JVP election
                yet. When you cast a vote, your voting record
                will appear here.
              </p>

              <button
                type="button"
                className="my-votes-primary-btn"
                onClick={() =>
                  navigate("/dashboard/elections")
                }
              >
                View Elections →
              </button>
            </div>
          )}

          {/* ==============================
              VOTE LIST
          ============================== */}

          {votes.length > 0 && (
            <div className="my-votes-list">
              {votes.map((vote, index) => {
                const electionId = getElectionId(vote);
                const location = getPositionLocation(vote);

                return (
                  <article
                    key={
                      vote?._id ||
                      vote?.id ||
                      `${electionId || "vote"}-${index}`
                    }
                    className="my-vote-card"
                  >

                    {/* Vote Number */}

                    <div className="my-vote-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    {/* Main Content */}

                    <div className="my-vote-main">

                      <div className="my-vote-top">
                        <div>
                          <span className="my-vote-label">
                            ELECTION
                          </span>

                          <h3>
                            {getElectionName(vote)}
                          </h3>
                        </div>

                        <span className="my-vote-confirmed">
                          ✓ Vote Submitted
                        </span>
                      </div>

                      <div className="my-vote-details">

                        <div className="my-vote-detail">
                          <span>Position</span>

                          <strong>
                            {getPositionName(vote)}
                          </strong>
                        </div>

                        <div className="my-vote-detail">
                          <span>Candidate</span>

                          <strong>
                            {getAspirantName(vote)}
                          </strong>
                        </div>

                        <div className="my-vote-detail">
                          <span>Level</span>

                          <strong>
                            {getPositionLevel(vote)}
                          </strong>
                        </div>

                        <div className="my-vote-detail">
                          <span>Voted On</span>

                          <strong>
                            {formatDate(getVoteDate(vote))}
                          </strong>
                        </div>

                      </div>

                      {location && (
                        <div className="my-vote-location">
                          <span>📍</span>
                          <span>{location}</span>
                        </div>
                      )}

                      <div className="my-vote-footer">

                        <div className="my-vote-reference">
                          {vote?._id && (
                            <>
                              <span>Vote Reference</span>

                              <strong>
                                {String(vote._id).slice(-10)}
                              </strong>
                            </>
                          )}
                        </div>

                        {electionId && (
                          <button
                            type="button"
                            className="my-vote-view-btn"
                            onClick={() =>
                              handleViewElection(vote)
                            }
                          >
                            View Election →
                          </button>
                        )}

                      </div>

                    </div>
                  </article>
                );
              })}
            </div>
          )}

        </section>

        {/* ==============================
            INFORMATION
        ============================== */}

        <section className="my-votes-information">
          <div className="my-votes-information-icon">
            🔐
          </div>

          <div>
            <h3>Your Voting Record</h3>

            <p>
              Your voting history is securely associated with
              your JVP membership account. The record confirms
              your participation in an election and the
              candidate selected for each position.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default MyVotes;