/* ========================================================================
   JUMUIYA YA VIJANA WA PWANI (JVP)
   LEADERSHIP CONSTANTS
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

export const LEADERSHIP_LEVEL_VALUES = Object.values(LEADERSHIP_LEVELS);

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

export const LEADERSHIP_DEPARTMENT_VALUES = Object.values(
  LEADERSHIP_DEPARTMENTS
);

/* ========================================================================
   LEADERSHIP OFFICES
======================================================================== */

export const LEADERSHIP_OFFICES = {
  /* ==========================================================
     REGIONAL EXECUTIVE COMMITTEE
  ========================================================== */

  PRESIDENT: "president",
  DEPUTY_PRESIDENT: "deputy_president",
  SECRETARY_GENERAL: "secretary_general",
  TREASURER: "treasurer",
  COMMUNICATIONS_SECRETARY: "communications_secretary",
  PRINCIPAL_ASSISTANT: "principal_assistant",
  DIRECTOR_WELFARE_MEMBERSHIP_SUPPORT:
    "director_welfare_membership_support",
  DIRECTOR_YOUTH_EMPOWERMENT: "director_youth_empowerment",
  PROTOCOL_SECRETARY: "protocol_secretary",
  DIRECTOR_LEGAL_INCLUSION_AFFAIRS:
    "director_legal_inclusion_affairs",
  CHIEF_OF_STAFF: "chief_of_staff",
  DIRECTOR_PROGRAMS: "director_programs",
  PRESIDENTIAL_ADVISOR: "presidential_advisor",
  DIRECTOR_RESOURCE_MOBILIZATION_PARTNERSHIPS:
    "director_resource_mobilization_partnerships",

  /* ==========================================================
     COUNCIL OF GOVERNORS
  ========================================================== */

  GOVERNOR: "governor",
  DEPUTY_GOVERNOR: "deputy_governor",

  /* ==========================================================
     YOUTH ASSEMBLY
  ========================================================== */

  SPEAKER: "speaker",
  DEPUTY_SPEAKER: "deputy_speaker",
  ELECTED_MP: "elected_mp",
  NOMINATED_MP: "nominated_mp",
  CLERK: "clerk",
  DEPUTY_CLERK: "deputy_clerk",

  /* ==========================================================
     COUNTY LEADERSHIP
  ========================================================== */

  YOUTH_MCA: "youth_mca",

  /* ==========================================================
     HONORARY
  ========================================================== */

  PATRON: "patron",
};

export const LEADERSHIP_OFFICE_VALUES = Object.values(
  LEADERSHIP_OFFICES
);

/* ========================================================================
   APPOINTMENT TYPES
======================================================================== */

export const APPOINTMENT_TYPES = {
  ELECTED: "elected",
  NOMINATED: "nominated",
  APPOINTED: "appointed",
};

export const APPOINTMENT_TYPE_VALUES = Object.values(APPOINTMENT_TYPES);

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

export const LEADERSHIP_STATUS_VALUES = Object.values(
  LEADERSHIP_STATUS
);

/* ========================================================================
   ORGANIZATIONAL SCOPE
======================================================================== */

export const LEADERSHIP_SCOPE = {
  REGIONAL: "regional",
  COUNTY: "county",
  CONSTITUENCY: "constituency",
  WARD: "ward",
};

export const LEADERSHIP_SCOPE_VALUES = Object.values(
  LEADERSHIP_SCOPE
);

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

export const REPORT_VISIBILITY_VALUES = Object.values(
  REPORT_VISIBILITY
);

/* ========================================================================
   PERMISSIONS
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

export const OFFICE_CONFIGURATION = {
  president: {
    title: "President",
    level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,
    scope: LEADERSHIP_SCOPE.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  governor: {
    title: "Governor",
    level: LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
    department: LEADERSHIP_DEPARTMENTS.GOVERNANCE,
    scope: LEADERSHIP_SCOPE.COUNTY,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  elected_mp: {
    title: "Youth Member of Assembly",
    level: LEADERSHIP_LEVELS.YOUTH_ASSEMBLY,
    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
    scope: LEADERSHIP_SCOPE.CONSTITUENCY,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  youth_mca: {
    title: "Youth MCA",
    level: LEADERSHIP_LEVELS.COUNTY_LEADERSHIP,
    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
    scope: LEADERSHIP_SCOPE.WARD,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

 /* ==========================================================
   REGIONAL EXECUTIVE COMMITTEE
========================================================== */

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

/* ==========================================================
   COUNCIL OF GOVERNORS
========================================================== */

deputy_governor: {
  title: "Deputy Governor",
  level: LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
  department: LEADERSHIP_DEPARTMENTS.GOVERNANCE,
  scope: LEADERSHIP_SCOPE.COUNTY,
  appointmentType: APPOINTMENT_TYPES.ELECTED,
},

/* ==========================================================
   YOUTH ASSEMBLY
========================================================== */

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

/* ==========================================================
   COUNTY LEADERSHIP
========================================================== */

youth_mca: {
  title: "Youth Member of County Assembly",
  level: LEADERSHIP_LEVELS.COUNTY_LEADERSHIP,
  department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
  scope: LEADERSHIP_SCOPE.WARD,
  appointmentType: APPOINTMENT_TYPES.ELECTED,
},

/* ==========================================================
   HONORARY
========================================================== */

patron: {
  title: "Patron",
  level: LEADERSHIP_LEVELS.REGIONAL_EXECUTIVE,
  department: LEADERSHIP_DEPARTMENTS.PATRONAGE,
  scope: LEADERSHIP_SCOPE.REGIONAL,
  appointmentType: APPOINTMENT_TYPES.APPOINTED,
},
};