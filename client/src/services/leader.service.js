import api from "./api";


/* ==========================================================
   PUBLIC LEADERSHIP DIRECTORY
========================================================== */

/**
 * Get all active public leadership records.
 */
const getPublicLeaders = async (params = {}) => {

  const response =
    await api.get("/leaders/public", {
      params,
    });

  return response.data;

};


/**
 * Get a single leadership record.
 */
const getLeader = async (leaderId) => {

  const response =
    await api.get(
      `/leaders/${leaderId}`
    );

  return response.data;

};


/**
 * Get complete public leadership hierarchy.
 *
 * Includes:
 * - Patron
 * - Regional Cabinet
 * - Regional Youth Assembly
 * - Council of Governors
 * - County Cabinets
 * - County Youth Assemblies
 */
const getLeadershipHierarchy = async () => {

  const response =
    await api.get(
      "/leaders/hierarchy"
    );

  return response.data;

};


/* ==========================================================
   REGIONAL LEADERSHIP
========================================================== */

/**
 * Get Regional Cabinet.
 */
const getRegionalCabinet = async () => {

  const response =
    await api.get(
      "/leaders/regional-cabinet"
    );

  return response.data;

};


/**
 * Get Regional Youth Assembly.
 */
const getRegionalYouthAssembly = async () => {

  const response =
    await api.get(
      "/leaders/regional-youth-assembly"
    );

  return response.data;

};


/**
 * Get Council of Governors.
 *
 * The Council of Governors is a Secretariat structure
 * containing the six Youth Governors.
 */
const getCouncilOfGovernors = async () => {

  const response =
    await api.get(
      "/leaders/council-of-governors"
    );

  return response.data;

};


/**
 * Get Patron.
 *
 * Patronage is separate from the five structural
 * leadership levels.
 */
const getPatron = async () => {

  const response =
    await api.get(
      "/leaders/patron"
    );

  return response.data;

};


/* ==========================================================
   COUNTY LEADERSHIP
========================================================== */

/**
 * Get all County Cabinet leadership.
 */
const getCountyCabinet = async (
  county = null
) => {

  const url =
    county
      ? `/leaders/county-cabinet/${encodeURIComponent(county)}`
      : "/leaders/county-cabinet";

  const response =
    await api.get(url);

  return response.data;

};


/**
 * Get County Youth Assembly leadership.
 */
const getCountyYouthAssembly = async (
  county = null
) => {

  const url =
    county
      ? `/leaders/county-youth-assembly/${encodeURIComponent(county)}`
      : "/leaders/county-youth-assembly";

  const response =
    await api.get(url);

  return response.data;

};


/* ==========================================================
   LEADERSHIP DASHBOARD
========================================================== */

/**
 * Get the leadership dashboard for the
 * currently authenticated leader.
 *
 * Supports:
 * - pagination
 * - search
 * - membership status
 * - membership type
 * - sorting
 */
const getLeadershipDashboard = async (
  params = {}
) => {

  const response =
    await api.get(
      "/leaders/dashboard",
      {
        params,
      }
    );

  return response.data;

};


/* ==========================================================
   ADMIN — DIRECTORY
========================================================== */

/**
 * Get all leadership records.
 *
 * Supported filters:
 * - category
 * - level
 * - department
 * - scope
 * - reportVisibility
 * - position
 * - county
 * - constituency
 * - ward
 * - member
 * - status
 * - active
 */
const getLeaders = async (
  params = {}
) => {

  const response =
    await api.get(
      "/leaders/admin/all",
      {
        params,
      }
    );

  return response.data;

};


/**
 * Get leaders by structural scope.
 *
 * Examples:
 * - regional_cabinet
 * - regional_youth_assembly
 * - county_cabinet
 * - county_youth_assembly
 */
const getLeadersByScope = async (
  scope
) => {

  const response =
    await api.get(
      `/leaders/admin/scope/${encodeURIComponent(scope)}`
    );

  return response.data;

};


/**
 * Get leaders by report visibility.
 *
 * Examples:
 * - regional
 * - county
 * - constituency
 * - ward
 * - private
 */
const getLeadersByReportVisibility = async (
  reportVisibility
) => {

  const response =
    await api.get(
      `/leaders/admin/report-visibility/${encodeURIComponent(
        reportVisibility
      )}`
    );

  return response.data;

};


/* ==========================================================
   ADMIN — GEOGRAPHIC FILTERS
========================================================== */

/**
 * Get all leadership records within a county.
 */
const getLeadersByCounty = async (
  county
) => {

  const response =
    await api.get(
      `/leaders/admin/county/${encodeURIComponent(
        county
      )}`
    );

  return response.data;

};


/**
 * Get leadership records within a constituency.
 */
const getLeadersByConstituency = async (
  county,
  constituency
) => {

  const response =
    await api.get(
      `/leaders/admin/county/${encodeURIComponent(
        county
      )}/constituency/${encodeURIComponent(
        constituency
      )}`
    );

  return response.data;

};


/**
 * Get leadership records within a ward.
 */
const getLeadersByWard = async (
  county,
  constituency,
  ward
) => {

  const response =
    await api.get(
      `/leaders/admin/county/${encodeURIComponent(
        county
      )}/constituency/${encodeURIComponent(
        constituency
      )}/ward/${encodeURIComponent(
        ward
      )}`
    );

  return response.data;

};


/**
 * Get active leaders holding a particular office.
 *
 * Examples:
 * - president
 * - county_governor
 * - elected_mca
 * - elected_mp
 */
const getLeadersByPosition = async (
  position
) => {

  const response =
    await api.get(
      `/leaders/admin/position/${encodeURIComponent(
        position
      )}`
    );

  return response.data;

};


/* ==========================================================
   ADMIN — STATISTICS
========================================================== */

/**
 * Get leadership statistics.
 */
const getStatistics = async () => {

  const response =
    await api.get(
      "/leaders/statistics"
    );

  return response.data;

};


/**
 * Get complete leadership dashboard
 * statistics/charts.
 *
 * Note:
 * This requires a corresponding backend
 * controller/route if exposed separately.
 */
const getDashboardStatistics = async () => {

  const response =
    await api.get(
      "/leaders/dashboard-statistics"
    );

  return response.data;

};


/* ==========================================================
   ADMIN — VACANCIES
========================================================== */

/**
 * Get currently vacant leadership offices.
 */
const getVacantPositions = async () => {

  const response =
    await api.get(
      "/leaders/admin/vacancies"
    );

  return response.data;

};


/* ==========================================================
   ADMIN — CREATE
========================================================== */

/**
 * Create a new leadership record.
 *
 * The backend derives:
 * - category
 * - level
 * - department
 * - scope
 * - reportVisibility
 * - appointmentType
 *
 * from the selected office.
 */
const createLeader = async (
  data
) => {

  const response =
    await api.post(
      "/leaders",
      data
    );

  return response.data;

};


/* ==========================================================
   ADMIN — UPDATE
========================================================== */

/**
 * Update a leadership record.
 */
const updateLeader = async (
  leaderId,
  data
) => {

  const response =
    await api.put(
      `/leaders/${leaderId}`,
      data
    );

  return response.data;

};


/* ==========================================================
   ADMIN — LIFECYCLE
========================================================== */

/**
 * Activate a leadership record.
 */
const activateLeader = async (
  leaderId
) => {

  const response =
    await api.patch(
      `/leaders/${leaderId}/activate`
    );

  return response.data;

};


/**
 * Deactivate a leadership record.
 */
const deactivateLeader = async (
  leaderId
) => {

  const response =
    await api.patch(
      `/leaders/${leaderId}/deactivate`
    );

  return response.data;

};


/**
 * Delete a leadership record.
 */
const deleteLeader = async (
  leaderId
) => {

  const response =
    await api.delete(
      `/leaders/${leaderId}`
    );

  return response.data;

};


/* ==========================================================
   LEADERSHIP SERVICE
========================================================== */

const leaderService = {

  /* --------------------------------------------------------
     PUBLIC
  -------------------------------------------------------- */

  getPublicLeaders,
  getLeader,
  getLeadershipHierarchy,

  getPatron,

  getRegionalCabinet,
  getRegionalYouthAssembly,
  getCouncilOfGovernors,

  getCountyCabinet,
  getCountyYouthAssembly,


  /* --------------------------------------------------------
     LEADERSHIP DASHBOARD
  -------------------------------------------------------- */

  getLeadershipDashboard,


  /* --------------------------------------------------------
     ADMIN — DIRECTORY
  -------------------------------------------------------- */

  getLeaders,

  getLeadersByScope,
  getLeadersByReportVisibility,

  getLeadersByPosition,

  getLeadersByCounty,
  getLeadersByConstituency,
  getLeadersByWard,


  /* --------------------------------------------------------
     ADMIN — STATISTICS
  -------------------------------------------------------- */

  getStatistics,
  getDashboardStatistics,


  /* --------------------------------------------------------
     ADMIN — VACANCIES
  -------------------------------------------------------- */

  getVacantPositions,


  /* --------------------------------------------------------
     ADMIN — CRUD
  -------------------------------------------------------- */

  createLeader,
  updateLeader,

  activateLeader,
  deactivateLeader,
  deleteLeader,

};


export default leaderService;