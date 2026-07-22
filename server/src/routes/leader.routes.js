import express from "express";

import {
  createLeader,
  getLeaders,
  getPublicLeaders,
  getLeader,
  getLeadershipMembers,
  updateLeader,
  activateLeader,
  deactivateLeader,
  deleteLeader,
  getLeaderStatistics,
} from "../controllers/leader.controller.js";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/* ===========================================================
   PUBLIC ROUTES
=========================================================== */

router.get("/", getPublicLeaders);

router.get("/public", getPublicLeaders);

/* ===========================================================
   LEADERSHIP DASHBOARD
=========================================================== */

router.get(
  "/dashboard",
  auth,
  getLeadershipMembers
);

/* ===========================================================
   ADMIN ROUTES
=========================================================== */

router.get(
  "/admin/all",
  auth,
  authorize("admin", "super_admin"),
  getLeaders
);

router.get(
  "/statistics",
  auth,
  authorize("admin", "super_admin"),
  getLeaderStatistics
);

router.post(
  "/",
  auth,
  authorize("admin", "super_admin"),
  createLeader
);

router.put(
  "/:id",
  auth,
  authorize("admin", "super_admin"),
  updateLeader
);

router.patch(
  "/:id/activate",
  auth,
  authorize("admin", "super_admin"),
  activateLeader
);

router.patch(
  "/:id/deactivate",
  auth,
  authorize("admin", "super_admin"),
  deactivateLeader
);

router.delete(
  "/:id",
  auth,
  authorize("admin", "super_admin"),
  deleteLeader
);

/* ===========================================================
   PARAMETERIZED ROUTES (KEEP LAST)
=========================================================== */

router.get("/:id", getLeader);

export default router;