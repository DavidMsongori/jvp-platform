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

router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Payment routes are working.",
  });
});

/* ==========================================================
   MEMBER PAYMENTS
========================================================== */

/**
 * Membership Registration Payment
 */

router.post(
  "/membership",

  (req, res, next) => {
    console.log("1. Membership route reached");
    next();
  },

  auth,

  (req, res, next) => {
    console.log("2. Authentication passed");
    console.log("User:", req.user);
    next();
  },

  membershipPaymentValidator,

  validate,

  (req, res, next) => {
    console.log("3. Validation passed");
    next();
  },

  initiateMembershipPayment
);

/**
 * Membership Renewal Payment
 */

router.post(
  "/renewal",
  auth,
  renewalPaymentValidator,
  validate,
  initiateRenewalPayment
);

/**
 * Re-initiate Existing Payment
 */

router.post(
  "/initiate",
  auth,
  initiatePaymentValidator,
  validate,
  initiatePayment
);

/**
 * Retry Failed / Expired Payment
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
 * Query Payment Status
 */

router.post(
  "/status",
  auth,
  paymentQueryValidator,
  validate,
  queryPaymentStatus
);

/**
 * M-Pesa Callback
 *
 * IMPORTANT:
 * This route MUST remain public.
 */

router.post(
  "/mpesa/callback",
  mpesaCallbackValidator,
  validate,
  mpesaCallback
);

/* ==========================================================
   MEMBER PAYMENTS
========================================================== */

/**
 * Payment History
 */

router.get(
  "/history",
  auth,
  getPaymentHistory
);

/**
 * Payment by Reference
 */

router.get(
  "/reference/:reference",
  auth,
  paymentReferenceValidator,
  validate,
  getPayment
);

/**
 * Payment by ID
 */

router.get(
  "/id/:paymentId",
  auth,
  paymentIdValidator,
  validate,
  getPaymentById
);

/* ==========================================================
   ADMIN
========================================================== */

/**
 * All Payments
 */

router.get(
  "/admin/all",
  auth,
  getAllPayments
);

/**
 * Payment Statistics
 */

router.get(
  "/admin/statistics",
  auth,
  getPaymentStatistics
);

/**
 * Mark Payment Failed
 */

router.patch(
  "/admin/fail/:reference",
  auth,
  paymentReferenceValidator,
  validate,
  markPaymentFailed
);

/**
 * Delete Pending Payment
 */

router.delete(
  "/admin/:reference",
  auth,
  paymentReferenceValidator,
  validate,
  deletePendingPayment
);

export default router;