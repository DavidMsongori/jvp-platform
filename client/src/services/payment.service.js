import api from "./api";

/* ==========================================
   MEMBERSHIP PAYMENT
========================================== */

/**
 * Initiate a new membership M-Pesa STK Push.
 *
 * @param {string} phoneNumber
 * @returns {Promise<object>}
 */
export const initiateMembershipPayment = async (
  phoneNumber
) => {
  try {
    const response = await api.post(
      "/payments/membership",
      {
        phoneNumber,
      }
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message:
          "Unable to initiate membership payment.",
      }
    );
  }
};

/* ==========================================
   MEMBERSHIP RENEWAL
========================================== */

/**
 * Initiate an M-Pesa membership-renewal payment.
 *
 * @param {string} phoneNumber
 * @returns {Promise<object>}
 */
export const initiateRenewalPayment = async (
  phoneNumber
) => {
  try {
    const response = await api.post(
      "/payments/renewal",
      {
        phoneNumber,
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
   PAYMENT STATUS
========================================== */

/**
 * Retrieve or query a payment's current status.
 *
 * @param {string} reference
 * @returns {Promise<object>}
 */
export const checkPaymentStatus = async (
  reference
) => {
  try {
    const response = await api.post(
      "/payments/status",
      {
        reference,
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
   RETRY PAYMENT
========================================== */

/**
 * Retry an existing failed, cancelled or expired payment.
 *
 * @param {string} reference
 * @param {string} phoneNumber
 * @returns {Promise<object>}
 */
export const retryPayment = async (
  reference,
  phoneNumber
) => {
  try {
    const response = await api.post(
      "/payments/retry",
      {
        reference,
        phoneNumber,
      }
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message:
          "Unable to retry the payment.",
      }
    );
  }
};

/* ==========================================
   PAYMENT HISTORY
========================================== */

/**
 * Retrieve the signed-in member's payment history.
 *
 * @param {object} params
 * @returns {Promise<object>}
 */
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

/**
 * Retrieve a payment using its internal reference.
 *
 * @param {string} reference
 * @returns {Promise<object>}
 */
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
        message:
          "Unable to retrieve the payment.",
      }
    );
  }
};

/* ==========================================
   PAYMENT BY ID
========================================== */

/**
 * Retrieve a payment using its MongoDB ID.
 *
 * @param {string} paymentId
 * @returns {Promise<object>}
 */
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
        message:
          "Unable to retrieve the payment.",
      }
    );
  }
};

/* ==========================================
   DEFAULT EXPORT
========================================== */

const paymentService = {
  initiateMembershipPayment,
  initiateRenewalPayment,
  checkPaymentStatus,
  retryPayment,
  getPaymentHistory,
  getPaymentByReference,
  getPaymentById,
};

export default paymentService;