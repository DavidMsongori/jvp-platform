// src/controllers/intasend.controller.js

import {
  createIntaSendCheckout,
  getIntaSendLocalPayment,
  processIntaSendWebhook,
  queryIntaSendPaymentStatus,
} from "../services/intasend.service.js";

import {
  processSuccessfulPayment,
} from "../services/payment.service.js";

/* ==========================================================
   RESPONSE HELPERS
========================================================== */

const sendSuccess = (
  res,
  { statusCode = 200, message, data = null } = {}
) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

/* ==========================================================
   PAYMENT SANITIZER
========================================================== */

const serializePayment = (payment) => {
  if (!payment) {
    return null;
  }

  const p =
    typeof payment.toJSON === "function"
      ? payment.toJSON()
      : payment;

  return {
    _id: p._id,
    reference: p.reference,
    accountReference: p.accountReference,
    description: p.description,
    paymentFor: p.paymentFor,
    provider: p.provider,
    paymentMethod: p.paymentMethod,
    amount: p.amount,
    currency: p.currency,
    phoneNumber: p.phoneNumber,
    status: p.status,
    statusMessage: p.statusMessage,
    failureReason: p.failureReason,
    isVerified: p.isVerified,
    verificationMethod: p.verificationMethod,
    initiatedAt: p.initiatedAt,
    paidAt: p.paidAt,
    verifiedAt: p.verifiedAt,
    failedAt: p.failedAt,
    expiresAt: p.expiresAt,
    intasend: {
      invoiceId: p.intasend?.invoiceId || null,
      apiReference: p.intasend?.apiReference || null,
      checkoutUrl: p.intasend?.checkoutUrl || null,
      state: p.intasend?.state || null,
      provider: p.intasend?.provider || null,
      providerReference:
        p.intasend?.providerReference || null,
      charges: p.intasend?.charges ?? 0,
      netAmount: p.intasend?.netAmount ?? null,
    },
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};

/* ==========================================================
   POST /api/payments/intasend/checkout
========================================================== */

export const createCheckout = async (
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

    if (!paymentId && !paymentReference) {
      return res.status(400).json({
        success: false,
        message:
          "Payment ID or payment reference is required.",
      });
    }

    const authenticatedCustomer = {
      ...customer,

      email:
        customer.email || req.user?.email || "",

      fullName:
        customer.fullName ||
        [
          req.member?.firstName,
          req.member?.middleName,
          req.member?.lastName,
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

    const result = await createIntaSendCheckout({
      paymentId,
      paymentReference,
      method,
      redirectUrl,
      customer: authenticatedCustomer,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: result.reused
        ? "Existing IntaSend checkout retrieved successfully."
        : "IntaSend checkout created successfully.",
      data: {
        payment: serializePayment(result.payment),
        checkoutUrl: result.checkoutUrl,
        invoiceId: result.invoiceId,
        reused: Boolean(result.reused),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/* ==========================================================
   POST /api/payments/intasend/status
========================================================== */

export const queryPaymentStatus = async (
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
      return res.status(400).json({
        success: false,
        message:
          "Payment ID, payment reference or IntaSend invoice ID is required.",
      });
    }

    const result =
      await queryIntaSendPaymentStatus({
        paymentId,
        paymentReference,
        invoiceId,
      });

    if (
      result.payment?.status === "successful" &&
      result.payment?.isVerified &&
      !result.payment?.membershipProcessed
    ) {
      try {
        await processSuccessfulPayment(
          result.payment
        );
      } catch (processingError) {
        console.error(
          "Post-payment processing failed (status query):",
          processingError.message
        );
      }
    }

    return sendSuccess(res, {
      message:
        "IntaSend payment status retrieved successfully.",
      data: {
        payment: serializePayment(
          result.payment
        ),
        invoice: result.invoice || null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/* ==========================================================
   GET /api/payments/intasend/:reference
========================================================== */

export const getPaymentStatus = async (
  req,
  res,
  next
) => {
  try {
    const reference = String(
      req.params?.reference || ""
    ).trim();

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required.",
      });
    }

    const lookupType = String(
      req.query?.type || "reference"
    )
      .trim()
      .toLowerCase();

    const lookup = {
      paymentId: null,
      paymentReference: null,
      invoiceId: null,
    };

    if (lookupType === "id") {
      lookup.paymentId = reference;
    } else if (lookupType === "invoice") {
      lookup.invoiceId = reference;
    } else {
      lookup.paymentReference = reference;
    }

    const payment =
      await getIntaSendLocalPayment(lookup);

    return sendSuccess(res, {
      message: "Payment retrieved successfully.",
      data: {
        payment: serializePayment(payment),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/* ==========================================================
   POST /api/payments/intasend/webhook (PUBLIC)
========================================================== */

export const handleWebhook = async (
  req,
  res,
  next
) => {
  try {
    const payload = req.body || {};

    const headerChallenge =
      req.headers["x-intasend-challenge"] ||
      req.headers["intasend-challenge"] ||
      null;

    const webhookPayload = {
      ...payload,
      challenge:
        payload.challenge || headerChallenge || "",
    };

    const result =
      await processIntaSendWebhook(
        webhookPayload
      );

    if (
      result.payment?.status === "successful" &&
      result.payment?.isVerified
    ) {
      try {
        await processSuccessfulPayment(
          result.payment
        );
      } catch (processingError) {
        console.error(
          "Post-payment processing failed (webhook):",
          processingError.message
        );

        if (
          ["membership", "renewal"].includes(
            result.payment.paymentFor
          )
        ) {
          result.payment.membershipProcessingError =
            processingError.message;

          await result.payment.save();
        }
      }
    }

    return sendSuccess(res, {
      message:
        "IntaSend webhook processed successfully.",
      data: {
        received: true,
        reference:
          result.payment?.reference || null,
        state: result.state,
        previousStatus: result.previousStatus,
        currentStatus:
          result.payment?.status || null,
        becameSuccessful: Boolean(
          result.becameSuccessful
        ),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/* ==========================================================
   EXPORTS
========================================================== */

export default {
  createCheckout,
  queryPaymentStatus,
  getPaymentStatus,
  handleWebhook,
};