/**
 * ============================================================
 * JVP NEWS CONSTANTS
 * ============================================================
 *
 * Centralized constants for the JVP News frontend.
 *
 * Used by:
 * - News Context
 * - News Service
 * - News Editor
 * - News Admin
 * - Public News Pages
 * - News Article Page
 */

/**
 * ============================================================
 * NEWS CATEGORIES
 * ============================================================
 */

export const NEWS_CATEGORIES = {
  ANNOUNCEMENTS: "announcements",
  OPPORTUNITIES: "opportunities",
  LEADERSHIP: "leadership",
  PROGRAMMES: "programmes",
  EVENTS: "events",
  PARTNERSHIPS: "partnerships",
  COMMUNITY: "community",
  STATEMENTS: "statements",
  SUCCESS_STORIES: "success_stories",
};

export const NEWS_CATEGORY_LABELS = {
  announcements: "Announcements",
  opportunities: "Opportunities",
  leadership: "Leadership",
  programmes: "Programmes",
  events: "Events",
  partnerships: "Partnerships",
  community: "Community",
  statements: "Statements",
  success_stories: "Success Stories",
};

export const NEWS_CATEGORY_OPTIONS = Object.entries(
  NEWS_CATEGORY_LABELS
).map(([value, label]) => ({
  value,
  label,
}));

/**
 * ============================================================
 * NEWS STATUS
 * ============================================================
 */

export const NEWS_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const NEWS_STATUS_LABELS = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const NEWS_STATUS_OPTIONS = Object.entries(
  NEWS_STATUS_LABELS
).map(([value, label]) => ({
  value,
  label,
}));

/**
 * ============================================================
 * NEWS TYPES
 * ============================================================
 */

export const NEWS_TYPES = {
  NEWS: "news",
  PRESS_RELEASE: "press_release",
  STATEMENT: "statement",
  NOTICE: "notice",
  REPORT: "report",
};

export const NEWS_TYPE_LABELS = {
  news: "News",
  press_release: "Press Release",
  statement: "Statement",
  notice: "Notice",
  report: "Report",
};

export const NEWS_TYPE_OPTIONS = Object.entries(
  NEWS_TYPE_LABELS
).map(([value, label]) => ({
  value,
  label,
}));

/**
 * ============================================================
 * EDITORIAL ACTIONS
 * ============================================================
 */

export const NEWS_ACTIONS = {
  CREATE: "create",
  EDIT: "edit",
  PUBLISH: "publish",
  UNPUBLISH: "unpublish",
  FEATURE: "feature",
  UNFEATURE: "unfeature",
  ARCHIVE: "archive",
  DELETE: "delete",
};

/**
 * ============================================================
 * NEWS MEDIA
 * ============================================================
 *
 * Featured News images are uploaded as actual files.
 *
 * Frontend sends:
 * FormData -> featuredImage
 *
 * Backend:
 * Multer -> Cloudinary -> /jvp/news
 * ============================================================
 */

export const NEWS_MEDIA = {
  FEATURED_IMAGE_FIELD: "featuredImage",
  FEATURED_IMAGE_FOLDER: "jvp/news",

  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_FILE_SIZE_MB: 10,

  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ],

  ALLOWED_EXTENSIONS: [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ],
};

/**
 * ============================================================
 * NEWS API
 * ============================================================
 */

export const NEWS_API = {
  BASE: "/api/news",

  /**
   * Public
   */
  PUBLIC: "/api/news",

  FEATURED: "/api/news/featured",

  LATEST: "/api/news/latest",

  CATEGORIES: "/api/news/categories",

  BY_CATEGORY: (category) =>
    `/api/news/category/${category}`,

  ARTICLE: (slug) =>
    `/api/news/${slug}`,

  RELATED: (slug) =>
    `/api/news/${slug}/related`,

  /**
   * Admin / CMS
   */
  ADMIN: "/api/news/admin/all",

  ADMIN_STATISTICS:
    "/api/news/admin/statistics",

  /**
   * Media
   */
  UPLOAD_IMAGE:
    "/api/news/upload-image",

  /**
   * CRUD
   */
  CREATE: "/api/news",

  UPDATE: (id) =>
    `/api/news/${id}`,

  PUBLISH: (id) =>
    `/api/news/${id}/publish`,

  UNPUBLISH: (id) =>
    `/api/news/${id}/unpublish`,

  FEATURE: (id) =>
    `/api/news/${id}/feature`,

  UNFEATURE: (id) =>
    `/api/news/${id}/unfeature`,

  ARCHIVE: (id) =>
    `/api/news/${id}/archive`,

  DELETE: (id) =>
    `/api/news/${id}`,
};

/**
 * ============================================================
 * FRONTEND ROUTES
 * ============================================================
 */

export const NEWS_ROUTES = {
  NEWS: "/news",

  ARTICLE: (slug) =>
    `/news/${slug}`,
};

/**
 * ============================================================
 * PUBLIC PAGE CONFIGURATION
 * ============================================================
 */

export const NEWS_PAGE_CONFIG = {
  title: "JVP Newsroom",

  subtitle: "News & Stories",

  description:
    "Stay informed with the latest news, announcements, programmes, opportunities and stories from Jumuiya ya Vijana wa Pwani.",

  featuredTitle: "Featured News",

  latestTitle: "Latest News",

  relatedTitle: "Related News",
};

/**
 * ============================================================
 * NEWS FILTERS
 * ============================================================
 */

export const NEWS_FILTERS = {
  ALL: "all",
};

export const NEWS_CATEGORY_FILTER_OPTIONS = [
  {
    value: NEWS_FILTERS.ALL,
    label: "All News",
  },
  ...NEWS_CATEGORY_OPTIONS,
];

/**
 * ============================================================
 * SORTING
 * ============================================================
 */

export const NEWS_SORT = {
  LATEST: "latest",
  OLDEST: "oldest",
  MOST_VIEWED: "most_viewed",
};

export const NEWS_SORT_OPTIONS = [
  {
    value: NEWS_SORT.LATEST,
    label: "Latest",
  },
  {
    value: NEWS_SORT.OLDEST,
    label: "Oldest",
  },
  {
    value: NEWS_SORT.MOST_VIEWED,
    label: "Most Viewed",
  },
];

/**
 * ============================================================
 * DEFAULT NEWS SETTINGS
 * ============================================================
 */

export const NEWS_DEFAULTS = {
  featuredLimit: 1,

  latestLimit: 8,

  relatedLimit: 4,

  page: 1,

  limit: 8,

  sort: NEWS_SORT.LATEST,
};

/**
 * ============================================================
 * SEARCH
 * ============================================================
 */

export const NEWS_SEARCH = {
  placeholder: "Search news...",

  minLength: 2,
};

/**
 * ============================================================
 * EMPTY STATES
 * ============================================================
 */

export const NEWS_EMPTY_STATES = {
  NO_ARTICLES:
    "No news articles available.",

  NO_RESULTS:
    "No news articles match your search.",

  NO_FEATURED:
    "No featured news available.",

  NO_RELATED:
    "No related news available.",
};

/**
 * ============================================================
 * EDITORIAL SETTINGS
 * ============================================================
 */

export const NEWS_EDITORIAL = {
  publicStatuses: [
    NEWS_STATUS.PUBLISHED,
  ],

  draftStatuses: [
    NEWS_STATUS.DRAFT,
  ],

  archivedStatuses: [
    NEWS_STATUS.ARCHIVED,
  ],
};

/**
 * ============================================================
 * CONTENT LIMITS
 * ============================================================
 */

export const NEWS_CONTENT_LIMITS = {
  title: {
    min: 5,
    max: 200,
  },

  excerpt: {
    min: 20,
    max: 500,
  },

  content: {
    min: 50,
  },

  tags: {
    max: 10,
  },
};

/**
 * ============================================================
 * SOCIAL SHARING
 * ============================================================
 */

export const NEWS_SHARE_OPTIONS = {
  FACEBOOK: "facebook",

  X: "x",

  WHATSAPP: "whatsapp",

  COPY_LINK: "copy_link",
};

/**
 * ============================================================
 * SEO DEFAULTS
 * ============================================================
 */

export const NEWS_SEO = {
  siteName:
    "Jumuiya ya Vijana wa Pwani",

  defaultTitle:
    "JVP Newsroom",

  defaultDescription:
    "Latest news, announcements, programmes, opportunities and stories from JVP.",

  defaultKeywords: [
    "JVP",
    "Jumuiya ya Vijana wa Pwani",
    "Coast Youth",
    "Youth Leadership",
    "Kenya",
  ],
};