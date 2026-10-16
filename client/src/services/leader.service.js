
import api from "./api";

/* ==========================================================
   RESPONSE HELPERS
========================================================== */

const getResponseData = (response) => response?.data ?? {};

/**
 * Returns the first non-empty string/value from the supplied
 * candidate fields.
 */
const firstValue = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
};

/**
 * Safely resolves common image representations:
 * - "https://example.com/photo.jpg"
 * - { url: "https://example.com/photo.jpg" }
 * - { secure_url: "https://example.com/photo.jpg" }
 */
const getImageUrl = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (value && typeof value === "object") {
      const url = firstValue(
        value.url,
        value.secure_url,
        value.src,
        value.path
      );

      if (url) return url;
    }
  }

  return null;
};

/**
 * Builds a display name from a populated Member/User object
 * when the Leader record does not contain a direct name.
 */
const getMemberName = (person) => {
  if (!person || typeof person !== "object") {
    return null;
  }

  const directName = firstValue(
    person.fullName,
    person.name,
    person.displayName,
    person.username
  );

  if (directName) return directName;

  const firstName = firstValue(
    person.firstName,
    person.first_name,
    person.givenName
  );

  const middleName = firstValue(
    person.middleName,
    person.middle_name
  );

  const lastName = firstValue(
    person.lastName,
    person.last_name,
    person.surname,
    person.familyName
  );

  const combined = [
    firstName,
    middleName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return combined || null;
};

/* ==========================================================
   LEADER NORMALIZATION
========================================================== */

/**
 * Normalizes common Leader response field names while
 * preserving the original backend properties.
 *
 * IMPORTANT:
 * This is a compatibility layer. The authoritative field
 * names should ultimately match leader.model.js and the
 * backend serializeLeader() function.
 */
const normalizeLeader = (leader) => {
  if (!leader || typeof leader !== "object") {
    return leader;
  }

  const member =
    leader.member && typeof leader.member === "object"
      ? leader.member
      : null;

  const user =
    leader.user && typeof leader.user === "object"
      ? leader.user
      : null;

  const person = member || user;

  const name = firstValue(
    leader.name,
    leader.fullName,
    leader.displayName,
    leader.memberName,
    leader.leaderName,
    getMemberName(person)
  );

  const profilePicture = getImageUrl(
    leader.profilePicture,
    leader.profileImage,
    leader.profilePhoto,
    leader.avatar,
    leader.photo,
    leader.image,
    leader.picture,
    member?.profilePicture,
    member?.profileImage,
    member?.profilePhoto,
    member?.avatar,
    member?.photo,
    member?.image,
    user?.profilePicture,
    user?.profileImage,
    user?.profilePhoto,
    user?.avatar,
    user?.photo,
    user?.image
  );

  const id = firstValue(
    leader._id,
    leader.id,
    leader.leaderId
  );

  return {
    ...leader,

    // Canonical frontend display fields.
    ...(name ? { name, displayName: name } : {}),

    ...(profilePicture
      ? {
          profilePicture,
          profileImage: profilePicture,
          avatar: profilePicture,
        }
      : {}),

    ...(id ? { id: String(id) } : {}),
  };
};

/* ==========================================================
   NORMALIZE API RESPONSE SHAPES
========================================================== */

/**
 * Normalizes standard list responses:
 *
 * {
 *   success: true,
 *   count: 10,
 *   data: [...],
 *   pagination: {...}
 * }
 *
 * Also supports legacy responses containing `leaders`.
 * The response envelope is preserved.
 */
const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeLeader);
  }

  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return {
      ...payload,
      data: payload.data.map(normalizeLeader),
      count:
        typeof payload.count === "number"
          ? payload.count
          : payload.data.length,
    };
  }

  if (Array.isArray(payload.leaders)) {
    return {
      ...payload,
      leaders: payload.leaders.map(normalizeLeader),
      count:
        typeof payload.count === "number"
          ? payload.count
          : payload.leaders.length,
    };
  }

  return payload;
};

/**
 * Normalizes a single-leader response while preserving
 * the standard { success, data } response envelope.
 */
const normalizeSingleResponse = (payload) => {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    return {
      ...payload,
      data: normalizeLeader(payload.data),
    };
  }

  // Supports a service response that returns the leader
  // directly instead of wrapping it in { data: leader }.
  if (payload._id || payload.id || payload.leaderId) {
    return normalizeLeader(payload);
  }

  return payload;
};

/**
 * Encodes dynamic URL segments.
 */
const encode = (value) =>
  encodeURIComponent(String(value));

/* ==========================================================
   PUBLIC LEADERSHIP DIRECTORY
========================================================== */

/**
 * GET /leaders/public
 *
 * Used by the public Leadership Page to load leader cards.
 * Supports pagination and query filters.
 */
const getPublicLeaders = async (params = {}) => {
  const response = await api.get("/leaders/public", {
    params,
  });

  return normalizeListResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/:id
 *
 * Used when a visitor taps a leader card to open their
 * individual profile page.
 */
const getLeader = async (leaderId) => {
  if (!leaderId) {
    throw new Error("A leader ID is required.");
  }

  const response = await api.get(
    `/leaders/${encode(leaderId)}`
  );

  return normalizeSingleResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/hierarchy
 */
const getLeadershipHierarchy = async (params = {}) => {
  const response = await api.get("/leaders/hierarchy", {
    params,
  });

  return getResponseData(response);
};

/* ==========================================================
   REGIONAL LEADERSHIP
========================================================== */

/**
 * GET /leaders/regional-cabinet
 */
const getRegionalCabinet = async (params = {}) => {
  const response = await api.get(
    "/leaders/regional-cabinet",
    { params }
  );

  return normalizeListResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/regional-youth-assembly
 */
const getRegionalYouthAssembly = async (
  params = {}
) => {
  const response = await api.get(
    "/leaders/regional-youth-assembly",
    { params }
  );

  return normalizeListResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/council-of-governors
 */
const getCouncilOfGovernors = async (params = {}) => {
  const response = await api.get(
    "/leaders/council-of-governors",
    { params }
  );

  return normalizeListResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/patron
 */
const getPatron = async () => {
  const response = await api.get("/leaders/patron");

  return normalizeSingleResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/cabinet-secretaries/:portfolioKey
 */
const getCabinetSecretaryByPortfolio = async (
  portfolioKey
) => {
  if (!portfolioKey) {
    throw new Error("A portfolio key is required.");
  }

  const response = await api.get(
    `/leaders/cabinet-secretaries/${encode(portfolioKey)}`
  );

  return normalizeSingleResponse(
    getResponseData(response)
  );
};

/* ==========================================================
   COUNTY LEADERSHIP
========================================================== */

/**
 * GET /leaders/county-cabinet
 * GET /leaders/county-cabinet/:county
 */
const getCountyCabinet = async (
  county = null,
  params = {}
) => {
  const url = county
    ? `/leaders/county-cabinet/${encode(county)}`
    : "/leaders/county-cabinet";

  const response = await api.get(url, { params });

  return normalizeListResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/county-youth-assembly
 * GET /leaders/county-youth-assembly/:county
 */
const getCountyYouthAssembly = async (
  county = null,
  params = {}
) => {
  const url = county
    ? `/leaders/county-youth-assembly/${encode(county)}`
    : "/leaders/county-youth-assembly";

  const response = await api.get(url, { params });

  return normalizeListResponse(
    getResponseData(response)
  );
};

/* ==========================================================
   LEADERSHIP DASHBOARD
========================================================== */

/**
 * GET /leaders/dashboard
 * Requires authentication.
 */
const getLeadershipDashboard = async (params = {}) => {
  const response = await api.get("/leaders/dashboard", {
    params,
  });

  return getResponseData(response);
};

/* ==========================================================
   ADMIN — DIRECTORY
========================================================== */

/**
 * GET /leaders/admin/all
 * Requires admin or super_admin authorization.
 */
const getLeaders = async (params = {}) => {
  const response = await api.get("/leaders/admin/all", {
    params,
  });

  return normalizeListResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/admin/scope/:scope
 */
const getLeadersByScope = async (
  scope,
  params = {}
) => {
  const response = await api.get(
    `/leaders/admin/scope/${encode(scope)}`,
    { params }
  );

  return normalizeListResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/admin/report-visibility/:reportVisibility
 */
const getLeadersByReportVisibility = async (
  reportVisibility,
  params = {}
) => {
  const response = await api.get(
    `/leaders/admin/report-visibility/${encode(
      reportVisibility
    )}`,
    { params }
  );

  return normalizeListResponse(
    getResponseData(response)
  );
};

/* ==========================================================
   ADMIN — GEOGRAPHIC FILTERS
========================================================== */

/**
 * GET /leaders/admin/county/:county
 */
const getLeadersByCounty = async (
  county,
  params = {}
) => {
  const response = await api.get(
    `/leaders/admin/county/${encode(county)}`,
    { params }
  );

  return normalizeListResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/admin/county/:county/constituency/:constituency
 */
const getLeadersByConstituency = async (
  county,
  constituency,
  params = {}
) => {
  const response = await api.get(
    `/leaders/admin/county/${encode(county)}/constituency/${encode(
      constituency
    )}`,
    { params }
  );

  return normalizeListResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/admin/county/:county/constituency/:constituency/ward/:ward
 */
const getLeadersByWard = async (
  county,
  constituency,
  ward,
  params = {}
) => {
  const response = await api.get(
    `/leaders/admin/county/${encode(county)}/constituency/${encode(
      constituency
    )}/ward/${encode(ward)}`,
    { params }
  );

  return normalizeListResponse(
    getResponseData(response)
  );
};

/**
 * GET /leaders/admin/position/:position
 */
const getLeadersByPosition = async (
  position,
  params = {}
) => {
  const response = await api.get(
    `/leaders/admin/position/${encode(position)}`,
    { params }
  );

  return normalizeListResponse(
    getResponseData(response)
  );
};

/* ==========================================================
   ADMIN — STATISTICS
========================================================== */

/**
 * GET /leaders/statistics
 */
const getStatistics = async () => {
  const response = await api.get("/leaders/statistics");

  return getResponseData(response);
};

/* ==========================================================
   ADMIN — VACANCIES
========================================================== */

/**
 * GET /leaders/admin/vacancies
 */
const getVacantPositions = async (params = {}) => {
  const response = await api.get(
    "/leaders/admin/vacancies",
    { params }
  );

  return getResponseData(response);
};

/* ==========================================================
   ADMIN — CREATE
========================================================== */

/**
 * POST /leaders
 */
const createLeader = async (data) => {
  const response = await api.post("/leaders", data);

  return normalizeSingleResponse(
    getResponseData(response)
  );
};

/* ==========================================================
   ADMIN — UPDATE
========================================================== */

/**
 * PUT /leaders/:id
 */
const updateLeader = async (leaderId, data) => {
  const response = await api.put(
    `/leaders/${encode(leaderId)}`,
    data
  );

  return normalizeSingleResponse(
    getResponseData(response)
  );
};

/* ==========================================================
   ADMIN — LIFECYCLE
========================================================== */

/**
 * PATCH /leaders/:id/activate
 */
const activateLeader = async (leaderId) => {
  const response = await api.patch(
    `/leaders/${encode(leaderId)}/activate`
  );

  return normalizeSingleResponse(
    getResponseData(response)
  );
};

/**
 * PATCH /leaders/:id/deactivate
 */
const deactivateLeader = async (leaderId) => {
  const response = await api.patch(
    `/leaders/${encode(leaderId)}/deactivate`
  );

  return normalizeSingleResponse(
    getResponseData(response)
  );
};

/* ==========================================================
   ADMIN — BULK OPERATIONS
========================================================== */

/**
 * PATCH /leaders/bulk/activate
 *
 * Body: { ids: [...] }
 */
const activateMany = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error(
      "Provide at least one leadership ID to activate."
    );
  }

  const response = await api.patch(
    "/leaders/bulk/activate",
    { ids }
  );

  return getResponseData(response);
};

/* ==========================================================
   ADMIN — DELETE
========================================================== */

/**
 * DELETE /leaders/:id
 */
const deleteLeader = async (leaderId) => {
  const response = await api.delete(
    `/leaders/${encode(leaderId)}`
  );

  return getResponseData(response);
};

/* ==========================================================
   SERVICE EXPORT
========================================================== */

const leaderService = {
  // Public directory and profiles
  getPublicLeaders,
  getLeader,
  getLeadershipHierarchy,

  // Regional leadership
  getRegionalCabinet,
  getRegionalYouthAssembly,
  getCouncilOfGovernors,
  getPatron,
  getCabinetSecretaryByPortfolio,

  // County leadership
  getCountyCabinet,
  getCountyYouthAssembly,

  // Dashboard
  getLeadershipDashboard,

  // Admin directory
  getLeaders,
  getLeadersByScope,
  getLeadersByReportVisibility,

  // Geographic filters
  getLeadersByCounty,
  getLeadersByConstituency,
  getLeadersByWard,
  getLeadersByPosition,

  // Statistics and vacancies
  getStatistics,
  getVacantPositions,

  // CRUD
  createLeader,
  updateLeader,
  deleteLeader,

  // Lifecycle
  activateLeader,
  deactivateLeader,

  // Bulk operations
  activateMany,
};

export default leaderService;