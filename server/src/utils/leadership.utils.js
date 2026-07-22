import {
  OFFICE_CONFIGURATION,
  LEADERSHIP_OFFICE_VALUES,
} from "../constants/leadership.constants.js";

/* ==========================================================================
   NORMALIZATION
=========================================================================== */

export const normalizePosition = (
  position = ""
) =>
  position
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

/* ==========================================================================
   VALIDATION
=========================================================================== */

export const isValidOffice = (
  position
) =>
  LEADERSHIP_OFFICE_VALUES.includes(
    normalizePosition(position)
  );

/* ==========================================================================
   CONFIGURATION
=========================================================================== */

export const getOfficeConfiguration = (
  position
) =>
  OFFICE_CONFIGURATION[
    normalizePosition(position)
  ] || null;

export const getOfficeTitle = (
  position
) =>
  getOfficeConfiguration(position)
    ?.title || position;

export const getOfficeLevel = (
  position
) =>
  getOfficeConfiguration(position)
    ?.level || null;

export const getOfficeDepartment = (
  position
) =>
  getOfficeConfiguration(position)
    ?.department || null;

export const getOfficeScope = (
  position
) =>
  getOfficeConfiguration(position)
    ?.scope || null;

export const getAppointmentType = (
  position
) =>
  getOfficeConfiguration(position)
    ?.appointmentType || null;

/* ==========================================================================
   CLASSIFICATION
=========================================================================== */

export const isRegionalExecutive = (
  position
) =>
  getOfficeLevel(position) ===
  "regional_executive";

export const isGovernor = (
  position
) =>
  normalizePosition(position) ===
    "governor" ||
  normalizePosition(position) ===
    "deputy_governor";

export const isYouthMP = (
  position
) =>
  [
    "elected_mp",
    "nominated_mp",
  ].includes(
    normalizePosition(position)
  );

export const isYouthMCA = (
  position
) =>
  normalizePosition(position) ===
  "youth_mca";

export const isPatron = (
  position
) =>
  normalizePosition(position) ===
  "patron";

/* ==========================================================================
   DISPLAY
=========================================================================== */

export const getDisplayTitle = (
  position
) =>
  getOfficeTitle(position);