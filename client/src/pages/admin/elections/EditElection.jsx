import {
  useEffect,
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
  FaExclamationCircle,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
  FaUserCheck,
  FaVoteYea,
} from "react-icons/fa";

import api from "../../../services/api";

import "./EditElection.css";


/* ==========================================================
   HELPERS
========================================================== */

const getResponseData = (response) => {
  return (
    response?.data?.data?.election ||
    response?.data?.election ||
    response?.data?.data ||
    response?.data ||
    null
  );
};


const getResponsePosition = (response) => {
  return (
    response?.data?.data?.position ||
    response?.data?.position ||
    response?.data?.data ||
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


const formatDateTimeInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) =>
    String(number).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
};


const toISOString = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
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
    labels[status] ||
    status ||
    "Unknown"
  );
};


const getTypeLabel = (type) => {
  return type === "nomination"
    ? "Nomination"
    : "Elective";
};


const getScopeLabel = (scope) => {
  const labels = {
    regional: "Regional",
    county: "County",
    constituency: "Constituency",
    ward: "Ward",
  };

  return (
    labels[scope] ||
    scope ||
    "Not specified"
  );
};


const getPositionLevelLabel = (level) => {
  const labels = {
    regional: "Regional",
    county: "County",
    constituency: "Constituency",
    ward: "Ward",
  };

  return (
    labels[level] ||
    level ||
    "Not specified"
  );
};


/* ==========================================================
   DEFAULT FORM
========================================================== */

const DEFAULT_FORM = {
  name: "",
  description: "",

  type: "elective",

  vettingCommittee: "",

  scope: "regional",

  county: "",
  constituency: "",
  ward: "",

  applicationStart: "",
  applicationEnd: "",

  votingStart: "",
  votingEnd: "",
};


/* ==========================================================
   DEFAULT POSITION
========================================================== */

const createEmptyPosition = (scope = "regional") => ({
  clientId:
    `${Date.now()}-${Math.random()}`,

  name: "",
  description: "",

  level: scope || "regional",

  county: "",
  constituency: "",
  ward: "",

  maxWinners: 1,
});


/* ==========================================================
   COMPONENT
========================================================== */

function EditElection() {
  const {
    electionId,
  } = useParams();

  const navigate = useNavigate();


  /* ========================================================
     STATE
  ======================================================== */

  const [
    election,
    setElection,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(DEFAULT_FORM);

  const [
    existingPositions,
    setExistingPositions,
  ] = useState([]);

  const [
    newPositions,
    setNewPositions,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    fieldErrors,
    setFieldErrors,
  ] = useState({});

  const [
    positionError,
    setPositionError,
  ] = useState("");

  const [
    deletePosition,
    setDeletePosition,
  ] = useState(null);


  /* ========================================================
     DERIVED STATE
  ======================================================== */

  const status =
    election?.status ||
    "draft";

  const isDraft =
    status === "draft";

  const isCancelled =
    status === "cancelled";

  const isResults =
    status === "results";

  const electionType =
    form.type ||
    election?.type ||
    "elective";

  const isNomination =
    electionType === "nomination";

  const isElective =
    !isNomination;


  /* ========================================================
     LOAD ELECTION
  ======================================================== */

  const loadElection = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          `/elections/${electionId}`
        );

      const data =
        getResponseData(response);

      if (!data) {
        throw new Error(
          "Election information could not be loaded."
        );
      }

      setElection(data);

      setForm({
        name:
          data.name || "",

        description:
          data.description || "",

        type:
          data.type === "nomination"
            ? "nomination"
            : "elective",

        vettingCommittee:
          data.vettingCommittee || "",

        scope:
          data.scope || "regional",

        county:
          data.county || "",

        constituency:
          data.constituency || "",

        ward:
          data.ward || "",

        applicationStart:
          formatDateTimeInput(
            data.applicationStart
          ),

        applicationEnd:
          formatDateTimeInput(
            data.applicationEnd
          ),

        votingStart:
          formatDateTimeInput(
            data.votingStart
          ),

        votingEnd:
          formatDateTimeInput(
            data.votingEnd
          ),
      });

      setExistingPositions(
        Array.isArray(data.positions)
          ? data.positions.map(
              (position) => ({
                ...position,

                name:
                  position.name ||
                  position.title ||
                  "",

                description:
                  position.description ||
                  "",

                level:
                  position.level ||
                  data.scope ||
                  "regional",

                county:
                  position.county ||
                  "",

                constituency:
                  position.constituency ||
                  "",

                ward:
                  position.ward ||
                  "",

                maxWinners:
                  Number(
                    position.maxWinners
                  ) > 0
                    ? Number(
                        position.maxWinners
                      )
                    : 1,
              })
            )
          : []
      );

      setNewPositions([]);

    } catch (err) {
      console.error(
        "Failed to load election:",
        err
      );

      setError(
        getErrorMessage(err)
      );

    } finally {
      setLoading(false);
    }
  };


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
     FORM UPDATE
  ======================================================== */

  const updateField = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFieldErrors(
      (previous) => ({
        ...previous,
        [field]: "",
      })
    );

    setError("");
    setSuccess("");
  };


  /* ========================================================
     ELECTION TYPE CHANGE
  ======================================================== */

  const handleTypeChange = (type) => {
    if (
      !isDraft ||
      isCancelled ||
      isResults
    ) {
      return;
    }

    if (type === "nomination") {
      setForm((previous) => ({
        ...previous,

        type: "nomination",

        votingStart: "",
        votingEnd: "",
      }));
    } else {
      setForm((previous) => ({
        ...previous,

        type: "elective",
      }));
    }

    setFieldErrors({});
    setError("");
    setSuccess("");
  };


  /* ========================================================
     SCOPE CHANGE
  ======================================================== */

  const handleScopeChange = (
    value
  ) => {
    if (
      !isDraft ||
      isCancelled ||
      isResults
    ) {
      return;
    }

    setForm((previous) => ({
      ...previous,

      scope: value,

      county:
        value === "regional"
          ? ""
          : previous.county,

      constituency:
        value === "constituency" ||
        value === "ward"
          ? previous.constituency
          : "",

      ward:
        value === "ward"
          ? previous.ward
          : "",
    }));

    /*
      Keep new position levels aligned
      with the election scope.
    */
    setNewPositions(
      (previous) =>
        previous.map(
          (position) => ({
            ...position,

            level:
              value,

            county:
              value === "regional"
                ? ""
                : position.county,

            constituency:
              value === "constituency" ||
              value === "ward"
                ? position.constituency
                : "",

            ward:
              value === "ward"
                ? position.ward
                : "",
          })
        )
    );

    setFieldErrors({});
    setError("");
    setSuccess("");
    setPositionError("");
  };


  /* ========================================================
     POSITION HELPERS
  ======================================================== */

  const normalizePosition = (
    position
  ) => {
    return {
      name:
        position?.name?.trim() ||
        position?.title?.trim() ||
        "",

      description:
        position?.description?.trim() ||
        "",

      level:
        position?.level ||
        form.scope ||
        "regional",

      county:
        position?.county?.trim() ||
        "",

      constituency:
        position?.constituency?.trim() ||
        "",

      ward:
        position?.ward?.trim() ||
        "",

      maxWinners:
        Number(
          position?.maxWinners
        ) > 0
          ? Number(
              position.maxWinners
            )
          : 1,
    };
  };


  /* ========================================================
     ADD NEW POSITION
  ======================================================== */

  const addPositionRow = () => {
    if (!isDraft) {
      return;
    }

    setNewPositions(
      (previous) => [
        ...previous,
        createEmptyPosition(
          form.scope
        ),
      ]
    );

    setPositionError("");
    setError("");
    setSuccess("");
  };


  /* ========================================================
     UPDATE NEW POSITION
  ======================================================== */

  const updateNewPosition = (
    clientId,
    field,
    value
  ) => {
    setNewPositions(
      (previous) =>
        previous.map(
          (position) =>
            position.clientId ===
            clientId
              ? {
                  ...position,
                  [field]:
                    field ===
                    "maxWinners"
                      ? Math.max(
                          1,
                          Number(
                            value
                          ) || 1
                        )
                      : value,
                }
              : position
        )
    );

    setPositionError("");
    setError("");
    setSuccess("");
  };


  /* ========================================================
     UPDATE EXISTING POSITION
  ======================================================== */

  const updateExistingPosition = (
    positionId,
    field,
    value
  ) => {
    if (!isDraft) {
      return;
    }

    setExistingPositions(
      (previous) =>
        previous.map(
          (position) =>
            (
              position?._id ||
              position?.id
            ) === positionId
              ? {
                  ...position,
                  [field]:
                    field ===
                    "maxWinners"
                      ? Math.max(
                          1,
                          Number(
                            value
                          ) || 1
                        )
                      : value,
                }
              : position
        )
    );

    setPositionError("");
    setError("");
    setSuccess("");
  };


  /* ========================================================
     REMOVE NEW POSITION
  ======================================================== */

  const removeNewPosition = (
    clientId
  ) => {
    setNewPositions(
      (previous) =>
        previous.filter(
          (position) =>
            position.clientId !==
            clientId
        )
    );

    setPositionError("");
  };


  /* ========================================================
     VALIDATE POSITION
  ======================================================== */

  const validatePosition = (
    position,
    label = "Position"
  ) => {
    const errors = [];

    const name =
      position?.name?.trim() ||
      position?.title?.trim() ||
      "";

    const level =
      position?.level ||
      form.scope ||
      "";

    if (!name) {
      errors.push(
        `${label} name is required.`
      );
    }

    if (!level) {
      errors.push(
        `${label} level is required.`
      );
    }

    if (
      level !== "regional" &&
      !position?.county?.trim()
    ) {
      errors.push(
        `${label} county is required.`
      );
    }

    if (
      (
        level === "constituency" ||
        level === "ward"
      ) &&
      !position?.constituency?.trim()
    ) {
      errors.push(
        `${label} constituency is required.`
      );
    }

    if (
      level === "ward" &&
      !position?.ward?.trim()
    ) {
      errors.push(
        `${label} ward is required.`
      );
    }

    const maxWinners =
      Number(
        position?.maxWinners
      );

    if (
      !Number.isInteger(
        maxWinners
      ) ||
      maxWinners < 1
    ) {
      errors.push(
        `${label} must have at least one winner.`
      );
    }

    return errors;
  };


  /* ========================================================
     VALIDATE FORM
  ======================================================== */

  const validateForm = () => {
    const errors = {};
    let positionErrors = [];


    /* ==========================================
       BASIC INFORMATION
    ========================================== */

    if (!form.name.trim()) {
      errors.name =
        "Election name is required.";
    }


    /* ==========================================
       TYPE
    ========================================== */

    if (
      ![
        "elective",
        "nomination",
      ].includes(form.type)
    ) {
      errors.type =
        "Please select a valid exercise type.";
    }


    if (
      form.type === "nomination" &&
      !form.vettingCommittee.trim()
    ) {
      errors.vettingCommittee =
        "Vetting committee is required for nomination exercises.";
    }


    /* ==========================================
       SCOPE
    ========================================== */

    if (!form.scope) {
      errors.scope =
        "Please select an exercise scope.";
    }


    if (
      form.scope !== "regional" &&
      !form.county.trim()
    ) {
      errors.county =
        "County is required for this scope.";
    }


    if (
      (
        form.scope === "constituency" ||
        form.scope === "ward"
      ) &&
      !form.constituency.trim()
    ) {
      errors.constituency =
        "Constituency is required.";
    }


    if (
      form.scope === "ward" &&
      !form.ward.trim()
    ) {
      errors.ward =
        "Ward is required.";
    }


    /* ==========================================
       APPLICATION TIMELINE
    ========================================== */

    if (!form.applicationStart) {
      errors.applicationStart =
        "Application start time is required.";
    }

    if (!form.applicationEnd) {
      errors.applicationEnd =
        "Application end time is required.";
    }


    const applicationStart =
      form.applicationStart
        ? new Date(
            form.applicationStart
          )
        : null;

    const applicationEnd =
      form.applicationEnd
        ? new Date(
            form.applicationEnd
          )
        : null;


    if (
      applicationStart &&
      applicationEnd &&
      (
        Number.isNaN(
          applicationStart.getTime()
        ) ||
        Number.isNaN(
          applicationEnd.getTime()
        )
      )
    ) {
      errors.applicationEnd =
        "Please provide valid application dates.";
    }


    if (
      applicationStart &&
      applicationEnd &&
      !Number.isNaN(
        applicationStart.getTime()
      ) &&
      !Number.isNaN(
        applicationEnd.getTime()
      ) &&
      applicationStart >=
        applicationEnd
    ) {
      errors.applicationEnd =
        "Application end must be after application start.";
    }


    /* ==========================================
       ELECTIVE VOTING TIMELINE
    ========================================== */

    if (
      form.type === "elective"
    ) {
      if (!form.votingStart) {
        errors.votingStart =
          "Voting start time is required for an elective election.";
      }

      if (!form.votingEnd) {
        errors.votingEnd =
          "Voting end time is required for an elective election.";
      }


      const votingStart =
        form.votingStart
          ? new Date(
              form.votingStart
            )
          : null;

      const votingEnd =
        form.votingEnd
          ? new Date(
              form.votingEnd
            )
          : null;


      if (
        applicationEnd &&
        votingStart &&
        !Number.isNaN(
          applicationEnd.getTime()
        ) &&
        !Number.isNaN(
          votingStart.getTime()
        ) &&
        applicationEnd >
          votingStart
      ) {
        errors.votingStart =
          "Voting must start after applications close.";
      }


      if (
        votingStart &&
        votingEnd &&
        !Number.isNaN(
          votingStart.getTime()
        ) &&
        !Number.isNaN(
          votingEnd.getTime()
        ) &&
        votingStart >=
          votingEnd
      ) {
        errors.votingEnd =
          "Voting end must be after voting start.";
      }
    }


    /* ==========================================
       EXISTING POSITIONS
    ========================================== */

    existingPositions.forEach(
      (position, index) => {
        const errorsForPosition =
          validatePosition(
            position,
            `Existing position ${index + 1}`
          );

        if (
          errorsForPosition.length > 0
        ) {
          positionErrors =
            positionErrors.concat(
              errorsForPosition
            );
        }
      }
    );


    /* ==========================================
       NEW POSITIONS
    ========================================== */

    newPositions.forEach(
      (position, index) => {
        const errorsForPosition =
          validatePosition(
            position,
            `New position ${index + 1}`
          );

        if (
          errorsForPosition.length > 0
        ) {
          positionErrors =
            positionErrors.concat(
              errorsForPosition
            );
        }
      }
    );


    setFieldErrors(errors);


    if (
      positionErrors.length > 0
    ) {
      setPositionError(
        positionErrors.join(" ")
      );
    } else {
      setPositionError("");
    }


    return (
      Object.keys(errors).length === 0 &&
      positionErrors.length === 0
    );
  };


  /* ========================================================
     DELETE EXISTING POSITION
  ======================================================== */

  const handleDeletePosition = async () => {
    if (!deletePosition) {
      return;
    }

    if (!isDraft) {
      setDeletePosition(null);

      return;
    }

    const positionId =
      deletePosition?._id ||
      deletePosition?.id;

    if (!positionId) {
      setPositionError(
        "This position does not have a valid ID."
      );

      setDeletePosition(null);

      return;
    }


    /*
      Prevent removing the final position.
      The backend requires positions before
      an exercise can be opened.
    */
    if (
      existingPositions.length +
        newPositions.length <=
      1
    ) {
      setPositionError(
        "An exercise must have at least one position. Add another position before removing this one."
      );

      setDeletePosition(null);

      return;
    }


    try {
      setSaving(true);
      setPositionError("");

      await api.delete(
        `/elections/${electionId}/positions/${positionId}`
      );

      setExistingPositions(
        (previous) =>
          previous.filter(
            (position) =>
              (
                position?._id ||
                position?.id
              ) !== positionId
          )
      );

      setDeletePosition(null);

      setSuccess(
        "Position removed successfully."
      );

    } catch (err) {
      console.error(
        "Failed to delete position:",
        err
      );

      setPositionError(
        getErrorMessage(err)
      );

      setDeletePosition(null);

    } finally {
      setSaving(false);
    }
  };


  /* ========================================================
     SAVE EXISTING POSITION
  ======================================================== */

  const saveExistingPosition = async (
    position
  ) => {
    const positionId =
      position?._id ||
      position?.id;

    if (!positionId) {
      throw new Error(
        "Existing position does not have a valid ID."
      );
    }

    const payload =
      normalizePosition(
        position
      );

    const response =
      await api.patch(
        `/elections/${electionId}/positions/${positionId}`,
        payload
      );

    return (
      getResponsePosition(
        response
      ) || {
        ...position,
        ...payload,
      }
    );
  };


  /* ========================================================
     SAVE ELECTION
  ======================================================== */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setPositionError("");

    if (!validateForm()) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }


    try {
      setSaving(true);


      /* ==============================================
         UPDATE ELECTION
      ============================================== */

      const payload = {
        name:
          form.name.trim(),

        description:
          form.description.trim(),

        type:
          form.type,

        vettingCommittee:
          form.type === "nomination"
            ? form.vettingCommittee.trim()
            : "",

        scope:
          form.scope,

        county:
          form.scope === "regional"
            ? ""
            : form.county.trim(),

        constituency:
          (
            form.scope === "constituency" ||
            form.scope === "ward"
          )
            ? form.constituency.trim()
            : "",

        ward:
          form.scope === "ward"
            ? form.ward.trim()
            : "",

        applicationStart:
          toISOString(
            form.applicationStart
          ),

        applicationEnd:
          toISOString(
            form.applicationEnd
          ),

        votingStart:
          form.type === "elective"
            ? toISOString(
                form.votingStart
              )
            : null,

        votingEnd:
          form.type === "elective"
            ? toISOString(
                form.votingEnd
              )
            : null,
      };


      const response =
        await api.patch(
          `/elections/${electionId}`,
          payload
        );


      const updatedElection =
        getResponseData(response);


      if (updatedElection) {
        setElection(
          updatedElection
        );
      }


      /* ==============================================
         UPDATE EXISTING POSITIONS
      ============================================== */

      const updatedExistingPositions =
        [];


      for (
        const position
        of existingPositions
      ) {
        try {
          const updatedPosition =
            await saveExistingPosition(
              position
            );

          if (updatedPosition) {
            updatedExistingPositions.push(
              updatedPosition
            );
          } else {
            updatedExistingPositions.push(
              position
            );
          }

        } catch (positionErr) {
          console.error(
            "Failed to update existing position:",
            positionErr
          );

          throw new Error(
            `Failed to update position "${
              position.name ||
              position.title ||
              "Unnamed position"
            }": ${getErrorMessage(
              positionErr
            )}`
          );
        }
      }


      if (
        updatedExistingPositions.length >
        0
      ) {
        setExistingPositions(
          updatedExistingPositions
        );
      }


      /* ==============================================
         ADD NEW POSITIONS
      ============================================== */

      const createdPositions = [];


      for (
        const position
        of newPositions
      ) {
        const positionPayload =
          normalizePosition(
            position
          );


        try {
          const positionResponse =
            await api.post(
              `/elections/${electionId}/positions`,
              positionPayload
            );


          const createdPosition =
            getResponsePosition(
              positionResponse
            );


          if (createdPosition) {
            createdPositions.push(
              createdPosition
            );
          }

        } catch (positionErr) {
          console.error(
            "Failed to add position:",
            positionErr
          );

          throw new Error(
            `Failed to add position "${
              position.name ||
              "Unnamed position"
            }": ${getErrorMessage(
              positionErr
            )}`
          );
        }
      }


      /* ==============================================
         UPDATE LOCAL POSITION STATE
      ============================================== */

      if (
        createdPositions.length > 0
      ) {
        setExistingPositions(
          (previous) => [
            ...previous,
            ...createdPositions,
          ]
        );
      }


      setNewPositions([]);


      /* ==============================================
         SUCCESS
      ============================================== */

      setSuccess(
        form.type === "nomination"
          ? "Nomination exercise updated successfully."
          : "Election updated successfully."
      );


      window.setTimeout(() => {
        navigate(
          `/admin/elections/${electionId}`
        );
      }, 700);

    } catch (err) {
      console.error(
        "Failed to update election:",
        err
      );

      setError(
        getErrorMessage(err)
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } finally {
      setSaving(false);
    }
  };


  /* ========================================================
     CANCEL
  ======================================================== */

  const handleCancel = () => {
    navigate(
      `/admin/elections/${electionId}`
    );
  };


  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <div className="edit-election-page">

        <div className="edit-election-loading">

          <div className="edit-loading-spinner" />

          <h2>
            Loading Election
          </h2>

          <p>
            Retrieving election information...
          </p>

        </div>

      </div>
    );
  }


  /* ========================================================
     ERROR STATE
  ======================================================== */

  if (
    error &&
    !election
  ) {
    return (
      <div className="edit-election-page">

        <div className="edit-page-topbar">

          <button
            type="button"
            className="edit-back-button"
            onClick={() =>
              navigate(
                "/admin/elections"
              )
            }
          >
            <FaArrowLeft />
            Back to Elections
          </button>

        </div>


        <div className="edit-error-card">

          <div className="edit-error-icon">
            <FaExclamationCircle />
          </div>

          <h2>
            Unable to Load Election
          </h2>

          <p>
            {error}
          </p>

          <div className="edit-error-actions">

            <button
              type="button"
              className="edit-secondary-button"
              onClick={() =>
                navigate(
                  "/admin/elections"
                )
              }
            >
              Back to Elections
            </button>

            <button
              type="button"
              className="edit-primary-button"
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
    <div className="edit-election-page">


      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="edit-page-topbar">

        <button
          type="button"
          className="edit-back-button"
          onClick={handleCancel}
        >
          <FaArrowLeft />
          Back to Election
        </button>

      </div>


      <div className="edit-election-header">

        <div className="edit-header-main">

          <div className="edit-header-icon">
            {isNomination ? (
              <FaUserCheck />
            ) : (
              <FaVoteYea />
            )}
          </div>

          <div>

            <span className="edit-header-kicker">
              Election Management
            </span>

            <h1>
              Edit{" "}
              {isNomination
                ? "Nomination Exercise"
                : "Election"}
            </h1>

            <p>
              Update the exercise information,
              scope, timeline and positions.
            </p>

          </div>

        </div>


        <div className="edit-header-badges">

          <div
            className={`edit-type-badge type-${form.type}`}
          >
            {isNomination ? (
              <FaUserCheck />
            ) : (
              <FaVoteYea />
            )}

            {getTypeLabel(
              form.type
            )}
          </div>


          <div
            className={`edit-status-badge status-${status}`}
          >
            <span className="status-dot" />

            {getStatusLabel(
              status
            )}

          </div>

        </div>

      </div>


      {/* ==================================================
          WORKFLOW NOTICE
      ================================================== */}

      {isNomination ? (

        <div className="edit-workflow-notice nomination">

          <FaUserCheck />

          <div>

            <strong>
              Nomination Exercise
            </strong>

            <span>
              Members submit applications for
              consideration by the designated
              vetting committee. Approved
              applicants are appointed directly;
              there is no voting, aspirant or
              results stage.
            </span>

          </div>

        </div>

      ) : (

        <div className="edit-workflow-notice elective">

          <FaVoteYea />

          <div>

            <strong>
              Elective Exercise
            </strong>

            <span>
              Members apply for positions, approved
              applicants become aspirants, and
              eligible members participate in the
              voting process.
            </span>

          </div>

        </div>

      )}


      {/* ==================================================
          WARNING
      ================================================== */}

      {!isDraft &&
        !isCancelled &&
        !isResults && (

        <div className="edit-warning">

          <FaInfoCircle />

          <div>

            <strong>
              Exercise is already active
            </strong>

            <span>
              This exercise is currently
              {status === "open"
                ? " accepting applications."
                : " in the active lifecycle."}
              Structural position changes are
              restricted to protect the exercise.
            </span>

          </div>

        </div>

      )}


      {isResults && (

        <div className="edit-warning">

          <FaInfoCircle />

          <div>

            <strong>
              Results have been published
            </strong>

            <span>
              Published elections should not
              have their core details changed
              unless authorised.
            </span>

          </div>

        </div>

      )}


      {/* ==================================================
          ALERTS
      ================================================== */}

      {success && (

        <div className="edit-alert edit-alert-success">

          <FaCheckCircle />

          <span>
            {success}
          </span>

        </div>

      )}


      {error && election && (

        <div className="edit-alert edit-alert-error">

          <FaExclamationCircle />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <FaTimes />
          </button>

        </div>

      )}


      <form
        className="edit-election-form"
        onSubmit={handleSubmit}
      >


        {/* =================================================
            BASIC INFORMATION
        ================================================= */}

        <section className="edit-card">

          <div className="edit-card-header">

            <div className="edit-card-icon">
              <FaInfoCircle />
            </div>

            <div>

              <h2>
                Basic Information
              </h2>

              <p>
                Update the identity and
                description of this exercise.
              </p>

            </div>

          </div>


          <div className="edit-form-grid">


            <div className="edit-form-group full-width">

              <label htmlFor="election-name">
                Exercise Name
                <span>*</span>
              </label>

              <input
                id="election-name"
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="e.g. JVP Regional Youth Assembly Elections 2026"
                disabled={
                  isCancelled ||
                  isResults
                }
                className={
                  fieldErrors.name
                    ? "input-error"
                    : ""
                }
              />

              {fieldErrors.name && (
                <small className="field-error">
                  {fieldErrors.name}
                </small>
              )}

            </div>


            <div className="edit-form-group full-width">

              <label htmlFor="election-description">
                Description
              </label>

              <textarea
                id="election-description"
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Describe the purpose, scope and objectives of this exercise..."
                rows={5}
                maxLength={1000}
                disabled={
                  isCancelled ||
                  isResults
                }
              />

              <small className="field-hint">
                Provide a clear description
                that members can understand.
              </small>

            </div>

          </div>

        </section>


        {/* =================================================
            ELECTION TYPE
        ================================================= */}

        <section className="edit-card">

          <div className="edit-card-header">

            <div className="edit-card-icon">
              {isNomination ? (
                <FaUserCheck />
              ) : (
                <FaVoteYea />
              )}
            </div>

            <div>

              <h2>
                Exercise Type
              </h2>

              <p>
                Select how candidates for the
                positions will be determined.
              </p>

            </div>

          </div>


          <div className="edit-election-type-options">

            <button
              type="button"
              className={
                form.type === "elective"
                  ? "edit-type-option selected elective"
                  : "edit-type-option elective"
              }
              onClick={() =>
                handleTypeChange(
                  "elective"
                )
              }
              disabled={
                !isDraft ||
                isCancelled ||
                isResults
              }
            >

              <div className="edit-type-option-icon">
                <FaVoteYea />
              </div>

              <div className="edit-type-option-content">

                <strong>
                  Elective
                </strong>

                <span>
                  Members vote for approved
                  aspirants.
                </span>

                <small>
                  Application → Approval →
                  Aspirants → Voting → Results
                </small>

              </div>

              {form.type === "elective" && (
                <FaCheckCircle className="edit-type-selected-icon" />
              )}

            </button>


            <button
              type="button"
              className={
                form.type === "nomination"
                  ? "edit-type-option selected nomination"
                  : "edit-type-option nomination"
              }
              onClick={() =>
                handleTypeChange(
                  "nomination"
                )
              }
              disabled={
                !isDraft ||
                isCancelled ||
                isResults
              }
            >

              <div className="edit-type-option-icon">
                <FaUserCheck />
              </div>

              <div className="edit-type-option-content">

                <strong>
                  Nomination
                </strong>

                <span>
                  Applicants are considered and
                  appointed through vetting.
                </span>

                <small>
                  Application → Vetting →
                  Verdict → Appointment
                </small>

              </div>

              {form.type === "nomination" && (
                <FaCheckCircle className="edit-type-selected-icon" />
              )}

            </button>

          </div>


          {fieldErrors.type && (
            <small className="field-error">
              {fieldErrors.type}
            </small>
          )}


          {/* ==========================================
              VETTING COMMITTEE
          ========================================== */}

          {isNomination && (

            <div className="edit-nomination-settings">

              <div className="edit-nomination-heading">

                <div className="edit-nomination-icon">
                  <FaUserCheck />
                </div>

                <div>

                  <h3>
                    Vetting Committee
                  </h3>

                  <p>
                    Identify the committee responsible
                    for reviewing nomination applications.
                  </p>

                </div>

              </div>


              <div className="edit-form-group">

                <label htmlFor="vetting-committee">
                  Vetting Committee
                  <span>*</span>
                </label>

                <textarea
                  id="vetting-committee"
                  value={
                    form.vettingCommittee
                  }
                  onChange={(event) =>
                    updateField(
                      "vettingCommittee",
                      event.target.value
                    )
                  }
                  placeholder="e.g. JVP Regional Appointments and Vetting Committee"
                  rows={3}
                  maxLength={500}
                  disabled={
                    !isDraft ||
                    isCancelled ||
                    isResults
                  }
                  className={
                    fieldErrors.vettingCommittee
                      ? "input-error"
                      : ""
                  }
                />

                {fieldErrors.vettingCommittee && (
                  <small className="field-error">
                    {
                      fieldErrors.vettingCommittee
                    }
                  </small>
                )}

                <small className="field-hint">
                  Enter the formal name of the
                  committee or its composition,
                  according to the applicable JVP
                  governance arrangements.
                </small>

              </div>

            </div>

          )}

        </section>


        {/* =================================================
            SCOPE
        ================================================= */}

        <section className="edit-card">

          <div className="edit-card-header">

            <div className="edit-card-icon">
              <FaMapMarkerAlt />
            </div>

            <div>

              <h2>
                Exercise Scope
              </h2>

              <p>
                Define where this exercise
                will take place.
              </p>

            </div>

          </div>


          <div className="edit-form-grid">


            <div className="edit-form-group">

              <label htmlFor="election-scope">
                Exercise Scope
                <span>*</span>
              </label>

              <select
                id="election-scope"
                value={form.scope}
                onChange={(event) =>
                  handleScopeChange(
                    event.target.value
                  )
                }
                disabled={
                  !isDraft ||
                  isCancelled ||
                  isResults
                }
                className={
                  fieldErrors.scope
                    ? "input-error"
                    : ""
                }
              >

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

              {fieldErrors.scope && (
                <small className="field-error">
                  {fieldErrors.scope}
                </small>
              )}

              <small className="field-hint">
                {getScopeLabel(
                  form.scope
                )}
                {" "}level exercise.
              </small>

            </div>


            {form.scope !== "regional" && (

              <div className="edit-form-group">

                <label htmlFor="election-county">
                  County
                  <span>*</span>
                </label>

                <input
                  id="election-county"
                  type="text"
                  value={form.county}
                  onChange={(event) =>
                    updateField(
                      "county",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Taita Taveta"
                  disabled={
                    !isDraft ||
                    isCancelled ||
                    isResults
                  }
                  className={
                    fieldErrors.county
                      ? "input-error"
                      : ""
                  }
                />

                {fieldErrors.county && (
                  <small className="field-error">
                    {fieldErrors.county}
                  </small>
                )}

              </div>

            )}


            {(
              form.scope === "constituency" ||
              form.scope === "ward"
            ) && (

              <div className="edit-form-group">

                <label htmlFor="election-constituency">
                  Constituency
                  <span>*</span>
                </label>

                <input
                  id="election-constituency"
                  type="text"
                  value={form.constituency}
                  onChange={(event) =>
                    updateField(
                      "constituency",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Mwatate"
                  disabled={
                    !isDraft ||
                    isCancelled ||
                    isResults
                  }
                  className={
                    fieldErrors.constituency
                      ? "input-error"
                      : ""
                  }
                />

                {fieldErrors.constituency && (
                  <small className="field-error">
                    {fieldErrors.constituency}
                  </small>
                )}

              </div>

            )}


            {form.scope === "ward" && (

              <div className="edit-form-group">

                <label htmlFor="election-ward">
                  Ward
                  <span>*</span>
                </label>

                <input
                  id="election-ward"
                  type="text"
                  value={form.ward}
                  onChange={(event) =>
                    updateField(
                      "ward",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Bura"
                  disabled={
                    !isDraft ||
                    isCancelled ||
                    isResults
                  }
                  className={
                    fieldErrors.ward
                      ? "input-error"
                      : ""
                  }
                />

                {fieldErrors.ward && (
                  <small className="field-error">
                    {fieldErrors.ward}
                  </small>
                )}

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            TIMELINE
        ================================================= */}

        <section className="edit-card">

          <div className="edit-card-header">

            <div className="edit-card-icon">
              <FaCalendarAlt />
            </div>

            <div>

              <h2>
                {isNomination
                  ? "Nomination Timeline"
                  : "Election Timeline"}
              </h2>

              <p>
                {isNomination
                  ? "Set the period during which members can submit nomination applications."
                  : "Set the application and voting periods for this election."}
              </p>

            </div>

          </div>


          {isNomination ? (

            <>
              <div className="timeline-notice nomination">

                <FaUserCheck />

                <span>
                  Nomination exercises do not have
                  a voting period. After applications
                  close, applications proceed through
                  the designated vetting process and
                  approved applicants can be appointed.
                </span>

              </div>


              <div className="edit-form-grid">

                <div className="edit-form-group">

                  <label htmlFor="application-start">
                    Applications Open
                    <span>*</span>
                  </label>

                  <input
                    id="application-start"
                    type="datetime-local"
                    value={
                      form.applicationStart
                    }
                    onChange={(event) =>
                      updateField(
                        "applicationStart",
                        event.target.value
                      )
                    }
                    disabled={
                      !isDraft ||
                      isCancelled ||
                      isResults
                    }
                    className={
                      fieldErrors.applicationStart
                        ? "input-error"
                        : ""
                    }
                  />

                  {fieldErrors.applicationStart && (
                    <small className="field-error">
                      {
                        fieldErrors.applicationStart
                      }
                    </small>
                  )}

                </div>


                <div className="edit-form-group">

                  <label htmlFor="application-end">
                    Applications Close
                    <span>*</span>
                  </label>

                  <input
                    id="application-end"
                    type="datetime-local"
                    value={
                      form.applicationEnd
                    }
                    onChange={(event) =>
                      updateField(
                        "applicationEnd",
                        event.target.value
                      )
                    }
                    disabled={
                      !isDraft ||
                      isCancelled ||
                      isResults
                    }
                    className={
                      fieldErrors.applicationEnd
                        ? "input-error"
                        : ""
                    }
                  />

                  {fieldErrors.applicationEnd && (
                    <small className="field-error">
                      {
                        fieldErrors.applicationEnd
                      }
                    </small>
                  )}

                </div>

              </div>
            </>

          ) : (

            <>
              <div className="timeline-notice">

                <FaInfoCircle />

                <span>
                  The timeline must follow this
                  order: Applications Open →
                  Applications Close →
                  Voting Opens →
                  Voting Closes.
                </span>

              </div>


              <div className="edit-form-grid">

                <div className="edit-form-group">

                  <label htmlFor="application-start">
                    Applications Open
                    <span>*</span>
                  </label>

                  <input
                    id="application-start"
                    type="datetime-local"
                    value={
                      form.applicationStart
                    }
                    onChange={(event) =>
                      updateField(
                        "applicationStart",
                        event.target.value
                      )
                    }
                    disabled={
                      !isDraft ||
                      isCancelled ||
                      isResults
                    }
                    className={
                      fieldErrors.applicationStart
                        ? "input-error"
                        : ""
                    }
                  />

                  {fieldErrors.applicationStart && (
                    <small className="field-error">
                      {
                        fieldErrors.applicationStart
                      }
                    </small>
                  )}

                </div>


                <div className="edit-form-group">

                  <label htmlFor="application-end">
                    Applications Close
                    <span>*</span>
                  </label>

                  <input
                    id="application-end"
                    type="datetime-local"
                    value={
                      form.applicationEnd
                    }
                    onChange={(event) =>
                      updateField(
                        "applicationEnd",
                        event.target.value
                      )
                    }
                    disabled={
                      !isDraft ||
                      isCancelled ||
                      isResults
                    }
                    className={
                      fieldErrors.applicationEnd
                        ? "input-error"
                        : ""
                    }
                  />

                  {fieldErrors.applicationEnd && (
                    <small className="field-error">
                      {
                        fieldErrors.applicationEnd
                      }
                    </small>
                  )}

                </div>


                <div className="timeline-divider">
                  <FaArrowRight />
                </div>


                <div className="edit-form-group">

                  <label htmlFor="voting-start">
                    Voting Opens
                    <span>*</span>
                  </label>

                  <input
                    id="voting-start"
                    type="datetime-local"
                    value={
                      form.votingStart
                    }
                    onChange={(event) =>
                      updateField(
                        "votingStart",
                        event.target.value
                      )
                    }
                    disabled={
                      !isDraft ||
                      isCancelled ||
                      isResults
                    }
                    className={
                      fieldErrors.votingStart
                        ? "input-error"
                        : ""
                    }
                  />

                  {fieldErrors.votingStart && (
                    <small className="field-error">
                      {
                        fieldErrors.votingStart
                      }
                    </small>
                  )}

                </div>


                <div className="edit-form-group">

                  <label htmlFor="voting-end">
                    Voting Closes
                    <span>*</span>
                  </label>

                  <input
                    id="voting-end"
                    type="datetime-local"
                    value={
                      form.votingEnd
                    }
                    onChange={(event) =>
                      updateField(
                        "votingEnd",
                        event.target.value
                      )
                    }
                    disabled={
                      !isDraft ||
                      isCancelled ||
                      isResults
                    }
                    className={
                      fieldErrors.votingEnd
                        ? "input-error"
                        : ""
                    }
                  />

                  {fieldErrors.votingEnd && (
                    <small className="field-error">
                      {
                        fieldErrors.votingEnd
                      }
                    </small>
                  )}

                </div>

              </div>
            </>
          )}

        </section>


        {/* =================================================
            POSITIONS
        ================================================= */}

        <section className="edit-card">

          <div className="edit-card-header">

            <div className="edit-card-icon">
              {isNomination ? (
                <FaUserCheck />
              ) : (
                <FaVoteYea />
              )}
            </div>

            <div>

              <h2>
                {isNomination
                  ? "Nomination Positions"
                  : "Election Positions"}
              </h2>

              <p>
                {isNomination
                  ? "Manage the positions for which members may submit nomination applications."
                  : "Manage the positions that will appear on the ballot."}
              </p>

            </div>

          </div>


          {!isDraft && (

            <div className="position-lock-notice">

              <FaInfoCircle />

              <span>
                Position changes are locked
                because this exercise is no
                longer in draft status.
              </span>

            </div>

          )}


          {positionError && (

            <div className="position-error">

              <FaExclamationCircle />

              <span>
                {positionError}
              </span>

            </div>

          )}


          <div className="positions-editor">


            {/* ==========================================
                EXISTING POSITIONS
            ========================================== */}

            {existingPositions.length > 0 && (

              <div className="existing-positions">

                <div className="position-section-title">
                  Existing Positions
                </div>


                {existingPositions.map(
                  (position, index) => {

                    const positionId =
                      position?._id ||
                      position?.id ||
                      `existing-${index}`;

                    const positionLevel =
                      position.level ||
                      form.scope ||
                      "regional";

                    return (
                      <div
                        className="existing-position"
                        key={positionId}
                      >

                        <div className="position-index">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>


                        <div className="position-info">

                          {isDraft ? (

                            <div className="position-edit-fields">

                              <div className="edit-form-group">

                                <label>
                                  Position Name
                                  <span>*</span>
                                </label>

                                <input
                                  type="text"
                                  value={
                                    position.name ||
                                    position.title ||
                                    ""
                                  }
                                  onChange={(event) =>
                                    updateExistingPosition(
                                      positionId,
                                      "name",
                                      event.target.value
                                    )
                                  }
                                  placeholder="e.g. Regional Youth Assembly Speaker"
                                  disabled={
                                    saving
                                  }
                                />

                              </div>


                              <div className="edit-form-group">

                                <label>
                                  Description
                                </label>

                                <input
                                  type="text"
                                  value={
                                    position.description ||
                                    ""
                                  }
                                  onChange={(event) =>
                                    updateExistingPosition(
                                      positionId,
                                      "description",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Optional position description"
                                  disabled={
                                    saving
                                  }
                                />

                              </div>


                              <div className="edit-form-grid">

                                <div className="edit-form-group">

                                  <label>
                                    Position Level
                                    <span>*</span>
                                  </label>

                                  <select
                                    value={
                                      positionLevel
                                    }
                                    onChange={(event) =>
                                      updateExistingPosition(
                                        positionId,
                                        "level",
                                        event.target.value
                                      )
                                    }
                                    disabled={
                                      saving
                                    }
                                  >

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


                                <div className="edit-form-group">

                                  <label>
                                    Maximum Winners
                                    <span>*</span>
                                  </label>

                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={
                                      position.maxWinners ||
                                      1
                                    }
                                    onChange={(event) =>
                                      updateExistingPosition(
                                        positionId,
                                        "maxWinners",
                                        event.target.value
                                      )
                                    }
                                    disabled={
                                      saving
                                    }
                                  />

                                </div>

                              </div>


                              {positionLevel !==
                                "regional" && (

                                <div className="edit-form-grid">

                                  <div className="edit-form-group">

                                    <label>
                                      County
                                      <span>*</span>
                                    </label>

                                    <input
                                      type="text"
                                      value={
                                        position.county ||
                                        ""
                                      }
                                      onChange={(event) =>
                                        updateExistingPosition(
                                          positionId,
                                          "county",
                                          event.target.value
                                        )
                                      }
                                      placeholder="e.g. Taita Taveta"
                                      disabled={
                                        saving
                                      }
                                    />

                                  </div>


                                  {(
                                    positionLevel ===
                                      "constituency" ||
                                    positionLevel ===
                                      "ward"
                                  ) && (

                                    <div className="edit-form-group">

                                      <label>
                                        Constituency
                                        <span>*</span>
                                      </label>

                                      <input
                                        type="text"
                                        value={
                                          position.constituency ||
                                          ""
                                        }
                                        onChange={(event) =>
                                          updateExistingPosition(
                                            positionId,
                                            "constituency",
                                            event.target.value
                                          )
                                        }
                                        placeholder="e.g. Mwatate"
                                        disabled={
                                          saving
                                        }
                                      />

                                    </div>

                                  )}


                                  {positionLevel ===
                                    "ward" && (

                                    <div className="edit-form-group">

                                      <label>
                                        Ward
                                        <span>*</span>
                                      </label>

                                      <input
                                        type="text"
                                        value={
                                          position.ward ||
                                          ""
                                        }
                                        onChange={(event) =>
                                          updateExistingPosition(
                                            positionId,
                                            "ward",
                                            event.target.value
                                          )
                                        }
                                        placeholder="e.g. Bura"
                                        disabled={
                                          saving
                                        }
                                      />

                                    </div>

                                  )}

                                </div>

                              )}

                            </div>

                          ) : (

                            <>

                              <strong>
                                {position.name ||
                                  position.title ||
                                  `Position ${index + 1}`}
                              </strong>

                              {position.description && (

                                <span>
                                  {
                                    position.description
                                  }
                                </span>

                              )}

                              <div className="position-meta">

                                <span>
                                  {getPositionLevelLabel(
                                    positionLevel
                                  )}
                                </span>

                                {position.maxWinners && (
                                  <span>
                                    {position.maxWinners}
                                    {" "}
                                    winner
                                    {Number(
                                      position.maxWinners
                                    ) === 1
                                      ? ""
                                      : "s"}
                                  </span>
                                )}

                              </div>

                            </>

                          )}

                        </div>


                        {isDraft && (

                          <button
                            type="button"
                            className="position-delete-button"
                            onClick={() =>
                              setDeletePosition(
                                position
                              )
                            }
                            disabled={saving}
                            aria-label={`Delete ${
                              position.name ||
                              "position"
                            }`}
                          >
                            <FaTrash />
                          </button>

                        )}

                      </div>
                    );

                  }
                )}

              </div>

            )}


            {/* ==========================================
                NEW POSITIONS
            ========================================== */}

            {newPositions.length > 0 && (

              <div className="new-positions">

                <div className="position-section-title">
                  New Positions
                </div>


                {newPositions.map(
                  (position, index) => {

                    const positionLevel =
                      position.level ||
                      form.scope ||
                      "regional";

                    return (
                      <div
                        className="new-position-card"
                        key={
                          position.clientId
                        }
                      >

                        <div className="new-position-header">

                          <div>

                            <span>
                              New Position
                            </span>

                            <strong>
                              #{index + 1}
                            </strong>

                          </div>

                          <button
                            type="button"
                            className="remove-new-position"
                            onClick={() =>
                              removeNewPosition(
                                position.clientId
                              )
                            }
                            disabled={saving}
                            aria-label="Remove new position"
                          >
                            <FaTimes />
                          </button>

                        </div>


                        <div className="edit-form-grid">


                          <div className="edit-form-group">

                            <label>
                              Position Name
                              <span>*</span>
                            </label>

                            <input
                              type="text"
                              value={
                                position.name
                              }
                              onChange={(event) =>
                                updateNewPosition(
                                  position.clientId,
                                  "name",
                                  event.target.value
                                )
                              }
                              placeholder="e.g. Regional Youth Assembly Speaker"
                              disabled={
                                saving
                              }
                            />

                          </div>


                          <div className="edit-form-group">

                            <label>
                              Position Level
                              <span>*</span>
                            </label>

                            <select
                              value={
                                positionLevel
                              }
                              onChange={(event) =>
                                updateNewPosition(
                                  position.clientId,
                                  "level",
                                  event.target.value
                                )
                              }
                              disabled={
                                saving
                              }
                            >

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


                          <div className="edit-form-group">

                            <label>
                              Maximum Winners
                              <span>*</span>
                            </label>

                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={
                                position.maxWinners ||
                                1
                              }
                              onChange={(event) =>
                                updateNewPosition(
                                  position.clientId,
                                  "maxWinners",
                                  event.target.value
                                )
                              }
                              disabled={
                                saving
                              }
                            />

                          </div>


                          <div className="edit-form-group full-width">

                            <label>
                              Position Description
                            </label>

                            <textarea
                              value={
                                position.description
                              }
                              onChange={(event) =>
                                updateNewPosition(
                                  position.clientId,
                                  "description",
                                  event.target.value
                                )
                              }
                              placeholder="Describe the responsibilities or purpose of this position..."
                              rows={3}
                              disabled={
                                saving
                              }
                            />

                          </div>


                          {positionLevel !==
                            "regional" && (

                            <div className="edit-form-group">

                              <label>
                                County
                                <span>*</span>
                              </label>

                              <input
                                type="text"
                                value={
                                  position.county
                                }
                                onChange={(event) =>
                                  updateNewPosition(
                                    position.clientId,
                                    "county",
                                    event.target.value
                                  )
                                }
                                placeholder="e.g. Taita Taveta"
                                disabled={
                                  saving
                                }
                              />

                            </div>

                          )}


                          {(
                            positionLevel ===
                              "constituency" ||
                            positionLevel ===
                              "ward"
                          ) && (

                            <div className="edit-form-group">

                              <label>
                                Constituency
                                <span>*</span>
                              </label>

                              <input
                                type="text"
                                value={
                                  position.constituency
                                }
                                onChange={(event) =>
                                  updateNewPosition(
                                    position.clientId,
                                    "constituency",
                                    event.target.value
                                  )
                                }
                                placeholder="e.g. Mwatate"
                                disabled={
                                  saving
                                }
                              />

                            </div>

                          )}


                          {positionLevel ===
                            "ward" && (

                            <div className="edit-form-group">

                              <label>
                                Ward
                                <span>*</span>
                              </label>

                              <input
                                type="text"
                                value={
                                  position.ward
                                }
                                onChange={(event) =>
                                  updateNewPosition(
                                    position.clientId,
                                    "ward",
                                    event.target.value
                                  )
                                }
                                placeholder="e.g. Bura"
                                disabled={
                                  saving
                                }
                              />

                            </div>

                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}


            {/* ==========================================
                EMPTY STATE
            ========================================== */}

            {existingPositions.length === 0 &&
              newPositions.length === 0 && (

              <div className="positions-empty">

                <div className="positions-empty-icon">
                  {isNomination ? (
                    <FaUserCheck />
                  ) : (
                    <FaVoteYea />
                  )}
                </div>

                <h3>
                  No Positions Configured
                </h3>

                <p>
                  Add at least one position
                  before opening this exercise
                  for applications.
                </p>

              </div>

            )}


            {/* ==========================================
                ADD POSITION
            ========================================== */}

            {isDraft && (

              <button
                type="button"
                className="add-position-button"
                onClick={addPositionRow}
                disabled={saving}
              >
                <FaPlus />
                Add Position
              </button>

            )}

          </div>

        </section>


        {/* =================================================
            WORKFLOW SUMMARY
        ================================================= */}

        <section className="edit-workflow-summary">

          <div className="workflow-summary-icon">
            {isNomination ? (
              <FaUserCheck />
            ) : (
              <FaVoteYea />
            )}
          </div>

          <div>

            <h3>
              {isNomination
                ? "Nomination Workflow"
                : "Elective Workflow"}
            </h3>

            {isNomination ? (

              <p>
                Applications will be received during
                the application period, reviewed by
                the designated vetting committee and,
                once approved, appointed directly.
                No voting or election results will be
                generated for this exercise.
              </p>

            ) : (

              <p>
                Applications will be received during
                the application period, approved
                applicants will become aspirants,
                eligible members will vote during the
                voting period, and results can then be
                published.
              </p>

            )}

          </div>

        </section>


        {/* =================================================
            FORM FOOTER
        ================================================= */}

        <div className="edit-form-footer">

          <div className="footer-note">

            <FaInfoCircle />

            <span>
              {isDraft
                ? "Changes will be saved to the exercise immediately."
                : "Only fields permitted by the current exercise status can be changed."}
            </span>

          </div>


          <div className="footer-actions">

            <button
              type="button"
              className="footer-cancel"
              onClick={handleCancel}
              disabled={saving}
            >
              <FaTimes />
              Cancel
            </button>


            <button
              type="submit"
              className="footer-save"
              disabled={
                saving ||
                isCancelled ||
                isResults
              }
            >

              {saving ? (
                <>
                  <span className="button-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  Save Changes
                </>
              )}

            </button>

          </div>

        </div>

      </form>


      {/* ==================================================
          DELETE POSITION MODAL
      ================================================== */}

      {deletePosition && (

        <div
          className="delete-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setDeletePosition(null);
            }

          }}
        >

          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
          >

            <div className="delete-modal-icon">
              <FaTrash />
            </div>

            <h2>
              Remove Position?
            </h2>

            <p>
              You are about to remove
              <strong>
                {" "}
                {deletePosition.name ||
                  deletePosition.title ||
                  "this position"}
              </strong>
              {" "}
              from this exercise.
            </p>

            <p className="delete-modal-warning">
              This action cannot be undone.
            </p>


            <div className="delete-modal-actions">

              <button
                type="button"
                className="delete-modal-cancel"
                onClick={() =>
                  setDeletePosition(null)
                }
                disabled={saving}
              >
                Keep Position
              </button>

              <button
                type="button"
                className="delete-modal-confirm"
                onClick={
                  handleDeletePosition
                }
                disabled={saving}
              >

                {saving ? (
                  <>
                    <span className="button-spinner" />
                    Removing...
                  </>
                ) : (
                  <>
                    <FaTrash />
                    Remove Position
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


export default EditElection;