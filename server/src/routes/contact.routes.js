import express from "express";

import * as contactController from "../controllers/contact.controller.js";

import auth from "../middleware/auth.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PUBLIC CONTACT ROUTES
|--------------------------------------------------------------------------
*/

/**
 * Submit a contact enquiry.
 *
 * POST /api/contact
 */
router.post(
  "/",
  contactController.createContact
);

/*
|--------------------------------------------------------------------------
| ADMIN / CONTACT MANAGEMENT ROUTES
|--------------------------------------------------------------------------
*/

/**
 * Get contact statistics.
 *
 * GET /api/contact/admin/statistics
 */
router.get(
  "/admin/statistics",
  auth,
  contactController.getContactStatistics
);

/**
 * Get recent contact enquiries.
 *
 * GET /api/contact/admin/recent
 */
router.get(
  "/admin/recent",
  auth,
  contactController.getRecentContacts
);

/**
 * Get all contact enquiries.
 *
 * GET /api/contact/admin/all
 */
router.get(
  "/admin/all",
  auth,
  contactController.getAdminContacts
);

/*
|--------------------------------------------------------------------------
| CONTACT RECORD
|--------------------------------------------------------------------------
*/

/**
 * Get a single contact enquiry.
 *
 * GET /api/contact/:id
 */
router.get(
  "/:id",
  auth,
  contactController.getContactById
);

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

/**
 * Mark as read.
 *
 * PATCH /api/contact/:id/read
 */
router.patch(
  "/:id/read",
  auth,
  contactController.markContactAsRead
);

/**
 * Mark as in progress.
 *
 * PATCH /api/contact/:id/in-progress
 */
router.patch(
  "/:id/in-progress",
  auth,
  contactController.markContactInProgress
);

/**
 * Update status.
 *
 * PATCH /api/contact/:id/status
 */
router.patch(
  "/:id/status",
  auth,
  contactController.updateContactStatus
);

/*
|--------------------------------------------------------------------------
| PRIORITY
|--------------------------------------------------------------------------
*/

/**
 * Update priority.
 *
 * PATCH /api/contact/:id/priority
 */
router.patch(
  "/:id/priority",
  auth,
  contactController.updateContactPriority
);

/*
|--------------------------------------------------------------------------
| ASSIGNMENT
|--------------------------------------------------------------------------
*/

/**
 * Assign enquiry to a user.
 *
 * PATCH /api/contact/:id/assign
 */
router.patch(
  "/:id/assign",
  auth,
  contactController.assignContact
);

/**
 * Remove assignment.
 *
 * PATCH /api/contact/:id/unassign
 */
router.patch(
  "/:id/unassign",
  auth,
  contactController.unassignContact
);

/*
|--------------------------------------------------------------------------
| RESPONSE
|--------------------------------------------------------------------------
*/

/**
 * Respond to an enquiry.
 *
 * POST /api/contact/:id/respond
 */
router.post(
  "/:id/respond",
  auth,
  contactController.respondToContact
);

/*
|--------------------------------------------------------------------------
| INTERNAL NOTES
|--------------------------------------------------------------------------
*/

/**
 * Update internal notes.
 *
 * PATCH /api/contact/:id/notes
 */
router.patch(
  "/:id/notes",
  auth,
  contactController.updateContactNotes
);

/*
|--------------------------------------------------------------------------
| ARCHIVE / RESTORE
|--------------------------------------------------------------------------
*/

/**
 * Archive enquiry.
 *
 * PATCH /api/contact/:id/archive
 */
router.patch(
  "/:id/archive",
  auth,
  contactController.archiveContact
);

/**
 * Restore archived enquiry.
 *
 * PATCH /api/contact/:id/restore
 */
router.patch(
  "/:id/restore",
  auth,
  contactController.restoreContact
);

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

/**
 * Permanently delete enquiry.
 *
 * DELETE /api/contact/:id
 */
router.delete(
  "/:id",
  auth,
  contactController.deleteContact
);

export default router;