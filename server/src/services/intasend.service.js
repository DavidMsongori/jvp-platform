import crypto from "crypto";

import IntaSend from "intasend-node";

import Payment from "../models/Payment.js";

/* ==========================================================
   CONSTANTS
========================================================== */

const INTASEND_STATES =
  Object.freeze({
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETE: "COMPLETE",
    FAILED: "FAILED",
  });

const INTASEND_METHODS =
  Object.freeze({
    MPESA: "M-PESA",
    CARD: "CARD-PAYMENT",
    ALL: null,
  });

const ALLOWED_METHODS =
  new Set([
    INTASEND_METHODS.MPESA,
    INTASEND_METHODS.CARD,
    INTASEND_METHODS.ALL,
  ]);

/* ==========================================================
   SERVICE ERROR
========================================================== */

export class IntaSendServiceError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "INTASEND_ERROR",
    details = null
  ) {
    super(message);

    this.name =
      "IntaSendServiceError";

    this.statusCode =
      statusCode;

    this.code =
      code;

    this.details =
      details;

    Error.captureStackTrace?.(
      this,
      IntaSendServiceError
    );
  }
}

/* ==========================================================
   ENVIRONMENT HELPERS
========================================================== */

const getRequiredEnvironmentValue = (
  name
) => {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new IntaSendServiceError(
      `${name} is not configured.`,
      500,
      "INTASEND_CONFIGURATION_ERROR"
    );
  }

  return value;
};

const isTestMode = () => {
  const value =
    String(
      process.env
        .INTASEND_TEST_MODE ??
        "true"
    )
      .trim()
      .toLowerCase();

  return [
    "true",
    "1",
    "yes",
  ].includes(value);
};

const getFrontendUrl = () => {
  return String(
    process.env.FRONTEND_URL ||
      "http://localhost:5173"
  ).replace(/\/+$/, "");
};

/* ==========================================================
   INTASEND CLIENT
========================================================== */

let cachedClient = null;

const getIntaSendClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const publishableKey =
    getRequiredEnvironmentValue(
      "INTASEND_PUBLISHABLE_KEY"
    );

  const secretKey =
    getRequiredEnvironmentValue(
      "INTASEND_SECRET_KEY"
    );

  cachedClient =
    new IntaSend(
      publishableKey,
      secretKey,
      isTestMode()
    );

  return cachedClient;
};

/* ==========================================================
   NORMALIZATION
========================================================== */

const normalizeText = (
  value = ""
) => {
  return String(value)
    .trim()
    .replace(/\s+/g, " ");
};

const normalizeEmail = (
  value = ""
) => {
  return String(value)
    .trim()
    .toLowerCase();
};

const normalizePhone = (
  value = ""
) => {
  if (!value) {
    return "";
  }

  const phone =
    String(value)
      .trim()
      .replace(/[\s()-]/g, "");

  if (
    /^254[17]\d{8}$/.test(
      phone
    )
  ) {
    return phone;
  }

  if (
    /^\+254[17]\d{8}$/.test(
      phone
    )
  ) {
    return phone.slice(1);
  }

  if (
    /^0[17]\d{8}$/.test(
      phone
    )
  ) {
    return `254${phone.slice(
      1
    )}`;
  }

  throw new IntaSendServiceError(
    "Enter a valid Kenyan mobile phone number.",
    400,
    "INVALID_PHONE_NUMBER"
  );
};

const normalizeState = (
  value
) => {
  const state =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    Object.values(
      INTASEND_STATES
    ).includes(state)
  ) {
    return state;
  }

  return null;
};

const normalizeMethod = (
  method
) => {
  if (
    method === undefined ||
    method === null ||
    method === ""
  ) {
    return null;
  }

  const normalizedMethod =
    String(method)
      .trim()
      .toUpperCase();

  if (
    !ALLOWED_METHODS.has(
      normalizedMethod
    )
  ) {
    throw new IntaSendServiceError(
      "The selected payment method is not supported.",
      400,
      "INVALID_PAYMENT_METHOD"
    );
  }

  return normalizedMethod;
};

const normalizeAmount = (
  value
) => {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < 1
  ) {
    throw new IntaSendServiceError(
      "The payment amount must be at least KES 1.",
      400,
      "INVALID_PAYMENT_AMOUNT"
    );
  }

  return amount.toFixed(2);
};

/* ==========================================================
   CUSTOMER HELPERS
========================================================== */

const splitCustomerName = (
  fullName = ""
) => {
  const parts =
    normalizeText(fullName)
      .split(" ")
      .filter(Boolean);

  if (!parts.length) {
    return {
      firstName: "JVP",
      lastName: "Member",
    };
  }

  return {
    firstName:
      parts[0],

    lastName:
      parts.slice(1).join(" ") ||
      "Customer",
  };
};

const resolveCustomerDetails = ({
  customer = {},
  payment,
}) => {
  const fullName =
    customer.fullName ||
    customer.name ||
    payment?.metadata
      ?.customerName ||
    "";

  const {
    firstName,
    lastName,
  } = splitCustomerName(
    fullName
  );

  const email =
    normalizeEmail(
      customer.email ||
        payment?.metadata
          ?.customerEmail ||
        ""
    );

  const rawPhone =
    customer.phoneNumber ||
    customer.phone ||
    payment?.phoneNumber ||
    payment?.metadata
      ?.customerPhone ||
    "";

  const phoneNumber =
    rawPhone
      ? normalizePhone(
          rawPhone
        )
      : "";

  return {
    firstName:
      normalizeText(
        customer.firstName ||
          firstName
      ),

    lastName:
      normalizeText(
        customer.lastName ||
          lastName
      ),

    email,
    phoneNumber,
  };
};

/* ==========================================================
   RESPONSE HELPERS
========================================================== */

const extractInvoice = (
  response
) => {
  return (
    response?.invoice ||
    response?.data?.invoice ||
    response?.data ||
    response ||
    {}
  );
};

const extractInvoiceId = (
  response
) => {
  const invoice =
    extractInvoice(response);

  return (
    invoice?.invoice_id ||
    invoice?.id ||
    response?.invoice_id ||
    response?.id ||
    null
  );
};

const extractCheckoutUrl = (
  response
) => {
  return (
    response?.url ||
    response?.checkout_url ||
    response?.payment_url ||
    response?.data?.url ||
    response?.data
      ?.checkout_url ||
    null
  );
};

const extractProviderReference = (
  payload
) => {
  return (
    payload?.provider_reference ||
    payload?.mpesa_reference ||
    payload?.transaction_id ||
    payload?.reference ||
    null
  );
};

const extractErrorDetails = (
  error
) => {
  return (
    error?.response?.data ||
    error?.response ||
    error?.data ||
    error?.message ||
    null
  );
};

const createGatewayError = (
  error,
  fallbackMessage
) => {
  const details =
    extractErrorDetails(error);

  const gatewayMessage =
    details?.message ||
    details?.detail ||
    details?.error ||
    error?.message ||
    fallbackMessage;

  return new IntaSendServiceError(
    gatewayMessage,
    502,
    "INTASEND_GATEWAY_ERROR",
    details
  );
};

/* ==========================================================
   PAYMENT LOOKUP
========================================================== */

const findPayment = async ({
  paymentId,
  paymentReference,
  invoiceId,
}) => {
  let payment = null;

  if (paymentId) {
    payment =
      await Payment.findById(
        paymentId
      );
  }

  if (
    !payment &&
    paymentReference
  ) {
    payment =
      await Payment.findOne({
        reference:
          String(
            paymentReference
          )
            .trim()
            .toUpperCase(),
      });
  }

  if (
    !payment &&
    invoiceId
  ) {
    payment =
      await Payment
        .findByIntaSendInvoiceId(
          invoiceId
        );
  }

  if (!payment) {
    throw new IntaSendServiceError(
      "The payment record could not be found.",
      404,
      "PAYMENT_NOT_FOUND"
    );
  }

  return payment;
};

/* ==========================================================
   CHECKOUT PAYLOAD
========================================================== */

const buildCheckoutPayload = ({
  payment,
  customer,
  redirectUrl,
  method,
}) => {
  const customerDetails =
    resolveCustomerDetails({
      customer,
      payment,
    });

  const normalizedMethod =
    normalizeMethod(method);

  if (
    normalizedMethod ===
      INTASEND_METHODS.MPESA &&
    !customerDetails.phoneNumber
  ) {
    throw new IntaSendServiceError(
      "A phone number is required for M-Pesa payments.",
      400,
      "PHONE_NUMBER_REQUIRED"
    );
  }

  const payload = {
    first_name:
      customerDetails.firstName,

    last_name:
      customerDetails.lastName,

    email:
      customerDetails.email ||
      undefined,

    phone_number:
      customerDetails.phoneNumber ||
      undefined,

    country: "KE",

    amount:
      normalizeAmount(
        payment.amount
      ),

    currency:
      payment.currency ||
      "KES",

    api_ref:
      payment.reference,

    comment:
      payment.description,

    host:
      getFrontendUrl(),

    redirect_url:
      redirectUrl ||
      `${getFrontendUrl()}/payment/success?reference=${encodeURIComponent(
        payment.reference
      )}`,

    channel: "WEBSITE",

    method:
      normalizedMethod ||
      undefined,

    mobile_tarrif:
      process.env
        .INTASEND_MOBILE_TARIFF ||
      "BUSINESS-PAYS",

    card_tarrif:
      process.env
        .INTASEND_CARD_TARIFF ||
      "BUSINESS-PAYS",
  };

  const walletId =
    process.env
      .INTASEND_WALLET_ID
      ?.trim();

  if (walletId) {
    payload.wallet_id =
      walletId;
  }

  return Object.fromEntries(
    Object.entries(
      payload
    ).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );
};

/* ==========================================================
   MAP PROVIDER TO PAYMENT METHOD
========================================================== */

const resolvePaymentMethod = (
  provider
) => {
  const normalizedProvider =
    String(provider || "")
      .trim()
      .toUpperCase();

  if (
    normalizedProvider.includes(
      "M-PESA"
    ) ||
    normalizedProvider.includes(
      "MPESA"
    )
  ) {
    return "mpesa";
  }

  if (
    normalizedProvider.includes(
      "CARD"
    ) ||
    normalizedProvider.includes(
      "APPLE"
    ) ||
    normalizedProvider.includes(
      "GOOGLE"
    )
  ) {
    return "card";
  }

  if (
    normalizedProvider.includes(
      "BANK"
    ) ||
    normalizedProvider.includes(
      "PESALINK"
    )
  ) {
    return "bank";
  }

  return "unknown";
};

/* ==========================================================
   VALIDATE WEBHOOK CHALLENGE
========================================================== */

export const validateIntaSendWebhookChallenge =
  (receivedChallenge) => {
    const expectedChallenge =
      getRequiredEnvironmentValue(
        "INTASEND_WEBHOOK_CHALLENGE"
      );

    const received =
      String(
        receivedChallenge || ""
      );

    const expectedBuffer =
      Buffer.from(
        expectedChallenge
      );

    const receivedBuffer =
      Buffer.from(received);

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );
  };

/* ==========================================================
   APPLY INTASEND STATE
========================================================== */

const applyIntaSendState =
  async ({
    payment,
    invoice,
    rawPayload,
    verificationMethod,
  }) => {
    const state =
      normalizeState(
        invoice?.state
      );

    if (!state) {
      throw new IntaSendServiceError(
        "IntaSend returned an unsupported payment state.",
        502,
        "INVALID_INTASEND_STATE",
        rawPayload
      );
    }

    const invoiceId =
      invoice?.invoice_id ||
      invoice?.id ||
      payment.intasend
        ?.invoiceId ||
      null;

    const provider =
      invoice?.provider ||
      null;

    payment.paymentMethod =
      resolvePaymentMethod(
        provider
      );

    if (
      invoice?.account &&
      !payment.phoneNumber &&
      /^\+?254[17]\d{8}$/.test(
        String(invoice.account)
      )
    ) {
      payment.phoneNumber =
        normalizePhone(
          invoice.account
        );
    }

    if (
      state ===
        INTASEND_STATES.PENDING ||
      state ===
        INTASEND_STATES.PROCESSING
    ) {
      payment.provider =
        "intasend";

      payment.status =
        state ===
        INTASEND_STATES.PENDING
          ? "pending"
          : "processing";

      payment.statusMessage =
        state ===
        INTASEND_STATES.PENDING
          ? "Payment is awaiting customer action."
          : "Payment is being processed.";

      payment.initiatedAt =
        payment.initiatedAt ||
        new Date();

      payment.intasend.invoiceId =
        invoiceId;

      payment.intasend.apiReference =
        invoice?.api_ref ||
        payment.reference;

      payment.intasend.state =
        state;

      payment.intasend.provider =
        provider;

      payment.intasend.charges =
        Number(
          invoice?.charges
        ) || 0;

      payment.intasend.netAmount =
        invoice?.net_amount !==
          undefined &&
        invoice?.net_amount !==
          null
          ? Number(
              invoice.net_amount
            )
          : null;

      payment.gatewayReference =
        invoiceId ||
        payment.gatewayReference;

      payment.gatewayResponse =
        rawPayload;

      if (
        verificationMethod ===
        "webhook"
      ) {
        payment.intasend.webhookReceived =
          true;

        payment.intasend.webhookReceivedAt =
          new Date();

        payment.callbackPayload =
          rawPayload;
      }

      await payment.save();

      return payment;
    }

    if (
      state ===
      INTASEND_STATES.COMPLETE
    ) {
      const gatewayAmount =
        Number(
          invoice?.value ??
            invoice?.amount
        );

      if (
        Number.isFinite(
          gatewayAmount
        ) &&
        gatewayAmount !==
          Number(payment.amount)
      ) {
        throw new IntaSendServiceError(
          "The IntaSend payment amount does not match the expected amount.",
          409,
          "PAYMENT_AMOUNT_MISMATCH",
          {
            expectedAmount:
              payment.amount,

            receivedAmount:
              gatewayAmount,

            invoiceId,
          }
        );
      }

      const gatewayCurrency =
        String(
          invoice?.currency ||
            payment.currency
        ).toUpperCase();

      if (
        gatewayCurrency !==
        String(
          payment.currency
        ).toUpperCase()
      ) {
        throw new IntaSendServiceError(
          "The IntaSend payment currency does not match the expected currency.",
          409,
          "PAYMENT_CURRENCY_MISMATCH"
        );
      }

      if (
        payment.status ===
          "successful" &&
        payment.isVerified
      ) {
        return payment;
      }

      return payment
        .markIntaSendSuccessful({
          invoiceId,

          providerReference:
            extractProviderReference(
              invoice
            ),

          provider,

          charges:
            invoice?.charges,

          netAmount:
            invoice?.net_amount,

          callbackPayload:
            rawPayload,

          paidAt:
            invoice?.updated_at
              ? new Date(
                  invoice.updated_at
                )
              : new Date(),

          verificationMethod,
        });
    }

    if (
      state ===
      INTASEND_STATES.FAILED
    ) {
      if (
        payment.status ===
          "successful" &&
        payment.isVerified
      ) {
        return payment;
      }

      return payment
        .markIntaSendFailed({
          invoiceId,

          failedReason:
            invoice
              ?.failed_reason ||
            "The IntaSend payment was not completed.",

          failedCode:
            invoice
              ?.failed_code ||
            null,

          callbackPayload:
            rawPayload,
        });
    }

    return payment;
  };

/* ==========================================================
   CREATE CHECKOUT
========================================================== */

export const createIntaSendCheckout =
  async ({
    paymentId = null,
    paymentReference = null,
    customer = {},
    redirectUrl = null,
    method = null,
  }) => {
    const payment =
      await findPayment({
        paymentId,
        paymentReference,
      });

    if (
      payment.status ===
      "successful"
    ) {
      throw new IntaSendServiceError(
        "This payment has already been completed.",
        409,
        "PAYMENT_ALREADY_COMPLETED"
      );
    }

    /*
     * Reuse the existing checkout URL when
     * one has already been created.
     */
    if (
      payment.intasend
        ?.checkoutUrl &&
      payment.intasend
        ?.invoiceId &&
      [
        "pending",
        "processing",
      ].includes(
        payment.status
      )
    ) {
      return {
        payment,
        checkoutUrl:
          payment.intasend
            .checkoutUrl,
        invoiceId:
          payment.intasend
            .invoiceId,
        reused: true,
      };
    }

    const checkoutPayload =
      buildCheckoutPayload({
        payment,
        customer,
        redirectUrl,
        method,
      });

    try {
      const intasend =
        getIntaSendClient();

      const collection =
        intasend.collection();

      const response =
        await collection.charge(
          checkoutPayload
        );

      const invoiceId =
        extractInvoiceId(
          response
        );

      const checkoutUrl =
        extractCheckoutUrl(
          response
        );

      if (
        !invoiceId ||
        !checkoutUrl
      ) {
        throw new IntaSendServiceError(
          "IntaSend did not return a valid invoice ID and checkout URL.",
          502,
          "INVALID_CHECKOUT_RESPONSE",
          response
        );
      }

      const invoice =
        extractInvoice(
          response
        );

      const responseState =
        normalizeState(
          invoice?.state
        ) ||
        INTASEND_STATES.PENDING;

      await payment
        .markIntaSendProcessing({
          invoiceId,

          apiReference:
            payment.reference,

          checkoutUrl,

          state:
            responseState,

          provider:
            invoice?.provider ||
            null,

          gatewayResponse:
            response,
        });

      payment.status =
        responseState ===
        INTASEND_STATES.PENDING
          ? "pending"
          : "processing";

      payment.phoneNumber =
        checkoutPayload
          .phone_number ||
        payment.phoneNumber;

      payment.paymentMethod =
        method ===
        INTASEND_METHODS.MPESA
          ? "mpesa"
          : method ===
              INTASEND_METHODS.CARD
            ? "card"
            : "unknown";

      await payment.save();

      return {
        payment,
        checkoutUrl,
        invoiceId,
        reused: false,
      };
    } catch (error) {
      if (
        error instanceof
        IntaSendServiceError
      ) {
        throw error;
      }

      throw createGatewayError(
        error,
        "Unable to create the IntaSend checkout."
      );
    }
  };

/* ==========================================================
   QUERY PAYMENT STATUS
========================================================== */

export const queryIntaSendPaymentStatus =
  async ({
    paymentId = null,
    paymentReference = null,
    invoiceId = null,
  }) => {
    const payment =
      await findPayment({
        paymentId,
        paymentReference,
        invoiceId,
      });

    const resolvedInvoiceId =
      invoiceId ||
      payment.intasend
        ?.invoiceId;

    if (!resolvedInvoiceId) {
      throw new IntaSendServiceError(
        "This payment does not have an IntaSend invoice ID.",
        400,
        "INTASEND_INVOICE_ID_MISSING"
      );
    }

    try {
      const intasend =
        getIntaSendClient();

      const collection =
        intasend.collection();

      const response =
        await collection.status(
          resolvedInvoiceId
        );

      payment.intasend.statusQueryAttempts =
        Number(
          payment.intasend
            .statusQueryAttempts ||
            0
        ) + 1;

      payment.intasend.lastStatusQueryAt =
        new Date();

      await payment.save();

      const invoice =
        extractInvoice(
          response
        );

      const updatedPayment =
        await applyIntaSendState({
          payment,
          invoice,
          rawPayload:
            response,
          verificationMethod:
            "status_query",
        });

      return {
        payment:
          updatedPayment,

        invoice,

        response,
      };
    } catch (error) {
      if (
        error instanceof
        IntaSendServiceError
      ) {
        throw error;
      }

      throw createGatewayError(
        error,
        "Unable to query the IntaSend payment status."
      );
    }
  };

/* ==========================================================
   PROCESS WEBHOOK
========================================================== */

export const processIntaSendWebhook =
  async (payload = {}) => {
    if (
      !validateIntaSendWebhookChallenge(
        payload.challenge
      )
    ) {
      throw new IntaSendServiceError(
        "The IntaSend webhook challenge is invalid.",
        401,
        "INVALID_WEBHOOK_CHALLENGE"
      );
    }

    const invoice =
      extractInvoice(
        payload
      );

    const invoiceId =
      invoice?.invoice_id ||
      payload?.invoice_id ||
      null;

    const apiReference =
      invoice?.api_ref ||
      payload?.api_ref ||
      null;

    if (
      !invoiceId &&
      !apiReference
    ) {
      throw new IntaSendServiceError(
        "The IntaSend webhook does not contain a payment reference.",
        400,
        "WEBHOOK_REFERENCE_MISSING"
      );
    }

    let payment = null;

    if (apiReference) {
      payment =
        await Payment
          .findByIntaSendApiReference(
            apiReference
          );

      if (!payment) {
        payment =
          await Payment.findOne({
            reference:
              String(
                apiReference
              )
                .trim()
                .toUpperCase(),
          });
      }
    }

    if (
      !payment &&
      invoiceId
    ) {
      payment =
        await Payment
          .findByIntaSendInvoiceId(
            invoiceId
          );
    }

    if (!payment) {
      throw new IntaSendServiceError(
        "No local payment record matches the IntaSend webhook.",
        404,
        "WEBHOOK_PAYMENT_NOT_FOUND",
        {
          invoiceId,
          apiReference,
        }
      );
    }

    /*
     * Prevent a webhook for one reference from
     * completing another payment.
     */
    if (
      apiReference &&
      String(
        payment.reference
      ).toUpperCase() !==
        String(
          apiReference
        ).toUpperCase()
    ) {
      throw new IntaSendServiceError(
        "The IntaSend API reference does not match the local payment reference.",
        409,
        "PAYMENT_REFERENCE_MISMATCH"
      );
    }

    const previousStatus =
      payment.status;

    const updatedPayment =
      await applyIntaSendState({
        payment,
        invoice,
        rawPayload:
          payload,
        verificationMethod:
          "webhook",
      });

    return {
      payment:
        updatedPayment,

      previousStatus,

      becameSuccessful:
        previousStatus !==
          "successful" &&
        updatedPayment.status ===
          "successful",

      state:
        normalizeState(
          invoice?.state
        ),
    };
  };

/* ==========================================================
   GET LOCAL PAYMENT STATUS
========================================================== */

export const getIntaSendLocalPayment =
  async ({
    paymentId = null,
    paymentReference = null,
    invoiceId = null,
  }) => {
    return findPayment({
      paymentId,
      paymentReference,
      invoiceId,
    });
  };

/* ==========================================================
   EXPORTS
========================================================== */

export {
  INTASEND_METHODS,
  INTASEND_STATES,
};