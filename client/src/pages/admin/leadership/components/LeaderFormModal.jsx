
import {
  useCallback,
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
  LEADERSHIP_OFFICES,
  APPOINTMENT_TYPES,
  REPORT_VISIBILITY,
  OFFICE_CONFIGURATION,
  REGIONAL_CABINET_PORTFOLIOS,
  COAST_COUNTIES,
  getOfficeConfiguration,
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
];

/* ============================================================
   STRUCTURAL SCOPES
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
   REPORT VISIBILITY
============================================================ */

const REPORT_VISIBILITY_OPTIONS = [
  {
    label: "Private",
    value: REPORT_VISIBILITY.PRIVATE,
  },
  {
    label: "Ward",
    value: REPORT_VISIBILITY.WARD,
  },
  {
    label: "Constituency",
    value: REPORT_VISIBILITY.CONSTITUENCY,
  },
  {
    label: "County",
    value: REPORT_VISIBILITY.COUNTY,
  },
  {
    label: "Regional",
    value: REPORT_VISIBILITY.REGIONAL,
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
];

/* ============================================================
   POSITIONS FROM OFFICE CONFIGURATION
============================================================ */

const POSITIONS = Object.entries(OFFICE_CONFIGURATION).map(
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

  portfolioKey: "",

  department: "",
  scope: "",
  appointmentType: "",

  reportVisibility: REPORT_VISIBILITY.PRIVATE,

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

const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateForInput = (date) => {
  if (!date) return "";

  if (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return date;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().split("T")[0];
};

const getMemberId = (member) => {
  if (!member) return "";

  if (typeof member === "string") {
    return member;
  }

  return member._id || member.id || "";
};

const getMemberName = (member) => {
  if (!member) return "";

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
  if (!member) return "";

  return [
    member.county,
    member.constituency,
    member.ward,
  ]
    .filter(Boolean)
    .join(" · ");
};

const unwrapResponse = (response) => {
  let result = response?.data ?? response;

  if (
    result &&
    typeof result === "object" &&
    !Array.isArray(result) &&
    Object.prototype.hasOwnProperty.call(result, "data")
  ) {
    result = result.data;
  }

  return result;
};

const getMemberResults = (response) => {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.members)) return data.members;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const getLeaderPatron = (leader) => ({
  fullName: leader?.patron?.fullName || "",
  title: leader?.patron?.title || "",
  organization: leader?.patron?.organization || "",
  photo: leader?.patron?.photo || "",
  bio: leader?.patron?.bio || "",
});

const isPatronPosition = (position) =>
  position === LEADERSHIP_OFFICES.PATRON;

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
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    patron: { ...DEFAULT_FORM.patron },
  });

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isSaving = loading || saving;

  const isPatron =
    form.category === LEADERSHIP_CATEGORIES.PATRONAGE ||
    isPatronPosition(form.position);

  const isElected =
    form.appointmentType === APPOINTMENT_TYPES.ELECTED;

  const selectedOffice = useMemo(
    () => getOfficeConfiguration(form.position),
    [form.position]
  );

  const requiresPortfolio = Boolean(
    selectedOffice?.requiresPortfolio &&
      form.level === LEADERSHIP_LEVELS.REGIONAL_CABINET
  );

  const requiresCounty =
    form.reportVisibility === REPORT_VISIBILITY.COUNTY ||
    form.reportVisibility === REPORT_VISIBILITY.CONSTITUENCY ||
    form.reportVisibility === REPORT_VISIBILITY.WARD;

  const requiresConstituency =
    form.reportVisibility === REPORT_VISIBILITY.CONSTITUENCY ||
    form.reportVisibility === REPORT_VISIBILITY.WARD;

  const requiresWard =
    form.reportVisibility === REPORT_VISIBILITY.WARD;

  /* ==========================================================
     FILTER AVAILABLE OFFICES
  ========================================================== */

  const filteredPositions = useMemo(() => {
    return POSITIONS.filter(({ value, configuration }) => {
      if (isPatron) {
        return value === LEADERSHIP_OFFICES.PATRON;
      }

      if (value === LEADERSHIP_OFFICES.PATRON) {
        return false;
      }

      if (
        form.category &&
        configuration.category !== form.category
      ) {
        return false;
      }

      if (
        form.level &&
        configuration.level !== form.level
      ) {
        return false;
      }

      return true;
    });
  }, [form.category, form.level, isPatron]);

  /* ==========================================================
     FILTER AVAILABLE LEVELS
  ========================================================== */

  const filteredLevels = useMemo(() => {
    if (!form.category) {
      return LEADERSHIP_LEVEL_OPTIONS;
    }

    const availableLevels = new Set(
      POSITIONS.filter(
        ({ value, configuration }) =>
          value !== LEADERSHIP_OFFICES.PATRON &&
          configuration.category === form.category &&
          configuration.level
      ).map(({ configuration }) => configuration.level)
    );

    return LEADERSHIP_LEVEL_OPTIONS.filter((level) =>
      availableLevels.has(level.value)
    );
  }, [form.category]);

  /* ==========================================================
     INITIALIZE FORM
  ========================================================== */

  useEffect(() => {
    if (!open) return;

    setError("");
    setMembers([]);

    if (leader) {
      const leaderMember =
        leader.member && typeof leader.member === "object"
          ? leader.member
          : null;

      const position = leader.position || "";
      const configuration = getOfficeConfiguration(position);

      const category =
        leader.category || configuration?.category || "";

      const level =
        leader.level || configuration?.level || "";

      const appointmentType =
        leader.appointmentType ||
        configuration?.appointmentType ||
        APPOINTMENT_TYPES.APPOINTED;

      const patronRecord =
        category === LEADERSHIP_CATEGORIES.PATRONAGE ||
        position === LEADERSHIP_OFFICES.PATRON;

      setForm({
        ...DEFAULT_FORM,

        member: getMemberId(leader.member),

        category: patronRecord
          ? LEADERSHIP_CATEGORIES.PATRONAGE
          : category,

        level: patronRecord ? "" : level,
        position,

        portfolioKey: leader.portfolioKey || "",

        department: patronRecord
          ? ""
          : leader.department || configuration?.department || "",

        scope: patronRecord
          ? ""
          : leader.scope ?? configuration?.scope ?? "",

        appointmentType,

        reportVisibility:
          leader.reportVisibility ||
          configuration?.reportVisibility ||
          (patronRecord
            ? REPORT_VISIBILITY.REGIONAL
            : REPORT_VISIBILITY.PRIVATE),

        county:
          leader.county || leaderMember?.county || "",

        constituency:
          leader.constituency ||
          leaderMember?.constituency ||
          "",

        ward:
          leader.ward || leaderMember?.ward || "",

        displayOrder: leader.displayOrder ?? 999,
        featured: leader.featured ?? false,

        termStart: isPatronPosition(position)
          ? formatDateForInput(leader.termStart) ||
            getLocalDateString()
          : appointmentType === APPOINTMENT_TYPES.ELECTED
            ? formatDateForInput(leader.termStart) ||
              ELECTED_TERM_START
            : formatDateForInput(leader.termStart) ||
              getLocalDateString(),

        termEnd:
          appointmentType === APPOINTMENT_TYPES.ELECTED
            ? formatDateForInput(leader.termEnd) ||
              ELECTED_TERM_END
            : formatDateForInput(leader.termEnd),

        verified: leader.verified ?? true,
        remarks: leader.remarks || "",

        patron: getLeaderPatron(leader),
      });

      setSelectedMember(leaderMember);
      setMemberSearch(
        leaderMember ? getMemberName(leaderMember) : ""
      );
    } else {
      setForm({
        ...DEFAULT_FORM,
        termStart: getLocalDateString(),
        patron: { ...DEFAULT_FORM.patron },
      });

      setSelectedMember(null);
      setMemberSearch("");
    }
  }, [open, leader]);

  /* ==========================================================
     SEARCH MEMBERS
  ========================================================== */

  useEffect(() => {
    if (!open || isPatron || form.member) {
      setMembers([]);
      setMembersLoading(false);
      return undefined;
    }

    const query = memberSearch.trim();

    if (query.length < 2) {
      setMembers([]);
      setMembersLoading(false);
      return undefined;
    }

    let active = true;

    const loadMembers = async () => {
      try {
        setMembersLoading(true);

        const response = await memberService.searchMembers(query);
        const results = getMemberResults(response);

        if (active) {
          setMembers(results);
        }
      } catch (requestError) {
        console.error("Member search failed:", requestError);

        if (active) {
          setMembers([]);
        }
      } finally {
        if (active) {
          setMembersLoading(false);
        }
      }
    };

    const timer = setTimeout(loadMembers, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, isPatron, form.member, memberSearch]);

  /* ==========================================================
     UPDATE BASIC FIELD
  ========================================================== */

  const updateField = useCallback((field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }, []);

  const updatePatronField = useCallback((field, value) => {
    setForm((previous) => ({
      ...previous,
      patron: {
        ...previous.patron,
        [field]: value,
      },
    }));
  }, []);

  /* ==========================================================
     CATEGORY CHANGE
  ========================================================== */

  const handleCategoryChange = (category) => {
    const patron =
      category === LEADERSHIP_CATEGORIES.PATRONAGE;

    setForm((previous) => ({
      ...previous,

      category,
      level: patron ? "" : previous.level,
      position: patron ? LEADERSHIP_OFFICES.PATRON : "",
      portfolioKey: "",

      member: patron ? "" : previous.member,
      department: patron ? "" : previous.department,
      scope: patron ? "" : previous.scope,

      appointmentType: patron
        ? APPOINTMENT_TYPES.APPOINTED
        : "",

      reportVisibility: patron
        ? REPORT_VISIBILITY.REGIONAL
        : REPORT_VISIBILITY.PRIVATE,

      county: patron ? "" : previous.county,
      constituency: patron ? "" : previous.constituency,
      ward: patron ? "" : previous.ward,

      termStart: patron
        ? previous.termStart || getLocalDateString()
        : "",
      termEnd: "",
    }));

    if (patron) {
      setSelectedMember(null);
      setMemberSearch("");
      setMembers([]);
    }

    setError("");
  };

  /* ==========================================================
     LEVEL CHANGE
  ========================================================== */

  const handleLevelChange = (level) => {
    setForm((previous) => ({
      ...previous,

      level,
      position: "",
      portfolioKey: "",

      department: "",
      scope: "",
      appointmentType: "",

      reportVisibility: REPORT_VISIBILITY.PRIVATE,

      county: "",
      constituency: "",
      ward: "",

      termStart: "",
      termEnd: "",
    }));

    setError("");
  };

  /* ==========================================================
     POSITION CHANGE
  ========================================================== */

  const handlePositionChange = (position) => {
    const configuration = getOfficeConfiguration(position);

    if (!configuration) {
      setError("The selected office is not configured.");
      return;
    }

    const patron = position === LEADERSHIP_OFFICES.PATRON;

    const appointmentType =
      configuration.appointmentType ||
      APPOINTMENT_TYPES.APPOINTED;

    const elected =
      appointmentType === APPOINTMENT_TYPES.ELECTED;

    setForm((previous) => ({
      ...previous,

      position,

      category: configuration.category || previous.category,
      level: configuration.level || "",
      department: configuration.department || "",
      scope: configuration.scope ?? "",

      appointmentType,

      reportVisibility:
        configuration.reportVisibility ||
        (patron
          ? REPORT_VISIBILITY.REGIONAL
          : REPORT_VISIBILITY.PRIVATE),

      portfolioKey: "",

      member: patron ? "" : previous.member,

      county: patron ? "" : previous.county,
      constituency: patron ? "" : previous.constituency,
      ward: patron ? "" : previous.ward,

      termStart: elected
        ? ELECTED_TERM_START
        : previous.termStart || getLocalDateString(),

      termEnd: elected
        ? ELECTED_TERM_END
        : "",
    }));

    if (patron) {
      setSelectedMember(null);
      setMemberSearch("");
      setMembers([]);
    }

    setError("");
  };

  /* ==========================================================
     APPOINTMENT CHANGE
  ========================================================== */

  const handleAppointmentChange = (appointmentType) => {
    setForm((previous) => ({
      ...previous,

      appointmentType,

      termStart:
        appointmentType === APPOINTMENT_TYPES.ELECTED
          ? ELECTED_TERM_START
          : previous.appointmentType === APPOINTMENT_TYPES.ELECTED
            ? getLocalDateString()
            : previous.termStart,

      termEnd:
        appointmentType === APPOINTMENT_TYPES.ELECTED
          ? ELECTED_TERM_END
          : previous.appointmentType === APPOINTMENT_TYPES.ELECTED
            ? ""
            : previous.termEnd,
    }));
  };

  /* ==========================================================
     REPORT VISIBILITY CHANGE
  ========================================================== */

  const handleReportVisibilityChange = (reportVisibility) => {
    setForm((previous) => ({
      ...previous,

      reportVisibility,

      county:
        reportVisibility === REPORT_VISIBILITY.REGIONAL ||
        reportVisibility === REPORT_VISIBILITY.PRIVATE
          ? ""
          : previous.county,

      constituency:
        reportVisibility === REPORT_VISIBILITY.CONSTITUENCY ||
        reportVisibility === REPORT_VISIBILITY.WARD
          ? previous.constituency
          : "",

      ward:
        reportVisibility === REPORT_VISIBILITY.WARD
          ? previous.ward
          : "",
    }));
  };

  /* ==========================================================
     MEMBER SELECTION
  ========================================================== */

  const handleSelectMember = (member) => {
    setSelectedMember(member);

    setForm((previous) => ({
      ...previous,

      member: getMemberId(member),

      county: member.county || previous.county,
      constituency:
        member.constituency || previous.constituency,
      ward: member.ward || previous.ward,
    }));

    setMemberSearch(getMemberName(member));
    setMembers([]);
    setError("");
  };

  const handleRemoveSelectedMember = () => {
    setSelectedMember(null);

    setForm((previous) => ({
      ...previous,
      member: "",
    }));

    setMemberSearch("");
    setMembers([]);
  };

  const handleMemberSearchChange = (value) => {
    setMemberSearch(value);

    if (form.member) {
      setSelectedMember(null);

      setForm((previous) => ({
        ...previous,
        member: "",
      }));
    }
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

    if (!isPatron && !form.department) {
      return "Please select a department.";
    }

    if (!form.appointmentType) {
      return "Please select an appointment type.";
    }

    if (!form.termStart) {
      return "Term start date is required.";
    }

    if (
      form.termEnd &&
      new Date(form.termEnd) < new Date(form.termStart)
    ) {
      return "Term end date cannot be before the term start date.";
    }

    if (isPatron) {
      if (!form.patron.fullName.trim()) {
        return "Patron full name is required.";
      }

      return null;
    }

    if (!form.member) {
      return "Please search for and select a member.";
    }

    if (requiresPortfolio && !form.portfolioKey) {
      return "Please select a ministry portfolio for this Cabinet Secretary.";
    }

    if (requiresCounty && !form.county) {
      return "County is required for this reporting level.";
    }

    if (requiresConstituency && !form.constituency.trim()) {
      return "Constituency is required for this reporting level.";
    }

    if (requiresWard && !form.ward.trim()) {
      return "Ward is required for ward-level reporting.";
    }

    return null;
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSaving(true);

    try {
      const finalTermStart = isElected
        ? ELECTED_TERM_START
        : form.termStart;

      const finalTermEnd = isElected
        ? ELECTED_TERM_END
        : form.termEnd || null;

      const portfolio = requiresPortfolio
        ? REGIONAL_CABINET_PORTFOLIOS.find(
            (item) => item.key === form.portfolioKey
          )
        : null;

      const payload = {
        category: form.category,
        level: isPatron ? null : form.level,
        position: form.position,

        portfolioKey: portfolio?.key || null,

        department: isPatron ? null : form.department || null,
        scope: isPatron ? null : form.scope || null,

        appointmentType: form.appointmentType,

        reportVisibility: isPatron
          ? REPORT_VISIBILITY.REGIONAL
          : form.reportVisibility,

        displayOrder: Math.max(
          1,
          Number(form.displayOrder) || 999
        ),

        featured: Boolean(form.featured),

        termStart: finalTermStart,
        termEnd: finalTermEnd,

        verified: Boolean(form.verified),
        remarks: form.remarks.trim(),

        ...(isPatron
          ? {
              member: null,

              county: null,
              constituency: null,
              ward: null,

              patron: {
                fullName: form.patron.fullName.trim(),
                title: form.patron.title.trim(),
                organization: form.patron.organization.trim(),
                photo: form.patron.photo.trim(),
                bio: form.patron.bio.trim(),
              },
            }
          : {
              member: form.member,

              county: form.county || null,
              constituency: form.constituency.trim() || null,
              ward: form.ward.trim() || null,

              patron: {
                fullName: "",
                title: "",
                organization: "",
                photo: "",
                bio: "",
              },
            }),
      };

      await onSave(payload);
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Failed to save the leadership record."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     CLOSE
  ========================================================== */

  const handleClose = () => {
    if (isSaving) return;

    setForm({
      ...DEFAULT_FORM,
      patron: { ...DEFAULT_FORM.patron },
    });

    setSelectedMember(null);
    setMemberSearch("");
    setMembers([]);
    setError("");

    onClose?.();
  };

  if (!open) return null;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className="leader-form-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
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
        <header className="leader-form-modal-header">
          <div className="leader-form-modal-heading">
            <div className="leader-form-modal-heading-icon">
              <ShieldCheck size={25} />
            </div>

            <div>
              <span>Leadership administration</span>

              <h2 id="leader-form-title">
                {leader
                  ? "Edit Leadership Assignment"
                  : "Assign New Leader"}
              </h2>

              <p>
                Assign a member to an official JVP leadership
                office or register the organization's patron.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="leader-form-modal-close"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Close leadership form"
          >
            <X size={21} />
          </button>
        </header>

        {error && (
          <div className="leader-form-alert" role="alert">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Close error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <form className="leader-form" onSubmit={handleSubmit}>
          <div className="leader-form-modal-body">
            {/* SECTION 01: CLASSIFICATION */}

            <section className="leader-form-section">
              <div className="leader-form-section-heading">
                <span className="leader-form-section-icon">
                  <BriefcaseBusiness size={20} />
                </span>

                <div>
                  <small>Section 01</small>
                  <h3>Leadership Classification</h3>
                  <p>
                    Select the leadership category, structure
                    and office.
                  </p>
                </div>
              </div>

              <div className="leader-form-grid">
                <div className="leader-form-group">
                  <label htmlFor="leader-category">
                    Leadership Category <span>*</span>
                  </label>

                  <select
                    id="leader-category"
                    value={form.category}
                    onChange={(event) =>
                      handleCategoryChange(event.target.value)
                    }
                    disabled={isSaving}
                    required
                  >
                    <option value="">Select category</option>

                    {CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!isPatron && (
                  <div className="leader-form-group">
                    <label htmlFor="leader-level">
                      Leadership Level <span>*</span>
                    </label>

                    <select
                      id="leader-level"
                      value={form.level}
                      onChange={(event) =>
                        handleLevelChange(event.target.value)
                      }
                      disabled={isSaving || !form.category}
                      required
                    >
                      <option value="">Select level</option>

                      {filteredLevels.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="leader-form-group">
                  <label htmlFor="leader-position">
                    Leadership Office <span>*</span>
                  </label>

                  <select
                    id="leader-position"
                    value={form.position}
                    onChange={(event) =>
                      handlePositionChange(event.target.value)
                    }
                    disabled={
                      isSaving ||
                      (!isPatron && (!form.category || !form.level))
                    }
                    required
                  >
                    <option value="">
                      {!isPatron && !form.level
                        ? "Select level first"
                        : "Select office"}
                    </option>

                    {filteredPositions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!isPatron && (
                  <>
                    <div className="leader-form-group">
                      <label htmlFor="leader-department">
                        Department <span>*</span>
                      </label>

                      <select
                        id="leader-department"
                        value={form.department}
                        onChange={(event) =>
                          updateField("department", event.target.value)
                        }
                        disabled={isSaving}
                        required
                      >
                        <option value="">Select department</option>

                        {DEPARTMENTS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="leader-form-group">
                      <label htmlFor="leader-scope">
                        Structural Scope
                      </label>

                      <select
                        id="leader-scope"
                        value={form.scope}
                        onChange={(event) =>
                          updateField("scope", event.target.value)
                        }
                        disabled={isSaving}
                      >
                        <option value="">No structural scope</option>

                        {SCOPES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>

                      {form.level ===
                        LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS && (
                        <small className="leader-form-help">
                          Council of Governors records do not use a
                          structural scope.
                        </small>
                      )}
                    </div>

                    <div className="leader-form-group">
                      <label htmlFor="leader-appointment">
                        Appointment Type <span>*</span>
                      </label>

                      <select
                        id="leader-appointment"
                        value={form.appointmentType}
                        onChange={(event) =>
                          handleAppointmentChange(event.target.value)
                        }
                        disabled={isSaving}
                        required
                      >
                        <option value="">Select appointment type</option>

                        {APPOINTMENT_TYPE_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>

                      <small className="leader-form-help">
                        The selected office has a default appointment
                        type. Confirm it against the applicable
                        appointment or election decision.
                      </small>
                    </div>
                  </>
                )}
              </div>

              {/* REGIONAL CABINET PORTFOLIO */}

              {requiresPortfolio && (
                <div className="leader-form-group leader-form-group--full">
                  <label htmlFor="leader-portfolio">
                    Cabinet Secretary Ministry Docket <span>*</span>
                  </label>

                  <select
                    id="leader-portfolio"
                    value={form.portfolioKey}
                    onChange={(event) =>
                      updateField("portfolioKey", event.target.value)
                    }
                    disabled={isSaving}
                    required
                  >
                    <option value="">Select ministry docket</option>

                    {REGIONAL_CABINET_PORTFOLIOS.map((portfolio) => (
                      <option key={portfolio.key} value={portfolio.key}>
                        {portfolio.title}
                      </option>
                    ))}
                  </select>

                  {form.portfolioKey && (
                    <small className="leader-form-help">
                      {REGIONAL_CABINET_PORTFOLIOS.find(
                        (item) => item.key === form.portfolioKey
                      )?.description}
                    </small>
                  )}
                </div>
              )}
            </section>

            {/* SECTION 02: MEMBER OR PATRON */}

            {!isPatron ? (
              <section className="leader-form-section">
                <div className="leader-form-section-heading">
                  <span className="leader-form-section-icon">
                    <UsersRound size={20} />
                  </span>

                  <div>
                    <small>Section 02</small>
                    <h3>Member Assignment</h3>
                    <p>
                      Search for and select the JVP member who will
                      occupy this office.
                    </p>
                  </div>
                </div>

                <div className="leader-form-group leader-form-group--full">
                  <label htmlFor="leader-member-search">
                    Search Member <span>*</span>
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
                      onChange={(event) =>
                        handleMemberSearchChange(event.target.value)
                      }
                      disabled={isSaving}
                      autoComplete="off"
                    />

                    {membersLoading && (
                      <span className="member-search-loading">
                        Searching...
                      </span>
                    )}

                    {!membersLoading &&
                      memberSearch.trim().length >= 2 &&
                      !form.member &&
                      members.length > 0 && (
                        <div className="member-search-results">
                          {members.map((member) => (
                            <button
                              type="button"
                              key={getMemberId(member)}
                              className="member-search-result"
                              onClick={() => handleSelectMember(member)}
                            >
                              <span className="member-search-result-avatar">
                                {member.profilePhoto ? (
                                  <img
                                    src={member.profilePhoto}
                                    alt=""
                                  />
                                ) : (
                                  <UserRound size={20} />
                                )}
                              </span>

                              <span className="member-search-result-info">
                                <strong>{getMemberName(member)}</strong>

                                <span>
                                  {member.memberNumber ||
                                    "No member number"}
                                </span>

                                <small>
                                  {getMemberLocation(member) ||
                                    "Location not available"}
                                </small>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                    {!membersLoading &&
                      memberSearch.trim().length >= 2 &&
                      !form.member &&
                      members.length === 0 && (
                        <div className="member-search-empty">
                          No matching members found.
                        </div>
                      )}
                  </div>
                </div>

                {selectedMember && (
                  <article className="selected-member">
                    <div className="selected-member-avatar">
                      {selectedMember.profilePhoto ? (
                        <img
                          src={selectedMember.profilePhoto}
                          alt={getMemberName(selectedMember)}
                        />
                      ) : (
                        <UserRound size={30} />
                      )}
                    </div>

                    <div className="selected-member-content">
                      <span className="selected-member-label">
                        Selected member
                      </span>

                      <strong>{getMemberName(selectedMember)}</strong>

                      <span className="selected-member-number">
                        {selectedMember.memberNumber ||
                          "No membership number"}
                      </span>

                      <small>
                        {getMemberLocation(selectedMember) ||
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
                      onClick={handleRemoveSelectedMember}
                      disabled={isSaving}
                      aria-label="Remove selected member"
                    >
                      <X size={18} />
                    </button>
                  </article>
                )}
              </section>
            ) : (
              <section className="leader-form-section">
                <div className="leader-form-section-heading">
                  <span className="leader-form-section-icon">
                    <UserRound size={20} />
                  </span>

                  <div>
                    <small>Section 02</small>
                    <h3>Patron Information</h3>
                    <p>
                      Patronage is separate from the five structural
                      leadership levels.
                    </p>
                  </div>
                </div>

                <div className="leader-form-grid">
                  <div className="leader-form-group">
                    <label htmlFor="patron-name">
                      Full Name <span>*</span>
                    </label>

                    <input
                      id="patron-name"
                      type="text"
                      value={form.patron.fullName}
                      onChange={(event) =>
                        updatePatronField("fullName", event.target.value)
                      }
                      disabled={isSaving}
                      required
                    />
                  </div>

                  <div className="leader-form-group">
                    <label htmlFor="patron-title">Official Title</label>

                    <input
                      id="patron-title"
                      type="text"
                      value={form.patron.title}
                      onChange={(event) =>
                        updatePatronField("title", event.target.value)
                      }
                      disabled={isSaving}
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
                      value={form.patron.organization}
                      onChange={(event) =>
                        updatePatronField(
                          "organization",
                          event.target.value
                        )
                      }
                      disabled={isSaving}
                    />
                  </div>

                  <div className="leader-form-group">
                    <label htmlFor="patron-photo">Photo URL</label>

                    <input
                      id="patron-photo"
                      type="url"
                      value={form.patron.photo}
                      onChange={(event) =>
                        updatePatronField("photo", event.target.value)
                      }
                      disabled={isSaving}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="leader-form-group leader-form-group--full">
                    <label htmlFor="patron-bio">Biography</label>

                    <textarea
                      id="patron-bio"
                      rows="5"
                      value={form.patron.bio}
                      onChange={(event) =>
                        updatePatronField("bio", event.target.value)
                      }
                      disabled={isSaving}
                      maxLength={3000}
                      placeholder="Enter a brief biography..."
                    />
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 03: GEOGRAPHY AND VISIBILITY */}

            {!isPatron && (
              <section className="leader-form-section">
                <div className="leader-form-section-heading">
                  <span className="leader-form-section-icon">
                    <UsersRound size={20} />
                  </span>

                  <div>
                    <small>Section 03</small>
                    <h3>Geography & Report Visibility</h3>
                    <p>
                      Configure the reporting level and the
                      geographical area represented by this leader.
                    </p>
                  </div>
                </div>

                <div className="leader-form-grid">
                  <div className="leader-form-group">
                    <label htmlFor="leader-report-visibility">
                      Report Visibility <span>*</span>
                    </label>

                    <select
                      id="leader-report-visibility"
                      value={form.reportVisibility}
                      onChange={(event) =>
                        handleReportVisibilityChange(event.target.value)
                      }
                      disabled={isSaving}
                      required
                    >
                      {REPORT_VISIBILITY_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {requiresCounty && (
                    <div className="leader-form-group">
                      <label htmlFor="leader-county">
                        County <span>*</span>
                      </label>

                      <select
                        id="leader-county"
                        value={form.county}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            county: event.target.value,
                          }))
                        }
                        disabled={isSaving}
                        required
                      >
                        <option value="">Select county</option>

                        {COAST_COUNTIES.map((county) => (
                          <option key={county} value={county}>
                            {county}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {requiresConstituency && (
                    <div className="leader-form-group">
                      <label htmlFor="leader-constituency">
                        Constituency <span>*</span>
                      </label>

                      <input
                        id="leader-constituency"
                        type="text"
                        value={form.constituency}
                        onChange={(event) =>
                          updateField("constituency", event.target.value)
                        }
                        disabled={isSaving}
                        required
                      />
                    </div>
                  )}

                  {requiresWard && (
                    <div className="leader-form-group">
                      <label htmlFor="leader-ward">
                        Ward <span>*</span>
                      </label>

                      <input
                        id="leader-ward"
                        type="text"
                        value={form.ward}
                        onChange={(event) =>
                          updateField("ward", event.target.value)
                        }
                        disabled={isSaving}
                        required
                      />
                    </div>
                  )}
                </div>

                <small className="leader-form-help">
                  The report visibility setting controls which
                  geographical fields the model requires. Confirm
                  that the selected level is appropriate for the
                  office before saving.
                </small>
              </section>
            )}

            {/* SECTION 04: TERM */}

            <section className="leader-form-section">
              <div className="leader-form-section-heading">
                <span className="leader-form-section-icon">
                  <CalendarDays size={20} />
                </span>

                <div>
                  <small>Section 04</small>
                  <h3>Leadership Term & Display</h3>
                  <p>
                    Set the term dates, display order and verification
                    status.
                  </p>
                </div>
              </div>

              <div className="leader-form-grid leader-form-grid--three">
                <div className="leader-form-group">
                  <label htmlFor="term-start">
                    Term Start <span>*</span>
                  </label>

                  <input
                    id="term-start"
                    type="date"
                    value={form.termStart}
                    onChange={(event) =>
                      updateField("termStart", event.target.value)
                    }
                    disabled={isSaving || isElected}
                    readOnly={isElected}
                    required
                  />

                  {isElected && (
                    <small className="leader-form-help">
                      Standard elected term: 22 December 2025.
                    </small>
                  )}
                </div>

                <div className="leader-form-group">
                  <label htmlFor="term-end">Term End</label>

                  <input
                    id="term-end"
                    type="date"
                    value={form.termEnd}
                    onChange={(event) =>
                      updateField("termEnd", event.target.value)
                    }
                    disabled={isSaving || isElected}
                    readOnly={isElected}
                  />

                  {isElected && (
                    <small className="leader-form-help">
                      Standard elected term: 22 December 2028.
                    </small>
                  )}
                </div>

                <div className="leader-form-group">
                  <label htmlFor="display-order">Display Order</label>

                  <input
                    id="display-order"
                    type="number"
                    min="1"
                    value={form.displayOrder}
                    onChange={(event) =>
                      updateField("displayOrder", event.target.value)
                    }
                    disabled={isSaving}
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
                    checked={form.featured}
                    onChange={(event) =>
                      updateField("featured", event.target.checked)
                    }
                    disabled={isSaving}
                  />

                  <span>
                    <strong>Featured Leader</strong>
                    Display this leader prominently.
                  </span>
                </label>

                <label className="leader-form-checkbox">
                  <input
                    type="checkbox"
                    checked={form.verified}
                    onChange={(event) =>
                      updateField("verified", event.target.checked)
                    }
                    disabled={isSaving}
                  />

                  <span>
                    <strong>Verified Assignment</strong>
                    Mark the assignment as verified.
                  </span>
                </label>
              </div>
            </section>

            {/* SECTION 05: REMARKS */}

            <section className="leader-form-section">
              <div className="leader-form-section-heading">
                <span className="leader-form-section-icon">
                  <FileText size={20} />
                </span>

                <div>
                  <small>Section 05</small>
                  <h3>Administrative Remarks</h3>
                  <p>
                    Add optional internal notes about this assignment.
                  </p>
                </div>
              </div>

              <div className="leader-form-group leader-form-group--full">
                <label htmlFor="leader-remarks">Remarks</label>

                <textarea
                  id="leader-remarks"
                  rows="4"
                  maxLength={500}
                  value={form.remarks}
                  onChange={(event) =>
                    updateField("remarks", event.target.value)
                  }
                  disabled={isSaving}
                  placeholder="Optional administrative remarks..."
                />

                <small className="leader-form-character-count">
                  {form.remarks.length}/500
                </small>
              </div>
            </section>
          </div>

          {/* FOOTER */}

          <footer className="leader-form-modal-footer">
            <div className="leader-form-footer-note">
              <ShieldCheck size={17} />
              Only authorized administrators should assign
              leadership offices.
            </div>

            <div className="leader-form-footer-actions">
              <button
                type="button"
                className="leader-form-cancel"
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="leader-form-submit"
                disabled={isSaving}
              >
                <CheckCircle2 size={18} />

                {isSaving
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