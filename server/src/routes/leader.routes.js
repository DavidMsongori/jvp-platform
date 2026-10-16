
import express from "express";

import {
  createLeader,
  getLeaders,
  getPublicLeaders,
  getLeader,
  getLeadershipMembers,
  updateLeader,
  activateLeader,
  activateMany,
  deactivateLeader,
  deleteLeader,
  getLeaderStatistics,
  getRegionalCabinet,
  getRegionalYouthAssembly,
  getCouncilOfGovernors,
  getCountyCabinet,
  getCountyYouthAssembly,
  getPatron,
  getLeadershipHierarchy,
  getVacantPositions,
  getLeadersByScope,
  getLeadersByReportVisibility,
  getLeadersByCounty,
  getLeadersByConstituency,
  getLeadersByWard,
  getLeadersByPosition,
  getCabinetSecretaryByPortfolio,
} from "../controllers/leader.controller.js";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/* ============================================================
   PUBLIC LEADERSHIP DIRECTORY
============================================================ */

// Main public leadership page.
// GET /api/leaders
router.get("/", getPublicLeaders);

// Explicit public directory endpoint.
// GET /api/leaders/public
router.get("/public", getPublicLeaders);

/* ============================================================
   PUBLIC GOVERNANCE STRUCTURES
============================================================ */

// Regional Cabinet.
router.get("/regional-cabinet", getRegionalCabinet);

// Regional Youth Assembly.
router.get(
  "/regional-youth-assembly",
  getRegionalYouthAssembly
);

// Council of Governors.
router.get(
  "/council-of-governors",
  getCouncilOfGovernors
);

// County Cabinet.
router.get("/county-cabinet", getCountyCabinet);
router.get("/county-cabinet/:county", getCountyCabinet);

// County Youth Assembly.
router.get(
  "/county-youth-assembly",
  getCountyYouthAssembly
);

router.get(
  "/county-youth-assembly/:county",
  getCountyYouthAssembly
);

// Patron.
router.get("/patron", getPatron);

// Complete leadership hierarchy.
router.get("/hierarchy", getLeadershipHierarchy);

// Cabinet Secretary profile lookup by portfolio.
router.get(
  "/cabinet-secretaries/:portfolioKey",
  getCabinetSecretaryByPortfolio
);

/* ============================================================
   LEADERSHIP DASHBOARD — AUTHENTICATED
============================================================ */

// GET /api/leaders/dashboard
router.get(
  "/dashboard",
  auth,
  getLeadershipMembers
);

/* ============================================================
   ADMIN — GENERAL LEADERSHIP
============================================================ */

// Get all leadership records for administration.
// GET /api/leaders/admin/all
router.get(
  "/admin/all",
  auth,
  authorize("admin", "super_admin"),
  getLeaders
);

// Leadership statistics.
router.get(
  "/statistics",
  auth,
  authorize("admin", "super_admin"),
  getLeaderStatistics
);

/* ============================================================
   ADMIN — VACANCIES
============================================================ */

router.get(
  "/admin/vacancies",
  auth,
  authorize("admin", "super_admin"),
  getVacantPositions
);

/* ============================================================
   ADMIN — STRUCTURAL FILTERS
============================================================ */

// Examples:
// /api/leaders/admin/scope/regional_cabinet
// /api/leaders/admin/scope/county_cabinet
// /api/leaders/admin/scope/county_youth_assembly

router.get(
  "/admin/scope/:scope",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByScope
);

// Examples:
// /api/leaders/admin/report-visibility/regional
// /api/leaders/admin/report-visibility/county
// /api/leaders/admin/report-visibility/ward

router.get(
  "/admin/report-visibility/:reportVisibility",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByReportVisibility
);

/* ============================================================
   ADMIN — GEOGRAPHIC FILTERS
============================================================ */

// County.
router.get(
  "/admin/county/:county",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByCounty
);

// Constituency.
router.get(
  "/admin/county/:county/constituency/:constituency",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByConstituency
);

// Ward.
router.get(
  "/admin/county/:county/constituency/:constituency/ward/:ward",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByWard
);

// Position.
router.get(
  "/admin/position/:position",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByPosition
);

/* ============================================================
   ADMIN — CREATE LEADER
============================================================ */

router.post(
  "/",
  auth,
  authorize("admin", "super_admin"),
  createLeader
);

/* ============================================================
   ADMIN — BULK ACTIVATION
============================================================ */

// Request body:
// {
//   "ids": ["leaderId1", "leaderId2"]
// }

router.patch(
  "/bulk/activate",
  auth,
  authorize("admin", "super_admin"),
  activateMany
);

/* ============================================================
   ADMIN — UPDATE LEADER
============================================================ */

router.put(
  "/:id",
  auth,
  authorize("admin", "super_admin"),
  updateLeader
);

/* ============================================================
   ADMIN — ACTIVATE LEADER
============================================================ */

router.patch(
  "/:id/activate",
  auth,
  authorize("admin", "super_admin"),
  activateLeader
);

/* ============================================================
   ADMIN — DEACTIVATE LEADER
============================================================ */

router.patch(
  "/:id/deactivate",
  auth,
  authorize("admin", "super_admin"),
  deactivateLeader
);

/* ============================================================
   ADMIN — DELETE LEADER
============================================================ */

router.delete(
  "/:id",
  auth,
  authorize("admin", "super_admin"),
  deleteLeader
);

/* ============================================================
   PUBLIC — INDIVIDUAL LEADER PROFILE
============================================================ */

// Keep this route after all named GET routes.
// Used when a visitor taps a leader card.
//
// Example:
// GET /api/leaders/LEADER_ID

router.get("/:id", getLeader);

export default router;