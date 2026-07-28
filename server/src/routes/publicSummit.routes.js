import express from "express";

import {
  getPublicSummit,
  registerSummitParticipant,

  getSummitRegistrationByTicket,
  getSummitRegistrationByEmail,
  getSummitRegistrationByPhone,

  verifyPublicSummitTicket,
  downloadSummitTicket,
} from "../controllers/publicSummit.controller.js";

import {
  validateSummitRegistration,
  validateSummitEventId,
  validateSummitTicketNumber,
  validateSummitTicketVerification,
  validateSummitSlug,

  validateSummitRegistrationEmailLookup,
  validateSummitRegistrationPhoneLookup,
} from "../validators/summitValidation.js";

import validate from "../middleware/validate.js";

const router = express.Router();

/* ==========================================
   PUBLIC SUMMIT INFORMATION
========================================== */

/**
 * @route   GET /api/summit/public/events/slug/:slug
 * @desc    Get a public summit event by slug
 * @access  Public
 */
router.get(
  "/events/slug/:slug",
  validateSummitSlug,
 validate,
  getPublicSummit
);

/**
 * @route   GET /api/summit/public/events/:summitEventId
 * @desc    Get a public summit event by ID
 * @access  Public
 */
router.get(
  "/events/:summitEventId",
  validateSummitEventId,
 validate,
  getPublicSummit
);

/* ==========================================
   SUMMIT REGISTRATION
========================================== */

/**
 * @route   POST /api/summit/public/register
 * @desc    Register a participant for the summit
 * @access  Public
 */
router.post(
  "/register",
  validateSummitRegistration,
 validate,
  registerSummitParticipant
);

/* ==========================================
   REGISTRATION LOOKUP
========================================== */

/**
 * @route   GET /api/summit/public/registrations/ticket/:ticketNumber
 * @desc    Get registration details by ticket number
 * @access  Public
 */
router.get(
  "/registrations/ticket/:ticketNumber",
  validateSummitTicketNumber,
 validate,
  getSummitRegistrationByTicket
);

/**
 * @route   GET /api/summit/public/registrations/email/:email
 * @desc    Get registration details by email
 * @access  Public
 *
 * Required query:
 * ?nationalIdLastFour=1234
 */
router.get(
  "/registrations/email/:email",
  validateSummitRegistrationEmailLookup,
  validate,
  getSummitRegistrationByEmail
);

/**
 * @route   GET /api/summit/public/registrations/phone/:phone
 * @desc    Get registration details by phone
 * @access  Public
 *
 * Required query:
 * ?nationalIdLastFour=1234
 */
router.get(
  "/registrations/phone/:phone",
  validateSummitRegistrationPhoneLookup,
  validate,
  getSummitRegistrationByPhone
);

/* ==========================================
   TICKET VERIFICATION
========================================== */

/**
 * @route   GET /api/summit/public/tickets/:ticketNumber/verify
 * @desc    Verify a summit ticket
 * @access  Public
 *
 * Optional query:
 * ?code=verificationCode
 */
router.get(
  "/tickets/:ticketNumber/verify",
  validateSummitTicketVerification,
 validate,
  verifyPublicSummitTicket
);

/* ==========================================
   TICKET DOWNLOAD
========================================== */

/**
 * @route   GET /api/summit/public/tickets/:ticketNumber/download
 * @desc    Download summit ticket PDF
 * @access  Public
 */
router.get(
  "/tickets/:ticketNumber/download",
  validateSummitTicketNumber,
 validate,
  downloadSummitTicket
);

export default router;