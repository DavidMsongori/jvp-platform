import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  FaPlus,
  FaSyncAlt,
  FaSearch,
  FaFilter,
  FaVoteYea,
  FaClipboardList,
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaPlayCircle,
  FaChartBar,
  FaEye,
  FaEdit,
  FaArrowRight,
  FaCalendarAlt,
  FaBuilding,
  FaMapMarkerAlt,
  FaCog,
} from "react-icons/fa";

import { getAdminElections } from "../../../services/election.service"; 


import "./adminelections.css";


/* ==========================================================
   HELPERS
========================================================== */

const formatDate = (date) => {
  if (!date) {
    return "Not specified";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not specified";
  }

  return parsedDate.toLocaleDateString(
    "en-KE",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};


const formatDateRange = (
  start,
  end
) => {
  const formattedStart =
    formatDate(start);

  const formattedEnd =
    formatDate(end);

  if (
    formattedStart ===
      "Not specified" &&
    formattedEnd ===
      "Not specified"
  ) {
    return "Dates not specified";
  }

  return `${formattedStart} — ${formattedEnd}`;
};


/* ==========================================================
   RESPONSE NORMALIZATION
========================================================== */

const getResponseData = (
  response
) => {
  return (
    response?.data?.data ??
    response?.data ??
    response ??
    {}
  );
};


const getElectionCollection = (
  response
) => {
  const payload =
    getResponseData(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    Array.isArray(
      payload?.elections
    )
  ) {
    return payload.elections;
  }

  if (
    Array.isArray(
      payload?.results
    )
  ) {
    return payload.results;
  }

  if (
    Array.isArray(
      payload?.data
    )
  ) {
    return payload.data;
  }

  if (
    Array.isArray(
      payload?.data?.elections
    )
  ) {
    return payload.data.elections;
  }

  if (
    Array.isArray(
      response?.data?.elections
    )
  ) {
    return response.data.elections;
  }

  if (
    Array.isArray(
      response?.elections
    )
  ) {
    return response.elections;
  }

  return [];
};


/* ==========================================================
   ELECTION HELPERS
========================================================== */

const getElectionId = (
  election
) => {
  if (!election) {
    return null;
  }

  return (
    election._id ||
    election.id ||
    election.electionId ||
    null
  );
};


const getElectionName = (
  election
) => {
  if (!election) {
    return "Untitled Election";
  }

  return (
    election.name ||
    election.title ||
    "Untitled Election"
  );
};


const getElectionStatus = (
  election
) => {
  if (!election) {
    return "unknown";
  }

  return (
    election.status ||
    election.electionStatus ||
    "unknown"
  );
};


const getElectionScope = (
  election
) => {
  if (!election) {
    return "";
  }

  return (
    election.scope ||
    election.electionScope ||
    ""
  );
};


const getScopeLabel = (
  election
) => {
  const scope =
    getElectionScope(election);

  switch (scope) {
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
      return scope || "Election";
  }
};


const getElectionType = (election) => {
  const type = String(
    election?.type ||
    election?.electionType ||
    "elective"
  ).toLowerCase();

  return type === "nomination"
    ? "nomination"
    : "elective";
};


const getTypeLabel = (election) => {
  return getElectionType(election) === "nomination"
    ? "Nomination"
    : "Elective";
};


const getStatusLabel = (
  status
) => {
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


const getStatusClass = (
  status
) => {
  switch (status) {
    case "draft":
      return "draft";

    case "open":
      return "open";

    case "voting":
      return "voting";

    case "closed":
      return "closed";

    case "results":
      return "results";

    case "cancelled":
      return "cancelled";

    default:
      return "unknown";
  }
};


/* ==========================================================
   METRIC HELPERS
========================================================== */

const getNumericValue = (
  values
) => {
  const value =
    values.find(
      (item) =>
        typeof item === "number" &&
        Number.isFinite(item)
    );

  return value ?? 0;
};


const getPositionCount = (
  election
) => {
  if (
    Array.isArray(
      election?.positions
    )
  ) {
    return election.positions.length;
  }

  return getNumericValue([
    election?.positionCount,
    election?.positionsCount,
    election?.totalPositions,
    election?.stats?.positions,
    election?.statistics?.positions,
  ]);
};


const getApplicationCount = (
  election
) => {
  return getNumericValue([
    election?.applicationCount,
    election?.applicationsCount,
    election?.totalApplications,
    election?.stats?.applications,
    election?.statistics?.applications,
  ]);
};


const getAspirantCount = (
  election
) => {
  return getNumericValue([
    election?.aspirantCount,
    election?.aspirantsCount,
    election?.totalAspirants,
    election?.stats?.aspirants,
    election?.statistics?.aspirants,
  ]);
};


const getVoteCount = (
  election
) => {
  return getNumericValue([
    election?.voteCount,
    election?.votesCount,
    election?.totalVotes,
    election?.stats?.votes,
    election?.statistics?.votes,
  ]);
};


/* ==========================================================
   API ERROR
========================================================== */

const getApiErrorMessage = (
  error
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to load elections. Please try again."
  );
};


/* ==========================================================
   COMPONENT
========================================================== */

const AdminElections = () => {
  const navigate =
    useNavigate();

  const [
    elections,
    setElections,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    scopeFilter,
    setScopeFilter,
  ] = useState("all");


  /* ========================================================
     LOAD ELECTIONS
  ======================================================== */

  const loadElections = async (
    showRefreshing = false
  ) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await getAdminElections();

      console.log(
        "Admin elections response:",
        response
      );

      const electionList =
        getElectionCollection(
          response
        );

      /*
       * Only keep valid object records.
       * This prevents a null/undefined API
       * item from crashing the entire page.
       */
      const normalizedElections =
        electionList.filter(
          (election) =>
            election &&
            typeof election ===
              "object"
        );

      setElections(
        normalizedElections
      );
    } catch (err) {
      console.error(
        "Failed to load admin elections:",
        err
      );

      setElections([]);

      setError(
        getApiErrorMessage(err)
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    loadElections();
  }, []);


  /* ========================================================
     STATISTICS
  ======================================================== */

  const statistics =
    useMemo(() => {
      const total =
        elections.length;

      const drafts =
        elections.filter(
          (election) =>
            getElectionStatus(
              election
            ) === "draft"
        ).length;

      const applicationsOpen =
        elections.filter(
          (election) =>
            getElectionStatus(
              election
            ) === "open"
        ).length;

      const voting =
        elections.filter(
          (election) =>
            getElectionStatus(
              election
            ) === "voting"
        ).length;

      const closed =
        elections.filter(
          (election) =>
            getElectionStatus(
              election
            ) === "closed"
        ).length;

      const results =
        elections.filter(
          (election) =>
            getElectionStatus(
              election
            ) === "results"
        ).length;

      const cancelled =
        elections.filter(
          (election) =>
            getElectionStatus(
              election
            ) === "cancelled"
        ).length;

      const applications =
        elections.reduce(
          (
            totalCount,
            election
          ) =>
            totalCount +
            getApplicationCount(
              election
            ),
          0
        );

      const aspirants =
        elections.reduce(
          (
            totalCount,
            election
          ) =>
            totalCount +
            getAspirantCount(
              election
            ),
          0
        );

      const votes =
        elections.reduce(
          (
            totalCount,
            election
          ) =>
            totalCount +
            getVoteCount(
              election
            ),
          0
        );

      return {
        total,
        drafts,
        applicationsOpen,
        voting,
        closed,
        results,
        cancelled,
        applications,
        aspirants,
        votes,
      };
    }, [
      elections,
    ]);


  /* ========================================================
     FILTERED ELECTIONS
  ======================================================== */

  const filteredElections =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return elections.filter(
        (election) => {
          const status =
            getElectionStatus(
              election
            );

          const scope =
            getElectionScope(
              election
            );

          const matchesStatus =
            statusFilter === "all" ||
            status ===
              statusFilter;

          const matchesScope =
            scopeFilter === "all" ||
            scope ===
              scopeFilter;

          const searchableText = [
            getElectionName(
              election
            ),
            election?.description,
            scope,
            election?.county,
            election?.constituency,
            election?.ward,
          ]
            .filter(
              (value) =>
                value !==
                  null &&
                value !==
                  undefined
            )
            .map(
              (value) =>
                String(value)
            )
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !search ||
            searchableText.includes(
              search
            );

          return (
            matchesStatus &&
            matchesScope &&
            matchesSearch
          );
        }
      );
    }, [
      elections,
      searchTerm,
      statusFilter,
      scopeFilter,
    ]);


  /* ========================================================
     NAVIGATION
  ======================================================== */

  const handleCreateElection =
    () => {
      navigate(
        "/admin/elections/create"
      );
    };


  const handleManageElection =
    (election) => {
      const electionId =
        getElectionId(
          election
        );

      if (!electionId) {
        console.warn(
          "Cannot manage election without ID:",
          election
        );
        return;
      }

      navigate(
        `/admin/elections/${electionId}`
      );
    };


  const handleEditElection =
    (election) => {
      const electionId =
        getElectionId(
          election
        );

      if (!electionId) {
        console.warn(
          "Cannot edit election without ID:",
          election
        );
        return;
      }

      navigate(
        `/admin/elections/${electionId}/edit`
      );
    };


  const handleViewPublic =
    (election) => {
      const electionId =
        getElectionId(
          election
        );

      if (!electionId) {
        return;
      }

      navigate(
        `/dashboard/elections/${electionId}`
      );
    };


  const handleApplications =
    (election) => {
      const electionId = getElectionId(election);

      if (!electionId) return;

      navigate(
        `/admin/elections/${electionId}/applications?electionId=${electionId}`
      );
    };


  const handleAspirants =
    (election) => {
      const electionId = getElectionId(election);

      if (!electionId) return;

      navigate(
        `/admin/elections/${electionId}/aspirants?electionId=${electionId}`
      );
    };


  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <div className="admin-elections-page">

        <div className="admin-elections-loading">

          <div className="admin-elections-spinner">
            <FaSyncAlt />
          </div>

          <h3>
            Loading Elections
          </h3>

          <p>
            Retrieving election records...
          </p>

        </div>

      </div>
    );
  }


  /* ========================================================
     ERROR
  ======================================================== */

  if (error) {
    return (
      <div className="admin-elections-page">

        <div className="admin-elections-error">

          <div className="admin-elections-error-icon">
            !
          </div>

          <h2>
            Unable to Load Elections
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="admin-elections-primary-btn"
            onClick={() =>
              loadElections()
            }
          >
            <FaSyncAlt />
            Try Again
          </button>

        </div>

      </div>
    );
  }


  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="admin-elections-page">

      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

      <header className="admin-elections-header">

        <div className="admin-elections-header-content">

          <div>

            <span className="admin-elections-eyebrow">
              JVP CONNECT • GOVERNANCE
            </span>

            <h1>
              Elections Management
            </h1>

            <p>
              Manage JVP elective and nomination exercises,
              review applications, administer aspirants,
              appointments, voting, and results from one
              administrative workspace.
            </p>

          </div>

          <div className="admin-elections-header-actions">

            <button
              type="button"
              className="admin-elections-refresh-btn"
              onClick={() =>
                loadElections(true)
              }
              disabled={refreshing}
            >

              <FaSyncAlt
                className={
                  refreshing
                    ? "admin-elections-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}

            </button>

            <button
              type="button"
              className="admin-elections-create-btn"
              onClick={
                handleCreateElection
              }
            >

              <FaPlus />

              Create Election

            </button>

          </div>

        </div>

      </header>


      {/* ====================================================
          MAIN CONTENT
      ==================================================== */}

      <main className="admin-elections-container">

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section className="admin-elections-stats">

          <div className="admin-election-stat-card">

            <div className="admin-election-stat-icon total">
              <FaVoteYea />
            </div>

            <div>
              <span>
                Total Elections
              </span>

              <strong>
                {statistics.total}
              </strong>

              <small>
                All election records
              </small>
            </div>

          </div>


          <div className="admin-election-stat-card">

            <div className="admin-election-stat-icon draft">
              <FaClock />
            </div>

            <div>
              <span>
                Drafts
              </span>

              <strong>
                {statistics.drafts}
              </strong>

              <small>
                Awaiting publication
              </small>
            </div>

          </div>


          <div className="admin-election-stat-card">

            <div className="admin-election-stat-icon open">
              <FaClipboardList />
            </div>

            <div>
              <span>
                Applications Open
              </span>

              <strong>
                {statistics.applicationsOpen}
              </strong>

              <small>
                Accepting applications
              </small>
            </div>

          </div>


          <div className="admin-election-stat-card">

            <div className="admin-election-stat-icon voting">
              <FaPlayCircle />
            </div>

            <div>
              <span>
                Voting Open
              </span>

              <strong>
                {statistics.voting}
              </strong>

              <small>
                Elections accepting votes
              </small>
            </div>

          </div>


          <div className="admin-election-stat-card">

            <div className="admin-election-stat-icon results">
              <FaCheckCircle />
            </div>

            <div>
              <span>
                Results Published
              </span>

              <strong>
                {statistics.results}
              </strong>

              <small>
                Completed elections
              </small>
            </div>

          </div>

        </section>


        {/* ==================================================
            MANAGEMENT SHORTCUTS
        ================================================== */}

        <section className="admin-election-shortcuts">

          <button
            type="button"
            onClick={() => navigate("/admin/elections/applications")}
            className="admin-election-shortcut"
          >

            <span className="shortcut-icon">
              <FaClipboardList />
            </span>

            <span className="shortcut-content">

              <strong>
                Applications
              </strong>

              <small>
                Review and process candidate
                applications
              </small>

            </span>

            <FaArrowRight />

          </button>


          <button
            type="button"
            onClick={() => navigate("/admin/elections/aspirants")}
            className="admin-election-shortcut"
          >

            <span className="shortcut-icon">
              <FaUsers />
            </span>

            <span className="shortcut-content">

              <strong>
                Aspirants
              </strong>

              <small>
                View approved candidates and
                election participation
              </small>

            </span>

            <FaArrowRight />

          </button>


          <button
            type="button"
            className="admin-election-shortcut"
            onClick={() =>
              setStatusFilter(
                "results"
              )
            }
          >

            <span className="shortcut-icon">
              <FaChartBar />
            </span>

            <span className="shortcut-content">

              <strong>
                Results
              </strong>

              <small>
                View completed elections and
                published results
              </small>

            </span>

            <FaArrowRight />

          </button>

        </section>


        {/* ==================================================
            ELECTIONS SECTION
        ================================================== */}

        <section className="admin-elections-list-section">

          <div className="admin-elections-section-header">

            <div>

              <span>
                ELECTION REGISTER
              </span>

              <h2>
                All Elections
              </h2>

              <p>
                Select an election to manage its
                complete electoral process.
              </p>

            </div>

            <div className="admin-elections-count">
              {filteredElections.length}{" "}
              {filteredElections.length ===
              1
                ? "Election"
                : "Elections"}
            </div>

          </div>


          {/* ==================================================
              FILTERS
          ================================================== */}

          <div className="admin-elections-filters">

            <div className="admin-election-search">

              <FaSearch />

              <input
                type="text"
                placeholder="Search elections..."
                value={searchTerm}
                onChange={(
                  event
                ) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>


            <div className="admin-election-filter-control">

              <FaFilter />

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >

                <option value="all">
                  All Statuses
                </option>

                <option value="draft">
                  Draft
                </option>

                <option value="open">
                  Applications Open
                </option>

                <option value="voting">
                  Voting Open
                </option>

                <option value="closed">
                  Voting Closed
                </option>

                <option value="results">
                  Results Published
                </option>

                <option value="cancelled">
                  Cancelled
                </option>

              </select>

            </div>


            <div className="admin-election-filter-control">

              <FaMapMarkerAlt />

              <select
                value={
                  scopeFilter
                }
                onChange={(
                  event
                ) =>
                  setScopeFilter(
                    event.target.value
                  )
                }
              >

                <option value="all">
                  All Scopes
                </option>

                <option value="regional">
                  Regional
                </option>

                <option value="county">
                  County
                </option>

                <option value="constituency">
                  Constituency
                </option>

                <option value="ward">
                  Ward
                </option>

              </select>

            </div>

          </div>


          {/* ==================================================
              EMPTY STATE
          ================================================== */}

          {filteredElections.length ===
          0 ? (

            <div className="admin-elections-empty">

              <div className="admin-elections-empty-icon">
                <FaVoteYea />
              </div>

              <h3>
                No Elections Found
              </h3>

              <p>
                {elections.length ===
                0
                  ? "No elections have been created yet. Create your first JVP election to begin."
                  : "No elections match your current search or filters."}
              </p>

              {elections.length ===
              0 ? (

                <button
                  type="button"
                  className="admin-elections-primary-btn"
                  onClick={
                    handleCreateElection
                  }
                >
                  <FaPlus />
                  Create Election
                </button>

              ) : (

                <button
                  type="button"
                  className="admin-elections-outline-btn"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter(
                      "all"
                    );
                    setScopeFilter(
                      "all"
                    );
                  }}
                >
                  Clear Filters
                </button>

              )}

            </div>

          ) : (

            /* ==================================================
               ELECTION CARDS
            ================================================== */

            <div className="admin-elections-grid">

              {filteredElections.map(
                (
                  election,
                  index
                ) => {

                  const electionId =
                    getElectionId(
                      election
                    );

                  const status =
                    getStatusClass(
                      getElectionStatus(
                        election
                      )
                    );

                  const positions =
                    getPositionCount(
                      election
                    );

                  const applications =
                    getApplicationCount(
                      election
                    );

                  const aspirants =
                    getAspirantCount(
                      election
                    );

                  const votes =
                    getVoteCount(
                      election
                    );

                  const cardKey =
                    electionId ||
                    `${getElectionName(
                      election
                    )}-${index}`;

                  return (
                    <article
                      key={
                        cardKey
                      }
                      className={`admin-election-card status-${status}`}
                    >

                      {/* ==================================
                          CARD TOP
                      ================================== */}

                      <div className="admin-election-card-top">

                        <span
                          className={`admin-election-status status-${status}`}
                        >
                          {getStatusLabel(
                            getElectionStatus(
                              election
                            )
                          )}
                        </span>

                        <span className={`admin-election-type type-${getElectionType(election)}`}>
                          {getTypeLabel(election)}
                        </span>

                        <span className="admin-election-scope">
                          {getScopeLabel(
                            election
                          )}
                        </span>

                      </div>


                      {/* ==================================
                          CARD CONTENT
                      ================================== */}

                      <div className="admin-election-card-body">

                        <h3>
                          {getElectionName(
                            election
                          )}
                        </h3>

                        {election?.description && (
                          <p className="admin-election-description">
                            {
                              election.description
                            }
                          </p>
                        )}


                        {/* LOCATION */}

                        {(election?.county ||
                          election?.constituency ||
                          election?.ward) && (

                          <div className="admin-election-location">

                            <FaMapMarkerAlt />

                            <span>
                              {[
                                election?.county,
                                election?.constituency,
                                election?.ward,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " • "
                                )}
                            </span>

                          </div>

                        )}


                        {/* ==================================
                            METRICS
                        ================================== */}

                        <div className="admin-election-metrics">

                          <div>
                            <FaBuilding />

                            <span>
                              Positions
                            </span>

                            <strong>
                              {positions}
                            </strong>
                          </div>


                          <div>
                            <FaClipboardList />

                            <span>
                              Applications
                            </span>

                            <strong>
                              {
                                applications
                              }
                            </strong>
                          </div>


                          <div>
                            <FaUsers />

                            <span>
                              {getElectionType(election) === "nomination"
                                ? "Appointments"
                                : "Aspirants"}
                            </span>

                            <strong>
                              {getElectionType(election) === "nomination"
                                ? getNumericValue([
                                    election?.appointedCount,
                                    election?.appointmentsCount,
                                    election?.stats?.appointed,
                                    election?.statistics?.appointed,
                                  ])
                                : aspirants}
                            </strong>
                          </div>


                          <div>
                            <FaVoteYea />

                            <span>
                              Votes
                            </span>

                            <strong>
                              {votes}
                            </strong>
                          </div>

                        </div>


                        {/* ==================================
                            DATES
                        ================================== */}

                        <div className="admin-election-dates">

                          <div>

                            <FaClipboardList />

                            <span>
                              Applications
                            </span>

                            <strong>
                              {formatDateRange(
                                election?.applicationStart,
                                election?.applicationEnd
                              )}
                            </strong>

                          </div>


                          <div>

                            <FaCalendarAlt />

                            <span>
                              {getElectionType(election) === "nomination"
                                ? "Vetting / Appointment"
                                : "Voting"}
                            </span>

                            <strong>
                              {getElectionType(election) === "nomination"
                                ? "Application review & appointment"
                                : formatDateRange(
                                    election?.votingStart,
                                    election?.votingEnd
                                  )}
                            </strong>

                          </div>

                        </div>

                      </div>


                      {/* ==================================
                          WORKSPACE LINKS
                      ================================== */}

                      <div className="admin-election-workspace-links">

                        <button
                          type="button"
                          onClick={() => handleApplications(election)}
                          disabled={!electionId}
                        >
                          <FaClipboardList />
                          Applications
                        </button>

                        {getElectionType(election) === "elective" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAspirants(election)}
                              disabled={!electionId}
                            >
                              <FaUsers />
                              Aspirants
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/elections/${electionId}/results`)
                              }
                              disabled={!electionId}
                            >
                              <FaChartBar />
                              Results
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApplications(election)}
                            disabled={!electionId}
                          >
                            <FaCheckCircle />
                            Review / Appoint
                          </button>
                        )}

                      </div>


                      {/* ==================================
                          CARD FOOTER
                      ================================== */}

                      <div className="admin-election-card-footer">

                        <button
                          type="button"
                          className="admin-election-manage-btn"
                          onClick={() =>
                            handleManageElection(
                              election
                            )
                          }
                          disabled={
                            !electionId
                          }
                        >

                          <FaCog />

                          Manage

                          <FaArrowRight />

                        </button>


                        <div className="admin-election-secondary-actions">

                          <button
                            type="button"
                            title="View public election"
                            aria-label="View public election"
                            onClick={() =>
                              handleViewPublic(
                                election
                              )
                            }
                            disabled={
                              !electionId
                            }
                          >
                            <FaEye />
                          </button>


                          <button
                            type="button"
                            title="Edit election"
                            aria-label="Edit election"
                            onClick={() =>
                              handleEditElection(
                                election
                              )
                            }
                            disabled={
                              !electionId
                            }
                          >
                            <FaEdit />
                          </button>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          )}

        </section>


        {/* ==================================================
            ADMIN INFORMATION
        ================================================== */}

        <section className="admin-elections-info">

          <div className="admin-elections-info-icon">
            <FaVoteYea />
          </div>

          <div>

            <h3>
              Election Administration
            </h3>

            <p>
              Use the election management workspace
              to configure positions, review and vet
              applications, approve aspirants for elective
              exercises, effect appointments for nominations,
              monitor voting activity, close elections,
              and publish results.
            </p>

          </div>

          <button
            type="button"
            onClick={
              handleCreateElection
            }
          >
            <FaPlus />
            Create Election
          </button>

        </section>

      </main>

    </div>
  );
};

export default AdminElections;