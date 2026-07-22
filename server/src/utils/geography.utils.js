import { COAST_GEOGRAPHY } from "../data/geography.js";

/* ==========================================================================
   NORMALIZATION
=========================================================================== */

export const normalizeValue = (value = "") =>
  value.trim().toLowerCase();

export const normalizeCounty = (county = "") => {
  const normalized = normalizeValue(county);

  return (
    Object.keys(COAST_GEOGRAPHY).find(
      (c) => normalizeValue(c) === normalized
    ) || null
  );
};

export const normalizeConstituency = (
  county,
  constituency = ""
) => {
  county = normalizeCounty(county);

  if (!county) return null;

  const normalized = normalizeValue(constituency);

  return (
    Object.keys(
      COAST_GEOGRAPHY[county].constituencies
    ).find(
      (c) => normalizeValue(c) === normalized
    ) || null
  );
};

export const normalizeWard = (
  county,
  constituency,
  ward = ""
) => {
  county = normalizeCounty(county);

  constituency = normalizeConstituency(
    county,
    constituency
  );

  if (!county || !constituency) return null;

  const normalized = normalizeValue(ward);

  return (
    COAST_GEOGRAPHY[county]
      .constituencies[constituency]
      .wards.find(
        (w) => normalizeValue(w) === normalized
      ) || null
  );
};

/* ==========================================================================
   LOOKUPS
=========================================================================== */

export const getCounties = () =>
  Object.keys(COAST_GEOGRAPHY);

export const getCountyCode = (county) => {
  county = normalizeCounty(county);

  return county
    ? COAST_GEOGRAPHY[county].code
    : null;
};

export const getConstituencies = (county) => {
  county = normalizeCounty(county);

  if (!county) return [];

  return Object.keys(
    COAST_GEOGRAPHY[county].constituencies
  );
};

export const getWards = (
  county,
  constituency
) => {
  county = normalizeCounty(county);

  constituency = normalizeConstituency(
    county,
    constituency
  );

  if (!county || !constituency) return [];

  return COAST_GEOGRAPHY[county]
    .constituencies[constituency]
    .wards;
};

/* ==========================================================================
   VALIDATION
=========================================================================== */

export const isValidCounty = (county) =>
  !!normalizeCounty(county);

export const isValidConstituency = (
  county,
  constituency
) =>
  !!normalizeConstituency(
    county,
    constituency
  );

export const isValidWard = (
  county,
  constituency,
  ward
) =>
  !!normalizeWard(
    county,
    constituency,
    ward
  );

/* ==========================================================================
   RELATIONSHIPS
=========================================================================== */

export const constituencyBelongsToCounty = (
  county,
  constituency
) => isValidConstituency(county, constituency);

export const wardBelongsToConstituency = (
  county,
  constituency,
  ward
) => isValidWard(
  county,
  constituency,
  ward
);