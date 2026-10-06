/* ========================================================================
   JUMUIYA YA VIJANA WA PWANI (JVP)
   LEADERSHIP MODULE CONSTANTS
======================================================================== */

/* ========================================================================
   LEADERSHIP LEVELS
======================================================================== */

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


/* ========================================================================
   LEADERSHIP CATEGORIES
======================================================================== */

export const LEADERSHIP_CATEGORIES = {
  EXECUTIVE: "executive",
  LEGISLATIVE: "legislative",
  SECRETARIAT: "secretariat",
  PATRONAGE: "patronage",
};

export const LEADERSHIP_CATEGORY_VALUES = Object.values(
  LEADERSHIP_CATEGORIES
);


/* ========================================================================
   LEADERSHIP DEPARTMENTS
========================================================================
   JVP has three operational departments.

   1. Executive
   2. Legislative
   3. Secretariat

   Patronage is a separate category and is NOT a department.
======================================================================== */

export const LEADERSHIP_DEPARTMENTS = {
  EXECUTIVE: "executive",
  LEGISLATIVE: "legislative",
  SECRETARIAT: "secretariat",
};

export const LEADERSHIP_DEPARTMENT_VALUES = Object.values(
  LEADERSHIP_DEPARTMENTS
);


/* ========================================================================
   LEADERSHIP STRUCTURAL SCOPE
======================================================================== */

export const LEADERSHIP_SCOPE = {
  REGIONAL_CABINET: "regional_cabinet",
  REGIONAL_YOUTH_ASSEMBLY: "regional_youth_assembly",
  COUNTY_CABINET: "county_cabinet",
  COUNTY_YOUTH_ASSEMBLY: "county_youth_assembly",
};

export const LEADERSHIP_SCOPE_VALUES = Object.values(
  LEADERSHIP_SCOPE
);


/* ========================================================================
   REPORT VISIBILITY
========================================================================
   Geographic reporting / analytics access.

   Regional
   County
   Constituency
   Ward
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
   LEADERSHIP OFFICES
======================================================================== */

export const LEADERSHIP_OFFICES = {

  /* ==========================================================
     PATRONAGE
  ========================================================== */

  PATRON: "patron",


  /* ==========================================================
     REGIONAL CABINET
  ========================================================== */

  PRESIDENT: "president",

  DEPUTY_PRESIDENT: "deputy_president",

  PRIME_CABINET_SECRETARY: "prime_cabinet_secretary",

  ATTORNEY_GENERAL: "attorney_general",

  CABINET_SECRETARY: "cabinet_secretary",


  /* ==========================================================
     REGIONAL YOUTH ASSEMBLY
  ========================================================== */

  REGIONAL_SPEAKER: "regional_speaker",

  REGIONAL_DEPUTY_SPEAKER: "regional_deputy_speaker",

  REGIONAL_CLERK: "regional_clerk",

  REGIONAL_DEPUTY_CLERK: "regional_deputy_clerk",

  ELECTED_MP: "elected_mp",

  NOMINATED_MP: "nominated_mp",


  /* ==========================================================
     COUNCIL OF GOVERNORS
  ========================================================== */

  COUNCIL_GOVERNOR: "council_governor",


  /* ==========================================================
     COUNTY CABINET
  ========================================================== */

  COUNTY_GOVERNOR: "county_governor",

  DEPUTY_GOVERNOR: "deputy_governor",

  COUNTY_CABINET_SECRETARY: "county_cabinet_secretary",


  /* ==========================================================
     COUNTY YOUTH ASSEMBLY
  ========================================================== */

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


/* ========================================================================
   APPOINTMENT TYPES
======================================================================== */

export const APPOINTMENT_TYPES = {
  ELECTED: "elected",
  NOMINATED: "nominated",
  APPOINTED: "appointed",
};

export const APPOINTMENT_TYPE_VALUES = Object.values(
  APPOINTMENT_TYPES
);


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
   LEADERSHIP PERMISSIONS
======================================================================== */

export const LEADERSHIP_PERMISSIONS = {

  /* MEMBERS */

  VIEW_MEMBERS: "view_members",
  VIEW_LEADERS: "view_leaders",

  /* REPORTS */

  VIEW_REPORTS: "view_reports",
  SUBMIT_REPORTS: "submit_reports",
  VIEW_ANALYTICS: "view_analytics",

  /* DOCUMENTS */

  MANAGE_DOCUMENTS: "manage_documents",

  /* MEETINGS */

  MANAGE_MEETINGS: "manage_meetings",

  /* COMMUNICATION */

  MANAGE_ANNOUNCEMENTS: "manage_announcements",

  /* LEADERSHIP */

  MANAGE_LEADERS: "manage_leaders",
};

export const LEADERSHIP_PERMISSION_VALUES = Object.values(
  LEADERSHIP_PERMISSIONS
);


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
   REGIONAL CABINET PORTFOLIOS
======================================================================== */

export const REGIONAL_CABINET_PORTFOLIOS = {

  FINANCE_PLANNING:
    "finance_planning",

  YOUTH_EMPLOYMENT_ENTREPRENEURSHIP_LABOUR_EDUCATION_SKILLS_HUMAN_CAPITAL:
    "youth_employment_entrepreneurship_labour_education_skills_human_capital",

  AGRICULTURE_AGRIBUSINESS_FOOD_SECURITY:
    "agriculture_agribusiness_food_security",

  BLUE_ECONOMY_FISHERIES_MARITIME_AFFAIRS:
    "blue_economy_fisheries_maritime_affairs",

  TOURISM_CULTURE_ARTS_CREATIVE_ECONOMY:
    "tourism_culture_arts_creative_economy",

  TRADE_INVESTMENT_INDUSTRY:
    "trade_investment_industry",

  ICT_DIGITAL_ECONOMY_INNOVATION:
    "ict_digital_economy_innovation",

  ENVIRONMENT_CLIMATE_CHANGE:
    "environment_climate_change",

  HEALTH_SPORTS:
    "health_sports",

  GENDER_SOCIAL_PROTECTION:
    "gender_social_protection",

  INFRASTRUCTURE_TRANSPORT_HOUSING:
    "infrastructure_transport_housing",
};

export const REGIONAL_CABINET_PORTFOLIO_VALUES = Object.values(
  REGIONAL_CABINET_PORTFOLIOS
);


/* ========================================================================
   OFFICE CONFIGURATION
======================================================================== */

export const OFFICE_CONFIGURATION = {

  /* ==========================================================
     PATRON
  ========================================================== */

  [LEADERSHIP_OFFICES.PATRON]: {
    title: "Patron",

    level: null,

    category: LEADERSHIP_CATEGORIES.PATRONAGE,

    department: null,

    scope: null,

    reportVisibility: REPORT_VISIBILITY.REGIONAL,

    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },


  /* ==========================================================
     REGIONAL CABINET
  ========================================================== */

  [LEADERSHIP_OFFICES.PRESIDENT]: {
    title: "President",

    level: LEADERSHIP_LEVELS.REGIONAL_CABINET,

    category: LEADERSHIP_CATEGORIES.EXECUTIVE,

    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope: LEADERSHIP_SCOPE.REGIONAL_CABINET,

    reportVisibility: REPORT_VISIBILITY.REGIONAL,

    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  [LEADERSHIP_OFFICES.DEPUTY_PRESIDENT]: {
    title: "Deputy President",

    level: LEADERSHIP_LEVELS.REGIONAL_CABINET,

    category: LEADERSHIP_CATEGORIES.EXECUTIVE,

    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope: LEADERSHIP_SCOPE.REGIONAL_CABINET,

    reportVisibility: REPORT_VISIBILITY.REGIONAL,

    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  [LEADERSHIP_OFFICES.PRIME_CABINET_SECRETARY]: {
    title: "Prime Cabinet Secretary",

    level: LEADERSHIP_LEVELS.REGIONAL_CABINET,

    category: LEADERSHIP_CATEGORIES.EXECUTIVE,

    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope: LEADERSHIP_SCOPE.REGIONAL_CABINET,

    reportVisibility: REPORT_VISIBILITY.REGIONAL,

    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  [LEADERSHIP_OFFICES.ATTORNEY_GENERAL]: {
    title: "Attorney General",

    level: LEADERSHIP_LEVELS.REGIONAL_CABINET,

    category: LEADERSHIP_CATEGORIES.EXECUTIVE,

    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope: LEADERSHIP_SCOPE.REGIONAL_CABINET,

    reportVisibility: REPORT_VISIBILITY.REGIONAL,

    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  [LEADERSHIP_OFFICES.CABINET_SECRETARY]: {
    title: "Cabinet Secretary",

    level: LEADERSHIP_LEVELS.REGIONAL_CABINET,

    category: LEADERSHIP_CATEGORIES.EXECUTIVE,

    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope: LEADERSHIP_SCOPE.REGIONAL_CABINET,

    reportVisibility: REPORT_VISIBILITY.REGIONAL,

    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },


  /* ==========================================================
     REGIONAL YOUTH ASSEMBLY
  ========================================================== */

  [LEADERSHIP_OFFICES.REGIONAL_SPEAKER]: {
    title: "Regional Youth Assembly Speaker",

    level: LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.REGIONAL,

    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  [LEADERSHIP_OFFICES.REGIONAL_DEPUTY_SPEAKER]: {
    title: "Regional Youth Assembly Deputy Speaker",

    level: LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.REGIONAL,

    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  [LEADERSHIP_OFFICES.REGIONAL_CLERK]: {
    title: "Regional Youth Assembly Clerk",

    level: LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.REGIONAL,

    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  [LEADERSHIP_OFFICES.REGIONAL_DEPUTY_CLERK]: {
    title: "Regional Youth Assembly Deputy Clerk",

    level: LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.REGIONAL,

    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  [LEADERSHIP_OFFICES.ELECTED_MP]: {
    title: "Elected Youth Member of Parliament",

    level: LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.CONSTITUENCY,

    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  [LEADERSHIP_OFFICES.NOMINATED_MP]: {
    title: "Nominated Youth Member of Parliament",

    level: LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.CONSTITUENCY,

    appointmentType: APPOINTMENT_TYPES.NOMINATED,
  },


  /* ==========================================================
     COUNCIL OF GOVERNORS
  ========================================================== */

  [LEADERSHIP_OFFICES.COUNCIL_GOVERNOR]: {
    title: "Youth Governor",

    level: LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,

    category: LEADERSHIP_CATEGORIES.SECRETARIAT,

    department: LEADERSHIP_DEPARTMENTS.SECRETARIAT,

    /*
     * The Council of Governors is a regional institutional body.
     * Each Governor nevertheless has county-level reporting access.
     */
    scope: null,

    reportVisibility: REPORT_VISIBILITY.COUNTY,

    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },


  /* ==========================================================
     COUNTY CABINET
  ========================================================== */

  [LEADERSHIP_OFFICES.COUNTY_GOVERNOR]: {
    title: "Youth Governor",

    level: LEADERSHIP_LEVELS.COUNTY_CABINET,

    category: LEADERSHIP_CATEGORIES.EXECUTIVE,

    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope: LEADERSHIP_SCOPE.COUNTY_CABINET,

    reportVisibility: REPORT_VISIBILITY.COUNTY,

    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  [LEADERSHIP_OFFICES.DEPUTY_GOVERNOR]: {
    title: "Deputy Governor",

    level: LEADERSHIP_LEVELS.COUNTY_CABINET,

    category: LEADERSHIP_CATEGORIES.EXECUTIVE,

    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope: LEADERSHIP_SCOPE.COUNTY_CABINET,

    reportVisibility: REPORT_VISIBILITY.COUNTY,

    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  [LEADERSHIP_OFFICES.COUNTY_CABINET_SECRETARY]: {
    title: "County Cabinet Secretary",

    level: LEADERSHIP_LEVELS.COUNTY_CABINET,

    category: LEADERSHIP_CATEGORIES.EXECUTIVE,

    department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,

    scope: LEADERSHIP_SCOPE.COUNTY_CABINET,

    reportVisibility: REPORT_VISIBILITY.COUNTY,

    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },


  /* ==========================================================
     COUNTY YOUTH ASSEMBLY
  ========================================================== */

  [LEADERSHIP_OFFICES.COUNTY_SPEAKER]: {
    title: "County Youth Assembly Speaker",

    level: LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.COUNTY,

    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  [LEADERSHIP_OFFICES.COUNTY_DEPUTY_SPEAKER]: {
    title: "County Youth Assembly Deputy Speaker",

    level: LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.COUNTY,

    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  [LEADERSHIP_OFFICES.COUNTY_CLERK]: {
    title: "County Youth Assembly Clerk",

    level: LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.COUNTY,

    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  [LEADERSHIP_OFFICES.COUNTY_DEPUTY_CLERK]: {
    title: "County Youth Assembly Deputy Clerk",

    level: LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.COUNTY,

    appointmentType: APPOINTMENT_TYPES.APPOINTED,
  },

  [LEADERSHIP_OFFICES.ELECTED_MCA]: {
    title: "Elected Youth MCA",

    level: LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.WARD,

    appointmentType: APPOINTMENT_TYPES.ELECTED,
  },

  [LEADERSHIP_OFFICES.NOMINATED_MCA]: {
    title: "Nominated Youth MCA",

    level: LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,

    category: LEADERSHIP_CATEGORIES.LEGISLATIVE,

    department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,

    scope: LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,

    reportVisibility: REPORT_VISIBILITY.COUNTY,

    appointmentType: APPOINTMENT_TYPES.NOMINATED,
  },
};


/* ========================================================================
   DEFAULT REPORT VISIBILITY BY LEVEL
======================================================================== */

export const DEFAULT_REPORT_VISIBILITY_BY_LEVEL = {
  [LEADERSHIP_LEVELS.REGIONAL_CABINET]:
    REPORT_VISIBILITY.REGIONAL,

  [LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY]:
    REPORT_VISIBILITY.REGIONAL,

  [LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS]:
    REPORT_VISIBILITY.COUNTY,

  [LEADERSHIP_LEVELS.COUNTY_CABINET]:
    REPORT_VISIBILITY.COUNTY,

  [LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY]:
    REPORT_VISIBILITY.COUNTY,
};


/* ========================================================================
   LEGACY OFFICE ALIASES
========================================================================
   Temporary compatibility mappings for code that may still reference
   older office names.
======================================================================== */

export const LEGACY_LEADERSHIP_OFFICE_ALIASES = {
  governor: LEADERSHIP_OFFICES.COUNTY_GOVERNOR,

  speaker: LEADERSHIP_OFFICES.REGIONAL_SPEAKER,

  deputy_speaker: LEADERSHIP_OFFICES.REGIONAL_DEPUTY_SPEAKER,

  clerk: LEADERSHIP_OFFICES.REGIONAL_CLERK,

  deputy_clerk: LEADERSHIP_OFFICES.REGIONAL_DEPUTY_CLERK,

  youth_mca: LEADERSHIP_OFFICES.ELECTED_MCA,

  patron: LEADERSHIP_OFFICES.PATRON,
};