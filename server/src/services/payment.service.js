import { randomUUID } from "node:crypto";

import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
import ActivityLog from "../models/ActivityLog.js";

import AppError from "../utils/AppError.js";

import {
  MEMBERSHIP,
  getMembershipFee,
} from "../config/membership.js";

import mpesaConfig from "../config/mpesa.config.js";

import {
  initiateMpesaStkPush,
  queryMpesaStkPushStatus,
  parseMpesaStkCallback,
  normalizeMpesaPhoneNumber,
  getMpesaResultStatus,
  MpesaServiceError,
} from "./mpesa.service.js";

/* ==========================================================
   CONSTANTS
========================================================== */

const PENDING_PAYMENT_STATUSES = [
  "pending",
  "processing",
];

const FINAL_PAYMENT_STATUSES = [
  "successful",
  "failed",
  "cancelled",
  "expired",
  "refunded",
];

const PAYMENT_EXPIRY_MINUTES = Number(
  process.env.PAYMENT_EXPIRY_MINUTES || 30
);

/* ==========================================================
   REFERENCE HELPERS
========================================================== */

function generateReference(prefix = "PAY") {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const random = randomUUID()
    .replace(/-/g, "")
    .substring(0, 10)
    .toUpperCase();

  return `JVP-${prefix}-${date}-${random}`;
}

function generateAccountReference({
  paymentFor,
  member,
}) {
  const typePrefix = {
    membership: "MEM",
    renewal: "REN",
    event: "EVT",
    summit: "SUM",
    donation: "DON",
  }[paymentFor] || "PAY";

  const memberReference =
    member?.memberNumber ||
    member?._id?.toString()?.slice(-6) ||
    "JVP";

  /*
   * M-Pesa account references should remain short.
   */
  return `${typePrefix}-${memberReference}`
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .substring(0, 12)
    .toUpperCase();
}

function getTransactionDescription(paymentFor) {
  const descriptions = {
    membership: "JVP Membership",
    renewal: "JVP Renewal",
    event: "JVP Event",
    summit: "JVP Summit",
    donation: "JVP Donation",
  };

  return (
    descriptions[paymentFor] ||
    "JVP Payment"
  ).substring(0, 13);
}

function calculatePaymentExpiry() {
  const expiryDate = new Date();

  expiryDate.setMinutes(
    expiryDate.getMinutes() +
      PAYMENT_EXPIRY_MINUTES
  );

  return expiryDate;
}

/* ==========================================================
   MEMBERSHIP DATE HELPERS
========================================================== */

function calculateMembershipExpiry(
  startingDate = new Date()
) {
  const expiryDate = new Date(startingDate);

  expiryDate.setFullYear(
    expiryDate.getFullYear() + 1
  );

  return expiryDate;
}

function calculateRenewalExpiry(member) {
  const now = new Date();

  const existingExpiry =
    member.membershipExpiry instanceof Date
      ? member.membershipExpiry
      : member.membershipExpiry
        ? new Date(member.membershipExpiry)
        : null;

  const renewalStart =
    existingExpiry &&
    !Number.isNaN(existingExpiry.getTime()) &&
    existingExpiry > now
      ? existingExpiry
      : now;

  return calculateMembershipExpiry(
    renewalStart
  );
}

/* ==========================================================
   ACTIVITY LOG HELPER
========================================================== */

async function createActivityLog({
  user,
  action,
  module = "payments",
  description,
  targetId = null,
  metadata = {},
}) {
  try {
    if (!user) {
      return null;
    }

    return await ActivityLog.create({
      user,
      action,
      module,
      description,
      targetId,
      metadata,
    });
  } catch (error) {
    /*
     * Payment processing must not fail only because
     * activity logging failed.
     */
    console.error(
      "Unable to create payment activity log:",
      error.message
    );

    return null;
  }
}

/* ==========================================================
   MEMBER HELPERS
========================================================== */

async function findMember(memberId) {
  const member = await Member.findById(
    memberId
  ).populate(
    "user",
    "email role isActive"
  );

  if (!member) {
    throw new AppError(
      "Member not found.",
      404
    );
  }

  return member;
}

function getMemberUserId(member) {
  return (
    member?.user?._id ||
    member?.user ||
    null
  );
}

function getMemberPhone(member, phoneNumber) {
  const resolvedPhone =
    phoneNumber || member.phone;

  if (!resolvedPhone) {
    throw new AppError(
      "A phone number is required for M-Pesa payment.",
      400
    );
  }

  try {
    return normalizeMpesaPhoneNumber(
      resolvedPhone
    );
  } catch (error) {
    throw new AppError(
      error.message ||
        "Enter a valid Safaricom phone number.",
      error.statusCode || 400
    );
  }
}

/* ==========================================================
   PAYMENT HELPERS
========================================================== */

async function findPaymentByReference(
  reference,
  {
    populateMember = true,
    includeGatewayData = false,
  } = {}
) {
  let query = Payment.findOne({
    reference: String(reference || "")
      .trim()
      .toUpperCase(),
  });

  if (includeGatewayData) {
    query = query.select(
      "+gatewayResponse +callbackPayload"
    );
  }

  if (populateMember) {
    query = query.populate({
      path: "member",
      populate: {
        path: "user",
        select:
          "email role isActive",
      },
    });
  }

  const payment = await query;

  if (!payment) {
    throw new AppError(
      "Payment not found.",
      404
    );
  }

  return payment;
}

async function findPaymentById(
  paymentId,
  {
    includeGatewayData = false,
  } = {}
) {
  let query = Payment.findById(paymentId);

  if (includeGatewayData) {
    query = query.select(
      "+gatewayResponse +callbackPayload"
    );
  }

  const payment = await query.populate({
    path: "member",
    populate: {
      path: "user",
      select:
        "email role isActive",
    },
  });

  if (!payment) {
    throw new AppError(
      "Payment not found.",
      404
    );
  }

  return payment;
}

async function getReusablePayment({
  memberId,
  paymentFor,
}) {
  const now = new Date();

  const payment = await Payment.findOne({
    member: memberId,

    paymentFor,

    paymentMethod: "mpesa",

    status: {
      $in: PENDING_PAYMENT_STATUSES,
    },

    $or: [
      {
        expiresAt: null,
      },
      {
        expiresAt: {
          $gt: now,
        },
      },
    ],
  }).sort({
    createdAt: -1,
  });

  return payment;
}

async function expireOldPayments({
  memberId,
  paymentFor,
}) {
  const now = new Date();

  await Payment.updateMany(
    {
      member: memberId,

      paymentFor,

      status: {
        $in: PENDING_PAYMENT_STATUSES,
      },

      expiresAt: {
        $ne: null,
        $lte: now,
      },
    },
    {
      $set: {
        status: "expired",
        statusMessage:
          "The payment request expired.",
        failureReason:
          "Payment request expired before completion.",
      },
    }
  );
}

/* ==========================================================
   CREATE PAYMENT RECORD
========================================================== */

export const createPayment = async ({
  memberId = null,
  userId = null,

  eventId = null,
  registrationId = null,
  summitRegistrationId = null,

  paymentFor,
  amount,
  currency = "KES",

  phoneNumber,

  accountReference,
  description,

  metadata = {},
}) => {
  let member = null;

  if (memberId) {
    member = await findMember(memberId);
  }

  if (
    ["membership", "renewal"].includes(
      paymentFor
    ) &&
    !member
  ) {
    throw new AppError(
      "A member is required for this payment.",
      400
    );
  }

  const normalizedAmount = Number(amount);

  if (
    !Number.isFinite(normalizedAmount) ||
    normalizedAmount <= 0
  ) {
    throw new AppError(
      "Payment amount must be greater than zero.",
      400
    );
  }

  const normalizedPhone =
    getMemberPhone(
      member,
      phoneNumber
    );

  const referencePrefix = {
    membership: "MEM",
    renewal: "REN",
    event: "EVT",
    summit: "SUM",
    donation: "DON",
  }[paymentFor] || "PAY";

  const reference =
    generateReference(referencePrefix);

  const resolvedAccountReference =
    accountReference ||
    generateAccountReference({
      paymentFor,
      member,
    });

  const resolvedDescription =
    description ||
    getTransactionDescription(
      paymentFor
    );

  const payment = await Payment.create({
    member: member?._id || null,

    user:
      userId ||
      getMemberUserId(member),

    event: eventId,
    registration: registrationId,

    summitRegistration:
      summitRegistrationId,

    reference,

    accountReference:
      resolvedAccountReference,

    description:
      resolvedDescription,

    paymentFor,

    amount: Math.round(
      normalizedAmount
    ),

    currency,

    paymentMethod: "mpesa",

    phoneNumber:
      normalizedPhone,

    status: "pending",

    initiatedBy:
      userId ||
      getMemberUserId(member),

    createdBy:
      userId ||
      getMemberUserId(member),

    expiresAt:
      calculatePaymentExpiry(),

    metadata: {
      ...metadata,

      environment:
        mpesaConfig.environment,

      transactionType:
        mpesaConfig.transactionType,
    },

    mpesa: {
      transactionType:
        mpesaConfig.transactionType,

      businessShortCode:
        mpesaConfig.shortCode,
    },
  });

  await createActivityLog({
    user:
      userId ||
      getMemberUserId(member),

    action:
      "Payment record created",

    description:
      `${paymentFor} payment record created.`,

    targetId: payment._id,

    metadata: {
      reference,
      amount: payment.amount,
      currency: payment.currency,
      paymentFor,
    },
  });

  return {
    member,
    payment,
    isExisting: false,
  };
};

/* ==========================================================
   CREATE MEMBERSHIP PAYMENT
========================================================== */

export const createMembershipPayment =
  async (
    memberId,
    {
      phoneNumber = null,
    } = {}
  ) => {
    const member =
      await findMember(memberId);

    if (
      member.membershipStatus ===
        MEMBERSHIP.status.ACTIVE &&
      member.membershipFeePaid
    ) {
      throw new AppError(
        "Membership is already active.",
        400
      );
    }

    await expireOldPayments({
      memberId: member._id,
      paymentFor: "membership",
    });

    const reusablePayment =
      await getReusablePayment({
        memberId: member._id,
        paymentFor: "membership",
      });

    if (reusablePayment) {
      return {
        member,
        payment: reusablePayment,
        amount:
          reusablePayment.amount,
        reference:
          reusablePayment.reference,
        isExisting: true,
      };
    }

    const amount = getMembershipFee(
      member.membershipType
    );

    const result = await createPayment({
      memberId: member._id,

      paymentFor: "membership",

      amount,

      currency:
        MEMBERSHIP.currency || "KES",

      phoneNumber,

      metadata: {
        membershipType:
          member.membershipType,
      },
    });

    return {
      ...result,
      amount:
        result.payment.amount,
      reference:
        result.payment.reference,
    };
  };

/* ==========================================================
   CREATE RENEWAL PAYMENT
========================================================== */

export const createRenewalPayment =
  async (
    memberId,
    {
      phoneNumber = null,
    } = {}
  ) => {
    const member =
      await findMember(memberId);

    await expireOldPayments({
      memberId: member._id,
      paymentFor: "renewal",
    });

    const reusablePayment =
      await getReusablePayment({
        memberId: member._id,
        paymentFor: "renewal",
      });

    if (reusablePayment) {
      return {
        member,
        payment: reusablePayment,
        amount:
          reusablePayment.amount,
        reference:
          reusablePayment.reference,
        isExisting: true,
      };
    }

    const amount = getMembershipFee(
      member.membershipType
    );

    const result = await createPayment({
      memberId: member._id,

      paymentFor: "renewal",

      amount,

      currency:
        MEMBERSHIP.currency || "KES",

      phoneNumber,

      metadata: {
        membershipType:
          member.membershipType,

        previousExpiry:
          member.membershipExpiry ||
          null,
      },
    });

    return {
      ...result,
      amount:
        result.payment.amount,
      reference:
        result.payment.reference,
    };
  };

/* ==========================================================
   INITIATE STK PUSH
========================================================== */

export const initiatePayment = async ({
  paymentId = null,
  reference = null,
  phoneNumber = null,
}) => {
  let payment;

  if (paymentId) {
    payment = await findPaymentById(
      paymentId,
      {
        includeGatewayData: true,
      }
    );
  } else if (reference) {
    payment =
      await findPaymentByReference(
        reference,
        {
          includeGatewayData: true,
        }
      );
  } else {
    throw new AppError(
      "Payment ID or reference is required.",
      400
    );
  }

  if (
    payment.status === "successful"
  ) {
    return {
      success: true,

      alreadyCompleted: true,

      message:
        "Payment has already been completed.",

      payment,
    };
  }

  if (
    FINAL_PAYMENT_STATUSES.includes(
      payment.status
    ) &&
    payment.status !== "failed"
  ) {
    throw new AppError(
      `A ${payment.status} payment cannot be initiated again.`,
      400
    );
  }

  if (
    payment.expiresAt &&
    payment.expiresAt <= new Date()
  ) {
    payment.status = "expired";
    payment.statusMessage =
      "The payment request expired.";

    await payment.save();

    throw new AppError(
      "This payment request has expired. Start a new payment.",
      400
    );
  }

  const normalizedPhone =
    getMemberPhone(
      payment.member,
      phoneNumber ||
        payment.phoneNumber
    );

  payment.phoneNumber =
    normalizedPhone;

  payment.status = "pending";

  await payment.save();

  try {
    const response =
      await initiateMpesaStkPush({
        phoneNumber:
          normalizedPhone,

        amount: payment.amount,

        accountReference:
          payment.accountReference,

        transactionDescription:
          payment.description,
      });

    await payment.markAsProcessing({
      merchantRequestId:
        response.merchantRequestId,

      checkoutRequestId:
        response.checkoutRequestId,

      responseCode:
        response.responseCode,

      responseDescription:
        response.responseDescription,

      customerMessage:
        response.customerMessage,

      gatewayResponse:
        response.rawResponse,
    });

    payment.phoneNumber =
      response.phoneNumber;

    payment.mpesa.transactionType =
      mpesaConfig.transactionType;

    payment.mpesa.businessShortCode =
      mpesaConfig.shortCode;

    payment.gatewayReference =
      response.checkoutRequestId;

    await payment.save();

    await createActivityLog({
      user:
        getMemberUserId(
          payment.member
        ) ||
        payment.user,

      action:
        "M-Pesa STK Push initiated",

      description:
        "M-Pesa payment prompt sent to the customer.",

      targetId: payment._id,

      metadata: {
        reference:
          payment.reference,

        checkoutRequestId:
          response.checkoutRequestId,

        amount:
          payment.amount,

        phoneNumber:
          payment.phoneNumber,
      },
    });

    return {
      success: true,

      message:
        response.customerMessage ||
        "M-Pesa payment prompt sent successfully.",

      payment,

      reference:
        payment.reference,

      merchantRequestId:
        response.merchantRequestId,

      checkoutRequestId:
        response.checkoutRequestId,

      customerMessage:
        response.customerMessage,
    };
  } catch (error) {
    payment.status = "failed";

    payment.failureReason =
      error.message ||
      "Unable to initiate M-Pesa payment.";

    payment.statusMessage =
      payment.failureReason;

    payment.failedAt =
      new Date();

    payment.gatewayResponse =
      error.details || null;

    await payment.save();

    await createActivityLog({
      user:
        getMemberUserId(
          payment.member
        ) ||
        payment.user,

      action:
        "M-Pesa STK Push failed",

      description:
        "M-Pesa payment prompt could not be initiated.",

      targetId: payment._id,

      metadata: {
        reference:
          payment.reference,

        error:
          error.message,

        code:
          error.code || null,
      },
    });

    if (
      error instanceof MpesaServiceError
    ) {
      throw new AppError(
        error.message,
        error.statusCode || 502
      );
    }

    throw error;
  }
};

/* ==========================================================
   INITIATE MEMBERSHIP PAYMENT
========================================================== */

export const initiateMembershipPayment =
  async (
    memberId,
    {
      phoneNumber = null,
    } = {}
  ) => {
    const {
      payment,
      member,
      isExisting,
    } =
      await createMembershipPayment(
        memberId,
        {
          phoneNumber,
        }
      );

    const result =
      await initiatePayment({
        paymentId: payment._id,

        phoneNumber:
          phoneNumber ||
          member.phone,
      });

    return {
      ...result,
      isExisting,
    };
  };

/* ==========================================================
   INITIATE RENEWAL PAYMENT
========================================================== */

export const initiateRenewalPayment =
  async (
    memberId,
    {
      phoneNumber = null,
    } = {}
  ) => {
    const {
      payment,
      member,
      isExisting,
    } =
      await createRenewalPayment(
        memberId,
        {
          phoneNumber,
        }
      );

    const result =
      await initiatePayment({
        paymentId: payment._id,

        phoneNumber:
          phoneNumber ||
          member.phone,
      });

    return {
      ...result,
      isExisting,
    };
  };

/* ==========================================================
   ACTIVATE MEMBERSHIP
========================================================== */

export const activateMembership =
  async (memberId) => {
    const member =
      await findMember(memberId);

    if (
      member.membershipStatus ===
        MEMBERSHIP.status.ACTIVE &&
      member.membershipFeePaid
    ) {
      return member;
    }

    member.membershipFeePaid = true;
    member.accountActivated = true;

    member.membershipStatus =
      MEMBERSHIP.status.ACTIVE;

    member.membershipExpiry =
      calculateMembershipExpiry();

    await member.save();

    await createActivityLog({
      user:
        getMemberUserId(member),

      action:
        "Membership activated",

      module: "members",

      description:
        "Membership activated after successful M-Pesa payment.",

      targetId: member._id,
    });

    return member;
  };

/* ==========================================================
   RENEW MEMBERSHIP
========================================================== */

export const renewMembership =
  async (memberId) => {
    const member =
      await findMember(memberId);

    member.membershipFeePaid = true;

    member.membershipStatus =
      MEMBERSHIP.status.ACTIVE;

    member.membershipExpiry =
      calculateRenewalExpiry(member);

    await member.save();

    await createActivityLog({
      user:
        getMemberUserId(member),

      action:
        "Membership renewed",

      module: "members",

      description:
        "Membership renewed after successful M-Pesa payment.",

      targetId: member._id,

      metadata: {
        membershipExpiry:
          member.membershipExpiry,
      },
    });

    return member;
  };

/* ==========================================================
   PROCESS SUCCESSFUL PAYMENT
========================================================== */

async function processSuccessfulPayment(
  payment
) {
  if (!payment.membershipProcessed) {
  try {
    await processSuccessfulPayment(payment);
  } catch (error) {
    payment.membershipProcessingError =
      error.message;

    await payment.save();

    throw error;
  }
}

  if (
    payment.paymentFor ===
    "renewal"
  ) {
    if (
      !payment.membershipProcessed
    ) {
      await renewMembership(
        payment.member._id ||
          payment.member
      );

      payment.membershipProcessed =
        true;

      payment.membershipProcessedAt =
        new Date();

      payment.membershipProcessingError =
        null;

      await payment.save();
    }

    return payment;
  }

  /*
   * Event and summit processing will be connected
   * to their respective registration services.
   */
  return payment;
}

/* ==========================================================
   VALIDATE CALLBACK
========================================================== */

function validateSuccessfulCallback({
  payment,
  callback,
}) {
  if (!callback.receiptNumber) {
    throw new AppError(
      "M-Pesa callback did not include a receipt number.",
      400
    );
  }

  if (
    callback.amount === null ||
    Number(callback.amount) !==
      Number(payment.amount)
  ) {
    throw new AppError(
      "M-Pesa callback amount does not match the payment amount.",
      400
    );
  }

  if (
    callback.phoneNumber &&
    payment.phoneNumber
  ) {
    const callbackPhone =
      normalizeMpesaPhoneNumber(
        callback.phoneNumber
      );

    const paymentPhone =
      normalizeMpesaPhoneNumber(
        payment.phoneNumber
      );

    if (
      callbackPhone !==
      paymentPhone
    ) {
      throw new AppError(
        "M-Pesa callback phone number does not match the payment phone number.",
        400
      );
    }
  }
}

/* ==========================================================
   PROCESS M-PESA CALLBACK
========================================================== */

export const processMpesaCallback =
  async (payload) => {
    const callback =
      parseMpesaStkCallback(
        payload
      );

    if (
      !callback.checkoutRequestId
    ) {
      throw new AppError(
        "M-Pesa callback is missing CheckoutRequestID.",
        400
      );
    }

    const payment =
      await Payment.findByCheckoutRequestId(
        callback.checkoutRequestId
      )
        .select(
          "+gatewayResponse +callbackPayload"
        )
        .populate({
          path: "member",

          populate: {
            path: "user",

            select:
              "email role isActive",
          },
        });

    if (!payment) {
      console.error(
        "M-Pesa callback payment not found:",
        callback.checkoutRequestId
      );

      return {
        success: false,
        ignored: true,

        message:
          "Payment record was not found.",

        checkoutRequestId:
          callback.checkoutRequestId,
      };
    }

    /*
     * Idempotency: Safaricom can send a callback
     * more than once.
     */
    if (
      payment.status ===
        "successful" &&
      payment.isVerified
    ) {
      return {
        success: true,
        alreadyProcessed: true,
        payment,
      };
    }

    payment.callbackPayload =
      payload;

    payment.mpesa.callbackReceived =
      true;

    payment.mpesa.callbackReceivedAt =
      new Date();

    payment.mpesa.merchantRequestId =
      callback.merchantRequestId ||
      payment.mpesa
        .merchantRequestId;

    payment.mpesa.checkoutRequestId =
      callback.checkoutRequestId;

    payment.mpesa.resultCode =
      callback.resultCode;

    payment.mpesa.resultDescription =
      callback.resultDescription;

    if (!callback.successful) {
      const callbackStatus =
        getMpesaResultStatus(
          callback.resultCode
        );

      payment.status =
        callbackStatus;

      payment.statusMessage =
        callback.resultDescription ||
        "M-Pesa payment was not completed.";

      payment.failureReason =
        payment.statusMessage;

      if (
        callbackStatus === "cancelled"
      ) {
        payment.cancelledAt =
          new Date();
      } else if (
        callbackStatus === "expired"
      ) {
        payment.failedAt =
          new Date();
      } else {
        payment.failedAt =
          new Date();
      }

      await payment.save();

      await createActivityLog({
        user:
          getMemberUserId(
            payment.member
          ) ||
          payment.user,

        action:
          `M-Pesa payment ${callbackStatus}`,

        description:
          callback.resultDescription ||
          "M-Pesa payment was not completed.",

        targetId:
          payment._id,

        metadata: {
          reference:
            payment.reference,

          resultCode:
            callback.resultCode,

          checkoutRequestId:
            callback.checkoutRequestId,
        },
      });

      return {
        success: false,

        status:
          callbackStatus,

        payment,

        message:
          callback.resultDescription ||
          "Payment was not completed.",
      };
    }

    validateSuccessfulCallback({
      payment,
      callback,
    });

    const duplicateReceipt =
      await Payment.findOne({
        "mpesa.receiptNumber":
          callback.receiptNumber,

        _id: {
          $ne: payment._id,
        },
      });

    if (duplicateReceipt) {
      throw new AppError(
        "This M-Pesa receipt has already been used for another payment.",
        409
      );
    }

    await payment.markAsSuccessful({
      receiptNumber:
        callback.receiptNumber,

      transactionDate:
        callback.transactionDate,

      resultCode:
        callback.resultCode,

      resultDescription:
        callback.resultDescription,

      callbackPayload:
        payload,

      verificationMethod:
        "callback",
    });

    payment.receiptNumber =
      callback.receiptNumber;

    await payment.save();

    try {
      await processSuccessfulPayment(
        payment
      );
    } catch (error) {
      payment.membershipProcessingError =
        error.message;

      await payment.save();

      console.error(
        "Payment completed but post-payment processing failed:",
        error.message
      );

      throw new AppError(
        "Payment was successful, but account processing could not be completed automatically.",
        500
      );
    }

    await createActivityLog({
      user:
        getMemberUserId(
          payment.member
        ) ||
        payment.user,

      action:
        "M-Pesa payment verified",

      description:
        "M-Pesa payment completed and verified successfully.",

      targetId:
        payment._id,

      metadata: {
        reference:
          payment.reference,

        receiptNumber:
          callback.receiptNumber,

        amount:
          callback.amount,

        checkoutRequestId:
          callback.checkoutRequestId,
      },
    });

    return {
      success: true,

      message:
        "Payment completed successfully.",

      payment,
    };
  };

/* ==========================================================
   QUERY M-PESA PAYMENT STATUS
========================================================== */

export const queryPaymentStatus =
  async ({
    paymentId = null,
    reference = null,
  }) => {
    let payment;

    /* ----------------------------------------
       FIND PAYMENT
    ---------------------------------------- */

    if (paymentId) {
      payment =
        await findPaymentById(
          paymentId,
          {
            includeGatewayData: true,
          }
        );
    } else if (reference) {
      payment =
        await findPaymentByReference(
          reference,
          {
            includeGatewayData: true,
          }
        );
    } else {
      throw new AppError(
        "Payment ID or reference is required.",
        400
      );
    }

   /* ----------------------------------------
   ALREADY SUCCESSFUL
---------------------------------------- */

if (
  payment.status === "successful"
) {
  /*
   * The payment may be successful while
   * membership processing previously failed.
   * Retry membership activation before returning.
   */

  if (
    payment.paymentFor === "membership" &&
    !payment.membershipProcessed
  ) {
    try {
      const memberId =
        payment.member?._id ||
        payment.member;

      if (!memberId) {
        throw new AppError(
          "Payment is not linked to a member.",
          400
        );
      }

      await activateMembership(
        memberId
      );

      payment.membershipProcessed =
        true;

      payment.membershipProcessedAt =
        new Date();

      payment.membershipProcessingError =
        null;

      await payment.save();
    } catch (membershipError) {
      payment.membershipProcessingError =
        membershipError.message;

      await payment.save();

      throw membershipError;
    }
  }

  const refreshedPayment =
    await Payment.findById(
      payment._id
    ).populate({
      path: "member",
      populate: {
        path: "user",
        select:
          "email role isActive",
      },
    });

  return {
    success: true,
    completed: true,
    payment:
      refreshedPayment,
  };
}
    /* ----------------------------------------
       CHECKOUT REQUEST ID
    ---------------------------------------- */

    const checkoutRequestId =
      payment.mpesa
        ?.checkoutRequestId;

    if (!checkoutRequestId) {
      throw new AppError(
        "This payment does not have an M-Pesa CheckoutRequestID.",
        400
      );
    }

    /* ----------------------------------------
       QUERY SAFARICOM
    ---------------------------------------- */

    const result =
      await queryMpesaStkPushStatus({
        checkoutRequestId,
      });

    const resultCode =
      result?.resultCode !== null &&
      result?.resultCode !== undefined
        ? Number(
            result.resultCode
          )
        : null;

    payment.mpesa.queryAttempts =
      Number(
        payment.mpesa
          .queryAttempts || 0
      ) + 1;

    payment.mpesa.lastQueryAt =
      new Date();

    payment.mpesa.resultCode =
      resultCode;

    payment.mpesa.resultDescription =
      result.resultDescription ||
      payment.mpesa
        .resultDescription;

    payment.mpesa.merchantRequestId =
      result.merchantRequestId ||
      payment.mpesa
        .merchantRequestId;

    payment.mpesa.checkoutRequestId =
      result.checkoutRequestId ||
      payment.mpesa
        .checkoutRequestId;

    payment.gatewayResponse = {
      ...(payment.gatewayResponse ||
        {}),
      lastQuery:
        result.rawResponse,
    };

    /* ----------------------------------------
       SUCCESSFUL PAYMENT
    ---------------------------------------- */

    if (resultCode === 0) {
      payment.status =
        "successful";

      payment.statusMessage =
        result.resultDescription ||
        "Payment completed successfully.";

      payment.failureReason =
        null;

      payment.isVerified =
        true;

      payment.verificationMethod =
        "stk_query";

      payment.verifiedAt =
        payment.verifiedAt ||
        new Date();

      payment.paidAt =
        payment.paidAt ||
        new Date();

      payment.gatewayReference =
        payment.mpesa
          ?.receiptNumber ||
        payment.mpesa
          ?.checkoutRequestId ||
        payment.gatewayReference;

      await payment.save();

      /* --------------------------------------
         PROCESS MEMBERSHIP
      -------------------------------------- */

      if (
        payment.paymentFor ===
          "membership" &&
        !payment.membershipProcessed
      ) {
        try {
          const memberId =
            payment.member?._id ||
            payment.member;

          if (!memberId) {
            throw new AppError(
              "Payment is not linked to a member.",
              400
            );
          }

          await activateMembership(
            memberId
          );

          payment.membershipProcessed =
            true;

          payment.membershipProcessedAt =
            new Date();

          payment.membershipProcessingError =
            null;
        } catch (
          membershipError
        ) {
          payment.membershipProcessingError =
            membershipError.message;

          await payment.save();

          throw membershipError;
        }
      }

      await payment.save();

      /* --------------------------------------
         REFRESH PAYMENT AND MEMBER
      -------------------------------------- */

      const refreshedPayment =
        await Payment.findById(
          payment._id
        ).populate({
          path: "member",
          populate: {
            path: "user",
            select:
              "email role isActive",
          },
        });

      return {
        success: true,
        completed: true,
        payment:
          refreshedPayment,
        query: result,
      };
    }

    /* ----------------------------------------
       PAYMENT CANCELLED
    ---------------------------------------- */

    if (resultCode === 1032) {
      payment.status =
        "cancelled";

      payment.cancelledAt =
        payment.cancelledAt ||
        new Date();

      payment.statusMessage =
        result.resultDescription ||
        "The payment request was cancelled.";

      payment.failureReason =
        result.resultDescription ||
        "The payment request was cancelled.";
    }

    /* ----------------------------------------
       PAYMENT EXPIRED / TIMEOUT
    ---------------------------------------- */

    else if (
      resultCode === 1037
    ) {
      payment.status =
        "expired";

      payment.failedAt =
        payment.failedAt ||
        new Date();

      payment.statusMessage =
        result.resultDescription ||
        "The payment request expired.";

      payment.failureReason =
        result.resultDescription ||
        "The payment request expired.";
    }

    /* ----------------------------------------
       OTHER FAILED PAYMENT
    ---------------------------------------- */

    else if (
      resultCode !== null
    ) {
      payment.status =
        getMpesaResultStatus(
          resultCode
        );

      payment.failedAt =
        payment.failedAt ||
        new Date();

      payment.statusMessage =
        result.resultDescription ||
        "The payment was unsuccessful.";

      payment.failureReason =
        result.resultDescription ||
        "The payment was unsuccessful.";
    }

    /* ----------------------------------------
       STILL PROCESSING
    ---------------------------------------- */

    else {
      payment.status =
        "processing";

      payment.statusMessage =
        "The transaction is still under processing.";

      payment.failureReason =
        null;
    }

    await payment.save();

    return {
      success: true,
      completed: false,
      payment,
      query: result,
    };
  };

/* ==========================================================
   RETRY FAILED PAYMENT
========================================================== */

export const retryPayment =
  async ({
    paymentId = null,
    reference = null,
    phoneNumber = null,
  }) => {
    let payment;

    if (paymentId) {
      payment =
        await findPaymentById(
          paymentId
        );
    } else if (reference) {
      payment =
        await findPaymentByReference(
          reference
        );
    } else {
      throw new AppError(
        "Payment ID or reference is required.",
        400
      );
    }

    if (
      payment.status ===
      "successful"
    ) {
      throw new AppError(
        "Successful payments cannot be retried.",
        400
      );
    }

    if (
      ![
        "failed",
        "cancelled",
        "expired",
        "pending",
      ].includes(payment.status)
    ) {
      throw new AppError(
        `A ${payment.status} payment cannot be retried.`,
        400
      );
    }

    /*
     * Reopen the payment record and clear old
     * STK identifiers before creating a new prompt.
     */
    payment.status = "pending";

    payment.statusMessage =
      "Payment retry requested.";

    payment.failureReason =
      null;

    payment.failedAt = null;
    payment.cancelledAt = null;

    payment.expiresAt =
      calculatePaymentExpiry();

    payment.mpesa.merchantRequestId =
      null;

    payment.mpesa.checkoutRequestId =
      null;

    payment.mpesa.resultCode =
      null;

    payment.mpesa.resultDescription =
      null;

    payment.mpesa.callbackReceived =
      false;

    payment.mpesa.callbackReceivedAt =
      null;

    if (phoneNumber) {
      payment.phoneNumber =
        getMemberPhone(
          payment.member,
          phoneNumber
        );
    }

    await payment.save();

    return initiatePayment({
      paymentId:
        payment._id,

      phoneNumber:
        payment.phoneNumber,
    });
  };

/* ==========================================================
   MARK PAYMENT FAILED
========================================================== */

export const markPaymentFailed =
  async (
    reference,
    reason = "Unknown payment error."
  ) => {
    const payment =
      await findPaymentByReference(
        reference,
        {
          includeGatewayData:
            true,
        }
      );

    if (
      payment.status ===
      "successful"
    ) {
      throw new AppError(
        "A successful payment cannot be marked as failed.",
        400
      );
    }

    payment.status = "failed";

    payment.failureReason =
      reason;

    payment.statusMessage =
      reason;

    payment.failedAt =
      new Date();

    payment.gatewayResponse = {
      ...(payment.gatewayResponse ||
        {}),

      manuallyFailed: true,
      failureReason: reason,
    };

    await payment.save();

    return payment;
  };

/* ==========================================================
   GET PAYMENT BY REFERENCE
========================================================== */

export const getPaymentByReference =
  async (reference) => {
    return findPaymentByReference(
      reference
    );
  };

/* ==========================================================
   GET PAYMENT BY ID
========================================================== */

export const getPaymentById =
  async (paymentId) => {
    return findPaymentById(
      paymentId
    );
  };

/* ==========================================================
   MEMBER PAYMENT HISTORY
========================================================== */

export const getPaymentHistory =
  async (
    memberId,
    {
      page = 1,
      limit = 20,
      status = null,
      paymentFor = null,
    } = {}
  ) => {
    const normalizedPage = Math.max(
      Number(page) || 1,
      1
    );

    const normalizedLimit = Math.min(
      Math.max(
        Number(limit) || 20,
        1
      ),
      100
    );

    const query = {
      member: memberId,
    };

    if (status) {
      query.status = status;
    }

    if (paymentFor) {
      query.paymentFor =
        paymentFor;
    }

    const [
      payments,
      total,
    ] = await Promise.all([
      Payment.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(
          (normalizedPage - 1) *
            normalizedLimit
        )
        .limit(
          normalizedLimit
        ),

      Payment.countDocuments(
        query
      ),
    ]);

    return {
      payments,

      pagination: {
        page:
          normalizedPage,

        limit:
          normalizedLimit,

        total,

        totalPages:
          Math.ceil(
            total /
              normalizedLimit
          ),
      },
    };
  };

/* ==========================================================
   ADMIN PAYMENT LIST
========================================================== */

export const getAllPayments =
  async ({
    status,
    paymentFor,
    paymentMethod,
    search,

    page = 1,
    limit = 20,
  } = {}) => {
    const normalizedPage = Math.max(
      Number(page) || 1,
      1
    );

    const normalizedLimit = Math.min(
      Math.max(
        Number(limit) || 20,
        1
      ),
      100
    );

    const query = {};

    if (status) {
      query.status = status;
    }

    if (paymentFor) {
      query.paymentFor =
        paymentFor;
    }

    if (paymentMethod) {
      query.paymentMethod =
        paymentMethod;
    }

    if (search) {
      const searchRegex =
        new RegExp(
          String(search).trim(),
          "i"
        );

      query.$or = [
        {
          reference:
            searchRegex,
        },
        {
          phoneNumber:
            searchRegex,
        },
        {
          gatewayReference:
            searchRegex,
        },
        {
          "mpesa.receiptNumber":
            searchRegex,
        },
      ];
    }

    const [
      payments,
      total,
    ] = await Promise.all([
      Payment.find(query)
        .populate({
          path: "member",

          select:
            "memberNumber firstName lastName phone county membershipType membershipStatus",
        })
        .sort({
          createdAt: -1,
        })
        .skip(
          (normalizedPage - 1) *
            normalizedLimit
        )
        .limit(
          normalizedLimit
        ),

      Payment.countDocuments(
        query
      ),
    ]);

    return {
      payments,

      pagination: {
        page:
          normalizedPage,

        limit:
          normalizedLimit,

        total,

        totalPages:
          Math.ceil(
            total /
              normalizedLimit
          ),
      },
    };
  };

/* ==========================================================
   PAYMENT STATISTICS
========================================================== */

export const getPaymentStatistics =
  async ({
    startDate = null,
    endDate = null,
  } = {}) => {
    const dateFilter = {};

    if (startDate) {
      dateFilter.$gte =
        new Date(startDate);
    }

    if (endDate) {
      const resolvedEndDate =
        new Date(endDate);

      resolvedEndDate.setHours(
        23,
        59,
        59,
        999
      );

      dateFilter.$lte =
        resolvedEndDate;
    }

    const baseQuery =
      Object.keys(dateFilter)
        .length > 0
        ? {
            createdAt:
              dateFilter,
          }
        : {};

    const [
      totalPayments,
      pendingPayments,
      processingPayments,
      successfulPayments,
      failedPayments,
      cancelledPayments,
      expiredPayments,
      revenue,
      paymentForBreakdown,
      dailyRevenue,
    ] = await Promise.all([
      Payment.countDocuments(
        baseQuery
      ),

      Payment.countDocuments({
        ...baseQuery,
        status: "pending",
      }),

      Payment.countDocuments({
        ...baseQuery,
        status:
          "processing",
      }),

      Payment.countDocuments({
        ...baseQuery,
        status:
          "successful",
      }),

      Payment.countDocuments({
        ...baseQuery,
        status: "failed",
      }),

      Payment.countDocuments({
        ...baseQuery,
        status:
          "cancelled",
      }),

      Payment.countDocuments({
        ...baseQuery,
        status:
          "expired",
      }),

      Payment.aggregate([
        {
          $match: {
            ...baseQuery,
            status:
              "successful",
          },
        },
        {
          $group: {
            _id: null,

            totalRevenue: {
              $sum: "$amount",
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            ...baseQuery,
            status:
              "successful",
          },
        },
        {
          $group: {
            _id: "$paymentFor",

            totalPayments: {
              $sum: 1,
            },

            totalRevenue: {
              $sum: "$amount",
            },
          },
        },
        {
          $sort: {
            totalRevenue: -1,
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            ...baseQuery,
            status:
              "successful",

            paidAt: {
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: {
              year: {
                $year: "$paidAt",
              },

              month: {
                $month: "$paidAt",
              },

              day: {
                $dayOfMonth:
                  "$paidAt",
              },
            },

            payments: {
              $sum: 1,
            },

            revenue: {
              $sum: "$amount",
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1,
          },
        },
      ]),
    ]);

    return {
      totalPayments,
      pendingPayments,
      processingPayments,
      successfulPayments,
      failedPayments,
      cancelledPayments,
      expiredPayments,

      totalRevenue:
        revenue.length > 0
          ? revenue[0]
              .totalRevenue
          : 0,

      paymentForBreakdown,
      dailyRevenue,
    };
  };

/* ==========================================================
   DELETE PENDING PAYMENT
========================================================== */

export const deletePendingPayment =
  async (reference) => {
    const payment =
      await findPaymentByReference(
        reference
      );

    if (
      ![
        "pending",
        "failed",
        "cancelled",
        "expired",
      ].includes(payment.status)
    ) {
      throw new AppError(
        "Only pending, failed, cancelled, or expired payments can be deleted.",
        400
      );
    }

    await Payment.deleteOne({
      _id: payment._id,
    });

    await createActivityLog({
      user:
        getMemberUserId(
          payment.member
        ) ||
        payment.user,

      action:
        "Payment deleted",

      description:
        "An incomplete payment record was deleted.",

      targetId:
        payment._id,

      metadata: {
        reference:
          payment.reference,

        previousStatus:
          payment.status,
      },
    });

    return true;
  };

/* ==========================================================
   EXPORT
========================================================== */

export default {
  createPayment,

  createMembershipPayment,
  createRenewalPayment,

  initiatePayment,
  initiateMembershipPayment,
  initiateRenewalPayment,

  processMpesaCallback,
  queryPaymentStatus,
  retryPayment,

  activateMembership,
  renewMembership,

  markPaymentFailed,

  getPaymentHistory,
  getPaymentByReference,
  getPaymentById,

  getAllPayments,
  getPaymentStatistics,

  deletePendingPayment,
};