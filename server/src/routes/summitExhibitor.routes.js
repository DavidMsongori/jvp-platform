import express from "express";

import {
  createSummitExhibitor,
  getSummitExhibitor,
  listSummitExhibitors,
  updateSummitExhibitorRecord,
} from "../controllers/summitExhibitor.controller.js";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/* ==========================================================
   PUBLIC ROUTES
========================================================== */

/*
 * Submit a new summit exhibitor application.
 *
 * POST /api/summit-exhibitors/register
 */
router.post(
  "/register",
  createSummitExhibitor
);

/* ==========================================================
   ADMIN ROUTES
========================================================== */

/*
 * All routes below require authentication.
 */
router.use(auth);

/*
 * Allow only administrators and authorized
 * event-management users to manage exhibitors.
 *
 * Adjust these role names if your User model
 * uses different values.
 */
router.use(
  authorize(
    "admin",
    "events",
    "super_admin"
  )
);

/*
 * List exhibitor registrations.
 *
 * GET /api/summit-exhibitors
 *
 * Supported query parameters:
 * page
 * limit
 * status
 * paymentStatus
 * packageId
 * search
 * summitEventId
 */
router.get(
  "/",
  listSummitExhibitors
);

/*
 * Get one exhibitor registration.
 *
 * GET /api/summit-exhibitors/:exhibitorId
 */
router.get(
  "/:exhibitorId",
  getSummitExhibitor
);

/*
 * Update status, payment status or admin notes.
 *
 * PATCH /api/summit-exhibitors/:exhibitorId
 */
router.patch(
  "/:exhibitorId",
  updateSummitExhibitorRecord
);

export default router;