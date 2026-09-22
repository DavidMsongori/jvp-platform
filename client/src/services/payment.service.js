import api from "./api";

/* ==========================================
   MEMBERSHIP PAYMENT — INTASEND
========================================== */

/**
 * Create an IntaSend checkout for membership registration.
 *
 * Kept for compatibility with any existing
 * IntaSend-based flows.
 */
export const initiateMembershipPayment = async ({
  phoneNumber = null,
  email = null,
  fullName = null,
  method = "M-PESA",
  redirectUrl = null,
} = {}) => {
  try {
    const response = await api.post(
      "/payments/membership",
      {
        phoneNumber,
        email,
        fullName,
        method,
        redirectUrl,
      }
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to initiate membership payment.",
      }
    );
  }
};

/* ==========================================
   MEMBERSHIP PAYMENT — MANUAL M-PESA TILL
========================================== */

/**
 * Create or retrieve the member's manual
 * M-Pesa Till membership payment.
 */
export const initiateManualMembershipPayment =
  async () => {
    try {
      const response = await api.post(
        "/payments/membership/manual"
      );

      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message:
            "Unable to create the manual M-Pesa payment.",
        }
      );
    }
  };

/**
 * Submit an M-Pesa confirmation code for
 * manual verification.
 */
export const confirmManualMpesaPayment =
  async ({
    reference,
    confirmationCode,
  }) => {
    try {
      const response = await api.post(
        "/payments/mpesa/confirm",
        {
          reference,
          confirmationCode,
        }
      );

      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message:
            "Unable to submit the M-Pesa confirmation code.",
        }
      );
    }
  };

/* ==========================================
   MEMBERSHIP RENEWAL
========================================== */

export const initiateRenewalPayment = async ({
  phoneNumber = null,
  email = null,
  fullName = null,
  method = "M-PESA",
  redirectUrl = null,
} = {}) => {
  try {
    const response = await api.post(
      "/payments/renewal",
      {
        phoneNumber,
        email,
        fullName,
        method,
        redirectUrl,
      }
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message:
          "Unable to initiate membership renewal.",
      }
    );
  }
};

/* ==========================================
   INITIATE EXISTING PAYMENT
========================================== */

export const initiatePayment = async ({
  paymentId = null,
  reference = null,
  phoneNumber = null,
  email = null,
  fullName = null,
  method = "M-PESA",
  redirectUrl = null,
}) => {
  try {
    const response = await api.post(
      "/payments/initiate",
      {
        paymentId,
        reference,
        phoneNumber,
        email,
        fullName,
        method,
        redirectUrl,
      }
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to initiate payment.",
      }
    );
  }
};

/* ==========================================
   PAYMENT STATUS — INTASEND
========================================== */

export const checkPaymentStatus = async ({
  paymentId = null,
  reference = null,
  paymentReference = null,
  invoiceId = null,
}) => {
  try {
    const response = await api.post(
      "/payments/status",
      {
        paymentId,
        reference,
        paymentReference,
        invoiceId,
      }
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message:
          "Unable to retrieve payment status.",
      }
    );
  }
};

/* ==========================================
   PAYMENT RETRY
========================================== */

export const retryPayment = async ({
  paymentId = null,
  reference = null,
  phoneNumber = null,
  email = null,
  fullName = null,
  method = "M-PESA",
  redirectUrl = null,
}) => {
  try {
    const response = await api.post(
      "/payments/retry",
      {
        paymentId,
        reference,
        phoneNumber,
        email,
        fullName,
        method,
        redirectUrl,
      }
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to retry payment.",
      }
    );
  }
};

/* ==========================================
   PAYMENT HISTORY
========================================== */

export const getPaymentHistory = async (
  params = {}
) => {
  try {
    const response = await api.get(
      "/payments/history",
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message:
          "Unable to retrieve payment history.",
      }
    );
  }
};

/* ==========================================
   PAYMENT BY REFERENCE
========================================== */

export const getPaymentByReference = async (
  reference
) => {
  try {
    const response = await api.get(
      `/payments/reference/${reference}`
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to retrieve payment.",
      }
    );
  }
};

/* ==========================================
   PAYMENT BY ID
========================================== */

export const getPaymentById = async (
  paymentId
) => {
  try {
    const response = await api.get(
      `/payments/id/${paymentId}`
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to retrieve payment.",
      }
    );
  }
};

/* ==========================================
   REDIRECT TO INTASEND
========================================== */

export const redirectToCheckout = (
  checkoutUrl
) => {
  if (!checkoutUrl) {
    throw new Error("Checkout URL not found.");
  }

  window.location.href = checkoutUrl;
};

/* ==========================================
   DEFAULT EXPORT
========================================== */

const paymentService = {
  initiateMembershipPayment,
  initiateManualMembershipPayment,
  confirmManualMpesaPayment,
  initiateRenewalPayment,
  initiatePayment,
  retryPayment,
  checkPaymentStatus,
  getPaymentHistory,
  getPaymentByReference,
  getPaymentById,
  redirectToCheckout,
};

export default paymentService;