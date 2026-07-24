/* ========================================================================
   JUMUIYA YA VIJANA WA PWANI (JVP)
   CLIENT LEADERSHIP CONSTANTS
======================================================================== */

/* ========================================================================
   LEADERSHIP LEVELS
======================================================================== */

export const LEADERSHIP_LEVELS = {
  REGIONAL_EXECUTIVE: "regional_executive",
  COUNCIL_OF_GOVERNORS: "council_of_governors",
  YOUTH_ASSEMBLY: "youth_assembly",
  COUNTY_LEADERSHIP: "county_leadership",
};

export const LEADERSHIP_LEVEL_OPTIONS = [
  {
    value: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    label: "Regional Executive",
  },
  {
    value: LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
    label: "Council of Governors",
  },
  {
    value: LEADERSHIP_LEVELS.YOUTH_ASSEMBLY,
    label: "Youth Assembly",
  },
  {
    value: LEADERSHIP_LEVELS.COUNTY_LEADERSHIP,
    label: "County Leadership",
  },
];

/* ========================================================================
   LEADERSHIP DEPARTMENTS
======================================================================== */

export const LEADERSHIP_DEPARTMENTS = {
  EXECUTIVE: "executive",
  GOVERNANCE: "governance",
  LEGISLATIVE: "legislative",
  SECRETARIAT: "secretariat",
  PATRONAGE: "patronage",
};

export const LEADERSHIP_DEPARTMENT_OPTIONS = [
  {
    value: LEADERSHIP_DEPARTMENTS.EXECUTIVE,
    label: "Executive",
  },
  {
    value: LEADERSHIP_DEPARTMENTS.GOVERNANCE,
    label: "Governance",
  },
  {
    value: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
    label: "Legislative",
  },
  {
    value: LEADERSHIP_DEPARTMENTS.SECRETARIAT,
    label: "Secretariat",
  },
  {
    value: LEADERSHIP_DEPARTMENTS.PATRONAGE,
    label: "Patronage",
  },
];

/* ========================================================================
   LEADERSHIP OFFICES
======================================================================== */

export const LEADERSHIP_OFFICES = {
  /* ==========================================================
     REGIONAL EXECUTIVE COMMITTEE
  ========================================================== */

  PRESIDENT: {
    value: "president",
    label: "President",
  },

  DEPUTY_PRESIDENT: {
    value: "deputy_president",
    label: "Deputy President",
  },

  SECRETARY_GENERAL: {
    value: "secretary_general",
    label: "Secretary General",
  },

  TREASURER: {
    value: "treasurer",
    label: "Treasurer",
  },

  COMMUNICATIONS_SECRETARY: {
    value: "communications_secretary",
    label: "Communications Secretary",
  },

  PRINCIPAL_ASSISTANT: {
    value: "principal_assistant",
    label: "Principal Assistant",
  },

  DIRECTOR_WELFARE_MEMBERSHIP_SUPPORT: {
    value: "director_welfare_membership_support",
    label: "Director, Welfare, Membership & Support",
  },

  DIRECTOR_YOUTH_EMPOWERMENT: {
    value: "director_youth_empowerment",
    label: "Director, Youth Empowerment",
  },

  PROTOCOL_SECRETARY: {
    value: "protocol_secretary",
    label: "Protocol Secretary",
  },

  DIRECTOR_LEGAL_INCLUSION_AFFAIRS: {
    value: "director_legal_inclusion_affairs",
    label: "Director, Legal & Inclusion Affairs",
  },

  CHIEF_OF_STAFF: {
    value: "chief_of_staff",
    label: "Chief of Staff",
  },

  DIRECTOR_PROGRAMS: {
    value: "director_programs",
    label: "Director, Programs",
  },

  PRESIDENTIAL_ADVISOR: {
    value: "presidential_advisor",
    label: "Presidential Advisor",
  },

  DIRECTOR_RESOURCE_MOBILIZATION_PARTNERSHIPS: {
    value: "director_resource_mobilization_partnerships",
    label: "Director, Resource Mobilization & Partnerships",
  },

  /* ==========================================================
     COUNCIL OF GOVERNORS
  ========================================================== */

  GOVERNOR: {
    value: "governor",
    label: "Governor",
  },

  DEPUTY_GOVERNOR: {
    value: "deputy_governor",
    label: "Deputy Governor",
  },

  /* ==========================================================
     YOUTH ASSEMBLY
  ========================================================== */

  SPEAKER: {
    value: "speaker",
    label: "Speaker",
  },

  DEPUTY_SPEAKER: {
    value: "deputy_speaker",
    label: "Deputy Speaker",
  },

  ELECTED_MP: {
    value: "elected_mp",
    label: "Elected Youth Member of Assembly",
  },

  NOMINATED_MP: {
    value: "nominated_mp",
    label: "Nominated Youth Member of Assembly",
  },

  CLERK: {
    value: "clerk",
    label: "Clerk",
  },

  DEPUTY_CLERK: {
    value: "deputy_clerk",
    label: "Deputy Clerk",
  },

  /* ==========================================================
     COUNTY LEADERSHIP
  ========================================================== */

  YOUTH_MCA: {
    value: "youth_mca",
    label: "Youth Member of County Assembly",
  },

  /* ==========================================================
     HONORARY
  ========================================================== */

  PATRON: {
    value: "patron",
    label: "Patron",
  },
};

export const LEADERSHIP_OFFICE_OPTIONS =
  Object.values(LEADERSHIP_OFFICES);

/* ========================================================================
   APPOINTMENT TYPES
======================================================================== */

export const APPOINTMENT_TYPES = {
  ELECTED: "elected",
  NOMINATED: "nominated",
  APPOINTED: "appointed",
};

export const APPOINTMENT_TYPE_OPTIONS = [
  {
    value: APPOINTMENT_TYPES.ELECTED,
    label: "Elected",
  },
  {
    value: APPOINTMENT_TYPES.NOMINATED,
    label: "Nominated",
  },
  {
    value: APPOINTMENT_TYPES.APPOINTED,
    label: "Appointed",
  },
];

/* ========================================================================
   LEADERSHIP STATUS
======================================================================== */

export const LEADERSHIP_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  COMPLETED: "completed",
  SUSPENDED: "suspended",
  VACANT: "vacant",
};

export const LEADERSHIP_STATUS_OPTIONS = [
  {
    value: LEADERSHIP_STATUS.ACTIVE,
    label: "Active",
  },
  {
    value: LEADERSHIP_STATUS.INACTIVE,
    label: "Inactive",
  },
  {
    value: LEADERSHIP_STATUS.COMPLETED,
    label: "Completed",
  },
  {
    value: LEADERSHIP_STATUS.SUSPENDED,
    label: "Suspended",
  },
  {
    value: LEADERSHIP_STATUS.VACANT,
    label: "Vacant",
  },
];

/* ========================================================================
   ORGANIZATIONAL SCOPE
======================================================================== */

export const LEADERSHIP_SCOPE = {
  REGIONAL: "regional",
  COUNTY: "county",
  CONSTITUENCY: "constituency",
  WARD: "ward",
};

export const LEADERSHIP_SCOPE_OPTIONS = [
  {
    value: LEADERSHIP_SCOPE.REGIONAL,
    label: "Regional",
  },
  {
    value: LEADERSHIP_SCOPE.COUNTY,
    label: "County",
  },
  {
    value: LEADERSHIP_SCOPE.CONSTITUENCY,
    label: "Constituency",
  },
  {
    value: LEADERSHIP_SCOPE.WARD,
    label: "Ward",
  },
];

/* ========================================================================
   REPORT VISIBILITY
======================================================================== */

export const REPORT_VISIBILITY = {
  PRIVATE: "private",
  WARD: "ward",
  CONSTITUENCY: "constituency",
  COUNTY: "county",
  REGIONAL: "regional",
};

export const REPORT_VISIBILITY_OPTIONS = [
  {
    value: REPORT_VISIBILITY.PRIVATE,
    label: "Private",
  },
  {
    value: REPORT_VISIBILITY.WARD,
    label: "Ward",
  },
  {
    value: REPORT_VISIBILITY.CONSTITUENCY,
    label: "Constituency",
  },
  {
    value: REPORT_VISIBILITY.COUNTY,
    label: "County",
  },
  {
    value: REPORT_VISIBILITY.REGIONAL,
    label: "Regional",
  },
];

/* ========================================================================
   LEADERSHIP PERMISSIONS
======================================================================== */

export const LEADERSHIP_PERMISSIONS = {
  VIEW_MEMBERS: "view_members",
  VIEW_LEADERS: "view_leaders",
  VIEW_REPORTS: "view_reports",
  SUBMIT_REPORTS: "submit_reports",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_DOCUMENTS: "manage_documents",
  MANAGE_MEETINGS: "manage_meetings",
  MANAGE_ANNOUNCEMENTS: "manage_announcements",
  MANAGE_LEADERS: "manage_leaders",
};

/* ========================================================================
   COAST REGION COUNTIES
======================================================================== */

export const COAST_COUNTIES = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
];

/* ========================================================================
   OFFICE CONFIGURATION
======================================================================== */

export const OFFICE_CONFIGURATION = {
  president: {
    title: "President",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  deputy_president: {
    title: "Deputy President",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  secretary_general: {
    title: "Secretary General",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.SECRETARIAT,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  treasurer: {
    title: "Treasurer",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.SECRETARIAT,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  communications_secretary: {
    title: "Communications Secretary",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.SECRETARIAT,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  principal_assistant: {
    title: "Principal Assistant",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.SECRETARIAT,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  director_welfare_membership_support: {
    title: "Director, Welfare, Membership & Support",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.GOVERNANCE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  director_youth_empowerment: {
    title: "Director, Youth Empowerment",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.GOVERNANCE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  protocol_secretary: {
    title: "Protocol Secretary",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.SECRETARIAT,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  director_legal_inclusion_affairs: {
    title: "Director, Legal & Inclusion Affairs",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.GOVERNANCE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  chief_of_staff: {
    title: "Chief of Staff",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  director_programs: {
    title: "Director, Programs",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.GOVERNANCE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  presidential_advisor: {
    title: "Presidential Advisor",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  director_resource_mobilization_partnerships: {
    title: "Director, Resource Mobilization & Partnerships",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.GOVERNANCE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  governor: {
    title: "Governor",
    level: LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
    department: LEADERSHIP_DEPARTMENTS.GOVERNANCE,
    scope: LEADERSHIP_SCOPE.COUNTY,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  deputy_governor: {
    title: "Deputy Governor",
    level: LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
    department: LEADERSHIP_DEPARTMENTS.GOVERNANCE,
    scope: LEADERSHIP_SCOPE.COUNTY,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  speaker: {
    title: "Speaker",
    level: LEADERSHIP_LEVELS.YOUTH_ASSEMBLY,
    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  deputy_speaker: {
    title: "Deputy Speaker",
    level: LEADERSHIP_LEVELS.YOUTH_ASSEMBLY,
    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  elected_mp: {
    title: "Elected Youth Member of Assembly",
    level: LEADERSHIP_LEVELS.YOUTH_ASSEMBLY,
    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
    scope: LEADERSHIP_SCOPE.CONSTITUENCY,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  nominated_mp: {
    title: "Nominated Youth Member of Assembly",
    level: LEADERSHIP_LEVELS.YOUTH_ASSEMBLY,
    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
    scope: LEADERSHIP_SCOPE.CONSTITUENCY,
    appointmentType: APPOINTMENT_TYPES.NOMINATED,
  },

  clerk: {
    title: "Clerk",
    level: LEADERSHIP_LEVELS.YOUTH_ASSEMBLY,
    department: LEADERSHIP_DEPARTMENTS.SECRETARIAT,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  deputy_clerk: {
    title: "Deputy Clerk",
    level: LEADERSHIP_LEVELS.YOUTH_ASSEMBLY,
    department: LEADERSHIP_DEPARTMENTS.SECRETARIAT,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  youth_mca: {
    title: "Youth Member of County Assembly",
    level: LEADERSHIP_LEVELS.COUNTY_LEADERSHIP,
    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
    scope: LEADERSHIP_SCOPE.WARD,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  patron: {
    title: "Patron",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.PATRONAGE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },
};

/* ========================================================================
   HELPERS
======================================================================== */

/**
 * Returns the configuration for a leadership office.
 */
export const getOfficeConfiguration = (office) => {
  return OFFICE_CONFIGURATION[office] || null;
};

/**
 * Returns the display label for a leadership office.
 */
export const getOfficeLabel = (office) => {
  const option = LEADERSHIP_OFFICE_OPTIONS.find(
    (item) => item.value === office
  );

  return option?.label || office;
};