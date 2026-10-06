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
} from "../controllers/leader.controller.js";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();


/* ============================================================
   PUBLIC LEADERSHIP DIRECTORY
============================================================ */

/*
 * Main public leadership directory.
 *
 * Returns active public leaders according to the service's
 * public visibility rules.
 */
router.get(
  "/",
  getPublicLeaders
);

router.get(
  "/public",
  getPublicLeaders
);


/* ============================================================
   PUBLIC GOVERNANCE STRUCTURES
============================================================ */

/*
 * Regional Cabinet
 */
router.get(
  "/regional-cabinet",
  getRegionalCabinet
);


/*
 * Regional Youth Assembly
 */
router.get(
  "/regional-youth-assembly",
  getRegionalYouthAssembly
);


/*
 * Council of Governors
 */
router.get(
  "/council-of-governors",
  getCouncilOfGovernors
);


/*
 * County Cabinet
 *
 * Optional query:
 * /county-cabinet?county=Kilifi
 */
router.get(
  "/county-cabinet",
  getCountyCabinet
);


/*
 * County Cabinet by county
 *
 * Example:
 * /county-cabinet/Kilifi
 */
router.get(
  "/county-cabinet/:county",
  getCountyCabinet
);


/*
 * County Youth Assembly
 *
 * Optional query:
 * /county-youth-assembly?county=Kilifi
 */
router.get(
  "/county-youth-assembly",
  getCountyYouthAssembly
);


/*
 * County Youth Assembly by county
 *
 * Example:
 * /county-youth-assembly/Kilifi
 */
router.get(
  "/county-youth-assembly/:county",
  getCountyYouthAssembly
);


/*
 * Patron
 */
router.get(
  "/patron",
  getPatron
);


/*
 * Complete leadership hierarchy
 */
router.get(
  "/hierarchy",
  getLeadershipHierarchy
);


/* ============================================================
   LEADERSHIP DASHBOARD
============================================================ */

router.get(
  "/dashboard",
  auth,
  getLeadershipMembers
);


/* ============================================================
   ADMIN — GENERAL LEADERSHIP
============================================================ */

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

/*
 * By structural scope.
 *
 * Examples:
 *
 * /admin/scope/regional_cabinet
 * /admin/scope/county_cabinet
 * /admin/scope/county_youth_assembly
 */
router.get(
  "/admin/scope/:scope",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByScope
);


/*
 * By report visibility.
 *
 * Examples:
 *
 * /admin/report-visibility/regional
 * /admin/report-visibility/county
 * /admin/report-visibility/ward
 */
router.get(
  "/admin/report-visibility/:reportVisibility",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByReportVisibility
);


/* ============================================================
   ADMIN — GEOGRAPHIC FILTERS
============================================================ */

/*
 * County
 */
router.get(
  "/admin/county/:county",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByCounty
);


/*
 * Constituency
 */
router.get(
  "/admin/county/:county/constituency/:constituency",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByConstituency
);


/*
 * Ward
 */
router.get(
  "/admin/county/:county/constituency/:constituency/ward/:ward",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByWard
);


/*
 * Position
 */
router.get(
  "/admin/position/:position",
  auth,
  authorize("admin", "super_admin"),
  getLeadersByPosition
);


/* ============================================================
   ADMIN — CREATE
============================================================ */

router.post(
  "/",
  auth,
  authorize("admin", "super_admin"),
  createLeader
);


/* ============================================================
   ADMIN — UPDATE
============================================================ */

router.put(
  "/:id",
  auth,
  authorize("admin", "super_admin"),
  updateLeader
);


/* ============================================================
   ADMIN — ACTIVATE
============================================================ */

router.patch(
  "/:id/activate",
  auth,
  authorize("admin", "super_admin"),
  activateLeader
);


/* ============================================================
   ADMIN — DEACTIVATE
============================================================ */

router.patch(
  "/:id/deactivate",
  auth,
  authorize("admin", "super_admin"),
  deactivateLeader
);


/* ============================================================
   ADMIN — DELETE
============================================================ */

router.delete(
  "/:id",
  auth,
  authorize("admin", "super_admin"),
  deleteLeader
);


/* ============================================================
   GET LEADER BY ID
   ------------------------------------------------------------
   KEEP THIS ROUTE LAST.
============================================================ */

router.get(
  "/:id",
  getLeader
);


export default router;