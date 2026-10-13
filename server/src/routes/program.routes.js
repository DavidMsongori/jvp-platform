
import express from "express";

import * as programController from "../controllers/program.controller.js";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";

import { uploadFields } from "../middleware/upload.js";

const router = express.Router();

/* ===========================================================
   PUBLIC PROGRAM ROUTES
   These routes are accessible without authentication.
=========================================================== */

// Get all publicly available programs
router.get("/", programController.getAllPrograms);

// Get featured programs
router.get("/featured", programController.getFeaturedPrograms);

// Get upcoming programs
router.get("/upcoming", programController.getUpcomingPrograms);

// Get ongoing programs
router.get("/ongoing", programController.getOngoingPrograms);

// Get programs by category
router.get(
  "/category/:category",
  programController.getProgramsByCategory
);

// Get a program by slug
router.get(
  "/slug/:slug",
  programController.getProgramBySlug
);

// Get public activities belonging to a parent program
router.get(
  "/public/:parentProgramId/activities",
  programController.getPublicProgramActivities
);

/* ===========================================================
   AUTHENTICATION
   Routes below this point require authentication.
=========================================================== */

router.use(auth);

/* ===========================================================
   ADMINISTRATIVE PROGRAM ROUTES
=========================================================== */

// Program dashboard statistics
router.get(
  "/dashboard/statistics",
  authorize("admin", "super_admin"),
  programController.getProgramDashboardStatistics
);

// Get activities belonging to a parent program
router.get(
  "/:parentProgramId/activities",
  authorize("admin", "super_admin"),
  programController.getProgramActivities
);

/* ===========================================================
   IMAGE UPLOAD FIELDS
   Supports the existing "gallery" field and the frontend's
   "galleryImages" field for backward compatibility.
=========================================================== */

// Create a program, event, activity, or initiative
router.post(
  "/",
  authorize("admin", "super_admin"),
  uploadFields([
    { name: "coverImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  programController.createProgram
);

// Update a program and optionally upload images
router.patch(
  "/:id",
  authorize("admin", "super_admin"),
  uploadFields([
    { name: "coverImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  programController.updateProgram
);

/* ===========================================================
   PROGRAM STATUS MANAGEMENT
=========================================================== */

// Publish a program
router.patch(
  "/:id/publish",
  authorize("admin", "super_admin"),
  programController.publishProgram
);

// Unpublish a program
router.patch(
  "/:id/unpublish",
  authorize("admin", "super_admin"),
  programController.unpublishProgram
);

/* ===========================================================
   PROGRAM IMPACT
=========================================================== */

// Update program impact figures and outcomes
router.patch(
  "/:id/impact",
  authorize("admin", "super_admin"),
  programController.updateProgramImpact
);

/* ===========================================================
   DELETE PROGRAM
=========================================================== */

// Delete a program using the service's soft-delete logic
router.delete(
  "/:id",
  authorize("admin", "super_admin"),
  programController.deleteProgram
);

/* ===========================================================
   GET PROGRAM BY DATABASE ID
=========================================================== */

// Keep this route after the more specific GET routes
router.get(
  "/:id",
  authorize("admin", "super_admin"),
  programController.getProgramById
);

export default router;