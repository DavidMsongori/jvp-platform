import express from "express";

import * as newsController from "../controllers/news.controller.js";

import auth from "../middleware/auth.js";
import { uploadNewsImage } from "../middleware/upload.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN / CMS ROUTES
|--------------------------------------------------------------------------
| These routes must come before /:slug so that "admin" is not
| interpreted as a news article slug.
|--------------------------------------------------------------------------
*/

// Get all news articles for CMS
router.get(
  "/admin/all",
  auth,
  newsController.getAdminNews
);

// Get news statistics
router.get(
  "/admin/statistics",
  auth,
  newsController.getNewsStatistics
);


/*
|--------------------------------------------------------------------------
| NEWS MEDIA ROUTES
|--------------------------------------------------------------------------
*/

// Upload News featured image
//
// Expected multipart/form-data field:
// featuredImage
//
// The existing uploadNewsImage middleware:
// - Uses memory storage
// - Accepts JPG, JPEG, PNG and WEBP
// - Maximum file size: 2 MB
//
router.post(
  "/upload-image",
  auth,
  uploadNewsImage,
  newsController.uploadNewsFeaturedImage
);


/*
|--------------------------------------------------------------------------
| PUBLIC NEWS ROUTES
|--------------------------------------------------------------------------
*/

// Get all published news
router.get(
  "/",
  newsController.getNews
);

// Get featured published news
router.get(
  "/featured",
  newsController.getFeaturedNews
);

// Get latest published news
router.get(
  "/latest",
  newsController.getLatestNews
);

// Get published news categories
router.get(
  "/categories",
  newsController.getNewsCategories
);

// Get published news by category
router.get(
  "/category/:category",
  newsController.getNewsByCategory
);

// Get related news for an article
router.get(
  "/:slug/related",
  newsController.getRelatedNews
);

// Get a single published article
router.get(
  "/:slug",
  newsController.getNewsArticle
);


/*
|--------------------------------------------------------------------------
| NEWS MANAGEMENT
|--------------------------------------------------------------------------
*/

// Create a news article
router.post(
  "/",
  auth,
  newsController.createNews
);

// Update a news article
router.put(
  "/:id",
  auth,
  newsController.updateNews
);

// Publish a news article
router.patch(
  "/:id/publish",
  auth,
  newsController.publishNews
);

// Unpublish a news article
router.patch(
  "/:id/unpublish",
  auth,
  newsController.unpublishNews
);

// Mark article as featured
router.patch(
  "/:id/feature",
  auth,
  newsController.featureNews
);

// Remove article from featured
router.patch(
  "/:id/unfeature",
  auth,
  newsController.unfeatureNews
);

// Archive article
router.patch(
  "/:id/archive",
  auth,
  newsController.archiveNews
);

// Delete article
router.delete(
  "/:id",
  auth,
  newsController.deleteNews
);

export default router;