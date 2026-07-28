import * as paymentService from "../services/payment.service.js";

/* ==========================================================
   HELPERS
========================================================== */

const getRequestMemberId = (req) => {
  return (
    req.member?._id ||
    req.user?.member?._id ||
    req.user?.member ||
    null
  );
};

const getPaginationOptions = (query = {}) => {
  return {
    page: query.page,
    limit: query.limit,
    status: query.status,
    paymentFor: query.paymentFor,
  };
};

/* ==========================================================
   INITIATE MEMBERSHIP PAYMENT
========================================================== */

export const initiateMembershipPayment = async (
  req,
  res,
  next
) => {
  try {
    const memberId = getRequestMemberId(req);

    if (!memberId) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found.",
      });
    }

    const { phoneNumber } = req.body;

    const result =
      await paymentService.initiateMembershipPayment(
        memberId,
        {
          phoneNumber,
        }
      );

    return res.status(200).json({
      success: true,

      message:
        result.customerMessage ||
        result.message ||
        "M-Pesa payment prompt sent successfully.",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   INITIATE MEMBERSHIP RENEWAL PAYMENT
========================================================== */

export const initiateRenewalPayment = async (
  req,
  res,
  next
) => {
  try {
    const memberId = getRequestMemberId(req);

    if (!memberId) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found.",
      });
    }

    const { phoneNumber } = req.body;

    const result =
      await paymentService.initiateRenewalPayment(
        memberId,
        {
          phoneNumber,
        }
      );

    return res.status(200).json({
      success: true,

      message:
        result.customerMessage ||
        result.message ||
        "M-Pesa renewal prompt sent successfully.",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   INITIATE EXISTING PAYMENT
========================================================== */

export const initiatePayment = async (
  req,
  res,
  next
) => {
  try {
    const { paymentId, reference, phoneNumber } =
      req.body;

    if (!paymentId && !reference) {
      return res.status(400).json({
        success: false,
        message:
          "Payment ID or payment reference is required.",
      });
    }

    const result =
      await paymentService.initiatePayment({
        paymentId,
        reference,
        phoneNumber,
      });

    return res.status(200).json({
      success: true,

      message:
        result.customerMessage ||
        result.message ||
        "M-Pesa payment prompt sent successfully.",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   M-PESA CALLBACK
========================================================== */

export const mpesaCallback = async (
  req,
  res
) => {
  try {
    const result =
      await paymentService.processMpesaCallback(
        req.body
      );

    /*
     * Safaricom expects a successful HTTP response
     * after the callback has been received.
     */
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc:
        "Callback received successfully.",
      success: true,
      data: result,
    });
  } catch (error) {
    /*
     * Log the error internally, but still acknowledge
     * the callback to avoid repeated callback delivery.
     */
    console.error(
      "M-Pesa callback processing error:",
      {
        message: error.message,
        stack:
          process.env.NODE_ENV ===
          "development"
            ? error.stack
            : undefined,
      }
    );

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc:
        "Callback received.",
      success: false,
    });
  }
};

/* ==========================================================
   QUERY PAYMENT STATUS
========================================================== */

export const queryPaymentStatus = async (
  req,
  res,
  next
) => {
  try {
    const paymentId =
      req.params.paymentId ||
      req.body.paymentId ||
      null;

    const reference =
      req.params.reference ||
      req.body.reference ||
      null;

    if (!paymentId && !reference) {
      return res.status(400).json({
        success: false,
        message:
          "Payment ID or payment reference is required.",
      });
    }

    const result =
      await paymentService.queryPaymentStatus({
        paymentId,
        reference,
      });

    return res.status(200).json({
      success: true,
      message:
        "Payment status retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   RETRY PAYMENT
========================================================== */

export const retryPayment = async (
  req,
  res,
  next
) => {
  try {
    const paymentId =
      req.params.paymentId ||
      req.body.paymentId ||
      null;

    const reference =
      req.params.reference ||
      req.body.reference ||
      null;

    const { phoneNumber } = req.body;

    if (!paymentId && !reference) {
      return res.status(400).json({
        success: false,
        message:
          "Payment ID or payment reference is required.",
      });
    }

    const result =
      await paymentService.retryPayment({
        paymentId,
        reference,
        phoneNumber,
      });

    return res.status(200).json({
      success: true,

      message:
        result.customerMessage ||
        result.message ||
        "M-Pesa payment prompt sent again successfully.",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   MEMBER PAYMENT HISTORY
========================================================== */

export const getPaymentHistory = async (
  req,
  res,
  next
) => {
  try {
    const memberId = getRequestMemberId(req);

    if (!memberId) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found.",
      });
    }

    const result =
      await paymentService.getPaymentHistory(
        memberId,
        getPaginationOptions(req.query)
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment history retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET PAYMENT BY REFERENCE
========================================================== */

export const getPayment = async (
  req,
  res,
  next
) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message:
          "Payment reference is required.",
      });
    }

    const payment =
      await paymentService.getPaymentByReference(
        reference
      );

    /*
     * Prevent an ordinary member from viewing
     * another member's payment.
     */
    const requestMemberId =
      getRequestMemberId(req);

    const paymentMemberId =
      payment.member?._id?.toString?.() ||
      payment.member?.toString?.() ||
      null;

    const isAdmin =
      req.user?.role &&
      [
        "admin",
        "finance",
        "super_admin",
      ].includes(req.user.role);

    if (
      requestMemberId &&
      paymentMemberId &&
      requestMemberId.toString() !==
        paymentMemberId &&
      !isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this payment.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Payment retrieved successfully.",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET PAYMENT BY ID
========================================================== */

export const getPaymentById = async (
  req,
  res,
  next
) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required.",
      });
    }

    const payment =
      await paymentService.getPaymentById(
        paymentId
      );

    const requestMemberId =
      getRequestMemberId(req);

    const paymentMemberId =
      payment.member?._id?.toString?.() ||
      payment.member?.toString?.() ||
      null;

    const isAdmin =
      req.user?.role &&
      [
        "admin",
        "finance",
        "super_admin",
      ].includes(req.user.role);

    if (
      requestMemberId &&
      paymentMemberId &&
      requestMemberId.toString() !==
        paymentMemberId &&
      !isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this payment.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Payment retrieved successfully.",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   ADMIN - GET ALL PAYMENTS
========================================================== */

export const getAllPayments = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await paymentService.getAllPayments({
        status: req.query.status,
        paymentFor:
          req.query.paymentFor,
        paymentMethod:
          req.query.paymentMethod,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
      });

    return res.status(200).json({
      success: true,
      message:
        "Payments retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   ADMIN - PAYMENT STATISTICS
========================================================== */

export const getPaymentStatistics = async (
  req,
  res,
  next
) => {
  try {
    const statistics =
      await paymentService.getPaymentStatistics({
        startDate:
          req.query.startDate || null,

        endDate:
          req.query.endDate || null,
      });

    return res.status(200).json({
      success: true,
      message:
        "Payment statistics retrieved successfully.",
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   ADMIN - MARK PAYMENT FAILED
========================================================== */

export const markPaymentFailed = async (
  req,
  res,
  next
) => {
  try {
    const { reference } = req.params;
    const { reason } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message:
          "Payment reference is required.",
      });
    }

    const payment =
      await paymentService.markPaymentFailed(
        reference,
        reason ||
          "Payment marked as failed by an administrator."
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment marked as failed successfully.",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   ADMIN - DELETE INCOMPLETE PAYMENT
========================================================== */

export const deletePendingPayment = async (
  req,
  res,
  next
) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message:
          "Payment reference is required.",
      });
    }

    await paymentService.deletePendingPayment(
      reference
    );

    return res.status(200).json({
      success: true,
      message:
        "Payment deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   EXPORT
========================================================== */

export default {
  initiateMembershipPayment,
  initiateRenewalPayment,
  initiatePayment,

  mpesaCallback,
  queryPaymentStatus,
  retryPayment,

  getPaymentHistory,
  getPayment,
  getPaymentById,

  getAllPayments,
  getPaymentStatistics,

  markPaymentFailed,
  deletePendingPayment,
};