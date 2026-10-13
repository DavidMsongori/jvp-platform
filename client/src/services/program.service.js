
import api from "./api";

/* ===========================================================
   FORM DATA HELPER
   Supports programmes, events, activities and initiatives.
=========================================================== */

const isFileLike = (value) =>
  typeof Blob !== "undefined" && value instanceof Blob;

const buildProgramFormData = (program = {}) => {
  const formData = new FormData();

  const append = (key, value) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  };

  const appendJSON = (key, value) => {
    formData.append(key, JSON.stringify(value ?? []));
  };

  /* ===========================================================
     BASIC INFORMATION
  =========================================================== */

  append("title", program.title || "");
  append("slug", program.slug || "");
  append("summary", program.summary || "");
  append("description", program.description || "");

  /* ===========================================================
     CLASSIFICATION
  =========================================================== */

  append("recordType", program.recordType || "programme");
  append("category", program.category || "");

  append(
    "parentProgram",
    program.parentProgram?._id ||
      program.parentProgram ||
      ""
  );

  appendJSON("objectives", program.objectives);

  /* ===========================================================
     SCHEDULE
  =========================================================== */

  append("startDate", program.startDate || "");
  append("endDate", program.endDate || "");

  /* ===========================================================
     LOCATION
  =========================================================== */

  append("county", program.county || "");
  append("subCounty", program.subCounty || "");
  append("ward", program.ward || "");
  append("location", program.location || "");

  /* ===========================================================
     STATUS
  =========================================================== */

  append("status", program.status || "planned");

  append(
    "isFeatured",
    String(program.isFeatured ?? false)
  );

  append(
    "isPublished",
    String(program.isPublished ?? false)
  );

  /* ===========================================================
     IMPACT TRACKING
  =========================================================== */

  if (program.youthsAttended !== undefined) {
    append(
      "youthsAttended",
      String(program.youthsAttended)
    );
  }

  if (program.youthsBenefited !== undefined) {
    append(
      "youthsBenefited",
      String(program.youthsBenefited)
    );
  }

  append("impactSummary", program.impactSummary || "");

  appendJSON("achievements", program.achievements);
  appendJSON("partners", program.partners);

  /* ===========================================================
     COVER IMAGE
     Supports:
     - coverImage: File
     - coverImage: { file: File }
     - Existing image metadata without re-uploading it
  =========================================================== */

  const coverFile = isFileLike(program.coverImage)
    ? program.coverImage
    : isFileLike(program.coverImage?.file)
      ? program.coverImage.file
      : null;

  if (coverFile) {
    formData.append("coverImage", coverFile);
  }

  append(
    "coverImageAlt",
    program.coverImageAlt ??
      program.coverImage?.alt ??
      ""
  );

  append(
    "coverImageCaption",
    program.coverImageCaption ??
      program.coverImage?.caption ??
      ""
  );

  /* ===========================================================
     GALLERY IMAGES
     Accepts File objects or objects containing { file: File }.
     The backend upload field must match "galleryImages".
  =========================================================== */

  const galleryItems = Array.isArray(program.galleryImages)
    ? program.galleryImages
    : Array.isArray(program.gallery)
      ? program.gallery
      : [];

  galleryItems.forEach((item) => {
    const file = isFileLike(item)
      ? item
      : isFileLike(item?.file)
        ? item.file
        : null;

    if (file) {
      formData.append("galleryImages", file);
    }
  });

  return formData;
};

/* ===========================================================
   PARAMETER HELPER
=========================================================== */

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== "" &&
        value !== null &&
        value !== undefined
    )
  );

/* ===========================================================
   PUBLIC PROGRAMS
=========================================================== */

/**
 * Get programmes and activities.
 */
export const getPrograms = async (params = {}) => {
  const response = await api.get("/programs", {
    params: cleanParams(params),
  });

  return response.data;
};

/**
 * Search programmes using supported backend filters.
 */
export const searchPrograms = async (
  search,
  params = {}
) => {
  const response = await api.get("/programs", {
    params: cleanParams({
      ...params,
      search,
    }),
  });

  return response.data;
};

/**
 * Filter programmes.
 */
export const filterPrograms = async (filters = {}) => {
  const response = await api.get("/programs", {
    params: cleanParams(filters),
  });

  return response.data;
};

/**
 * Get a programme by database ID.
 */
export const getProgramById = async (id) => {
  const response = await api.get(`/programs/${id}`);

  return response.data;
};

/**
 * Get a published programme by slug.
 */
export const getProgramBySlug = async (slug) => {
  const response = await api.get(
    `/programs/slug/${encodeURIComponent(slug)}`
  );

  return response.data;
};

/**
 * Get featured programmes.
 */
export const getFeaturedPrograms = async (limit = 6) => {
  const response = await api.get("/programs/featured", {
    params: { limit },
  });

  return response.data;
};

/**
 * Get upcoming programmes and activities.
 */
export const getUpcomingPrograms = async (limit = 10) => {
  const response = await api.get("/programs/upcoming", {
    params: { limit },
  });

  return response.data;
};

/**
 * Get ongoing programmes and activities.
 */
export const getOngoingPrograms = async () => {
  const response = await api.get("/programs/ongoing");

  return response.data;
};

/**
 * Get programmes by category.
 */
export const getProgramsByCategory = async (
  category,
  limit = 20
) => {
  const response = await api.get(
    `/programs/category/${encodeURIComponent(category)}`,
    {
      params: { limit },
    }
  );

  return response.data;
};

/**
 * Get public activities belonging to a published programme.
 */
export const getPublicProgramActivities = async (
  parentProgramId
) => {
  const response = await api.get(
    `/programs/public/${parentProgramId}/activities`
  );

  return response.data;
};

/* ===========================================================
   PROGRAM MANAGEMENT
=========================================================== */

/**
 * Create a programme, event, activity or initiative.
 */
export const createProgram = async (programData) => {
  const formData = buildProgramFormData(programData);

  // Axios/browser sets the multipart boundary automatically.
  const response = await api.post("/programs", formData);

  return response.data;
};

/**
 * Update a programme or activity.
 */
export const updateProgram = async (id, programData) => {
  const formData = buildProgramFormData(programData);

  // Axios/browser sets the multipart boundary automatically.
  const response = await api.patch(
    `/programs/${id}`,
    formData
  );

  return response.data;
};

/**
 * Soft-delete a programme or activity.
 */
export const deleteProgram = async (id) => {
  const response = await api.delete(`/programs/${id}`);

  return response.data;
};

/* ===========================================================
   PUBLISHING
=========================================================== */

/**
 * Publish a programme or activity.
 */
export const publishProgram = async (id) => {
  const response = await api.patch(
    `/programs/${id}/publish`
  );

  return response.data;
};

/**
 * Unpublish a programme or activity.
 */
export const unpublishProgram = async (id) => {
  const response = await api.patch(
    `/programs/${id}/unpublish`
  );

  return response.data;
};

/* ===========================================================
   IMPACT TRACKING
=========================================================== */

/**
 * Update attendance, beneficiaries and impact outcomes.
 */
export const updateProgramImpact = async (
  id,
  impactData = {}
) => {
  const response = await api.patch(
    `/programs/${id}/impact`,
    {
      youthsAttended: impactData.youthsAttended,
      youthsBenefited: impactData.youthsBenefited,
      impactSummary: impactData.impactSummary,
      achievements: impactData.achievements,
    }
  );

  return response.data;
};

/* ===========================================================
   ADMIN ACTIVITIES
=========================================================== */

/**
 * Get activities belonging to a parent programme.
 */
export const getProgramActivities = async (
  parentProgramId
) => {
  const response = await api.get(
    `/programs/${parentProgramId}/activities`
  );

  return response.data;
};

/* ===========================================================
   ADMIN DASHBOARD
=========================================================== */

/**
 * Get programme dashboard statistics.
 */
export const getProgramDashboardStatistics = async () => {
  const response = await api.get(
    "/programs/dashboard/statistics"
  );

  return response.data;
};

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

const programService = {
  // Public
  getPrograms,
  searchPrograms,
  filterPrograms,
  getProgramById,
  getProgramBySlug,
  getFeaturedPrograms,
  getUpcomingPrograms,
  getOngoingPrograms,
  getProgramsByCategory,
  getPublicProgramActivities,

  // Admin management
  createProgram,
  updateProgram,
  deleteProgram,
  publishProgram,
  unpublishProgram,

  // Impact
  updateProgramImpact,

  // Activities
  getProgramActivities,

  // Dashboard
  getProgramDashboardStatistics,
};

export default programService;