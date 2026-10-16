
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Users,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Building2,
  CalendarDays,
  Filter,
  ShieldCheck,
  Power,
  Check,
  AlertCircle,
  ChevronDown,
  UserCheck,
} from "lucide-react";

import officeAssignmentService from "../../services/officeAssignment.service";
import { searchMembers } from "../../services/member.service";
import leaderService from "../../services/leader.service";
import "./OfficeAssignments.css";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  member: "",
  officeHolder: "",
  officeType: "",
  portfolioKey: "",
  designation: "",
  responsibilities: "",
  shortBio: "",
  startDate: "",
  endDate: "",
  displayOrder: 0,
  status: "active",
  visibility: {
    isPublic: true,
    showOnOfficePage: true,
    showInLeadershipDirectory: true,
  },
};

const OFFICE_TYPES = [
  { value: "president", label: "President's Office" },
  { value: "deputy_president", label: "Deputy President's Office" },
  {
    value: "prime_cabinet_secretary",
    label: "Prime Cabinet Secretary's Office",
  },
  { value: "cabinet_secretary", label: "Cabinet Secretary's Office" },
  { value: "attorney_general", label: "Attorney General's Office" },
  { value: "other", label: "Other Office" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "completed", label: "Completed" },
];

const unwrap = (response) => {
  if (!response) return null;
  return response.data ?? response;
};

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (typeof value !== "object") return "";

  // Standard MongoDB and API identifier fields.
  const directId =
    value._id ??
    value.id ??
    value.memberId ??
    value.leaderId ??
    value.member_id ??
    value.leader_id;

  if (directId !== undefined && directId !== null) {
    if (
      typeof directId === "string" ||
      typeof directId === "number"
    ) {
      return String(directId).trim();
    }

    // Handle MongoDB ObjectId objects.
    if (typeof directId.toString === "function") {
      const id = directId.toString();

      if (id && id !== "[object Object]") {
        return id.trim();
      }
    }
  }

  // Handle populated or nested member records.
  if (value.member && typeof value.member === "object") {
    const nestedMemberId = getId(value.member);
    if (nestedMemberId) return nestedMemberId;
  }

  return "";
};

const getMemberName = (member) => {
  if (!member) return "Unknown member";
  if (typeof member === "string") return member;

  if (member.fullName) return member.fullName;

  const name = [
    member.firstName,
    member.middleName,
    member.lastName,
  ].filter(Boolean).join(" ");

  return name || member.memberNumber || getId(member) || "Unknown member";
};

const getOfficeHolderName = (leader) => {
  if (!leader) return "Unknown office-holder";
  if (typeof leader === "string") return leader;
  if (leader.fullName || leader.name || leader.displayName) {
    return leader.fullName || leader.name || leader.displayName;
  }
  if (leader.member) return getMemberName(leader.member);
  return leader.position || leader.officeDisplayTitle || getId(leader);
};

const getAssignmentId = (assignment) =>
  assignment?._id || assignment?.id || "";

const getPayload = (response) => {
  const body = unwrap(response);
  return body?.data ?? body;
};

const getList = (response) => {
  const payload = getPayload(response);

  if (Array.isArray(payload)) return payload;

  return (
    payload?.assignments ||
    payload?.results ||
    payload?.members ||
    payload?.leaders ||
    payload?.items ||
    payload?.data ||
    []
  );
};

const getPagination = (response, itemCount, currentPage) => {
  const payload = getPayload(response);

  const total =
    Number(payload?.total) ||
    Number(payload?.totalCount) ||
    Number(payload?.pagination?.total) ||
    Number(payload?.count) ||
    itemCount;

  const pages =
    Number(payload?.pages) ||
    Number(payload?.totalPages) ||
    Number(payload?.pagination?.pages) ||
    Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    total,
    pages,
    page: Number(payload?.page) || currentPage,
  };
};

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const toDateInput = (date) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const getStatus = (assignment) =>
  assignment?.status || (assignment?.isActive ? "active" : "inactive");

const getVisibility = (assignment) => ({
  isPublic: assignment?.visibility?.isPublic ?? true,
  showOnOfficePage: assignment?.visibility?.showOnOfficePage ?? true,
  showInLeadershipDirectory:
    assignment?.visibility?.showInLeadershipDirectory ?? true,
});

const getPortfolioKey = (leader) => {
  if (!leader || typeof leader !== "object") return "";

  return (
    leader.portfolioKey ||
    leader.portfolio?.key ||
    leader.portfolio?.portfolioKey ||
    ""
  );
};

const normalizePosition = (position) =>
  String(position || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getOfficeTypeFromLeader = (leader) => {
  const position = normalizePosition(leader?.position);

  if (position === "president") return "president";
  if (position === "deputy_president") return "deputy_president";

  if (
    position === "prime_cabinet_secretary" ||
    position === "prime_cs"
  ) {
    return "prime_cabinet_secretary";
  }

  if (
    position === "attorney_general" ||
    position === "attorney_general_jvp"
  ) {
    return "attorney_general";
  }

  if (
    position === "cabinet_secretary" ||
    position === "cs"
  ) {
    return "cabinet_secretary";
  }

  // The current assignment model supports "other" for offices
  // that do not map to the five named office types above.
  return "other";
};

const getOfficeTypeLabel = (value) =>
  OFFICE_TYPES.find((item) => item.value === value)?.label || "Other Office";

const getImage = (person) => {
  if (!person || typeof person !== "object") return "";

  const photo =
    person.profilePhoto ||
    person.profilePicture ||
    person.profileImage ||
    person.avatar ||
    person.photo;

  if (typeof photo === "string") return photo;

  return photo?.url || photo?.secure_url || "";
};

const getMemberNumber = (member) =>
  member?.memberNumber || member?.membershipNumber || "";

const getLeaderPositionLabel = (leader) => {
  if (!leader) return "";

  return (
    leader.officeDisplayTitle ||
    leader.positionTitle ||
    leader.positionLabel ||
    leader.position ||
    "Leadership position"
  );
};

const normalizeMemberResults = (response) => {
  const payload = getPayload(response);

  if (Array.isArray(payload)) return payload;

  return (
    payload?.members ||
    payload?.results ||
    payload?.items ||
    payload?.data ||
    []
  );
};

const normalizeLeaderResults = (response) => {
  const payload = getPayload(response);

  if (Array.isArray(payload)) return payload;

  return (
    payload?.leaders ||
    payload?.results ||
    payload?.items ||
    payload?.data ||
    []
  );
};

function StatusBadge({ status }) {
  const normalized = String(status || "inactive").toLowerCase();

  const icon =
    normalized === "active" ? (
      <CheckCircle2 size={14} />
    ) : normalized === "completed" ? (
      <Check size={14} />
    ) : (
      <Clock3 size={14} />
    );

  return (
    <span className={`oa-status oa-status--${normalized}`}>
      {icon}
      {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
    </span>
  );
}

function VisibilityBadge({ visible }) {
  return (
    <span
      className={`oa-visibility ${
        visible ? "oa-visibility--public" : "oa-visibility--private"
      }`}
    >
      {visible ? <Eye size={13} /> : <EyeOff size={13} />}
      {visible ? "Public" : "Private"}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, description, tone }) {
  return (
    <div className="oa-stat-card">
      <div className={`oa-stat-icon oa-stat-icon--${tone}`}>
        <Icon size={21} />
      </div>

      <div className="oa-stat-content">
        <span className="oa-stat-label">{label}</span>
        <strong className="oa-stat-value">{value}</strong>
        <span className="oa-stat-description">{description}</span>
      </div>
    </div>
  );
}

/* ===========================================================
   SEARCHABLE MEMBER / LEADER SELECTOR
=========================================================== */

function SearchablePersonSelect({
  label,
  placeholder,
  value,
  options,
  loading,
  error,
  onSearch,
  onSelect,
  getOptionId,
  getOptionName,
  getOptionMeta,
  getOptionImage,
  selectedOption,
  disabled = false,
  helpText,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const timer = window.setTimeout(() => {
      onSearch(query);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, open, onSearch]);

  const selectedId = getId(value);
  const currentSelection =
    selectedOption ||
    options.find((option) => getOptionId(option) === selectedId);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const searchableText = [
        getOptionName(option),
        getOptionMeta(option),
        getMemberNumber(option),
        option?.position,
        option?.officeDisplayTitle,
        option?.portfolioTitle,
        option?.portfolioKey,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [options, query, getOptionName, getOptionMeta]);

  const handleSelect = (option) => {
    onSelect(option);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="oa-field oa-field--full oa-person-select-field">
      <span>{label} *</span>

      <div className={`oa-person-select ${open ? "is-open" : ""}`}>
        {currentSelection && !open ? (
          <div className="oa-selected-person">
            <div className="oa-selected-person-main">
              <div className="oa-select-avatar">
                {getOptionImage(currentSelection) ? (
                  <img src={getOptionImage(currentSelection)} alt="" />
                ) : (
                  <UserRound size={18} />
                )}
              </div>

              <div className="oa-selected-person-copy">
                <strong>{getOptionName(currentSelection)}</strong>
                <small>{getOptionMeta(currentSelection)}</small>
              </div>
            </div>

            <div className="oa-selected-actions">
              <button
                type="button"
                className="oa-select-change"
                onClick={() => {
                  setQuery("");
                  setOpen(true);
                }}
                disabled={disabled}
              >
                Change
              </button>

              <button
                type="button"
                className="oa-select-clear"
                aria-label={`Clear ${label.toLowerCase()}`}
                onClick={() => {
                  onSelect(null);
                  setQuery("");
                  setOpen(true);
                }}
                disabled={disabled}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="oa-person-search-input">
            <Search size={17} />

            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              aria-label={label}
              aria-expanded={open}
              autoComplete="off"
            />

            {loading ? (
              <RefreshCw size={16} className="oa-spin" />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>
        )}

        {open && !disabled && (
          <>
            <button
              type="button"
              className="oa-select-dismiss"
              aria-label="Close search results"
              onClick={() => setOpen(false)}
            />

            <div className="oa-person-results">
              {loading ? (
                <div className="oa-person-result-state">
                  <RefreshCw size={17} className="oa-spin" />
                  Searching...
                </div>
              ) : error ? (
                <div className="oa-person-result-state oa-person-result-state--error">
                  <AlertCircle size={16} />
                  {error}
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="oa-person-result-state">
                  <Users size={17} />
                  {query.trim()
                    ? "No matching records found."
                    : "No records available. Try entering a search term."}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const id = getOptionId(option);
                  const isSelected = id === selectedId;
                  const image = getOptionImage(option);

                  return (
                    <button
                      type="button"
                      key={id}
                      className={`oa-person-result ${
                        isSelected ? "is-selected" : ""
                      }`}
                      onClick={() => handleSelect(option)}
                    >
                      <div className="oa-select-avatar">
                        {image ? (
                          <img src={image} alt="" />
                        ) : (
                          <UserRound size={18} />
                        )}
                      </div>

                      <div className="oa-person-result-copy">
                        <strong>{getOptionName(option)}</strong>
                        <small>{getOptionMeta(option)}</small>
                      </div>

                      {isSelected && (
                        <CheckCircle2
                          size={17}
                          className="oa-person-result-check"
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {helpText && <small>{helpText}</small>}
    </div>
  );
}

/* ===========================================================
   CREATE / EDIT MODAL
=========================================================== */

function AssignmentModal({ assignment, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => {
    if (!assignment) return { ...EMPTY_FORM };

    const leader = assignment.officeHolder;

    return {
      ...EMPTY_FORM,
      ...assignment,
      member: getId(assignment.member),
      officeHolder: getId(leader),
      officeType:
        assignment.officeType ||
        (leader && typeof leader === "object"
          ? getOfficeTypeFromLeader(leader)
          : ""),
      portfolioKey:
        assignment.portfolioKey ||
        (leader && typeof leader === "object"
          ? getPortfolioKey(leader)
          : ""),
      startDate: toDateInput(assignment.startDate),
      endDate: toDateInput(assignment.endDate),
      visibility: getVisibility(assignment),
    };
  });

  const [formError, setFormError] = useState("");

  const [memberOptions, setMemberOptions] = useState(
    assignment?.member && typeof assignment.member === "object"
      ? [assignment.member]
      : []
  );

  const [leaderOptions, setLeaderOptions] = useState(
    assignment?.officeHolder && typeof assignment.officeHolder === "object"
      ? [assignment.officeHolder]
      : []
  );

  const [memberLoading, setMemberLoading] = useState(false);
  const [leaderLoading, setLeaderLoading] = useState(false);
  const [memberSearchError, setMemberSearchError] = useState("");
  const [leaderSearchError, setLeaderSearchError] = useState("");

  const [selectedMember, setSelectedMember] = useState(
    assignment?.member && typeof assignment.member === "object"
      ? assignment.member
      : null
  );

  const [selectedLeader, setSelectedLeader] = useState(
    assignment?.officeHolder && typeof assignment.officeHolder === "object"
      ? assignment.officeHolder
      : null
  );

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const setVisibility = (name, checked) => {
    setForm((current) => ({
      ...current,
      visibility: {
        ...current.visibility,
        [name]: checked,
      },
    }));
  };

  const searchMemberRecords = useCallback(async (query) => {
    if (!query.trim()) {
      setMemberSearchError("");
      return;
    }

    setMemberLoading(true);
    setMemberSearchError("");

    try {
      const response = await searchMembers(query.trim());
      const results = normalizeMemberResults(response);

      setMemberOptions((current) => {
        const combined = [...current, ...results];
        const unique = new Map();

        combined.forEach((member) => {
          const id = getId(member);
          if (id) unique.set(id, member);
        });

        return Array.from(unique.values()).filter((member) => {
          // Keep inactive records out of the selectable list.
          // The backend remains responsible for final eligibility checks.
          const status = String(member.membershipStatus || "").toLowerCase();
          return !status || status === "active";
        });
      });
    } catch (error) {
      setMemberSearchError(getErrorMessage(error));
    } finally {
      setMemberLoading(false);
    }
  }, []);

  const searchLeaderRecords = useCallback(async (query) => {
    setLeaderLoading(true);
    setLeaderSearchError("");

    try {
      const response = await leaderService.getLeaders({
        limit: 100,
        page: 1,
        search: query.trim() || undefined,
        status: "active",
      });

      const results = normalizeLeaderResults(response);

      setLeaderOptions((current) => {
        const combined = [...current, ...results];
        const unique = new Map();

        combined.forEach((leader) => {
          const id = getId(leader);
          if (id) unique.set(id, leader);
        });

        return Array.from(unique.values()).filter((leader) => {
          const status = String(leader.status || "").toLowerCase();
          if (leader.isActive === false) return false;
          return !status || status === "active";
        });
      });
    } catch (error) {
      setLeaderSearchError(getErrorMessage(error));
    } finally {
      setLeaderLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load the initial list of available office-holders.
    searchLeaderRecords("");
  }, [searchLeaderRecords]);

  const handleMemberSelect = (member) => {
  const memberId = member ? getId(member) : "";

  console.log("[Office Assignment] Selected member:", {
    member,
    extractedId: memberId,
  });

  setSelectedMember(member);
  setField("member", memberId);
  setFormError("");

  if (member && !memberId) {
    setFormError(
      "This member record has no recognized ID. Please refresh the member search and try again."
    );
  }
};

  const handleLeaderSelect = (leader) => {
    setSelectedLeader(leader);

    if (!leader) {
      setForm((current) => ({
        ...current,
        officeHolder: "",
        officeType: "",
        portfolioKey: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      officeHolder: getId(leader),
      officeType: getOfficeTypeFromLeader(leader),
      portfolioKey: getPortfolioKey(leader),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.member.trim()) {
      setFormError("Search for and select an existing JVP member.");
      return;
    }

    if (!form.officeHolder.trim()) {
      setFormError("Search for and select a principal office-holder.");
      return;
    }

    if (!form.designation.trim()) {
      setFormError("Enter the supporting officer's designation.");
      return;
    }

    if (
      form.startDate &&
      form.endDate &&
      form.endDate < form.startDate
    ) {
      setFormError("The end date cannot be earlier than the start date.");
      return;
    }

    const memberId = getId(form.member);
const officeHolderId = getId(form.officeHolder);

if (!memberId) {
  setFormError(
    "The selected member ID is missing. Please select the member again."
  );
  return;
}

if (!officeHolderId) {
  setFormError(
    "The selected principal office-holder ID is missing. Please select the leader again."
  );
  return;
}

    const payload = {
      member: memberId,
      officeHolder: officeHolderId,
      officeType: form.officeType || "other",
      portfolioKey: form.portfolioKey || undefined,
      designation: form.designation.trim(),
      responsibilities: form.responsibilities.trim(),
      shortBio: form.shortBio.trim(),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      displayOrder: Number(form.displayOrder) || 0,
      visibility: {
        isPublic: Boolean(form.visibility.isPublic),
        showOnOfficePage: Boolean(form.visibility.showOnOfficePage),
        showInLeadershipDirectory: Boolean(
          form.visibility.showInLeadershipDirectory
        ),
      },
    };

    if (!assignment) payload.status = form.status;

    try {
      await onSubmit(payload);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const memberSelectedOption =
    selectedMember ||
    memberOptions.find((member) => getId(member) === form.member) ||
    (assignment?.member && typeof assignment.member === "object"
      ? assignment.member
      : null);

  const leaderSelectedOption =
    selectedLeader ||
    leaderOptions.find((leader) => getId(leader) === form.officeHolder) ||
    (assignment?.officeHolder && typeof assignment.officeHolder === "object"
      ? assignment.officeHolder
      : null);

  const memberOptionName = useCallback(getMemberName, []);
  const memberOptionMeta = useCallback(
    (member) => {
      const number = getMemberNumber(member);
      const location = [
        member?.county,
        member?.constituency,
      ].filter(Boolean).join(" · ");

      return [number, location].filter(Boolean).join(" · ") || "JVP member";
    },
    []
  );

  const leaderOptionName = useCallback(getOfficeHolderName, []);
  const leaderOptionMeta = useCallback(
    (leader) => {
      const position = getLeaderPositionLabel(leader);
      const portfolio =
        leader?.portfolioTitle ||
        leader?.portfolio?.title ||
        leader?.portfolioKey;

      return [position, portfolio].filter(Boolean).join(" · ");
    },
    []
  );

  return (
    <div
      className="oa-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        className="oa-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oa-modal-title"
      >
        <header className="oa-modal-header">
          <div>
            <span className="oa-eyebrow">
              {assignment ? "EDIT ASSIGNMENT" : "NEW ASSIGNMENT"}
            </span>

            <h2 id="oa-modal-title">
              {assignment
                ? "Update office assignment"
                : "Assign a supporting officer"}
            </h2>

            <p>
              Select an existing JVP member and the principal Leader they
              will support.
            </p>
          </div>

          <button
            type="button"
            className="oa-icon-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="oa-modal-body">
            {formError && (
              <div className="oa-alert oa-alert--error">
                <AlertCircle size={17} />
                <span>{formError}</span>
              </div>
            )}

            <div className="oa-form-section">
              <h3>Assignment details</h3>

              <div className="oa-form-grid">
                <SearchablePersonSelect
                  label="JVP Member"
                  placeholder="Search by member name or membership number..."
                  value={form.member}
                  options={memberOptions}
                  loading={memberLoading}
                  error={memberSearchError}
                  onSearch={searchMemberRecords}
                  onSelect={handleMemberSelect}
                  getOptionId={getId}
                  getOptionName={memberOptionName}
                  getOptionMeta={memberOptionMeta}
                  getOptionImage={getImage}
                  selectedOption={memberSelectedOption}
                  disabled={saving}
                  helpText="Only select an existing member. Membership eligibility is validated by the server."
                />

                <SearchablePersonSelect
                  label="Principal Leader"
                  placeholder="Search by Leader name, position or portfolio..."
                  value={form.officeHolder}
                  options={leaderOptions}
                  loading={leaderLoading}
                  error={leaderSearchError}
                  onSearch={searchLeaderRecords}
                  onSelect={handleLeaderSelect}
                  getOptionId={getId}
                  getOptionName={leaderOptionName}
                  getOptionMeta={leaderOptionMeta}
                  getOptionImage={getImage}
                  selectedOption={leaderSelectedOption}
                  disabled={saving}
                  helpText="Choose the principal office-holder this officer will support."
                />

                <label className="oa-field">
                  <span>Office type</span>
                  <div className="oa-readonly-field">
                    <Building2 size={16} />
                    <input
                      value={
                        form.officeType
                          ? getOfficeTypeLabel(form.officeType)
                          : ""
                      }
                      readOnly
                      placeholder="Select a Leader first"
                    />
                    <ShieldCheck size={15} />
                  </div>
                  <small>
                    Automatically derived from the selected Leader's position.
                  </small>
                </label>

                <label className="oa-field">
                  <span>Portfolio key</span>
                  <input
                    value={form.portfolioKey || ""}
                    readOnly
                    placeholder="No portfolio assigned"
                  />
                  <small>
                    Automatically populated when the selected Leader has a
                    portfolio.
                  </small>
                </label>

                {leaderSelectedOption && (
                  <div className="oa-field oa-field--full">
                    <div className="oa-office-preview">
                      <div className="oa-office-preview-icon">
                        <UserCheck size={19} />
                      </div>
                      <div>
                        <strong>{getOfficeHolderName(leaderSelectedOption)}</strong>
                        <span>
                          {getLeaderPositionLabel(leaderSelectedOption)}
                          {leaderSelectedOption.portfolioTitle
                            ? ` · ${leaderSelectedOption.portfolioTitle}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <label className="oa-field oa-field--full">
                  <span>Designation *</span>
                  <input
                    value={form.designation}
                    onChange={(event) =>
                      setField("designation", event.target.value)
                    }
                    placeholder="e.g. Personal Assistant, Office Administrator"
                    required
                  />
                </label>

                <label className="oa-field">
                  <span>Start date</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setField("startDate", event.target.value)
                    }
                  />
                </label>

                <label className="oa-field">
                  <span>End date</span>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={(event) =>
                      setField("endDate", event.target.value)
                    }
                  />
                </label>

                <label className="oa-field">
                  <span>Display order</span>
                  <input
                    type="number"
                    min="0"
                    value={form.displayOrder}
                    onChange={(event) =>
                      setField("displayOrder", event.target.value)
                    }
                  />
                  <small>Lower numbers appear first.</small>
                </label>

                {!assignment && (
                  <label className="oa-field">
                    <span>Initial status</span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setField("status", event.target.value)
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                )}
              </div>
            </div>

            <div className="oa-form-section">
              <h3>Responsibilities and profile</h3>

              <div className="oa-form-grid">
                <label className="oa-field oa-field--full">
                  <span>Responsibilities</span>
                  <textarea
                    rows={4}
                    value={form.responsibilities || ""}
                    onChange={(event) =>
                      setField("responsibilities", event.target.value)
                    }
                    placeholder="Describe the officer's duties and responsibilities..."
                  />
                </label>

                <label className="oa-field oa-field--full">
                  <span>Short biography</span>
                  <textarea
                    rows={3}
                    value={form.shortBio || ""}
                    onChange={(event) =>
                      setField("shortBio", event.target.value)
                    }
                    placeholder="Optional public profile introduction..."
                  />
                </label>
              </div>
            </div>

            <div className="oa-form-section">
              <h3>Public visibility</h3>

              <p className="oa-section-description">
                Choose where this supporting officer should appear.
              </p>

              <div className="oa-visibility-options">
                <label className="oa-toggle-row">
                  <span className="oa-toggle-icon">
                    <Eye size={18} />
                  </span>
                  <span className="oa-toggle-copy">
                    <strong>Public profile</strong>
                    <small>
                      Allow this assignment to be displayed publicly.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(form.visibility.isPublic)}
                    onChange={(event) =>
                      setVisibility("isPublic", event.target.checked)
                    }
                  />
                </label>

                <label className="oa-toggle-row">
                  <span className="oa-toggle-icon">
                    <Building2 size={18} />
                  </span>
                  <span className="oa-toggle-copy">
                    <strong>Principal office page</strong>
                    <small>
                      Show the officer on their principal office's page.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(form.visibility.showOnOfficePage)}
                    onChange={(event) =>
                      setVisibility("showOnOfficePage", event.target.checked)
                    }
                  />
                </label>

                <label className="oa-toggle-row">
                  <span className="oa-toggle-icon">
                    <Users size={18} />
                  </span>
                  <span className="oa-toggle-copy">
                    <strong>Leadership directory</strong>
                    <small>
                      Include the officer in the public leadership directory.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(
                      form.visibility.showInLeadershipDirectory
                    )}
                    onChange={(event) =>
                      setVisibility(
                        "showInLeadershipDirectory",
                        event.target.checked
                      )
                    }
                  />
                </label>
              </div>
            </div>
          </div>

          <footer className="oa-modal-footer">
            <button
              type="button"
              className="oa-button oa-button--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="oa-button oa-button--primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="oa-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={17} />
                  {assignment ? "Save changes" : "Create assignment"}
                </>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

/* ===========================================================
   MAIN PAGE
=========================================================== */

export default function OfficeAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [officeTypeFilter, setOfficeTypeFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    page: 1,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [actionId, setActionId] = useState("");

  const filters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      status: statusFilter || undefined,
      officeType: officeTypeFilter || undefined,
      isPublic:
        visibilityFilter === ""
          ? undefined
          : visibilityFilter === "public",
    }),
    [page, search, statusFilter, officeTypeFilter, visibilityFilter]
  );

  const loadAssignments = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const [listResponse, statsResponse] = await Promise.all([
          officeAssignmentService.getOfficeAssignments(filters),
          officeAssignmentService.getOfficeAssignmentStatistics(),
        ]);

        const list = getList(listResponse);
        const stats = getPayload(statsResponse) || {};

        setAssignments(list);
        setStatistics(stats);
        setPagination(getPagination(listResponse, list.length, page));
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters, page]
  );

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, officeTypeFilter, visibilityFilter]);

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingAssignment(null);
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    setModalOpen(true);
    setNotice("");
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setModalOpen(true);
    setNotice("");
  };

  const handleSave = async (payload) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingAssignment) {
        await officeAssignmentService.updateOfficeAssignment(
          getAssignmentId(editingAssignment),
          payload
        );
        setNotice("Office assignment updated successfully.");
      } else {
        await officeAssignmentService.createOfficeAssignment(payload);
        setNotice("Office assignment created successfully.");
      }

      setModalOpen(false);
      setEditingAssignment(null);
      await loadAssignments({ silent: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAction = async (assignment, action) => {
    const id = getAssignmentId(assignment);

    if (!id) {
      setError("This assignment does not have a valid ID.");
      return;
    }

    const labels = {
      activate: "activate",
      deactivate: "deactivate",
      complete: "mark as completed",
    };

    if (
      !window.confirm(
        `Are you sure you want to ${labels[action]} this assignment?`
      )
    ) {
      return;
    }

    setActionId(id);
    setError("");
    setNotice("");

    try {
      if (action === "activate") {
        await officeAssignmentService.activateOfficeAssignment(id);
      } else if (action === "deactivate") {
        await officeAssignmentService.deactivateOfficeAssignment(id);
      } else if (action === "complete") {
        await officeAssignmentService.completeOfficeAssignment(id);
      }

      setNotice(`Assignment ${labels[action]} successfully.`);
      await loadAssignments({ silent: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setActionId("");
    }
  };

  const handleDelete = async (assignment) => {
    const id = getAssignmentId(assignment);

    if (!id) {
      setError("This assignment does not have a valid ID.");
      return;
    }

    const name = getMemberName(assignment.member);

    if (
      !window.confirm(
        `Permanently delete the assignment for ${name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setActionId(id);
    setError("");
    setNotice("");

    try {
      await officeAssignmentService.deleteOfficeAssignment(id);
      setNotice("Office assignment deleted successfully.");

      if (assignments.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadAssignments({ silent: true });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setActionId("");
    }
  };

  const totalAssignments =
    statistics.totalAssignments ??
    statistics.total ??
    pagination.total ??
    0;

  const activeAssignments =
    statistics.activeAssignments ?? statistics.active ?? 0;

  const inactiveAssignments =
    statistics.inactiveAssignments ?? statistics.inactive ?? 0;

  const completedAssignments =
    statistics.completedAssignments ?? statistics.completed ?? 0;

  return (
    <main className="oa-page">
      <div className="oa-container">
        <header className="oa-page-header">
          <div className="oa-heading">
            <div className="oa-breadcrumb">
              Administration <span>/</span> Leadership
            </div>

            <h1>Office Assignments</h1>

            <p>
              Manage supporting officers assigned to JVP's principal
              leadership offices.
            </p>
          </div>

          <div className="oa-header-actions">
            <button
              type="button"
              className="oa-button oa-button--secondary"
              onClick={() => loadAssignments({ silent: true })}
              disabled={loading || refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "oa-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              className="oa-button oa-button--primary"
              onClick={openCreateModal}
            >
              <Plus size={18} />
              New assignment
            </button>
          </div>
        </header>

        {error && (
          <div className="oa-alert oa-alert--error">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {notice && (
          <div className="oa-alert oa-alert--success">
            <CheckCircle2 size={18} />
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="oa-stats-grid" aria-label="Assignment statistics">
          <StatCard
            icon={BriefcaseBusiness}
            label="Total assignments"
            value={totalAssignments}
            description="All recorded assignments"
            tone="blue"
          />
          <StatCard
            icon={CheckCircle2}
            label="Active"
            value={activeAssignments}
            description="Currently active assignments"
            tone="green"
          />
          <StatCard
            icon={Clock3}
            label="Inactive"
            value={inactiveAssignments}
            description="Inactive assignments"
            tone="amber"
          />
          <StatCard
            icon={ShieldCheck}
            label="Completed"
            value={completedAssignments}
            description="Completed assignments"
            tone="purple"
          />
        </section>

        <section className="oa-panel">
          <div className="oa-panel-header">
            <div>
              <h2>Supporting officers</h2>
              <p>
                View and manage the teams serving under principal
                office-holders.
              </p>
            </div>
            <span className="oa-result-count">
              {pagination.total} records
            </span>
          </div>

          <div className="oa-toolbar">
            <div className="oa-search">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search members, designations..."
                aria-label="Search office assignments"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="oa-filters">
              <label className="oa-filter-control">
                <Filter size={15} />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="oa-filter-control">
                <select
                  value={officeTypeFilter}
                  onChange={(event) =>
                    setOfficeTypeFilter(event.target.value)
                  }
                  aria-label="Filter by office type"
                >
                  <option value="">All offices</option>
                  {OFFICE_TYPES.map((office) => (
                    <option key={office.value} value={office.value}>
                      {office.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="oa-filter-control">
                <select
                  value={visibilityFilter}
                  onChange={(event) =>
                    setVisibilityFilter(event.target.value)
                  }
                  aria-label="Filter by visibility"
                >
                  <option value="">All visibility</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>
          </div>

          <div className="oa-table-wrap">
            <table className="oa-table">
              <thead>
                <tr>
                  <th>Supporting officer</th>
                  <th>Principal office-holder</th>
                  <th>Designation</th>
                  <th>Term</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th className="oa-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="oa-table-state">
                        <RefreshCw size={22} className="oa-spin" />
                        <strong>Loading office assignments</strong>
                        <span>Please wait while records are retrieved.</span>
                      </div>
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="oa-table-state">
                        <div className="oa-empty-icon">
                          <Users size={25} />
                        </div>
                        <strong>No office assignments found</strong>
                        <span>
                          Try changing your filters or create a new assignment.
                        </span>
                        <button
                          type="button"
                          className="oa-button oa-button--primary"
                          onClick={openCreateModal}
                        >
                          <Plus size={16} />
                          Create assignment
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  assignments.map((assignment) => {
                    const id = getAssignmentId(assignment);
                    const status = getStatus(assignment);
                    const visibility = getVisibility(assignment);
                    const busy = actionId === id;

                    return (
                      <tr key={id}>
                        <td>
                          <div className="oa-person-cell">
                            <div className="oa-avatar">
                              {getImage(assignment.member) ? (
                                <img src={getImage(assignment.member)} alt="" />
                              ) : (
                                <UserRound size={19} />
                              )}
                            </div>
                            <div className="oa-person-copy">
                              <strong>{getMemberName(assignment.member)}</strong>
                              <span>
                                {getMemberNumber(assignment.member) ||
                                  `ID: ${getId(assignment.member) || "—"}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="oa-office-cell">
                            <strong>
                              {getOfficeHolderName(assignment.officeHolder)}
                            </strong>
                            <span>
                              {assignment.officeHolder?.officeDisplayTitle ||
                                assignment.officeHolder?.position ||
                                getOfficeTypeLabel(assignment.officeType)}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="oa-designation">
                            {assignment.designation || "—"}
                          </div>
                          {assignment.portfolioKey && (
                            <span className="oa-subtle">
                              {assignment.portfolioKey.replace(/_/g, " ")}
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="oa-term">
                            <CalendarDays size={15} />
                            <span>
                              {formatDate(assignment.startDate)}
                              <span className="oa-term-separator">–</span>
                              {formatDate(assignment.endDate)}
                            </span>
                          </div>
                        </td>

                        <td>
                          <StatusBadge status={status} />
                        </td>

                        <td>
                          <VisibilityBadge
                            visible={
                              visibility.isPublic &&
                              visibility.showOnOfficePage
                            }
                          />
                        </td>

                        <td>
                          <div className="oa-row-actions">
                            <button
                              type="button"
                              className="oa-row-action"
                              onClick={() => openEditModal(assignment)}
                              title="Edit assignment"
                              aria-label="Edit assignment"
                              disabled={busy}
                            >
                              <Pencil size={16} />
                            </button>

                            {status === "active" ? (
                              <button
                                type="button"
                                className="oa-row-action oa-row-action--warning"
                                onClick={() =>
                                  handleStatusAction(assignment, "deactivate")
                                }
                                title="Deactivate assignment"
                                aria-label="Deactivate assignment"
                                disabled={busy}
                              >
                                <Power size={16} />
                              </button>
                            ) : status === "inactive" ? (
                              <button
                                type="button"
                                className="oa-row-action oa-row-action--success"
                                onClick={() =>
                                  handleStatusAction(assignment, "activate")
                                }
                                title="Activate assignment"
                                aria-label="Activate assignment"
                                disabled={busy}
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            ) : null}

                            {status !== "completed" && (
                              <button
                                type="button"
                                className="oa-row-action"
                                onClick={() =>
                                  handleStatusAction(assignment, "complete")
                                }
                                title="Mark completed"
                                aria-label="Mark completed"
                                disabled={busy}
                              >
                                <Check size={16} />
                              </button>
                            )}

                            <button
                              type="button"
                              className="oa-row-action oa-row-action--danger"
                              onClick={() => handleDelete(assignment)}
                              title="Delete assignment"
                              aria-label="Delete assignment"
                              disabled={busy}
                            >
                              {busy ? (
                                <RefreshCw size={16} className="oa-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <footer className="oa-pagination">
            <span>
              Showing{" "}
              <strong>
                {assignments.length === 0
                  ? 0
                  : (page - 1) * PAGE_SIZE + 1}
                {"–"}
                {(page - 1) * PAGE_SIZE + assignments.length}
              </strong>{" "}
              of <strong>{pagination.total}</strong> assignments
            </span>

            <div className="oa-pagination-controls">
              <button
                type="button"
                className="oa-pagination-button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                Page {page} of {pagination.pages}
              </span>
              <button
                type="button"
                className="oa-pagination-button"
                disabled={page >= pagination.pages || loading}
                onClick={() => setPage((current) => current + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </footer>
        </section>

        <div className="oa-page-footnote">
          <ShieldCheck size={16} />
          <span>
            Changes are subject to the permissions configured for your
            JVP Connect account.
          </span>
        </div>
      </div>

      {modalOpen && (
        <AssignmentModal
          key={editingAssignment ? getAssignmentId(editingAssignment) : "new"}
          assignment={editingAssignment}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}
    </main>
  );
}
