import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaCrown,
  FaExclamationTriangle,
  FaFileAlt,
  FaFilter,
  FaPercentage,
  FaPoll,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaTrophy,
  FaUsers,
  FaVoteYea,
} from "react-icons/fa";

import api from "../../../services/api";

import "./ElectionResults.css";


/* ==========================================================
   RESPONSE HELPERS
========================================================== */

const getResponseData = (response) => {
  if (!response) return null;

  return response.data?.data ??
    response.data?.results ??
    response.data ??
    null;
};


const getElectionId = (election) => {
  return (
    election?._id ||
    election?.id ||
    election?.electionId ||
    ""
  );
};


const getElectionName = (election) => {
  return (
    election?.name ||
    election?.title ||
    election?.electionName ||
    "Unnamed Election"
  );
};


const getElectionStatus = (election) => {
  return (
    election?.status ||
    election?.state ||
    ""
  );
};


const getPositionsFromResponse = (data) => {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.positions)) {
    return data.positions;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (Array.isArray(data.electionResults)) {
    return data.electionResults;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  return [];
};


const getPositionId = (position) => {
  return (
    position?._id ||
    position?.id ||
    position?.positionId ||
    ""
  );
};


const getPositionName = (position) => {
  return (
    position?.name ||
    position?.positionName ||
    position?.title ||
    position?.position?.name ||
    "Unnamed Position"
  );
};


const getCandidatesFromPosition = (position) => {
  if (!position) return [];

  if (Array.isArray(position.candidates)) {
    return position.candidates;
  }

  if (Array.isArray(position.aspirants)) {
    return position.aspirants;
  }

  if (Array.isArray(position.results)) {
    return position.results;
  }

  if (Array.isArray(position.votes)) {
    return position.votes;
  }

  if (
    position.results &&
    typeof position.results === "object" &&
    !Array.isArray(position.results)
  ) {
    return Object.values(position.results);
  }

  return [];
};


const getCandidateId = (candidate) => {
  return (
    candidate?._id ||
    candidate?.id ||
    candidate?.aspirantId ||
    candidate?.candidateId ||
    candidate?.aspirant?._id ||
    ""
  );
};


const getCandidateName = (candidate) => {
  const aspirant = candidate?.aspirant;
  const applicant = candidate?.applicant;
  const member = candidate?.member;

  return (
    candidate?.name ||
    candidate?.candidateName ||
    candidate?.aspirantName ||
    candidate?.fullName ||
    candidate?.candidate?.name ||
    aspirant?.name ||
    aspirant?.fullName ||
    applicant?.name ||
    applicant?.fullName ||
    member?.name ||
    member?.fullName ||
    [
      aspirant?.firstName,
      aspirant?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    [
      applicant?.firstName,
      applicant?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Unknown Candidate"
  );
};


const getVoteCount = (candidate) => {
  const value =
    candidate?.votes ??
    candidate?.voteCount ??
    candidate?.totalVotes ??
    candidate?.count ??
    candidate?.votesReceived ??
    0;

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


const getPositionTotalVotes = (
  position,
  candidates
) => {
  const explicitTotal =
    position?.totalVotes ??
    position?.votesCast ??
    position?.totalVoteCount ??
    position?.voteCount;

  if (
    explicitTotal !== undefined &&
    explicitTotal !== null &&
    Number.isFinite(Number(explicitTotal))
  ) {
    return Number(explicitTotal);
  }

  return candidates.reduce(
    (total, candidate) =>
      total + getVoteCount(candidate),
    0
  );
};


const getTotalVotesFromData = (
  data,
  positions
) => {
  const explicitTotal =
    data?.totalVotes ??
    data?.votesCast ??
    data?.totalVoteCount;

  if (
    explicitTotal !== undefined &&
    explicitTotal !== null &&
    Number.isFinite(Number(explicitTotal))
  ) {
    return Number(explicitTotal);
  }

  return positions.reduce(
    (total, position) => {
      const candidates =
        getCandidatesFromPosition(position);

      return (
        total +
        getPositionTotalVotes(
          position,
          candidates
        )
      );
    },
    0
  );
};


const getStatusLabel = (status) => {
  const labels = {
    draft: "Draft",
    open: "Applications Open",
    voting: "Voting Open",
    closed: "Voting Closed",
    results: "Results Published",
    cancelled: "Cancelled",
  };

  return (
    labels[
      String(status || "").toLowerCase()
    ] ||
    status ||
    "Unknown"
  );
};


const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-KE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    "en-KE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};


const getInitials = (name) => {
  if (!name) return "?";

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`
    .toUpperCase();
};


/* ==========================================================
   STATUS COMPONENT
========================================================== */

function ElectionStatus({
  status,
}) {
  const normalized = String(
    status || ""
  ).toLowerCase();

  let className = "results-status";

  if (normalized === "results") {
    className += " is-results";
  } else if (normalized === "closed") {
    className += " is-closed";
  } else if (normalized === "voting") {
    className += " is-voting";
  } else if (normalized === "cancelled") {
    className += " is-cancelled";
  } else {
    className += " is-default";
  }

  return (
    <span className={className}>
      <span className="results-status-dot" />
      {getStatusLabel(status)}
    </span>
  );
}


/* ==========================================================
   CANDIDATE ROW
========================================================== */

function CandidateResult({
  candidate,
  rank,
  totalVotes,
}) {
  const name =
    getCandidateName(candidate);

  const votes =
    getVoteCount(candidate);

  const percentage =
    totalVotes > 0
      ? (votes / totalVotes) * 100
      : 0;

  const isWinner =
    rank === 1 && votes > 0;

  return (
    <div
      className={`candidate-result-row ${
        isWinner
          ? "candidate-result-row--winner"
          : ""
      }`}
    >
      <div className="candidate-rank">
        {isWinner ? (
          <span className="winner-crown">
            <FaCrown />
          </span>
        ) : (
          <span className="rank-number">
            {rank}
          </span>
        )}
      </div>

      <div className="candidate-avatar">
        {getInitials(name)}
      </div>

      <div className="candidate-info">
        <div className="candidate-name">
          {name}
        </div>

        {isWinner && (
          <span className="winner-label">
            Leading Candidate
          </span>
        )}
      </div>

      <div className="candidate-votes">
        <strong>
          {votes.toLocaleString()}
        </strong>

        <span>
          {votes === 1 ? "vote" : "votes"}
        </span>
      </div>

      <div className="candidate-percentage">
        <div className="percentage-value">
          {percentage.toFixed(1)}%
        </div>

        <div className="percentage-bar">
          <div
            className="percentage-fill"
            style={{
              width: `${Math.min(
                percentage,
                100
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}


/* ==========================================================
   POSITION RESULT CARD
========================================================== */

function PositionResultCard({
  position,
  index,
  expanded,
  onToggle,
}) {
  const candidates = useMemo(() => {
    return getCandidatesFromPosition(
      position
    )
      .map((candidate) => ({
        candidate,
        votes: getVoteCount(candidate),
      }))
      .sort(
        (a, b) =>
          b.votes - a.votes
      );
  }, [position]);

  const candidateObjects =
    candidates.map(
      (item) => item.candidate
    );

  const totalVotes =
    getPositionTotalVotes(
      position,
      candidateObjects
    );

  const winner =
    candidates.length > 0
      ? candidates[0]
      : null;

  const positionName =
    getPositionName(position);

  const declaredWinner =
    position?.winner ||
    position?.winnerName ||
    position?.winningCandidate;

  const displayWinner =
    declaredWinner
      ? typeof declaredWinner ===
        "string"
        ? declaredWinner
        : getCandidateName(
            declaredWinner
          )
      : winner
        ? getCandidateName(
            winner.candidate
          )
        : null;

  return (
    <section
      className={`position-result-card ${
        expanded
          ? "is-expanded"
          : ""
      }`}
    >
      <button
        type="button"
        className="position-result-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="position-result-number">
          {String(index + 1).padStart(
            2,
            "0"
          )}
        </div>

        <div className="position-result-title">
          <span className="position-result-label">
            Elected Position
          </span>

          <h3>{positionName}</h3>
        </div>

        <div className="position-result-summary">
          <div>
            <strong>
              {candidates.length}
            </strong>
            <span>
              {candidates.length === 1
                ? "Candidate"
                : "Candidates"}
            </span>
          </div>

          <div>
            <strong>
              {totalVotes.toLocaleString()}
            </strong>
            <span>
              {totalVotes === 1
                ? "Vote"
                : "Votes"}
            </span>
          </div>
        </div>

        <div className="position-result-toggle">
          {expanded ? (
            <FaChevronUp />
          ) : (
            <FaChevronDown />
          )}
        </div>
      </button>

      {displayWinner && (
        <div className="position-winner-strip">
          <div className="position-winner-icon">
            <FaTrophy />
          </div>

          <div>
            <span>
              Leading Candidate
            </span>
            <strong>
              {displayWinner}
            </strong>
          </div>
        </div>
      )}

      {expanded && (
        <div className="position-result-body">
          {candidates.length > 0 ? (
            <div className="candidate-results-list">
              {candidates.map(
                (
                  item,
                  candidateIndex
                ) => (
                  <CandidateResult
                    key={
                      getCandidateId(
                        item.candidate
                      ) ||
                      `${positionName}-${candidateIndex}`
                    }
                    candidate={
                      item.candidate
                    }
                    rank={
                      candidateIndex + 1
                    }
                    totalVotes={
                      totalVotes
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="position-empty">
              <FaUsers />
              <p>
                No candidate vote
                data is available
                for this position.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}


/* ==========================================================
   MAIN COMPONENT
========================================================== */

function ElectionResults() {
  const navigate =
    useNavigate();

  const { electionId: routeElectionId } =
    useParams();

  const [searchParams] =
    useSearchParams();

  const queryElectionId =
    searchParams.get(
      "electionId"
    );

  const selectedElectionId =
    routeElectionId ||
    queryElectionId ||
    "";

  const [
    elections,
    setElections,
  ] = useState([]);

  const [
    selectedElection,
    setSelectedElection,
  ] = useState(null);

  const [
    resultsData,
    setResultsData,
  ] = useState(null);

  const [
    positions,
    setPositions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    electionsLoading,
    setElectionsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    expandedPositions,
    setExpandedPositions,
  ] = useState({});

  const [
    publishing,
    setPublishing,
  ] = useState(false);

  const [
    publishMessage,
    setPublishMessage,
  ] = useState({
    type: "",
    text: "",
  });


  /* ========================================================
     LOAD ELECTIONS
  ======================================================== */

  const loadElections = async () => {
    try {
      setElectionsLoading(true);

      const response =
        await api.get(
          "/elections"
        );

      const data =
        getResponseData(response);

      const electionList =
        Array.isArray(data)
          ? data
          : Array.isArray(
              data?.elections
            )
            ? data.elections
            : [];

      setElections(
        electionList
      );

      const targetId =
        selectedElectionId ||
        getElectionId(
          electionList[0]
        );

      const targetElection =
        electionList.find(
          (election) =>
            String(
              getElectionId(
                election
              )
            ) === String(targetId)
        );

      if (targetElection) {
        setSelectedElection(
          targetElection
        );
      }
    } catch (err) {
      console.error(
        "Unable to load elections:",
        err
      );
    } finally {
      setElectionsLoading(
        false
      );
    }
  };


  /* ========================================================
     LOAD RESULTS
  ======================================================== */

  const loadResults = async (
    electionId
  ) => {
    if (!electionId) {
      setResultsData(null);
      setPositions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setPublishMessage({
        type: "",
        text: "",
      });

      const response =
        await api.get(
          `/elections/${electionId}/results`
        );

      const data =
        getResponseData(response);

      const resultPositions =
        getPositionsFromResponse(
          data
        );

      setResultsData(data);
      setPositions(
        resultPositions
      );

      const initialExpanded = {};

      resultPositions.forEach(
        (position, index) => {
          const id =
            getPositionId(
              position
            ) ||
            `position-${index}`;

          initialExpanded[id] =
            index === 0;
        }
      );

      setExpandedPositions(
        initialExpanded
      );
    } catch (err) {
      console.error(
        "Unable to load election results:",
        err
      );

      setResultsData(null);
      setPositions([]);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load election results. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    loadElections();
  }, []);


  /* ========================================================
     SELECT ELECTION AFTER ELECTIONS LOAD
  ======================================================== */

  useEffect(() => {
    if (!elections.length) {
      return;
    }

    const targetId =
      selectedElectionId ||
      getElectionId(
        elections[0]
      );

    const election =
      elections.find(
        (item) =>
          String(
            getElectionId(item)
          ) === String(targetId)
      ) ||
      elections[0];

    if (election) {
      setSelectedElection(
        election
      );

      const id =
        getElectionId(election);

      if (
        id &&
        String(id) !==
          String(selectedElectionId)
      ) {
        navigate(
          `/admin/elections/${id}/results`,
          {
            replace: true,
          }
        );
      }
    }
  }, [
    elections,
    selectedElectionId,
    navigate,
  ]);


  /* ========================================================
     LOAD SELECTED ELECTION RESULTS
  ======================================================== */

  useEffect(() => {
    const id =
      selectedElection
        ? getElectionId(
            selectedElection
          )
        : selectedElectionId;

    if (id) {
      loadResults(id);
    }
  }, [
    selectedElection,
    selectedElectionId,
  ]);


  /* ========================================================
     FILTERED POSITIONS
  ======================================================== */

  const filteredPositions =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return positions;
      }

      return positions.filter(
        (position) => {
          const positionName =
            getPositionName(
              position
            ).toLowerCase();

          const candidates =
            getCandidatesFromPosition(
              position
            );

          const candidateText =
            candidates
              .map(
                (candidate) =>
                  getCandidateName(
                    candidate
                  )
              )
              .join(" ")
              .toLowerCase();

          return (
            positionName.includes(
              query
            ) ||
            candidateText.includes(
              query
            )
          );
        }
      );
    }, [
      positions,
      search,
    ]);


  /* ========================================================
     SUMMARY DATA
  ======================================================== */

  const summary = useMemo(() => {
    const totalVotes =
      getTotalVotesFromData(
        resultsData,
        positions
      );

    let totalCandidates = 0;

    positions.forEach(
      (position) => {
        totalCandidates +=
          getCandidatesFromPosition(
            position
          ).length;
      }
    );

    const published =
      String(
        getElectionStatus(
          selectedElection
        )
      ).toLowerCase() ===
      "results";

    return {
      positions:
        positions.length,
      candidates:
        totalCandidates,
      votes: totalVotes,
      published,
    };
  }, [
    resultsData,
    positions,
    selectedElection,
  ]);


  /* ========================================================
     TOGGLE POSITION
  ======================================================== */

  const togglePosition = (
    position,
    index
  ) => {
    const id =
      getPositionId(position) ||
      `position-${index}`;

    setExpandedPositions(
      (previous) => ({
        ...previous,
        [id]: !previous[id],
      })
    );
  };


  /* ========================================================
     EXPAND / COLLAPSE ALL
  ======================================================== */

  const expandAll = () => {
    const next = {};

    positions.forEach(
      (position, index) => {
        const id =
          getPositionId(
            position
          ) ||
          `position-${index}`;

        next[id] = true;
      }
    );

    setExpandedPositions(
      next
    );
  };


  const collapseAll = () => {
    const next = {};

    positions.forEach(
      (position, index) => {
        const id =
          getPositionId(
            position
          ) ||
          `position-${index}`;

        next[id] = false;
      }
    );

    setExpandedPositions(
      next
    );
  };


  /* ========================================================
     ELECTION CHANGE
  ======================================================== */

  const handleElectionChange = (
    event
  ) => {
    const id =
      event.target.value;

    if (!id) return;

    navigate(
      `/admin/elections/${id}/results`
    );
  };


  /* ========================================================
     PUBLISH RESULTS
  ======================================================== */

  const handlePublishResults =
    async () => {
      const electionId =
        getElectionId(
          selectedElection
        );

      if (!electionId) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to publish the results for this election? This will make the results officially published."
        );

      if (!confirmed) {
        return;
      }

      try {
        setPublishing(true);
        setPublishMessage({
          type: "",
          text: "",
        });

        const response =
          await api.post(
            `/elections/${electionId}/publish-results`
          );

        const data =
          getResponseData(
            response
          );

        setPublishMessage({
          type: "success",
          text:
            data?.message ||
            "Election results have been published successfully.",
        });

        await loadResults(
          electionId
        );

        await loadElections();
      } catch (err) {
        console.error(
          "Unable to publish results:",
          err
        );

        setPublishMessage({
          type: "error",
          text:
            err?.response?.data
              ?.message ||
            err?.response?.data
              ?.error ||
            "Unable to publish election results. Please try again.",
        });
      } finally {
        setPublishing(false);
      }
    };


  /* ========================================================
     BACK
  ======================================================== */

  const handleBack = () => {
    if (selectedElection) {
      navigate(
        `/admin/elections/${getElectionId(
          selectedElection
        )}`
      );
      return;
    }

    navigate(
      "/admin/elections"
    );
  };


  /* ========================================================
     LOADING
  ======================================================== */

  if (
    loading &&
    !resultsData
  ) {
    return (
      <div className="election-results-page">
        <div className="results-loading">
          <div className="results-spinner" />

          <h3>
            Loading election results
          </h3>

          <p>
            Please wait while the
            election results are
            retrieved.
          </p>
        </div>
      </div>
    );
  }


  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="election-results-page">

      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

      <div className="results-page-header">

        <div className="results-header-left">

          <button
            type="button"
            className="results-back-button"
            onClick={handleBack}
          >
            <FaArrowLeft />
            <span>
              Back to Election
            </span>
          </button>

          <div className="results-title-row">
            <div className="results-title-icon">
              <FaPoll />
            </div>

            <div>
              <div className="results-eyebrow">
                ELECTION MANAGEMENT
              </div>

              <h1>
                Election Results
              </h1>

              <p>
                Review, analyse and
                publish official
                election results.
              </p>
            </div>
          </div>

        </div>

        <div className="results-header-actions">

          <button
            type="button"
            className="results-refresh-button"
            onClick={() => {
              const id =
                getElectionId(
                  selectedElection
                );

              if (id) {
                loadResults(id);
              }
            }}
            disabled={loading}
          >
           <FaSyncAlt
  className={
    loading
      ? "is-spinning"
      : ""
  }
/>
            <span>
              Refresh
            </span>
          </button>

          {selectedElection && (
            <button
              type="button"
              className="results-manage-button"
              onClick={() =>
                navigate(
                  `/admin/elections/${getElectionId(
                    selectedElection
                  )}`
                )
              }
            >
              <FaFileAlt />
              <span>
                Manage Election
              </span>
            </button>
          )}

        </div>
      </div>


      {/* ====================================================
          ELECTION SELECTOR
      ==================================================== */}

      <section className="results-election-selector">

        <div className="selector-icon">
          <FaVoteYea />
        </div>

        <div className="selector-content">
          <label htmlFor="results-election">
            Select Election
          </label>

          <select
            id="results-election"
            value={
              selectedElection
                ? getElectionId(
                    selectedElection
                  )
                : ""
            }
            onChange={
              handleElectionChange
            }
            disabled={
              electionsLoading
            }
          >
            <option value="">
              {electionsLoading
                ? "Loading elections..."
                : "Select an election"}
            </option>

            {elections.map(
              (election) => (
                <option
                  key={getElectionId(
                    election
                  )}
                  value={getElectionId(
                    election
                  )}
                >
                  {getElectionName(
                    election
                  )}
                </option>
              )
            )}
          </select>
        </div>

        {selectedElection && (
          <div className="selector-election-meta">

            <ElectionStatus
              status={getElectionStatus(
                selectedElection
              )}
            />

            <span>
              {selectedElection.scope
                ? selectedElection.scope
                    .charAt(0)
                    .toUpperCase() +
                  selectedElection.scope.slice(
                    1
                  )
                : "Election"}
            </span>

          </div>
        )}

      </section>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="results-alert results-alert--error">
          <FaExclamationTriangle />

          <div>
            <strong>
              Unable to load results
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              const id =
                getElectionId(
                  selectedElection
                );

              if (id) {
                loadResults(id);
              }
            }}
          >
            Try Again
          </button>
        </div>
      )}


      {/* ====================================================
          PUBLISH MESSAGE
      ==================================================== */}

      {publishMessage.text && (
        <div
          className={`results-alert ${
            publishMessage.type ===
            "success"
              ? "results-alert--success"
              : "results-alert--error"
          }`}
        >
          {publishMessage.type ===
          "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationTriangle />
          )}

          <div>
            <strong>
              {publishMessage.type ===
              "success"
                ? "Results Published"
                : "Publishing Failed"}
            </strong>

            <p>
              {publishMessage.text}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setPublishMessage({
                type: "",
                text: "",
              })
            }
            aria-label="Dismiss message"
          >
            <FaTimes />
          </button>
        </div>
      )}


      {selectedElection && (
        <>
          {/* ================================================
              ELECTION INFORMATION
          ================================================= */}

          <section className="results-election-card">

            <div className="results-election-main">

              <div className="results-election-icon">
                <FaVoteYea />
              </div>

              <div>
                <span className="results-card-label">
                  CURRENT ELECTION
                </span>

                <h2>
                  {getElectionName(
                    selectedElection
                  )}
                </h2>

                {selectedElection.description && (
                  <p>
                    {
                      selectedElection.description
                    }
                  </p>
                )}
              </div>

            </div>

            <div className="results-election-details">

              {selectedElection.applicationStart && (
                <div>
                  <span>
                    Applications
                  </span>

                  <strong>
                    {formatDate(
                      selectedElection.applicationStart
                    )}{" "}
                    —{" "}
                    {formatDate(
                      selectedElection.applicationEnd
                    )}
                  </strong>
                </div>
              )}

              {selectedElection.votingStart && (
                <div>
                  <span>
                    Voting Period
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedElection.votingStart
                    )}{" "}
                    —{" "}
                    {formatDateTime(
                      selectedElection.votingEnd
                    )}
                  </strong>
                </div>
              )}

              <div>
                <span>
                  Status
                </span>

                <ElectionStatus
                  status={getElectionStatus(
                    selectedElection
                  )}
                />
              </div>

            </div>

          </section>


          {/* ================================================
              SUMMARY CARDS
          ================================================= */}

          <section className="results-summary-grid">

            <div className="results-summary-card">
              <div className="summary-card-icon">
                <FaPoll />
              </div>

              <div>
                <span>
                  Positions
                </span>

                <strong>
                  {summary.positions}
                </strong>

                <small>
                  Contested positions
                </small>
              </div>
            </div>


            <div className="results-summary-card">
              <div className="summary-card-icon">
                <FaUsers />
              </div>

              <div>
                <span>
                  Candidates
                </span>

                <strong>
                  {summary.candidates}
                </strong>

                <small>
                  Appearing in results
                </small>
              </div>
            </div>


            <div className="results-summary-card">
              <div className="summary-card-icon">
                <FaVoteYea />
              </div>

              <div>
                <span>
                  Votes Recorded
                </span>

                <strong>
                  {summary.votes.toLocaleString()}
                </strong>

                <small>
                  Across all positions
                </small>
              </div>
            </div>


            <div className="results-summary-card">
              <div className="summary-card-icon">
                {summary.published ? (
                  <FaCheckCircle />
                ) : (
                  <FaClock />
                )}
              </div>

              <div>
                <span>
                  Publication
                </span>

                <strong>
                  {summary.published
                    ? "Published"
                    : "Unpublished"}
                </strong>

                <small>
                  {summary.published
                    ? "Official results"
                    : "Awaiting publication"}
                </small>
              </div>
            </div>

          </section>


          {/* ================================================
              RESULTS CONTENT
          ================================================= */}

          <section className="results-content-card">

            <div className="results-content-header">

              <div>
                <span className="results-card-label">
                  RESULTS BREAKDOWN
                </span>

                <h2>
                  Position Results
                </h2>

                <p>
                  Review the vote distribution
                  for each contested position.
                </p>
              </div>

              <div className="results-content-actions">

                <button
                  type="button"
                  onClick={
                    expandAll
                  }
                  disabled={
                    !positions.length
                  }
                >
                  Expand All
                </button>

                <button
                  type="button"
                  onClick={
                    collapseAll
                  }
                  disabled={
                    !positions.length
                  }
                >
                  Collapse All
                </button>

              </div>

            </div>


            {/* ==============================================
                SEARCH
            =============================================== */}

            <div className="results-toolbar">

              <div className="results-search">
                <FaSearch />

                <input
                  type="search"
                  placeholder="Search position or candidate..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    aria-label="Clear search"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              <div className="results-filter-count">
                <FaFilter />

                <span>
                  {filteredPositions.length}{" "}
                  {filteredPositions.length ===
                  1
                    ? "position"
                    : "positions"}
                </span>
              </div>

            </div>


            {/* ==============================================
                POSITION LIST
            =============================================== */}

            {loading ? (
              <div className="results-inline-loading">
                <div className="results-spinner small" />

                <span>
                  Refreshing results...
                </span>
              </div>
            ) : filteredPositions.length >
              0 ? (
              <div className="position-results-list">
                {filteredPositions.map(
                  (
                    position,
                    index
                  ) => {
                    const originalIndex =
                      positions.indexOf(
                        position
                      );

                    const id =
                      getPositionId(
                        position
                      ) ||
                      `position-${originalIndex}`;

                    return (
                      <PositionResultCard
                        key={
                          id ||
                          `result-${index}`
                        }
                        position={
                          position
                        }
                        index={
                          originalIndex
                        }
                        expanded={
                          Boolean(
                            expandedPositions[
                              id
                            ]
                          )
                        }
                        onToggle={() =>
                          togglePosition(
                            position,
                            originalIndex
                          )
                        }
                      />
                    );
                  }
                )}
              </div>
            ) : (
              <div className="results-empty">
                <div className="results-empty-icon">
                  {search ? (
                    <FaSearch />
                  ) : (
                    <FaPoll />
                  )}
                </div>

                <h3>
                  {search
                    ? "No matching results"
                    : "No results available"}
                </h3>

                <p>
                  {search
                    ? "No positions or candidates match your search."
                    : "There are currently no election results to display for this election."}
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}

          </section>


          {/* ================================================
              PUBLISH PANEL
          ================================================= */}

          <section className="results-publish-card">

            <div className="publish-card-icon">
              {summary.published ? (
                <FaCheckCircle />
              ) : (
                <FaClock />
              )}
            </div>

            <div className="publish-card-content">

              <span className="results-card-label">
                RESULTS PUBLICATION
              </span>

              <h2>
                {summary.published
                  ? "Results are officially published"
                  : "Results are ready for publication"}
              </h2>

              <p>
                {summary.published
                  ? "These results have been marked as published and can be made available to members through the appropriate election results interface."
                  : "Publishing results marks this election's results as officially published. Review the vote totals carefully before proceeding."}
              </p>

            </div>

            <div className="publish-card-action">

              {!summary.published ? (
                <button
                  type="button"
                  className="publish-button"
                  onClick={
                    handlePublishResults
                  }
                  disabled={
                    publishing ||
                    !positions.length
                  }
                >
                  {publishing ? (
                    <>
                      <span className="button-spinner" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Publish Results
                    </>
                  )}
                </button>
              ) : (
                <div className="published-badge">
                  <FaCheckCircle />
                  Published
                </div>
              )}

            </div>

          </section>


          {/* ================================================
              FOOTER NOTE
          ================================================= */}

          <div className="results-page-note">
            <FaPercentage />

            <span>
              Vote percentages are calculated
              from the total votes recorded
              for each individual position.
            </span>
          </div>

        </>
      )}

    </div>
  );
}

export default ElectionResults;