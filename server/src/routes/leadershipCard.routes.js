import express from "express";

import leadershipCardController from "../controllers/leadershipCard.controller.js";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/* =====================================================
   PUBLIC ROUTES
===================================================== */

/**
 * Verify a leadership card
 */
router.get(
  "/verify/:code",
  leadershipCardController.verifyLeadershipCard
);

/**
 * View public leadership card
 */
router.get(
  "/public/:code",
  leadershipCardController.getPublicLeadershipCard
);

/* =====================================================
   AUTHENTICATED ROUTES
===================================================== */

/**
 * My leadership card
 */
router.get(
  "/me",
  auth,
  leadershipCardController.getMyLeadershipCard
);

/**
 * Leadership card by Leader ID
 */
router.get(
  "/:leaderId",
  auth,
  leadershipCardController.getLeadershipCard
);

/**
 * Regenerate leadership card
 * (Admin only)
 */
router.post(
  "/:leaderId/regenerate",
  auth,
  authorize("admin", "super_admin"),
  leadershipCardController.regenerateLeadershipCard
);

export default router;