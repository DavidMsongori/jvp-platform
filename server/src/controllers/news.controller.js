import * as newsService from "../services/news.service.js";

/**
 * ============================================================
 * NEWS CONTROLLER
 * ============================================================
 *
 * Architecture:
 *
 * Route
 *   ↓
 * Controller
 *   ↓
 * Service
 *   ↓
 * Model
 *   ↓
 * MongoDB
 *
 * Image Upload:
 *
 * Route
 *   ↓
 * Multer
 *   ↓
 * Controller
 *   ↓
 * News Service
 *   ↓
 * Cloudinary
 */

/**
 * ============================================================
 * PUBLIC NEWS
 * ============================================================
 */

/**
 * GET /api/news
 *
 * Get published news with pagination, filtering and search.
 */
export const getNews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 8,
      category,
      search,
      sort,
    } = req.query;

    const result = await newsService.getNews({
      page,
      limit,
      category,
      search,
      sort,
    });

    return res.status(200).json({
      success: true,
      message: "News retrieved successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Get news error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve news.",
    });
  }
};

/**
 * ============================================================
 * FEATURED NEWS
 * ============================================================
 *
 * GET /api/news/featured
 */
export const getFeaturedNews = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 1;

    const articles =
      await newsService.getFeaturedNews(limit);

    return res.status(200).json({
      success: true,
      message: "Featured news retrieved successfully.",
      articles,
    });
  } catch (error) {
    console.error("Get featured news error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve featured news.",
    });
  }
};

/**
 * ============================================================
 * LATEST NEWS
 * ============================================================
 *
 * GET /api/news/latest
 */
export const getLatestNews = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 8;

    const articles =
      await newsService.getLatestNews(limit);

    return res.status(200).json({
      success: true,
      message: "Latest news retrieved successfully.",
      articles,
    });
  } catch (error) {
    console.error("Get latest news error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve latest news.",
    });
  }
};

/**
 * ============================================================
 * CATEGORIES
 * ============================================================
 *
 * GET /api/news/categories
 */
export const getNewsCategories = async (req, res) => {
  try {
    const categories =
      await newsService.getNewsCategories();

    return res.status(200).json({
      success: true,
      message: "News categories retrieved successfully.",
      categories,
    });
  } catch (error) {
    console.error("Get news categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve news categories.",
    });
  }
};

/**
 * ============================================================
 * NEWS BY CATEGORY
 * ============================================================
 *
 * GET /api/news/category/:category
 */
export const getNewsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "News category is required.",
      });
    }

    const {
      page = 1,
      limit = 8,
      search,
      sort,
    } = req.query;

    const result =
      await newsService.getNewsByCategory(
        category,
        {
          page,
          limit,
          search,
          sort,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Category news retrieved successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Get news by category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve category news.",
    });
  }
};

/**
 * ============================================================
 * SINGLE ARTICLE
 * ============================================================
 *
 * GET /api/news/:slug
 */
export const getNewsArticle = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "News article slug is required.",
      });
    }

    const article =
      await newsService.getNewsArticle(slug);

    if (!article) {
      return res.status(404).json({
        success: false,
        message:
          "The requested news article was not found.",
      });
    }

    /**
     * Increment views without blocking
     * the article response.
     */
    newsService
      .incrementNewsViews(slug)
      .catch((error) =>
        console.error(
          "Increment news views error:",
          error
        )
      );

    return res.status(200).json({
      success: true,
      message: "News article retrieved successfully.",
      article,
    });
  } catch (error) {
    console.error("Get news article error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve news article.",
    });
  }
};

/**
 * ============================================================
 * RELATED NEWS
 * ============================================================
 *
 * GET /api/news/:slug/related
 */
export const getRelatedNews = async (req, res) => {
  try {
    const { slug } = req.params;

    const limit = Number(req.query.limit) || 4;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "News article slug is required.",
      });
    }

    const articles =
      await newsService.getRelatedNews(
        slug,
        limit
      );

    return res.status(200).json({
      success: true,
      message: "Related news retrieved successfully.",
      articles,
    });
  } catch (error) {
    console.error("Get related news error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve related news.",
    });
  }
};

/**
 * ============================================================
 * ADMIN — ALL NEWS
 * ============================================================
 *
 * GET /api/news/admin/all
 */
export const getAdminNews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 8,
      status,
      category,
      search,
      sort,
    } = req.query;

    const result =
      await newsService.getAdminNews({
        page,
        limit,
        status,
        category,
        search,
        sort,
      });

    return res.status(200).json({
      success: true,
      message: "News management records retrieved successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Get admin news error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve news records.",
    });
  }
};

/**
 * ============================================================
 * ADMIN — STATISTICS
 * ============================================================
 *
 * GET /api/news/admin/statistics
 */
export const getNewsStatistics = async (req, res) => {
  try {
    const statistics =
      await newsService.getNewsStatistics();

    return res.status(200).json({
      success: true,
      message: "News statistics retrieved successfully.",
      statistics,
    });
  } catch (error) {
    console.error("Get news statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve news statistics.",
    });
  }
};

/**
 * ============================================================
 * NEWS FEATURED IMAGE UPLOAD
 * ============================================================
 *
 * POST /api/news/upload-image
 *
 * Middleware:
 * uploadNewsImage
 *
 * Expected multipart field:
 * featuredImage
 */
export const uploadNewsFeaturedImage = async (
  req,
  res
) => {
  try {
    /**
     * Authentication check.
     */
    const userId =
      req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    /**
     * Multer places the uploaded file
     * on req.file.
     */
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a News featured image to upload.",
      });
    }

    /**
     * Upload the image to Cloudinary
     * through the News service.
     */
    const image =
      await newsService.uploadNewsFeaturedImage(
        req.file
      );

    return res.status(201).json({
      success: true,
      message:
        "News featured image uploaded successfully.",
      image,
    });
  } catch (error) {
    console.error(
      "Upload news featured image error:",
      error
    );

    /**
     * Multer file-size error.
     */
    if (
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The image is too large. Maximum allowed size is 10 MB.",
      });
    }

    /**
     * Multer file-type validation error.
     */
    if (
      error.message?.includes(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to upload News featured image.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

/**
 * ============================================================
 * CREATE NEWS
 * ============================================================
 *
 * POST /api/news
 */
export const createNews = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const article =
      await newsService.createNews(
        req.body,
        userId
      );

    return res.status(201).json({
      success: true,
      message: "News article created successfully.",
      article,
    });
  } catch (error) {
    console.error("Create news error:", error);

    /**
     * Handle duplicate slug.
     */
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An article with this slug already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create news article.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

/**
 * ============================================================
 * UPDATE NEWS
 * ============================================================
 *
 * PUT /api/news/:id
 */
export const updateNews = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const article =
      await newsService.updateNews(
        id,
        req.body,
        userId
      );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "News article not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News article updated successfully.",
      article,
    });
  } catch (error) {
    console.error("Update news error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An article with this slug already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update news article.",
    });
  }
};

/**
 * ============================================================
 * PUBLISH NEWS
 * ============================================================
 *
 * PATCH /api/news/:id/publish
 */
export const publishNews = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const article =
      await newsService.publishNews(
        id,
        userId
      );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "News article not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News article published successfully.",
      article,
    });
  } catch (error) {
    console.error("Publish news error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to publish news article.",
    });
  }
};

/**
 * ============================================================
 * UNPUBLISH NEWS
 * ============================================================
 *
 * PATCH /api/news/:id/unpublish
 */
export const unpublishNews = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const article =
      await newsService.unpublishNews(
        id,
        userId
      );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "News article not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News article unpublished successfully.",
      article,
    });
  } catch (error) {
    console.error("Unpublish news error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unpublish news article.",
    });
  }
};

/**
 * ============================================================
 * FEATURE NEWS
 * ============================================================
 *
 * PATCH /api/news/:id/feature
 */
export const featureNews = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const article =
      await newsService.featureNews(
        id,
        userId
      );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "News article not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News article featured successfully.",
      article,
    });
  } catch (error) {
    console.error("Feature news error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to feature news article.",
    });
  }
};

/**
 * ============================================================
 * UNFEATURE NEWS
 * ============================================================
 *
 * PATCH /api/news/:id/unfeature
 */
export const unfeatureNews = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const article =
      await newsService.unfeatureNews(
        id,
        userId
      );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "News article not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News article removed from featured.",
      article,
    });
  } catch (error) {
    console.error("Unfeature news error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove news article from featured.",
    });
  }
};

/**
 * ============================================================
 * ARCHIVE NEWS
 * ============================================================
 *
 * PATCH /api/news/:id/archive
 */
export const archiveNews = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const article =
      await newsService.archiveNews(
        id,
        userId
      );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "News article not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News article archived successfully.",
      article,
    });
  } catch (error) {
    console.error("Archive news error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to archive news article.",
    });
  }
};

/**
 * ============================================================
 * DELETE NEWS
 * ============================================================
 *
 * DELETE /api/news/:id
 */
export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const article =
      await newsService.deleteNews(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "News article not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News article deleted successfully.",
    });
  } catch (error) {
    console.error("Delete news error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete news article.",
    });
  }
};