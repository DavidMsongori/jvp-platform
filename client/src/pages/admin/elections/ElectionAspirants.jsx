import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaChevronDown,
  FaChevronRight,
  FaClock,
  FaEnvelope,
  FaEye,
  FaFilter,
  FaPhone,
  FaSearch,
  FaTimes,
  FaUser,
  FaUsers,
  FaVoteYea,
} from "react-icons/fa";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../../../services/api";

import "./ElectionAspirants.css";


/* ==========================================================
   HELPERS
========================================================== */

const getResponseData = (response) => {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
};


const getAspirantsFromResponse = (response) => {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.aspirants)) {
    return data.aspirants;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};


const getAspirantId = (aspirant) => {
  return (
    aspirant?._id ||
    aspirant?.id ||
    aspirant?.aspirantId
  );
};


const getApplicant = (aspirant) => {
  return (
    aspirant?.applicant ||
    aspirant?.member ||
    aspirant?.user ||
    aspirant?.candidate ||
    {}
  );
};


const getAspirantName = (aspirant) => {
  const applicant =
    getApplicant(aspirant);

  if (applicant?.name) {
    return applicant.name;
  }

  const fullName = [
    applicant?.firstName,
    applicant?.middleName,
    applicant?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    aspirant?.name ||
    aspirant?.candidateName ||
    aspirant?.applicantName ||
    "Unknown Aspirant"
  );
};


const getAspirantEmail = (aspirant) => {
  const applicant =
    getApplicant(aspirant);

  return (
    applicant?.email ||
    aspirant?.email ||
    ""
  );
};


const getAspirantPhone = (aspirant) => {
  const applicant =
    getApplicant(aspirant);

  return (
    applicant?.phone ||
    applicant?.phoneNumber ||
    aspirant?.phone ||
    aspirant?.phoneNumber ||
    ""
  );
};


const getPosition = (aspirant) => {
  return (
    aspirant?.position ||
    aspirant?.positionDetails ||
    {}
  );
};


const getPositionId = (aspirant) => {
  const position =
    getPosition(aspirant);

  return (
    position?._id ||
    position?.id ||
    aspirant?.positionId ||
    ""
  );
};


const getPositionName = (aspirant) => {
  const position =
    getPosition(aspirant);

  return (
    position?.name ||
    aspirant?.positionName ||
    "Position Not Specified"
  );
};


const getElection = (aspirant) => {
  return (
    aspirant?.election ||
    aspirant?.electionDetails ||
    {}
  );
};


const getElectionId = (aspirant) => {
  const election =
    getElection(aspirant);

  return (
    election?._id ||
    election?.id ||
    aspirant?.electionId ||
    ""
  );
};


const getElectionName = (aspirant) => {
  const election =
    getElection(aspirant);

  return (
    election?.name ||
    aspirant?.electionName ||
    "Election"
  );
};


const getApplicationStatus = (
  aspirant
) => {
  return (
    aspirant?.applicationStatus ||
    aspirant?.status ||
    aspirant?.reviewStatus ||
    "approved"
  ).toLowerCase();
};


const formatStatus = (status) => {
  const labels = {
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    active: "Active",
    inactive: "Inactive",
  };

  return (
    labels[status] ||
    String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  );
};


const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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
  if (!name) {
    return "A";
  }

  const parts =
    name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
};


/* ==========================================================
   STATUS BADGE
========================================================== */

function AspirantStatus({
  status,
}) {
  const normalizedStatus =
    String(status || "approved")
      .toLowerCase();

  return (
    <span
      className={`aspirant-status aspirant-status-${normalizedStatus}`}
    >
      <span className="aspirant-status-dot" />

      {formatStatus(
        normalizedStatus
      )}
    </span>
  );
}


/* ==========================================================
   ASPIRANT DETAILS DRAWER
========================================================== */

function AspirantDetails({
  aspirant,
  onClose,
  onViewApplication,
}) {
  if (!aspirant) {
    return null;
  }

  const name =
    getAspirantName(aspirant);

  const email =
    getAspirantEmail(aspirant);

  const phone =
    getAspirantPhone(aspirant);

  const position =
    getPositionName(aspirant);

  const election =
    getElectionName(aspirant);

  const status =
    getApplicationStatus(
      aspirant
    );

  const submittedAt =
    aspirant?.application?.createdAt ||
    aspirant?.application?.submittedAt ||
    aspirant?.submittedAt ||
    aspirant?.createdAt;

  const approvedAt =
    aspirant?.approvedAt ||
    aspirant?.reviewedAt;

  const application =
    aspirant?.application ||
    aspirant?.applicationDetails ||
    {};

  return (
    <div
      className="aspirant-drawer-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <aside
        className="aspirant-drawer"
        aria-label="Aspirant details"
      >

        {/* HEADER */}

        <div className="aspirant-drawer-header">

          <div>
            <span className="aspirants-eyebrow">
              Aspirant Profile
            </span>

            <h2>
              Candidate Details
            </h2>
          </div>

          <button
            type="button"
            className="aspirant-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>

        </div>


        {/* CONTENT */}

        <div className="aspirant-drawer-content">

          {/* PROFILE */}

          <div className="aspirant-profile-card">

            <div className="aspirant-large-avatar">
              {getInitials(name)}
            </div>

            <div className="aspirant-profile-main">

              <h3>
                {name}
              </h3>

              <p>
                {position}
              </p>

              <AspirantStatus
                status={status}
              />

            </div>

          </div>


          {/* ELECTION */}

          <section className="aspirant-detail-section">

            <div className="aspirant-section-heading">
              <FaVoteYea />

              <h3>
                Election Information
              </h3>
            </div>

            <div className="aspirant-detail-grid">

              <div className="aspirant-detail-item full">
                <span>
                  Election
                </span>

                <strong>
                  {election}
                </strong>
              </div>

              <div className="aspirant-detail-item">
                <span>
                  Position
                </span>

                <strong>
                  {position}
                </strong>
              </div>

              <div className="aspirant-detail-item">
                <span>
                  Aspirant ID
                </span>

                <strong className="aspirant-id">
                  {getAspirantId(
                    aspirant
                  ) || "—"}
                </strong>
              </div>

            </div>

          </section>


          {/* CONTACT */}

          <section className="aspirant-detail-section">

            <div className="aspirant-section-heading">
              <FaUser />

              <h3>
                Candidate Information
              </h3>
            </div>

            <div className="aspirant-contact-list">

              <div className="aspirant-contact-item">

                <div className="aspirant-contact-icon">
                  <FaEnvelope />
                </div>

                <div>
                  <span>
                    Email Address
                  </span>

                  <strong>
                    {email || "Not provided"}
                  </strong>
                </div>

              </div>


              <div className="aspirant-contact-item">

                <div className="aspirant-contact-icon">
                  <FaPhone />
                </div>

                <div>
                  <span>
                    Phone Number
                  </span>

                  <strong>
                    {phone || "Not provided"}
                  </strong>
                </div>

              </div>

            </div>

          </section>


          {/* TIMELINE */}

          <section className="aspirant-detail-section">

            <div className="aspirant-section-heading">
              <FaClock />

              <h3>
                Application Timeline
              </h3>
            </div>

            <div className="aspirant-timeline">

              <div className="aspirant-timeline-item">

                <span className="aspirant-timeline-dot" />

                <div>
                  <span>
                    Application Submitted
                  </span>

                  <strong>
                    {formatDateTime(
                      submittedAt
                    )}
                  </strong>
                </div>

              </div>


              {approvedAt && (
                <div className="aspirant-timeline-item">

                  <span className="aspirant-timeline-dot" />

                  <div>
                    <span>
                      Application Reviewed
                    </span>

                    <strong>
                      {formatDateTime(
                        approvedAt
                      )}
                    </strong>
                  </div>

                </div>
              )}

            </div>

          </section>


          {/* APPLICATION DETAILS */}

          {Object.keys(
            application || {}
          ).length > 0 && (
            <section className="aspirant-detail-section">

              <div className="aspirant-section-heading">
                <FaFilter />

                <h3>
                  Application Details
                </h3>
              </div>

              <div className="aspirant-application-summary">

                {application?.motivation && (
                  <div>
                    <span>
                      Motivation
                    </span>

                    <p>
                      {application.motivation}
                    </p>
                  </div>
                )}

                {application?.statement && (
                  <div>
                    <span>
                      Statement
                    </span>

                    <p>
                      {application.statement}
                    </p>
                  </div>
                )}

                {application?.manifesto && (
                  <div>
                    <span>
                      Manifesto
                    </span>

                    <p>
                      {application.manifesto}
                    </p>
                  </div>
                )}

              </div>

            </section>
          )}

        </div>


        {/* FOOTER */}

        <div className="aspirant-drawer-footer">

          <button
            type="button"
            className="aspirant-button secondary"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="aspirant-button primary"
            onClick={() =>
              onViewApplication(
                aspirant
              )
            }
          >
            <FaEye />

            View Application
          </button>

        </div>

      </aside>
    </div>
  );
}


/* ==========================================================
   MAIN PAGE
========================================================== */

function ElectionAspirants() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const electionId =
    searchParams.get(
      "electionId"
    );


  /* ========================================================
     STATE
  ======================================================== */

  const [aspirants, setAspirants] =
    useState([]);

  const [elections, setElections] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [electionFilter, setElectionFilter] =
    useState(
      electionId || "all"
    );

  const [positionFilter, setPositionFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedAspirant, setSelectedAspirant] =
    useState(null);

  const [expandedRows, setExpandedRows] =
    useState({});


  /* ========================================================
     LOAD ASPIRANTS
  ======================================================== */

  const loadAspirants =
    async () => {
      try {
        setLoading(true);
        setError("");

        /*
          Backend verification will be done later.

          For now this uses the known admin endpoint:
            GET /elections/aspirants

          If the backend later requires an
          electionId query parameter, we will
          align this here.
        */

        const response =
          await api.get(
            "/elections/aspirants"
          );

        const loaded =
          getAspirantsFromResponse(
            response
          );

        setAspirants(
          loaded
        );
      } catch (requestError) {
        console.error(
          "Unable to load election aspirants:",
          requestError
        );

        setError(
          requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          "Unable to load election aspirants."
        );
      } finally {
        setLoading(false);
      }
    };


  /* ========================================================
     LOAD ELECTIONS
  ======================================================== */

  const loadElections =
    async () => {
      try {
        const response =
          await api.get(
            "/elections"
          );

        const data =
          getResponseData(
            response
          );

        const loaded =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.elections
              )
              ? data.elections
              : [];

        setElections(
          loaded
        );
      } catch (requestError) {
        console.error(
          "Unable to load elections:",
          requestError
        );
      }
    };


  useEffect(() => {
    loadAspirants();
    loadElections();
  }, []);


  /* ========================================================
     SYNC URL ELECTION
  ======================================================== */

  useEffect(() => {
    if (electionId) {
      setElectionFilter(
        electionId
      );
    }
  }, [electionId]);


  /* ========================================================
     POSITION OPTIONS
  ======================================================== */

  const positions =
    useMemo(() => {
      const positionMap =
        new Map();

      aspirants.forEach(
        (aspirant) => {
          const id =
            getPositionId(
              aspirant
            );

          const name =
            getPositionName(
              aspirant
            );

          if (
            id &&
            name
          ) {
            positionMap.set(
              String(id),
              {
                id: String(id),
                name,
              }
            );
          }
        }
      );

      return Array.from(
        positionMap.values()
      ).sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      );
    }, [aspirants]);


  /* ========================================================
     FILTER ASPIRANTS
  ======================================================== */

  const filteredAspirants =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return aspirants.filter(
        (aspirant) => {

          const name =
            getAspirantName(
              aspirant
            ).toLowerCase();

          const email =
            getAspirantEmail(
              aspirant
            ).toLowerCase();

          const phone =
            getAspirantPhone(
              aspirant
            ).toLowerCase();

          const position =
            getPositionName(
              aspirant
            ).toLowerCase();

          const election =
            getElectionName(
              aspirant
            ).toLowerCase();

          const aspirantElectionId =
            getElectionId(
              aspirant
            );

          const aspirantPositionId =
            getPositionId(
              aspirant
            );

          const status =
            getApplicationStatus(
              aspirant
            );


          const matchesSearch =
            !normalizedSearch ||
            name.includes(
              normalizedSearch
            ) ||
            email.includes(
              normalizedSearch
            ) ||
            phone.includes(
              normalizedSearch
            ) ||
            position.includes(
              normalizedSearch
            ) ||
            election.includes(
              normalizedSearch
            );


          const matchesElection =
            electionFilter ===
              "all" ||
            String(
              aspirantElectionId
            ) ===
              String(
                electionFilter
              );


          const matchesPosition =
            positionFilter ===
              "all" ||
            String(
              aspirantPositionId
            ) ===
              String(
                positionFilter
              );


          const matchesStatus =
            statusFilter ===
              "all" ||
            status ===
              statusFilter;


          return (
            matchesSearch &&
            matchesElection &&
            matchesPosition &&
            matchesStatus
          );
        }
      );
    }, [
      aspirants,
      search,
      electionFilter,
      positionFilter,
      statusFilter,
    ]);


  /* ========================================================
     STATISTICS
  ======================================================== */

  const statistics =
    useMemo(() => {

      const selected =
        aspirants.filter(
          (aspirant) => {

            if (
              electionFilter ===
              "all"
            ) {
              return true;
            }

            return (
              String(
                getElectionId(
                  aspirant
                )
              ) ===
              String(
                electionFilter
              )
            );
          }
        );


      return {
        total:
          selected.length,

        approved:
          selected.filter(
            (aspirant) =>
              getApplicationStatus(
                aspirant
              ) === "approved"
          ).length,

        pending:
          selected.filter(
            (aspirant) =>
              getApplicationStatus(
                aspirant
              ) === "pending"
          ).length,

        rejected:
          selected.filter(
            (aspirant) =>
              getApplicationStatus(
                aspirant
              ) === "rejected"
          ).length,
      };

    }, [
      aspirants,
      electionFilter,
    ]);


  /* ========================================================
     EXPAND ROW
  ======================================================== */

  const toggleRow =
    (id) => {
      setExpandedRows(
        (previous) => ({
          ...previous,
          [id]:
            !previous[id],
        })
      );
    };


  /* ========================================================
     VIEW APPLICATION
  ======================================================== */

  const viewApplication =
    (aspirant) => {
      const applicationId =
        aspirant?.application?._id ||
        aspirant?.application?.id ||
        aspirant?.applicationId;

      setSelectedAspirant(
        null
      );

      if (
        applicationId
      ) {
        navigate(
          `/admin/elections/applications?applicationId=${applicationId}`
        );

        return;
      }

      navigate(
        "/admin/elections/applications"
      );
    };


  /* ========================================================
     CLEAR FILTERS
  ======================================================== */

  const clearFilters =
    () => {
      setSearch("");
      setElectionFilter(
        "all"
      );
      setPositionFilter(
        "all"
      );
      setStatusFilter(
        "all"
      );
    };


  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="election-aspirants-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="aspirants-page-header">

        <div className="aspirants-header-left">

          <button
            type="button"
            className="aspirants-back-button"
            onClick={() =>
              navigate(
                "/admin/elections"
              )
            }
            aria-label="Back to elections"
          >
            <FaArrowLeft />
          </button>


          <div>

            <div className="aspirants-eyebrow">
              <FaVoteYea />
              Election Administration
            </div>

            <h1>
              Election Aspirants
            </h1>

            <p>
              View and manage approved
              election aspirants across
              JVP elections.
            </p>

          </div>

        </div>

      </header>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="aspirants-alert">

          <div className="aspirants-alert-icon">
            <FaTimes />
          </div>

          <div>
            <strong>
              Unable to Load Aspirants
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Dismiss"
          >
            <FaTimes />
          </button>

        </div>
      )}


      {/* ====================================================
          STATISTICS
      ==================================================== */}

      <section className="aspirants-stat-grid">

        <div className="aspirant-stat-card">

          <div className="aspirant-stat-icon total">
            <FaUsers />
          </div>

          <div>
            <span>
              Total Aspirants
            </span>

            <strong>
              {statistics.total}
            </strong>
          </div>

        </div>


        <div className="aspirant-stat-card">

          <div className="aspirant-stat-icon approved">
            <FaVoteYea />
          </div>

          <div>
            <span>
              Approved
            </span>

            <strong>
              {statistics.approved}
            </strong>
          </div>

        </div>


        <div className="aspirant-stat-card">

          <div className="aspirant-stat-icon pending">
            <FaClock />
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {statistics.pending}
            </strong>
          </div>

        </div>


        <div className="aspirant-stat-card">

          <div className="aspirant-stat-icon rejected">
            <FaTimes />
          </div>

          <div>
            <span>
              Rejected
            </span>

            <strong>
              {statistics.rejected}
            </strong>
          </div>

        </div>

      </section>


      {/* ====================================================
          FILTER TOOLBAR
      ==================================================== */}

      <section className="aspirants-toolbar">

        <div className="aspirants-search">

          <FaSearch />

          <input
            type="search"
            placeholder="Search aspirant, email, phone or position..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        <div className="aspirants-filters">

          {/* ELECTION */}

          <div className="aspirant-filter">

            <label htmlFor="aspirantElection">
              Election
            </label>

            <div className="aspirant-select-wrapper">

              <select
                id="aspirantElection"
                value={
                  electionFilter
                }
                onChange={(event) => {
                  setElectionFilter(
                    event.target.value
                  );

                  setPositionFilter(
                    "all"
                  );
                }}
              >
                <option value="all">
                  All Elections
                </option>

                {elections.map(
                  (election) => (
                    <option
                      key={
                        election._id ||
                        election.id
                      }
                      value={
                        election._id ||
                        election.id
                      }
                    >
                      {election.name}
                    </option>
                  )
                )}

              </select>

              <FaChevronDown />

            </div>

          </div>


          {/* POSITION */}

          <div className="aspirant-filter">

            <label htmlFor="aspirantPosition">
              Position
            </label>

            <div className="aspirant-select-wrapper">

              <select
                id="aspirantPosition"
                value={
                  positionFilter
                }
                onChange={(event) =>
                  setPositionFilter(
                    event.target.value
                  )
                }
              >

                <option value="all">
                  All Positions
                </option>

                {positions.map(
                  (position) => (
                    <option
                      key={
                        position.id
                      }
                      value={
                        position.id
                      }
                    >
                      {position.name}
                    </option>
                  )
                )}

              </select>

              <FaChevronDown />

            </div>

          </div>


          {/* STATUS */}

          <div className="aspirant-filter">

            <label htmlFor="aspirantStatus">
              Status
            </label>

            <div className="aspirant-select-wrapper">

              <select
                id="aspirantStatus"
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >

                <option value="all">
                  All Statuses
                </option>

                <option value="approved">
                  Approved
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="rejected">
                  Rejected
                </option>

                <option value="withdrawn">
                  Withdrawn
                </option>

              </select>

              <FaChevronDown />

            </div>

          </div>

        </div>

      </section>


      {/* ====================================================
          ASPIRANTS CARD
      ==================================================== */}

      <section className="aspirants-card">

        <div className="aspirants-card-header">

          <div>

            <h2>
              Registered Aspirants
            </h2>

            <p>
              Showing{" "}
              <strong>
                {filteredAspirants.length}
              </strong>{" "}
              of{" "}
              <strong>
                {aspirants.length}
              </strong>{" "}
              aspirants
            </p>

          </div>


          <button
            type="button"
            className="aspirants-refresh-button"
            onClick={
              loadAspirants
            }
            disabled={
              loading
            }
          >
            {loading ? (
              <span className="aspirant-spinner" />
            ) : (
              "Refresh"
            )}
          </button>

        </div>


        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (

          <div className="aspirants-loading">

            <span className="aspirants-large-spinner" />

            <h3>
              Loading aspirants
            </h3>

            <p>
              Please wait while we
              retrieve the election
              aspirant register.
            </p>

          </div>

        ) : filteredAspirants.length === 0 ? (

          /* ==================================================
             EMPTY
          ================================================== */

          <div className="aspirants-empty">

            <div className="aspirants-empty-icon">
              <FaUsers />
            </div>

            <h3>
              No aspirants found
            </h3>

            <p>
              {aspirants.length === 0
                ? "There are currently no approved election aspirants."
                : "No aspirants match your current search and filters."}
            </p>

            {aspirants.length > 0 && (
              <button
                type="button"
                className="aspirant-button secondary"
                onClick={
                  clearFilters
                }
              >
                Clear Filters
              </button>
            )}

          </div>

        ) : (

          /* ==================================================
             TABLE
          ================================================== */

          <div className="aspirants-table-wrapper">

            <table className="aspirants-table">

              <thead>

                <tr>

                  <th>
                    Aspirant
                  </th>

                  <th>
                    Election
                  </th>

                  <th>
                    Position
                  </th>

                  <th>
                    Application
                  </th>

                  <th>
                    Status
                  </th>

                  <th className="aspirants-action-header">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredAspirants.map(
                  (aspirant) => {

                    const id =
                      getAspirantId(
                        aspirant
                      );

                    const name =
                      getAspirantName(
                        aspirant
                      );

                    const status =
                      getApplicationStatus(
                        aspirant
                      );

                    const applicationDate =
                      aspirant?.application?.createdAt ||
                      aspirant?.application?.submittedAt ||
                      aspirant?.submittedAt ||
                      aspirant?.createdAt;

                    const expanded =
                      Boolean(
                        expandedRows[id]
                      );


                    return (
                      <tr
                        key={id}
                        className={
                          expanded
                            ? "aspirant-row-expanded"
                            : ""
                        }
                      >

                        {/* ASPIRANT */}

                        <td>

                          <div className="aspirant-table-profile">

                            <button
                              type="button"
                              className="aspirant-expand-button"
                              onClick={() =>
                                toggleRow(
                                  id
                                )
                              }
                              aria-label={
                                expanded
                                  ? "Collapse aspirant"
                                  : "Expand aspirant"
                              }
                            >
                              {expanded ? (
                                <FaChevronDown />
                              ) : (
                                <FaChevronRight />
                              )}
                            </button>


                            <div className="aspirant-avatar">
                              {getInitials(
                                name
                              )}
                            </div>


                            <div className="aspirant-table-info">

                              <strong>
                                {name}
                              </strong>

                              <span>
                                {getAspirantEmail(
                                  aspirant
                                ) ||
                                  getAspirantPhone(
                                    aspirant
                                  ) ||
                                  "Contact unavailable"}
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* ELECTION */}

                        <td>

                          <span className="aspirant-election-name">
                            {getElectionName(
                              aspirant
                            )}
                          </span>

                        </td>


                        {/* POSITION */}

                        <td>

                          <span className="aspirant-position-badge">
                            {getPositionName(
                              aspirant
                            )}
                          </span>

                        </td>


                        {/* APPLICATION DATE */}

                        <td>

                          <span className="aspirant-date">
                            {formatDate(
                              applicationDate
                            )}
                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <AspirantStatus
                            status={
                              status
                            }
                          />

                        </td>


                        {/* ACTION */}

                        <td>

                          <div className="aspirant-actions">

                            <button
                              type="button"
                              className="aspirant-row-action view"
                              onClick={() =>
                                setSelectedAspirant(
                                  aspirant
                                )
                              }
                              title="View aspirant"
                            >
                              <FaEye />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* ====================================================
          DETAILS DRAWER
      ==================================================== */}

      {selectedAspirant && (
        <AspirantDetails
          aspirant={
            selectedAspirant
          }
          onClose={() =>
            setSelectedAspirant(
              null
            )
          }
          onViewApplication={
            viewApplication
          }
        />
      )}

    </div>
  );
}


export default ElectionAspirants;