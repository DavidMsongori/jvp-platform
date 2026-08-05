import express from "express";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";

import {
  uploadSummitPosterPhoto,
} from "../middleware/upload.js";

import {
  createPosterRequest,
  submitPayment,
  checkPosterStatus,
  getPosterRequests,
  getPosterRequest,
  getPosterStatistics,
  confirmPayment,
  rejectPayment,
  startPosterGeneration,
  finishPosterGeneration,
  updatePosterNotes,
  downloadPoster,
} from "../controllers/summitPoster.controller.js";

const router =
  express.Router();

/* ==========================================================
   ACCESS ROLES
========================================================== */

const posterAdminRoles = [
  "admin",
  "events",
  "finance",
  "super_admin",
];

/* ==========================================================
   ROUTE TEST
========================================================== */

router.get(
  "/test",
  (req, res) => {
    return res
      .status(200)
      .json({
        success: true,

        message:
          "Summit poster routes are working.",
      });
  }
);

/* ==========================================================
   PUBLIC ROUTES
========================================================== */

/**
 * Create poster request.
 *
 * POST /api/summit/posters
 *
 * Content-Type:
 * multipart/form-data
 *
 * Fields:
 * - fullName
 * - email
 * - phoneNumber
 * - county
 * - socialHandle
 * - consentAccepted
 * - photo
 */

router.post(
  "/",
  uploadSummitPosterPhoto,
  createPosterRequest
);

/**
 * Submit M-Pesa transaction code.
 *
 * POST /api/summit/posters/payment
 */

router.post(
  "/payment",
  submitPayment
);

/**
 * Check poster request status.
 *
 * POST /api/summit/posters/status
 */

router.post(
  "/status",
  checkPosterStatus
);

/**
 * Download approved poster.
 *
 * GET /api/summit/posters/download/:downloadToken
 */

router.get(
  "/download/:downloadToken",
  downloadPoster
);

/* ==========================================================
   ADMIN AUTHORIZATION
========================================================== */

router.use(
  "/admin",
  auth,
  authorize(
    ...posterAdminRoles
  )
);

/* ==========================================================
   ADMIN ROUTES
========================================================== */

/**
 * Poster statistics.
 *
 * GET /api/summit/posters/admin/statistics
 */

router.get(
  "/admin/statistics",
  getPosterStatistics
);

/**
 * List poster requests.
 *
 * GET /api/summit/posters/admin
 */

router.get(
  "/admin",
  getPosterRequests
);

/**
 * Get one poster request.
 *
 * GET /api/summit/posters/admin/:posterId
 */

router.get(
  "/admin/:posterId",
  getPosterRequest
);

/**
 * Confirm Till payment.
 *
 * PATCH
 * /api/summit/posters/admin/:posterId/confirm-payment
 */

router.patch(
  "/admin/:posterId/confirm-payment",
  confirmPayment
);

/**
 * Reject payment details.
 *
 * PATCH
 * /api/summit/posters/admin/:posterId/reject-payment
 */

router.patch(
  "/admin/:posterId/reject-payment",
  rejectPayment
);

/**
 * Mark poster as generating.
 *
 * PATCH
 * /api/summit/posters/admin/:posterId/generating
 */

router.post(
  "/admin/:posterId/generate",
  startPosterGeneration
);

/**
 * Complete poster generation.
 *
 * PATCH
 * /api/summit/posters/admin/:posterId/complete
 */

router.patch(
  "/admin/:posterId/complete",
  finishPosterGeneration
);

/**
 * Update administrative notes.
 *
 * PATCH
 * /api/summit/posters/admin/:posterId/notes
 */

router.patch(
  "/admin/:posterId/notes",
  updatePosterNotes
);

export default router;