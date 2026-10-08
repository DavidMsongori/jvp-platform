import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import "./LeaderFormModal.css";

import memberService from "../../../../services/member.service";

import {
  LEADERSHIP_LEVELS,
  LEADERSHIP_CATEGORIES,
  LEADERSHIP_DEPARTMENTS,
  LEADERSHIP_SCOPE,
  APPOINTMENT_TYPES,
  OFFICE_CONFIGURATION,
} from "../../../../constants/leadership.constants";

/* ============================================================
   STANDARD ELECTED TERM
============================================================ */

const ELECTED_TERM_START = "2025-12-22";
const ELECTED_TERM_END = "2028-12-22";

/* ============================================================
   CATEGORY OPTIONS
============================================================ */

const CATEGORIES = [
  {
    label: "Patron",
    value: "patron",
  },
  {
    label: "Executive",
    value: LEADERSHIP_CATEGORIES.EXECUTIVE,
  },
  {
    label: "Legislative",
    value: LEADERSHIP_CATEGORIES.LEGISLATIVE,
  },
  {
    label: "Secretariat",
    value: LEADERSHIP_CATEGORIES.SECRETARIAT,
  },
  {
    label: "Patronage",
    value: LEADERSHIP_CATEGORIES.PATRONAGE,
  },
];

/* ============================================================
   LEADERSHIP LEVELS
============================================================ */

const LEADERSHIP_LEVEL_OPTIONS = [
  {
    label: "Regional Cabinet",
    value: LEADERSHIP_LEVELS.REGIONAL_CABINET,
  },
  {
    label: "Regional Youth Assembly",
    value: LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,
  },
  {
    label: "Council of Governors",
    value: LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
  },
  {
    label: "County Cabinet",
    value: LEADERSHIP_LEVELS.COUNTY_CABINET,
  },
  {
    label: "County Youth Assembly",
    value: LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,
  },
];

/* ============================================================
   DEPARTMENTS
============================================================ */

const DEPARTMENTS = [
  {
    label: "Executive",
    value: LEADERSHIP_DEPARTMENTS.EXECUTIVE,
  },
  {
    label: "Legislative",
    value: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
  },
  {
    label: "Secretariat",
    value: LEADERSHIP_DEPARTMENTS.SECRETARIAT,
  },
  {
    label: "Patronage",
    value:
      LEADERSHIP_DEPARTMENTS.PATRONAGE ||
      "patronage",
  },
];

/* ============================================================
   SCOPES
============================================================ */

const SCOPES = [
  {
    label: "Regional Cabinet",
    value: LEADERSHIP_SCOPE.REGIONAL_CABINET,
  },
  {
    label: "Regional Youth Assembly",
    value: LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,
  },
  {
    label: "County Cabinet",
    value: LEADERSHIP_SCOPE.COUNTY_CABINET,
  },
  {
    label: "County Youth Assembly",
    value: LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,
  },
];

/* ============================================================
   APPOINTMENT TYPES
============================================================ */

const APPOINTMENT_TYPE_OPTIONS = [
  {
    label: "Elected",
    value: APPOINTMENT_TYPES.ELECTED,
  },
  {
    label: "Nominated",
    value: APPOINTMENT_TYPES.NOMINATED,
  },
  {
    label: "Appointed",
    value: APPOINTMENT_TYPES.APPOINTED,
  },
  {
    label: "Honorary",
    value: "honorary",
  },
];

/* ============================================================
   POSITIONS
============================================================ */

const POSITIONS = Object.entries(
  OFFICE_CONFIGURATION
).map(
  ([value, configuration]) => ({
    value,
    label: configuration.title,
    configuration,
  })
);

/* ============================================================
   DEFAULT FORM
============================================================ */

const DEFAULT_FORM = {
  member: "",

  category: "",
  level: "",
  position: "",

  department: "",
  scope: "",
  appointmentType: "",

  county: "",
  constituency: "",
  ward: "",

  displayOrder: 999,
  featured: false,

  termStart: "",
  termEnd: "",

  verified: true,
  remarks: "",

  patron: {
    fullName: "",
    title: "",
    organization: "",
    photo: "",
    bio: "",
  },
};

/* ============================================================
   HELPERS
============================================================ */

const formatDateForInput = (date) => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate
    .toISOString()
    .split("T")[0];
};

const getMemberName = (member) => {
  if (!member) {
    return "";
  }

  return [
    member.firstName,
    member.middleName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

const getMemberLocation = (member) => {
  if (!member) {
    return "";
  }

  return [
    member.county,
    member.constituency,
    member.ward,
  ]
    .filter(Boolean)
    .join(" · ");
};

/* ============================================================
   COMPONENT
============================================================ */

export default function LeaderFormModal({
  open,
  leader = null,
  loading = false,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(
    DEFAULT_FORM
  );

  const [members, setMembers] = useState([]);

  const [selectedMember, setSelectedMember] =
    useState(null);

  const [memberSearch, setMemberSearch] =
    useState("");

  const [membersLoading, setMembersLoading] =
    useState(false);

  const [error, setError] = useState("");

  /* ==========================================================
     DERIVED VALUES
  ========================================================== */

  const isPatron =
    form.category === "patron" ||
    form.category ===
      LEADERSHIP_CATEGORIES.PATRONAGE;

  const isElected =
    form.appointmentType ===
    APPOINTMENT_TYPES.ELECTED;

  /* ==========================================================
     FILTER POSITIONS
  ========================================================== */

  const filteredPositions = useMemo(() => {
    let positions = POSITIONS;

    if (form.level) {
      positions = positions.filter(
        (position) =>
          position.configuration?.level ===
          form.level
      );
    }

    if (
      form.category &&
      !isPatron
    ) {
      positions = positions.filter(
        (position) =>
          position.configuration?.category ===
          form.category
      );
    }

    if (isPatron) {
      positions = positions.filter(
        (position) =>
          position.value === "patron"
      );
    }

    return positions;
  }, [
    form.level,
    form.category,
    isPatron,
  ]);

  /* ==========================================================
     INITIALIZE FORM
  ========================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (leader) {
      const leaderMember =
        leader.member &&
        typeof leader.member === "object"
          ? leader.member
          : null;

      const configuration =
        OFFICE_CONFIGURATION[
          leader.position
        ];

      const appointmentType =
        leader.appointmentType ||
        configuration?.appointmentType ||
        "";

      const isLeaderElected =
        appointmentType ===
        APPOINTMENT_TYPES.ELECTED;

      setForm({
        member:
          leader.member?._id ||
          leader.member ||
          "",

        category:
          leader.category ||
          configuration?.category ||
          "",

        level:
          leader.level ||
          configuration?.level ||
          "",

        position:
          leader.position ||
          "",

        department:
          leader.department ||
          configuration?.department ||
          "",

        scope:
          leader.scope ??
          configuration?.scope ??
          "",

        appointmentType,

        county:
          leader.county ||
          leaderMember?.county ||
          "",

        constituency:
          leader.constituency ||
          leaderMember?.constituency ||
          "",

        ward:
          leader.ward ||
          leaderMember?.ward ||
          "",

        displayOrder:
          leader.displayOrder ?? 999,

        featured:
          leader.featured ?? false,

        /*
         * Existing elected leaders with
         * missing dates receive the standard
         * elected term.
         *
         * Existing stored dates remain
         * unchanged.
         */
        termStart:
          isLeaderElected
            ? formatDateForInput(
                leader.termStart
              ) || ELECTED_TERM_START
            : formatDateForInput(
                leader.termStart
              ),

        termEnd:
          isLeaderElected
            ? formatDateForInput(
                leader.termEnd
              ) || ELECTED_TERM_END
            : formatDateForInput(
                leader.termEnd
              ),

        verified:
          leader.verified ?? true,

        remarks:
          leader.remarks || "",

        patron: {
          fullName:
            leader.patron?.fullName ||
            "",

          title:
            leader.patron?.title ||
            "",

          organization:
            leader.patron?.organization ||
            "",

          photo:
            leader.patron?.photo ||
            "",

          bio:
            leader.patron?.bio ||
            "",
        },
      });

      setSelectedMember(
        leaderMember
      );

      setMemberSearch(
        leaderMember
          ? getMemberName(
              leaderMember
            )
          : ""
      );
    } else {
      setForm({
        ...DEFAULT_FORM,

        patron: {
          ...DEFAULT_FORM.patron,
        },

        termStart: "",
        termEnd: "",
      });

      setSelectedMember(null);
      setMemberSearch("");
    }

    setMembers([]);
    setError("");
  }, [
    open,
    leader,
  ]);

  /* ==========================================================
     SEARCH MEMBERS
  ========================================================== */

  useEffect(() => {
    if (
      !open ||
      isPatron
    ) {
      setMembers([]);
      return;
    }

    const searchValue =
      memberSearch.trim();

    if (
      !searchValue ||
      form.member
    ) {
      setMembers([]);
      return;
    }

    let active = true;

    const loadMembers = async () => {
      try {
        setMembersLoading(true);

        const response =
          await memberService.searchMembers(
            searchValue
          );

        const results =
          response?.data ||
          response?.members ||
          response ||
          [];

        if (active) {
          setMembers(
            Array.isArray(results)
              ? results
              : []
          );
        }
      } catch (requestError) {
        console.error(
          "Member search failed:",
          requestError
        );

        if (active) {
          setMembers([]);
        }
      } finally {
        if (active) {
          setMembersLoading(false);
        }
      }
    };

    const timer = setTimeout(
      loadMembers,
      350
    );

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    open,
    memberSearch,
    form.member,
    isPatron,
  ]);

  /* ==========================================================
     FIELD HELPERS
  ========================================================== */

  const updateField = (
    field,
    value
  ) => {
    setForm((previous) => {
      /*
       * Elected leaders always use the
       * standard JVP elected term.
       */
      if (
        field === "appointmentType" &&
        value ===
          APPOINTMENT_TYPES.ELECTED
      ) {
        return {
          ...previous,

          appointmentType: value,

          termStart:
            ELECTED_TERM_START,

          termEnd:
            ELECTED_TERM_END,
        };
      }

      /*
       * If appointment type changes away
       * from Elected, clear the automatic
       * elected dates.
       */
      if (
        field === "appointmentType" &&
        value !==
          APPOINTMENT_TYPES.ELECTED &&
        previous.appointmentType ===
          APPOINTMENT_TYPES.ELECTED
      ) {
        return {
          ...previous,

          appointmentType: value,

          termStart: "",

          termEnd: "",
        };
      }

      return {
        ...previous,
        [field]: value,
      };
    });
  };

  const updatePatronField = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,

      patron: {
        ...previous.patron,
        [field]: value,
      },
    }));
  };

  /* ==========================================================
     LEVEL CHANGE
  ========================================================== */

  const handleLevelChange = (
    level
  ) => {
    setForm((previous) => ({
      ...previous,

      level,

      position: "",

      department: "",
      scope: "",
      appointmentType: "",

      /*
       * Reset term when the leadership
       * structure changes.
       */
      termStart: "",
      termEnd: "",
    }));
  };

  /* ==========================================================
     CATEGORY CHANGE
  ========================================================== */

  const handleCategoryChange = (
    category
  ) => {
    const patron =
      category === "patron" ||
      category ===
        LEADERSHIP_CATEGORIES.PATRONAGE;

    setForm((previous) => ({
      ...previous,

      category,

      position: "",

      level: patron
        ? ""
        : previous.level,

      member: patron
        ? ""
        : previous.member,

      appointmentType: patron
        ? "honorary"
        : previous.appointmentType,

      scope: patron
        ? ""
        : previous.scope,

      department: patron
        ? (
            LEADERSHIP_DEPARTMENTS.PATRONAGE ||
            "patronage"
          )
        : previous.department,

      /*
       * Patron does not use the elected
       * leadership term.
       */
      termStart: patron
        ? ""
        : previous.termStart,

      termEnd: patron
        ? ""
        : previous.termEnd,
    }));

    if (patron) {
      setSelectedMember(null);
      setMemberSearch("");
      setMembers([]);
    }
  };

  /* ==========================================================
     POSITION CHANGE
  ========================================================== */

  const handlePositionChange = (
    position
  ) => {
    const selectedPosition =
      POSITIONS.find(
        (item) =>
          item.value === position
      );

    if (!selectedPosition) {
      updateField(
        "position",
        position
      );

      return;
    }

    const configuration =
      selectedPosition.configuration;

    setForm((previous) => {
      const appointmentType =
        configuration.appointmentType ||
        previous.appointmentType;

      const isPositionElected =
        appointmentType ===
        APPOINTMENT_TYPES.ELECTED;

      return {
        ...previous,

        position,

        category:
          configuration.category ||
          previous.category,

        level:
          configuration.level ||
          "",

        department:
          configuration.department ||
          "",

        scope:
          configuration.scope ?? "",

        appointmentType,

        /*
         * If the office configuration itself
         * is Elected, apply the standard term.
         */
        termStart:
          isPositionElected
            ? ELECTED_TERM_START
            : previous.termStart,

        termEnd:
          isPositionElected
            ? ELECTED_TERM_END
            : previous.termEnd,
      };
    });
  };

  /* ==========================================================
     MEMBER SELECTION
  ========================================================== */

  const handleSelectMember = (
    member
  ) => {
    setSelectedMember(member);

    setForm((previous) => ({
      ...previous,

      member: member._id,

      county:
        member.county || "",

      constituency:
        member.constituency || "",

      ward:
        member.ward || "",
    }));

    setMemberSearch(
      getMemberName(member)
    );

    setMembers([]);
    setError("");
  };

  const handleRemoveSelectedMember =
    () => {
      setSelectedMember(null);

      setForm((previous) => ({
        ...previous,

        member: "",
        county: "",
        constituency: "",
        ward: "",
      }));

      setMemberSearch("");
      setMembers([]);
    };

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const validate = () => {
    if (!form.category) {
      return "Please select a leadership category.";
    }

    if (!isPatron && !form.level) {
      return "Please select a leadership level.";
    }

    if (!form.position) {
      return "Please select a leadership office.";
    }

    if (
      !isPatron &&
      !form.department
    ) {
      return "Please select a department.";
    }

    if (
      !isPatron &&
      !form.appointmentType
    ) {
      return "Please select an appointment type.";
    }

    if (
      !isPatron &&
      !form.member
    ) {
      return "Please search for and select a member.";
    }

    if (
      isPatron &&
      !form.patron.fullName.trim()
    ) {
      return "Patron full name is required.";
    }

    if (!form.termStart) {
      return "Term start date is required.";
    }

    if (
      form.termEnd &&
      new Date(form.termEnd) <
        new Date(form.termStart)
    ) {
      return "Term end date cannot be before the term start date.";
    }

    return null;
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    /*
     * Enforce the standard elected term
     * again at submission level.
     *
     * This guarantees that even if the
     * form state is changed unexpectedly,
     * elected leaders are submitted with
     * the correct term.
     */
    const finalTermStart =
      isElected
        ? ELECTED_TERM_START
        : form.termStart;

    const finalTermEnd =
      isElected
        ? ELECTED_TERM_END
        : form.termEnd || null;

    const payload = {
      category:
        form.category,

      level:
        form.level || null,

      position:
        form.position,

      department:
        form.department || null,

      scope:
        form.scope || null,

      appointmentType:
        form.appointmentType,

      displayOrder:
        Number(form.displayOrder),

      featured:
        Boolean(form.featured),

      termStart:
        finalTermStart,

      termEnd:
        finalTermEnd,

      verified:
        Boolean(form.verified),

      remarks:
        form.remarks.trim(),

      ...(isPatron
        ? {
            member: null,

            patron: {
              fullName:
                form.patron.fullName.trim(),

              title:
                form.patron.title.trim(),

              organization:
                form.patron.organization.trim(),

              photo:
                form.patron.photo.trim(),

              bio:
                form.patron.bio.trim(),
            },
          }
        : {
            member:
              form.member,

            county:
              selectedMember?.county ||
              form.county ||
              null,

            constituency:
              selectedMember?.constituency ||
              form.constituency ||
              null,

            ward:
              selectedMember?.ward ||
              form.ward ||
              null,
          }),
    };

    await onSave(payload);
  };

  /* ==========================================================
     CLOSE
  ========================================================== */

  const handleClose = () => {
    if (loading) {
      return;
    }

    setForm({
      ...DEFAULT_FORM,

      patron: {
        ...DEFAULT_FORM.patron,
      },
    });

    setSelectedMember(null);
    setMemberSearch("");
    setMembers([]);
    setError("");

    onClose();
  };

  if (!open) {
    return null;
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className="leader-form-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="leader-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leader-form-title"
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="leader-form-modal-header">
          <div className="leader-form-modal-heading">
            <div className="leader-form-modal-heading-icon">
              <ShieldCheck size={25} />
            </div>

            <div>
              <span>
                Leadership administration
              </span>

              <h2 id="leader-form-title">
                {leader
                  ? "Edit Leadership Assignment"
                  : "Assign New Leader"}
              </h2>

              <p>
                Assign an existing
                member to an official
                JVP leadership office.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="leader-form-modal-close"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close leadership form"
          >
            <X size={21} />
          </button>
        </header>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            className="leader-form-alert"
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              aria-label="Close error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <form
          className="leader-form"
          onSubmit={handleSubmit}
        >
          <div className="leader-form-modal-body">

            {/* =================================================
                SECTION 01
            ================================================= */}

            <section className="leader-form-section">
              <div className="leader-form-section-heading">
                <span className="leader-form-section-icon">
                  <BriefcaseBusiness size={20} />
                </span>

                <div>
                  <small>Section 01</small>

                  <h3>
                    Leadership Classification
                  </h3>

                  <p>
                    Select the leadership
                    structure and official
                    office.
                  </p>
                </div>
              </div>

              <div className="leader-form-grid">

                {/* CATEGORY */}

                <div className="leader-form-group">
                  <label htmlFor="leader-category">
                    Leadership Category
                    <span>*</span>
                  </label>

                  <select
                    id="leader-category"
                    value={form.category}
                    onChange={(event) =>
                      handleCategoryChange(
                        event.target.value
                      )
                    }
                    disabled={loading}
                  >
                    <option value="">
                      Select category
                    </option>

                    {CATEGORIES.map(
                      (category) => (
                        <option
                          key={
                            category.value
                          }
                          value={
                            category.value
                          }
                        >
                          {category.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* LEVEL */}

                {!isPatron && (
                  <div className="leader-form-group">
                    <label htmlFor="leader-level">
                      Leadership Level
                      <span>*</span>
                    </label>

                    <select
                      id="leader-level"
                      value={form.level}
                      onChange={(event) =>
                        handleLevelChange(
                          event.target.value
                        )
                      }
                      disabled={loading}
                    >
                      <option value="">
                        Select leadership level
                      </option>

                      {LEADERSHIP_LEVEL_OPTIONS
                        .filter(
                          (level) => {
                            if (
                              !form.category
                            ) {
                              return true;
                            }

                            return POSITIONS.some(
                              (position) =>
                                position.configuration
                                  ?.level ===
                                  level.value &&
                                position.configuration
                                  ?.category ===
                                  form.category
                            );
                          }
                        )
                        .map((level) => (
                          <option
                            key={
                              level.value
                            }
                            value={
                              level.value
                            }
                          >
                            {level.label}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* POSITION */}

                <div className="leader-form-group">
                  <label htmlFor="leader-position">
                    Leadership Office
                    <span>*</span>
                  </label>

                  <select
                    id="leader-position"
                    value={form.position}
                    onChange={(event) =>
                      handlePositionChange(
                        event.target.value
                      )
                    }
                    disabled={
                      loading ||
                      (!isPatron &&
                        !form.level)
                    }
                  >
                    <option value="">
                      {isPatron
                        ? "Select leadership office"
                        : form.level
                          ? "Select leadership office"
                          : "Select leadership level first"}
                    </option>

                    {filteredPositions.map(
                      (position) => (
                        <option
                          key={
                            position.value
                          }
                          value={
                            position.value
                          }
                        >
                          {position.label}
                        </option>
                      )
                    )}
                  </select>

                  {!isPatron &&
                    !form.level && (
                      <small className="leader-form-help">
                        Select a leadership
                        level first to view
                        its offices.
                      </small>
                    )}

                  {!isPatron &&
                    form.level &&
                    filteredPositions.length ===
                      0 && (
                      <small className="leader-form-help leader-form-help--warning">
                        No offices are
                        configured for this
                        category and level.
                      </small>
                    )}
                </div>

                {/* DEPARTMENT */}

                <div className="leader-form-group">
                  <label htmlFor="leader-department">
                    Department
                    {!isPatron && (
                      <span>*</span>
                    )}
                  </label>

                  <select
                    id="leader-department"
                    value={form.department}
                    onChange={(event) =>
                      updateField(
                        "department",
                        event.target.value
                      )
                    }
                    disabled={loading}
                  >
                    <option value="">
                      Select department
                    </option>

                    {DEPARTMENTS.map(
                      (department) => (
                        <option
                          key={
                            department.value
                          }
                          value={
                            department.value
                          }
                        >
                          {department.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* SCOPE */}

                <div className="leader-form-group">
                  <label htmlFor="leader-scope">
                    Leadership Scope
                  </label>

                  <select
                    id="leader-scope"
                    value={form.scope}
                    onChange={(event) =>
                      updateField(
                        "scope",
                        event.target.value
                      )
                    }
                    disabled={
                      loading ||
                      isPatron
                    }
                  >
                    <option value="">
                      {isPatron
                        ? "Not applicable"
                        : "Select scope"}
                    </option>

                    {SCOPES.map(
                      (scope) => (
                        <option
                          key={
                            scope.value
                          }
                          value={
                            scope.value
                          }
                        >
                          {scope.label}
                        </option>
                      )
                    )}
                  </select>

                  {!isPatron &&
                    form.position ===
                      "council_governor" && (
                      <small className="leader-form-help">
                        Council of Governors
                        does not use a
                        structural scope.
                      </small>
                    )}
                </div>

                {/* APPOINTMENT */}

                <div className="leader-form-group">
                  <label htmlFor="leader-appointment">
                    Appointment Type
                    {!isPatron && (
                      <span>*</span>
                    )}
                  </label>

                  <select
                    id="leader-appointment"
                    value={
                      form.appointmentType
                    }
                    onChange={(event) =>
                      updateField(
                        "appointmentType",
                        event.target.value
                      )
                    }
                    disabled={loading}
                  >
                    <option value="">
                      Select appointment type
                    </option>

                    {APPOINTMENT_TYPE_OPTIONS.map(
                      (type) => (
                        <option
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </section>

            {/* =================================================
                MEMBER ASSIGNMENT
            ================================================= */}

            {!isPatron && (
              <section className="leader-form-section">
                <div className="leader-form-section-heading">
                  <span className="leader-form-section-icon">
                    <UsersRound size={20} />
                  </span>

                  <div>
                    <small>Section 02</small>

                    <h3>
                      Member Assignment
                    </h3>

                    <p>
                      Search for an active
                      JVP member and assign
                      the selected leadership
                      office.
                    </p>
                  </div>
                </div>

                <div className="leader-form-group leader-form-group--full">
                  <label htmlFor="leader-member-search">
                    Search and Select Member
                    <span>*</span>
                  </label>

                  <div className="member-search-wrapper">
                    <Search
                      className="member-search-icon"
                      size={20}
                    />

                    <input
                      id="leader-member-search"
                      type="search"
                      placeholder="Search by name, phone, National ID or member number..."
                      value={memberSearch}
                      onChange={(event) => {
                        const value =
                          event.target.value;

                        setMemberSearch(
                          value
                        );

                        if (form.member) {
                          setSelectedMember(
                            null
                          );

                          setForm(
                            (previous) => ({
                              ...previous,
                              member: "",
                            })
                          );
                        }
                      }}
                      disabled={loading}
                      autoComplete="off"
                    />

                    {membersLoading && (
                      <span className="member-search-loading">
                        Searching...
                      </span>
                    )}

                    {!membersLoading &&
                      memberSearch.trim() &&
                      !form.member &&
                      members.length > 0 && (
                        <div className="member-search-results">
                          {members.map(
                            (member) => (
                              <button
                                type="button"
                                key={
                                  member._id
                                }
                                className="member-search-result"
                                onClick={() =>
                                  handleSelectMember(
                                    member
                                  )
                                }
                              >
                                <span className="member-search-result-avatar">
                                  {member.profilePhoto ? (
                                    <img
                                      src={
                                        member.profilePhoto
                                      }
                                      alt=""
                                    />
                                  ) : (
                                    <UserRound
                                      size={20}
                                    />
                                  )}
                                </span>

                                <span className="member-search-result-info">
                                  <strong>
                                    {getMemberName(
                                      member
                                    )}
                                  </strong>

                                  <span>
                                    {member.memberNumber ||
                                      "No member number"}
                                  </span>

                                  <small>
                                    {getMemberLocation(
                                      member
                                    ) ||
                                      "Location not available"}
                                  </small>
                                </span>
                              </button>
                            )
                          )}
                        </div>
                      )}

                    {!membersLoading &&
                      memberSearch.trim() &&
                      !form.member &&
                      members.length === 0 && (
                        <div className="member-search-empty">
                          No active members found.
                        </div>
                      )}
                  </div>
                </div>

                {selectedMember && (
                  <article className="selected-member">
                    <div className="selected-member-avatar">
                      {selectedMember.profilePhoto ? (
                        <img
                          src={
                            selectedMember.profilePhoto
                          }
                          alt={getMemberName(
                            selectedMember
                          )}
                        />
                      ) : (
                        <UserRound size={30} />
                      )}
                    </div>

                    <div className="selected-member-content">
                      <span className="selected-member-label">
                        Selected member
                      </span>

                      <strong>
                        {getMemberName(
                          selectedMember
                        )}
                      </strong>

                      <span className="selected-member-number">
                        {selectedMember.memberNumber ||
                          "No membership number"}
                      </span>

                      <small>
                        {getMemberLocation(
                          selectedMember
                        ) ||
                          "Location not available"}
                      </small>
                    </div>

                    <div className="selected-member-status">
                      <CheckCircle2 size={18} />
                      Selected
                    </div>

                    <button
                      type="button"
                      className="selected-member-remove"
                      onClick={
                        handleRemoveSelectedMember
                      }
                      disabled={loading}
                      aria-label="Remove selected member"
                    >
                      <X size={18} />
                    </button>
                  </article>
                )}
              </section>
            )}

            {/* =================================================
                PATRON
            ================================================= */}

            {isPatron && (
              <section className="leader-form-section">
                <div className="leader-form-section-heading">
                  <span className="leader-form-section-icon">
                    <UserRound size={20} />
                  </span>

                  <div>
                    <small>Section 02</small>

                    <h3>
                      Patron Information
                    </h3>

                    <p>
                      Record the patron's
                      official details and
                      organizational profile.
                    </p>
                  </div>
                </div>

                <div className="leader-form-grid">
                  <div className="leader-form-group">
                    <label htmlFor="patron-name">
                      Full Name
                      <span>*</span>
                    </label>

                    <input
                      id="patron-name"
                      type="text"
                      value={
                        form.patron.fullName
                      }
                      onChange={(event) =>
                        updatePatronField(
                          "fullName",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="leader-form-group">
                    <label htmlFor="patron-title">
                      Official Title
                    </label>

                    <input
                      id="patron-title"
                      type="text"
                      value={
                        form.patron.title
                      }
                      onChange={(event) =>
                        updatePatronField(
                          "title",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      placeholder="e.g. Governor"
                    />
                  </div>

                  <div className="leader-form-group">
                    <label htmlFor="patron-organization">
                      Organization
                    </label>

                    <input
                      id="patron-organization"
                      type="text"
                      value={
                        form.patron.organization
                      }
                      onChange={(event) =>
                        updatePatronField(
                          "organization",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      placeholder="Enter organization"
                    />
                  </div>

                  <div className="leader-form-group">
                    <label htmlFor="patron-photo">
                      Photo URL
                    </label>

                    <input
                      id="patron-photo"
                      type="url"
                      value={
                        form.patron.photo
                      }
                      onChange={(event) =>
                        updatePatronField(
                          "photo",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="leader-form-group leader-form-group--full">
                    <label htmlFor="patron-bio">
                      Biography
                    </label>

                    <textarea
                      id="patron-bio"
                      rows="5"
                      value={
                        form.patron.bio
                      }
                      onChange={(event) =>
                        updatePatronField(
                          "bio",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      placeholder="Enter a brief professional biography..."
                    />
                  </div>
                </div>
              </section>
            )}

            {/* =================================================
                TERM
            ================================================= */}

            <section className="leader-form-section">
              <div className="leader-form-section-heading">
                <span className="leader-form-section-icon">
                  <CalendarDays size={20} />
                </span>

                <div>
                  <small>
                    Section 03
                  </small>

                  <h3>
                    Leadership Term
                  </h3>

                  <p>
                    Set the term period,
                    display priority and
                    verification status.
                  </p>
                </div>
              </div>

              <div className="leader-form-grid leader-form-grid--three">

                {/* TERM START */}

                <div className="leader-form-group">
                  <label htmlFor="term-start">
                    Term Start
                    <span>*</span>
                  </label>

                  <input
                    id="term-start"
                    type="date"
                    value={
                      form.termStart
                    }
                    onChange={(event) =>
                      updateField(
                        "termStart",
                        event.target.value
                      )
                    }
                    disabled={
                      loading ||
                      isElected
                    }
                    readOnly={
                      isElected
                    }
                  />

                  {isElected && (
                    <small className="leader-form-help">
                      Standard elected term:
                      22 December 2025.
                    </small>
                  )}
                </div>

                {/* TERM END */}

                <div className="leader-form-group">
                  <label htmlFor="term-end">
                    Term End
                  </label>

                  <input
                    id="term-end"
                    type="date"
                    value={
                      form.termEnd
                    }
                    onChange={(event) =>
                      updateField(
                        "termEnd",
                        event.target.value
                      )
                    }
                    disabled={
                      loading ||
                      isElected
                    }
                    readOnly={
                      isElected
                    }
                  />

                  {isElected && (
                    <small className="leader-form-help">
                      Standard elected term:
                      22 December 2028.
                    </small>
                  )}
                </div>

                {/* DISPLAY ORDER */}

                <div className="leader-form-group">
                  <label htmlFor="display-order">
                    Display Order
                  </label>

                  <input
                    id="display-order"
                    type="number"
                    min="1"
                    value={
                      form.displayOrder
                    }
                    onChange={(event) =>
                      updateField(
                        "displayOrder",
                        event.target.value
                      )
                    }
                    disabled={loading}
                  />

                  <small className="leader-form-help">
                    Lower numbers appear first.
                  </small>
                </div>
              </div>

              <div className="leader-form-checkboxes">
                <label className="leader-form-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      form.featured
                    }
                    onChange={(event) =>
                      updateField(
                        "featured",
                        event.target.checked
                      )
                    }
                    disabled={loading}
                  />

                  <span>
                    <strong>
                      Featured Leader
                    </strong>

                    Display this leader
                    prominently.
                  </span>
                </label>

                <label className="leader-form-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      form.verified
                    }
                    onChange={(event) =>
                      updateField(
                        "verified",
                        event.target.checked
                      )
                    }
                    disabled={loading}
                  />

                  <span>
                    <strong>
                      Verified Assignment
                    </strong>

                    Confirm the assignment
                    as official.
                  </span>
                </label>
              </div>
            </section>

            {/* =================================================
                REMARKS
            ================================================= */}

            <section className="leader-form-section">
              <div className="leader-form-section-heading">
                <span className="leader-form-section-icon">
                  <FileText size={20} />
                </span>

                <div>
                  <small>
                    Section 04
                  </small>

                  <h3>
                    Administrative Remarks
                  </h3>

                  <p>
                    Add optional internal
                    notes about this
                    assignment.
                  </p>
                </div>
              </div>

              <div className="leader-form-group leader-form-group--full">
                <label htmlFor="leader-remarks">
                  Remarks
                </label>

                <textarea
                  id="leader-remarks"
                  rows="4"
                  maxLength="500"
                  value={
                    form.remarks
                  }
                  onChange={(event) =>
                    updateField(
                      "remarks",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="Optional administrative remarks..."
                />

                <small className="leader-form-character-count">
                  {form.remarks.length}
                  /500
                </small>
              </div>
            </section>
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <footer className="leader-form-modal-footer">
            <div className="leader-form-footer-note">
              <ShieldCheck size={17} />

              Leadership assignments
              should only be made by
              authorized administrators.
            </div>

            <div className="leader-form-footer-actions">
              <button
                type="button"
                className="leader-form-cancel"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="leader-form-submit"
                disabled={loading}
              >
                <CheckCircle2 size={18} />

                {loading
                  ? "Saving..."
                  : leader
                    ? "Update Leader"
                    : "Assign Leader"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}