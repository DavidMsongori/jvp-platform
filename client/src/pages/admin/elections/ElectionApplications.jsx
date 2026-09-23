import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaClock,
  FaEye,
  FaFilter,
  FaSearch,
  FaTimes,
  FaUser,
  FaUsers,
  FaVoteYea,
} from "react-icons/fa";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import api from "../../../services/api";

import "./ElectionApplications.css";


/* ==========================================================
   HELPERS
========================================================== */

const getResponseData = (response) => {
  return response?.data?.data ?? response?.data ?? null;
};


const getApplicationsFromResponse = (response) => {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.applications)) {
    return data.applications;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};


const getApplicationId = (application) => {
  return (
    application?._id ||
    application?.id ||
    application?.applicationId
  );
};


const getApplicant = (application) => {
  return (
    application?.applicant ||
    application?.member ||
    application?.user ||
    {}
  );
};


const getApplicantName = (application) => {
  const applicant = getApplicant(application);

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
    application?.applicantName ||
    application?.memberName ||
    "Unknown Applicant"
  );
};


const getApplicantEmail = (application) => {
  const applicant = getApplicant(application);

  return (
    applicant?.email ||
    application?.email ||
    ""
  );
};


const getApplicantPhone = (application) => {
  const applicant = getApplicant(application);

  return (
    applicant?.phone ||
    applicant?.phoneNumber ||
    application?.phone ||
    application?.phoneNumber ||
    ""
  );
};


const getPosition = (application) => {
  return (
    application?.position ||
    application?.positionDetails ||
    {}
  );
};


const getPositionName = (application) => {
  const position = getPosition(application);

  return (
    position?.name ||
    application?.positionName ||
    "Position Not Specified"
  );
};


const getPositionLevel = (application) => {
  const position = getPosition(application);

  return (
    position?.level ||
    application?.positionLevel ||
    ""
  );
};


const getPositionDescription = (application) => {
  const position = getPosition(application);

  return (
    position?.description ||
    application?.positionDescription ||
    ""
  );
};


const getPositionLocation = (application) => {
  const position = getPosition(application);

  const parts = [
    position?.ward || application?.positionWard,
    position?.constituency || application?.positionConstituency,
    position?.county || application?.positionCounty,
  ].filter(Boolean);

  return parts.join(" • ");
};


const getElection = (application) => {
  return (
    application?.election ||
    application?.electionDetails ||
    {}
  );
};


const getElectionName = (application) => {
  const election = getElection(application);

  return (
    election?.name ||
    application?.electionName ||
    "Election"
  );
};


const getElectionType = (application) => {
  const election = getElection(application);

  return (
    election?.type ||
    application?.electionType ||
    "elective"
  ).toLowerCase();
};


const isNomination = (application) => {
  return getElectionType(application) === "nomination";
};


const isElective = (application) => {
  return !isNomination(application);
};


const getStatus = (application) => {
  return (
    application?.status ||
    application?.reviewStatus ||
    "submitted"
  ).toLowerCase();
};


const formatStatus = (status) => {
  const labels = {
    submitted: "Submitted",
    review: "Under Review",
    vetted: "Vetted",
    approved: "Approved",
    appointed: "Appointed",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };

  return (
    labels[status] ||
    status
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
  if (!value) {
    return "—";
  }

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


/* ==========================================================
   WORKFLOW HELPERS
========================================================== */

const getNextWorkflowAction = (application) => {
  const status = getStatus(application);
  const nomination = isNomination(application);

  if (status === "submitted") {
    return {
      action: "review",
      label: "Start Review",
      title: "Start application review",
      icon: <FaEye />,
    };
  }

  if (status === "review") {
    return {
      action: "vetted",
      label: "Mark Vetted",
      title: "Mark application as vetted",
      icon: <FaCheck />,
    };
  }

  if (status === "vetted") {
    return {
      action: "approved",
      label: nomination
        ? "Approve & Appoint"
        : "Approve Application",
      title: nomination
        ? "Approve and appoint applicant"
        : "Approve application",
      icon: <FaCheck />,
    };
  }

  return null;
};


const canReject = (application) => {
  const status = getStatus(application);

  return (
    status === "submitted" ||
    status === "review" ||
    status === "vetted"
  );
};


const isTerminalStatus = (application) => {
  const status = getStatus(application);

  return (
    status === "approved" ||
    status === "appointed" ||
    status === "rejected" ||
    status === "withdrawn"
  );
};


/* ==========================================================
   STATUS BADGE
========================================================== */

function StatusBadge({ status }) {
  const normalizedStatus = (
    status || "submitted"
  ).toLowerCase();

  return (
    <span
      className={`application-status application-status-${normalizedStatus}`}
    >
      <span className="application-status-dot" />

      {formatStatus(normalizedStatus)}
    </span>
  );
}


/* ==========================================================
   REVIEW MODAL
========================================================== */

function ReviewModal({
  application,
  action,
  reviewNotes,
  setReviewNotes,
  submitting,
  onClose,
  onSubmit,
}) {
  if (!application) {
    return null;
  }

  const applicantName =
    getApplicantName(application);

  const nomination =
    isNomination(application);

  const actionLabels = {
    review: "Start Review",
    vetted: "Mark as Vetted",
    approved: nomination
      ? "Approve & Appoint"
      : "Approve Application",
    rejected: "Reject Application",
  };

  const actionDescriptions = {
    review:
      "This will move the application into the formal review stage.",
    vetted:
      "This confirms that the application has passed the vetting stage and is ready for the final decision.",
    approved: nomination
      ? "Approval will immediately appoint the applicant to this nominated position."
      : "Approval will qualify the applicant as an approved aspirant for this elective position.",
    rejected:
      "Rejecting this application will stop the applicant from progressing through this election exercise.",
  };

  const requiresReason =
    action === "rejected";

  return (
    <div
      className="application-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose();
        }
      }}
    >
      <div
        className="application-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-application-title"
      >
        <div className="application-modal-header">
          <div>
            <span className="application-modal-eyebrow">
              Application Workflow
            </span>

            <h2 id="review-application-title">
              {actionLabels[action] ||
                "Update Application"}
            </h2>
          </div>

          <button
            type="button"
            className="application-modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="application-modal-body">

          <div className="review-candidate-card">
            <div className="review-candidate-avatar">
              <FaUser />
            </div>

            <div>
              <strong>
                {applicantName}
              </strong>

              <span>
                {getPositionName(application)}
              </span>

              <small>
                {nomination
                  ? "Nomination Exercise"
                  : "Elective Exercise"}
              </small>
            </div>
          </div>


          <div className="review-warning review-warning-approval">
            <FaCheck />

            <p>
              {actionDescriptions[action]}
            </p>
          </div>


          <div className="application-form-group">
            <label htmlFor="reviewNotes">
              Review Notes

              <span className="optional-label">
                {requiresReason
                  ? "Required"
                  : "Optional"}
              </span>
            </label>

            <textarea
              id="reviewNotes"
              value={reviewNotes}
              onChange={(event) =>
                setReviewNotes(
                  event.target.value
                )
              }
              placeholder={
                requiresReason
                  ? "Provide the reason for rejecting this application..."
                  : "Add any notes regarding this workflow decision..."
              }
              rows={5}
              maxLength={2000}
            />

            <div className="textarea-counter">
              {reviewNotes.length}/2000
            </div>
          </div>
        </div>


        <div className="application-modal-footer">
          <button
            type="button"
            className="application-button application-button-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className={`application-button ${
              action === "rejected"
                ? "application-button-reject"
                : "application-button-approve"
            }`}
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="application-spinner" />
                Processing...
              </>
            ) : (
              <>
                {action === "rejected"
                  ? <FaTimes />
                  : <FaCheck />}

                {actionLabels[action] ||
                  "Confirm"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ==========================================================
   APPLICATION DETAILS DRAWER
========================================================== */

function ApplicationDetails({
  application,
  onClose,
  onReview,
}) {
  if (!application) {
    return null;
  }

  const applicant =
    getApplicant(application);

  const status =
    getStatus(application);

  const nomination =
    isNomination(application);

  const applicationDate =
    application?.submittedAt ||
    application?.createdAt ||
    application?.applicationDate;

  const reviewDate =
    application?.reviewedAt ||
    application?.updatedAt;

  const reviewNotes =
    application?.reviewNotes ||
    application?.notes ||
    "";

  const nextAction =
    getNextWorkflowAction(application);

  return (
    <div
      className="application-drawer-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <aside
        className="application-drawer"
        aria-label="Application details"
      >

        <div className="application-drawer-header">
          <div>
            <span className="application-modal-eyebrow">
              Application Details
            </span>

            <h2>
              Review Application
            </h2>
          </div>

          <button
            type="button"
            className="application-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>


        <div className="application-drawer-content">

          {/* PROFILE */}

          <div className="drawer-profile">
            <div className="drawer-profile-avatar">
              <FaUser />
            </div>

            <div>
              <h3>
                {getApplicantName(application)}
              </h3>

              <p>
                {getApplicantEmail(application) ||
                  "No email provided"}
              </p>

              <StatusBadge status={status} />
            </div>
          </div>


          {/* ELECTION */}

          <section className="drawer-section">
            <div className="drawer-section-title">
              <FaVoteYea />

              <h3>
                Election Information
              </h3>
            </div>

            <div className="drawer-info-grid">

              <div className="drawer-info-item">
                <span>Election</span>

                <strong>
                  {getElectionName(application)}
                </strong>
              </div>


              <div className="drawer-info-item">
                <span>Exercise Type</span>

                <strong>
                  {nomination
                    ? "Nomination"
                    : "Elective"}
                </strong>
              </div>


              <div className="drawer-info-item">
                <span>Position</span>

                <strong>
                  {getPositionName(application)}
                </strong>
              </div>


              {getPositionLevel(application) && (
                <div className="drawer-info-item">
                  <span>Level</span>

                  <strong>
                    {getPositionLevel(application)}
                  </strong>
                </div>
              )}


              {getPositionLocation(application) && (
                <div className="drawer-info-item">
                  <span>Location</span>

                  <strong>
                    {getPositionLocation(application)}
                  </strong>
                </div>
              )}
            </div>
          </section>


          {/* APPLICANT */}

          <section className="drawer-section">
            <div className="drawer-section-title">
              <FaUser />

              <h3>
                Applicant Information
              </h3>
            </div>

            <div className="drawer-info-grid">

              <div className="drawer-info-item">
                <span>Full Name</span>

                <strong>
                  {getApplicantName(application)}
                </strong>
              </div>


              <div className="drawer-info-item">
                <span>Email</span>

                <strong>
                  {getApplicantEmail(application) ||
                    "—"}
                </strong>
              </div>


              <div className="drawer-info-item">
                <span>Phone</span>

                <strong>
                  {getApplicantPhone(application) ||
                    "—"}
                </strong>
              </div>


              <div className="drawer-info-item">
                <span>Application ID</span>

                <strong className="drawer-id">
                  {getApplicationId(application) ||
                    "—"}
                </strong>
              </div>

            </div>
          </section>


          {/* POSITION DESCRIPTION */}

          {getPositionDescription(application) && (
            <section className="drawer-section">
              <div className="drawer-section-title">
                <FaFilter />

                <h3>
                  Position Description
                </h3>
              </div>

              <div className="drawer-notes">
                {getPositionDescription(application)}
              </div>
            </section>
          )}


          {/* TIMELINE */}

          <section className="drawer-section">
            <div className="drawer-section-title">
              <FaClock />

              <h3>
                Application Timeline
              </h3>
            </div>

            <div className="drawer-timeline">

              <div className="drawer-timeline-item">
                <span className="timeline-dot" />

                <div>
                  <span>
                    Submitted
                  </span>

                  <strong>
                    {formatDateTime(
                      applicationDate
                    )}
                  </strong>
                </div>
              </div>


              {status !== "submitted" && (
                <div className="drawer-timeline-item">
                  <span className="timeline-dot" />

                  <div>
                    <span>
                      Review Activity
                    </span>

                    <strong>
                      {formatDateTime(
                        reviewDate
                      )}
                    </strong>
                  </div>
                </div>
              )}


              {(status === "approved" ||
                status === "appointed") && (
                <div className="drawer-timeline-item">
                  <span className="timeline-dot" />

                  <div>
                    <span>
                      {status === "appointed"
                        ? "Appointed"
                        : "Approved"}
                    </span>

                    <strong>
                      {formatDateTime(
                        application?.approvedAt ||
                        application?.appointedAt ||
                        application?.updatedAt
                      )}
                    </strong>
                  </div>
                </div>
              )}

            </div>
          </section>


          {/* NOTES */}

          {reviewNotes && (
            <section className="drawer-section">
              <div className="drawer-section-title">
                <FaFilter />

                <h3>
                  Review Notes
                </h3>
              </div>

              <div className="drawer-notes">
                {reviewNotes}
              </div>
            </section>
          )}

        </div>


        {/* WORKFLOW FOOTER */}

        {(nextAction || canReject(application)) && (
          <div className="application-drawer-footer">

            {canReject(application) && (
              <button
                type="button"
                className="application-button application-button-reject"
                onClick={() =>
                  onReview(
                    application,
                    "rejected"
                  )
                }
              >
                <FaTimes />

                Reject
              </button>
            )}


            {nextAction && (
              <button
                type="button"
                className="application-button application-button-approve"
                onClick={() =>
                  onReview(
                    application,
                    nextAction.action
                  )
                }
              >
                {nextAction.icon}

                {nextAction.label}
              </button>
            )}

          </div>
        )}

      </aside>
    </div>
  );
}


/* ==========================================================
   MAIN PAGE
========================================================== */

function ElectionApplications() {
  const navigate = useNavigate();

  const { electionId: routeElectionId } =
    useParams();

  const [searchParams] =
    useSearchParams();

  const queryElectionId =
    searchParams.get("electionId");

  const queryApplicationId =
    searchParams.get("applicationId");

  const electionId =
    routeElectionId ||
    queryElectionId ||
    null;


  const [applications, setApplications] =
    useState([]);

  const [elections, setElections] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [electionFilter, setElectionFilter] =
    useState(electionId || "all");

  const [positionFilter, setPositionFilter] =
    useState("all");

  const [selectedApplication, setSelectedApplication] =
    useState(null);

  const [reviewApplication, setReviewApplication] =
    useState(null);

  const [reviewAction, setReviewAction] =
    useState("");

  const [reviewNotes, setReviewNotes] =
    useState("");

  const [submittingReview, setSubmittingReview] =
    useState(false);

  const [expandedRows, setExpandedRows] =
    useState({});


  /* ========================================================
     LOAD APPLICATIONS
  ======================================================== */

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/elections/applications"
      );

      const loadedApplications =
        getApplicationsFromResponse(response);

      setApplications(
        loadedApplications
      );

    } catch (requestError) {
      console.error(
        "Unable to load election applications:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
        requestError?.response?.data?.error ||
        "Unable to load election applications."
      );

    } finally {
      setLoading(false);
    }
  };


  /* ========================================================
     LOAD ELECTIONS
  ======================================================== */

  const loadElections = async () => {
    try {
      const response = await api.get(
        "/elections"
      );

      const data =
        getResponseData(response);

      const loadedElections =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.elections)
            ? data.elections
            : [];

      setElections(
        loadedElections
      );

    } catch (requestError) {
      console.error(
        "Unable to load elections:",
        requestError
      );
    }
  };


  useEffect(() => {
    loadApplications();
    loadElections();
  }, []);


  /* ========================================================
     ELECTION FILTER FROM URL
  ======================================================== */

  useEffect(() => {
    if (electionId) {
      setElectionFilter(electionId);
    } else {
      setElectionFilter("all");
    }
  }, [electionId]);


  /* ========================================================
     OPEN APPLICATION FROM URL
  ======================================================== */

  useEffect(() => {
    if (!queryApplicationId || applications.length === 0) {
      return;
    }

    const application =
      applications.find(
        (item) =>
          String(
            getApplicationId(item)
          ) === String(queryApplicationId)
      );

    if (application) {
      setSelectedApplication(application);
    }
  }, [
    queryApplicationId,
    applications,
  ]);


  /* ========================================================
     SELECTED ELECTION
  ======================================================== */

  const selectedElection = useMemo(() => {
    if (!electionFilter ||
        electionFilter === "all") {
      return null;
    }

    return (
      elections.find(
        (election) =>
          String(
            election?._id ||
            election?.id
          ) === String(electionFilter)
      ) || null
    );
  }, [
    elections,
    electionFilter,
  ]);


  const selectedElectionIsNomination =
    selectedElection?.type === "nomination";


  /* ========================================================
     FILTER OPTIONS
  ======================================================== */

  const positions = useMemo(() => {
    const positionMap =
      new Map();

    const sourceApplications =
      electionFilter === "all"
        ? applications
        : applications.filter(
            (application) => {
              const election =
                getElection(application);

              const id =
                election?._id ||
                election?.id ||
                application?.electionId;

              return (
                String(id) ===
                String(electionFilter)
              );
            }
          );

    sourceApplications.forEach(
      (application) => {
        const position =
          getPosition(application);

        const id =
          position?._id ||
          position?.id ||
          getPositionName(application);

        const name =
          position?.name ||
          getPositionName(application);

        if (id && name) {
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
    ).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [
    applications,
    electionFilter,
  ]);


  /* ========================================================
     FILTERED APPLICATIONS
  ======================================================== */

  const filteredApplications =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return applications.filter(
        (application) => {

          const status =
            getStatus(application);

          const applicantName =
            getApplicantName(
              application
            ).toLowerCase();

          const applicantEmail =
            getApplicantEmail(
              application
            ).toLowerCase();

          const applicantPhone =
            getApplicantPhone(
              application
            ).toLowerCase();

          const position =
            getPositionName(
              application
            ).toLowerCase();

          const applicationElection =
            getElection(application);

          const applicationElectionId =
            applicationElection?._id ||
            applicationElection?.id ||
            application?.electionId;

          const applicationPosition =
            getPosition(application);

          const applicationPositionId =
            applicationPosition?._id ||
            applicationPosition?.id;

          const matchesSearch =
            !normalizedSearch ||
            applicantName.includes(
              normalizedSearch
            ) ||
            applicantEmail.includes(
              normalizedSearch
            ) ||
            applicantPhone.includes(
              normalizedSearch
            ) ||
            position.includes(
              normalizedSearch
            );

          const matchesStatus =
            statusFilter === "all" ||
            status === statusFilter;

          const matchesElection =
            electionFilter === "all" ||
            String(
              applicationElectionId
            ) === String(
              electionFilter
            );

          const matchesPosition =
            positionFilter === "all" ||
            String(
              applicationPositionId ||
              getPositionName(application)
            ) === String(
              positionFilter
            );

          return (
            matchesSearch &&
            matchesStatus &&
            matchesElection &&
            matchesPosition
          );
        }
      );
    }, [
      applications,
      search,
      statusFilter,
      electionFilter,
      positionFilter,
    ]);


  /* ========================================================
     STATISTICS
  ======================================================== */

  const statistics = useMemo(() => {
    const selectedApplications =
      applications.filter(
        (application) => {

          if (
            electionFilter === "all"
          ) {
            return true;
          }

          const election =
            getElection(application);

          const id =
            election?._id ||
            election?.id ||
            application?.electionId;

          return (
            String(id) ===
            String(electionFilter)
          );
        }
      );

    return {
      total:
        selectedApplications.length,

      submitted:
        selectedApplications.filter(
          (application) =>
            getStatus(application) ===
            "submitted"
        ).length,

      review:
        selectedApplications.filter(
          (application) =>
            getStatus(application) ===
            "review"
        ).length,

      vetted:
        selectedApplications.filter(
          (application) =>
            getStatus(application) ===
            "vetted"
        ).length,

      approved:
        selectedApplications.filter(
          (application) =>
            getStatus(application) ===
            "approved"
        ).length,

      appointed:
        selectedApplications.filter(
          (application) =>
            getStatus(application) ===
            "appointed"
        ).length,

      rejected:
        selectedApplications.filter(
          (application) =>
            getStatus(application) ===
            "rejected"
        ).length,
    };
  }, [
    applications,
    electionFilter,
  ]);


  /* ========================================================
     ROW TOGGLE
  ======================================================== */

  const toggleRow = (id) => {
    setExpandedRows(
      (previous) => ({
        ...previous,
        [id]:
          !previous[id],
      })
    );
  };


  /* ========================================================
     OPEN REVIEW
  ======================================================== */

  const openReview = (
    application,
    action
  ) => {
    setSelectedApplication(null);

    setReviewApplication(
      application
    );

    setReviewAction(action);

    setReviewNotes(
      application?.reviewNotes ||
      ""
    );
  };


  /* ========================================================
     CLOSE REVIEW
  ======================================================== */

  const closeReview = () => {
    if (submittingReview) {
      return;
    }

    setReviewApplication(null);
    setReviewAction("");
    setReviewNotes("");
  };


  /* ========================================================
     SUBMIT REVIEW
  ======================================================== */

  const submitReview = async () => {
    if (
      !reviewApplication ||
      !reviewAction
    ) {
      return;
    }

    if (
      reviewAction === "rejected" &&
      !reviewNotes.trim()
    ) {
      setError(
        "Please provide a reason before rejecting the application."
      );

      return;
    }

    const applicationId =
      getApplicationId(
        reviewApplication
      );

    if (!applicationId) {
      setError(
        "Unable to identify the application."
      );

      return;
    }

    try {
      setSubmittingReview(true);
      setError("");

      await api.patch(
        `/elections/applications/${applicationId}/review`,
        {
          status: reviewAction,
          reviewNotes:
            reviewNotes.trim(),
        }
      );

      closeReview();

      await loadApplications();

    } catch (requestError) {
      console.error(
        "Unable to review application:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
        requestError?.response?.data?.error ||
        "Unable to update the application."
      );

    } finally {
      setSubmittingReview(false);
    }
  };


  /* ========================================================
     HEADER TEXT
  ======================================================== */

  const pageTitle =
    selectedElection
      ? `${selectedElection.name} — Applications`
      : "Election Applications";

  const pageDescription =
    selectedElection
      ? selectedElectionIsNomination
        ? "Review, vet and approve applicants for this nomination exercise."
        : "Review, vet and approve applications before applicants proceed as aspirants."
      : "Review, vet and manage applications across JVP election exercises.";


  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="election-applications-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="applications-page-header">

        <div className="applications-header-left">

          <button
            type="button"
            className="applications-back-button"
            onClick={() => {
              if (electionId) {
                navigate(
                  `/admin/elections/${electionId}`
                );
              } else {
                navigate(
                  "/admin/elections"
                );
              }
            }}
            aria-label="Back to elections"
          >
            <FaArrowLeft />
          </button>


          <div>

            <div className="applications-eyebrow">
              <FaVoteYea />

              Election Administration
            </div>

            <h1>
              {pageTitle}
            </h1>

            <p>
              {pageDescription}
            </p>

          </div>

        </div>

      </header>


      {/* ====================================================
          ELECTION WORKFLOW BANNER
      ==================================================== */}

      {selectedElection && (
        <section className="applications-workflow-banner">

          <div className="workflow-banner-main">

            <div className="workflow-banner-icon">
              {selectedElectionIsNomination ? (
                <FaUsers />
              ) : (
                <FaVoteYea />
              )}
            </div>

            <div>

              <span>
                {selectedElectionIsNomination
                  ? "Nomination Workflow"
                  : "Elective Workflow"}
              </span>

              <strong>
                {selectedElectionIsNomination
                  ? "Submitted → Review → Vetted → Approved & Appointed"
                  : "Submitted → Review → Vetted → Approved → Aspirant"}
              </strong>

            </div>

          </div>

          <div className="workflow-banner-status">
            <StatusBadge
              status={
                selectedElection?.status ||
                "draft"
              }
            />
          </div>

        </section>
      )}


      {/* ====================================================
          ALERT
      ==================================================== */}

      {error && (
        <div className="applications-alert">

          <div className="applications-alert-icon">
            <FaTimes />
          </div>

          <div>
            <strong>
              Action Required
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

      <section className="applications-stat-grid">

        <div className="application-stat-card">
          <div className="application-stat-icon total">
            <FaUsers />
          </div>

          <div>
            <span>
              Total Applications
            </span>

            <strong>
              {statistics.total}
            </strong>
          </div>
        </div>


        <div className="application-stat-card">
          <div className="application-stat-icon pending">
            <FaClock />
          </div>

          <div>
            <span>
              Submitted
            </span>

            <strong>
              {statistics.submitted}
            </strong>
          </div>
        </div>


        <div className="application-stat-card">
          <div className="application-stat-icon pending">
            <FaEye />
          </div>

          <div>
            <span>
              Under Review
            </span>

            <strong>
              {statistics.review}
            </strong>
          </div>
        </div>


        <div className="application-stat-card">
          <div className="application-stat-icon approved">
            <FaCheck />
          </div>

          <div>
            <span>
              {selectedElectionIsNomination
                ? "Appointed"
                : "Approved"}
            </span>

            <strong>
              {selectedElectionIsNomination
                ? statistics.appointed
                : statistics.approved}
            </strong>
          </div>
        </div>


        <div className="application-stat-card">
          <div className="application-stat-icon rejected">
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
          FILTERS
      ==================================================== */}

      <section className="applications-toolbar">

        <div className="applications-search">

          <FaSearch />

          <input
            type="search"
            placeholder="Search applicant, email, phone or position..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        <div className="applications-filters">

          {!electionId && (
            <div className="application-filter">

              <label htmlFor="applicationElection">
                Election
              </label>

              <div className="select-wrapper">

                <select
                  id="applicationElection"
                  value={electionFilter}
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
          )}


          <div className="application-filter">

            <label htmlFor="applicationStatus">
              Status
            </label>

            <div className="select-wrapper">

              <select
                id="applicationStatus"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >

                <option value="all">
                  All Statuses
                </option>

                <option value="submitted">
                  Submitted
                </option>

                <option value="review">
                  Under Review
                </option>

                <option value="vetted">
                  Vetted
                </option>

                <option value="approved">
                  Approved
                </option>

                {selectedElectionIsNomination && (
                  <option value="appointed">
                    Appointed
                  </option>
                )}

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


          <div className="application-filter">

            <label htmlFor="applicationPosition">
              Position
            </label>

            <div className="select-wrapper">

              <select
                id="applicationPosition"
                value={positionFilter}
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
                      key={position.id}
                      value={position.id}
                    >
                      {position.name}
                    </option>
                  )
                )}

              </select>

              <FaChevronDown />

            </div>

          </div>

        </div>

      </section>


      {/* ====================================================
          APPLICATION TABLE
      ==================================================== */}

      <section className="applications-card">

        <div className="applications-card-header">

          <div>

            <h2>
              Applications
            </h2>

            <p>
              Showing{" "}
              <strong>
                {filteredApplications.length}
              </strong>{" "}
              of{" "}
              <strong>
                {applications.filter(
                  (application) => {
                    if (
                      electionFilter === "all"
                    ) {
                      return true;
                    }

                    const election =
                      getElection(
                        application
                      );

                    const id =
                      election?._id ||
                      election?.id ||
                      application?.electionId;

                    return (
                      String(id) ===
                      String(electionFilter)
                    );
                  }
                ).length}
              </strong>{" "}
              applications
            </p>

          </div>


          <button
            type="button"
            className="applications-refresh-button"
            onClick={loadApplications}
            disabled={loading}
          >
            {loading ? (
              <span className="application-spinner" />
            ) : (
              "Refresh"
            )}
          </button>

        </div>


        {loading ? (

          <div className="applications-loading">

            <span className="large-spinner" />

            <h3>
              Loading applications
            </h3>

            <p>
              Please wait while we retrieve
              election applications.
            </p>

          </div>

        ) : filteredApplications.length === 0 ? (

          <div className="applications-empty">

            <div className="applications-empty-icon">
              <FaUsers />
            </div>

            <h3>
              No applications found
            </h3>

            <p>
              {applications.length === 0
                ? "There are currently no election applications."
                : "No applications match your current search and filters."}
            </p>

            {applications.length > 0 && (
              <button
                type="button"
                className="application-button application-button-secondary"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");

                  if (!electionId) {
                    setElectionFilter(
                      "all"
                    );
                  }

                  setPositionFilter(
                    "all"
                  );
                }}
              >
                Clear Filters
              </button>
            )}

          </div>

        ) : (

          <div className="applications-table-wrapper">

            <table className="applications-table">

              <thead>

                <tr>
                  <th>
                    Applicant
                  </th>

                  {!electionId && (
                    <th>
                      Election
                    </th>
                  )}

                  <th>
                    Position
                  </th>

                  <th>
                    Submitted
                  </th>

                  <th>
                    Status
                  </th>

                  <th className="applications-actions-column">
                    Action
                  </th>
                </tr>

              </thead>


              <tbody>

                {filteredApplications.map(
                  (application) => {

                    const id =
                      getApplicationId(
                        application
                      );

                    const status =
                      getStatus(
                        application
                      );

                    const applicantName =
                      getApplicantName(
                        application
                      );

                    const applicantEmail =
                      getApplicantEmail(
                        application
                      );

                    const applicantPhone =
                      getApplicantPhone(
                        application
                      );

                    const submittedAt =
                      application?.submittedAt ||
                      application?.createdAt ||
                      application?.applicationDate;

                    const isExpanded =
                      Boolean(
                        expandedRows[id]
                      );

                    const nextAction =
                      getNextWorkflowAction(
                        application
                      );

                    const nomination =
                      isNomination(
                        application
                      );

                    return (
                      <tr
                        key={id}
                        className={
                          isExpanded
                            ? "application-row-expanded"
                            : ""
                        }
                      >

                        <td>

                          <div className="applicant-cell">

                            <button
                              type="button"
                              className="application-expand-button"
                              onClick={() =>
                                toggleRow(id)
                              }
                              aria-label={
                                isExpanded
                                  ? "Collapse application"
                                  : "Expand application"
                              }
                            >
                              {isExpanded ? (
                                <FaChevronDown />
                              ) : (
                                <FaChevronRight />
                              )}
                            </button>


                            <div className="applicant-avatar">
                              <FaUser />
                            </div>


                            <div className="applicant-info">

                              <strong>
                                {applicantName}
                              </strong>

                              <span>
                                {applicantEmail ||
                                  applicantPhone ||
                                  "Contact unavailable"}
                              </span>

                            </div>

                          </div>

                        </td>


                        {!electionId && (
                          <td>

                            <span className="table-election-name">
                              {getElectionName(
                                application
                              )}
                            </span>

                          </td>
                        )}


                        <td>

                          <div className="table-position-wrapper">

                            <span className="table-position">
                              {getPositionName(
                                application
                              )}
                            </span>

                            {getPositionLevel(
                              application
                            ) && (
                              <small>
                                {getPositionLevel(
                                  application
                                )}
                              </small>
                            )}

                            {nomination && (
                              <small className="table-election-type">
                                Nomination
                              </small>
                            )}

                          </div>

                        </td>


                        <td>

                          <span className="table-date">
                            {formatDate(
                              submittedAt
                            )}
                          </span>

                        </td>


                        <td>

                          <StatusBadge
                            status={status}
                          />

                        </td>


                        <td>

                          <div className="application-row-actions">

                            <button
                              type="button"
                              className="row-action-button view"
                              onClick={() =>
                                setSelectedApplication(
                                  application
                                )
                              }
                              title="View application"
                            >
                              <FaEye />
                            </button>


                            {nextAction && (
                              <button
                                type="button"
                                className="row-action-button approve"
                                onClick={() =>
                                  openReview(
                                    application,
                                    nextAction.action
                                  )
                                }
                                title={
                                  nextAction.title
                                }
                              >
                                {nextAction.icon}
                              </button>
                            )}


                            {canReject(
                              application
                            ) && (
                              <button
                                type="button"
                                className="row-action-button reject"
                                onClick={() =>
                                  openReview(
                                    application,
                                    "rejected"
                                  )
                                }
                                title="Reject application"
                              >
                                <FaTimes />
                              </button>
                            )}

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
          DRAWER
      ==================================================== */}

      {selectedApplication && (
        <ApplicationDetails
          application={
            selectedApplication
          }
          onClose={() =>
            setSelectedApplication(null)
          }
          onReview={openReview}
        />
      )}


      {/* ====================================================
          REVIEW MODAL
      ==================================================== */}

      {reviewApplication && (
        <ReviewModal
          application={
            reviewApplication
          }
          action={reviewAction}
          reviewNotes={
            reviewNotes
          }
          setReviewNotes={
            setReviewNotes
          }
          submitting={
            submittingReview
          }
          onClose={
            closeReview
          }
          onSubmit={
            submitReview
          }
        />
      )}

    </div>
  );
}


export default ElectionApplications;