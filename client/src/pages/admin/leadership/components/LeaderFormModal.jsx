import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  X,
  Search,
  UserRound,
} from "lucide-react";

import "./LeaderFormModal.css";

import memberService from "../../../../services/member.service";

/* ============================================================
   CONSTANTS
============================================================ */

const CATEGORIES = [
  {
    label: "Patron",
    value: "patron",
  },
  {
    label: "Regional Executive",
    value: "regional_executive",
  },
  {
    label: "Youth Assembly",
    value: "youth_assembly",
  },
  {
    label: "County Leadership",
    value: "county_leadership",
  },
];

const DEPARTMENTS = [
  {
    label: "Executive",
    value: "executive",
  },
  {
    label: "Administration",
    value: "administration",
  },
  {
    label: "Finance",
    value: "finance",
  },
  {
    label: "Programs",
    value: "programs",
  },
  {
    label: "Communications",
    value: "communications",
  },
  {
    label: "Youth Affairs",
    value: "youth_affairs",
  },
  {
    label: "Gender and Inclusion",
    value: "gender_and_inclusion",
  },
  {
    label: "Other",
    value: "other",
  },
];

const SCOPES = [
  {
    label: "Regional",
    value: "regional",
  },
  {
    label: "County",
    value: "county",
  },
  {
    label: "Constituency",
    value: "constituency",
  },
  {
    label: "Ward",
    value: "ward",
  },
  {
    label: "Organization",
    value: "organization",
  },
];

const APPOINTMENT_TYPES = [
  {
    label: "Elected",
    value: "elected",
  },
  {
    label: "Appointed",
    value: "appointed",
  },
  {
    label: "Nominated",
    value: "nominated",
  },
  {
    label: "Honorary",
    value: "honorary",
  },
];

const POSITIONS = [
  "Patron",

  "President",
  "Deputy President",
  "Secretary General",
  "Deputy Secretary General",
  "Treasurer",
  "Deputy Treasurer",

  "Regional Youth Governor",
  "Regional Youth Senator",
  "Regional Youth MP",

  "County Youth Governor",
  "County Youth Senator",
  "County Youth MP",

  "Constituency Youth MP",

  "Ward Youth MCA",

  "Director",
  "Coordinator",
  "Committee Chairperson",
  "Committee Member",
];

/* ============================================================
   DEFAULT FORM
============================================================ */

const DEFAULT_FORM = {
  member: "",

  category: "",
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
  if (!date) return "";

  return new Date(date)
    .toISOString()
    .split("T")[0];
};

const getMemberName = (member) => {
  if (!member) return "";

  return [
    member.firstName,
    member.middleName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ");
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
  const [form, setForm] = useState(DEFAULT_FORM);

  const [members, setMembers] = useState([]);

  const [memberSearch, setMemberSearch] =
    useState("");

  const [membersLoading, setMembersLoading] =
    useState(false);

  const [error, setError] = useState("");

  /* ==========================================================
     EDIT MODE
  ========================================================== */

  useEffect(() => {
    if (!open) return;

    if (leader) {
      setForm({
        member:
          leader.member?._id ||
          leader.member ||
          "",

        category: leader.category || "",
        position: leader.position || "",

        department: leader.department || "",
        scope: leader.scope || "",
        appointmentType:
          leader.appointmentType || "",

        county: leader.county || "",
        constituency:
          leader.constituency || "",
        ward: leader.ward || "",

        displayOrder:
          leader.displayOrder ?? 999,

        featured:
          leader.featured ?? false,

        termStart:
          formatDateForInput(
            leader.termStart
          ),

        termEnd:
          formatDateForInput(
            leader.termEnd
          ),

        verified:
          leader.verified ?? true,

        remarks:
          leader.remarks || "",

        patron: {
          fullName:
            leader.patron?.fullName || "",

          title:
            leader.patron?.title || "",

          organization:
            leader.patron?.organization ||
            "",

          photo:
            leader.patron?.photo || "",

          bio:
            leader.patron?.bio || "",
        },
      });

      setMemberSearch(
        leader.member
          ? getMemberName(leader.member)
          : ""
      );
    } else {
      setForm({
        ...DEFAULT_FORM,
        termStart: formatDateForInput(
          new Date()
        ),
      });

      setMemberSearch("");
    }

    setError("");
  }, [open, leader]);

  /* ==========================================================
     LOAD MEMBERS
  ========================================================== */

 useEffect(() => {
  if (!open) return;

  if (form.category === "patron") {
    setMembers([]);
    return;
  }

  if (!memberSearch.trim()) {
    setMembers([]);
    return;
  }

  const loadMembers = async () => {
    try {
      setMembersLoading(true);

      const response =
        await memberService.searchMembers(
          memberSearch
        );

      /*
       * memberService.searchMembers()
       * already returns response.data
       */
      const results =
        response?.data ||
        response?.members ||
        response ||
        [];

      setMembers(
        Array.isArray(results)
          ? results
          : []
      );

    } catch (err) {
      console.error(
        "Member search failed:",
        err
      );

      setMembers([]);

    } finally {
      setMembersLoading(false);
    }
  };

  const timer = setTimeout(
    loadMembers,
    350
  );

  return () =>
    clearTimeout(timer);

}, [
  open,
  memberSearch,
  form.category,
]);

  /* ==========================================================
     SELECTED MEMBER
  ========================================================== */

  const selectedMember = useMemo(() => {
    return members.find(
      (member) =>
        member._id === form.member
    );
  }, [members, form.member]);

  /* ==========================================================
     FIELD UPDATE
  ========================================================== */

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePatronField = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,

      patron: {
        ...prev.patron,

        [field]: value,
      },
    }));
  };

  /* ==========================================================
     CATEGORY CHANGE
  ========================================================== */

  const handleCategoryChange = (
    category
  ) => {
    setForm((prev) => ({
      ...prev,

      category,

      member:
        category === "patron"
          ? ""
          : prev.member,

      appointmentType:
        category === "patron"
          ? "honorary"
          : prev.appointmentType,

      scope:
        category === "patron"
          ? "organization"
          : prev.scope,
    }));

    if (category === "patron") {
      setMemberSearch("");
    }
  };

  /* ==========================================================
     SELECT MEMBER
  ========================================================== */

  const handleSelectMember = (
    member
  ) => {
    setForm((prev) => ({
      ...prev,

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
  };

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const validate = () => {
    if (!form.category) {
      return "Please select a leadership category.";
    }

    if (!form.position) {
      return "Please select a leadership position.";
    }

    if (!form.department) {
      return "Please select a department.";
    }

    if (!form.scope) {
      return "Please select a leadership scope.";
    }

    if (!form.appointmentType) {
      return "Please select an appointment type.";
    }

    if (
      form.category !== "patron" &&
      !form.member
    ) {
      return "Please select a member.";
    }

    if (form.category === "patron") {
      if (!form.patron.fullName.trim()) {
        return "Patron full name is required.";
      }
    }

    if (!form.termStart) {
      return "Term start date is required.";
    }

    return null;
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);

      return;
    }

    setError("");

    const payload = {
      category: form.category,

      position: form.position,

      department: form.department,

      scope: form.scope,

      appointmentType:
        form.appointmentType,

      displayOrder: Number(
        form.displayOrder
      ),

      featured: form.featured,

      termStart: form.termStart,

      termEnd:
        form.termEnd || null,

      verified: form.verified,

      remarks: form.remarks,

      ...(form.category === "patron"
        ? {
            member: null,

            patron: {
              fullName:
                form.patron.fullName,

              title:
                form.patron.title,

              organization:
                form.patron.organization,

              photo:
                form.patron.photo,

              bio:
                form.patron.bio,
            },
          }
        : {
            member: form.member,

            /*
             * These values are intentionally sent
             * from the selected member's current
             * geographical information.
             */
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
    if (loading) return;

    setForm(DEFAULT_FORM);

    setMemberSearch("");

    setError("");

    onClose();
  };

  if (!open) return null;

  const isPatron =
    form.category === "patron";

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="modal-overlay">
      <div className="leader-form-modal">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="modal-header">

          <div>
            <h2>
              {leader
                ? "Edit Leadership Assignment"
                : "Assign New Leader"}
            </h2>

            <p>
              Assign an existing member to a
              leadership position.
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            disabled={loading}
          >
            <X size={20} />
          </button>

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="leader-form"
        >

          {/* =================================================
              CATEGORY
          ================================================= */}

          <section className="form-section">

            <h3>Leadership Classification</h3>

            <div className="form-grid">

              <div className="form-field">

                <label>
                  Leadership Category *
                </label>

                <select
                  value={form.category}
                  onChange={(e) =>
                    handleCategoryChange(
                      e.target.value
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

              <div className="form-field">

                <label>
                  Position *
                </label>

                <select
                  value={form.position}
                  onChange={(e) =>
                    updateField(
                      "position",
                      e.target.value
                    )
                  }
                  disabled={loading}
                >
                  <option value="">
                    Select position
                  </option>

                  {POSITIONS.map(
                    (position) => (
                      <option
                        key={position}
                        value={position}
                      >
                        {position}
                      </option>
                    )
                  )}
                </select>

              </div>

              <div className="form-field">

                <label>
                  Department *
                </label>

                <select
                  value={form.department}
                  onChange={(e) =>
                    updateField(
                      "department",
                      e.target.value
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

              <div className="form-field">

                <label>
                  Leadership Scope *
                </label>

                <select
                  value={form.scope}
                  onChange={(e) =>
                    updateField(
                      "scope",
                      e.target.value
                    )
                  }
                  disabled={loading}
                >
                  <option value="">
                    Select scope
                  </option>

                  {SCOPES.map(
                    (scope) => (
                      <option
                        key={scope.value}
                        value={scope.value}
                      >
                        {scope.label}
                      </option>
                    )
                  )}
                </select>

              </div>

              <div className="form-field">

                <label>
                  Appointment Type *
                </label>

                <select
                  value={
                    form.appointmentType
                  }
                  onChange={(e) =>
                    updateField(
                      "appointmentType",
                      e.target.value
                    )
                  }
                  disabled={loading}
                >
                  <option value="">
                    Select appointment type
                  </option>

                  {APPOINTMENT_TYPES.map(
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
              MEMBER SELECTION
          ================================================= */}

          {!isPatron && (
            <section className="form-section">

              <h3>Member Assignment</h3>

              <div className="form-field">

                <label>
                  Search and Select Member *
                </label>

                <div className="member-search">

                  <Search size={18} />

                  <input
                    type="text"
                    placeholder="Search by name, phone, ID or member number..."
                    value={
                      memberSearch
                    }
                    onChange={(e) => {
                      setMemberSearch(
                        e.target.value
                      );

                      if (
                        form.member
                      ) {
                        updateField(
                          "member",
                          ""
                        );
                      }
                    }}
                    disabled={loading}
                  />

                </div>

                {membersLoading && (
                  <div className="member-search-status">
                    Searching members...
                  </div>
                )}

                {!membersLoading &&
                  memberSearch &&
                  !form.member &&
                  members.length > 0 && (

                    <div className="member-results">

                      {members.map(
                        (member) => (

                          <button
                            type="button"
                            key={
                              member._id
                            }
                            className="member-result"
                            onClick={() =>
                              handleSelectMember(
                                member
                              )
                            }
                          >

                            <div className="member-avatar">

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

                            </div>

                            <div>

                              <strong>
                                {getMemberName(
                                  member
                                )}
                              </strong>

                              <small>
                                {member.memberNumber ||
                                  "No membership number"}
                                {" · "}
                                {member.county}
                              </small>

                            </div>

                          </button>

                        )
                      )}

                    </div>

                  )}

                {!membersLoading &&
                  memberSearch &&
                  !form.member &&
                  members.length === 0 && (

                    <div className="member-search-status">
                      No active members found.
                    </div>

                  )}

              </div>

              {selectedMember && (

                <div className="selected-member">

                  <div className="selected-member-avatar">

                    {selectedMember.profilePhoto ? (

                      <img
                        src={
                          selectedMember.profilePhoto
                        }
                        alt=""
                      />

                    ) : (

                      <UserRound
                        size={24}
                      />

                    )}

                  </div>

                  <div>

                    <strong>
                      {getMemberName(
                        selectedMember
                      )}
                    </strong>

                    <span>
                      {selectedMember.memberNumber}
                    </span>

                    <small>
                      {selectedMember.county}
                      {" · "}
                      {
                        selectedMember.constituency ||
                        "No constituency"
                      }
                      {" · "}
                      {
                        selectedMember.ward ||
                        "No ward"
                      }
                    </small>

                  </div>

                </div>

              )}

            </section>
          )}

          {/* =================================================
              PATRON
          ================================================= */}

          {isPatron && (

            <section className="form-section">

              <h3>Patron Information</h3>

              <div className="form-grid">

                <div className="form-field">

                  <label>
                    Full Name *
                  </label>

                  <input
                    type="text"
                    value={
                      form.patron.fullName
                    }
                    onChange={(e) =>
                      updatePatronField(
                        "fullName",
                        e.target.value
                      )
                    }
                    disabled={loading}
                  />

                </div>

                <div className="form-field">

                  <label>
                    Title
                  </label>

                  <input
                    type="text"
                    value={
                      form.patron.title
                    }
                    onChange={(e) =>
                      updatePatronField(
                        "title",
                        e.target.value
                      )
                    }
                    disabled={loading}
                  />

                </div>

                <div className="form-field">

                  <label>
                    Organization
                  </label>

                  <input
                    type="text"
                    value={
                      form.patron.organization
                    }
                    onChange={(e) =>
                      updatePatronField(
                        "organization",
                        e.target.value
                      )
                    }
                    disabled={loading}
                  />

                </div>

                <div className="form-field">

                  <label>
                    Photo URL
                  </label>

                  <input
                    type="url"
                    value={
                      form.patron.photo
                    }
                    onChange={(e) =>
                      updatePatronField(
                        "photo",
                        e.target.value
                      )
                    }
                    disabled={loading}
                  />

                </div>

              </div>

              <div className="form-field">

                <label>
                  Biography
                </label>

                <textarea
                  rows="4"
                  value={
                    form.patron.bio
                  }
                  onChange={(e) =>
                    updatePatronField(
                      "bio",
                      e.target.value
                    )
                  }
                  disabled={loading}
                />

              </div>

            </section>

          )}

          {/* =================================================
              TERM
          ================================================= */}

          <section className="form-section">

            <h3>Leadership Term</h3>

            <div className="form-grid">

              <div className="form-field">

                <label>
                  Term Start *
                </label>

                <input
                  type="date"
                  value={
                    form.termStart
                  }
                  onChange={(e) =>
                    updateField(
                      "termStart",
                      e.target.value
                    )
                  }
                  disabled={loading}
                />

              </div>

              <div className="form-field">

                <label>
                  Term End
                </label>

                <input
                  type="date"
                  value={
                    form.termEnd
                  }
                  onChange={(e) =>
                    updateField(
                      "termEnd",
                      e.target.value
                    )
                  }
                  disabled={loading}
                />

              </div>

              <div className="form-field">

                <label>
                  Display Order
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    form.displayOrder
                  }
                  onChange={(e) =>
                    updateField(
                      "displayOrder",
                      e.target.value
                    )
                  }
                  disabled={loading}
                />

              </div>

            </div>

            <div className="form-checkboxes">

              <label>

                <input
                  type="checkbox"
                  checked={
                    form.featured
                  }
                  onChange={(e) =>
                    updateField(
                      "featured",
                      e.target.checked
                    )
                  }
                  disabled={loading}
                />

                Featured Leader

              </label>

              <label>

                <input
                  type="checkbox"
                  checked={
                    form.verified
                  }
                  onChange={(e) =>
                    updateField(
                      "verified",
                      e.target.checked
                    )
                  }
                  disabled={loading}
                />

                Verified

              </label>

            </div>

          </section>

          {/* =================================================
              REMARKS
          ================================================= */}

          <section className="form-section">

            <div className="form-field">

              <label>
                Remarks
              </label>

              <textarea
                rows="3"
                maxLength="500"
                value={
                  form.remarks
                }
                onChange={(e) =>
                  updateField(
                    "remarks",
                    e.target.value
                  )
                }
                disabled={loading}
                placeholder="Optional administrative remarks..."
              />

            </div>

          </section>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="modal-actions">

            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : leader
                ? "Update Leader"
                : "Assign Leader"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}