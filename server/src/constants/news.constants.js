/**
 * ============================================================
 * JVP NEWS CONSTANTS
 * ============================================================
 *
 * Centralized constants for the JVP News system.
 *
 * Used by:
 * - News Model
 * - News Service
 * - News Controller
 * - News Routes
 * - Public News Page
 * - Admin News CMS
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

/**
 * Human-readable category labels.
 */
export const NEWS_CATEGORY_LABELS = {
  [NEWS_CATEGORIES.ANNOUNCEMENTS]: "Announcements",
  [NEWS_CATEGORIES.OPPORTUNITIES]: "Opportunities",
  [NEWS_CATEGORIES.LEADERSHIP]: "Leadership",
  [NEWS_CATEGORIES.PROGRAMMES]: "Programmes",
  [NEWS_CATEGORIES.EVENTS]: "Events",
  [NEWS_CATEGORIES.PARTNERSHIPS]: "Partnerships",
  [NEWS_CATEGORIES.COMMUNITY]: "Community",
  [NEWS_CATEGORIES.STATEMENTS]: "Statements",
  [NEWS_CATEGORIES.SUCCESS_STORIES]: "Success Stories",
};

/**
 * Category options for forms and filters.
 */
export const NEWS_CATEGORY_OPTIONS = [
  {
    value: NEWS_CATEGORIES.ANNOUNCEMENTS,
    label: NEWS_CATEGORY_LABELS[NEWS_CATEGORIES.ANNOUNCEMENTS],
  },
  {
    value: NEWS_CATEGORIES.OPPORTUNITIES,
    label: NEWS_CATEGORY_LABELS[NEWS_CATEGORIES.OPPORTUNITIES],
  },
  {
    value: NEWS_CATEGORIES.LEADERSHIP,
    label: NEWS_CATEGORY_LABELS[NEWS_CATEGORIES.LEADERSHIP],
  },
  {
    value: NEWS_CATEGORIES.PROGRAMMES,
    label: NEWS_CATEGORY_LABELS[NEWS_CATEGORIES.PROGRAMMES],
  },
  {
    value: NEWS_CATEGORIES.EVENTS,
    label: NEWS_CATEGORY_LABELS[NEWS_CATEGORIES.EVENTS],
  },
  {
    value: NEWS_CATEGORIES.PARTNERSHIPS,
    label: NEWS_CATEGORY_LABELS[NEWS_CATEGORIES.PARTNERSHIPS],
  },
  {
    value: NEWS_CATEGORIES.COMMUNITY,
    label: NEWS_CATEGORY_LABELS[NEWS_CATEGORIES.COMMUNITY],
  },
  {
    value: NEWS_CATEGORIES.STATEMENTS,
    label: NEWS_CATEGORY_LABELS[NEWS_CATEGORIES.STATEMENTS],
  },
  {
    value: NEWS_CATEGORIES.SUCCESS_STORIES,
    label: NEWS_CATEGORY_LABELS[NEWS_CATEGORIES.SUCCESS_STORIES],
  },
];

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
  [NEWS_STATUS.DRAFT]: "Draft",
  [NEWS_STATUS.PUBLISHED]: "Published",
  [NEWS_STATUS.ARCHIVED]: "Archived",
};

export const NEWS_STATUS_OPTIONS = [
  {
    value: NEWS_STATUS.DRAFT,
    label: NEWS_STATUS_LABELS[NEWS_STATUS.DRAFT],
  },
  {
    value: NEWS_STATUS.PUBLISHED,
    label: NEWS_STATUS_LABELS[NEWS_STATUS.PUBLISHED],
  },
  {
    value: NEWS_STATUS.ARCHIVED,
    label: NEWS_STATUS_LABELS[NEWS_STATUS.ARCHIVED],
  },
];

/**
 * ============================================================
 * NEWS TYPES
 * ============================================================
 *
 * Defines the type of publication.
 */

export const NEWS_TYPES = {
  NEWS: "news",
  PRESS_RELEASE: "press_release",
  STATEMENT: "statement",
  NOTICE: "notice",
  REPORT: "report",
};

export const NEWS_TYPE_LABELS = {
  [NEWS_TYPES.NEWS]: "News",
  [NEWS_TYPES.PRESS_RELEASE]: "Press Release",
  [NEWS_TYPES.STATEMENT]: "Statement",
  [NEWS_TYPES.NOTICE]: "Notice",
  [NEWS_TYPES.REPORT]: "Report",
};

export const NEWS_TYPE_OPTIONS = [
  {
    value: NEWS_TYPES.NEWS,
    label: NEWS_TYPE_LABELS[NEWS_TYPES.NEWS],
  },
  {
    value: NEWS_TYPES.PRESS_RELEASE,
    label: NEWS_TYPE_LABELS[NEWS_TYPES.PRESS_RELEASE],
  },
  {
    value: NEWS_TYPES.STATEMENT,
    label: NEWS_TYPE_LABELS[NEWS_TYPES.STATEMENT],
  },
  {
    value: NEWS_TYPES.NOTICE,
    label: NEWS_TYPE_LABELS[NEWS_TYPES.NOTICE],
  },
  {
    value: NEWS_TYPES.REPORT,
    label: NEWS_TYPE_LABELS[NEWS_TYPES.REPORT],
  },
];

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
 * Configuration for News image uploads.
 *
 * Images are uploaded through Multer and then stored
 * in Cloudinary under the JVP News folder.
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
 * API ENDPOINTS
 * ============================================================
 *
 * Centralized News API endpoint definitions.
 */

export const NEWS_API = {
  BASE: "/api/news",

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
    "Stay informed with the latest news, announcements, opportunities, leadership updates, programmes and stories from Jumuiya ya Vijana wa Pwani.",

  featuredTitle: "Featured Stories",

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
  NO_ARTICLES: {
    title: "No News Available",

    message:
      "There are no published news articles at the moment.",
  },

  NO_RESULTS: {
    title: "No Results Found",

    message:
      "We couldn't find any news articles matching your search.",
  },

  NO_FEATURED: {
    title: "No Featured Stories",

    message:
      "Featured stories will appear here once they are published.",
  },

  NO_RELATED: {
    title: "No Related News",

    message:
      "There are no related stories available.",
  },
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

export const NEWS_SHARE_OPTIONS = [
  {
    id: "facebook",
    label: "Facebook",
  },
  {
    id: "x",
    label: "X",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
  },
  {
    id: "copy",
    label: "Copy Link",
  },
];

/**
 * ============================================================
 * SEO DEFAULTS
 * ============================================================
 */

export const NEWS_SEO = {
  siteName:
    "Jumuiya ya Vijana wa Pwani",

  defaultTitle:
    "JVP Newsroom | Jumuiya ya Vijana wa Pwani",

  defaultDescription:
    "Latest news, announcements, opportunities, programmes, leadership updates and stories from Jumuiya ya Vijana wa Pwani.",

  defaultKeywords: [
    "JVP",
    "Jumuiya ya Vijana wa Pwani",
    "JVP News",
    "Coastal Youth",
    "Kenya Youth",
    "Youth Leadership",
  ],
};