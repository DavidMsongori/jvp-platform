import {
  LEADERSHIP_OFFICES,
  LEADERSHIP_SCOPE,
} from "../constants/leadership.constants.js";

/* ==========================================================================
   LEADERSHIP SCOPE RESOLVER

   Determines the geographical and organizational scope
   of a leader based on their office and assigned location.
=========================================================================== */

/**
 * Resolve leadership scope.
 *
 * @param {Object} leader
 * @returns {Object}
 */
export function resolveLeadershipScope(leader) {
  if (!leader) {
    return {
      scope: null,
      level: null,
      filters: {},
    };
  }

  const position = leader.position?.trim().toLowerCase();

  /* ==========================================================
     REGIONAL EXECUTIVE
  ========================================================== */

  const regionalExecutive = [
    LEADERSHIP_OFFICES.PRESIDENT,
    LEADERSHIP_OFFICES.DEPUTY_PRESIDENT,
    LEADERSHIP_OFFICES.SECRETARY_GENERAL,
    LEADERSHIP_OFFICES.TREASURER,
    LEADERSHIP_OFFICES.COMMUNICATIONS_SECRETARY,
    LEADERSHIP_OFFICES.PRINCIPAL_ASSISTANT,
    LEADERSHIP_OFFICES.DIRECTOR_WELFARE_MEMBERSHIP_SUPPORT,
    LEADERSHIP_OFFICES.DIRECTOR_YOUTH_EMPOWERMENT,
    LEADERSHIP_OFFICES.PROTOCOL_SECRETARY,
    LEADERSHIP_OFFICES.DIRECTOR_LEGAL_INCLUSION_AFFAIRS,
    LEADERSHIP_OFFICES.CHIEF_OF_STAFF,
    LEADERSHIP_OFFICES.DIRECTOR_PROGRAMS,
    LEADERSHIP_OFFICES.PRESIDENTIAL_ADVISOR,
    LEADERSHIP_OFFICES.DIRECTOR_RESOURCE_MOBILIZATION_PARTNERSHIPS,
  ];

  if (regionalExecutive.includes(position)) {
    return {
      scope: LEADERSHIP_SCOPE.REGIONAL,
      level: "regional",
      filters: {},
    };
  }

  /* ==========================================================
     GOVERNORS
  ========================================================== */

  if (
    position === LEADERSHIP_OFFICES.GOVERNOR ||
    position === LEADERSHIP_OFFICES.DEPUTY_GOVERNOR
  ) {
    return {
      scope: LEADERSHIP_SCOPE.COUNTY,
      level: "county",
      filters: {
        county: leader.county,
      },
    };
  }

  /* ==========================================================
     SPEAKER'S OFFICE
  ========================================================== */

  if (
    position === LEADERSHIP_OFFICES.SPEAKER ||
    position === LEADERSHIP_OFFICES.DEPUTY_SPEAKER ||
    position === LEADERSHIP_OFFICES.CLERK ||
    position === LEADERSHIP_OFFICES.DEPUTY_CLERK
  ) {
    return {
      scope: LEADERSHIP_SCOPE.REGIONAL,
      level: "assembly",
      filters: {},
    };
  }

  /* ==========================================================
     YOUTH MPs
  ========================================================== */

  if (
    position === LEADERSHIP_OFFICES.ELECTED_MP ||
    position === LEADERSHIP_OFFICES.NOMINATED_MP
  ) {
    return {
      scope: LEADERSHIP_SCOPE.CONSTITUENCY,
      level: "constituency",
      filters: {
        county: leader.county,
        constituency: leader.constituency,
      },
    };
  }

  /* ==========================================================
     YOUTH MCA
  ========================================================== */

  if (position === LEADERSHIP_OFFICES.YOUTH_MCA) {
    return {
      scope: LEADERSHIP_SCOPE.WARD,
      level: "ward",
      filters: {
        county: leader.county,
        constituency: leader.constituency,
        ward: leader.ward,
      },
    };
  }

  /* ==========================================================
     PATRON
  ========================================================== */

  if (position === LEADERSHIP_OFFICES.PATRON) {
    return {
      scope: LEADERSHIP_SCOPE.REGIONAL,
      level: "patron",
      filters: {},
    };
  }

  /* ==========================================================
     DEFAULT
  ========================================================== */

  return {
    scope: null,
    level: null,
    filters: {},
  };
}

export default resolveLeadershipScope;