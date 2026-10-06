/* ==========================================================================
   JUMUIYA YA VIJANA WA PWANI (JVP)
   LEADERSHIP UTILITIES

   Responsibilities:
   - Normalize leadership office names
   - Validate offices
   - Retrieve office configuration
   - Classify leadership records
   - Provide display metadata
   - Support legacy office aliases
========================================================================== */

import {
  OFFICE_CONFIGURATION,
  LEADERSHIP_OFFICE_VALUES,
  LEADERSHIP_OFFICES,
  LEADERSHIP_LEVELS,
  LEADERSHIP_CATEGORIES,
  LEADERSHIP_DEPARTMENTS,
  LEADERSHIP_SCOPE,
  REPORT_VISIBILITY,
  APPOINTMENT_TYPES,
  LEGACY_LEADERSHIP_OFFICE_ALIASES,
} from "../constants/leadership.constants.js";


/* ==========================================================================
   NORMALIZATION
========================================================================== */

/**
 * Normalize a leadership office/position.
 *
 * Examples:
 *
 * "President"
 * -> "president"
 *
 * "Deputy President"
 * -> "deputy_president"
 *
 * "Cabinet Secretary"
 * -> "cabinet_secretary"
 *
 * "Deputy Speaker"
 * -> "regional_deputy_speaker"
 */
export const normalizePosition = (position = "") => {
  const normalized = String(position)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!normalized) {
    return "";
  }

  return (
    LEGACY_LEADERSHIP_OFFICE_ALIASES[normalized] ||
    normalized
  );
};


/* ==========================================================================
   VALIDATION
========================================================================== */

/**
 * Check whether a leadership office exists.
 */
export const isValidOffice = (position) => {
  const normalized = normalizePosition(position);

  return LEADERSHIP_OFFICE_VALUES.includes(normalized);
};


/**
 * Validate and return normalized office.
 *
 * Returns:
 * - normalized office value when valid
 * - null when invalid
 */
export const validateOffice = (position) => {
  const normalized = normalizePosition(position);

  return isValidOffice(normalized)
    ? normalized
    : null;
};


/* ==========================================================================
   CONFIGURATION
========================================================================== */

/**
 * Get complete configuration for an office.
 */
export const getOfficeConfiguration = (position) => {
  const normalized = normalizePosition(position);

  return (
    OFFICE_CONFIGURATION[normalized] ||
    null
  );
};


/**
 * Get office title.
 */
export const getOfficeTitle = (position) => {
  return (
    getOfficeConfiguration(position)?.title ||
    position ||
    ""
  );
};


/**
 * Get leadership level.
 */
export const getOfficeLevel = (position) => {
  return (
    getOfficeConfiguration(position)?.level ||
    null
  );
};


/**
 * Get leadership category.
 */
export const getOfficeCategory = (position) => {
  return (
    getOfficeConfiguration(position)?.category ||
    null
  );
};


/**
 * Get leadership department.
 */
export const getOfficeDepartment = (position) => {
  return (
    getOfficeConfiguration(position)?.department ||
    null
  );
};


/**
 * Get structural leadership scope.
 */
export const getOfficeScope = (position) => {
  return (
    getOfficeConfiguration(position)?.scope ||
    null
  );
};


/**
 * Get geographic reporting visibility.
 */
export const getOfficeReportVisibility = (position) => {
  return (
    getOfficeConfiguration(position)?.reportVisibility ||
    null
  );
};


/**
 * Get appointment type.
 */
export const getAppointmentType = (position) => {
  return (
    getOfficeConfiguration(position)?.appointmentType ||
    null
  );
};


/* ==========================================================================
   CLASSIFICATION — CATEGORY
========================================================================== */

/**
 * Check whether an office belongs to the Executive category.
 */
export const isExecutive = (position) => {
  return (
    getOfficeCategory(position) ===
    LEADERSHIP_CATEGORIES.EXECUTIVE
  );
};


/**
 * Check whether an office belongs to the Legislative category.
 */
export const isLegislative = (position) => {
  return (
    getOfficeCategory(position) ===
    LEADERSHIP_CATEGORIES.LEGISLATIVE
  );
};


/**
 * Check whether an office belongs to the Secretariat category.
 */
export const isSecretariat = (position) => {
  return (
    getOfficeCategory(position) ===
    LEADERSHIP_CATEGORIES.SECRETARIAT
  );
};


/**
 * Check whether an office belongs to Patronage.
 */
export const isPatronage = (position) => {
  return (
    getOfficeCategory(position) ===
    LEADERSHIP_CATEGORIES.PATRONAGE
  );
};


/* ==========================================================================
   CLASSIFICATION — LEVEL
========================================================================== */

/**
 * Regional Cabinet.
 */
export const isRegionalCabinet = (position) => {
  return (
    getOfficeLevel(position) ===
    LEADERSHIP_LEVELS.REGIONAL_CABINET
  );
};


/**
 * Regional Youth Assembly.
 */
export const isRegionalYouthAssembly = (position) => {
  return (
    getOfficeLevel(position) ===
    LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY
  );
};


/**
 * Council of Governors.
 */
export const isCouncilOfGovernors = (position) => {
  return (
    getOfficeLevel(position) ===
    LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS
  );
};


/**
 * County Cabinet.
 */
export const isCountyCabinet = (position) => {
  return (
    getOfficeLevel(position) ===
    LEADERSHIP_LEVELS.COUNTY_CABINET
  );
};


/**
 * County Youth Assembly.
 */
export const isCountyYouthAssembly = (position) => {
  return (
    getOfficeLevel(position) ===
    LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY
  );
};


/* ==========================================================================
   BACKWARD-COMPATIBLE CLASSIFICATION
========================================================================== */

/**
 * Legacy helper.
 *
 * Previously this checked for:
 * regional_executive
 *
 * The new architecture uses:
 * regional_cabinet
 */
export const isRegionalExecutive = (position) => {
  return isRegionalCabinet(position);
};


/* ==========================================================================
   CLASSIFICATION — SPECIFIC OFFICES
========================================================================== */

/**
 * Regional President.
 */
export const isPresident = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.PRESIDENT
  );
};


/**
 * Regional Deputy President.
 */
export const isDeputyPresident = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.DEPUTY_PRESIDENT
  );
};


/**
 * Prime Cabinet Secretary.
 */
export const isPrimeCabinetSecretary = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.PRIME_CABINET_SECRETARY
  );
};


/**
 * Attorney General.
 */
export const isAttorneyGeneral = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.ATTORNEY_GENERAL
  );
};


/**
 * Cabinet Secretary.
 */
export const isCabinetSecretary = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.CABINET_SECRETARY
  );
};


/* ==========================================================================
   GOVERNORS
========================================================================== */

/**
 * Council of Governors Youth Governor.
 */
export const isCouncilGovernor = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.COUNCIL_GOVERNOR
  );
};


/**
 * County Youth Governor.
 */
export const isCountyGovernor = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.COUNTY_GOVERNOR
  );
};


/**
 * County Deputy Governor.
 */
export const isDeputyGovernor = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.DEPUTY_GOVERNOR
  );
};


/**
 * Generic governor check.
 *
 * This deliberately does NOT include Deputy Governor.
 *
 * It recognizes:
 * - Council Governor
 * - County Governor
 */
export const isGovernor = (position) => {
  const normalized = normalizePosition(position);

  return [
    LEADERSHIP_OFFICES.COUNCIL_GOVERNOR,
    LEADERSHIP_OFFICES.COUNTY_GOVERNOR,
  ].includes(normalized);
};


/* ==========================================================================
   REGIONAL YOUTH ASSEMBLY
========================================================================== */

/**
 * Regional Youth Assembly Speaker.
 */
export const isRegionalSpeaker = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.REGIONAL_SPEAKER
  );
};


/**
 * Regional Youth Assembly Deputy Speaker.
 */
export const isRegionalDeputySpeaker = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.REGIONAL_DEPUTY_SPEAKER
  );
};


/**
 * Regional Assembly Clerk.
 */
export const isRegionalClerk = (position) => {
  return [
    LEADERSHIP_OFFICES.REGIONAL_CLERK,
    LEADERSHIP_OFFICES.REGIONAL_DEPUTY_CLERK,
  ].includes(
    normalizePosition(position)
  );
};


/**
 * Elected Youth MP.
 */
export const isElectedMP = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.ELECTED_MP
  );
};


/**
 * Nominated Youth MP.
 */
export const isNominatedMP = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.NOMINATED_MP
  );
};


/**
 * Any Youth MP.
 */
export const isYouthMP = (position) => {
  const normalized = normalizePosition(position);

  return [
    LEADERSHIP_OFFICES.ELECTED_MP,
    LEADERSHIP_OFFICES.NOMINATED_MP,
  ].includes(normalized);
};


/* ==========================================================================
   COUNTY YOUTH ASSEMBLY
========================================================================== */

/**
 * County Youth Assembly Speaker.
 */
export const isCountySpeaker = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.COUNTY_SPEAKER
  );
};


/**
 * County Youth Assembly Deputy Speaker.
 */
export const isCountyDeputySpeaker = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.COUNTY_DEPUTY_SPEAKER
  );
};


/**
 * County Assembly Clerk.
 */
export const isCountyClerk = (position) => {
  return [
    LEADERSHIP_OFFICES.COUNTY_CLERK,
    LEADERSHIP_OFFICES.COUNTY_DEPUTY_CLERK,
  ].includes(
    normalizePosition(position)
  );
};


/**
 * Elected Youth MCA.
 */
export const isElectedMCA = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.ELECTED_MCA
  );
};


/**
 * Nominated Youth MCA.
 */
export const isNominatedMCA = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.NOMINATED_MCA
  );
};


/**
 * Any Youth MCA.
 */
export const isYouthMCA = (position) => {
  const normalized = normalizePosition(position);

  return [
    LEADERSHIP_OFFICES.ELECTED_MCA,
    LEADERSHIP_OFFICES.NOMINATED_MCA,
  ].includes(normalized);
};


/* ==========================================================================
   PATRON
========================================================================== */

/**
 * Check whether office is Patron.
 */
export const isPatron = (position) => {
  return (
    normalizePosition(position) ===
    LEADERSHIP_OFFICES.PATRON
  );
};


/* ==========================================================================
   APPOINTMENT CLASSIFICATION
========================================================================== */

/**
 * Elected office.
 */
export const isElected = (position) => {
  return (
    getAppointmentType(position) ===
    APPOINTMENT_TYPES.ELECTED
  );
};


/**
 * Nominated office.
 */
export const isNominated = (position) => {
  return (
    getAppointmentType(position) ===
    APPOINTMENT_TYPES.NOMINATED
  );
};


/**
 * Appointed office.
 */
export const isAppointed = (position) => {
  return (
    getAppointmentType(position) ===
    APPOINTMENT_TYPES.APPOINTED
  );
};


/* ==========================================================================
   DEPARTMENT CLASSIFICATION
========================================================================== */

/**
 * Executive department.
 */
export const isExecutiveDepartment = (position) => {
  return (
    getOfficeDepartment(position) ===
    LEADERSHIP_DEPARTMENTS.EXECUTIVE
  );
};


/**
 * Legislative department.
 */
export const isLegislativeDepartment = (position) => {
  return (
    getOfficeDepartment(position) ===
    LEADERSHIP_DEPARTMENTS.LEGISLATIVE
  );
};


/**
 * Secretariat department.
 */
export const isSecretariatDepartment = (position) => {
  return (
    getOfficeDepartment(position) ===
    LEADERSHIP_DEPARTMENTS.SECRETARIAT
  );
};


/* ==========================================================================
   STRUCTURAL SCOPE CLASSIFICATION
========================================================================== */

/**
 * Regional Cabinet scope.
 */
export const isRegionalCabinetScope = (position) => {
  return (
    getOfficeScope(position) ===
    LEADERSHIP_SCOPE.REGIONAL_CABINET
  );
};


/**
 * Regional Youth Assembly scope.
 */
export const isRegionalYouthAssemblyScope = (position) => {
  return (
    getOfficeScope(position) ===
    LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY
  );
};


/**
 * County Cabinet scope.
 */
export const isCountyCabinetScope = (position) => {
  return (
    getOfficeScope(position) ===
    LEADERSHIP_SCOPE.COUNTY_CABINET
  );
};


/**
 * County Youth Assembly scope.
 */
export const isCountyYouthAssemblyScope = (position) => {
  return (
    getOfficeScope(position) ===
    LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY
  );
};


/* ==========================================================================
   REPORTING VISIBILITY
========================================================================== */

/**
 * Regional reporting.
 */
export const hasRegionalVisibility = (position) => {
  return (
    getOfficeReportVisibility(position) ===
    REPORT_VISIBILITY.REGIONAL
  );
};


/**
 * County reporting.
 */
export const hasCountyVisibility = (position) => {
  return (
    getOfficeReportVisibility(position) ===
    REPORT_VISIBILITY.COUNTY
  );
};


/**
 * Constituency reporting.
 */
export const hasConstituencyVisibility = (position) => {
  return (
    getOfficeReportVisibility(position) ===
    REPORT_VISIBILITY.CONSTITUENCY
  );
};


/**
 * Ward reporting.
 */
export const hasWardVisibility = (position) => {
  return (
    getOfficeReportVisibility(position) ===
    REPORT_VISIBILITY.WARD
  );
};


/**
 * Private reporting.
 */
export const hasPrivateVisibility = (position) => {
  return (
    getOfficeReportVisibility(position) ===
    REPORT_VISIBILITY.PRIVATE
  );
};


/* ==========================================================================
   DISPLAY
========================================================================== */

/**
 * Display title for a leadership office.
 */
export const getDisplayTitle = (position) => {
  return getOfficeTitle(position);
};


/**
 * Return complete display metadata.
 */
export const getLeadershipMetadata = (position) => {
  const normalized = normalizePosition(position);

  const configuration =
    getOfficeConfiguration(normalized);

  if (!configuration) {
    return null;
  }

  return {
    position: normalized,
    title: configuration.title,
    category: configuration.category,
    level: configuration.level,
    department: configuration.department,
    scope: configuration.scope,
    reportVisibility: configuration.reportVisibility,
    appointmentType: configuration.appointmentType,
  };
};


/* ==========================================================================
   OFFICE LIST HELPERS
========================================================================== */

/**
 * Return all configured offices.
 */
export const getAllLeadershipOffices = () => {
  return LEADERSHIP_OFFICE_VALUES.map(
    (position) => ({
      position,
      ...OFFICE_CONFIGURATION[position],
    })
  );
};


/**
 * Return offices belonging to a level.
 */
export const getOfficesByLevel = (level) => {
  return LEADERSHIP_OFFICE_VALUES
    .filter(
      (position) =>
        OFFICE_CONFIGURATION[position]?.level === level
    )
    .map(
      (position) => ({
        position,
        ...OFFICE_CONFIGURATION[position],
      })
    );
};


/**
 * Return offices belonging to a category.
 */
export const getOfficesByCategory = (category) => {
  return LEADERSHIP_OFFICE_VALUES
    .filter(
      (position) =>
        OFFICE_CONFIGURATION[position]?.category === category
    )
    .map(
      (position) => ({
        position,
        ...OFFICE_CONFIGURATION[position],
      })
    );
};


/**
 * Return offices belonging to a structural scope.
 */
export const getOfficesByScope = (scope) => {
  return LEADERSHIP_OFFICE_VALUES
    .filter(
      (position) =>
        OFFICE_CONFIGURATION[position]?.scope === scope
    )
    .map(
      (position) => ({
        position,
        ...OFFICE_CONFIGURATION[position],
      })
    );
};


/**
 * Return offices with a specific report visibility.
 */
export const getOfficesByReportVisibility = (
  reportVisibility
) => {
  return LEADERSHIP_OFFICE_VALUES
    .filter(
      (position) =>
        OFFICE_CONFIGURATION[position]
          ?.reportVisibility === reportVisibility
    )
    .map(
      (position) => ({
        position,
        ...OFFICE_CONFIGURATION[position],
      })
    );
};