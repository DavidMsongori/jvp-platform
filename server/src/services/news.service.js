import News from "../models/news.model.js";

import {
  NEWS_STATUS,
  NEWS_SORT,
} from "../constants/news.constants.js";

import { uploadImage } from "../config/cloudinary.js";

/**
 * ============================================================
 * NEWS SERVICE
 * ============================================================
 *
 * Handles all News database operations and business logic.
 *
 * Architecture:
 *
 * Controller
 *     ↓
 * News Service
 *     ↓
 * News Model
 *     ↓
 * MongoDB
 *
 * Cloudinary uploads:
 *
 * Controller
 *     ↓
 * News Service
 *     ↓
 * Cloudinary
 */

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

/**
 * Build pagination information.
 */
const getPagination = (page = 1, limit = 8) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.max(Number(limit) || 8, 1);

  return {
    page: currentPage,
    limit: perPage,
    skip: (currentPage - 1) * perPage,
  };
};

/**
 * Build sort configuration.
 */
const getSort = (sort = NEWS_SORT.LATEST) => {
  switch (sort) {
    case NEWS_SORT.OLDEST:
      return {
        publishedAt: 1,
      };

    case NEWS_SORT.MOST_VIEWED:
      return {
        views: -1,
        publishedAt: -1,
      };

    case NEWS_SORT.LATEST:
    default:
      return {
        publishedAt: -1,
      };
  }
};

/**
 * ============================================================
 * PUBLIC NEWS
 * ============================================================
 */

/**
 * Get all published news.
 *
 * Supports:
 * - pagination
 * - category
 * - search
 * - sorting
 */
export const getNews = async ({
  page = 1,
  limit = 8,
  category,
  search,
  sort = NEWS_SORT.LATEST,
} = {}) => {
  const { page: currentPage, limit: perPage, skip } =
    getPagination(page, limit);

  const query = {
    status: NEWS_STATUS.PUBLISHED,
  };

  /**
   * Category filter
   */
  if (category && category !== "all") {
    query.category = category;
  }

  /**
   * Search
   */
  if (search?.trim()) {
    query.$text = {
      $search: search.trim(),
    };
  }

  const [articles, total] = await Promise.all([
    News.find(query)
      .sort(getSort(sort))
      .skip(skip)
      .limit(perPage)
      .populate("author", "name email avatar")
      .lean(),

    News.countDocuments(query),
  ]);

  return {
    articles,
    pagination: {
      total,
      page: currentPage,
      limit: perPage,
      pages: Math.ceil(total / perPage),
      hasNextPage:
        currentPage < Math.ceil(total / perPage),
      hasPreviousPage: currentPage > 1,
    },
  };
};

/**
 * ============================================================
 * FEATURED NEWS
 * ============================================================
 */

/**
 * Get published featured articles.
 */
export const getFeaturedNews = async (limit = 1) => {
  return News.find({
    status: NEWS_STATUS.PUBLISHED,
    featured: true,
  })
    .sort({
      publishedAt: -1,
    })
    .limit(Number(limit) || 1)
    .populate("author", "name email avatar")
    .lean();
};

/**
 * ============================================================
 * LATEST NEWS
 * ============================================================
 */

/**
 * Get latest published articles.
 */
export const getLatestNews = async (limit = 8) => {
  return News.find({
    status: NEWS_STATUS.PUBLISHED,
  })
    .sort({
      publishedAt: -1,
    })
    .limit(Number(limit) || 8)
    .populate("author", "name email avatar")
    .lean();
};

/**
 * ============================================================
 * CATEGORIES
 * ============================================================
 */

/**
 * Get available news categories with article counts.
 */
export const getNewsCategories = async () => {
  return News.aggregate([
    {
      $match: {
        status: NEWS_STATUS.PUBLISHED,
      },
    },

    {
      $group: {
        _id: "$category",
        count: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },

    {
      $project: {
        _id: 0,
        category: "$_id",
        count: 1,
      },
    },
  ]);
};

/**
 * ============================================================
 * CATEGORY NEWS
 * ============================================================
 */

/**
 * Get published articles by category.
 */
export const getNewsByCategory = async (
  category,
  options = {}
) => {
  return getNews({
    ...options,
    category,
  });
};

/**
 * ============================================================
 * SINGLE ARTICLE
 * ============================================================
 */

/**
 * Get a published article by slug.
 */
export const getNewsArticle = async (slug) => {
  const article = await News.findOne({
    slug,
    status: NEWS_STATUS.PUBLISHED,
  })
    .populate("author", "name email avatar")
    .lean();

  return article;
};

/**
 * ============================================================
 * RELATED NEWS
 * ============================================================
 */

/**
 * Get related published articles.
 *
 * Priority:
 * 1. Same category
 * 2. Shared tags
 * 3. Most recent
 */
export const getRelatedNews = async (
  slug,
  limit = 4
) => {
  const article = await News.findOne({
    slug,
    status: NEWS_STATUS.PUBLISHED,
  }).lean();

  if (!article) {
    return [];
  }

  const query = {
    _id: {
      $ne: article._id,
    },

    status: NEWS_STATUS.PUBLISHED,

    $or: [
      {
        category: article.category,
      },
    ],
  };

  if (article.tags?.length) {
    query.$or.push({
      tags: {
        $in: article.tags,
      },
    });
  }

  return News.find(query)
    .sort({
      publishedAt: -1,
    })
    .limit(Number(limit) || 4)
    .populate("author", "name email avatar")
    .lean();
};

/**
 * ============================================================
 * VIEW COUNT
 * ============================================================
 */

/**
 * Increment article views.
 */
export const incrementNewsViews = async (slug) => {
  return News.findOneAndUpdate(
    {
      slug,
      status: NEWS_STATUS.PUBLISHED,
    },
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: true,
    }
  );
};

/**
 * ============================================================
 * ADMIN — GET ALL NEWS
 * ============================================================
 */

/**
 * Get all articles for the admin CMS.
 *
 * Unlike the public service, this includes:
 *
 * - drafts
 * - published
 * - archived
 */
export const getAdminNews = async ({
  page = 1,
  limit = 8,
  status,
  category,
  search,
  sort = NEWS_SORT.LATEST,
} = {}) => {
  const { page: currentPage, limit: perPage, skip } =
    getPagination(page, limit);

  const query = {};

  if (status && status !== "all") {
    query.status = status;
  }

  if (category && category !== "all") {
    query.category = category;
  }

  if (search?.trim()) {
    query.$text = {
      $search: search.trim(),
    };
  }

  const [articles, total] = await Promise.all([
    News.find(query)
      .sort(
        status === NEWS_STATUS.DRAFT
          ? { updatedAt: -1 }
          : getSort(sort)
      )
      .skip(skip)
      .limit(perPage)
      .populate("author", "name email avatar")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean(),

    News.countDocuments(query),
  ]);

  return {
    articles,
    pagination: {
      total,
      page: currentPage,
      limit: perPage,
      pages: Math.ceil(total / perPage),
      hasNextPage:
        currentPage < Math.ceil(total / perPage),
      hasPreviousPage: currentPage > 1,
    },
  };
};

/**
 * ============================================================
 * ADMIN — GET STATISTICS
 * ============================================================
 */

export const getNewsStatistics = async () => {
  const [
    total,
    drafts,
    published,
    archived,
    featured,
    views,
  ] = await Promise.all([
    News.countDocuments(),

    News.countDocuments({
      status: NEWS_STATUS.DRAFT,
    }),

    News.countDocuments({
      status: NEWS_STATUS.PUBLISHED,
    }),

    News.countDocuments({
      status: NEWS_STATUS.ARCHIVED,
    }),

    News.countDocuments({
      status: NEWS_STATUS.PUBLISHED,
      featured: true,
    }),

    News.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$views",
          },
        },
      },
    ]),
  ]);

  return {
    total,
    drafts,
    published,
    archived,
    featured,
    views: views[0]?.total || 0,
  };
};

/**
 * ============================================================
 * IMAGE UPLOAD
 * ============================================================
 */

/**
 * Upload a News featured image to Cloudinary.
 *
 * The actual file is received by Multer and passed here
 * as a memory buffer.
 *
 * Cloudinary folder:
 *
 * jvp/news
 *
 * Returns:
 * - publicId
 * - secureUrl
 * - width
 * - height
 * - format
 * - bytes
 * - etc.
 */
export const uploadNewsFeaturedImage = async (file) => {
  if (!file?.buffer) {
    throw new Error(
      "No News featured image was provided."
    );
  }

  return uploadImage(file.buffer, {
    folder: "jvp/news",
  });
};

/**
 * ============================================================
 * CREATE
 * ============================================================
 */

export const createNews = async (data, userId) => {
  const article = new News({
    ...data,

    createdBy: userId,
    updatedBy: userId,
  });

  return article.save();
};

/**
 * ============================================================
 * UPDATE
 * ============================================================
 */

export const updateNews = async (
  id,
  data,
  userId
) => {
  const article = await News.findById(id);

  if (!article) {
    return null;
  }

  /**
   * Prevent accidental modification of audit fields.
   */
  delete data.createdBy;
  delete data.updatedBy;

  Object.assign(article, data);

  article.updatedBy = userId;

  return article.save();
};

/**
 * ============================================================
 * PUBLISH
 * ============================================================
 */

export const publishNews = async (
  id,
  userId
) => {
  const article = await News.findById(id);

  if (!article) {
    return null;
  }

  article.status = NEWS_STATUS.PUBLISHED;

  if (!article.publishedAt) {
    article.publishedAt = new Date();
  }

  article.updatedBy = userId;

  return article.save();
};

/**
 * ============================================================
 * UNPUBLISH
 * ============================================================
 */

export const unpublishNews = async (
  id,
  userId
) => {
  const article = await News.findById(id);

  if (!article) {
    return null;
  }

  article.status = NEWS_STATUS.DRAFT;
  article.publishedAt = null;
  article.updatedBy = userId;

  return article.save();
};

/**
 * ============================================================
 * FEATURE
 * ============================================================
 */

export const featureNews = async (
  id,
  userId
) => {
  const article = await News.findById(id);

  if (!article) {
    return null;
  }

  article.featured = true;
  article.updatedBy = userId;

  return article.save();
};

/**
 * ============================================================
 * UNFEATURE
 * ============================================================
 */

export const unfeatureNews = async (
  id,
  userId
) => {
  const article = await News.findById(id);

  if (!article) {
    return null;
  }

  article.featured = false;
  article.updatedBy = userId;

  return article.save();
};

/**
 * ============================================================
 * ARCHIVE
 * ============================================================
 */

export const archiveNews = async (
  id,
  userId
) => {
  const article = await News.findById(id);

  if (!article) {
    return null;
  }

  article.status = NEWS_STATUS.ARCHIVED;
  article.featured = false;
  article.updatedBy = userId;

  return article.save();
};

/**
 * ============================================================
 * DELETE
 * ============================================================
 */

export const deleteNews = async (id) => {
  return News.findByIdAndDelete(id);
};

/**
 * ============================================================
 * EXPORT DEFAULT SERVICE
 * ============================================================
 */

const newsService = {
  getNews,
  getFeaturedNews,
  getLatestNews,
  getNewsCategories,
  getNewsByCategory,
  getNewsArticle,
  getRelatedNews,
  incrementNewsViews,

  getAdminNews,
  getNewsStatistics,

  uploadNewsFeaturedImage,

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