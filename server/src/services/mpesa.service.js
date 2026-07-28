import axios from "axios";

import mpesaConfig, {
  validateMpesaConfig,
} from "../config/mpesa.config.js";

/* ==========================================
   ACCESS TOKEN CACHE
========================================== */

let accessTokenCache = {
  token: null,
  expiresAt: 0,
};

/* ==========================================
   ERROR CLASS
========================================== */

export class MpesaServiceError extends Error {
  constructor(
    message,
    {
      statusCode = 500,
      code = "MPESA_SERVICE_ERROR",
      details = null,
      retryable = false,
    } = {}
  ) {
    super(message);

    this.name = "MpesaServiceError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.retryable = retryable;

    Error.captureStackTrace?.(
      this,
      MpesaServiceError
    );
  }
}

/* ==========================================
   AXIOS CLIENT
========================================== */

const mpesaHttpClient = axios.create({
  baseURL: mpesaConfig.baseUrl,
  timeout: mpesaConfig.requestTimeout,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/* ==========================================
   PHONE NUMBER NORMALIZATION
========================================== */

export const normalizeMpesaPhoneNumber = (
  phoneNumber
) => {
  if (!phoneNumber) {
    throw new MpesaServiceError(
      "Phone number is required.",
      {
        statusCode: 400,
        code: "MPESA_PHONE_REQUIRED",
      }
    );
  }

  let normalizedPhone = String(phoneNumber)
    .trim()
    .replace(/\s+/g, "")
    .replace(/[()-]/g, "");

  if (normalizedPhone.startsWith("+")) {
    normalizedPhone = normalizedPhone.substring(1);
  }

  if (normalizedPhone.startsWith("0")) {
    normalizedPhone = `254${normalizedPhone.substring(
      1
    )}`;
  } else if (
    normalizedPhone.startsWith("7") ||
    normalizedPhone.startsWith("1")
  ) {
    normalizedPhone = `254${normalizedPhone}`;
  }

  if (!/^254(7\d{8}|1\d{8})$/.test(normalizedPhone)) {
    throw new MpesaServiceError(
      "Enter a valid Kenyan Safaricom phone number.",
      {
        statusCode: 400,
        code: "MPESA_INVALID_PHONE",
      }
    );
  }

  return normalizedPhone;
};

/* ==========================================
   AMOUNT NORMALIZATION
========================================== */

export const normalizeMpesaAmount = (amount) => {
  const numericAmount = Number(amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    throw new MpesaServiceError(
      "Payment amount must be greater than zero.",
      {
        statusCode: 400,
        code: "MPESA_INVALID_AMOUNT",
      }
    );
  }

  /*
   * Daraja expects a whole-number amount.
   * Membership and event prices should therefore
   * be stored and submitted as whole Kenyan shillings.
   */
  return Math.round(numericAmount);
};

/* ==========================================
   TEXT HELPERS
========================================== */

const sanitizeAccountReference = (value) => {
  const reference = String(
    value || mpesaConfig.accountReference
  )
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .substring(0, 12);

  return reference || "JVP";
};

const sanitizeTransactionDescription = (value) => {
  const description = String(
    value || mpesaConfig.transactionDescription
  )
    .trim()
    .replace(/\s+/g, " ")
    .substring(0, 13);

  return description || "JVP payment";
};

/* ==========================================
   TIMESTAMP
========================================== */

/**
 * Generates an M-Pesa timestamp in:
 * YYYYMMDDHHmmss
 *
 * Africa/Nairobi is used because M-Pesa operates
 * using East Africa Time.
 */
export const generateMpesaTimestamp = (
  date = new Date()
) => {
  const formatter = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }
  );

  const parts = formatter.formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [
        part.type,
        part.value,
      ])
  );

  return [
    values.year,
    values.month,
    values.day,
    values.hour,
    values.minute,
    values.second,
  ].join("");
};

/* ==========================================
   PASSWORD
========================================== */

export const generateMpesaPassword = (
  timestamp
) => {
  if (!timestamp) {
    throw new MpesaServiceError(
      "M-Pesa timestamp is required.",
      {
        code: "MPESA_TIMESTAMP_REQUIRED",
      }
    );
  }

  const rawPassword =
    `${mpesaConfig.shortCode}` +
    `${mpesaConfig.passKey}` +
    `${timestamp}`;

  return Buffer.from(rawPassword).toString(
    "base64"
  );
};

/* ==========================================
   RESPONSE HELPERS
========================================== */

const extractMpesaErrorDetails = (error) => {
  return (
    error?.response?.data ||
    error?.response?.statusText ||
    error?.message ||
    "Unknown M-Pesa error"
  );
};

const getMpesaErrorMessage = (error) => {
  return (
    error?.response?.data?.errorMessage ||
    error?.response?.data?.ResponseDescription ||
    error?.response?.data?.responseDescription ||
    error?.response?.data?.ResultDesc ||
    error?.message ||
    "M-Pesa request failed."
  );
};

const transformMpesaError = (
  error,
  fallbackMessage
) => {
  if (error instanceof MpesaServiceError) {
    return error;
  }

  const responseStatus =
    error?.response?.status || 500;

  const isTimeout =
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT";

  const isNetworkError =
    !error?.response &&
    Boolean(error?.request);

  return new MpesaServiceError(
    isTimeout
      ? "The M-Pesa request timed out. Please try again."
      : isNetworkError
        ? "Unable to connect to M-Pesa. Please try again."
        : getMpesaErrorMessage(error) ||
          fallbackMessage,
    {
      statusCode:
        responseStatus >= 400 &&
        responseStatus < 500
          ? responseStatus
          : 502,

      code: isTimeout
        ? "MPESA_TIMEOUT"
        : isNetworkError
          ? "MPESA_NETWORK_ERROR"
          : "MPESA_API_ERROR",

      details: extractMpesaErrorDetails(error),

      retryable:
        isTimeout ||
        isNetworkError ||
        responseStatus >= 500,
    }
  );
};

/* ==========================================
   CONFIGURATION CHECK
========================================== */

const ensureMpesaConfiguration = () => {
  try {
    validateMpesaConfig({
      throwOnError: true,
    });
  } catch (error) {
    throw new MpesaServiceError(
      error.message,
      {
        statusCode: 500,
        code: "MPESA_CONFIGURATION_ERROR",
      }
    );
  }
};

/* ==========================================
   ACCESS TOKEN
========================================== */

export const clearMpesaAccessTokenCache = () => {
  accessTokenCache = {
    token: null,
    expiresAt: 0,
  };
};

export const getMpesaAccessToken = async ({
  forceRefresh = false,
} = {}) => {
  ensureMpesaConfiguration();

  const now = Date.now();

  const cacheBufferMilliseconds =
    mpesaConfig.tokenCacheBufferSeconds * 1000;

  const tokenIsValid =
    accessTokenCache.token &&
    now <
      accessTokenCache.expiresAt -
        cacheBufferMilliseconds;

  if (!forceRefresh && tokenIsValid) {
    return accessTokenCache.token;
  }

  try {
    const credentials = Buffer.from(
      `${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`
    ).toString("base64");

    const response = await mpesaHttpClient.get(
      mpesaConfig.endpoints.accessToken,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    const accessToken =
      response?.data?.access_token;

    const expiresInSeconds = Number(
      response?.data?.expires_in || 3599
    );

    if (!accessToken) {
      throw new MpesaServiceError(
        "M-Pesa did not return an access token.",
        {
          statusCode: 502,
          code: "MPESA_TOKEN_MISSING",
          details: response?.data || null,
        }
      );
    }

    accessTokenCache = {
      token: accessToken,
      expiresAt:
        now + expiresInSeconds * 1000,
    };

    return accessToken;
  } catch (error) {
    clearMpesaAccessTokenCache();

    throw transformMpesaError(
      error,
      "Unable to obtain an M-Pesa access token."
    );
  }
};

/* ==========================================
   AUTHENTICATED REQUEST
========================================== */

const makeAuthenticatedMpesaRequest = async ({
  method = "POST",
  url,
  data = undefined,
  retryAuthentication = true,
}) => {
  let accessToken =
    await getMpesaAccessToken();

  try {
    return await mpesaHttpClient.request({
      method,
      url,
      data,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    /*
     * If the cached token has expired unexpectedly,
     * obtain a fresh token and retry once.
     */
    if (
      retryAuthentication &&
      error?.response?.status === 401
    ) {
      clearMpesaAccessTokenCache();

      accessToken =
        await getMpesaAccessToken({
          forceRefresh: true,
        });

      return mpesaHttpClient.request({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    throw error;
  }
};

/* ==========================================
   STK PUSH
========================================== */

export const initiateMpesaStkPush = async ({
  phoneNumber,
  amount,
  accountReference,
  transactionDescription,
  callbackUrl,
}) => {
  ensureMpesaConfiguration();

  const normalizedPhone =
    normalizeMpesaPhoneNumber(phoneNumber);

  const normalizedAmount =
    normalizeMpesaAmount(amount);

  const timestamp =
    generateMpesaTimestamp();

  const password =
    generateMpesaPassword(timestamp);

  const resolvedCallbackUrl =
    callbackUrl?.trim() ||
    mpesaConfig.callbackUrl;

  if (
    !resolvedCallbackUrl ||
    !/^https:\/\//i.test(resolvedCallbackUrl)
  ) {
    throw new MpesaServiceError(
      "A valid HTTPS M-Pesa callback URL is required.",
      {
        statusCode: 500,
        code: "MPESA_INVALID_CALLBACK_URL",
      }
    );
  }

  const payload = {
    BusinessShortCode:
      mpesaConfig.shortCode,

    Password: password,

    Timestamp: timestamp,

    TransactionType:
      mpesaConfig.transactionType,

    Amount: normalizedAmount,

    PartyA: normalizedPhone,

    PartyB: mpesaConfig.shortCode,

    PhoneNumber: normalizedPhone,

    CallBackURL: resolvedCallbackUrl,

    AccountReference:
      sanitizeAccountReference(
        accountReference
      ),

    TransactionDesc:
      sanitizeTransactionDescription(
        transactionDescription
      ),
  };

  try {
    const response =
      await makeAuthenticatedMpesaRequest({
        method: "POST",
        url: mpesaConfig.endpoints.stkPush,
        data: payload,
      });

    const responseData = response?.data || {};

    const responseCode = String(
      responseData.ResponseCode ?? ""
    );

    if (
      responseCode &&
      responseCode !== "0"
    ) {
      throw new MpesaServiceError(
        responseData.ResponseDescription ||
          responseData.CustomerMessage ||
          "M-Pesa rejected the STK Push request.",
        {
          statusCode: 400,
          code: "MPESA_STK_REJECTED",
          details: responseData,
        }
      );
    }

    if (!responseData.CheckoutRequestID) {
      throw new MpesaServiceError(
        "M-Pesa did not return a CheckoutRequestID.",
        {
          statusCode: 502,
          code:
            "MPESA_CHECKOUT_REQUEST_ID_MISSING",
          details: responseData,
        }
      );
    }

    return {
      success: true,

      merchantRequestId:
        responseData.MerchantRequestID,

      checkoutRequestId:
        responseData.CheckoutRequestID,

      responseCode:
        responseData.ResponseCode,

      responseDescription:
        responseData.ResponseDescription,

      customerMessage:
        responseData.CustomerMessage,

      phoneNumber: normalizedPhone,
      amount: normalizedAmount,
      timestamp,

      rawResponse: responseData,
    };
  } catch (error) {
    throw transformMpesaError(
      error,
      "Unable to initiate the M-Pesa STK Push."
    );
  }
};

/* ==========================================
   STK PUSH STATUS QUERY
========================================== */

export const queryMpesaStkPushStatus = async ({
  checkoutRequestId,
}) => {
  ensureMpesaConfiguration();

  const normalizedCheckoutRequestId =
    String(checkoutRequestId || "").trim();

  if (!normalizedCheckoutRequestId) {
    throw new MpesaServiceError(
      "CheckoutRequestID is required.",
      {
        statusCode: 400,
        code:
          "MPESA_CHECKOUT_REQUEST_ID_REQUIRED",
      }
    );
  }

  const timestamp =
    generateMpesaTimestamp();

  const password =
    generateMpesaPassword(timestamp);

  const payload = {
    BusinessShortCode:
      mpesaConfig.shortCode,

    Password: password,

    Timestamp: timestamp,

    CheckoutRequestID:
      normalizedCheckoutRequestId,
  };

  try {
    const response =
      await makeAuthenticatedMpesaRequest({
        method: "POST",
        url: mpesaConfig.endpoints.stkQuery,
        data: payload,
      });

    const responseData = response?.data || {};

    const resultCode =
      responseData.ResultCode !== undefined
        ? Number(responseData.ResultCode)
        : null;

    return {
      success: resultCode === 0,

      merchantRequestId:
        responseData.MerchantRequestID ||
        null,

      checkoutRequestId:
        responseData.CheckoutRequestID ||
        normalizedCheckoutRequestId,

      responseCode:
        responseData.ResponseCode ?? null,

      responseDescription:
        responseData.ResponseDescription ||
        null,

      resultCode,

      resultDescription:
        responseData.ResultDesc ||
        responseData.ResultDescription ||
        null,

      rawResponse: responseData,
    };
  } catch (error) {
    throw transformMpesaError(
      error,
      "Unable to query the M-Pesa transaction."
    );
  }
};

/* ==========================================
   CALLBACK METADATA
========================================== */

const convertMpesaTransactionDate = (
  transactionDate
) => {
  const value = String(
    transactionDate || ""
  ).trim();

  if (!/^\d{14}$/.test(value)) {
    return null;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(8, 10));
  const minute = Number(value.slice(10, 12));
  const second = Number(value.slice(12, 14));

  /*
   * Nairobi is UTC+3 throughout the year.
   */
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      hour - 3,
      minute,
      second
    )
  );
};

export const parseMpesaCallbackMetadata = (
  callbackMetadata
) => {
  const items = Array.isArray(
    callbackMetadata?.Item
  )
    ? callbackMetadata.Item
    : [];

  const metadata = {};

  for (const item of items) {
    if (!item?.Name) {
      continue;
    }

    metadata[item.Name] =
      item.Value ?? null;
  }

  return {
    amount:
      metadata.Amount !== undefined
        ? Number(metadata.Amount)
        : null,

    receiptNumber:
      metadata.MpesaReceiptNumber
        ? String(
            metadata.MpesaReceiptNumber
          )
            .trim()
            .toUpperCase()
        : null,

    transactionDate:
      convertMpesaTransactionDate(
        metadata.TransactionDate
      ),

    phoneNumber:
      metadata.PhoneNumber
        ? String(metadata.PhoneNumber)
        : null,

    balance:
      metadata.Balance !== undefined
        ? Number(metadata.Balance)
        : null,

    rawMetadata: metadata,
  };
};

/* ==========================================
   CALLBACK PARSER
========================================== */

export const parseMpesaStkCallback = (
  requestBody
) => {
  const stkCallback =
    requestBody?.Body?.stkCallback;

  if (!stkCallback) {
    throw new MpesaServiceError(
      "Invalid M-Pesa callback payload.",
      {
        statusCode: 400,
        code:
          "MPESA_INVALID_CALLBACK_PAYLOAD",
        details: requestBody || null,
      }
    );
  }

  const resultCode = Number(
    stkCallback.ResultCode
  );

  const parsedMetadata =
    parseMpesaCallbackMetadata(
      stkCallback.CallbackMetadata
    );

  return {
    merchantRequestId:
      stkCallback.MerchantRequestID ||
      null,

    checkoutRequestId:
      stkCallback.CheckoutRequestID ||
      null,

    resultCode,

    resultDescription:
      stkCallback.ResultDesc ||
      null,

    successful: resultCode === 0,

    amount: parsedMetadata.amount,

    receiptNumber:
      parsedMetadata.receiptNumber,

    transactionDate:
      parsedMetadata.transactionDate,

    phoneNumber:
      parsedMetadata.phoneNumber,

    balance:
      parsedMetadata.balance,

    rawMetadata:
      parsedMetadata.rawMetadata,

    rawCallback: stkCallback,
    rawPayload: requestBody,
  };
};

/* ==========================================
   RESULT CODE HELPERS
========================================== */

export const getMpesaResultStatus = (
  resultCode
) => {
  const code = Number(resultCode);

  if (code === 0) {
    return "successful";
  }

  /*
   * Common customer-side results:
   * 1032: request cancelled by user
   * 1037: timeout / user unreachable
   * 1: insufficient funds in some responses
   */
  if (code === 1032) {
    return "cancelled";
  }

  if (code === 1037) {
    return "expired";
  }

  return "failed";
};

/* ==========================================
   HEALTH CHECK
========================================== */

export const testMpesaConnection = async () => {
  try {
    await getMpesaAccessToken({
      forceRefresh: true,
    });

    return {
      success: true,
      environment:
        mpesaConfig.environment,
      message:
        "M-Pesa authentication completed successfully.",
    };
  } catch (error) {
    return {
      success: false,
      environment:
        mpesaConfig.environment,
      message: error.message,
      code:
        error.code ||
        "MPESA_CONNECTION_TEST_FAILED",
    };
  }
};

/* ==========================================
   DEFAULT EXPORT
========================================== */

const mpesaService = {
  normalizePhoneNumber:
    normalizeMpesaPhoneNumber,

  normalizeAmount:
    normalizeMpesaAmount,

  generateTimestamp:
    generateMpesaTimestamp,

  generatePassword:
    generateMpesaPassword,

  getAccessToken:
    getMpesaAccessToken,

  clearAccessTokenCache:
    clearMpesaAccessTokenCache,

  initiateStkPush:
    initiateMpesaStkPush,

  queryStkPushStatus:
    queryMpesaStkPushStatus,

  parseCallbackMetadata:
    parseMpesaCallbackMetadata,

  parseStkCallback:
    parseMpesaStkCallback,

  getResultStatus:
    getMpesaResultStatus,

  testConnection:
    testMpesaConnection,
};

export default mpesaService;