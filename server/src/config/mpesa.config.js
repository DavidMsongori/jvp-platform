/* ==========================================
   M-PESA CONFIGURATION
========================================== */

const MPESA_ENVIRONMENTS = {
  sandbox: {
    baseUrl: "https://sandbox.safaricom.co.ke",
  },

  production: {
    baseUrl: "https://api.safaricom.co.ke",
  },
};

/* ==========================================
   ENVIRONMENT HELPERS
========================================== */

const normalizeEnvironment = (value = "sandbox") => {
  const environment = String(value)
    .trim()
    .toLowerCase();

  if (!["sandbox", "production"].includes(environment)) {
    throw new Error(
      `Invalid MPESA_ENVIRONMENT "${value}". Use "sandbox" or "production".`
    );
  }

  return environment;
};

const normalizeTransactionType = (
  value = "CustomerPayBillOnline"
) => {
  const transactionType = String(value).trim();

  const allowedTypes = [
    "CustomerPayBillOnline",
    "CustomerBuyGoodsOnline",
  ];

  if (!allowedTypes.includes(transactionType)) {
    throw new Error(
      `Invalid MPESA_TRANSACTION_TYPE "${value}".`
    );
  }

  return transactionType;
};

/* ==========================================
   CONFIGURATION
========================================== */

const environment = normalizeEnvironment(
  process.env.MPESA_ENVIRONMENT ||
    process.env.MPESA_ENV ||
    "sandbox"
);

const transactionType = normalizeTransactionType(
  process.env.MPESA_TRANSACTION_TYPE ||
    (environment === "production"
      ? "CustomerBuyGoodsOnline"
      : "CustomerPayBillOnline")
);

const baseUrl = MPESA_ENVIRONMENTS[environment].baseUrl;

const mpesaConfig = {
  environment,

  baseUrl,

  consumerKey:
    process.env.MPESA_CONSUMER_KEY?.trim() || "",

  consumerSecret:
    process.env.MPESA_CONSUMER_SECRET?.trim() || "",

  shortCode:
    process.env.MPESA_SHORTCODE?.trim() || "",

  passKey:
    process.env.MPESA_PASSKEY?.trim() || "",

  callbackUrl:
    process.env.MPESA_CALLBACK_URL?.trim() || "",

  transactionType,

  accountReference:
    process.env.MPESA_ACCOUNT_REFERENCE?.trim() ||
    "JVP",

  transactionDescription:
    process.env.MPESA_TRANSACTION_DESCRIPTION?.trim() ||
    "JVP payment",

  endpoints: {
    accessToken:
      "/oauth/v1/generate?grant_type=client_credentials",

    stkPush:
      "/mpesa/stkpush/v1/processrequest",

    stkQuery:
      "/mpesa/stkpushquery/v1/query",
  },

  requestTimeout: Number(
    process.env.MPESA_REQUEST_TIMEOUT || 30000
  ),

  tokenCacheBufferSeconds: Number(
    process.env.MPESA_TOKEN_CACHE_BUFFER_SECONDS || 60
  ),
};

/* ==========================================
   DERIVED URLS
========================================== */

mpesaConfig.urls = {
  accessToken:
    `${mpesaConfig.baseUrl}${mpesaConfig.endpoints.accessToken}`,

  stkPush:
    `${mpesaConfig.baseUrl}${mpesaConfig.endpoints.stkPush}`,

  stkQuery:
    `${mpesaConfig.baseUrl}${mpesaConfig.endpoints.stkQuery}`,
};

/* ==========================================
   VALIDATION
========================================== */

export const validateMpesaConfig = ({
  throwOnError = true,
} = {}) => {
  const missingVariables = [];

  if (!mpesaConfig.consumerKey) {
    missingVariables.push("MPESA_CONSUMER_KEY");
  }

  if (!mpesaConfig.consumerSecret) {
    missingVariables.push("MPESA_CONSUMER_SECRET");
  }

  if (!mpesaConfig.shortCode) {
    missingVariables.push("MPESA_SHORTCODE");
  }

  if (!mpesaConfig.passKey) {
    missingVariables.push("MPESA_PASSKEY");
  }

  if (!mpesaConfig.callbackUrl) {
    missingVariables.push("MPESA_CALLBACK_URL");
  }

  const errors = [];

  if (missingVariables.length > 0) {
    errors.push(
      `Missing environment variables: ${missingVariables.join(
        ", "
      )}`
    );
  }

  if (
    mpesaConfig.callbackUrl &&
    !/^https:\/\//i.test(mpesaConfig.callbackUrl)
  ) {
    errors.push(
      "MPESA_CALLBACK_URL must use HTTPS."
    );
  }

  if (
    !Number.isFinite(mpesaConfig.requestTimeout) ||
    mpesaConfig.requestTimeout <= 0
  ) {
    errors.push(
      "MPESA_REQUEST_TIMEOUT must be a positive number."
    );
  }

  if (
    !Number.isFinite(
      mpesaConfig.tokenCacheBufferSeconds
    ) ||
    mpesaConfig.tokenCacheBufferSeconds < 0
  ) {
    errors.push(
      "MPESA_TOKEN_CACHE_BUFFER_SECONDS must be zero or greater."
    );
  }

  const isValid = errors.length === 0;

  if (!isValid && throwOnError) {
    throw new Error(
      `M-Pesa configuration is incomplete. ${errors.join(
        " "
      )}`
    );
  }

  return {
    isValid,
    errors,
    missingVariables,
    environment: mpesaConfig.environment,
  };
};

/* ==========================================
   SAFE CONFIG SUMMARY
========================================== */

export const getMpesaConfigSummary = () => ({
  environment: mpesaConfig.environment,
  baseUrl: mpesaConfig.baseUrl,
  shortCode: mpesaConfig.shortCode || null,
  callbackUrl: mpesaConfig.callbackUrl || null,
  transactionType: mpesaConfig.transactionType,

  consumerKeyConfigured: Boolean(
    mpesaConfig.consumerKey
  ),

  consumerSecretConfigured: Boolean(
    mpesaConfig.consumerSecret
  ),

  passKeyConfigured: Boolean(
    mpesaConfig.passKey
  ),
});

/* ==========================================
   EXPORT
========================================== */

export default mpesaConfig;