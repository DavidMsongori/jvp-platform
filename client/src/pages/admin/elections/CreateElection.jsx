import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
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

import "./createelection.css";

/* ==========================================================
   HELPERS
========================================================== */

const createEmptyPosition = (scope = "regional") => ({
  id: `position-${Date.now()}-${Math.random()}`,
  name: "",
  description: "",
  level: scope,
  county: "",
  constituency: "",
  ward: "",
  maxWinners: 1,
});

const formatApiError = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to create the election. Please try again."
  );
};

const convertDateTimeForApi = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

/* ==========================================================
   COMPONENT
========================================================== */

const CreateElection = () => {
  const navigate = useNavigate();

  /* ========================================================
     FORM
  ======================================================== */

  const [form, setForm] = useState({
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
  });

  const [positions, setPositions] = useState([
    createEmptyPosition("regional"),
  ]);

  /* ========================================================
     UI STATE
  ======================================================== */

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /* ========================================================
     FORM CHANGE
  ======================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setError("");
  };

  /* ========================================================
     ELECTION TYPE CHANGE
  ======================================================== */

  const handleTypeChange = (type) => {
    setForm((previous) => ({
      ...previous,
      type,
      ...(type === "nomination"
        ? {
            votingStart: "",
            votingEnd: "",
          }
        : {}),
    }));

    setFieldErrors({});
    setError("");
  };

  /* ========================================================
     SCOPE CHANGE
  ======================================================== */

  const handleScopeChange = (event) => {
    const scope = event.target.value;

    setForm((previous) => ({
      ...previous,
      scope,

      county:
        scope === "county" ||
        scope === "constituency" ||
        scope === "ward"
          ? previous.county
          : "",

      constituency:
        scope === "constituency" ||
        scope === "ward"
          ? previous.constituency
          : "",

      ward: scope === "ward" ? previous.ward : "",
    }));

    /*
      Keep all configured positions aligned with
      the election scope.
    */
    setPositions((previous) =>
      previous.map((position) => ({
        ...position,
        level: scope,
        county:
          scope === "county" ||
          scope === "constituency" ||
          scope === "ward"
            ? position.county
            : "",
        constituency:
          scope === "constituency" ||
          scope === "ward"
            ? position.constituency
            : "",
        ward: scope === "ward" ? position.ward : "",
      }))
    );

    setFieldErrors({});
    setError("");
  };

  /* ========================================================
     POSITION CHANGE
  ======================================================== */

  const handlePositionChange = (
    positionId,
    field,
    value
  ) => {
    setPositions((previous) =>
      previous.map((position) =>
        position.id === positionId
          ? {
              ...position,
              [field]: value,
            }
          : position
      )
    );

    setFieldErrors((previous) => {
      const next = { ...previous };

      const index = positions.findIndex(
        (position) => position.id === positionId
      );

      if (field === "name") {
        next[`position-${index}`] = "";
      }

      if (field === "level") {
        next[`position-level-${index}`] = "";
      }

      if (
        field === "county" ||
        field === "constituency" ||
        field === "ward"
      ) {
        next[`position-${field}-${index}`] = "";
      }

      return next;
    });

    setError("");
  };

  /* ========================================================
     ADD POSITION
  ======================================================== */

  const handleAddPosition = () => {
    setPositions((previous) => [
      ...previous,
      createEmptyPosition(form.scope),
    ]);
  };

  /* ========================================================
     REMOVE POSITION
  ======================================================== */

  const handleRemovePosition = (positionId) => {
    if (positions.length === 1) {
      return;
    }

    setPositions((previous) =>
      previous.filter(
        (position) => position.id !== positionId
      )
    );

    setError("");
  };

  /* ========================================================
     POSITION LOCATION VALIDATION
  ======================================================== */

  const validatePosition = (position, index, errors) => {
    if (!position.name.trim()) {
      errors[`position-${index}`] =
        `Position ${index + 1} requires a name.`;
    }

    if (!position.level) {
      errors[`position-level-${index}`] =
        `Position ${index + 1} requires a level.`;
    }

    if (position.level !== form.scope) {
      errors[`position-level-${index}`] =
        `Position ${index + 1} level must match the election scope.`;
    }

    if (
      position.level === "county" ||
      position.level === "constituency" ||
      position.level === "ward"
    ) {
      if (!position.county.trim()) {
        errors[`position-county-${index}`] =
          `County is required for position ${index + 1}.`;
      }
    }

    if (
      position.level === "constituency" ||
      position.level === "ward"
    ) {
      if (!position.constituency.trim()) {
        errors[`position-constituency-${index}`] =
          `Constituency is required for position ${index + 1}.`;
      }
    }

    if (position.level === "ward") {
      if (!position.ward.trim()) {
        errors[`position-ward-${index}`] =
          `Ward is required for position ${index + 1}.`;
      }
    }

    if (
      !position.maxWinners ||
      Number(position.maxWinners) < 1
    ) {
      errors[`position-winners-${index}`] =
        `Position ${index + 1} must have at least one winner.`;
    }
  };

  /* ========================================================
     VALIDATION
  ======================================================== */

  const validateForm = () => {
    const errors = {};

    /* ======================================================
       BASIC INFORMATION
    ====================================================== */

    if (!form.name.trim()) {
      errors.name = "Election name is required.";
    }

    /* ======================================================
       ELECTION TYPE
    ====================================================== */

    if (
      !form.type ||
      !["elective", "nomination"].includes(form.type)
    ) {
      errors.type = "Please select an election type.";
    }

    if (
      form.type === "nomination" &&
      !form.vettingCommittee.trim()
    ) {
      errors.vettingCommittee =
        "Vetting committee is required for a nomination exercise.";
    }

    /* ======================================================
       SCOPE
    ====================================================== */

    if (!form.scope) {
      errors.scope =
        "Please select an election scope.";
    }

    if (
      form.scope === "county" ||
      form.scope === "constituency" ||
      form.scope === "ward"
    ) {
      if (!form.county.trim()) {
        errors.county =
          "County is required for this election scope.";
      }
    }

    if (
      form.scope === "constituency" ||
      form.scope === "ward"
    ) {
      if (!form.constituency.trim()) {
        errors.constituency =
          "Constituency is required for this election scope.";
      }
    }

    if (form.scope === "ward") {
      if (!form.ward.trim()) {
        errors.ward =
          "Ward is required for a ward election.";
      }
    }

    /* ======================================================
       APPLICATION TIMELINE
    ====================================================== */

    if (!form.applicationStart) {
      errors.applicationStart =
        "Application opening date is required.";
    }

    if (!form.applicationEnd) {
      errors.applicationEnd =
        "Application closing date is required.";
    }

    if (
      form.applicationStart &&
      form.applicationEnd
    ) {
      const applicationStart =
        new Date(form.applicationStart);

      const applicationEnd =
        new Date(form.applicationEnd);

      if (applicationEnd <= applicationStart) {
        errors.applicationEnd =
          "Application closing date must be after the opening date.";
      }
    }

    /* ======================================================
       ELECTIVE VOTING TIMELINE
    ====================================================== */

    if (form.type === "elective") {
      if (!form.votingStart) {
        errors.votingStart =
          "Voting opening date is required for an elective election.";
      }

      if (!form.votingEnd) {
        errors.votingEnd =
          "Voting closing date is required for an elective election.";
      }

      if (
        form.votingStart &&
        form.votingEnd
      ) {
        const votingStart =
          new Date(form.votingStart);

        const votingEnd =
          new Date(form.votingEnd);

        if (votingEnd <= votingStart) {
          errors.votingEnd =
            "Voting closing date must be after the opening date.";
        }
      }

      if (
        form.applicationEnd &&
        form.votingStart
      ) {
        const applicationEnd =
          new Date(form.applicationEnd);

        const votingStart =
          new Date(form.votingStart);

        if (votingStart < applicationEnd) {
          errors.votingStart =
            "Voting should begin after the application period ends.";
        }
      }
    }

    /* ======================================================
       POSITIONS
    ====================================================== */

    if (!positions.length) {
      errors.positions =
        "At least one position is required.";
    }

    positions.forEach((position, index) => {
      validatePosition(
        position,
        index,
        errors
      );
    });

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  /* ========================================================
     CREATE ELECTION
  ======================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) {
      setError(
        "Please correct the highlighted fields before continuing."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setSubmitting(true);

      /* ======================================
         ELECTION PAYLOAD
      ====================================== */

      const electionPayload = {
        name: form.name.trim(),

        description: form.description.trim(),

        type: form.type,

        vettingCommittee:
          form.type === "nomination"
            ? form.vettingCommittee.trim()
            : "",

        scope: form.scope,

        county:
          form.scope === "county" ||
          form.scope === "constituency" ||
          form.scope === "ward"
            ? form.county.trim()
            : "",

        constituency:
          form.scope === "constituency" ||
          form.scope === "ward"
            ? form.constituency.trim()
            : "",

        ward:
          form.scope === "ward"
            ? form.ward.trim()
            : "",

        applicationStart:
          convertDateTimeForApi(
            form.applicationStart
          ),

        applicationEnd:
          convertDateTimeForApi(
            form.applicationEnd
          ),

        votingStart:
          form.type === "elective"
            ? convertDateTimeForApi(
                form.votingStart
              )
            : null,

        votingEnd:
          form.type === "elective"
            ? convertDateTimeForApi(
                form.votingEnd
              )
            : null,
      };

      /* ======================================
         CREATE ELECTION
      ====================================== */

      const electionResponse = await api.post(
        "/elections",
        electionPayload
      );

      const electionData =
        electionResponse?.data;

      const election =
        electionData?.data ||
        electionData?.election ||
        electionData;

      const electionId =
        election?._id ||
        election?.id ||
        electionData?._id ||
        electionData?.id;

      if (!electionId) {
        throw new Error(
          "Election was created but no election ID was returned by the server."
        );
      }

      /* ======================================
         CREATE POSITIONS
      ====================================== */

      for (
        const position of positions
      ) {
        const positionPayload = {
          name: position.name.trim(),

          description:
            position.description.trim(),

          level: position.level,

          county:
            position.level === "county" ||
            position.level === "constituency" ||
            position.level === "ward"
              ? (
                  position.county.trim() ||
                  form.county.trim()
                )
              : "",

          constituency:
            position.level === "constituency" ||
            position.level === "ward"
              ? (
                  position.constituency.trim() ||
                  form.constituency.trim()
                )
              : "",

          ward:
            position.level === "ward"
              ? (
                  position.ward.trim() ||
                  form.ward.trim()
                )
              : "",

          maxWinners: Number(
            position.maxWinners || 1
          ),
        };

        try {
          await api.post(
            `/elections/${electionId}/positions`,
            positionPayload
          );
        } catch (positionError) {
          throw new Error(
            `Election was created, but position "${position.name}" could not be created. ${
              formatApiError(positionError)
            }`
          );
        }
      }

      /* ======================================
         SUCCESS
      ====================================== */

      setSuccess(
        form.type === "nomination"
          ? "Nomination exercise created successfully."
          : "Election created successfully."
      );

      setTimeout(() => {
        navigate(
          `/admin/elections/${electionId}`
        );
      }, 700);
    } catch (err) {
      console.error(
        "Failed to create election:",
        err
      );

      setError(
        formatApiError(err)
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ========================================================
     CANCEL
  ======================================================== */

  const handleCancel = () => {
    if (submitting) {
      return;
    }

    navigate("/admin/elections");
  };

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="create-election-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="create-election-header">

        <div className="create-election-header-inner">

          <button
            type="button"
            className="create-election-back-btn"
            onClick={handleCancel}
            disabled={submitting}
          >
            <FaArrowLeft />

            <span>
              Back to Elections
            </span>
          </button>

          <div className="create-election-header-content">

            <div className="create-election-header-icon">
              <FaVoteYea />
            </div>

            <div>

              <span className="create-election-eyebrow">
                JVP CONNECT • ELECTIONS
              </span>

              <h1>
                Create Election
              </h1>

              <p>
                Set up a new JVP electoral or
                nomination exercise, define its
                scope, timeline, and positions.
              </p>

            </div>

          </div>

        </div>

      </header>

      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="create-election-container">

        {/* ==================================================
            ALERTS
        ================================================== */}

        {error && (
          <div className="create-election-alert error">

            <div className="create-election-alert-icon">
              !
            </div>

            <div>

              <strong>
                Unable to Create Election
              </strong>

              <p>
                {error}
              </p>

            </div>

          </div>
        )}

        {success && (
          <div className="create-election-alert success">

            <div className="create-election-alert-icon">
              <FaCheckCircle />
            </div>

            <div>

              <strong>
                {form.type === "nomination"
                  ? "Nomination Exercise Created"
                  : "Election Created"}
              </strong>

              <p>
                {success} Redirecting to
                election management...
              </p>

            </div>

          </div>
        )}

        <form
          className="create-election-form"
          onSubmit={handleSubmit}
        >

          {/* ==================================================
              BASIC INFORMATION
          ================================================== */}

          <section className="create-election-card">

            <div className="create-election-card-header">

              <div className="create-election-card-number">
                01
              </div>

              <div>

                <h2>
                  Election Information
                </h2>

                <p>
                  Provide the basic information
                  about this exercise.
                </p>

              </div>

            </div>

            <div className="create-election-card-body">

              <div className="create-election-field full">

                <label htmlFor="name">
                  Election Name
                  <span>*</span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={
                    form.type === "nomination"
                      ? "e.g. JVP Lamu County Youth Governor Nomination 2026"
                      : "e.g. JVP Regional Youth Assembly Election 2026"
                  }
                  className={
                    fieldErrors.name
                      ? "field-error"
                      : ""
                  }
                  maxLength={180}
                />

                {fieldErrors.name && (
                  <small className="create-election-field-error">
                    {fieldErrors.name}
                  </small>
                )}

              </div>

              <div className="create-election-field full">

                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder={
                    form.type === "nomination"
                      ? "Briefly describe the purpose of this nomination exercise and the positions to be filled..."
                      : "Briefly describe the purpose and scope of this election..."
                  }
                  rows={4}
                  maxLength={1000}
                />

                <div className="create-election-character-count">
                  {form.description.length}/1000
                </div>

              </div>

              {/* =================================================
                  ELECTION TYPE
              ================================================= */}

              <div className="create-election-field full">

                <label>
                  Election Type
                  <span>*</span>
                </label>

                <div className="create-election-type-options">

                  <label
                    className={
                      form.type === "elective"
                        ? "election-type-option selected"
                        : "election-type-option"
                    }
                  >

                    <input
                      type="radio"
                      name="electionType"
                      value="elective"
                      checked={
                        form.type === "elective"
                      }
                      onChange={() =>
                        handleTypeChange(
                          "elective"
                        )
                      }
                    />

                    <span className="election-type-option-icon elective">
                      <FaVoteYea />
                    </span>

                    <span className="election-type-option-content">

                      <strong>
                        Elective
                      </strong>

                      <small>
                        Members apply, approved
                        aspirants campaign, and
                        eligible members vote.
                      </small>

                    </span>

                  </label>

                  <label
                    className={
                      form.type === "nomination"
                        ? "election-type-option selected"
                        : "election-type-option"
                    }
                  >

                    <input
                      type="radio"
                      name="electionType"
                      value="nomination"
                      checked={
                        form.type === "nomination"
                      }
                      onChange={() =>
                        handleTypeChange(
                          "nomination"
                        )
                      }
                    />

                    <span className="election-type-option-icon nomination">
                      <FaUserCheck />
                    </span>

                    <span className="election-type-option-content">

                      <strong>
                        Nomination
                      </strong>

                      <small>
                        Members apply, a vetting
                        committee reviews candidates,
                        and approved applicants are
                        appointed.
                      </small>

                    </span>

                  </label>

                </div>

                {fieldErrors.type && (
                  <small className="create-election-field-error">
                    {fieldErrors.type}
                  </small>
                )}

              </div>

              {/* =================================================
                  VETTING COMMITTEE
              ================================================= */}

              {form.type === "nomination" && (
                <div className="create-election-field full">

                  <label htmlFor="vettingCommittee">
                    Vetting Committee
                    <span>*</span>
                  </label>

                  <input
                    id="vettingCommittee"
                    name="vettingCommittee"
                    type="text"
                    value={
                      form.vettingCommittee
                    }
                    onChange={handleChange}
                    placeholder="e.g. JVP Regional Vetting Committee"
                    maxLength={180}
                    className={
                      fieldErrors.vettingCommittee
                        ? "field-error"
                        : ""
                    }
                  />

                  <small className="create-election-help-text">
                    Specify the committee responsible
                    for reviewing and vetting nomination
                    applications.
                  </small>

                  {fieldErrors.vettingCommittee && (
                    <small className="create-election-field-error">
                      {
                        fieldErrors.vettingCommittee
                      }
                    </small>
                  )}

                </div>
              )}

            </div>

          </section>

          {/* ==================================================
              SCOPE
          ================================================== */}

          <section className="create-election-card">

            <div className="create-election-card-header">

              <div className="create-election-card-number">
                02
              </div>

              <div>

                <h2>
                  Electoral Scope
                </h2>

                <p>
                  Define the geographical level
                  of the exercise.
                </p>

              </div>

            </div>

            <div className="create-election-card-body">

              <div className="create-election-scope-options">

                {[
                  {
                    value: "regional",
                    icon: "🌊",
                    title: "Regional",
                    description:
                      "Coast-wide JVP exercise",
                  },
                  {
                    value: "county",
                    icon: "🏛️",
                    title: "County",
                    description:
                      "County-level exercise",
                  },
                  {
                    value: "constituency",
                    icon: "📍",
                    title: "Constituency",
                    description:
                      "Constituency-level exercise",
                  },
                  {
                    value: "ward",
                    icon: "📌",
                    title: "Ward",
                    description:
                      "Ward-level exercise",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={
                      form.scope === option.value
                        ? "scope-option selected"
                        : "scope-option"
                    }
                  >

                    <input
                      type="radio"
                      name="scope"
                      value={option.value}
                      checked={
                        form.scope ===
                        option.value
                      }
                      onChange={
                        handleScopeChange
                      }
                    />

                    <span className="scope-option-icon">
                      {option.icon}
                    </span>

                    <span>

                      <strong>
                        {option.title}
                      </strong>

                      <small>
                        {option.description}
                      </small>

                    </span>

                  </label>
                ))}

              </div>

              {form.scope !== "regional" && (
                <div className="create-election-location-grid">

                  {/* COUNTY */}

                  <div className="create-election-field">

                    <label htmlFor="county">
                      County
                      <span>*</span>
                    </label>

                    <div className="create-election-input-icon">

                      <FaMapMarkerAlt />

                      <input
                        id="county"
                        name="county"
                        type="text"
                        value={form.county}
                        onChange={handleChange}
                        placeholder="e.g. Kilifi"
                        className={
                          fieldErrors.county
                            ? "field-error"
                            : ""
                        }
                      />

                    </div>

                    {fieldErrors.county && (
                      <small className="create-election-field-error">
                        {fieldErrors.county}
                      </small>
                    )}

                  </div>

                  {/* CONSTITUENCY */}

                  {(form.scope === "constituency" ||
                    form.scope === "ward") && (
                    <div className="create-election-field">

                      <label htmlFor="constituency">
                        Constituency
                        <span>*</span>
                      </label>

                      <div className="create-election-input-icon">

                        <FaMapMarkerAlt />

                        <input
                          id="constituency"
                          name="constituency"
                          type="text"
                          value={
                            form.constituency
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="e.g. Kilifi North"
                          className={
                            fieldErrors.constituency
                              ? "field-error"
                              : ""
                          }
                        />

                      </div>

                      {fieldErrors.constituency && (
                        <small className="create-election-field-error">
                          {
                            fieldErrors.constituency
                          }
                        </small>
                      )}

                    </div>
                  )}

                  {/* WARD */}

                  {form.scope === "ward" && (
                    <div className="create-election-field">

                      <label htmlFor="ward">
                        Ward
                        <span>*</span>
                      </label>

                      <div className="create-election-input-icon">

                        <FaMapMarkerAlt />

                        <input
                          id="ward"
                          name="ward"
                          type="text"
                          value={form.ward}
                          onChange={handleChange}
                          placeholder="e.g. Tezo"
                          className={
                            fieldErrors.ward
                              ? "field-error"
                              : ""
                          }
                        />

                      </div>

                      {fieldErrors.ward && (
                        <small className="create-election-field-error">
                          {fieldErrors.ward}
                        </small>
                      )}

                    </div>
                  )}

                </div>
              )}

            </div>

          </section>

          {/* ==================================================
              TIMELINE
          ================================================== */}

          <section className="create-election-card">

            <div className="create-election-card-header">

              <div className="create-election-card-number">
                03
              </div>

              <div>

                <h2>
                  {form.type === "nomination"
                    ? "Nomination Timeline"
                    : "Election Timeline"}
                </h2>

                <p>
                  {form.type === "nomination"
                    ? "Define when members can submit nomination applications."
                    : "Define when applications and voting will take place."}
                </p>

              </div>

            </div>

            <div className="create-election-card-body">

              <div className="create-election-timeline">

                {/* APPLICATION PERIOD */}

                <div className="timeline-group">

                  <div className="timeline-group-heading">

                    <div className="timeline-icon applications">
                      <FaCalendarAlt />
                    </div>

                    <div>

                      <h3>
                        Application Period
                      </h3>

                      <p>
                        When members can submit
                        applications for positions.
                      </p>

                    </div>

                  </div>

                  <div className="timeline-fields">

                    <div className="create-election-field">

                      <label htmlFor="applicationStart">
                        Opens
                        <span>*</span>
                      </label>

                      <input
                        id="applicationStart"
                        name="applicationStart"
                        type="datetime-local"
                        value={
                          form.applicationStart
                        }
                        onChange={
                          handleChange
                        }
                        className={
                          fieldErrors.applicationStart
                            ? "field-error"
                            : ""
                        }
                      />

                      {fieldErrors.applicationStart && (
                        <small className="create-election-field-error">
                          {
                            fieldErrors.applicationStart
                          }
                        </small>
                      )}

                    </div>

                    <div className="create-election-field">

                      <label htmlFor="applicationEnd">
                        Closes
                        <span>*</span>
                      </label>

                      <input
                        id="applicationEnd"
                        name="applicationEnd"
                        type="datetime-local"
                        value={
                          form.applicationEnd
                        }
                        onChange={
                          handleChange
                        }
                        className={
                          fieldErrors.applicationEnd
                            ? "field-error"
                            : ""
                        }
                      />

                      {fieldErrors.applicationEnd && (
                        <small className="create-election-field-error">
                          {
                            fieldErrors.applicationEnd
                          }
                        </small>
                      )}

                    </div>

                  </div>

                </div>

                {/* VOTING */}

                {form.type === "elective" && (
                  <div className="timeline-group">

                    <div className="timeline-group-heading">

                      <div className="timeline-icon voting">
                        <FaVoteYea />
                      </div>

                      <div>

                        <h3>
                          Voting Period
                        </h3>

                        <p>
                          When eligible members can
                          cast their votes.
                        </p>

                      </div>

                    </div>

                    <div className="timeline-fields">

                      <div className="create-election-field">

                        <label htmlFor="votingStart">
                          Opens
                          <span>*</span>
                        </label>

                        <input
                          id="votingStart"
                          name="votingStart"
                          type="datetime-local"
                          value={
                            form.votingStart
                          }
                          onChange={
                            handleChange
                          }
                          className={
                            fieldErrors.votingStart
                              ? "field-error"
                              : ""
                          }
                        />

                        {fieldErrors.votingStart && (
                          <small className="create-election-field-error">
                            {
                              fieldErrors.votingStart
                            }
                          </small>
                        )}

                      </div>

                      <div className="create-election-field">

                        <label htmlFor="votingEnd">
                          Closes
                          <span>*</span>
                        </label>

                        <input
                          id="votingEnd"
                          name="votingEnd"
                          type="datetime-local"
                          value={
                            form.votingEnd
                          }
                          onChange={
                            handleChange
                          }
                          className={
                            fieldErrors.votingEnd
                              ? "field-error"
                              : ""
                          }
                        />

                        {fieldErrors.votingEnd && (
                          <small className="create-election-field-error">
                            {
                              fieldErrors.votingEnd
                            }
                          </small>
                        )}

                      </div>

                    </div>

                  </div>
                )}

              </div>

              <div className="create-election-info-note">

                <FaInfoCircle />

                <p>

                  {form.type === "nomination" ? (
                    <>
                      This nomination exercise will
                      begin with the application period.
                      Applications will proceed through
                      committee review and vetting.
                      Approved applicants will be appointed
                      without a voting process.
                    </>
                  ) : (
                    <>
                      Voting should begin after the
                      application period has ended.
                      The election will initially be
                      created as a draft and can be
                      opened from the election
                      management workspace.
                    </>
                  )}

                </p>

              </div>

            </div>

          </section>

          {/* ==================================================
              POSITIONS
          ================================================== */}

          <section className="create-election-card">

            <div className="create-election-card-header">

              <div className="create-election-card-number">
                04
              </div>

              <div className="create-election-position-heading">

                <div>

                  <h2>
                    {form.type === "nomination"
                      ? "Nomination Positions"
                      : "Election Positions"}
                  </h2>

                  <p>
                    {form.type === "nomination"
                      ? "Add the leadership positions to be filled through nomination."
                      : "Add the leadership positions members will contest."}
                  </p>

                </div>

                <button
                  type="button"
                  className="create-election-add-position-btn"
                  onClick={
                    handleAddPosition
                  }
                  disabled={submitting}
                >
                  <FaPlus />

                  Add Position
                </button>

              </div>

            </div>

            <div className="create-election-card-body">

              <div className="create-election-positions">

                {positions.map(
                  (position, index) => (
                    <div
                      key={position.id}
                      className="create-election-position"
                    >

                      <div className="position-number">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </div>

                      <div className="position-fields">

                        {/* POSITION NAME */}

                        <div className="create-election-field">

                          <label
                            htmlFor={`position-name-${position.id}`}
                          >
                            Position Name
                            <span>*</span>
                          </label>

                          <input
                            id={`position-name-${position.id}`}
                            type="text"
                            value={
                              position.name
                            }
                            onChange={(event) =>
                              handlePositionChange(
                                position.id,
                                "name",
                                event.target.value
                              )
                            }
                            placeholder={
                              form.type === "nomination"
                                ? "e.g. Lamu County Youth Governor"
                                : "e.g. Regional Youth Assembly Speaker"
                            }
                            className={
                              fieldErrors[
                                `position-${index}`
                              ]
                                ? "field-error"
                                : ""
                            }
                          />

                          {fieldErrors[
                            `position-${index}`
                          ] && (
                            <small className="create-election-field-error">
                              {
                                fieldErrors[
                                  `position-${index}`
                                ]
                              }
                            </small>
                          )}

                        </div>

                        {/* POSITION LEVEL */}

                        <div className="create-election-field">

                          <label
                            htmlFor={`position-level-${position.id}`}
                          >
                            Position Level
                            <span>*</span>
                          </label>

                          <select
                            id={`position-level-${position.id}`}
                            value={
                              position.level
                            }
                            onChange={(event) =>
                              handlePositionChange(
                                position.id,
                                "level",
                                event.target.value
                              )
                            }
                            className={
                              fieldErrors[
                                `position-level-${index}`
                              ]
                                ? "field-error"
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

                          {fieldErrors[
                            `position-level-${index}`
                          ] && (
                            <small className="create-election-field-error">
                              {
                                fieldErrors[
                                  `position-level-${index}`
                                ]
                              }
                            </small>
                          )}

                        </div>

                        {/* DESCRIPTION */}

                        <div className="create-election-field full">

                          <label
                            htmlFor={`position-description-${position.id}`}
                          >
                            Description
                          </label>

                          <input
                            id={`position-description-${position.id}`}
                            type="text"
                            value={
                              position.description
                            }
                            onChange={(event) =>
                              handlePositionChange(
                                position.id,
                                "description",
                                event.target.value
                              )
                            }
                            placeholder="Optional description of the position"
                          />

                        </div>

                        {/* POSITION LOCATION */}

                        {position.level !==
                          "regional" && (
                          <>

                            <div className="create-election-field">

                              <label
                                htmlFor={`position-county-${position.id}`}
                              >
                                County
                                <span>*</span>
                              </label>

                              <input
                                id={`position-county-${position.id}`}
                                type="text"
                                value={
                                  position.county ||
                                  form.county
                                }
                                onChange={(event) =>
                                  handlePositionChange(
                                    position.id,
                                    "county",
                                    event.target.value
                                  )
                                }
                                placeholder={
                                  form.county ||
                                  "e.g. Kilifi"
                                }
                                className={
                                  fieldErrors[
                                    `position-county-${index}`
                                  ]
                                    ? "field-error"
                                    : ""
                                }
                              />

                              {fieldErrors[
                                `position-county-${index}`
                              ] && (
                                <small className="create-election-field-error">
                                  {
                                    fieldErrors[
                                      `position-county-${index}`
                                    ]
                                  }
                                </small>
                              )}

                            </div>

                            {(position.level ===
                              "constituency" ||
                              position.level ===
                                "ward") && (
                              <div className="create-election-field">

                                <label
                                  htmlFor={`position-constituency-${position.id}`}
                                >
                                  Constituency
                                  <span>*</span>
                                </label>

                                <input
                                  id={`position-constituency-${position.id}`}
                                  type="text"
                                  value={
                                    position.constituency ||
                                    form.constituency
                                  }
                                  onChange={(event) =>
                                    handlePositionChange(
                                      position.id,
                                      "constituency",
                                      event.target.value
                                    )
                                  }
                                  placeholder={
                                    form.constituency ||
                                    "e.g. Kilifi North"
                                  }
                                  className={
                                    fieldErrors[
                                      `position-constituency-${index}`
                                    ]
                                      ? "field-error"
                                      : ""
                                  }
                                />

                                {fieldErrors[
                                  `position-constituency-${index}`
                                ] && (
                                  <small className="create-election-field-error">
                                    {
                                      fieldErrors[
                                        `position-constituency-${index}`
                                      ]
                                    }
                                  </small>
                                )}

                              </div>
                            )}

                            {position.level ===
                              "ward" && (
                              <div className="create-election-field">

                                <label
                                  htmlFor={`position-ward-${position.id}`}
                                >
                                  Ward
                                  <span>*</span>
                                </label>

                                <input
                                  id={`position-ward-${position.id}`}
                                  type="text"
                                  value={
                                    position.ward ||
                                    form.ward
                                  }
                                  onChange={(event) =>
                                    handlePositionChange(
                                      position.id,
                                      "ward",
                                      event.target.value
                                    )
                                  }
                                  placeholder={
                                    form.ward ||
                                    "e.g. Tezo"
                                  }
                                  className={
                                    fieldErrors[
                                      `position-ward-${index}`
                                    ]
                                      ? "field-error"
                                      : ""
                                  }
                                />

                                {fieldErrors[
                                  `position-ward-${index}`
                                ] && (
                                  <small className="create-election-field-error">
                                    {
                                      fieldErrors[
                                        `position-ward-${index}`
                                      ]
                                    }
                                  </small>
                                )}

                              </div>
                            )}

                          </>
                        )}

                        {/* MAX WINNERS */}

                        <div className="create-election-field">

                          <label
                            htmlFor={`position-winners-${position.id}`}
                          >
                            Maximum Winners
                            <span>*</span>
                          </label>

                          <input
                            id={`position-winners-${position.id}`}
                            type="number"
                            min="1"
                            step="1"
                            value={
                              position.maxWinners
                            }
                            onChange={(event) =>
                              handlePositionChange(
                                position.id,
                                "maxWinners",
                                event.target.value
                              )
                            }
                            className={
                              fieldErrors[
                                `position-winners-${index}`
                              ]
                                ? "field-error"
                                : ""
                            }
                          />

                          {fieldErrors[
                            `position-winners-${index}`
                          ] && (
                            <small className="create-election-field-error">
                              {
                                fieldErrors[
                                  `position-winners-${index}`
                                ]
                              }
                            </small>
                          )}

                        </div>

                      </div>

                      <button
                        type="button"
                        className="create-election-remove-position"
                        onClick={() =>
                          handleRemovePosition(
                            position.id
                          )
                        }
                        disabled={
                          positions.length === 1 ||
                          submitting
                        }
                        title={
                          positions.length === 1
                            ? "At least one position is required"
                            : "Remove position"
                        }
                        aria-label="Remove position"
                      >
                        <FaTrash />
                      </button>

                    </div>
                  )
                )}

              </div>

              {fieldErrors.positions && (
                <small className="create-election-field-error">
                  {fieldErrors.positions}
                </small>
              )}

              <div className="create-election-position-summary">

                <FaCheckCircle />

                <span>
                  {positions.length}{" "}
                  {positions.length === 1
                    ? "position"
                    : "positions"}{" "}
                  configured for this{" "}
                  {form.type === "nomination"
                    ? "nomination exercise"
                    : "election"}.
                </span>

              </div>

            </div>

          </section>

          {/* ==================================================
              REVIEW
          ================================================== */}

          <section className="create-election-review">

            <div className="create-election-review-icon">
              <FaInfoCircle />
            </div>

            <div>

              <h3>
                Before you create this{" "}
                {form.type === "nomination"
                  ? "nomination exercise"
                  : "election"}
              </h3>

              <p>
                The{" "}
                {form.type === "nomination"
                  ? "nomination exercise"
                  : "election"}{" "}
                will be created as a
                <strong> Draft</strong>. Review
                the details and positions in the
                management workspace before
                opening applications to members.

                {form.type === "nomination" && (
                  <>
                    {" "}
                    Approved applicants will proceed
                    to appointment through the
                    nomination workflow and there
                    will be no voting stage.
                  </>
                )}
              </p>

            </div>

          </section>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="create-election-actions">

            <button
              type="button"
              className="create-election-cancel-btn"
              onClick={handleCancel}
              disabled={submitting}
            >
              <FaTimes />

              Cancel
            </button>

            <button
              type="submit"
              className="create-election-submit-btn"
              disabled={submitting}
            >

              {submitting ? (
                <>
                  <span className="create-election-button-spinner"></span>

                  Creating{" "}
                  {form.type === "nomination"
                    ? "Nomination..."
                    : "Election..."}
                </>
              ) : (
                <>
                  <FaSave />

                  Create{" "}
                  {form.type === "nomination"
                    ? "Nomination Exercise"
                    : "Election"}
                </>
              )}

            </button>

          </div>

        </form>

      </main>

    </div>
  );
};

export default CreateElection;