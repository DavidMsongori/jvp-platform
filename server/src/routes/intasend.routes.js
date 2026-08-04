import express from "express";

import {
  createCheckout,
  getPaymentStatus,
  handleWebhook,
  queryPaymentStatus,
} from "../controllers/intasend.controller.js";

import auth from "../middleware/auth.js";

const router = express.Router();

/* ==========================================================
   PUBLIC WEBHOOK
========================================================== */

/**
 * IntaSend sends payment status notifications here.
 *
 * POST /api/payments/intasend/webhook
 *
 * This route must remain public because IntaSend does not
 * have a JVP JWT access token. The webhook challenge is
 * validated inside the IntaSend service.
 */
router.post(
  "/webhook",
  handleWebhook
);

/* ==========================================================
   AUTHENTICATED PAYMENT ROUTES
========================================================== */

/**
 * All routes below require a valid JVP access token.
 */
router.use(auth);

/* ==========================================================
   CREATE CHECKOUT
========================================================== */

/**
 * Create or retrieve an IntaSend checkout.
 *
 * POST /api/payments/intasend/checkout
 *
 * Request body:
 * {
 *   "paymentId": "...",
 *   "paymentReference": "...",
 *   "method": "M-PESA",
 *   "redirectUrl": "...",
 *   "customer": {
 *     "fullName": "...",
 *     "email": "...",
 *     "phoneNumber": "254712345678"
 *   }
 * }
 */
router.post(
  "/checkout",
  createCheckout
);

/* ==========================================================
   QUERY PROVIDER STATUS
========================================================== */

/**
 * Query the latest payment status directly from IntaSend.
 *
 * POST /api/payments/intasend/status
 *
 * Request body may contain:
 * {
 *   "paymentId": "...",
 *   "paymentReference": "...",
 *   "invoiceId": "..."
 * }
 */
router.post(
  "/status",
  queryPaymentStatus
);

/* ==========================================================
   GET LOCAL PAYMENT STATUS
========================================================== */

/**
 * Retrieve a payment from the local MongoDB database.
 *
 * GET /api/payments/intasend/:reference
 *
 * By default, :reference is treated as the local payment
 * reference.
 *
 * Examples:
 *
 * Local reference:
 * GET /api/payments/intasend/JVP-PAY-ABC123
 *
 * MongoDB payment ID:
 * GET /api/payments/intasend/64...?type=id
 *
 * IntaSend invoice ID:
 * GET /api/payments/intasend/INV-...?type=invoice
 */
router.get(
  "/:reference",
  getPaymentStatus
);

export default router;