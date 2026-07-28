import { body, param } from "express-validator";

/* ==========================================================
   CONSTANTS
========================================================== */

const paymentStatuses = [
  "pending",
  "processing",
  "successful",
  "failed",
  "cancelled",
  "expired",
  "refunded",
];

const paymentTypes = [
  "membership",
  "renewal",
  "event",
  "summit",
  "donation",
];

const paymentMethods = [
  "mpesa",
];

/* ==========================================================
   PHONE NUMBER
========================================================== */

const phoneNumberValidator = body("phoneNumber")
  .optional({ nullable: true })
  .trim()
  .matches(/^(\+254|254|0)?(7\d{8}|1\d{8})$/)
  .withMessage(
    "Enter a valid Kenyan Safaricom phone number."
  );

/* ==========================================================
   MEMBERSHIP PAYMENT
========================================================== */

export const membershipPaymentValidator = [
  phoneNumberValidator,
];

/* ==========================================================
   MEMBERSHIP RENEWAL
========================================================== */

export const renewalPaymentValidator = [
  phoneNumberValidator,
];

/* ==========================================================
   INITIATE PAYMENT
========================================================== */

export const initiatePaymentValidator = [
  body("paymentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid payment ID."),

  body("reference")
    .optional()
    .trim()
    .isLength({
      min: 5,
      max: 60,
    })
    .withMessage(
      "Invalid payment reference."
    ),

  phoneNumberValidator,

  body().custom((value) => {
    if (!value.paymentId && !value.reference) {
      throw new Error(
        "Payment ID or payment reference is required."
      );
    }

    return true;
  }),
];

/* ==========================================================
   RETRY PAYMENT
========================================================== */

export const retryPaymentValidator = [
  body("paymentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid payment ID."),

  body("reference")
    .optional()
    .trim()
    .isLength({
      min: 5,
      max: 60,
    })
    .withMessage(
      "Invalid payment reference."
    ),

  phoneNumberValidator,

  body().custom((value) => {
    if (!value.paymentId && !value.reference) {
      throw new Error(
        "Payment ID or payment reference is required."
      );
    }

    return true;
  }),
];

/* ==========================================================
   QUERY PAYMENT STATUS
========================================================== */

export const paymentQueryValidator = [
  body("paymentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid payment ID."),

  body("reference")
    .optional()
    .trim()
    .isLength({
      min: 5,
      max: 60,
    })
    .withMessage(
      "Invalid payment reference."
    ),

  body().custom((value) => {
    if (!value.paymentId && !value.reference) {
      throw new Error(
        "Payment ID or payment reference is required."
      );
    }

    return true;
  }),
];

/* ==========================================================
   PAYMENT ID
========================================================== */

export const paymentIdValidator = [
  param("paymentId")
    .notEmpty()
    .withMessage("Payment ID is required.")
    .isMongoId()
    .withMessage("Invalid payment ID."),
];

/* ==========================================================
   PAYMENT REFERENCE
========================================================== */

export const paymentReferenceValidator = [
  param("reference")
    .trim()
    .notEmpty()
    .withMessage(
      "Payment reference is required."
    ),
];

/* ==========================================================
   EVENT PAYMENT
========================================================== */

export const eventPaymentValidator = [
  body("eventId")
    .notEmpty()
    .withMessage("Event ID is required.")
    .isMongoId()
    .withMessage("Invalid Event ID."),

  phoneNumberValidator,
];

/* ==========================================================
   M-PESA CALLBACK
========================================================== */

export const mpesaCallbackValidator = [
  body("Body")
    .exists()
    .withMessage(
      "Callback body is required."
    ),

  body("Body.stkCallback")
    .exists()
    .withMessage(
      "STK callback is required."
    ),

  body(
    "Body.stkCallback.CheckoutRequestID"
  )
    .exists()
    .withMessage(
      "CheckoutRequestID is required."
    ),

  body("Body.stkCallback.ResultCode")
    .exists()
    .withMessage(
      "ResultCode is required."
    ),

  body("Body.stkCallback.ResultDesc")
    .exists()
    .withMessage(
      "ResultDesc is required."
    ),
];

/* ==========================================================
   ADMIN FILTERS
========================================================== */

export const paymentFilterValidator = [
  body("status")
    .optional()
    .isIn(paymentStatuses)
    .withMessage(
      "Invalid payment status."
    ),

  body("paymentFor")
    .optional()
    .isIn(paymentTypes)
    .withMessage(
      "Invalid payment type."
    ),

  body("paymentMethod")
    .optional()
    .isIn(paymentMethods)
    .withMessage(
      "Invalid payment method."
    ),
];

/* ==========================================================
   ADMIN MARK FAILED
========================================================== */

export const markPaymentFailedValidator = [
  param("reference")
    .trim()
    .notEmpty()
    .withMessage(
      "Payment reference is required."
    ),

  body("reason")
    .optional()
    .trim()
    .isLength({
      min: 3,
      max: 250,
    })
    .withMessage(
      "Reason must be between 3 and 250 characters."
    ),
];