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

    const {
      phoneNumber = null,
      email = null,
      fullName = null,
      method = "M-PESA",
      redirectUrl = null,
    } = req.body || {};

    const result =
      await paymentService.initiateMembershipPayment(
        memberId,
        {
          phoneNumber,
          email,
          fullName,
          method,
          redirectUrl,
        }
      );

    return res.status(200).json({
      success: true,
      message:
        result.message ||
        "IntaSend checkout created successfully.",
      data: {
        payment: result.payment,
        member: result.member,
        reference: result.reference,
        amount: result.amount,
        checkoutUrl: result.checkoutUrl,
        invoiceId: result.invoiceId,
        reused: Boolean(result.reused),
        isExisting: Boolean(result.isExisting),
        alreadyCompleted: Boolean(
          result.alreadyCompleted
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const initiateManualMembershipPayment = async (
  req,
  res,
  next
) => {
  try {
    if (!req.member?._id) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found.",
      });
    }

    const result =
      await paymentService.createManualMembershipPayment(
        req.member._id
      );

    return res.status(201).json({
      success: true,
      message:
        result.isExisting
          ? "An existing manual M-Pesa membership payment was found."
          : "Manual M-Pesa membership payment created successfully.",
      data: {
        payment: result.payment,
        member: result.member,
        amount: result.amount,
        reference: result.reference,
        isExisting: result.isExisting,
      },
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

    const {
      phoneNumber = null,
      email = null,
      fullName = null,
      method = "M-PESA",
      redirectUrl = null,
    } = req.body || {};

    const result =
      await paymentService.initiateRenewalPayment(
        memberId,
        {
          phoneNumber,
          email,
          fullName,
          method,
          redirectUrl,
        }
      );

    return res.status(200).json({
      success: true,
      message:
        result.message ||
        "IntaSend renewal checkout created successfully.",
      data: {
        payment: result.payment,
        member: result.member,
        reference: result.reference,
        amount: result.amount,
        checkoutUrl: result.checkoutUrl,
        invoiceId: result.invoiceId,
        reused: Boolean(result.reused),
        isExisting: Boolean(result.isExisting),
        alreadyCompleted: Boolean(
          result.alreadyCompleted
        ),
      },
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
    const {
      paymentId = null,
      reference = null,
      phoneNumber = null,
      email = null,
      fullName = null,
      method = "M-PESA",
      redirectUrl = null,
    } = req.body || {};

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
        email,
        fullName,
        method,
        redirectUrl,
      });

    return res.status(200).json({
      success: true,
      message:
        result.message ||
        "IntaSend checkout created successfully.",
      data: {
        payment: result.payment,
        reference: result.reference,
        checkoutUrl: result.checkoutUrl,
        invoiceId: result.invoiceId,
        reused: Boolean(result.reused),
        alreadyCompleted: Boolean(
          result.alreadyCompleted
        ),
      },
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
          process.env.NODE_ENV === "development"
            ? error.stack
            : undefined,
      }
    );

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Callback received.",
      success: false,
    });
  }
};

/* ==========================================================
   MANUAL M-PESA CONFIRMATION
========================================================== */

/*
 * Used when the customer has successfully paid through
 * M-Pesa but the IntaSend browser redirect/callback was
 * missed or the frontend was closed.
 *
 * The service performs:
 *   1. Ownership verification
 *   2. Confirmation-code validation
 *   3. Duplicate-code protection
 *   4. IntaSend status query
 *   5. Payment verification
 *   6. Membership/renewal fulfillment
 */
export const confirmMpesaPayment = async (
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

    const {
      reference,
      confirmationCode,
    } = req.body || {};

    /*
     * Route-level validation should normally catch this.
     * This additional guard protects the controller if it
     * is called directly or the validator is bypassed.
     */
    if (!reference || !confirmationCode) {
      return res.status(400).json({
        success: false,
        message:
          "Payment reference and M-Pesa confirmation code are required.",
      });
    }

    const result =
      await paymentService.confirmManualMpesaPayment({
        memberId,
        reference,
        confirmationCode,
      });

    return res.status(200).json({
      success: true,
      message:
        result.message ||
        "M-Pesa payment verification completed.",
      data: {
        completed: Boolean(
          result.completed
        ),
        verificationStatus:
          result.verificationStatus,
        payment: result.payment,
      },
    });
  } catch (error) {
    next(error);
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
      req.params?.paymentId ||
      req.body?.paymentId ||
      null;

    const reference =
      req.params?.reference ||
      req.body?.reference ||
      req.body?.paymentReference ||
      null;

    const invoiceId =
      req.params?.invoiceId ||
      req.body?.invoiceId ||
      null;

    if (
      !paymentId &&
      !reference &&
      !invoiceId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment ID, payment reference or IntaSend invoice ID is required.",
      });
    }

    const result =
      await paymentService.queryPaymentStatus({
        paymentId,
        reference,
        invoiceId,
      });

    return res.status(200).json({
      success: true,
      message:
        result.completed
          ? "Payment completed and verified successfully."
          : "Payment status retrieved successfully.",
      data: {
        completed: Boolean(
          result.completed
        ),
        payment: result.payment,
        invoice: result.invoice || null,
      },
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
      req.params?.paymentId ||
      req.body?.paymentId ||
      null;

    const reference =
      req.params?.reference ||
      req.body?.reference ||
      null;

    const {
      phoneNumber = null,
      email = null,
      fullName = null,
      method = "M-PESA",
      redirectUrl = null,
    } = req.body || {};

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
        email,
        fullName,
        method,
        redirectUrl,
      });

    return res.status(200).json({
      success: true,
      message:
        result.message ||
        "A new IntaSend checkout was created successfully.",
      data: {
        payment: result.payment,
        reference: result.reference,
        checkoutUrl: result.checkoutUrl,
        invoiceId: result.invoiceId,
        reused: Boolean(result.reused),
      },
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

export const getManualMpesaQueue = async (req, res, next) => {
  try {
    const result = await paymentService.getManualMpesaQueue({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });

    return res.status(200).json({
      success: true,
      message: "Manual M-Pesa payment queue retrieved successfully.",
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
   ADMIN / FINANCE - APPROVE MANUAL M-PESA PAYMENT
========================================================== */

export const approveManualMpesaPayment = async (
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
      await paymentService.approveManualMpesaPayment(
        reference,
        req.user._id
      );

    return res.status(200).json({
      success: true,
      message:
        "Manual M-Pesa payment approved successfully.",
      data: payment,
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
  initiateManualMembershipPayment,
  initiateRenewalPayment,
  initiatePayment,

  mpesaCallback,
  confirmMpesaPayment,
  approveManualMpesaPayment,
  queryPaymentStatus,
  retryPayment,

  getPaymentHistory,
  getPayment,
  getPaymentById,

  getAllPayments,
  getManualMpesaQueue,
  getPaymentStatistics,

  markPaymentFailed,
  deletePendingPayment,
};