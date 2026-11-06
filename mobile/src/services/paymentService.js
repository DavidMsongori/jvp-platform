
import api from "./api";

/**
 * Existing PayHero membership payment.
 * Retained for compatibility with existing mobile code.
 */
export const initiateMembershipPayment = async (payload = {}) => {
  const response = await api.post("/payments/membership", {
    phoneNumber: payload.phoneNumber || undefined,
    method: "M-PESA",
  });

  return response.data;
};

/**
 * Existing PayHero payment status lookup.
 * Retained for compatibility with existing mobile code.
 */
export const getPaymentStatus = async (reference) => {
  const response = await api.get(
    `/payments/reference/${encodeURIComponent(reference)}`
  );

  return response.data;
};

/**
 * Initiate or retrieve the member's manual M-Pesa Till payment.
 */
export const initiateManualMembershipPayment = async () => {
  const response = await api.post("/payments/membership/manual");

  return response.data;
};

/**
 * Submit an M-Pesa confirmation code for admin verification.
 */
export const confirmManualMpesaPayment = async ({
  reference,
  confirmationCode,
}) => {
  const response = await api.post("/payments/mpesa/confirm", {
    reference,
    confirmationCode,
  });

  return response.data;
};

/**
 * Retrieve payment history.
 */
export const getPaymentHistory = async (params = {}) => {
  const response = await api.get("/payments/history", {
    params,
  });

  return response.data;
};

export default {
  initiateMembershipPayment,
  getPaymentStatus,
  initiateManualMembershipPayment,
  confirmManualMpesaPayment,
  getPaymentHistory,
};
