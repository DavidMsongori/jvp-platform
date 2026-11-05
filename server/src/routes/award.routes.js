
import express from "express";

import * as awardController from "../controllers/award.controller.js";
import awardNominationLimiter from "../middleware/awardNominationLimiter.js";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/* ==========================================================
   PUBLIC — AWARD CATEGORIES
========================================================== */

router.get(
  "/",
  awardController.getAwardCategories
);


router.post(
  "/nominations",
  awardNominationLimiter,
  awardController.submitPublicAwardNomination
);

/* ==========================================================
   ADMIN / SECRETARIAT — CATEGORY MANAGEMENT
========================================================== */

router.get(
  "/admin/categories",
  auth,
  authorize("admin", "super_admin"),
  awardController.getAdminAwardCategories
);

router.patch(
  "/admin/categories/:categoryId/status",
  auth,
  authorize("admin", "super_admin"),
  awardController.updateAwardCategoryStatus
);

router.patch(
  "/admin/categories/:categoryId/nomination-settings",
  auth,
  authorize("admin", "super_admin"),
  awardController.updateAwardCategoryNominationSettingsController
);

router.post(
  "/admin/categories",
  auth,
  authorize("admin", "super_admin"),
  awardController.createAwardCategory
);


/* ADMIN / SECRETARIAT — NOMINATION REVIEW */

router.get(
  "/admin/nominations",
  auth,
  authorize("admin", "super_admin"),
  awardController.getAdminAwardNominations
);

router.patch(
  "/admin/nominations/:nominationId/review",
  auth,
  authorize("admin", "super_admin"),
  awardController.reviewAwardNomination
);


export default router;
