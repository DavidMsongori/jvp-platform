import mongoose from "mongoose";

import {
  NEWS_CATEGORIES,
  NEWS_STATUS,
} from "../constants/news.constants.js";

const newsSchema = new mongoose.Schema(
  {
    /**
     * ========================================================
     * BASIC ARTICLE INFORMATION
     * ========================================================
     */

    title: {
      type: String,
      required: [true, "News title is required"],
      trim: true,
      maxlength: [200, "News title cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      required: [true, "News slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    excerpt: {
      type: String,
      required: [true, "News excerpt is required"],
      trim: true,
      maxlength: [500, "News excerpt cannot exceed 500 characters"],
    },

    content: {
      type: String,
      required: [true, "News content is required"],
    },

    /**
     * ========================================================
     * MEDIA
     * ========================================================
     */

    featuredImage: {
      type: String,
      default: "",
      trim: true,
    },

    /**
     * ========================================================
     * CLASSIFICATION
     * ========================================================
     */

    category: {
      type: String,
      required: [true, "News category is required"],
      enum: Object.values(NEWS_CATEGORIES),
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        Array.isArray(tags)
          ? tags
              .map((tag) => tag.trim().toLowerCase())
              .filter(Boolean)
          : [],
    },

    /**
     * ========================================================
     * PUBLICATION
     * ========================================================
     */

    status: {
      type: String,
      enum: Object.values(NEWS_STATUS),
      default: NEWS_STATUS.DRAFT,
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    /**
     * ========================================================
     * AUTHORSHIP
     * ========================================================
     */

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    authorName: {
      type: String,
      default: "JVP Newsroom",
      trim: true,
    },

    /**
     * ========================================================
     * ENGAGEMENT
     * ========================================================
     */

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * ========================================================
     * SEO
     * ========================================================
     */

    seo: {
      metaTitle: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },

      metaDescription: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },

      keywords: {
        type: [String],
        default: [],
        set: (keywords) =>
          Array.isArray(keywords)
            ? keywords
                .map((keyword) => keyword.trim().toLowerCase())
                .filter(Boolean)
            : [],
      },
    },

    /**
     * ========================================================
     * AUDIT TRAIL
     * ========================================================
     */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ============================================================
 * INDEXES
 * ============================================================
 *
 * These support the public newsroom queries:
 *
 * - Latest news
 * - Featured stories
 * - Category filtering
 * - Search
 */

newsSchema.index({
  status: 1,
  publishedAt: -1,
});

newsSchema.index({
  status: 1,
  featured: 1,
  publishedAt: -1,
});

newsSchema.index({
  category: 1,
  status: 1,
  publishedAt: -1,
});

newsSchema.index({
  title: "text",
  excerpt: "text",
  content: "text",
  tags: "text",
});

/**
 * ============================================================
 * PRE-SAVE
 * ============================================================
 *
 * Automatically manage publishedAt when publication status
 * changes.
 *
 * IMPORTANT:
 * This hook intentionally does not use `next()`.
 * Mongoose handles completion automatically.
 */

newsSchema.pre("save", function () {
  if (
    this.status === NEWS_STATUS.PUBLISHED &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  if (this.status !== NEWS_STATUS.PUBLISHED) {
    this.publishedAt = null;
  }
});

/**
 * ============================================================
 * QUERY HELPERS
 * ============================================================
 */

/**
 * Only published articles.
 */
newsSchema.query.published = function () {
  return this.where({
    status: NEWS_STATUS.PUBLISHED,
  });
};

/**
 * Only featured published articles.
 */
newsSchema.query.featuredPublished = function () {
  return this.where({
    status: NEWS_STATUS.PUBLISHED,
    featured: true,
  });
};

/**
 * ============================================================
 * INSTANCE METHODS
 * ============================================================
 */

/**
 * Publish article.
 */
newsSchema.methods.publish = function () {
  this.status = NEWS_STATUS.PUBLISHED;

  if (!this.publishedAt) {
    this.publishedAt = new Date();
  }

  return this.save();
};

/**
 * Unpublish article.
 */
newsSchema.methods.unpublish = function () {
  this.status = NEWS_STATUS.DRAFT;
  this.publishedAt = null;

  return this.save();
};

/**
 * Archive article.
 */
newsSchema.methods.archive = function () {
  this.status = NEWS_STATUS.ARCHIVED;

  return this.save();
};

/**
 * Mark article as featured.
 */
newsSchema.methods.setFeatured = function (value = true) {
  this.featured = value;

  return this.save();
};

/**
 * Increment article views.
 */
newsSchema.methods.incrementViews = function () {
  this.views += 1;

  return this.save();
};

/**
 * ============================================================
 * MODEL
 * ============================================================
 */

const News = mongoose.model("News", newsSchema);

export default News;