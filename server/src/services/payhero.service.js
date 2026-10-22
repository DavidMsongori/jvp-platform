
import axios from "axios";

/* ==========================================
   PAYHERO CONFIGURATION
========================================== */

const PAYHERO_API_URL =
  process.env.PAYHERO_API_URL ||
  "https://backend.payhero.co.ke/api/v2/payments";

const getPayHeroConfig = () => {
  const username = process.env.PAYHERO_API_USERNAME;
  const password = process.env.PAYHERO_API_PASSWORD;
  const channelId = process.env.PAYHERO_CHANNEL_ID;
  const callbackUrl = process.env.PAYHERO_CALLBACK_URL;

  const missing = [];

  if (!username) missing.push("PAYHERO_API_USERNAME");
  if (!password) missing.push("PAYHERO_API_PASSWORD");
  if (!channelId) missing.push("PAYHERO_CHANNEL_ID");
  if (!callbackUrl) missing.push("PAYHERO_CALLBACK_URL");

  if (missing.length) {
    const error = new Error(
      `Missing PayHero configuration: ${missing.join(", ")}`
    );

    error.statusCode = 500;
    throw error;
  }

  if (!/^https:\/\//i.test(callbackUrl)) {
    const error = new Error(
      "PAYHERO_CALLBACK_URL must use HTTPS."
    );

    error.statusCode = 500;
    throw error;
  }

  const parsedChannelId = Number(channelId);

  if (
    !Number.isSafeInteger(parsedChannelId) ||
    parsedChannelId <= 0
  ) {
    const error = new Error(
      "PAYHERO_CHANNEL_ID must be a positive integer."
    );

    error.statusCode = 500;
    throw error;
  }

  return {
    username,
    password,
    channelId: parsedChannelId,
    callbackUrl,
  };
};

/* ==========================================
   HELPERS
========================================== */

const createServiceError = (message, statusCode = 502) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeKenyanPhoneNumber = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (/^0[17]\d{8}$/.test(digits)) {
    return `254${digits.slice(1)}`;
  }

  if (/^[17]\d{8}$/.test(digits)) {
    return `254${digits}`;
  }

  if (/^254[17]\d{8}$/.test(digits)) {
    return digits;
  }

  throw createServiceError(
    "Enter a valid Kenyan M-Pesa phone number.",
    400
  );
};

const normalizePayHeroResponse = (data) => ({
  success: Boolean(data?.success),
  status: data?.status || null,
  providerReference: data?.reference || null,
  checkoutRequestId: data?.CheckoutRequestID || null,
  message:
    data?.message ||
    data?.detail ||
    null,
  raw: data,
});

/* ==========================================
   INITIATE M-PESA STK PUSH
========================================== */

/**
 * Sends an M-Pesa STK Push request through PayHero.
 *
 * This function does not mark the local payment
 * as successful. Payment verification belongs
 * in the callback/status-processing workflow.
 *
 * @param {Object} options
 * @param {number} options.amount
 * @param {string} options.phoneNumber
 * @param {string} options.reference
 * @param {string} [options.customerName]
 */

export const initiateStkPush = async ({
  amount,
  phoneNumber,
  reference,
  customerName = "",
}) => {
  const config = getPayHeroConfig();

  if (
    !Number.isSafeInteger(Number(amount)) ||
    Number(amount) < 1
  ) {
    throw createServiceError(
      "Payment amount must be a positive whole number in KES.",
      400
    );
  }

  if (
    typeof reference !== "string" ||
    !reference.trim() ||
    reference.trim().length > 50
  ) {
    throw createServiceError(
      "A valid payment reference is required.",
      400
    );
  }

  const phone = normalizeKenyanPhoneNumber(phoneNumber);

  const payload = {
    amount: Number(amount),
    phone_number: phone,
    channel_id: config.channelId,
    provider: "m-pesa",
    external_reference: reference.trim(),
    callback_url: config.callbackUrl,
  };

  if (customerName?.trim()) {
    payload.customer_name = customerName.trim();
  }

  let response;

  try {
    response = await axios.post(
      PAYHERO_API_URL,
      payload,
      {
        auth: {
          username: config.username,
          password: config.password,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 20000,
        maxRedirects: 0,
      }
    );
  } catch (error) {
    const providerMessage =
      error.response?.data?.message ||
      error.response?.data?.detail;

    /*
     * Do not expose credentials or raw provider
     * responses to the client.
     *
     * A timeout can be ambiguous: PayHero may
     * have received the request. The caller must
     * reconcile status before issuing another STK.
     */

   if (
  error.code === "ECONNABORTED" ||
  error.code === "ETIMEDOUT" ||
  !error.response
) {
  const serviceError = createServiceError(
    "PayHero's response could not be confirmed. Check the transaction status before retrying.",
    502
  );

  serviceError.paymentOutcomeUnknown = true;
  throw serviceError;
}

    const statusCode =
      error.response.status >= 400 &&
      error.response.status < 500
        ? 400
        : 502;

    throw createServiceError(
      providerMessage ||
        "PayHero could not initiate the M-Pesa payment.",
      statusCode
    );
  }

  const result = normalizePayHeroResponse(response.data);

  if (
    response.status < 200 ||
    response.status >= 300 ||
    result.success !== true ||
    !result.providerReference
  ) {
    throw createServiceError(
      result.message ||
        "PayHero did not confirm that the STK Push was accepted.",
      502
    );
  }

  return {
    success: true,
    status: result.status,
    reference: reference.trim(),
    phoneNumber: phone,
    amount: Number(amount),
    providerReference: result.providerReference,
    checkoutRequestId: result.checkoutRequestId,
    message:
      result.message ||
      "M-Pesa payment request accepted by PayHero.",
  };
};

export default {
  initiateStkPush,
};
