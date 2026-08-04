import express from "express";

import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";

import {
  initiateMembershipPayment,
  initiateRenewalPayment,
  initiatePayment,
  mpesaCallback,
  queryPaymentStatus,
  retryPayment,
  getPaymentHistory,
  getPayment,
  getPaymentById,
  getAllPayments,
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
      message:
        "Payment routes are working.",
    });
  }
);

/* ==========================================================
   PUBLIC LEGACY CALLBACK
========================================================== */

/**
 * Historical direct M-Pesa callback.
 *
 * This remains public so any outstanding direct-Daraja
 * transactions can still send their callbacks.
 *
 * New IntaSend webhooks are handled separately at:
 *
 * POST /api/payments/intasend/webhook
 */

router.post(
  "/mpesa/callback",
  mpesaCallbackValidator,
  validate,
  mpesaCallback
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
 * The request may contain:
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
 * Retrieve all payments.
 *
 * GET /api/payments/admin/all
 */

router.get(
  "/admin/all",
  auth,
  getAllPayments
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