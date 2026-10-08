import api from "./api";

import { NEWS_API } from "../constants/news.constants.js";

/*
|--------------------------------------------------------------------------
| NEWS SERVICE
|--------------------------------------------------------------------------
| Centralized API service for:
| - Public News
| - News Articles
| - News Categories
| - Related News
| - Admin / CMS News Management
| - News Media Uploads
|--------------------------------------------------------------------------
|
| NOTE:
| The global VITE_API_URL already contains /api.
| Therefore this service strips the leading /api from NEWS_API paths
| before sending requests through the shared Axios instance.
|--------------------------------------------------------------------------
*/


/* ==========================================================
   API PATH HELPER
========================================================== */

/**
 * Convert News API paths from:
 *
 * /api/news/...
 *
 * to:
 *
 * /news/...
 *
 * because the shared Axios instance already uses:
 *
 * VITE_API_URL=http://localhost:5000/api
 */
const newsPath = (path) => {
  if (!path) return path;

  return path.startsWith("/api/")
    ? path.replace(/^\/api/, "")
    : path;
};


/* ==========================================================
   PUBLIC NEWS
========================================================== */

/**
 * Get published news
 *
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @param {string} params.category
 * @param {string} params.search
 * @param {string} params.sort
 */
export const getNews = async (params = {}) => {
  const response = await api.get(
    newsPath(NEWS_API.PUBLIC),
    {
      params,
    }
  );

  return response.data;
};


/**
 * Get latest published news
 *
 * @param {number} limit
 */
export const getLatestNews = async (limit = 8) => {
  const response = await api.get(
    newsPath(NEWS_API.LATEST),
    {
      params: {
        limit,
      },
    }
  );

  return response.data;
};


/**
 * Get featured published news
 *
 * @param {number} limit
 */
export const getFeaturedNews = async (limit = 1) => {
  const response = await api.get(
    newsPath(NEWS_API.FEATURED),
    {
      params: {
        limit,
      },
    }
  );

  return response.data;
};


/**
 * Get all published news categories
 */
export const getNewsCategories = async () => {
  const response = await api.get(
    newsPath(NEWS_API.CATEGORIES)
  );

  return response.data;
};


/**
 * Get published news by category
 *
 * @param {string} category
 * @param {Object} params
 */
export const getNewsByCategory = async (
  category,
  params = {}
) => {
  const response = await api.get(
    newsPath(
      NEWS_API.BY_CATEGORY(category)
    ),
    {
      params,
    }
  );

  return response.data;
};


/**
 * Get a single published article
 *
 * @param {string} slug
 */
export const getNewsArticle = async (slug) => {
  const response = await api.get(
    newsPath(
      NEWS_API.ARTICLE(slug)
    )
  );

  return response.data;
};


/**
 * Get related published news
 *
 * @param {string} slug
 * @param {number} limit
 */
export const getRelatedNews = async (
  slug,
  limit = 4
) => {
  const response = await api.get(
    newsPath(
      NEWS_API.RELATED(slug)
    ),
    {
      params: {
        limit,
      },
    }
  );

  return response.data;
};


/* ==========================================================
   ADMIN / CMS
========================================================== */

/**
 * Get all news articles for CMS
 *
 * Includes:
 * - Draft
 * - Published
 * - Archived
 *
 * @param {Object} params
 */
export const getAdminNews = async (
  params = {}
) => {
  const response = await api.get(
    newsPath(NEWS_API.ADMIN),
    {
      params,
    }
  );

  return response.data;
};


/**
 * Get News CMS statistics
 */
export const getNewsStatistics = async () => {
  const response = await api.get(
    newsPath(
      NEWS_API.ADMIN_STATISTICS
    )
  );

  return response.data;
};


/* ==========================================================
   NEWS MEDIA
========================================================== */

/**
 * Upload a News featured image.
 *
 * The image is sent as multipart/form-data.
 *
 * Expected backend field:
 * featuredImage
 *
 * Backend flow:
 * Multer → Cloudinary → jvp/news
 *
 * @param {File} file
 */
export const uploadNewsImage = async (file) => {
  if (!file) {
    throw new Error(
      "Please select a News image to upload."
    );
  }

  const formData = new FormData();

  formData.append(
    "featuredImage",
    file
  );

  const response = await api.post(
    newsPath(NEWS_API.UPLOAD_IMAGE),
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};


/* ==========================================================
   CREATE / UPDATE
========================================================== */

/**
 * Create a new news article
 *
 * @param {Object} data
 */
export const createNews = async (data) => {
  const response = await api.post(
    newsPath(NEWS_API.CREATE),
    data
  );

  return response.data;
};


/**
 * Update an existing news article
 *
 * @param {string} id
 * @param {Object} data
 */
export const updateNews = async (
  id,
  data
) => {
  const response = await api.put(
    newsPath(
      NEWS_API.UPDATE(id)
    ),
    data
  );

  return response.data;
};


/* ==========================================================
   PUBLICATION WORKFLOW
========================================================== */

/**
 * Publish article
 *
 * @param {string} id
 */
export const publishNews = async (id) => {
  const response = await api.patch(
    newsPath(
      NEWS_API.PUBLISH(id)
    )
  );

  return response.data;
};


/**
 * Unpublish article
 *
 * @param {string} id
 */
export const unpublishNews = async (id) => {
  const response = await api.patch(
    newsPath(
      NEWS_API.UNPUBLISH(id)
    )
  );

  return response.data;
};


/**
 * Mark article as featured
 *
 * @param {string} id
 */
export const featureNews = async (id) => {
  const response = await api.patch(
    newsPath(
      NEWS_API.FEATURE(id)
    )
  );

  return response.data;
};


/**
 * Remove article from featured
 *
 * @param {string} id
 */
export const unfeatureNews = async (id) => {
  const response = await api.patch(
    newsPath(
      NEWS_API.UNFEATURE(id)
    )
  );

  return response.data;
};


/**
 * Archive article
 *
 * @param {string} id
 */
export const archiveNews = async (id) => {
  const response = await api.patch(
    newsPath(
      NEWS_API.ARCHIVE(id)
    )
  );

  return response.data;
};


/* ==========================================================
   DELETE
========================================================== */

/**
 * Delete article
 *
 * @param {string} id
 */
export const deleteNews = async (id) => {
  const response = await api.delete(
    newsPath(
      NEWS_API.DELETE(id)
    )
  );

  return response.data;
};


/* ==========================================================
   DEFAULT EXPORT
========================================================== */

const newsService = {
  getNews,
  getLatestNews,
  getFeaturedNews,
  getNewsCategories,
  getNewsByCategory,
  getNewsArticle,
  getRelatedNews,

  getAdminNews,
  getNewsStatistics,

  uploadNewsImage,

  createNews,
  updateNews,

  publishNews,
  unpublishNews,
  featureNews,
  unfeatureNews,
  archiveNews,

  deleteNews,
};

export default newsService;