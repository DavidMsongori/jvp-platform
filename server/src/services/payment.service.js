import { randomUUID } from "node:crypto";

import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
import ActivityLog from "../models/ActivityLog.js";

import AppError from "../utils/AppError.js";

import {
  MEMBERSHIP,
  getMembershipFee,
} from "../config/membership.js";

import {
  createIntaSendCheckout,
  queryIntaSendPaymentStatus,
} from "./intasend.service.js";

import SummitExhibitor from "../models/summitExhibitor.model.js";

import {
  parseMpesaStkCallback,
  normalizeMpesaPhoneNumber,
  getMpesaResultStatus,
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
  summit_exhibitor: "EXH",
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
  summit_exhibitor: "JVP Exhibitor",
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

function normalizeKenyanPhoneNumber(
  value
) {
  if (!value) {
    return null;
  }

  const phone = String(value)
    .trim()
    .replace(/[\s()-]/g, "");

  if (/^254[17]\d{8}$/.test(phone)) {
    return phone;
  }

  if (/^\+254[17]\d{8}$/.test(phone)) {
    return phone.slice(1);
  }

  if (/^0[17]\d{8}$/.test(phone)) {
    return `254${phone.slice(1)}`;
  }

  throw new AppError(
    "Enter a valid Kenyan mobile phone number.",
    400
  );
}

function getMemberPhone(
  member,
  phoneNumber,
  {
    required = false,
  } = {}
) {
  const resolvedPhone =
    phoneNumber ||
    member?.phone ||
    null;

  if (!resolvedPhone) {
    if (required) {
      throw new AppError(
        "A phone number is required for this payment.",
        400
      );
    }

    return null;
  }

  return normalizeKenyanPhoneNumber(
    resolvedPhone
  );
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

    provider: "intasend",

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
  summitExhibitorId = null,

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
    phoneNumber,
    {
      required: false,
    }
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

    summitExhibitor:
  summitExhibitorId,

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

    provider: "intasend",

paymentMethod: "unknown",

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

  paymentProvider:
    "intasend",

  environment:
    String(
      process.env
        .INTASEND_TEST_MODE ??
        "true"
    )
      .trim()
      .toLowerCase() ===
    "true"
      ? "sandbox"
      : "production",
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
   INITIATE INTASEND PAYMENT
========================================================== */

export const initiatePayment = async ({
  paymentId = null,
  reference = null,

  phoneNumber = null,
  email = null,
  fullName = null,

  method = "M-PESA",
  redirectUrl = null,
}) => {
  let payment;

  /* ========================================
     FIND PAYMENT
  ======================================== */

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

  /* ========================================
     ALREADY COMPLETED
  ======================================== */

  if (
    payment.status ===
    "successful"
  ) {
    return {
      success: true,

      alreadyCompleted: true,

      message:
        "Payment has already been completed.",

      payment,

      reference:
        payment.reference,

      checkoutUrl:
        payment.intasend
          ?.checkoutUrl ||
        null,

      invoiceId:
        payment.intasend
          ?.invoiceId ||
        null,
    };
  }

  /* ========================================
     VALID STATUS
  ======================================== */

  if (
    FINAL_PAYMENT_STATUSES.includes(
      payment.status
    ) &&
    ![
      "failed",
      "cancelled",
      "expired",
    ].includes(payment.status)
  ) {
    throw new AppError(
      `A ${payment.status} payment cannot be initiated again.`,
      400
    );
  }

  /* ========================================
     PAYMENT EXPIRY
  ======================================== */

  if (
    payment.expiresAt &&
    payment.expiresAt <=
      new Date()
  ) {
    payment.status =
      "expired";

    payment.statusMessage =
      "The payment request expired.";

    payment.failureReason =
      "Payment request expired before completion.";

    await payment.save();

    throw new AppError(
      "This payment request has expired. Start a new payment.",
      400
    );
  }

  /* ========================================
     CUSTOMER DETAILS
  ======================================== */

  const member =
    payment.member || null;

  const resolvedPhone =
    getMemberPhone(
      member,
      phoneNumber ||
        payment.phoneNumber,
      {
        required:
          method ===
          "M-PESA",
      }
    );

  const resolvedFullName =
    fullName ||
    [
      member?.firstName,
      member?.middleName,
      member?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    payment.metadata
      ?.customerName ||
    "JVP Customer";

  const resolvedEmail =
    email ||
    member?.user?.email ||
    payment.metadata
      ?.customerEmail ||
    "";

  payment.provider =
    "intasend";

  payment.paymentMethod =
    method === "M-PESA"
      ? "mpesa"
      : method ===
          "CARD-PAYMENT"
        ? "card"
        : "unknown";

  payment.phoneNumber =
    resolvedPhone ||
    payment.phoneNumber ||
    null;

  payment.status =
    "pending";

  payment.statusMessage =
    "Preparing IntaSend checkout.";

  payment.failureReason =
    null;

  payment.failedAt =
    null;

  payment.cancelledAt =
    null;

  await payment.save();

  /* ========================================
     CREATE CHECKOUT
  ======================================== */

  try {
    const result =
      await createIntaSendCheckout(
        {
          paymentId:
            payment._id,

          customer: {
            fullName:
              resolvedFullName,

            email:
              resolvedEmail,

            phoneNumber:
              resolvedPhone,
          },

          method,

          redirectUrl:
            redirectUrl ||
            `${String(
              process.env
                .FRONTEND_URL ||
                "http://localhost:5173"
            ).replace(
              /\/+$/,
              ""
            )}/payment/success?reference=${encodeURIComponent(
              payment.reference
            )}`,
        }
      );

    await createActivityLog({
      user:
        getMemberUserId(
          member
        ) ||
        payment.user,

      action:
        "IntaSend checkout created",

      description:
        "IntaSend payment checkout created successfully.",

      targetId:
        payment._id,

      metadata: {
        reference:
          payment.reference,

        invoiceId:
          result.invoiceId,

        amount:
          payment.amount,

        paymentMethod:
          payment.paymentMethod,

        provider:
          "intasend",

        reused:
          Boolean(
            result.reused
          ),
      },
    });

    return {
      success: true,

      message:
        result.reused
          ? "Existing IntaSend checkout retrieved successfully."
          : "IntaSend checkout created successfully.",

      payment:
        result.payment,

      reference:
        payment.reference,

      checkoutUrl:
        result.checkoutUrl,

      invoiceId:
        result.invoiceId,

      reused:
        Boolean(
          result.reused
        ),
    };
  } catch (error) {
    /*
     * Do not convert the payment to failed when
     * IntaSend has already created an invoice.
     * The provider may still send a webhook.
     */

    if (
      !payment.intasend
        ?.invoiceId
    ) {
      payment.status =
        "failed";

      payment.failureReason =
        error.message ||
        "Unable to create the IntaSend checkout.";

      payment.statusMessage =
        payment.failureReason;

      payment.failedAt =
        new Date();

      payment.gatewayResponse =
        error.details ||
        null;

      await payment.save();
    }

    await createActivityLog({
      user:
        getMemberUserId(
          member
        ) ||
        payment.user,

      action:
        "IntaSend checkout failed",

      description:
        "IntaSend payment checkout could not be created.",

      targetId:
        payment._id,

      metadata: {
        reference:
          payment.reference,

        error:
          error.message,

        code:
          error.code ||
          null,
      },
    });

    throw new AppError(
  Number.isInteger(
    error.statusCode
  )
    ? error.statusCode
    : 502,

  error.message ||
    "Unable to create the IntaSend checkout."
);
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
      email = null,
      fullName = null,

      method = "M-PESA",
      redirectUrl = null,
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

    const resolvedFullName =
      fullName ||
      [
        member.firstName,
        member.middleName,
        member.lastName,
      ]
        .filter(Boolean)
        .join(" ");

    const resolvedEmail =
      email ||
      member.user?.email ||
      "";

    const result =
      await initiatePayment({
        paymentId:
          payment._id,

        phoneNumber:
          phoneNumber ||
          member.phone,

        email:
          resolvedEmail,

        fullName:
          resolvedFullName,

        method,

        redirectUrl,
      });

    return {
      ...result,

      member,

      amount:
        payment.amount,

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
      email = null,
      fullName = null,

      method = "M-PESA",
      redirectUrl = null,
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

    const resolvedFullName =
      fullName ||
      [
        member.firstName,
        member.middleName,
        member.lastName,
      ]
        .filter(Boolean)
        .join(" ");

    const resolvedEmail =
      email ||
      member.user?.email ||
      "";

    const result =
      await initiatePayment({
        paymentId:
          payment._id,

        phoneNumber:
          phoneNumber ||
          member.phone,

        email:
          resolvedEmail,

        fullName:
          resolvedFullName,

        method,

        redirectUrl,
      });

    return {
      ...result,

      member,

      amount:
        payment.amount,

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
        "Membership activated after successful payment verification.",

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
        "Membership renewed after successful payment verification.",

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

export async function processSuccessfulPayment(
  payment
) {
  if (!payment) {
    throw new AppError(
      "Payment record is required for post-payment processing.",
      400
    );
  }

  if (
    payment.status !==
      "successful" ||
    !payment.isVerified
  ) {
    throw new AppError(
      "Only a verified successful payment can be processed.",
      400
    );
  }

  const memberId =
    payment.member?._id ||
    payment.member ||
    null;

  /* ========================================================
     MEMBERSHIP ACTIVATION
  ======================================================== */

  if (
    payment.paymentFor ===
    "membership"
  ) {
    if (!memberId) {
      throw new AppError(
        "Membership payment is not linked to a member.",
        400
      );
    }

    if (
      !payment.membershipProcessed
    ) {
      try {
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
      } catch (error) {
        payment.membershipProcessingError =
          error.message;

        await payment.save();

        throw error;
      }
    }

    return payment;
  }

  /* ========================================================
     MEMBERSHIP RENEWAL
  ======================================================== */

  if (
    payment.paymentFor ===
    "renewal"
  ) {
    if (!memberId) {
      throw new AppError(
        "Renewal payment is not linked to a member.",
        400
      );
    }

    if (
      !payment.membershipProcessed
    ) {
      try {
        await renewMembership(
          memberId
        );

        payment.membershipProcessed =
          true;

        payment.membershipProcessedAt =
          new Date();

        payment.membershipProcessingError =
          null;

        await payment.save();
      } catch (error) {
        payment.membershipProcessingError =
          error.message;

        await payment.save();

        throw error;
      }
    }

    return payment;
  }

  /* ========================================================
     SUMMIT EXHIBITOR PAYMENT
  ======================================================== */

  if (
    payment.paymentFor ===
    "summit_exhibitor"
  ) {
    const summitExhibitorId =
      payment.summitExhibitor
        ?._id ||
      payment.summitExhibitor ||
      null;

    if (!summitExhibitorId) {
      throw new AppError(
        "Exhibitor payment is not linked to an exhibitor registration.",
        400
      );
    }

    if (
      !payment.registrationProcessed
    ) {
      const exhibitor =
        await SummitExhibitor.findById(
          summitExhibitorId
        );

      if (!exhibitor) {
        throw new AppError(
          "The summit exhibitor registration could not be found.",
          404
        );
      }

      exhibitor.paymentStatus =
        "paid";

      exhibitor.status =
        "confirmed";

      exhibitor.reviewedAt =
        exhibitor.reviewedAt ||
        new Date();

      await exhibitor.save();

      payment.registrationProcessed =
        true;

      payment.registrationProcessedAt =
        new Date();

      await payment.save();

      await createActivityLog({
        user:
          payment.user ||
          payment.createdBy ||
          null,

        action:
          "Exhibitor payment confirmed",

        module:
          "summit_exhibitors",

        description:
          "Summit exhibitor payment completed and the booking was confirmed.",

        targetId:
          exhibitor._id,

        metadata: {
          paymentReference:
            payment.reference,

          provider:
            payment.provider,

          amount:
            payment.amount,

          packageId:
            exhibitor.packageId,

          packageName:
            exhibitor.packageName,
        },
      });
    }

    return payment;
  }

  /* ========================================================
     EVENT / SUMMIT / DONATION

     Their specific fulfillment can be connected later.
  ======================================================== */

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
   QUERY INTASEND PAYMENT STATUS
========================================================== */

export const queryPaymentStatus =
  async ({
    paymentId = null,
    reference = null,
    invoiceId = null,
  }) => {
    if (
      !paymentId &&
      !reference &&
      !invoiceId
    ) {
      throw new AppError(
        "Payment ID, reference or IntaSend invoice ID is required.",
        400
      );
    }

    let existingPayment =
      null;

    if (paymentId) {
      existingPayment =
        await findPaymentById(
          paymentId,
          {
            includeGatewayData:
              true,
          }
        );
    } else if (reference) {
      existingPayment =
        await findPaymentByReference(
          reference,
          {
            includeGatewayData:
              true,
          }
        );
    } else {
      existingPayment =
        await Payment
          .findByIntaSendInvoiceId(
            invoiceId
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
    }

    if (!existingPayment) {
      throw new AppError(
        "Payment not found.",
        404
      );
    }

    /*
     * A successful payment can still need
     * fulfillment if a previous processing
     * attempt failed.
     */
    if (
      existingPayment.status ===
        "successful" &&
      existingPayment.isVerified
    ) {
      await processSuccessfulPayment(
        existingPayment
      );

      const refreshedPayment =
        await Payment.findById(
          existingPayment._id
        )
          .populate({
            path: "member",

            populate: {
              path: "user",

              select:
                "email role isActive",
            },
          })
          .populate(
            "summitExhibitor"
          );

      return {
        success: true,
        completed: true,
        payment:
          refreshedPayment,
        invoice:
          null,
      };
    }

    if (
      existingPayment.provider !==
      "intasend"
    ) {
      throw new AppError(
        "This payment was not created through IntaSend.",
        400
      );
    }

    const resolvedInvoiceId =
      invoiceId ||
      existingPayment.intasend
        ?.invoiceId ||
      null;

    if (!resolvedInvoiceId) {
      throw new AppError(
        "This payment does not have an IntaSend invoice ID.",
        400
      );
    }

    const result =
      await queryIntaSendPaymentStatus(
        {
          paymentId:
            existingPayment._id,

          invoiceId:
            resolvedInvoiceId,
        }
      );

    const payment =
      result.payment;

    if (
      payment.status ===
        "successful" &&
      payment.isVerified
    ) {
      try {
        await processSuccessfulPayment(
          payment
        );
      } catch (processingError) {
        if (
          [
            "membership",
            "renewal",
          ].includes(
            payment.paymentFor
          )
        ) {
          payment.membershipProcessingError =
            processingError.message;

          await payment.save();
        }

        throw processingError;
      }
    }

    const refreshedPayment =
      await Payment.findById(
        payment._id
      )
        .populate({
          path: "member",

          populate: {
            path: "user",

            select:
              "email role isActive",
          },
        })
        .populate(
          "summitExhibitor"
        );

    await createActivityLog({
      user:
        getMemberUserId(
          refreshedPayment?.member
        ) ||
        refreshedPayment?.user,

      action:
        "IntaSend status queried",

      description:
        "The latest payment status was retrieved from IntaSend.",

      targetId:
        refreshedPayment?._id,

      metadata: {
        reference:
          refreshedPayment
            ?.reference,

        invoiceId:
          refreshedPayment
            ?.intasend
            ?.invoiceId,

        status:
          refreshedPayment
            ?.status,

        state:
          refreshedPayment
            ?.intasend
            ?.state,
      },
    });

    return {
      success: true,

      completed:
        refreshedPayment
          ?.status ===
        "successful",

      payment:
        refreshedPayment,

      invoice:
        result.invoice ||
        null,
    };
  };

/* ==========================================================
   RETRY INTASEND PAYMENT
========================================================== */

export const retryPayment =
  async ({
    paymentId = null,
    reference = null,

    phoneNumber = null,
    email = null,
    fullName = null,

    method = "M-PESA",
    redirectUrl = null,
  }) => {
    let payment;

    if (paymentId) {
      payment =
        await findPaymentById(
          paymentId,
          {
            includeGatewayData:
              true,
          }
        );
    } else if (reference) {
      payment =
        await findPaymentByReference(
          reference,
          {
            includeGatewayData:
              true,
          }
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
        "processing",
      ].includes(
        payment.status
      )
    ) {
      throw new AppError(
        `A ${payment.status} payment cannot be retried.`,
        400
      );
    }

    /*
     * Reset the existing IntaSend invoice so
     * createIntaSendCheckout generates a new one.
     */
    payment.provider =
      "intasend";

    payment.status =
      "pending";

    payment.statusMessage =
      "Payment retry requested.";

    payment.failureReason =
      null;

    payment.failedAt =
      null;

    payment.cancelledAt =
      null;

    payment.verifiedAt =
      null;

    payment.paidAt =
      null;

    payment.isVerified =
      false;

    payment.verificationMethod =
      null;

    payment.expiresAt =
      calculatePaymentExpiry();

    payment.gatewayReference =
      null;

    payment.gatewayResponse =
      null;

    payment.callbackPayload =
      null;

    payment.intasend.invoiceId =
      null;

    payment.intasend.checkoutUrl =
      null;

    payment.intasend.state =
      null;

    payment.intasend.provider =
      null;

    payment.intasend.providerReference =
      null;

    payment.intasend.charges =
      0;

    payment.intasend.netAmount =
      null;

    payment.intasend.failedReason =
      null;

    payment.intasend.failedCode =
      null;

    payment.intasend.webhookReceived =
      false;

    payment.intasend.webhookReceivedAt =
      null;

    payment.intasend.statusQueryAttempts =
      0;

    payment.intasend.lastStatusQueryAt =
      null;

    if (phoneNumber) {
      payment.phoneNumber =
        getMemberPhone(
          payment.member,
          phoneNumber,
          {
            required:
              method ===
              "M-PESA",
          }
        );
    }

    payment.paymentMethod =
      method === "M-PESA"
        ? "mpesa"
        : method ===
            "CARD-PAYMENT"
          ? "card"
          : "unknown";

    await payment.save();

    const result =
      await initiatePayment({
        paymentId:
          payment._id,

        phoneNumber:
          payment.phoneNumber,

        email,

        fullName,

        method,

        redirectUrl,
      });

    await createActivityLog({
      user:
        getMemberUserId(
          payment.member
        ) ||
        payment.user,

      action:
        "IntaSend payment retried",

      description:
        "A new IntaSend checkout was created for an incomplete payment.",

      targetId:
        payment._id,

      metadata: {
        reference:
          payment.reference,

        invoiceId:
          result.invoiceId,

        method,

        provider:
          "intasend",
      },
    });

    return result;
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

  processSuccessfulPayment,

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