import express from "express";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";

import {
  initiateMembershipPayment,
  initiateManualMembershipPayment,
  initiateRenewalPayment,
  initiatePayment,
  mpesaCallback,
  confirmMpesaPayment,
  approveManualMpesaPayment,
  queryPaymentStatus,
  retryPayment,
  getPaymentHistory,
  getPayment,
  getPaymentById,
  getAllPayments,
  getManualMpesaQueue,
  getPaymentStatistics,
  markPaymentFailed,
  deletePendingPayment,
} from "../controllers/payment.controller.js";

import {
  membershipPaymentValidator,
  renewalPaymentValidator,
  initiatePaymentValidator,
  paymentReferenceValidator,
  paymentIdValidator,
  retryPaymentValidator,
  paymentQueryValidator,
  mpesaCallbackValidator,
  manualMpesaConfirmationValidator,
} from "../utils/payment.validators.js";

const router = express.Router();

/* ==========================================================
   HEALTH TEST
========================================================== */

router.get(
  "/test",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Payment routes are working.",
    });
  }
);

/* ==========================================================
   PUBLIC LEGACY M-PESA CALLBACK
========================================================== */

/**
 * Historical direct M-Pesa callback.
 *
 * This endpoint remains public because M-Pesa/Daraja
 * callbacks are sent by the payment provider and do not
 * carry the member's normal authentication token.
 *
 * POST /api/payments/mpesa/callback
 */

router.post(
  "/mpesa/callback",
  mpesaCallbackValidator,
  validate,
  mpesaCallback
);

/* ==========================================================
   MANUAL M-PESA CONFIRMATION
========================================================== */

/**
 * Payment recovery endpoint.
 *
 * Used when:
 *
 * 1. The member completed an M-Pesa payment.
 * 2. The browser was closed.
 * 3. The IntaSend redirect was missed.
 * 4. The frontend did not receive the final payment state.
 *
 * The member submits:
 *
 * {
 *   reference: "JVP-XXXXXXXX",
 *   confirmationCode: "ABC123XYZ"
 * }
 *
 * The payment service then queries IntaSend before marking
 * the payment as successful.
 *
 * POST /api/payments/mpesa/confirm
 */

router.post(
  "/mpesa/confirm",
  auth,
  manualMpesaConfirmationValidator,
  validate,
  confirmMpesaPayment
);

/* ==========================================================
   MEMBERSHIP PAYMENTS
========================================================== */

/**
 * Create an IntaSend checkout for membership registration.
 *
 * POST /api/payments/membership
 */

router.post(
  "/membership",
  auth,
  membershipPaymentValidator,
  validate,
  initiateMembershipPayment
);

/**
 * Create a manual M-Pesa Till payment for membership.
 *
 * This does NOT use IntaSend.
 *
 * POST /api/payments/membership/manual
 */

router.post(
  "/membership/manual",
  auth,
  initiateManualMembershipPayment
);

/**
 * Create an IntaSend checkout for membership renewal.
 *
 * POST /api/payments/renewal
 */

router.post(
  "/renewal",
  auth,
  renewalPaymentValidator,
  validate,
  initiateRenewalPayment
);

/* ==========================================================
   EXISTING PAYMENTS
========================================================== */

/**
 * Initiate an existing pending payment through IntaSend.
 *
 * POST /api/payments/initiate
 */

router.post(
  "/initiate",
  auth,
  initiatePaymentValidator,
  validate,
  initiatePayment
);

/**
 * Retry an incomplete payment by generating a new
 * IntaSend checkout.
 *
 * POST /api/payments/retry
 */

router.post(
  "/retry",
  auth,
  retryPaymentValidator,
  validate,
  retryPayment
);

/* ==========================================================
   PAYMENT STATUS
========================================================== */

/**
 * Query the latest payment status from IntaSend.
 *
 * Supported identifiers:
 *
 * - paymentId
 * - reference
 * - paymentReference
 * - invoiceId
 *
 * POST /api/payments/status
 */

router.post(
  "/status",
  auth,
  paymentQueryValidator,
  validate,
  queryPaymentStatus
);

/* ==========================================================
   MEMBER PAYMENT RECORDS
========================================================== */

/**
 * Logged-in member payment history.
 *
 * GET /api/payments/history
 */

router.get(
  "/history",
  auth,
  getPaymentHistory
);

/**
 * Retrieve a payment using its local reference.
 *
 * GET /api/payments/reference/:reference
 */

router.get(
  "/reference/:reference",
  auth,
  paymentReferenceValidator,
  validate,
  getPayment
);

/**
 * Retrieve a payment using its MongoDB ID.
 *
 * GET /api/payments/id/:paymentId
 */

router.get(
  "/id/:paymentId",
  auth,
  paymentIdValidator,
  validate,
  getPaymentById
);

/* ==========================================================
   ADMINISTRATION
========================================================== */

/**
 * Approve a manually submitted M-Pesa payment.
 *
 * Only admin, finance and super_admin users are allowed
 * to approve manual M-Pesa payments.
 *
 * PATCH /api/payments/admin/approve/:reference
 */

router.patch(
  "/admin/approve/:reference",
  auth,
  authorize(
    "admin",
    "finance",
    "super_admin"
  ),
  paymentReferenceValidator,
  validate,
  approveManualMpesaPayment
);

/**
 * Retrieve all payments.
 *
 * GET /api/payments/admin/all
 */

router.get(
  "/admin/all",
  auth,
  getAllPayments
);

router.get(
  "/admin/manual-mpesa",
  auth,
  authorize(
    "admin",
    "finance",
    "super_admin"
  ),
  getManualMpesaQueue
);

/**
 * Retrieve payment statistics.
 *
 * GET /api/payments/admin/statistics
 */

router.get(
  "/admin/statistics",
  auth,
  getPaymentStatistics
);

/**
 * Manually mark an incomplete payment as failed.
 *
 * PATCH /api/payments/admin/fail/:reference
 */

router.patch(
  "/admin/fail/:reference",
  auth,
  paymentReferenceValidator,
  validate,
  markPaymentFailed
);

/**
 * Delete an incomplete payment record.
 *
 * DELETE /api/payments/admin/:reference
 */

router.delete(
  "/admin/:reference",
  auth,
  paymentReferenceValidator,
  validate,
  deletePendingPayment
);

export default router;