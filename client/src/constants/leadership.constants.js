/* ==========================================================
   JVP LEADERSHIP CONSTANTS
========================================================== */

/*
  Leadership architecture:

  1. Regional Cabinet
  2. Regional Youth Assembly
  3. Council of Governors
  4. County Cabinets
  5. County Youth Assemblies

  Patronage is separate from the five structural levels.
*/

/* ==========================================================
   LEADERSHIP LEVELS
========================================================== */

export const LEADERSHIP_LEVELS = {
  REGIONAL_CABINET: "regional_cabinet",
  REGIONAL_YOUTH_ASSEMBLY: "regional_youth_assembly",
  COUNCIL_OF_GOVERNORS: "council_of_governors",
  COUNTY_CABINET: "county_cabinet",
  COUNTY_YOUTH_ASSEMBLY: "county_youth_assembly",
};

export const LEADERSHIP_LEVEL_VALUES = Object.values(
  LEADERSHIP_LEVELS
);


/* ==========================================================
   LEADERSHIP CATEGORIES
========================================================== */

export const LEADERSHIP_CATEGORIES = {
  EXECUTIVE: "executive",
  LEGISLATIVE: "legislative",
  SECRETARIAT: "secretariat",
  PATRONAGE: "patronage",
};

export const LEADERSHIP_CATEGORY_VALUES = Object.values(
  LEADERSHIP_CATEGORIES
);


/* ==========================================================
   LEADERSHIP DEPARTMENTS
========================================================== */

export const LEADERSHIP_DEPARTMENTS = {
  EXECUTIVE: "executive",
  LEGISLATIVE: "legislative",
  SECRETARIAT: "secretariat",
};

export const LEADERSHIP_DEPARTMENT_VALUES = Object.values(
  LEADERSHIP_DEPARTMENTS
);


/* ==========================================================
   STRUCTURAL SCOPE
========================================================== */

/*
  IMPORTANT:

  scope describes the structural part of JVP leadership.

  It is NOT geographic.

  Council of Governors deliberately has no scope because
  it is a separate structural level and operates through
  county representation.
*/

export const LEADERSHIP_SCOPE = {
  REGIONAL_CABINET: "regional_cabinet",
  REGIONAL_YOUTH_ASSEMBLY: "regional_youth_assembly",
  COUNTY_CABINET: "county_cabinet",
  COUNTY_YOUTH_ASSEMBLY: "county_youth_assembly",
};

export const LEADERSHIP_SCOPE_VALUES = Object.values(
  LEADERSHIP_SCOPE
);


/* ==========================================================
   REPORT VISIBILITY
========================================================== */

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


/* ==========================================================
   LEADERSHIP OFFICES
========================================================== */

export const LEADERSHIP_OFFICES = {
  /* --------------------------------------------------------
     PATRONAGE
  -------------------------------------------------------- */

  PATRON: "patron",

  /* --------------------------------------------------------
     REGIONAL CABINET
  -------------------------------------------------------- */

  PRESIDENT: "president",
  DEPUTY_PRESIDENT: "deputy_president",
  PRIME_CABINET_SECRETARY: "prime_cabinet_secretary",
  ATTORNEY_GENERAL: "attorney_general",
  CABINET_SECRETARY: "cabinet_secretary",

  /* --------------------------------------------------------
     REGIONAL YOUTH ASSEMBLY
  -------------------------------------------------------- */

  REGIONAL_SPEAKER: "regional_speaker",
  REGIONAL_DEPUTY_SPEAKER: "regional_deputy_speaker",
  REGIONAL_CLERK: "regional_clerk",
  REGIONAL_DEPUTY_CLERK: "regional_deputy_clerk",
  ELECTED_MP: "elected_mp",
  NOMINATED_MP: "nominated_mp",

  /* --------------------------------------------------------
     COUNCIL OF GOVERNORS
  -------------------------------------------------------- */

  COUNCIL_GOVERNOR: "council_governor",

  /* --------------------------------------------------------
     COUNTY CABINET
  -------------------------------------------------------- */

  COUNTY_GOVERNOR: "county_governor",
  DEPUTY_GOVERNOR: "deputy_governor",
  COUNTY_CABINET_SECRETARY: "county_cabinet_secretary",

  /* --------------------------------------------------------
     COUNTY YOUTH ASSEMBLY
  -------------------------------------------------------- */

  COUNTY_SPEAKER: "county_speaker",
  COUNTY_DEPUTY_SPEAKER: "county_deputy_speaker",
  COUNTY_CLERK: "county_clerk",
  COUNTY_DEPUTY_CLERK: "county_deputy_clerk",
  ELECTED_MCA: "elected_mca",
  NOMINATED_MCA: "nominated_mca",
};

export const LEADERSHIP_OFFICE_VALUES = Object.values(
  LEADERSHIP_OFFICES
);


/* ==========================================================
   APPOINTMENT TYPES
========================================================== */

export const APPOINTMENT_TYPES = {
  ELECTED: "elected",
  NOMINATED: "nominated",
  APPOINTED: "appointed",
};

export const APPOINTMENT_TYPE_VALUES = Object.values(
  APPOINTMENT_TYPES
);


/* ==========================================================
   LEADERSHIP STATUS
========================================================== */

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


/* ==========================================================
   LEGACY OFFICE ALIASES
========================================================== */

/*
  These aliases allow existing JVP records and older
  frontend/backend code to continue resolving old office
  names into the new architecture.
*/

export const LEGACY_LEADERSHIP_OFFICE_ALIASES = {
  governor: LEADERSHIP_OFFICES.COUNTY_GOVERNOR,

  speaker: LEADERSHIP_OFFICES.REGIONAL_SPEAKER,

  deputy_speaker:
    LEADERSHIP_OFFICES.REGIONAL_DEPUTY_SPEAKER,

  clerk:
    LEADERSHIP_OFFICES.REGIONAL_CLERK,

  deputy_clerk:
    LEADERSHIP_OFFICES.REGIONAL_DEPUTY_CLERK,

  youth_mca:
    LEADERSHIP_OFFICES.ELECTED_MCA,

  patron:
    LEADERSHIP_OFFICES.PATRON,
};


/* ==========================================================
   REGIONAL CABINET PORTFOLIOS
========================================================== */

export const REGIONAL_CABINET_PORTFOLIOS = [
  {
    key: "finance_planning",
    title: "Finance, Planning & Economic Affairs",
  },

  {
    key: "youth_employment",
    title:
      "Youth Employment, Entrepreneurship, Labour, Education, Skills & Human Capital",
  },

  {
    key: "agriculture_food_security",
    title:
      "Agriculture, Agribusiness & Food Security",
  },

  {
    key: "blue_economy",
    title:
      "Blue Economy, Fisheries & Maritime Affairs",
  },

  {
    key: "tourism_culture",
    title:
      "Tourism, Culture, Arts & Creative Economy",
  },

  {
    key: "trade",
    title:
      "Trade, Investment & Cooperatives",
  },

  {
    key: "ict_digital",
    title:
      "ICT, Digital Economy & Innovation",
  },

  {
    key: "environment",
    title:
      "Environment, Climate Change & Natural Resources",
  },

  {
    key: "health_sports",
    title:
      "Health, Sports & Youth Wellness",
  },

  {
    key: "gender_social",
    title:
      "Gender, Social Protection & Community Development",
  },

  {
    key: "infrastructure",
    title:
      "Infrastructure, Housing & Urban Development",
  },
];


/* ==========================================================
   OFFICE CONFIGURATION
========================================================== */

export const OFFICE_CONFIGURATION = {

  /* ========================================================
     PATRON
  ======================================================== */

  [LEADERSHIP_OFFICES.PATRON]: {
    title: "Patron",

    level: null,

    category:
      LEADERSHIP_CATEGORIES.PATRONAGE,

    department: null,

    scope: null,

    reportVisibility:
      REPORT_VISIBILITY.REGIONAL,

    appointmentType:
      APPOINTMENT_TYPES.APPOINTED,

    requiresMember: false,

    requiresCounty: false,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     PRESIDENT
  ======================================================== */

  [LEADERSHIP_OFFICES.PRESIDENT]: {
    title: "President",

    level:
      LEADERSHIP_LEVELS.REGIONAL_CABINET,

    category:
      LEADERSHIP_CATEGORIES.EXECUTIVE,

    department:
      LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope:
      LEADERSHIP_SCOPE.REGIONAL_CABINET,

    reportVisibility:
      REPORT_VISIBILITY.REGIONAL,

    appointmentType:
      APPOINTMENT_TYPES.ELECTED,

    requiresMember: true,

    requiresCounty: false,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     DEPUTY PRESIDENT
  ======================================================== */

  [LEADERSHIP_OFFICES.DEPUTY_PRESIDENT]: {
    title: "Deputy President",

    level:
      LEADERSHIP_LEVELS.REGIONAL_CABINET,

    category:
      LEADERSHIP_CATEGORIES.EXECUTIVE,

    department:
      LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope:
      LEADERSHIP_SCOPE.REGIONAL_CABINET,

    reportVisibility:
      REPORT_VISIBILITY.REGIONAL,

    appointmentType:
      APPOINTMENT_TYPES.ELECTED,

    requiresMember: true,

    requiresCounty: false,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     PRIME CABINET SECRETARY
  ======================================================== */

  [LEADERSHIP_OFFICES.PRIME_CABINET_SECRETARY]: {
    title: "Prime Cabinet Secretary",

    level:
      LEADERSHIP_LEVELS.REGIONAL_CABINET,

    category:
      LEADERSHIP_CATEGORIES.EXECUTIVE,

    department:
      LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope:
      LEADERSHIP_SCOPE.REGIONAL_CABINET,

    reportVisibility:
      REPORT_VISIBILITY.REGIONAL,

    appointmentType:
      APPOINTMENT_TYPES.APPOINTED,

    requiresMember: true,

    requiresCounty: false,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     ATTORNEY GENERAL
  ======================================================== */

  [LEADERSHIP_OFFICES.ATTORNEY_GENERAL]: {
    title: "Attorney General",

    level:
      LEADERSHIP_LEVELS.REGIONAL_CABINET,

    category:
      LEADERSHIP_CATEGORIES.EXECUTIVE,

    department:
      LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope:
      LEADERSHIP_SCOPE.REGIONAL_CABINET,

    reportVisibility:
      REPORT_VISIBILITY.REGIONAL,

    appointmentType:
      APPOINTMENT_TYPES.APPOINTED,

    requiresMember: true,

    requiresCounty: false,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     CABINET SECRETARY
  ======================================================== */

  [LEADERSHIP_OFFICES.CABINET_SECRETARY]: {
    title: "Cabinet Secretary",

    level:
      LEADERSHIP_LEVELS.REGIONAL_CABINET,

    category:
      LEADERSHIP_CATEGORIES.EXECUTIVE,

    department:
      LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope:
      LEADERSHIP_SCOPE.REGIONAL_CABINET,

    reportVisibility:
      REPORT_VISIBILITY.REGIONAL,

    appointmentType:
      APPOINTMENT_TYPES.APPOINTED,

    requiresMember: true,

    requiresCounty: false,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: true,

    portfolios:
      REGIONAL_CABINET_PORTFOLIOS,
  },


  /* ========================================================
     REGIONAL SPEAKER
  ======================================================== */

  [LEADERSHIP_OFFICES.REGIONAL_SPEAKER]: {
    title: "Regional Youth Assembly Speaker",

    level:
      LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.REGIONAL,

    appointmentType:
      APPOINTMENT_TYPES.ELECTED,

    requiresMember: true,

    requiresCounty: false,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     REGIONAL DEPUTY SPEAKER
  ======================================================== */

  [LEADERSHIP_OFFICES.REGIONAL_DEPUTY_SPEAKER]: {
    title:
      "Regional Youth Assembly Deputy Speaker",

    level:
      LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.REGIONAL,

    appointmentType:
      APPOINTMENT_TYPES.ELECTED,

    requiresMember: true,

    requiresCounty: false,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     REGIONAL CLERK
  ======================================================== */

  [LEADERSHIP_OFFICES.REGIONAL_CLERK]: {
    title: "Regional Youth Assembly Clerk",

    level:
      LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.REGIONAL,

    appointmentType:
      APPOINTMENT_TYPES.APPOINTED,

    requiresMember: true,

    requiresCounty: false,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     REGIONAL DEPUTY CLERK
  ======================================================== */

  [LEADERSHIP_OFFICES.REGIONAL_DEPUTY_CLERK]: {
    title:
      "Regional Youth Assembly Deputy Clerk",

    level:
      LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.REGIONAL,

    appointmentType:
      APPOINTMENT_TYPES.APPOINTED,

    requiresMember: true,

    requiresCounty: false,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     ELECTED MP
  ======================================================== */

  [LEADERSHIP_OFFICES.ELECTED_MP]: {
    title: "Elected Youth MP",

    level:
      LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.CONSTITUENCY,

    appointmentType:
      APPOINTMENT_TYPES.ELECTED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: true,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     NOMINATED MP
  ======================================================== */

  [LEADERSHIP_OFFICES.NOMINATED_MP]: {
    title: "Nominated Youth MP",

    level:
      LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.CONSTITUENCY,

    appointmentType:
      APPOINTMENT_TYPES.NOMINATED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: true,

    requiresWard: false,

    allowMultiple: true,
  },


  /* ========================================================
     COUNCIL OF GOVERNORS
  ======================================================== */

  [LEADERSHIP_OFFICES.COUNCIL_GOVERNOR]: {
    title: "Youth Governor",

    level:
      LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,

    category:
      LEADERSHIP_CATEGORIES.SECRETARIAT,

    department:
      LEADERSHIP_DEPARTMENTS.SECRETARIAT,

    /*
      Council of Governors is its own level.
      It deliberately has no structural scope.
    */
    scope: null,

    reportVisibility:
      REPORT_VISIBILITY.COUNTY,

    appointmentType:
      APPOINTMENT_TYPES.ELECTED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: true,
  },


  /* ========================================================
     COUNTY GOVERNOR
  ======================================================== */

  [LEADERSHIP_OFFICES.COUNTY_GOVERNOR]: {
    title: "Youth Governor",

    level:
      LEADERSHIP_LEVELS.COUNTY_CABINET,

    category:
      LEADERSHIP_CATEGORIES.EXECUTIVE,

    department:
      LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope:
      LEADERSHIP_SCOPE.COUNTY_CABINET,

    reportVisibility:
      REPORT_VISIBILITY.COUNTY,

    appointmentType:
      APPOINTMENT_TYPES.ELECTED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     DEPUTY GOVERNOR
  ======================================================== */

  [LEADERSHIP_OFFICES.DEPUTY_GOVERNOR]: {
    title: "Deputy Youth Governor",

    level:
      LEADERSHIP_LEVELS.COUNTY_CABINET,

    category:
      LEADERSHIP_CATEGORIES.EXECUTIVE,

    department:
      LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope:
      LEADERSHIP_SCOPE.COUNTY_CABINET,

    reportVisibility:
      REPORT_VISIBILITY.COUNTY,

    appointmentType:
      APPOINTMENT_TYPES.ELECTED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     COUNTY CABINET SECRETARY
  ======================================================== */

  [LEADERSHIP_OFFICES.COUNTY_CABINET_SECRETARY]: {
    title: "County Cabinet Secretary",

    level:
      LEADERSHIP_LEVELS.COUNTY_CABINET,

    category:
      LEADERSHIP_CATEGORIES.EXECUTIVE,

    department:
      LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope:
      LEADERSHIP_SCOPE.COUNTY_CABINET,

    reportVisibility:
      REPORT_VISIBILITY.COUNTY,

    appointmentType:
      APPOINTMENT_TYPES.APPOINTED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: true,
  },


  /* ========================================================
     COUNTY SPEAKER
  ======================================================== */

  [LEADERSHIP_OFFICES.COUNTY_SPEAKER]: {
    title: "County Youth Assembly Speaker",

    level:
      LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.COUNTY,

    appointmentType:
      APPOINTMENT_TYPES.ELECTED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     COUNTY DEPUTY SPEAKER
  ======================================================== */

  [LEADERSHIP_OFFICES.COUNTY_DEPUTY_SPEAKER]: {
    title:
      "County Youth Assembly Deputy Speaker",

    level:
      LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.COUNTY,

    appointmentType:
      APPOINTMENT_TYPES.ELECTED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     COUNTY CLERK
  ======================================================== */

  [LEADERSHIP_OFFICES.COUNTY_CLERK]: {
    title: "County Youth Assembly Clerk",

    level:
      LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.COUNTY,

    appointmentType:
      APPOINTMENT_TYPES.APPOINTED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     COUNTY DEPUTY CLERK
  ======================================================== */

  [LEADERSHIP_OFFICES.COUNTY_DEPUTY_CLERK]: {
    title:
      "County Youth Assembly Deputy Clerk",

    level:
      LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.COUNTY,

    appointmentType:
      APPOINTMENT_TYPES.APPOINTED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: false,
  },


  /* ========================================================
     ELECTED MCA
  ======================================================== */

  [LEADERSHIP_OFFICES.ELECTED_MCA]: {
    title: "Elected Youth MCA",

    level:
      LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.WARD,

    appointmentType:
      APPOINTMENT_TYPES.ELECTED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: true,

    requiresWard: true,

    allowMultiple: false,
  },


  /* ========================================================
     NOMINATED MCA
  ======================================================== */

  [LEADERSHIP_OFFICES.NOMINATED_MCA]: {
    title: "Nominated Youth MCA",

    level:
      LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category:
      LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department:
      LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope:
      LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility:
      REPORT_VISIBILITY.COUNTY,

    appointmentType:
      APPOINTMENT_TYPES.NOMINATED,

    requiresMember: true,

    requiresCounty: true,

    requiresConstituency: false,

    requiresWard: false,

    allowMultiple: true,
  },
};


/* ==========================================================
   PERMISSIONS
========================================================== */

export const LEADERSHIP_PERMISSIONS = {
  VIEW_LEADERSHIP: "view_leadership",
  CREATE_LEADER: "create_leader",
  EDIT_LEADER: "edit_leader",
  DELETE_LEADER: "delete_leader",

  ACTIVATE_LEADER: "activate_leader",
  DEACTIVATE_LEADER: "deactivate_leader",

  VIEW_STATISTICS: "view_leadership_statistics",
  VIEW_HIERARCHY: "view_leadership_hierarchy",

  MANAGE_REGIONAL_CABINET:
    "manage_regional_cabinet",

  MANAGE_REGIONAL_YOUTH_ASSEMBLY:
    "manage_regional_youth_assembly",

  MANAGE_COUNCIL_OF_GOVERNORS:
    "manage_council_of_governors",

  MANAGE_COUNTY_CABINET:
    "manage_county_cabinet",

  MANAGE_COUNTY_YOUTH_ASSEMBLY:
    "manage_county_youth_assembly",

  MANAGE_PATRONAGE:
    "manage_patronage",
};

export const LEADERSHIP_PERMISSION_VALUES =
  Object.values(LEADERSHIP_PERMISSIONS);


/* ==========================================================
   COAST COUNTIES
========================================================== */

export const COAST_COUNTIES = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
];


/* ==========================================================
   HELPER: OFFICE CONFIGURATION VALUES
========================================================== */

export const getOfficeConfiguration = (
  position
) => {
  return OFFICE_CONFIGURATION[position] || null;
};


/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  LEADERSHIP_LEVELS,
  LEADERSHIP_LEVEL_VALUES,

  LEADERSHIP_CATEGORIES,
  LEADERSHIP_CATEGORY_VALUES,

  LEADERSHIP_DEPARTMENTS,
  LEADERSHIP_DEPARTMENT_VALUES,

  LEADERSHIP_SCOPE,
  LEADERSHIP_SCOPE_VALUES,

  REPORT_VISIBILITY,
  REPORT_VISIBILITY_VALUES,

  LEADERSHIP_OFFICES,
  LEADERSHIP_OFFICE_VALUES,

  APPOINTMENT_TYPES,
  APPOINTMENT_TYPE_VALUES,

  LEADERSHIP_STATUS,
  LEADERSHIP_STATUS_VALUES,

  LEGACY_LEADERSHIP_OFFICE_ALIASES,

  REGIONAL_CABINET_PORTFOLIOS,

  OFFICE_CONFIGURATION,

  LEADERSHIP_PERMISSIONS,
  LEADERSHIP_PERMISSION_VALUES,

  COAST_COUNTIES,

  getOfficeConfiguration,
};