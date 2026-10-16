
import express from "express";

import * as officeAssignmentController from "../controllers/officeAssignment.controller.js";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/* ===========================================================
   PUBLIC ROUTES
   Public leadership pages can display supporting officers.
=========================================================== */

// GET /api/office-assignments/public/position/:position
router.get(
  "/public/position/:position",
  officeAssignmentController.getPublicOfficeTeamsByPosition
);

// GET /api/office-assignments/public/office-holder/:officeHolderId
router.get(
  "/public/office-holder/:officeHolderId",
  officeAssignmentController.getPublicOfficeTeam
);

/* ===========================================================
   AUTHENTICATION
=========================================================== */

router.use(auth);

/* ===========================================================
   OFFICE ASSIGNMENT MANAGEMENT PERMISSIONS
=========================================================== */

const manageOfficeAssignments = authorize(
  "super_admin",
  "admin",
  "president",
  "leadership"
);

/* ===========================================================
   OFFICE ASSIGNMENT STATISTICS
=========================================================== */

// GET /api/office-assignments/statistics
router.get(
  "/statistics",
  manageOfficeAssignments,
  officeAssignmentController.getOfficeAssignmentStatistics
);

/* ===========================================================
   ASSIGNMENTS BY PRINCIPAL OFFICE-HOLDER
=========================================================== */

// GET /api/office-assignments/office-holder/:officeHolderId
router.get(
  "/office-holder/:officeHolderId",
  manageOfficeAssignments,
  officeAssignmentController.getAssignmentsForOfficeHolder
);

/* ===========================================================
   LIST ALL OFFICE ASSIGNMENTS
=========================================================== */

// GET /api/office-assignments
router.get(
  "/",
  manageOfficeAssignments,
  officeAssignmentController.getAllOfficeAssignments
);

/* ===========================================================
   CREATE OFFICE ASSIGNMENT
=========================================================== */

// POST /api/office-assignments
router.post(
  "/",
  manageOfficeAssignments,
  officeAssignmentController.createOfficeAssignment
);

/* ===========================================================
   UPDATE OFFICE ASSIGNMENT
=========================================================== */

// PATCH /api/office-assignments/:assignmentId
router.patch(
  "/:assignmentId",
  manageOfficeAssignments,
  officeAssignmentController.updateOfficeAssignment
);

/* ===========================================================
   ACTIVATE OFFICE ASSIGNMENT
=========================================================== */

// PATCH /api/office-assignments/:assignmentId/activate
router.patch(
  "/:assignmentId/activate",
  manageOfficeAssignments,
  officeAssignmentController.activateOfficeAssignment
);

/* ===========================================================
   DEACTIVATE OFFICE ASSIGNMENT
=========================================================== */

// PATCH /api/office-assignments/:assignmentId/deactivate
router.patch(
  "/:assignmentId/deactivate",
  manageOfficeAssignments,
  officeAssignmentController.deactivateOfficeAssignment
);

/* ===========================================================
   COMPLETE OFFICE ASSIGNMENT
=========================================================== */

// PATCH /api/office-assignments/:assignmentId/complete
router.patch(
  "/:assignmentId/complete",
  manageOfficeAssignments,
  officeAssignmentController.completeOfficeAssignment
);

/* ===========================================================
   DELETE OFFICE ASSIGNMENT
=========================================================== */

// DELETE /api/office-assignments/:assignmentId
router.delete(
  "/:assignmentId",
  manageOfficeAssignments,
  officeAssignmentController.deleteOfficeAssignment
);

/* ===========================================================
   OFFICE ASSIGNMENT DETAILS
   KEEP THIS LAST
=========================================================== */

// GET /api/office-assignments/:assignmentId
router.get(
  "/:assignmentId",
  manageOfficeAssignments,
  officeAssignmentController.getOfficeAssignmentById
);

export default router;
