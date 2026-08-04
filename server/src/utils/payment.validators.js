import {
  body,
  param,
  query,
} from "express-validator";

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
  "summit_exhibitor",
  "donation",
];

const paymentMethods = [
  "mpesa",
  "card",
  "bank",
  "cash",
  "unknown",
];

const intasendMethods = [
  "M-PESA",
  "CARD-PAYMENT",
];

/* ==========================================================
   SHARED FIELD VALIDATORS
========================================================== */

const phoneNumberValidator =
  body("phoneNumber")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .matches(
      /^(\+254|254|0)(7\d{8}|1\d{8})$/
    )
    .withMessage(
      "Enter a valid Kenyan mobile phone number."
    );

const paymentMethodValidator =
  body("method")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .toUpperCase()
    .isIn(intasendMethods)
    .withMessage(
      "Payment method must be M-PESA or CARD-PAYMENT."
    );

const customerEmailValidator =
  body("email")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isEmail()
    .withMessage(
      "Enter a valid email address."
    )
    .normalizeEmail();

const customerNameValidator =
  body("fullName")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Full name must be between 2 and 150 characters."
    );

const redirectUrlValidator =
  body("redirectUrl")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .custom((value) => {
      let url;

      try {
        url = new URL(value);
      } catch {
        throw new Error(
          "Redirect URL must be a valid HTTP or HTTPS URL."
        );
      }

      if (
        ![
          "http:",
          "https:",
        ].includes(
          url.protocol
        )
      ) {
        throw new Error(
          "Redirect URL must use HTTP or HTTPS."
        );
      }

      const allowedOrigins = [
        "http://localhost:5173",
        "https://jvp-platform.vercel.app",
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (
        !allowedOrigins.includes(
          url.origin
        )
      ) {
        throw new Error(
          "Redirect URL is not allowed."
        );
      }

      return true;
    });

/* ==========================================================
   CHECKOUT VALIDATION
========================================================== */

const checkoutValidators = [
  phoneNumberValidator,
  paymentMethodValidator,
  customerEmailValidator,
  customerNameValidator,
  redirectUrlValidator,

  body().custom((value) => {
    const method =
      String(
        value?.method || ""
      )
        .trim()
        .toUpperCase();

    if (
      method === "M-PESA" &&
      !value?.phoneNumber
    ) {
      /*
       * The controller and service may obtain
       * the phone number from the member profile.
       * Therefore, do not reject an empty value here.
       */
      return true;
    }

    return true;
  }),
];

/* ==========================================================
   MEMBERSHIP PAYMENT
========================================================== */

export const membershipPaymentValidator = [
  ...checkoutValidators,
];

/* ==========================================================
   MEMBERSHIP RENEWAL
========================================================== */

export const renewalPaymentValidator = [
  ...checkoutValidators,
];

/* ==========================================================
   INITIATE EXISTING PAYMENT
========================================================== */

export const initiatePaymentValidator = [
  body("paymentId")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isMongoId()
    .withMessage(
      "Invalid payment ID."
    ),

  body("reference")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      min: 5,
      max: 100,
    })
    .withMessage(
      "Invalid payment reference."
    ),

  ...checkoutValidators,

  body().custom((value) => {
    if (
      !value?.paymentId &&
      !value?.reference
    ) {
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
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isMongoId()
    .withMessage(
      "Invalid payment ID."
    ),

  body("reference")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      min: 5,
      max: 100,
    })
    .withMessage(
      "Invalid payment reference."
    ),

  ...checkoutValidators,

  body().custom((value) => {
    if (
      !value?.paymentId &&
      !value?.reference
    ) {
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
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isMongoId()
    .withMessage(
      "Invalid payment ID."
    ),

  body("reference")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      min: 5,
      max: 100,
    })
    .withMessage(
      "Invalid payment reference."
    ),

  body("paymentReference")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      min: 5,
      max: 100,
    })
    .withMessage(
      "Invalid payment reference."
    ),

  body("invoiceId")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      min: 3,
      max: 150,
    })
    .withMessage(
      "Invalid IntaSend invoice ID."
    ),

  body().custom((value) => {
    if (
      !value?.paymentId &&
      !value?.reference &&
      !value?.paymentReference &&
      !value?.invoiceId
    ) {
      throw new Error(
        "Payment ID, payment reference or IntaSend invoice ID is required."
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
    .withMessage(
      "Payment ID is required."
    )
    .isMongoId()
    .withMessage(
      "Invalid payment ID."
    ),
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
    )
    .isLength({
      min: 5,
      max: 100,
    })
    .withMessage(
      "Invalid payment reference."
    ),
];

/* ==========================================================
   EVENT PAYMENT
========================================================== */

export const eventPaymentValidator = [
  body("eventId")
    .notEmpty()
    .withMessage(
      "Event ID is required."
    )
    .isMongoId()
    .withMessage(
      "Invalid event ID."
    ),

  ...checkoutValidators,
];

/* ==========================================================
   SUMMIT EXHIBITOR PAYMENT
========================================================== */

export const summitExhibitorPaymentValidator =
  [
    body("summitExhibitorId")
      .notEmpty()
      .withMessage(
        "Summit exhibitor registration ID is required."
      )
      .isMongoId()
      .withMessage(
        "Invalid summit exhibitor registration ID."
      ),

    ...checkoutValidators,
  ];

/* ==========================================================
   LEGACY M-PESA CALLBACK
========================================================== */

/**
 * Retained temporarily for historical direct-Daraja
 * transactions. New payments use the IntaSend webhook.
 */

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

  body(
    "Body.stkCallback.ResultCode"
  )
    .exists()
    .withMessage(
      "ResultCode is required."
    ),

  body(
    "Body.stkCallback.ResultDesc"
  )
    .exists()
    .withMessage(
      "ResultDesc is required."
    ),
];

/* ==========================================================
   ADMIN FILTERS
========================================================== */

export const paymentFilterValidator = [
  query("status")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isIn(paymentStatuses)
    .withMessage(
      "Invalid payment status."
    ),

  query("paymentFor")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isIn(paymentTypes)
    .withMessage(
      "Invalid payment type."
    ),

  query("paymentMethod")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isIn(paymentMethods)
    .withMessage(
      "Invalid payment method."
    ),

  query("provider")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isIn([
      "intasend",
      "mpesa_direct",
      "manual",
    ])
    .withMessage(
      "Invalid payment provider."
    ),

  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Page must be at least 1."
    ),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage(
      "Limit must be between 1 and 100."
    ),

  query("search")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Search text cannot exceed 100 characters."
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
    )
    .isLength({
      min: 5,
      max: 100,
    })
    .withMessage(
      "Invalid payment reference."
    ),

  body("reason")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      min: 3,
      max: 250,
    })
    .withMessage(
      "Reason must be between 3 and 250 characters."
    ),
];