import {
  createIntaSendCheckout,
  getIntaSendLocalPayment,
  processIntaSendWebhook,
  queryIntaSendPaymentStatus,
} from "../services/intasend.service.js";

/* ==========================================================
   RESPONSE HELPERS
========================================================== */

const sendSuccess = (
  res,
  {
    statusCode = 200,
    message,
    data = null,
  }
) => {
  return res
    .status(statusCode)
    .json({
      success: true,
      message,
      data,
    });
};

/* ==========================================================
   PAYMENT RESPONSE SANITIZER
========================================================== */

const serializePayment = (
  payment
) => {
  if (!payment) {
    return null;
  }

  const paymentObject =
    typeof payment.toJSON ===
    "function"
      ? payment.toJSON()
      : payment;

  return {
    _id:
      paymentObject._id,

    reference:
      paymentObject.reference,

    accountReference:
      paymentObject.accountReference,

    description:
      paymentObject.description,

    paymentFor:
      paymentObject.paymentFor,

    provider:
      paymentObject.provider,

    paymentMethod:
      paymentObject.paymentMethod,

    amount:
      paymentObject.amount,

    currency:
      paymentObject.currency,

    phoneNumber:
      paymentObject.phoneNumber,

    status:
      paymentObject.status,

    statusMessage:
      paymentObject.statusMessage,

    failureReason:
      paymentObject.failureReason,

    isVerified:
      paymentObject.isVerified,

    verificationMethod:
      paymentObject.verificationMethod,

    initiatedAt:
      paymentObject.initiatedAt,

    paidAt:
      paymentObject.paidAt,

    verifiedAt:
      paymentObject.verifiedAt,

    failedAt:
      paymentObject.failedAt,

    expiresAt:
      paymentObject.expiresAt,

    intasend: {
      invoiceId:
        paymentObject.intasend
          ?.invoiceId ||
        null,

      apiReference:
        paymentObject.intasend
          ?.apiReference ||
        null,

      checkoutUrl:
        paymentObject.intasend
          ?.checkoutUrl ||
        null,

      state:
        paymentObject.intasend
          ?.state ||
        null,

      provider:
        paymentObject.intasend
          ?.provider ||
        null,

      providerReference:
        paymentObject.intasend
          ?.providerReference ||
        null,

      charges:
        paymentObject.intasend
          ?.charges ??
        0,

      netAmount:
        paymentObject.intasend
          ?.netAmount ??
        null,
    },

    createdAt:
      paymentObject.createdAt,

    updatedAt:
      paymentObject.updatedAt,
  };
};

/* ==========================================================
   CREATE INTASEND CHECKOUT
========================================================== */

/**
 * POST /api/payments/intasend/checkout
 *
 * Protected route.
 *
 * Expected body:
 * {
 *   paymentId,
 *   paymentReference,
 *   method,
 *   redirectUrl,
 *   customer: {
 *     fullName,
 *     firstName,
 *     lastName,
 *     email,
 *     phoneNumber
 *   }
 * }
 */
export const createCheckout =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        paymentId = null,
        paymentReference = null,
        method = null,
        redirectUrl = null,
        customer = {},
      } = req.body || {};

      if (
        !paymentId &&
        !paymentReference
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Payment ID or payment reference is required.",
          });
      }

      const authenticatedCustomer =
        {
          ...customer,

          email:
            customer.email ||
            req.user?.email ||
            "",

          fullName:
            customer.fullName ||
            [
              req.member
                ?.firstName,
              req.member
                ?.middleName,
              req.member
                ?.lastName,
            ]
              .filter(Boolean)
              .join(" ") ||
            "",

          phoneNumber:
            customer.phoneNumber ||
            customer.phone ||
            req.member?.phone ||
            "",
        };

      const result =
        await createIntaSendCheckout(
          {
            paymentId,
            paymentReference,
            method,
            redirectUrl,

            customer:
              authenticatedCustomer,
          }
        );

      return sendSuccess(
        res,
        {
          statusCode: 201,

          message:
            result.reused
              ? "Existing IntaSend checkout retrieved successfully."
              : "IntaSend checkout created successfully.",

          data: {
            payment:
              serializePayment(
                result.payment
              ),

            checkoutUrl:
              result.checkoutUrl,

            invoiceId:
              result.invoiceId,

            reused:
              Boolean(
                result.reused
              ),
          },
        }
      );
    } catch (error) {
      return next(error);
    }
  };

/* ==========================================================
   QUERY INTASEND PAYMENT STATUS
========================================================== */

/**
 * POST /api/payments/intasend/status
 *
 * Protected route.
 *
 * Expected body:
 * {
 *   paymentId,
 *   paymentReference,
 *   invoiceId
 * }
 */
export const queryPaymentStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        paymentId = null,
        paymentReference = null,
        invoiceId = null,
      } = req.body || {};

      if (
        !paymentId &&
        !paymentReference &&
        !invoiceId
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Payment ID, payment reference or IntaSend invoice ID is required.",
          });
      }

      const result =
        await queryIntaSendPaymentStatus(
          {
            paymentId,
            paymentReference,
            invoiceId,
          }
        );

      return sendSuccess(
        res,
        {
          message:
            "IntaSend payment status retrieved successfully.",

          data: {
            payment:
              serializePayment(
                result.payment
              ),

            invoice:
              result.invoice ||
              null,
          },
        }
      );
    } catch (error) {
      return next(error);
    }
  };

/* ==========================================================
   GET LOCAL PAYMENT STATUS
========================================================== */

/**
 * GET /api/payments/intasend/:reference
 *
 * Protected route.
 *
 * The reference can be:
 * - local payment reference
 * - MongoDB payment ID
 * - IntaSend invoice ID when query parameter type=invoice
 */
export const getPaymentStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const reference =
        String(
          req.params
            ?.reference ||
            ""
        ).trim();

      if (!reference) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Payment reference is required.",
          });
      }

      const lookupType =
        String(
          req.query?.type ||
            "reference"
        )
          .trim()
          .toLowerCase();

      const lookup = {
        paymentId: null,
        paymentReference: null,
        invoiceId: null,
      };

      if (
        lookupType === "id"
      ) {
        lookup.paymentId =
          reference;
      } else if (
        lookupType ===
        "invoice"
      ) {
        lookup.invoiceId =
          reference;
      } else {
        lookup.paymentReference =
          reference;
      }

      const payment =
        await getIntaSendLocalPayment(
          lookup
        );

      return sendSuccess(
        res,
        {
          message:
            "Payment retrieved successfully.",

          data: {
            payment:
              serializePayment(
                payment
              ),
          },
        }
      );
    } catch (error) {
      return next(error);
    }
  };

/* ==========================================================
   INTASEND WEBHOOK
========================================================== */

/**
 * POST /api/payments/intasend/webhook
 *
 * Public route.
 *
 * This endpoint must not use normal JWT authentication.
 * IntaSend authenticates through the configured challenge.
 */
export const handleWebhook =
  async (
    req,
    res,
    next
  ) => {
    try {
      const payload =
        req.body || {};

      /*
       * Some setups may send the challenge
       * through a request header rather than
       * directly in the body.
       */
      const headerChallenge =
        req.headers[
          "x-intasend-challenge"
        ] ||
        req.headers[
          "intasend-challenge"
        ] ||
        null;

      const webhookPayload = {
        ...payload,

        challenge:
          payload.challenge ||
          headerChallenge ||
          "",
      };

      const result =
        await processIntaSendWebhook(
          webhookPayload
        );

      /*
       * Respond quickly so IntaSend does not
       * retry a webhook that was already handled.
       */
      return sendSuccess(
        res,
        {
          message:
            "IntaSend webhook processed successfully.",

          data: {
            received: true,

            reference:
              result.payment
                ?.reference ||
              null,

            state:
              result.state,

            previousStatus:
              result.previousStatus,

            currentStatus:
              result.payment
                ?.status ||
              null,

            becameSuccessful:
              Boolean(
                result.becameSuccessful
              ),
          },
        }
      );
    } catch (error) {
      return next(error);
    }
  };