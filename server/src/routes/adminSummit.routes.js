import express from "express";

import {
  getAdminSummitDashboard,
  listSummitRegistrations,
  getAdminSummitRegistration,
  updateSummitRegistrationStatus,
  updateSummitTicketStatus,
  checkInSummitParticipant,
  sendRegistrationTicketEmail,
  resendRegistrationTicketEmail,
  sendRegistrationLogisticsEmail,
  generateRegistrationTicket,
  regenerateSummitTicket,
} from "../controllers/adminSummit.controller.js";

import {
  validateSummitEventId,
  validateSummitRegistrationId,
  validateSummitRegistrationListQuery,
  validateUpdateSummitRegistrationStatus,
  validateUpdateSummitTicketStatus,
  validateSummitCheckIn,
  validateResendSummitTicketEmail,
  validateSummitLogisticsEmail,
} from "../validators/summitValidation.js";

import validate from "../middleware/validate.js";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/* ==========================================
   PROTECT ALL ADMIN SUMMIT ROUTES
========================================== */

router.use(auth);

router.use(
  authorize(
    "admin",
    "events",
    "super_admin"
  )
);

/* ==========================================
   ADMIN SUMMIT DASHBOARD
========================================== */

/**
 * @route   GET /api/summit/admin/events/:summitEventId/dashboard
 * @desc    Get summit dashboard statistics
 * @access  Admin, Events, Finance, Super Admin
 */
router.get(
  "/events/:summitEventId/dashboard",
  validateSummitEventId,
 validate,
  getAdminSummitDashboard
);

/* ==========================================
   SUMMIT REGISTRATION LIST
========================================== */

/**
 * @route   GET /api/summit/admin/events/:summitEventId/registrations
 * @desc    List summit registrations
 * @access  Admin, Events, Finance, Super Admin
 *
 * Supported query parameters:
 * page
 * limit
 * county
 * countyCode
 * participantType
 * status
 * ticketStatus
 * checkedIn
 * search
 * sortBy
 * sortOrder
 */
router.get(
  "/events/:summitEventId/registrations",
  validateSummitEventId,
  validateSummitRegistrationListQuery,
  validate,
  listSummitRegistrations
);

/* ==========================================
   GET ONE REGISTRATION
========================================== */

/**
 * @route   GET /api/summit/admin/registrations/:registrationId
 * @desc    Get one summit registration
 * @access  Admin, Events, Finance, Super Admin
 */
router.get(
  "/registrations/:registrationId",
  validateSummitRegistrationId,
  validate,
  getAdminSummitRegistration
);

/* ==========================================
   UPDATE REGISTRATION STATUS
========================================== */

/**
 * @route   PATCH /api/summit/admin/registrations/:registrationId/status
 * @desc    Update registration status
 * @access  Admin, Events, Super Admin
 */
router.patch(
  "/registrations/:registrationId/status",
 authorize(
  "admin",
  "events",
  "super_admin"
),
  validateUpdateSummitRegistrationStatus,
 validate,
  updateSummitRegistrationStatus
);

/* ==========================================
   UPDATE TICKET STATUS
========================================== */

/**
 * @route   PATCH /api/summit/admin/registrations/:registrationId/ticket-status
 * @desc    Update summit ticket status
 * @access  Admin, Events, Super Admin
 */
router.patch(
  "/registrations/:registrationId/ticket-status",
  authorize(
  "admin",
  "events",
  "super_admin"
),
  validateUpdateSummitTicketStatus,
 validate,
  updateSummitTicketStatus
);

/* ==========================================
   PARTICIPANT CHECK-IN
========================================== */

/**
 * @route   POST /api/summit/admin/check-in
 * @desc    Check in a summit participant
 * @access  Admin, Events, Super Admin
 */
router.post(
  "/check-in",
 authorize(
  "admin",
  "events",
  "super_admin"
),
  validateSummitCheckIn,
 validate,
  checkInSummitParticipant
);

/* ==========================================
   GENERATE TICKET
========================================== */

/**
 * @route   POST /api/summit/admin/registrations/:registrationId/ticket
 * @desc    Ensure a summit ticket has been generated
 * @access  Admin, Events, Super Admin
 */
router.post(
  "/registrations/:registrationId/ticket",
  authorize(
  "admin",
  "events",
  "super_admin"
),
  validateSummitRegistrationId,
 validate,
  generateRegistrationTicket
);

/* ==========================================
   REGENERATE TICKET
========================================== */

/**
 * @route   POST /api/summit/admin/registrations/:registrationId/ticket/regenerate
 * @desc    Regenerate summit ticket PDF
 * @access  Admin, Events, Super Admin
 */
router.post(
  "/registrations/:registrationId/ticket/regenerate",
 authorize(
  "admin",
  "events",
  "super_admin"
),
  validateSummitRegistrationId,
 validate,
  regenerateSummitTicket
);

/* ==========================================
   SEND FIRST TICKET EMAIL
========================================== */

/**
 * @route   POST /api/summit/admin/registrations/:registrationId/email/ticket
 * @desc    Send the ticket confirmation email
 * @access  Admin, Events, Super Admin
 */
router.post(
  "/registrations/:registrationId/email/ticket",
 authorize(
  "admin",
  "events",
  "super_admin"
),
  validateSummitRegistrationId,
 validate,
  sendRegistrationTicketEmail
);

/* ==========================================
   RESEND TICKET EMAIL
========================================== */

/**
 * @route   POST /api/summit/admin/registrations/:registrationId/email/ticket/resend
 * @desc    Resend summit ticket email
 * @access  Admin, Events, Super Admin
 */
router.post(
  "/registrations/:registrationId/email/ticket/resend",
 authorize(
  "admin",
  "events",
  "super_admin"
),
  validateResendSummitTicketEmail,
validate,
  resendRegistrationTicketEmail
);

/* ==========================================
   SEND LOGISTICS EMAIL
========================================== */

/**
 * @route   POST /api/summit/admin/registrations/:registrationId/email/logistics
 * @desc    Send a logistics email to one participant
 * @access  Admin, Events, Super Admin
 */
router.post(
  "/registrations/:registrationId/email/logistics",
 authorize(
  "admin",
  "events",
  "super_admin"
),
  validateSummitLogisticsEmail,
validate, 
  sendRegistrationLogisticsEmail
);

export default router;