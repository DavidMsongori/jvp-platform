import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import newsService from "../services/news.service.js";

import {
  NEWS_DEFAULTS,
  NEWS_FILTERS,
  NEWS_SORT,
} from "../constants/news.constants.js";


/*
|--------------------------------------------------------------------------
| CONTEXT
|--------------------------------------------------------------------------
*/

const NewsContext = createContext(null);


/*
|--------------------------------------------------------------------------
| PROVIDER
|--------------------------------------------------------------------------
*/

export const NewsProvider = ({ children }) => {

  /* ==========================================================
     PUBLIC NEWS STATE
  ========================================================== */

  const [articles, setArticles] = useState([]);

  const [featuredArticle, setFeaturedArticle] =
    useState(null);

  const [latestArticles, setLatestArticles] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [relatedArticles, setRelatedArticles] =
    useState([]);


  /* ==========================================================
     ARTICLE STATE
  ========================================================== */

  const [currentArticle, setCurrentArticle] =
    useState(null);


  /* ==========================================================
     ADMIN STATE
  ========================================================== */

  const [adminArticles, setAdminArticles] =
    useState([]);

  const [statistics, setStatistics] =
    useState(null);


  /* ==========================================================
     FILTER / PAGINATION STATE
  ========================================================== */

  const [filters, setFilters] = useState({
    category: NEWS_FILTERS.ALL,
    search: "",
    sort: NEWS_SORT.LATEST,
    page: NEWS_DEFAULTS.page,
    limit: NEWS_DEFAULTS.limit,
  });


  /* ==========================================================
     LOADING STATE
  ========================================================== */

  const [loading, setLoading] = useState(false);

  const [featuredLoading, setFeaturedLoading] =
    useState(false);

  const [latestLoading, setLatestLoading] =
    useState(false);

  const [articleLoading, setArticleLoading] =
    useState(false);

  const [relatedLoading, setRelatedLoading] =
    useState(false);

  const [adminLoading, setAdminLoading] =
    useState(false);

  const [statisticsLoading, setStatisticsLoading] =
    useState(false);

  const [imageUploading, setImageUploading] =
    useState(false);


  /* ==========================================================
     ERROR STATE
  ========================================================== */

  const [error, setError] = useState(null);

  const [imageUploadError, setImageUploadError] =
    useState(null);


  /* ==========================================================
     PUBLIC NEWS
  ========================================================== */

  const fetchNews = useCallback(
    async (params = {}) => {

      setLoading(true);
      setError(null);

      try {

        const requestParams = {
          ...filters,
          ...params,
        };

        const response =
          await newsService.getNews(
            requestParams
          );

        const data =
          response?.data || response;

        setArticles(
          data?.articles || []
        );

        if (data?.pagination) {
          setFilters((previous) => ({
            ...previous,
            page:
              data.pagination.page ??
              previous.page,
            limit:
              data.pagination.limit ??
              previous.limit,
          }));
        }

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load news.";

        setError(message);

        throw err;

      } finally {

        setLoading(false);

      }

    },
    [filters]
  );


  /* ==========================================================
     FEATURED NEWS
  ========================================================== */

  const fetchFeatured = useCallback(
    async (
      limit = NEWS_DEFAULTS.featuredLimit
    ) => {

      setFeaturedLoading(true);
      setError(null);

      try {

        const response =
          await newsService.getFeaturedNews(
            limit
          );

        const data =
          response?.data || response;

        const featured =
          data?.articles ||
          data ||
          [];

        setFeaturedArticle(
          featured[0] || null
        );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load featured news.";

        setError(message);

        throw err;

      } finally {

        setFeaturedLoading(false);

      }

    },
    []
  );


  /* ==========================================================
     LATEST NEWS
  ========================================================== */

  const fetchLatest = useCallback(
    async (
      limit = NEWS_DEFAULTS.latestLimit
    ) => {

      setLatestLoading(true);
      setError(null);

      try {

        const response =
          await newsService.getLatestNews(
            limit
          );

        const data =
          response?.data || response;

        const latest =
          data?.articles ||
          data ||
          [];

        setLatestArticles(latest);

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load latest news.";

        setError(message);

        throw err;

      } finally {

        setLatestLoading(false);

      }

    },
    []
  );


  /* ==========================================================
     CATEGORIES
  ========================================================== */

  const fetchCategories = useCallback(
    async () => {

      try {

        const response =
          await newsService.getNewsCategories();

        const data =
          response?.data || response;

        setCategories(
          data?.categories ||
          data ||
          []
        );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load news categories.";

        setError(message);

        throw err;

      }

    },
    []
  );


  /* ==========================================================
     NEWS BY CATEGORY
  ========================================================== */

  const fetchNewsByCategory = useCallback(
    async (
      category,
      params = {}
    ) => {

      setLoading(true);
      setError(null);

      try {

        const response =
          await newsService.getNewsByCategory(
            category,
            {
              ...filters,
              ...params,
            }
          );

        const data =
          response?.data || response;

        setArticles(
          data?.articles || []
        );

        if (data?.pagination) {
          setFilters((previous) => ({
            ...previous,
            page:
              data.pagination.page ??
              previous.page,
            limit:
              data.pagination.limit ??
              previous.limit,
          }));
        }

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load news by category.";

        setError(message);

        throw err;

      } finally {

        setLoading(false);

      }

    },
    [filters]
  );


  /* ==========================================================
     SINGLE ARTICLE
  ========================================================== */

  const fetchArticle = useCallback(
    async (slug) => {

      if (!slug) {
        return null;
      }

      setArticleLoading(true);
      setError(null);

      try {

        const response =
          await newsService.getNewsArticle(
            slug
          );

        const data =
          response?.data || response;

        const article =
          data?.article || data;

        setCurrentArticle(
          article || null
        );

        return article;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load article.";

        setError(message);

        throw err;

      } finally {

        setArticleLoading(false);

      }

    },
    []
  );


  /* ==========================================================
     RELATED NEWS
  ========================================================== */

  const fetchRelatedNews = useCallback(
    async (
      slug,
      limit = NEWS_DEFAULTS.relatedLimit
    ) => {

      if (!slug) {
        return [];
      }

      setRelatedLoading(true);
      setError(null);

      try {

        const response =
          await newsService.getRelatedNews(
            slug,
            limit
          );

        const data =
          response?.data || response;

        const related =
          data?.articles ||
          data ||
          [];

        setRelatedArticles(related);

        return related;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load related news.";

        setError(message);

        throw err;

      } finally {

        setRelatedLoading(false);

      }

    },
    []
  );


  /* ==========================================================
     ADMIN NEWS
  ========================================================== */

  const fetchAdminNews = useCallback(
    async (params = {}) => {

      setAdminLoading(true);
      setError(null);

      try {

        const response =
          await newsService.getAdminNews(
            params
          );

        const data =
          response?.data || response;

        setAdminArticles(
          data?.articles || []
        );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load news management data.";

        setError(message);

        throw err;

      } finally {

        setAdminLoading(false);

      }

    },
    []
  );


  /* ==========================================================
     NEWS STATISTICS
  ========================================================== */

  const fetchNewsStatistics = useCallback(
    async () => {

      setStatisticsLoading(true);
      setError(null);

      try {

        const response =
          await newsService.getNewsStatistics();

        const data =
          response?.data || response;

        setStatistics(
          data?.statistics ||
          data ||
          null
        );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load news statistics.";

        setError(message);

        throw err;

      } finally {

        setStatisticsLoading(false);

      }

    },
    []
  );


  /* ==========================================================
     UPLOAD NEWS IMAGE
  ========================================================== */

  const uploadNewsImage = useCallback(
    async (file) => {

      setImageUploading(true);
      setImageUploadError(null);
      setError(null);

      try {

        const response =
          await newsService.uploadNewsImage(
            file
          );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to upload News image.";

        setImageUploadError(message);
        setError(message);

        throw err;

      } finally {

        setImageUploading(false);

      }

    },
    []
  );


  /* ==========================================================
     CREATE NEWS
  ========================================================== */

  const createNews = useCallback(
    async (data) => {

      setError(null);

      try {

        const response =
          await newsService.createNews(
            data
          );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create news article.";

        setError(message);

        throw err;

      }

    },
    []
  );


  /* ==========================================================
     UPDATE NEWS
  ========================================================== */

  const updateNews = useCallback(
    async (
      id,
      data
    ) => {

      setError(null);

      try {

        const response =
          await newsService.updateNews(
            id,
            data
          );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update news article.";

        setError(message);

        throw err;

      }

    },
    []
  );


  /* ==========================================================
     PUBLISH
  ========================================================== */

  const publishNews = useCallback(
    async (id) => {

      setError(null);

      try {

        const response =
          await newsService.publishNews(
            id
          );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to publish news article.";

        setError(message);

        throw err;

      }

    },
    []
  );


  /* ==========================================================
     UNPUBLISH
  ========================================================== */

  const unpublishNews = useCallback(
    async (id) => {

      setError(null);

      try {

        const response =
          await newsService.unpublishNews(
            id
          );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to unpublish news article.";

        setError(message);

        throw err;

      }

    },
    []
  );


  /* ==========================================================
     FEATURE
  ========================================================== */

  const featureNews = useCallback(
    async (id) => {

      setError(null);

      try {

        const response =
          await newsService.featureNews(
            id
          );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to feature news article.";

        setError(message);

        throw err;

      }

    },
    []
  );


  /* ==========================================================
     UNFEATURE
  ========================================================== */

  const unfeatureNews = useCallback(
    async (id) => {

      setError(null);

      try {

        const response =
          await newsService.unfeatureNews(
            id
          );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to remove article from featured news.";

        setError(message);

        throw err;

      }

    },
    []
  );


  /* ==========================================================
     ARCHIVE
  ========================================================== */

  const archiveNews = useCallback(
    async (id) => {

      setError(null);

      try {

        const response =
          await newsService.archiveNews(
            id
          );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to archive news article.";

        setError(message);

        throw err;

      }

    },
    []
  );


  /* ==========================================================
     DELETE
  ========================================================== */

  const deleteNews = useCallback(
    async (id) => {

      setError(null);

      try {

        const response =
          await newsService.deleteNews(
            id
          );

        return response;

      } catch (err) {

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to delete news article.";

        setError(message);

        throw err;

      }

    },
    []
  );


  /* ==========================================================
     FILTER MANAGEMENT
  ========================================================== */

  const updateFilters = useCallback(
    (updates) => {

      setFilters((previous) => ({
        ...previous,
        ...updates,
      }));

    },
    []
  );


  const resetFilters = useCallback(
    () => {

      setFilters({
        category: NEWS_FILTERS.ALL,
        search: "",
        sort: NEWS_SORT.LATEST,
        page: NEWS_DEFAULTS.page,
        limit: NEWS_DEFAULTS.limit,
      });

    },
    []
  );


  /* ==========================================================
     CLEAR ARTICLE
  ========================================================== */

  const clearCurrentArticle = useCallback(
    () => {
      setCurrentArticle(null);
      setRelatedArticles([]);
    },
    []
  );


  /* ==========================================================
     CLEAR ERROR
  ========================================================== */

  const clearError = useCallback(
    () => {
      setError(null);
      setImageUploadError(null);
    },
    []
  );


  /* ==========================================================
     CONTEXT VALUE
  ========================================================== */

  const value = useMemo(
    () => ({

      /* ----------------------------
         Public News
      ---------------------------- */

      articles,
      featuredArticle,
      latestArticles,
      categories,
      relatedArticles,


      /* ----------------------------
         Current Article
      ---------------------------- */

      currentArticle,


      /* ----------------------------
         Admin
      ---------------------------- */

      adminArticles,
      statistics,


      /* ----------------------------
         Filters
      ---------------------------- */

      filters,
      updateFilters,
      resetFilters,


      /* ----------------------------
         Loading
      ---------------------------- */

      loading,
      featuredLoading,
      latestLoading,
      articleLoading,
      relatedLoading,
      adminLoading,
      statisticsLoading,
      imageUploading,


      /* ----------------------------
         Error
      ---------------------------- */

      error,
      imageUploadError,
      clearError,


      /* ----------------------------
         Public Actions
      ---------------------------- */

      fetchNews,
      fetchFeatured,
      fetchLatest,
      fetchCategories,
      fetchNewsByCategory,
      fetchArticle,
      fetchRelatedNews,


      /* ----------------------------
         Admin Actions
      ---------------------------- */

      fetchAdminNews,
      fetchNewsStatistics,


      /* ----------------------------
         Media Actions
      ---------------------------- */

      uploadNewsImage,


      /* ----------------------------
         Article Management
      ---------------------------- */

      createNews,
      updateNews,
      publishNews,
      unpublishNews,
      featureNews,
      unfeatureNews,
      archiveNews,
      deleteNews,


      /* ----------------------------
         Article Actions
      ---------------------------- */

      clearCurrentArticle,

    }),
    [
      articles,
      featuredArticle,
      latestArticles,
      categories,
      relatedArticles,

      currentArticle,

      adminArticles,
      statistics,

      filters,

      loading,
      featuredLoading,
      latestLoading,
      articleLoading,
      relatedLoading,
      adminLoading,
      statisticsLoading,
      imageUploading,

      error,
      imageUploadError,

      fetchNews,
      fetchFeatured,
      fetchLatest,
      fetchCategories,
      fetchNewsByCategory,
      fetchArticle,
      fetchRelatedNews,

      fetchAdminNews,
      fetchNewsStatistics,

      uploadNewsImage,

      createNews,
      updateNews,
      publishNews,
      unpublishNews,
      featureNews,
      unfeatureNews,
      archiveNews,
      deleteNews,

      updateFilters,
      resetFilters,
      clearCurrentArticle,
      clearError,
    ]
  );


  /* ==========================================================
     PROVIDER
  ========================================================== */

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
};


/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export const useNews = () => {

  const context = useContext(
    NewsContext
  );

  if (!context) {

    throw new Error(
      "useNews must be used within a NewsProvider."
    );

  }

  return context;
};


export default NewsContext;