import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaExclamationCircle,
  FaFileAlt,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPlay,
  FaPlus,
  FaPoll,
  FaPowerOff,
  FaSearch,
  FaStop,
  FaTimes,
  FaTrash,
  FaUserCheck,
  FaUserPlus,
  FaUsers,
  FaVoteYea,
} from "react-icons/fa";

import api from "../../../services/api";

import {
  getElectionSetup,
  searchMembersForElection,
  addExistingAspirant,
  removeExistingAspirant,
  prepareElectionForVoting,
} from "../../../services/election.service";

import "./AdminElectionDetails.css";


/* ==========================================================
   HELPERS
========================================================== */

const getElectionData = (response) => {
  return (
    response?.data?.data?.election ||
    response?.data?.election ||
    response?.data?.data ||
    response?.data ||
    null
  );
};


const getSetupData = (response) => {
  return (
    response?.data?.data ||
    response?.data ||
    null
  );
};


const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};


const formatDate = (value) => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
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
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
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


const getStatusLabel = (status) => {
  const labels = {
    draft: "Draft",
    open: "Applications Open",
    voting: "Voting Open",
    closed: "Voting Closed",
    results: "Results Published",
    cancelled: "Cancelled",
  };

  return labels[status] || status || "Unknown";
};


const getScopeLabel = (election) => {
  if (!election?.scope) {
    return "Not specified";
  }

  const scopeLabels = {
    regional: "Regional",
    county: "County",
    constituency: "Constituency",
    ward: "Ward",
  };

  let label =
    scopeLabels[election.scope] ||
    election.scope;

  if (
    election.scope === "county" &&
    election.county
  ) {
    label = `County — ${election.county}`;
  }

  if (
    election.scope === "constituency"
  ) {
    if (election.constituency) {
      label = `Constituency — ${election.constituency}`;
    } else if (election.county) {
      label = `Constituency — ${election.county}`;
    }
  }

  if (election.scope === "ward") {
    if (election.ward) {
      label = `Ward — ${election.ward}`;
    } else if (election.constituency) {
      label = `Ward — ${election.constituency}`;
    } else if (election.county) {
      label = `Ward — ${election.county}`;
    }
  }

  return label;
};


const getLocationParts = (election) => {
  const parts = [];

  if (election?.county) {
    parts.push(election.county);
  }

  if (
    election?.constituency &&
    election.constituency !== election.county
  ) {
    parts.push(election.constituency);
  }

  if (
    election?.ward &&
    election.ward !== election.constituency
  ) {
    parts.push(election.ward);
  }

  return parts;
};


const getElectionId = (election) => {
  return (
    election?._id ||
    election?.id
  );
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
    ? "Nomination Exercise"
    : "Elective Election";
};


const getPositionId = (position) => {
  return (
    position?._id ||
    position?.id
  );
};


const getPositionName = (
  position,
  fallback = "Position"
) => {
  return (
    position?.name ||
    position?.title ||
    fallback
  );
};


const getMemberId = (member) => {
  return (
    member?._id ||
    member?.id
  );
};


const getMemberName = (member) => {
  if (!member) {
    return "";
  }

  if (member.name) {
    return member.name;
  }

  const parts = [
    member.firstName,
    member.middleName,
    member.lastName,
  ].filter(Boolean);

  return parts.join(" ") || "Unnamed Member";
};


/* ==========================================================
   STATUS CONFIG
========================================================== */

const statusConfig = {
  draft: {
    icon: FaFileAlt,
    className: "status-draft",
  },

  open: {
    icon: FaUsers,
    className: "status-open",
  },

  voting: {
    icon: FaVoteYea,
    className: "status-voting",
  },

  closed: {
    icon: FaStop,
    className: "status-closed",
  },

  results: {
    icon: FaPoll,
    className: "status-results",
  },

  cancelled: {
    icon: FaTimes,
    className: "status-cancelled",
  },
};


/* ==========================================================
   COMPONENT
========================================================== */

function AdminElectionDetails() {

  const {
    electionId,
  } = useParams();

  const navigate = useNavigate();


  /* ========================================================
     ELECTION STATE
  ======================================================== */

  const [
    election,
    setElection,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    confirmAction,
    setConfirmAction,
  ] = useState(null);


  /* ========================================================
     ELECTION SETUP STATE
  ======================================================== */

  const [
    setup,
    setSetup,
  ] = useState(null);

  const [
    setupLoading,
    setSetupLoading,
  ] = useState(false);

  const [
    setupError,
    setSetupError,
  ] = useState("");


  /* ========================================================
     EXISTING ASPIRANT STATE
  ======================================================== */

  const [
    showAddAspirant,
    setShowAddAspirant,
  ] = useState(false);

  const [
    memberSearch,
    setMemberSearch,
  ] = useState("");

  const [
    memberResults,
    setMemberResults,
  ] = useState([]);

  const [
  memberSearchError,
  setMemberSearchError,
] = useState("");

  const [
    memberSearchLoading,
    setMemberSearchLoading,
  ] = useState(false);

  const [
    selectedMember,
    setSelectedMember,
  ] = useState(null);

  const [
    selectedPosition,
    setSelectedPosition,
  ] = useState("");

  const [
    aspirantName,
    setAspirantName,
  ] = useState("");

  const [
    aspirantPhoto,
    setAspirantPhoto,
  ] = useState("");

  const [
    aspirantManifesto,
    setAspirantManifesto,
  ] = useState("");

  const [
    addAspirantLoading,
    setAddAspirantLoading,
  ] = useState(false);

  const [
    addAspirantError,
    setAddAspirantError,
  ] = useState("");


  /* ========================================================
     LOAD ELECTION
  ======================================================== */

  const loadElection = async (
    showPageLoader = true
  ) => {

    try {

      if (showPageLoader) {
        setLoading(true);
      }

      setError("");

      const response =
        await api.get(
          `/elections/${electionId}`
        );

      const data =
        getElectionData(response);

      if (!data) {
        throw new Error(
          "Election information could not be loaded."
        );
      }

      setElection(data);

    } catch (err) {

      console.error(
        "Failed to load election:",
        err
      );

      setError(
        getErrorMessage(err)
      );

    } finally {

      if (showPageLoader) {
        setLoading(false);
      }

    }
  };


  /* ========================================================
     LOAD ELECTION SETUP
  ======================================================== */

  const loadElectionSetup = async () => {

    if (!electionId) {
      return;
    }

    try {

      setSetupLoading(true);
      setSetupError("");

      const response =
        await api.get(
          `/elections/${electionId}/setup`
        );

      const data =
        getSetupData(response);

      setSetup(data);

    } catch (err) {

      console.error(
        "Failed to load election setup:",
        err
      );

      setSetupError(
        getErrorMessage(err)
      );

    } finally {

      setSetupLoading(false);

    }
  };


  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {

    if (!electionId) {
      setError(
        "Invalid election ID."
      );

      setLoading(false);

      return;
    }

    loadElection();

  }, [electionId]);


  /* ========================================================
     LOAD SETUP AFTER ELECTION LOAD
  ======================================================== */

  useEffect(() => {

    if (
      election &&
      getElectionType(election) === "elective"
    ) {
      loadElectionSetup();
    } else {
      setSetup(null);
    }

  }, [
    election,
    electionId,
  ]);


  /* ========================================================
     MEMBER SEARCH
  ======================================================== */

 useEffect(() => {
  if (!showAddAspirant) {
    return;
  }

  const keyword = memberSearch.trim();

  setMemberSearchError("");

  if (keyword.length < 2) {
    setMemberResults([]);
    setMemberSearchLoading(false);
    return;
  }

  const timeout = setTimeout(async () => {
    try {
      setMemberSearchLoading(true);
      setMemberSearchError("");

      console.log(
        "[Election Member Search]",
        keyword
      );

      const response =
        await searchMembersForElection(
          keyword
        );

      console.log(
        "[Election Member Search Response]",
        response
      );

      const members =
        response?.data ||
        [];

      setMemberResults(
        Array.isArray(members)
          ? members
          : []
      );

    } catch (err) {
      console.error(
        "[Election Member Search Error]",
        err
      );

      setMemberResults([]);

      setMemberSearchError(
        getErrorMessage(err)
      );

    } finally {
      setMemberSearchLoading(false);
    }
  }, 350);

  return () => {
    clearTimeout(timeout);
  };

}, [
  memberSearch,
  showAddAspirant,
]);


  /* ========================================================
     DERIVED DATA
  ======================================================== */

  const positions = useMemo(() => {

    if (
      !Array.isArray(
        election?.positions
      )
    ) {
      return [];
    }

    return election.positions;

  }, [election]);


  const locationParts =
    useMemo(
      () =>
        getLocationParts(
          election
        ),
      [election]
    );


  const status =
    election?.status ||
    "draft";


  const statusInfo =
    statusConfig[status] ||
    statusConfig.draft;


  const StatusIcon =
    statusInfo.icon;


  const setupPositions = useMemo(() => {

    if (
      !Array.isArray(
        setup?.positions
      )
    ) {
      return [];
    }

    return setup.positions;

  }, [setup]);


  const activeAspirants = useMemo(() => {

    if (
      !Array.isArray(
        setup?.aspirants
      )
    ) {
      return [];
    }

    return setup.aspirants.filter(
      (aspirant) =>
        aspirant?.status === "active"
    );

  }, [setup]);


  const legacyAspirants = useMemo(() => {

    return activeAspirants.filter(
      (aspirant) =>
        aspirant?.source === "legacy" ||
        !aspirant?.application
    );

  }, [activeAspirants]);


  const setupReady =
    setup?.readyForVoting === true;


  const positionsWithoutAspirants =
    Array.isArray(
      setup?.positionsWithoutAspirants
    )
      ? setup.positionsWithoutAspirants
      : [];


  /* ========================================================
     ACTION DEFINITIONS
  ======================================================== */

  const actions = {

    open: {
      label: "Open Applications",
      endpoint:
        `/elections/${electionId}/open`,
      success:
        "Election applications are now open.",
    },

    startVoting: {
      label: "Start Voting",
      endpoint:
        `/elections/${electionId}/start-voting`,
      success:
        "Voting has been opened for this election.",
    },

    prepareVoting: {
      label: "Prepare & Start Voting",
      endpoint:
        `/elections/${electionId}/prepare-for-voting`,
      success:
        "The election is ready and voting has been opened.",
    },

    close: {
      label: "Close Election",
      endpoint:
        `/elections/${electionId}/close`,
      success:
        "The election has been closed.",
    },

    cancel: {
      label: "Cancel Election",
      endpoint:
        `/elections/${electionId}/cancel`,
      success:
        "The election has been cancelled.",
    },

  };


  /* ========================================================
     EXECUTE ACTION
  ======================================================== */

  const executeAction = async (
    actionKey
  ) => {

    const action =
      actions[actionKey];

    if (!action) {
      return;
    }

    try {

      setActionLoading(true);
      setActionError("");
      setSuccessMessage("");
      setConfirmAction(null);

      await api.post(
        action.endpoint
      );

      setSuccessMessage(
        action.success
      );

      await loadElection(false);

      if (
        getElectionType(election) === "elective"
      ) {
        await loadElectionSetup();
      }

    } catch (err) {

      console.error(
        `Election ${actionKey} failed:`,
        err
      );

      setActionError(
        getErrorMessage(err)
      );

    } finally {

      setActionLoading(false);

    }
  };


  /* ========================================================
     REQUEST ACTION
  ======================================================== */

  const requestAction = (
    actionKey
  ) => {

    const action =
      actions[actionKey];

    if (!action) {
      return;
    }

    setActionError("");
    setSuccessMessage("");

    setConfirmAction({
      key: actionKey,
      title: action.label,
    });

  };


  /* ========================================================
     SELECT EXISTING MEMBER
  ======================================================== */

  const handleSelectMember = (
    member
  ) => {

    setSelectedMember(member);

    setAspirantName(
      getMemberName(member)
    );

    setAspirantPhoto(
      member?.photo ||
      member?.profilePhoto ||
      ""
    );

    setMemberSearch(
      getMemberName(member)
    );

    setMemberResults([]);

    setAddAspirantError("");

  };


  /* ========================================================
     RESET ASPIRANT FORM
  ======================================================== */

  const resetAspirantForm = () => {

    setMemberSearch("");
    setMemberResults([]);
    setSelectedMember(null);
    setSelectedPosition("");
    setAspirantName("");
    setAspirantPhoto("");
    setAspirantManifesto("");
    setAddAspirantError("");
    setAddAspirantLoading(false);

  };


  /* ========================================================
     CLOSE ASPIRANT FORM
  ======================================================== */

  const closeAspirantForm = () => {

    if (addAspirantLoading) {
      return;
    }

    setShowAddAspirant(false);

    resetAspirantForm();

  };


  /* ========================================================
     ADD EXISTING ASPIRANT
  ======================================================== */

  const handleAddExistingAspirant =
    async (event) => {

      event.preventDefault();

      if (!selectedMember) {

        setAddAspirantError(
          "Please search for and select a JVP member."
        );

        return;
      }

      if (!selectedPosition) {

        setAddAspirantError(
          "Please select the position this aspirant will contest."
        );

        return;
      }

      try {

        setAddAspirantLoading(true);
        setAddAspirantError("");
        setActionError("");
        setSuccessMessage("");

        const response =
          await api.post(
            `/elections/${electionId}/existing-aspirants`,
            {
              memberId:
                getMemberId(
                  selectedMember
                ),
              positionId:
                selectedPosition,
              name:
                aspirantName.trim() ||
                getMemberName(
                  selectedMember
                ),
              photo:
                aspirantPhoto.trim(),
              manifesto:
                aspirantManifesto.trim(),
            }
          );

        const message =
          response?.data?.message ||
          "Existing aspirant added successfully.";

        setSuccessMessage(message);

        closeAspirantForm();

        await loadElection(false);
        await loadElectionSetup();

      } catch (err) {

        console.error(
          "Failed to add existing aspirant:",
          err
        );

        setAddAspirantError(
          getErrorMessage(err)
        );

      } finally {

        setAddAspirantLoading(false);

      }
    };


  /* ========================================================
     REMOVE EXISTING ASPIRANT
  ======================================================== */

  const handleRemoveExistingAspirant =
    async (
      aspirantId
    ) => {

      if (!aspirantId) {
        return;
      }

      const confirmed =
        window.confirm(
          "Remove this existing aspirant from the active ballot?"
        );

      if (!confirmed) {
        return;
      }

      try {

        setActionLoading(true);
        setActionError("");
        setSuccessMessage("");

        const response =
          await api.delete(
            `/elections/${electionId}/existing-aspirants/${aspirantId}`
          );

        setSuccessMessage(
          response?.data?.message ||
          "Existing aspirant removed from the active ballot."
        );

        await loadElection(false);
        await loadElectionSetup();

      } catch (err) {

        console.error(
          "Failed to remove existing aspirant:",
          err
        );

        setActionError(
          getErrorMessage(err)
        );

      } finally {

        setActionLoading(false);

      }
    };


  /* ========================================================
     ACTION BUTTONS
  ======================================================== */

  const renderLifecycleActions =
    () => {

      if (!election) {
        return null;
      }

      if (
        status === "cancelled" ||
        status === "results"
      ) {
        return null;
      }

      if (status === "draft") {

        return (
          <>
            <button
              type="button"
              className="election-action primary"
              onClick={() =>
                requestAction("open")
              }
              disabled={actionLoading}
            >
              <FaPowerOff />
              <span>
                Open Applications
              </span>
            </button>

            <button
              type="button"
              className="election-action danger"
              onClick={() =>
                requestAction("cancel")
              }
              disabled={actionLoading}
            >
              <FaTimes />
              <span>
                Cancel Election
              </span>
            </button>
          </>
        );
      }

      if (status === "open") {

        if (
          getElectionType(election) ===
          "nomination"
        ) {

          return (
            <>
              <button
                type="button"
                className="election-action warning"
                onClick={() =>
                  requestAction("close")
                }
                disabled={actionLoading}
              >
                <FaStop />
                <span>
                  Close Applications
                </span>
              </button>

              <button
                type="button"
                className="election-action danger"
                onClick={() =>
                  requestAction("cancel")
                }
                disabled={actionLoading}
              >
                <FaTimes />
                <span>
                  Cancel Exercise
                </span>
              </button>
            </>
          );
        }

        return (
          <>
            <button
              type="button"
              className="election-action primary"
              onClick={() =>
                requestAction(
                  "prepareVoting"
                )
              }
              disabled={
                actionLoading ||
                setupLoading ||
                !setupReady
              }
              title={
                !setupReady
                  ? "Complete the election setup before starting voting."
                  : "Prepare the election and open voting."
              }
            >
              <FaPlay />
              <span>
                Prepare & Start Voting
              </span>
            </button>

            <button
              type="button"
              className="election-action danger"
              onClick={() =>
                requestAction("cancel")
              }
              disabled={actionLoading}
            >
              <FaTimes />
              <span>
                Cancel Election
              </span>
            </button>
          </>
        );
      }

      if (status === "voting") {

        return (
          <>
            <button
              type="button"
              className="election-action warning"
              onClick={() =>
                requestAction("close")
              }
              disabled={actionLoading}
            >
              <FaStop />
              <span>
                Close Election
              </span>
            </button>

            <button
              type="button"
              className="election-action danger"
              onClick={() =>
                requestAction("cancel")
              }
              disabled={actionLoading}
            >
              <FaTimes />
              <span>
                Cancel Election
              </span>
            </button>
          </>
        );
      }

      if (status === "closed") {

        if (
          getElectionType(election) ===
          "nomination"
        ) {

          return (
            <button
              type="button"
              className="election-action primary"
              onClick={() =>
                navigate(
                  `/admin/elections/${electionId}/applications?electionId=${electionId}`
                )
              }
            >
              <FaUserCheck />
              <span>
                Manage Appointments
              </span>
            </button>
          );
        }

        return (
          <button
            type="button"
            className="election-action primary"
            onClick={() =>
              navigate(
                `/admin/elections/${electionId}/results`
              )
            }
          >
            <FaPoll />
            <span>
              Manage Results
            </span>
          </button>
        );
      }

      return null;
    };


  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {

    return (
      <div className="admin-election-details">

        <div className="election-loading">

          <div className="loading-spinner" />

          <h3>
            Loading Election
          </h3>

          <p>
            Please wait while we retrieve
            the election information.
          </p>

        </div>

      </div>
    );
  }


  /* ========================================================
     ERROR
  ======================================================== */

  if (error || !election) {

    return (
      <div className="admin-election-details">

        <div className="page-topbar">

          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate("/admin/elections")
            }
          >
            <FaArrowLeft />
            <span>
              Back to Elections
            </span>
          </button>

        </div>

        <div className="election-error-card">

          <div className="error-icon">
            <FaExclamationCircle />
          </div>

          <h2>
            Unable to Load Election
          </h2>

          <p>
            {error ||
              "The requested election could not be found."}
          </p>

          <div className="error-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate("/admin/elections")
              }
            >
              <FaArrowLeft />
              Back to Elections
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={loadElection}
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
    <div className="admin-election-details">


      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="page-topbar">

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/admin/elections")
          }
        >
          <FaArrowLeft />

          <span>
            Back to Elections
          </span>
        </button>

      </div>


      <div className="election-page-header">

        <div className="header-main">

          <div className="header-icon">
            <FaVoteYea />
          </div>

          <div>

            <div className="header-kicker">
              Election Management
            </div>

            <h1>
              {election.name}
            </h1>

            <p>
              Manage the election exercise, positions,
              applications, vetting, appointments,
              voting and results.
            </p>

          </div>

        </div>


        <div className="header-actions">

          {status !== "cancelled" &&
            status !== "results" && (
              <button
                type="button"
                className="edit-button"
                onClick={() =>
                  navigate(
                    `/admin/elections/${electionId}/edit`
                  )
                }
              >
                <FaEdit />
                Edit Election
              </button>
            )}

        </div>

      </div>


      {/* ==================================================
          ALERTS
      ================================================== */}

      {successMessage && (

        <div className="alert success-alert">

          <FaCheckCircle />

          <span>
            {successMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
            aria-label="Dismiss success message"
          >
            <FaTimes />
          </button>

        </div>

      )}


      {actionError && (

        <div className="alert error-alert">

          <FaExclamationCircle />

          <span>
            {actionError}
          </span>

          <button
            type="button"
            onClick={() =>
              setActionError("")
            }
            aria-label="Dismiss error message"
          >
            <FaTimes />
          </button>

        </div>

      )}


      {/* ==================================================
          STATUS / SUMMARY
      ================================================== */}

      <div className="summary-grid">


        <div className="summary-card status-card">

          <div
            className={`summary-icon ${statusInfo.className}`}
          >
            <StatusIcon />
          </div>

          <div>

            <span className="summary-label">
              Current Status
            </span>

            <strong
              className={`status-text ${statusInfo.className}`}
            >
              {getStatusLabel(status)}
            </strong>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon type-icon">
            {getElectionType(election) ===
            "nomination" ? (
              <FaUserCheck />
            ) : (
              <FaVoteYea />
            )}
          </div>

          <div>

            <span className="summary-label">
              Exercise Type
            </span>

            <strong>
              {getTypeLabel(election)}
            </strong>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon scope-icon">
            <FaMapMarkerAlt />
          </div>

          <div>

            <span className="summary-label">
              Election Scope
            </span>

            <strong>
              {getScopeLabel(election)}
            </strong>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon positions-icon">
            <FaPoll />
          </div>

          <div>

            <span className="summary-label">
              Positions
            </span>

            <strong>
              {positions.length}
            </strong>

          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon date-icon">
            <FaCalendarAlt />
          </div>

          <div>

            <span className="summary-label">
              {getElectionType(election) ===
              "nomination"
                ? "Application Period"
                : "Voting Period"}
            </span>

            <strong>
              {getElectionType(election) ===
              "nomination"
                ? formatDate(
                    election.applicationStart
                  )
                : formatDate(
                    election.votingStart
                  )}
            </strong>

          </div>

        </div>

      </div>


      {/* ==================================================
          ELECTION WORKSPACE
      ================================================== */}

      <section className="management-card election-workspace-card">

        <div className="card-heading">

          <div>

            <span className="section-eyebrow">
              Election Workspace
            </span>

            <h2>
              {getElectionType(election) ===
              "nomination"
                ? "Applications & Appointments"
                : "Applications, Aspirants & Results"}
            </h2>

            <p>
              {getElectionType(election) ===
              "nomination"
                ? "Review, vet and approve applicants. Approved applicants are appointed to office."
                : "Review applications, manage approved aspirants and monitor election results."}
            </p>

          </div>

        </div>


        <div className="election-workspace-grid">

          <button
            type="button"
            className="workspace-action-card"
            onClick={() =>
              navigate(
                `/admin/elections/${electionId}/applications?electionId=${electionId}`
              )
            }
          >
            <span className="workspace-action-icon">
              <FaFileAlt />
            </span>

            <span className="workspace-action-content">
              <strong>
                Applications
              </strong>

              <small>
                Review, vet, approve or reject applicants
              </small>
            </span>

            <FaArrowRight />
          </button>


          {getElectionType(election) ===
          "elective" ? (
            <>
              <button
                type="button"
                className="workspace-action-card"
                onClick={() =>
                  navigate(
                    `/admin/elections/${electionId}/aspirants?electionId=${electionId}`
                  )
                }
              >
                <span className="workspace-action-icon">
                  <FaUsers />
                </span>

                <span className="workspace-action-content">
                  <strong>
                    Aspirants
                  </strong>

                  <small>
                    View approved and existing candidates
                  </small>
                </span>

                <FaArrowRight />
              </button>


              <button
                type="button"
                className="workspace-action-card"
                onClick={() =>
                  navigate(
                    `/admin/elections/${electionId}/results`
                  )
                }
              >
                <span className="workspace-action-icon">
                  <FaPoll />
                </span>

                <span className="workspace-action-content">
                  <strong>
                    Results
                  </strong>

                  <small>
                    Review and publish election results
                  </small>
                </span>

                <FaArrowRight />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="workspace-action-card workspace-action-card--nomination"
              onClick={() =>
                navigate(
                  `/admin/elections/${electionId}/applications?electionId=${electionId}`
                )
              }
            >
              <span className="workspace-action-icon">
                <FaUserCheck />
              </span>

              <span className="workspace-action-content">
                <strong>
                  Appointments
                </strong>

                <small>
                  Approve vetted applicants and effect appointments
                </small>
              </span>

              <FaArrowRight />
            </button>
          )}

        </div>

      </section>


      {/* ==================================================
          EXISTING ASPIRANTS / ELECTION SETUP
      ================================================== */}

      {getElectionType(election) ===
        "elective" && (
        <section className="management-card election-setup-card">

          <div className="card-heading">

            <div>

              <span className="section-eyebrow">
                Ballot Preparation
              </span>

              <h2>
                Election Setup & Aspirants
              </h2>

              <p>
                Add existing JVP members who are already
                candidates, review ballot readiness and
                prepare the election for voting.
              </p>

            </div>


            {status !== "voting" &&
              status !== "closed" &&
              status !== "results" &&
              status !== "cancelled" && (

              <button
                type="button"
                className="add-position-button"
                onClick={() =>
                  setShowAddAspirant(true)
                }
                disabled={actionLoading}
              >
                <FaUserPlus />
                Add Existing Aspirant
              </button>

            )}

          </div>


          {/* ==============================================
              SETUP STATUS
          ============================================== */}

          {setupLoading ? (

            <div className="election-setup-loading">

              <span className="small-spinner" />

              <span>
                Loading election readiness...
              </span>

            </div>

          ) : setupError ? (

            <div className="setup-error">

              <FaExclamationCircle />

              <span>
                {setupError}
              </span>

              <button
                type="button"
                onClick={loadElectionSetup}
              >
                Retry
              </button>

            </div>

          ) : setup ? (

            <>

              <div
                className={`election-readiness ${
                  setupReady
                    ? "ready"
                    : "not-ready"
                }`}
              >

                <div className="readiness-icon">

                  {setupReady ? (
                    <FaCheckCircle />
                  ) : (
                    <FaExclamationCircle />
                  )}

                </div>


                <div className="readiness-content">

                  <strong>
                    {setupReady
                      ? "Election Ready for Voting"
                      : "Election Not Ready for Voting"}
                  </strong>

                  <span>
                    {setupReady
                      ? "Every configured ballot position has at least one active aspirant."
                      : setup?.reason ||
                        "Complete the ballot setup before opening voting."}
                  </span>

                </div>


                <div className="readiness-counts">

                  <div>
                    <strong>
                      {activeAspirants.length}
                    </strong>

                    <span>
                      Active Aspirants
                    </span>
                  </div>

                  <div>
                    <strong>
                      {positions.length}
                    </strong>

                    <span>
                      Positions
                    </span>
                  </div>

                  <div>
                    <strong>
                      {positionsWithoutAspirants.length}
                    </strong>

                    <span>
                      Empty Positions
                    </span>
                  </div>

                </div>

              </div>


              {/* ==========================================
                  POSITIONS READINESS
              ========================================== */}

              {setupPositions.length > 0 && (

                <div className="setup-position-list">

                  {setupPositions.map(
                    (item, index) => {

                      const position =
                        item?.position ||
                        {};

                      const positionId =
                        getPositionId(
                          position
                        ) ||
                        index;

                      const aspirants =
                        Array.isArray(
                          item?.aspirants
                        )
                          ? item.aspirants
                          : [];

                      const count =
                        item?.aspirantCount ??
                        aspirants.length;

                      const ready =
                        item?.ready === true ||
                        count > 0;

                      return (
                        <div
                          className={`setup-position-row ${
                            ready
                              ? "is-ready"
                              : "is-empty"
                          }`}
                          key={positionId}
                        >

                          <div className="setup-position-status">

                            {ready ? (
                              <FaCheckCircle />
                            ) : (
                              <FaExclamationCircle />
                            )}

                          </div>


                          <div className="setup-position-details">

                            <strong>
                              {getPositionName(
                                position,
                                `Position ${index + 1}`
                              )}
                            </strong>

                            <span>
                              {count === 0
                                ? "No active aspirants"
                                : `${count} active aspirant${
                                    count === 1
                                      ? ""
                                      : "s"
                                  }`}
                            </span>

                          </div>


                          <div className="setup-position-aspirants">

                            {aspirants.length > 0 ? (
                              aspirants.map(
                                (aspirant) => {

                                  const aspirantId =
                                    aspirant?._id ||
                                    aspirant?.id;

                                  const member =
                                    aspirant?.member;

                                  const name =
                                    aspirant?.name ||
                                    getMemberName(
                                      member
                                    ) ||
                                    "Unnamed Aspirant";

                                  return (
                                    <div
                                      className="setup-aspirant"
                                      key={
                                        aspirantId ||
                                        `${name}-${positionId}`
                                      }
                                    >

                                      <div className="setup-aspirant-avatar">

                                        {aspirant?.photo ? (
                                          <img
                                            src={
                                              aspirant.photo
                                            }
                                            alt={name}
                                          />
                                        ) : (
                                          <FaUserCheck />
                                        )}

                                      </div>


                                      <div className="setup-aspirant-info">

                                        <strong>
                                          {name}
                                        </strong>

                                        <small>
                                          {aspirant?.source ===
                                          "legacy"
                                            ? "Existing aspirant"
                                            : "Approved application"}
                                        </small>

                                      </div>


                                      {aspirant?.source ===
                                        "legacy" &&
                                        status !==
                                          "voting" &&
                                        status !==
                                          "closed" && (

                                        <button
                                          type="button"
                                          className="setup-remove-button"
                                          onClick={() =>
                                            handleRemoveExistingAspirant(
                                              aspirantId
                                            )
                                          }
                                          disabled={
                                            actionLoading
                                          }
                                          title="Remove aspirant"
                                          aria-label={`Remove ${name}`}
                                        >
                                          <FaTrash />
                                        </button>

                                      )}

                                    </div>
                                  );
                                }
                              )
                            ) : (
                              <span className="no-aspirants">
                                Add an aspirant to this position.
                              </span>
                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              )}


              {/* ==========================================
                  LEGACY ASPIRANT SUMMARY
              ========================================== */}

              {legacyAspirants.length > 0 && (

                <div className="legacy-summary">

                  <div className="legacy-summary-icon">
                    <FaUserPlus />
                  </div>

                  <div>

                    <strong>
                      {legacyAspirants.length} existing
                      aspirant
                      {legacyAspirants.length === 1
                        ? ""
                        : "s"} added manually
                    </strong>

                    <span>
                      These candidates were added directly
                      to the election and do not require an
                      ElectionApplication record.
                    </span>

                  </div>

                </div>

              )}

            </>

          ) : null}


          {/* ==============================================
              PREPARE VOTING ACTION
          ============================================== */}

          {status === "open" && (
            <div className="setup-action-bar">

              <div>

                <strong>
                  Ready to open the ballot?
                </strong>

                <span>
                  {setupReady
                    ? "All configured positions have active aspirants."
                    : "Add or approve aspirants for every configured position before starting voting."}
                </span>

              </div>

              <button
                type="button"
                className="election-action primary"
                onClick={() =>
                  requestAction(
                    "prepareVoting"
                  )
                }
                disabled={
                  actionLoading ||
                  setupLoading ||
                  !setupReady
                }
              >
                <FaPlay />
                Prepare & Start Voting
              </button>

            </div>
          )}

        </section>
      )}


      {/* ==================================================
          ADD EXISTING ASPIRANT FORM
      ================================================== */}

      {showAddAspirant && (

        <section className="management-card existing-aspirant-form-card">

          <div className="card-heading">

            <div>

              <span className="section-eyebrow">
                Existing Candidate
              </span>

              <h2>
                Add Existing Aspirant
              </h2>

              <p>
                Select an active JVP member and place
                them directly on the ballot without
                creating a new application.
              </p>

            </div>


            <button
              type="button"
              className="modal-close"
              onClick={closeAspirantForm}
              disabled={addAspirantLoading}
              aria-label="Close add aspirant form"
            >
              <FaTimes />
            </button>

          </div>


          {addAspirantError && (

            <div className="alert error-alert">

              <FaExclamationCircle />

              <span>
                {addAspirantError}
              </span>

              <button
                type="button"
                onClick={() =>
                  setAddAspirantError("")
                }
                aria-label="Dismiss error"
              >
                <FaTimes />
              </button>

            </div>

          )}


          <form
            className="existing-aspirant-form"
            onSubmit={
              handleAddExistingAspirant
            }
          >

            {/* ==========================================
                MEMBER SEARCH
            ========================================== */}

            <div className="form-group">

              <label htmlFor="member-search">
                Search JVP Member
              </label>

              <div className="member-search-wrapper">

                <FaSearch />

                <input
                  id="member-search"
                  type="text"
                  value={memberSearch}
                  onChange={(event) => {

                    setMemberSearch(
                      event.target.value
                    );

                    {memberSearchError && (
  <div className="member-search-error">
    <FaExclamationCircle />

    <span>
      {memberSearchError}
    </span>
  </div>
)}

                    if (
                      selectedMember &&
                      event.target.value !==
                        getMemberName(
                          selectedMember
                        )
                    ) {
                      setSelectedMember(
                        null
                      );
                    }

                  }}
                  placeholder="Search by name, email, phone or member number..."
                  autoComplete="off"
                  disabled={
                    addAspirantLoading
                  }
                />

                {memberSearchLoading && (
                  <span className="small-spinner" />
                )}

              </div>


              {memberResults.length > 0 && (

                <div className="member-search-results">

                  {memberResults.map(
                    (member) => {

                      const memberId =
                        getMemberId(
                          member
                        );

                      const name =
                        getMemberName(
                          member
                        );

                      return (
                        <button
                          type="button"
                          className="member-search-result"
                          key={memberId || name}
                          onClick={() =>
                            handleSelectMember(
                              member
                            )
                          }
                        >

                          <div className="member-result-avatar">

                            {member?.photo ||
                            member?.profilePhoto ? (
                              <img
                                src={
                                  member.photo ||
                                  member.profilePhoto
                                }
                                alt={name}
                              />
                            ) : (
                              <FaUsers />
                            )}

                          </div>


                          <div className="member-result-info">

                            <strong>
                              {name}
                            </strong>

                            <small>
                              {member?.memberNumber ||
                                member?.email ||
                                member?.phone ||
                                "JVP Member"}
                            </small>

                          </div>

                          <FaArrowRight />

                        </button>
                      );
                    }
                  )}

                </div>

              )}


              {!memberSearchLoading &&
                memberSearch.trim().length >= 2 &&
                memberResults.length === 0 &&
                !selectedMember && (

                <small className="form-help">
                  No active JVP members were found.
                </small>

              )}

            </div>


            {/* ==========================================
                SELECTED MEMBER
            ========================================== */}

            {selectedMember && (

              <div className="selected-member-card">

                <div className="selected-member-avatar">

                  {selectedMember?.photo ||
                  selectedMember?.profilePhoto ? (
                    <img
                      src={
                        selectedMember.photo ||
                        selectedMember.profilePhoto
                      }
                      alt={getMemberName(
                        selectedMember
                      )}
                    />
                  ) : (
                    <FaUserCheck />
                  )}

                </div>


                <div>

                  <span>
                    Selected Member
                  </span>

                  <strong>
                    {getMemberName(
                      selectedMember
                    )}
                  </strong>

                  <small>
                    {selectedMember?.memberNumber ||
                      selectedMember?.email ||
                      selectedMember?.phone ||
                      "Active JVP Member"}
                  </small>

                </div>


                <button
                  type="button"
                  onClick={() => {

                    setSelectedMember(
                      null
                    );

                    setMemberSearch("");
                    setMemberResults([]);

                  }}
                  disabled={
                    addAspirantLoading
                  }
                  aria-label="Clear selected member"
                >
                  <FaTimes />
                </button>

              </div>

            )}


            {/* ==========================================
                POSITION
            ========================================== */}

            <div className="form-group">

              <label htmlFor="aspirant-position">
                Ballot Position
              </label>

              <select
                id="aspirant-position"
                value={selectedPosition}
                onChange={(event) =>
                  setSelectedPosition(
                    event.target.value
                  )
                }
                disabled={
                  addAspirantLoading
                }
                required
              >

                <option value="">
                  Select position
                </option>

                {positions.map(
                  (position, index) => {

                    const positionId =
                      getPositionId(
                        position
                      );

                    return (
                      <option
                        value={positionId}
                        key={
                          positionId ||
                          index
                        }
                      >
                        {getPositionName(
                          position,
                          `Position ${index + 1}`
                        )}
                      </option>
                    );
                  }
                )}

              </select>

            </div>


            {/* ==========================================
                NAME
            ========================================== */}

            <div className="form-group">

              <label htmlFor="aspirant-name">
                Ballot Name
              </label>

              <input
                id="aspirant-name"
                type="text"
                value={aspirantName}
                onChange={(event) =>
                  setAspirantName(
                    event.target.value
                  )
                }
                placeholder="Name as it should appear on the ballot"
                disabled={
                  addAspirantLoading
                }
                required
              />

            </div>


            {/* ==========================================
                PHOTO
            ========================================== */}

            <div className="form-group">

              <label htmlFor="aspirant-photo">
                Photo URL
              </label>

              <input
                id="aspirant-photo"
                type="text"
                value={aspirantPhoto}
                onChange={(event) =>
                  setAspirantPhoto(
                    event.target.value
                  )
                }
                placeholder="Optional photo URL"
                disabled={
                  addAspirantLoading
                }
              />

              <small className="form-help">
                Leave blank if the member's existing
                profile photo should be used.
              </small>

            </div>


            {/* ==========================================
                MANIFESTO
            ========================================== */}

            <div className="form-group">

              <label htmlFor="aspirant-manifesto">
                Manifesto / Candidate Statement
              </label>

              <textarea
                id="aspirant-manifesto"
                value={aspirantManifesto}
                onChange={(event) =>
                  setAspirantManifesto(
                    event.target.value
                  )
                }
                placeholder="Optional candidate manifesto or statement..."
                rows={5}
                disabled={
                  addAspirantLoading
                }
              />

            </div>


            {/* ==========================================
                FORM ACTIONS
            ========================================== */}

            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  closeAspirantForm
                }
                disabled={
                  addAspirantLoading
                }
              >
                <FaTimes />
                Cancel
              </button>


              <button
                type="submit"
                className="primary-button"
                disabled={
                  addAspirantLoading ||
                  !selectedMember ||
                  !selectedPosition
                }
              >

                {addAspirantLoading ? (
                  <>
                    <span className="small-spinner" />
                    Adding Aspirant...
                  </>
                ) : (
                  <>
                    <FaUserPlus />
                    Add to Ballot
                  </>
                )}

              </button>

            </div>

          </form>

        </section>

      )}


      {/* ==================================================
          LIFECYCLE ACTIONS
      ================================================== */}

      {status !== "results" &&
        status !== "cancelled" && (

        <section className="management-card">

          <div className="card-heading">

            <div>

              <span className="section-eyebrow">
                Election Controls
              </span>

              <h2>
                Manage Election
              </h2>

              <p>
                Control the current stage of
                the election lifecycle.
              </p>

            </div>

            {actionLoading && (
              <div className="action-processing">
                <span className="small-spinner" />
                Processing...
              </div>
            )}

          </div>


          <div className="lifecycle-actions">

            {renderLifecycleActions()}

          </div>

        </section>
      )}


      {/* ==================================================
          MAIN GRID
      ================================================== */}

      <div className="details-grid">


        {/* ==================================================
            LEFT COLUMN
        ================================================== */}

        <div className="details-main">


          {/* ================================================
              OVERVIEW
          ================================================= */}

          <section className="content-card">

            <div className="card-heading">

              <div>

                <span className="section-eyebrow">
                  Overview
                </span>

                <h2>
                  Election Information
                </h2>

              </div>

              <FaInfoCircle className="heading-icon" />

            </div>


            {election.description ? (

              <div className="description-box">
                {election.description}
              </div>

            ) : (

              <div className="empty-description">
                No election description has
                been provided.
              </div>

            )}


            <div className="information-grid">

              <div className="info-item">

                <span>
                  Election Name
                </span>

                <strong>
                  {election.name}
                </strong>

              </div>


              <div className="info-item">

                <span>
                  Scope
                </span>

                <strong>
                  {getScopeLabel(
                    election
                  )}
                </strong>

              </div>


              <div className="info-item">

                <span>
                  Created
                </span>

                <strong>
                  {formatDateTime(
                    election.createdAt
                  )}
                </strong>

              </div>


              <div className="info-item">

                <span>
                  Last Updated
                </span>

                <strong>
                  {formatDateTime(
                    election.updatedAt
                  )}
                </strong>

              </div>

            </div>


            {locationParts.length > 0 && (

              <div className="location-section">

                <div className="location-heading">
                  <FaMapMarkerAlt />
                  <span>
                    Geographic Coverage
                  </span>
                </div>

                <div className="location-tags">

                  {locationParts.map(
                    (location, index) => (
                      <span
                        className="location-tag"
                        key={`${location}-${index}`}
                      >
                        {location}
                      </span>
                    )
                  )}

                </div>

              </div>

            )}

          </section>


          {/* ================================================
              TIMELINE
          ================================================= */}

          <section className="content-card">

            <div className="card-heading">

              <div>

                <span className="section-eyebrow">
                  Schedule
                </span>

                <h2>
                  Election Timeline
                </h2>

              </div>

              <FaClock className="heading-icon" />

            </div>


            <div className="timeline">

              <div className="timeline-item">

                <div className="timeline-marker">
                  <FaFileAlt />
                </div>

                <div className="timeline-content">

                  <span className="timeline-label">
                    Applications Open
                  </span>

                  <strong>
                    {formatDateTime(
                      election.applicationStart
                    )}
                  </strong>

                  <small>
                    Candidates may begin
                    submitting applications.
                  </small>

                </div>

              </div>


              <div className="timeline-line" />


              <div className="timeline-item">

                <div className="timeline-marker">
                  <FaTimes />
                </div>

                <div className="timeline-content">

                  <span className="timeline-label">
                    Applications Close
                  </span>

                  <strong>
                    {formatDateTime(
                      election.applicationEnd
                    )}
                  </strong>

                  <small>
                    Candidate applications
                    close at this time.
                  </small>

                </div>

              </div>


              <div className="timeline-line" />


              {getElectionType(
                election
              ) === "nomination" ? (

                <div className="timeline-item">

                  <div className="timeline-marker">
                    <FaUserCheck />
                  </div>

                  <div className="timeline-content">

                    <span className="timeline-label">
                      Vetting & Appointment
                    </span>

                    <strong>
                      After Application Review
                    </strong>

                    <small>
                      Vetted applicants who are approved
                      are appointed to office. No voting
                      stage is used.
                    </small>

                  </div>

                </div>

              ) : (

                <>

                  <div className="timeline-item">

                    <div className="timeline-marker">
                      <FaVoteYea />
                    </div>

                    <div className="timeline-content">

                      <span className="timeline-label">
                        Voting Opens
                      </span>

                      <strong>
                        {formatDateTime(
                          election.votingStart
                        )}
                      </strong>

                      <small>
                        Eligible members can cast
                        their votes.
                      </small>

                    </div>

                  </div>


                  <div className="timeline-line" />


                  <div className="timeline-item">

                    <div className="timeline-marker">
                      <FaStop />
                    </div>

                    <div className="timeline-content">

                      <span className="timeline-label">
                        Voting Closes
                      </span>

                      <strong>
                        {formatDateTime(
                          election.votingEnd
                        )}
                      </strong>

                      <small>
                        Voting ends and results
                        can be processed.
                      </small>

                    </div>

                  </div>

                </>

              )}

            </div>

          </section>


          {/* ================================================
              POSITIONS
          ================================================= */}

          <section className="content-card">

            <div className="card-heading">

              <div>

                <span className="section-eyebrow">
                  {getElectionType(
                    election
                  ) === "nomination"
                    ? "Appointments"
                    : "Ballot"}
                </span>

                <h2>
                  {getElectionType(
                    election
                  ) === "nomination"
                    ? "Appointment Positions"
                    : "Election Positions"}
                </h2>

                <p>
                  Positions configured for this{" "}
                  {getElectionType(
                    election
                  ) === "nomination"
                    ? "nomination exercise"
                    : "election"}.
                </p>

              </div>


              {status === "draft" && (

                <button
                  type="button"
                  className="add-position-button"
                  onClick={() =>
                    navigate(
                      `/admin/elections/${electionId}/edit`
                    )
                  }
                >
                  <FaPlus />
                  Add Position
                </button>

              )}

            </div>


            {positions.length > 0 ? (

              <div className="positions-list">

                {positions.map(
                  (position, index) => {

                    const positionId =
                      position?._id ||
                      position?.id ||
                      index;

                    return (
                      <div
                        className="position-row"
                        key={positionId}
                      >

                        <div className="position-number">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>


                        <div className="position-details">

                          <h3>
                            {position.name ||
                              position.title ||
                              `Position ${
                                index + 1
                              }`}
                          </h3>

                          {position.description && (
                            <p>
                              {position.description}
                            </p>
                          )}

                        </div>


                        <div className="position-arrow">
                          <FaArrowRight />
                        </div>

                      </div>
                    );

                  }
                )}

              </div>

            ) : (

              <div className="empty-state">

                <div className="empty-icon">
                  <FaPoll />
                </div>

                <h3>
                  No Positions Added
                </h3>

                <p>
                  This election does not have
                  any positions configured yet.
                </p>

                {status === "draft" && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      navigate(
                        `/admin/elections/${electionId}/edit`
                      )
                    }
                  >
                    <FaPlus />
                    Add First Position
                  </button>
                )}

              </div>

            )}

          </section>

        </div>


        {/* ==================================================
            RIGHT COLUMN
        ================================================== */}

        <aside className="details-sidebar">


          {/* ================================================
              MANAGEMENT MENU
          ================================================= */}

          <section className="sidebar-card">

            <div className="sidebar-card-heading">

              <FaVoteYea />

              <div>

                <span>
                  Election Workspace
                </span>

                <small>
                  Management tools
                </small>

              </div>

            </div>


            <div className="workspace-links">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/admin/elections/${electionId}/applications`
                  )
                }
              >
                <span className="workspace-link-icon">
                  <FaFileAlt />
                </span>

                <span className="workspace-link-content">

                  <strong>
                    Applications
                  </strong>

                  <small>
                    Review candidate applications
                  </small>

                </span>

                <FaArrowRight />

              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/admin/elections/${electionId}/aspirants`
                  )
                }
              >
                <span className="workspace-link-icon">
                  <FaUserCheck />
                </span>

                <span className="workspace-link-content">

                  <strong>
                    Aspirants
                  </strong>

                  <small>
                    Manage approved and existing candidates
                  </small>

                </span>

                <FaArrowRight />

              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/admin/elections/${electionId}/results`
                  )
                }
              >
                <span className="workspace-link-icon">
                  <FaPoll />
                </span>

                <span className="workspace-link-content">

                  <strong>
                    Results
                  </strong>

                  <small>
                    View and publish results
                  </small>

                </span>

                <FaArrowRight />

              </button>

            </div>

          </section>


          {/* ================================================
              STATUS CARD
          ================================================= */}

          <section className="sidebar-card">

            <div className="sidebar-section-title">
              Election Status
            </div>

            <div
              className={`large-status ${statusInfo.className}`}
            >

              <div className="large-status-icon">
                <StatusIcon />
              </div>

              <div>

                <strong>
                  {getStatusLabel(
                    status
                  )}
                </strong>

                <span>

                  {status === "draft" &&
                    "Election is being prepared."}

                  {status === "open" &&
                    "Applications are currently open."}

                  {status === "voting" &&
                    "Members can currently vote."}

                  {status === "closed" &&
                    "Voting has ended."}

                  {status === "results" &&
                    "Election results have been published."}

                  {status === "cancelled" &&
                    "This election has been cancelled."}

                </span>

              </div>

            </div>

          </section>


          {/* ================================================
              QUICK STATS
          ================================================= */}

          <section className="sidebar-card">

            <div className="sidebar-section-title">
              Election Summary
            </div>

            <div className="quick-stats">

              <div className="quick-stat">

                <div>
                  <FaPoll />
                </div>

                <span>
                  Positions
                </span>

                <strong>
                  {positions.length}
                </strong>

              </div>


              <div className="quick-stat">

                <div>
                  <FaUsers />
                </div>

                <span>
                  Applications
                </span>

                <strong>
                  {election.applicationCount ??
                    election.applicationsCount ??
                    "—"}
                </strong>

              </div>


              <div className="quick-stat">

                <div>
                  <FaUserCheck />
                </div>

                <span>
                  Aspirants
                </span>

                <strong>
                  {setup
                    ? activeAspirants.length
                    : election.aspirantCount ??
                      election.aspirantsCount ??
                      "—"}
                </strong>

              </div>

            </div>

          </section>


          {/* ================================================
              ELECTION READINESS SIDEBAR
          ================================================= */}

          {getElectionType(
            election
          ) === "elective" &&
            setup && (

            <section className="sidebar-card">

              <div className="sidebar-section-title">
                Voting Readiness
              </div>


              <div
                className={`sidebar-readiness ${
                  setupReady
                    ? "ready"
                    : "not-ready"
                }`}
              >

                {setupReady ? (
                  <FaCheckCircle />
                ) : (
                  <FaExclamationCircle />
                )}

                <div>

                  <strong>
                    {setupReady
                      ? "Ready"
                      : "Not Ready"}
                  </strong>

                  <span>
                    {setupReady
                      ? "All positions have candidates."
                      : `${positionsWithoutAspirants.length} position${
                          positionsWithoutAspirants.length ===
                          1
                            ? ""
                            : "s"
                        } need attention.`}
                  </span>

                </div>

              </div>


              {status === "open" && (
                <button
                  type="button"
                  className="sidebar-primary-action"
                  onClick={() =>
                    requestAction(
                      "prepareVoting"
                    )
                  }
                  disabled={
                    actionLoading ||
                    setupLoading ||
                    !setupReady
                  }
                >
                  <FaPlay />
                  Prepare & Start Voting
                </button>
              )}

            </section>

          )}


          {/* ================================================
              DANGER ZONE
          ================================================= */}

          {status !== "cancelled" &&
            status !== "results" && (

            <section className="danger-zone">

              <div className="danger-heading">

                <FaExclamationCircle />

                <span>
                  Election Control
                </span>

              </div>

              <p>
                Cancelling an election is a
                significant administrative action.
                Make sure this action is authorised
                before proceeding.
              </p>

              <button
                type="button"
                className="danger-outline-button"
                onClick={() =>
                  requestAction("cancel")
                }
                disabled={actionLoading}
              >
                <FaTrash />
                Cancel Election
              </button>

            </section>

          )}

        </aside>

      </div>


      {/* ==================================================
          CONFIRMATION MODAL
      ================================================== */}

      {confirmAction && (

        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setConfirmAction(null);
            }

          }}
        >

          <div
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
          >

            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setConfirmAction(null)
              }
              aria-label="Close confirmation dialog"
            >
              <FaTimes />
            </button>


            <div className="modal-icon">

              {confirmAction.key ===
              "cancel" ? (
                <FaExclamationCircle />
              ) : (
                <FaCheckCircle />
              )}

            </div>


            <h2 id="confirmation-title">
              {confirmAction.title}?
            </h2>


            <p>

              {confirmAction.key ===
                "open" &&
                "This will make the election available for candidate applications."}

              {confirmAction.key ===
                "startVoting" &&
                "This will open voting for eligible members. Make sure the approved aspirants and ballot positions are ready."}

              {confirmAction.key ===
                "prepareVoting" &&
                "The system will verify that every configured position has an active aspirant, prepare the ballot and open voting for eligible members."}

              {confirmAction.key ===
                "close" &&
                "This will stop voting for this election. Make sure you are ready to close the ballot."}

              {confirmAction.key ===
                "cancel" &&
                "This will cancel the election. This action should only be taken when properly authorised."}

            </p>


            <div className="modal-actions">

              <button
                type="button"
                className="modal-cancel-button"
                onClick={() =>
                  setConfirmAction(null)
                }
                disabled={actionLoading}
              >
                No, Go Back
              </button>


              <button
                type="button"
                className={`modal-confirm-button ${
                  confirmAction.key ===
                  "cancel"
                    ? "danger"
                    : ""
                }`}
                onClick={() =>
                  executeAction(
                    confirmAction.key
                  )
                }
                disabled={actionLoading}
              >

                {actionLoading ? (
                  <>
                    <span className="small-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Confirm
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default AdminElectionDetails;