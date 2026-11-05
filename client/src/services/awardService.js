
import api from "./api";

/**
 * JVP Coastal Youth Excellence Awards API service.
 * Reuses the existing Axios instance and authentication.
 */

// =======================================================
// PUBLIC — AWARD CATEGORIES
// =======================================================

// Fetch active award categories.
export const getAwardCategories = async () => {
  const response = await api.get("/awards");
  return response.data;
};

// =======================================================
// PUBLIC — NOMINATIONS
// =======================================================

// Submit a public award nomination.
export const submitAwardNomination = async (nominationData) => {
  const response = await api.post(
    "/awards/nominations",
    nominationData
  );

  return response.data;
};

// =======================================================
// ADMIN / SECRETARIAT — CATEGORY MANAGEMENT
// =======================================================

// Fetch all categories, including drafts.
export const getAdminAwardCategories = async () => {
  const response = await api.get("/awards/admin/categories");
  return response.data;
};

// Create a category.
// New categories are created as drafts by the backend.
export const createAwardCategory = async (categoryData) => {
  const response = await api.post(
    "/awards/admin/categories",
    categoryData
  );

  return response.data;
};

// Activate or deactivate an award category.
export const updateAwardCategoryStatus = async (
  categoryId,
  status
) => {
  const response = await api.patch(
    `/awards/admin/categories/${categoryId}/status`,
    { status }
  );

  return response.data;
};

// Update category nomination settings.
export const updateAwardCategoryNominationSettings = async (
  categoryId,
  settings
) => {
  const response = await api.patch(
    `/awards/admin/categories/${categoryId}/nomination-settings`,
    settings
  );

  return response.data;
};

// =======================================================
// ADMIN / SECRETARIAT — NOMINATION REVIEW
// =======================================================

// Fetch nominations with optional filters and pagination.
export const getAdminAwardNominations = async ({
  status,
  categoryId,
  page = 1,
  limit = 20,
} = {}) => {
  const response = await api.get(
    "/awards/admin/nominations",
    {
      params: {
        ...(status && { status }),
        ...(categoryId && { categoryId }),
        page,
        limit,
      },
    }
  );

  return response.data;
};

// Move a nomination to review, approve it, or reject it.
export const reviewAwardNomination = async (
  nominationId,
  {
    decision,
    reviewNotes = "",
    rejectionReason = "",
  }
) => {
  const response = await api.patch(
    `/awards/admin/nominations/${nominationId}/review`,
    {
      decision,
      reviewNotes,
      rejectionReason,
    }
  );

  return response.data;
};

// =======================================================
// DEFAULT EXPORT
// =======================================================

const awardService = {
  getAwardCategories,
  submitAwardNomination,
  getAdminAwardCategories,
  createAwardCategory,
  updateAwardCategoryStatus,
  updateAwardCategoryNominationSettings,
  getAdminAwardNominations,
  reviewAwardNomination,
};

export default awardService;
