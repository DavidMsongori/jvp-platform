/* ==========================================================
   JVP FINANCE SERVICE
   Handles Finance Dashboard and Finance payment operations
========================================================== */

import api from "./api";

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Safely unwrap common API response structures.
 *
 * Supported:
 * - { data: ... }
 * - { data: { data: ... } }
 * - direct arrays / objects
 */
const unwrapResponse = (response) => {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }

  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
};

/**
 * Normalize collection responses.
 *
 * Supports APIs returning:
 * - []
 * - { payments: [] }
 * - { results: [] }
 * - { records: [] }
 * - { data: [] }
 * - { items: [] }
 */
const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  if (Array.isArray(payload.payments)) {
    return payload.payments;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.records)) {
    return payload.records;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
};

/* ==========================================================
   FINANCE DASHBOARD
========================================================== */

/**
 * Load all information required by the Finance Dashboard.
 *
 * Combines:
 * 1. Payment statistics
 * 2. Recent payment records
 * 3. Pending manual M-Pesa verification queue
 */
export const getFinanceDashboard = async () => {
  const [
    statisticsResponse,
    paymentsResponse,
    manualMpesaResponse,
  ] = await Promise.all([
    api.get("/payments/admin/statistics"),

    api.get("/payments/admin/all", {
      params: {
        page: 1,
        limit: 8,
      },
    }),

    api.get("/payments/admin/manual-mpesa", {
      params: {
        page: 1,
        limit: 10,
      },
    }),
  ]);

  const statistics = unwrapResponse(statisticsResponse);

  const paymentsPayload = unwrapResponse(paymentsResponse);

  const manualMpesaPayload = unwrapResponse(manualMpesaResponse);

  return {
    success: true,

    data: {
      statistics:
        statistics && typeof statistics === "object"
          ? statistics
          : {},

      recentPayments: normalizeCollection(
        paymentsPayload
      ),

      manualPayments: normalizeCollection(
        manualMpesaPayload
      ),

      paymentsMeta:
        paymentsPayload &&
        typeof paymentsPayload === "object"
          ? paymentsPayload.pagination ||
            paymentsPayload.meta ||
            {}
          : {},

      manualMpesaMeta:
        manualMpesaPayload &&
        typeof manualMpesaPayload === "object"
          ? manualMpesaPayload.pagination ||
            manualMpesaPayload.meta ||
            {}
          : {},
    },
  };
};

/* ==========================================================
   PAYMENT STATISTICS
========================================================== */

/**
 * Get payment statistics.
 *
 * Optional filters:
 * {
 *   startDate: "2026-10-01",
 *   endDate: "2026-10-31"
 * }
 */
export const getPaymentStatistics = async (params = {}) => {
  const response = await api.get(
    "/payments/admin/statistics",
    {
      params,
    }
  );

  return unwrapResponse(response);
};

/* ==========================================================
   PAYMENT RECORDS
========================================================== */

/**
 * Get payment records available to Finance.
 *
 * Supported filters:
 * - status
 * - paymentFor
 * - paymentMethod
 * - search
 * - page
 * - limit
 */
export const getFinancePayments = async ({
  status,
  paymentFor,
  paymentMethod,
  search,
  page = 1,
  limit = 20,
} = {}) => {
  const params = {
    page,
    limit,
  };

  if (status) {
    params.status = status;
  }

  if (paymentFor) {
    params.paymentFor = paymentFor;
  }

  if (paymentMethod) {
    params.paymentMethod = paymentMethod;
  }

  if (search) {
    params.search = search.trim();
  }

  const response = await api.get(
    "/payments/admin/all",
    {
      params,
    }
  );

  return unwrapResponse(response);
};

/* ==========================================================
   SINGLE PAYMENT
========================================================== */

/**
 * Get a payment by its reference.
 */
export const getFinancePayment = async (
  reference
) => {
  if (!reference) {
    throw new Error(
      "Payment reference is required."
    );
  }

  const response = await api.get(
    `/payments/${encodeURIComponent(reference)}`
  );

  return unwrapResponse(response);
};

/* ==========================================================
   MANUAL M-PESA QUEUE
========================================================== */

/**
 * Get payments awaiting manual M-Pesa verification.
 *
 * Supported filters:
 * - page
 * - limit
 * - search
 */
export const getManualMpesaQueue = async ({
  page = 1,
  limit = 20,
  search = "",
} = {}) => {
  const params = {
    page,
    limit,
  };

  if (search) {
    params.search = search.trim();
  }

  const response = await api.get(
    "/payments/admin/manual-mpesa",
    {
      params,
    }
  );

  const payload = unwrapResponse(response);

  return {
    success: true,
    data: normalizeCollection(payload),

    pagination:
      payload &&
      typeof payload === "object"
        ? payload.pagination ||
          payload.meta ||
          {}
        : {},
  };
};

/* ==========================================================
   APPROVE MANUAL M-PESA PAYMENT
========================================================== */

/**
 * Approve a manually submitted M-Pesa payment.
 *
 * The backend handles:
 * - Payment verification
 * - Membership activation
 * - Membership processing
 * - Verification metadata
 */
export const approveManualMpesaPayment = async (
  reference
) => {
  if (!reference) {
    throw new Error(
      "Payment reference is required."
    );
  }

  const response = await api.patch(
    `/payments/admin/approve/${encodeURIComponent(
      reference
    )}`
  );

  return unwrapResponse(response);
};

/* ==========================================================
   MARK PAYMENT AS FAILED
========================================================== */

/**
 * Mark a payment as failed.
 */
export const markPaymentFailed = async (
  reference
) => {
  if (!reference) {
    throw new Error(
      "Payment reference is required."
    );
  }

  const response = await api.patch(
    `/payments/admin/fail/${encodeURIComponent(
      reference
    )}`
  );

  return unwrapResponse(response);
};

/* ==========================================================
   DELETE PENDING PAYMENT
========================================================== */

/**
 * Delete a pending payment.
 *
 * Use this carefully because this is a destructive
 * operation and should eventually be restricted
 * appropriately on the backend.
 */
export const deletePendingPayment = async (
  reference
) => {
  if (!reference) {
    throw new Error(
      "Payment reference is required."
    );
  }

  const response = await api.delete(
    `/payments/admin/${encodeURIComponent(
      reference
    )}`
  );

  return unwrapResponse(response);
};

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

const financeService = {
  getFinanceDashboard,
  getPaymentStatistics,
  getFinancePayments,
  getFinancePayment,
  getManualMpesaQueue,
  approveManualMpesaPayment,
  markPaymentFailed,
  deletePendingPayment,
};

export default financeService;