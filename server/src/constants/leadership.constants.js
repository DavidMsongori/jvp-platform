
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

  Regional Cabinet Secretaries have:
  - A common office: cabinet_secretary
  - A specific ministry docket: portfolioKey
  - A dedicated public route based on the docket slug
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
  /* Patronage */
  PATRON: "patron",

  /* Regional Cabinet */
  PRESIDENT: "president",
  DEPUTY_PRESIDENT: "deputy_president",
  PRIME_CABINET_SECRETARY: "prime_cabinet_secretary",
  SECRETARY_TO_CABINET: "secretary_to_cabinet",
  ATTORNEY_GENERAL: "attorney_general",
  CABINET_SECRETARY: "cabinet_secretary",

  /* Regional Youth Assembly */
  REGIONAL_SPEAKER: "regional_speaker",
  REGIONAL_DEPUTY_SPEAKER: "regional_deputy_speaker",
  REGIONAL_CLERK: "regional_clerk",
  REGIONAL_DEPUTY_CLERK: "regional_deputy_clerk",
  ELECTED_MP: "elected_mp",
  NOMINATED_MP: "nominated_mp",

  /* Council of Governors */
  COUNCIL_GOVERNOR: "council_governor",

  /* County Cabinet */
  COUNTY_GOVERNOR: "county_governor",
  DEPUTY_GOVERNOR: "deputy_governor",
  COUNTY_CABINET_SECRETARY: "county_cabinet_secretary",

  /* County Youth Assembly */
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

export const LEGACY_LEADERSHIP_OFFICE_ALIASES = {
  governor: LEADERSHIP_OFFICES.COUNTY_GOVERNOR,
  speaker: LEADERSHIP_OFFICES.REGIONAL_SPEAKER,
  deputy_speaker: LEADERSHIP_OFFICES.REGIONAL_DEPUTY_SPEAKER,
  clerk: LEADERSHIP_OFFICES.REGIONAL_CLERK,
  deputy_clerk: LEADERSHIP_OFFICES.REGIONAL_DEPUTY_CLERK,
  youth_mca: LEADERSHIP_OFFICES.ELECTED_MCA,
  patron: LEADERSHIP_OFFICES.PATRON,
};

/* ==========================================================
   REGIONAL CABINET PORTFOLIOS
========================================================== */

/*
  Each portfolio has:
  - key: stable identifier stored with the leader record
  - title: full public-facing docket name
  - shortTitle: compact title for cards and tables
  - slug: stable URL identifier
  - route: dedicated public docket page route
  - description: introductory text for the public page

  Store portfolioKey on each regional Cabinet Secretary record.
  Do not use the display title as the permanent identifier.
*/

const REGIONAL_CABINET_ROUTE_PREFIX =
  "/leadership/cabinet-secretaries";

export const REGIONAL_CABINET_PORTFOLIOS = [
  {
    key: "finance_planning",
    title: "Finance, Planning & Economic Affairs",
    shortTitle: "Finance & Economic Affairs",
    slug: "finance-planning",
    route: `${REGIONAL_CABINET_ROUTE_PREFIX}/finance-planning`,
    description:
      "Coordinates financial planning, budgeting, resource mobilisation and regional economic affairs.",
  },

  {
    key: "youth_employment",
    title:
      "Youth Employment, Entrepreneurship, Labour, Education, Skills & Human Capital",
    shortTitle: "Youth Employment & Human Capital",
    slug: "youth-employment",
    route: `${REGIONAL_CABINET_ROUTE_PREFIX}/youth-employment`,
    description:
      "Focuses on youth employment, entrepreneurship, labour opportunities, education, skills development and human capital.",
  },

  {
    key: "agriculture_food_security",
    title: "Agriculture, Agribusiness & Food Security",
    shortTitle: "Agriculture & Food Security",
    slug: "agriculture-food-security",
    route: `${REGIONAL_CABINET_ROUTE_PREFIX}/agriculture-food-security`,
    description:
      "Promotes agricultural development, agribusiness opportunities, food security and sustainable livelihoods.",
  },

  {
    key: "blue_economy",
    title: "Blue Economy, Fisheries & Maritime Affairs",
    shortTitle: "Blue Economy & Fisheries",
    slug: "blue-economy",
    route: `${REGIONAL_CABINET_ROUTE_PREFIX}/blue-economy`,
    description:
      "Advances sustainable use of coastal and marine resources, fisheries development and maritime opportunities.",
  },

  {
    key: "tourism_culture",
    title: "Tourism, Culture, Arts & Creative Economy",
    shortTitle: "Tourism & Creative Economy",
    slug: "tourism-culture",
    route: `${REGIONAL_CABINET_ROUTE_PREFIX}/tourism-culture`,
    description:
      "Supports tourism development, cultural heritage, the arts and creative-sector opportunities for young people.",
  },

  {
    key: "trade",
    title: "Trade, Investment & Cooperatives",
    shortTitle: "Trade & Investment",
    slug: "trade-investment",
    route: `${REGIONAL_CABINET_ROUTE_PREFIX}/trade-investment`,
    description:
      "Promotes trade, investment, enterprise development and cooperative initiatives across the Coast region.",
  },

  {
    key: "ict_digital",
    title: "ICT, Digital Economy & Communication",
    shortTitle: "Digital Economy & Communication",
    slug: "ict-digital-communication",
    route: `${REGIONAL_CABINET_ROUTE_PREFIX}/ict-digital-communication`,
    description:
      "Supports digital transformation, ICT skills, technology adoption and innovation among coastal youth.",
  },

  {
    key: "environment",
    title: "Environment, Climate Change & Natural Resources",
    shortTitle: "Environment & Climate",
    slug: "environment-climate",
    route: `${REGIONAL_CABINET_ROUTE_PREFIX}/environment-climate`,
    description:
      "Promotes environmental conservation, climate action and sustainable management of natural resources.",
  },

  {
    key: "health_sports",
    title: "Health, Sports & Youth Wellness",
    shortTitle: "Health & Sports",
    slug: "health-sports",
    route: `${REGIONAL_CABINET_ROUTE_PREFIX}/health-sports`,
    description:
      "Supports youth wellness, health awareness, sports development and initiatives that nurture young people's talents.",
  },

  {
    key: "gender_social",
    title: "Gender, Social Protection & Community Development",
    shortTitle: "Gender & Social Development",
    slug: "gender-social-protection",
    route: `${REGIONAL_CABINET_ROUTE_PREFIX}/gender-social-protection`,
    description:
      "Promotes inclusion, gender equity, social protection and community development initiatives.",
  },

  {
    key: "infrastructure",
    title: "Infrastructure, Housing & Urban Development",
    shortTitle: "Infrastructure & Urban Development",
    slug: "infrastructure-housing",
    route: `${REGIONAL_CABINET_ROUTE_PREFIX}/infrastructure-housing`,
    description:
      "Focuses on infrastructure priorities, housing, urban development and regional connectivity.",
  },
];

/* ==========================================================
   REGIONAL CABINET PORTFOLIO HELPERS
========================================================== */

/**
 * Resolve a regional Cabinet Secretary's portfolio.
 *
 * Accepts a portfolio key, slug, full title, or a leader object.
 * Supports common legacy field names when reading leader objects.
 */
export const getRegionalCabinetPortfolio = (value) => {
  if (!value) return null;

  const identifier =
    typeof value === "object"
      ? (
          value.portfolioKey ??
          value.portfolio ??
          value.docketKey ??
          value.docket ??
          value.ministry
        )
      : value;

  if (!identifier) return null;

  if (typeof identifier === "object") {
    return getRegionalCabinetPortfolio(identifier.key ?? identifier.slug ?? identifier.title);
  }

  const normalized = String(identifier)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  return (
    REGIONAL_CABINET_PORTFOLIOS.find((portfolio) => {
      const candidates = [
        portfolio.key,
        portfolio.slug,
        portfolio.title,
        portfolio.shortTitle,
      ];

      return candidates.some(
        (candidate) =>
          String(candidate)
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim() === normalized
      );
    }) || null
  );
};

/**
 * Return the public route for a portfolio.
 */
export const getRegionalCabinetPortfolioRoute = (value) => {
  return getRegionalCabinetPortfolio(value)?.route || null;
};

/**
 * Return a display title for a leader record.
 *
 * Example:
 * Cabinet Secretary — Agriculture, Agribusiness & Food Security
 *
 * Existing leaders without a saved portfolio continue to display
 * as "Cabinet Secretary" until their docket is assigned.
 */
export const getLeadershipOfficeDisplayTitle = (leader) => {
  if (!leader) return "";

  const office = String(
    leader.position ||
    leader.office ||
    leader.officeTitle ||
    ""
  )
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    office === "cabinet secretary" ||
    office === "regional cabinet secretary"
  ) {
    const portfolio = getRegionalCabinetPortfolio(leader);

    return portfolio
      ? `Cabinet Secretary — ${portfolio.title}`
      : "Cabinet Secretary";
  }

  if (office === "secretary to cabinet") {
    return "Secretary to the Cabinet";
  }

  return leader.position || leader.officeTitle || leader.office || "";
};

/* ==========================================================
   OFFICE CONFIGURATION FACTORY
========================================================== */

const regionalCabinetOffice = (options = {}) => ({
  level: LEADERSHIP_LEVELS.REGIONAL_CABINET,
  category: LEADERSHIP_CATEGORIES.EXECUTIVE,
  department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,
  scope: LEADERSHIP_SCOPE.REGIONAL_CABINET,
  reportVisibility: REPORT_VISIBILITY.REGIONAL,
  appointmentType: APPOINTMENT_TYPES.APPOINTED,
  requiresMember: true,
  requiresCounty: false,
  requiresConstituency: false,
  requiresWard: false,
  allowMultiple: false,
  ...options,
});

const regionalAssemblyOffice = (options = {}) => ({
  level: LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,
  category: LEADERSHIP_CATEGORIES.LEGISLATIVE,
  department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
  scope: LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,
  reportVisibility: REPORT_VISIBILITY.REGIONAL,
  appointmentType: APPOINTMENT_TYPES.APPOINTED,
  requiresMember: true,
  requiresCounty: false,
  requiresConstituency: false,
  requiresWard: false,
  allowMultiple: false,
  ...options,
});

const countyCabinetOffice = (options = {}) => ({
  level: LEADERSHIP_LEVELS.COUNTY_CABINET,
  category: LEADERSHIP_CATEGORIES.EXECUTIVE,
  department: LEADERSHIP_DEPARTMENTS.EXECUTIVE,
  scope: LEADERSHIP_SCOPE.COUNTY_CABINET,
  reportVisibility: REPORT_VISIBILITY.COUNTY,
  appointmentType: APPOINTMENT_TYPES.APPOINTED,
  requiresMember: true,
  requiresCounty: true,
  requiresConstituency: false,
  requiresWard: false,
  allowMultiple: false,
  ...options,
});

const countyAssemblyOffice = (options = {}) => ({
  level: LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,
  category: LEADERSHIP_CATEGORIES.LEGISLATIVE,
  department: LEADERSHIP_DEPARTMENTS.LEGISLATIVE,
  scope: LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,
  reportVisibility: REPORT_VISIBILITY.COUNTY,
  appointmentType: APPOINTMENT_TYPES.APPOINTED,
  requiresMember: true,
  requiresCounty: true,
  requiresConstituency: false,
  requiresWard: false,
  allowMultiple: false,
  ...options,
});

/* ==========================================================
   OFFICE CONFIGURATION
========================================================== */

export const OFFICE_CONFIGURATION = {
  /* --------------------------------------------------------
     PATRONAGE
  -------------------------------------------------------- */

  [LEADERSHIP_OFFICES.PATRON]: {
    title: "Patron",
    level: null,
    category: LEADERSHIP_CATEGORIES.PATRONAGE,
    department: null,
    scope: null,
    reportVisibility: REPORT_VISIBILITY.REGIONAL,
    appointmentType: APPOINTMENT_TYPES.APPOINTED,
    requiresMember: false,
    requiresCounty: false,
    requiresConstituency: false,
    requiresWard: false,
    allowMultiple: false,
  },

  /* --------------------------------------------------------
     REGIONAL CABINET
  -------------------------------------------------------- */

  [LEADERSHIP_OFFICES.PRESIDENT]: {
    ...regionalCabinetOffice({
      appointmentType: APPOINTMENT_TYPES.ELECTED,
    }),
    title: "President",
  },

  [LEADERSHIP_OFFICES.DEPUTY_PRESIDENT]: {
    ...regionalCabinetOffice({
      appointmentType: APPOINTMENT_TYPES.ELECTED,
    }),
    title: "Deputy President",
  },

  [LEADERSHIP_OFFICES.PRIME_CABINET_SECRETARY]: {
    ...regionalCabinetOffice(),
    title: "Prime Cabinet Secretary",
  },

  /*
    The Secretary to the Cabinet coordinates cabinet
    administration and official cabinet records.

    This is distinct from the Prime Cabinet Secretary and
    from the ministerial Cabinet Secretary positions.
  */
  [LEADERSHIP_OFFICES.SECRETARY_TO_CABINET]: {
    ...regionalCabinetOffice({
      category: LEADERSHIP_CATEGORIES.SECRETARIAT,
      department: LEADERSHIP_DEPARTMENTS.SECRETARIAT,
    }),
    title: "Secretary to the Cabinet",
  },

  [LEADERSHIP_OFFICES.ATTORNEY_GENERAL]: {
    ...regionalCabinetOffice(),
    title: "Attorney General",
  },

  [LEADERSHIP_OFFICES.CABINET_SECRETARY]: {
    ...regionalCabinetOffice({
      allowMultiple: true,
    }),
    title: "Cabinet Secretary",
    portfolios: REGIONAL_CABINET_PORTFOLIOS,
    requiresPortfolio: true,
    portfolioField: "portfolioKey",
  },

  /* --------------------------------------------------------
     REGIONAL YOUTH ASSEMBLY
  -------------------------------------------------------- */

  [LEADERSHIP_OFFICES.REGIONAL_SPEAKER]: {
    ...regionalAssemblyOffice({
      appointmentType: APPOINTMENT_TYPES.ELECTED,
    }),
    title: "Regional Youth Assembly Speaker",
  },

  [LEADERSHIP_OFFICES.REGIONAL_DEPUTY_SPEAKER]: {
    ...regionalAssemblyOffice({
      appointmentType: APPOINTMENT_TYPES.ELECTED,
    }),
    title: "Regional Youth Assembly Deputy Speaker",
  },

  [LEADERSHIP_OFFICES.REGIONAL_CLERK]: {
    ...regionalAssemblyOffice(),
    title: "Regional Youth Assembly Clerk",
  },

  [LEADERSHIP_OFFICES.REGIONAL_DEPUTY_CLERK]: {
    ...regionalAssemblyOffice(),
    title: "Regional Youth Assembly Deputy Clerk",
  },

  [LEADERSHIP_OFFICES.ELECTED_MP]: {
    ...regionalAssemblyOffice({
      appointmentType: APPOINTMENT_TYPES.ELECTED,
      reportVisibility: REPORT_VISIBILITY.CONSTITUENCY,
      requiresCounty: true,
      requiresConstituency: true,
    }),
    title: "Elected Youth MP",
  },

  [LEADERSHIP_OFFICES.NOMINATED_MP]: {
    ...regionalAssemblyOffice({
      appointmentType: APPOINTMENT_TYPES.NOMINATED,
      reportVisibility: REPORT_VISIBILITY.CONSTITUENCY,
      requiresCounty: true,
      requiresConstituency: true,
      allowMultiple: true,
    }),
    title: "Nominated Youth MP",
  },

  /* --------------------------------------------------------
     COUNCIL OF GOVERNORS
  -------------------------------------------------------- */

  [LEADERSHIP_OFFICES.COUNCIL_GOVERNOR]: {
    title: "Youth Governor",
    level: LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
    category: LEADERSHIP_CATEGORIES.SECRETARIAT,
    department: LEADERSHIP_DEPARTMENTS.SECRETARIAT,
    scope: null,
    reportVisibility: REPORT_VISIBILITY.COUNTY,
    appointmentType: APPOINTMENT_TYPES.ELECTED,
    requiresMember: true,
    requiresCounty: true,
    requiresConstituency: false,
    requiresWard: false,
    allowMultiple: true,
  },

  /* --------------------------------------------------------
     COUNTY CABINET
  -------------------------------------------------------- */

  [LEADERSHIP_OFFICES.COUNTY_GOVERNOR]: {
    ...countyCabinetOffice({
      appointmentType: APPOINTMENT_TYPES.ELECTED,
    }),
    title: "Youth Governor",
  },

  [LEADERSHIP_OFFICES.DEPUTY_GOVERNOR]: {
    ...countyCabinetOffice({
      appointmentType: APPOINTMENT_TYPES.ELECTED,
    }),
    title: "Deputy Youth Governor",
  },

  [LEADERSHIP_OFFICES.COUNTY_CABINET_SECRETARY]: {
    ...countyCabinetOffice({
      allowMultiple: true,
    }),
    title: "County Cabinet Secretary",
  },

  /* --------------------------------------------------------
     COUNTY YOUTH ASSEMBLY
  -------------------------------------------------------- */

  [LEADERSHIP_OFFICES.COUNTY_SPEAKER]: {
    ...countyAssemblyOffice({
      appointmentType: APPOINTMENT_TYPES.ELECTED,
    }),
    title: "County Youth Assembly Speaker",
  },

  [LEADERSHIP_OFFICES.COUNTY_DEPUTY_SPEAKER]: {
    ...countyAssemblyOffice({
      appointmentType: APPOINTMENT_TYPES.ELECTED,
    }),
    title: "County Youth Assembly Deputy Speaker",
  },

  [LEADERSHIP_OFFICES.COUNTY_CLERK]: {
    ...countyAssemblyOffice(),
    title: "County Youth Assembly Clerk",
  },

  [LEADERSHIP_OFFICES.COUNTY_DEPUTY_CLERK]: {
    ...countyAssemblyOffice(),
    title: "County Youth Assembly Deputy Clerk",
  },

  [LEADERSHIP_OFFICES.ELECTED_MCA]: {
    ...countyAssemblyOffice({
      appointmentType: APPOINTMENT_TYPES.ELECTED,
      reportVisibility: REPORT_VISIBILITY.WARD,
      requiresConstituency: true,
      requiresWard: true,
    }),
    title: "Elected Youth MCA",
  },

  [LEADERSHIP_OFFICES.NOMINATED_MCA]: {
    ...countyAssemblyOffice({
      appointmentType: APPOINTMENT_TYPES.NOMINATED,
      allowMultiple: true,
    }),
    title: "Nominated Youth MCA",
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

  MANAGE_REGIONAL_CABINET: "manage_regional_cabinet",
  MANAGE_REGIONAL_YOUTH_ASSEMBLY: "manage_regional_youth_assembly",
  MANAGE_COUNCIL_OF_GOVERNORS: "manage_council_of_governors",
  MANAGE_COUNTY_CABINET: "manage_county_cabinet",
  MANAGE_COUNTY_YOUTH_ASSEMBLY: "manage_county_youth_assembly",
  MANAGE_PATRONAGE: "manage_patronage",
};

export const LEADERSHIP_PERMISSION_VALUES = Object.values(
  LEADERSHIP_PERMISSIONS
);

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
   HELPER: OFFICE CONFIGURATION
========================================================== */

export const getOfficeConfiguration = (position) => {
  if (!position) return null;

  const normalized = String(position)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const canonicalPosition =
    LEGACY_LEADERSHIP_OFFICE_ALIASES[normalized] ||
    normalized;

  return OFFICE_CONFIGURATION[canonicalPosition] || null;
};

/* ==========================================================
   HELPER: VALIDATE LEADERSHIP OFFICE
========================================================== */

export const normalizePosition = (position) => {
  if (!position) return "";

  return String(position)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
};

export const isValidOffice = (position) => {
  const normalized = normalizePosition(position);

  if (!normalized) return false;

  const canonicalPosition =
    LEGACY_LEADERSHIP_OFFICE_ALIASES[normalized] ||
    normalized;

  return Object.prototype.hasOwnProperty.call(
    OFFICE_CONFIGURATION,
    canonicalPosition
  );
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
  getRegionalCabinetPortfolio,
  getRegionalCabinetPortfolioRoute,
  getLeadershipOfficeDisplayTitle,

  OFFICE_CONFIGURATION,

  LEADERSHIP_PERMISSIONS,
  LEADERSHIP_PERMISSION_VALUES,

  COAST_COUNTIES,

  getOfficeConfiguration,
  normalizePosition,
  isValidOffice,
};