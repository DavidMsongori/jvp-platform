import api from "./api";

/**
 * Fetch published news with pagination, filtering and search.
 */
export const getNews = async (params = {}) => {
  const response = await api.get("/news", { params });
  return response.data;
};

/**
 * Fetch featured published articles.
 */
export const getFeaturedNews = async (limit = 1) => {
  const response = await api.get("/news/featured", {
    params: { limit },
  });
  return response.data;
};

/**
 * Fetch the latest published articles.
 */
export const getLatestNews = async (limit = 8) => {
  const response = await api.get("/news/latest", {
    params: { limit },
  });
  return response.data;
};

/**
 * Fetch published news categories.
 */
export const getNewsCategories = async () => {
  const response = await api.get("/news/categories");
  return response.data;
};

/**
 * Fetch published articles by category.
 */
export const getNewsByCategory = async (category, params = {}) => {
  const response = await api.get(
    `/news/category/${encodeURIComponent(category)}`,
    { params }
  );
  return response.data;
};

/**
 * Fetch one published article using its slug.
 */
export const getNewsArticle = async (slug) => {
  const response = await api.get(
    `/news/${encodeURIComponent(slug)}`
  );
  return response.data;
};

/**
 * Fetch related articles.
 */
export const getRelatedNews = async (slug, limit = 4) => {
  const response = await api.get(
    `/news/${encodeURIComponent(slug)}/related`,
    { params: { limit } }
  );
  return response.data;
};

export default {
  getNews,
  getFeaturedNews,
  getLatestNews,
  getNewsCategories,
  getNewsByCategory,
  getNewsArticle,
  getRelatedNews,
};
