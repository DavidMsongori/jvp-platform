import mongoose from "mongoose";

import SummitEvent from "../models/summitEvent.model.js";
import SummitExhibitor from "../models/summitExhibitor.model.js";

/* ==========================================================
   PACKAGE CONFIGURATION

   Package prices are controlled by the backend.
   Do not trust packageName or packageAmount from the client.
========================================================== */

const EXHIBITOR_PACKAGES =
  Object.freeze({
    youth: {
      packageName: "Youth",
      packageAmount: 10000,
    },

    bronze: {
      packageName: "Bronze",
      packageAmount: 50000,
    },

    silver: {
      packageName: "Silver",
      packageAmount: 75000,
    },

    gold: {
      packageName: "Gold",
      packageAmount: 100000,
    },

    premium: {
      packageName: "Premium",
      packageAmount: 150000,
    },
  });

/* ==========================================================
   SERVICE ERROR
========================================================== */

export class SummitExhibitorServiceError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "SUMMIT_EXHIBITOR_ERROR"
  ) {
    super(message);

    this.name =
      "SummitExhibitorServiceError";

    this.statusCode =
      statusCode;

    this.code =
      code;

    Error.captureStackTrace?.(
      this,
      SummitExhibitorServiceError
    );
  }
}

/* ==========================================================
   NORMALIZATION
========================================================== */

const normalizeText = (
  value = ""
) =>
  String(value)
    .trim()
    .replace(/\s+/g, " ");

const normalizeEmail = (
  value = ""
) =>
  String(value)
    .trim()
    .toLowerCase();

const normalizePhone = (
  value = ""
) => {
  const phone = String(value)
    .trim()
    .replace(/[\s()-]/g, "");

  if (
    /^\+254[17]\d{8}$/.test(
      phone
    )
  ) {
    return phone;
  }

  if (
    /^254[17]\d{8}$/.test(
      phone
    )
  ) {
    return `+${phone}`;
  }

  if (
    /^0[17]\d{8}$/.test(
      phone
    )
  ) {
    return `+254${phone.slice(
      1
    )}`;
  }

  throw new SummitExhibitorServiceError(
    "Enter a valid Kenyan mobile phone number.",
    400,
    "INVALID_PHONE_NUMBER"
  );
};

/* ==========================================================
   HELPERS
========================================================== */

const resolvePackage = (
  packageId
) => {
  const normalizedPackageId =
    String(packageId || "")
      .trim()
      .toLowerCase();

  const selectedPackage =
    EXHIBITOR_PACKAGES[
      normalizedPackageId
    ];

  if (!selectedPackage) {
    throw new SummitExhibitorServiceError(
      "The selected exhibitor package is invalid.",
      400,
      "INVALID_EXHIBITOR_PACKAGE"
    );
  }

  return {
    packageId:
      normalizedPackageId,

    ...selectedPackage,
  };
};

const findSummitEvent = async ({
  summitEventId,
  summitSlug,
}) => {
  let query = null;

  if (summitEventId) {
    if (
      !mongoose.isValidObjectId(
        summitEventId
      )
    ) {
      throw new SummitExhibitorServiceError(
        "The summit event ID is invalid.",
        400,
        "INVALID_SUMMIT_EVENT_ID"
      );
    }

    query = {
      _id: summitEventId,
    };
  } else if (summitSlug) {
    query = {
      slug: String(
        summitSlug
      )
        .trim()
        .toLowerCase(),
    };
  }

  if (!query) {
    throw new SummitExhibitorServiceError(
      "The summit event is required.",
      400,
      "SUMMIT_EVENT_REQUIRED"
    );
  }

  const summitEvent =
    await SummitEvent.findOne(
      query
    ).select(
      "_id title shortTitle slug registrationStatus"
    );

  if (!summitEvent) {
    throw new SummitExhibitorServiceError(
      "The summit event could not be found.",
      404,
      "SUMMIT_NOT_FOUND"
    );
  }

  return summitEvent;
};

const validateRegistrationPayload = (
  payload
) => {
  const requiredFields = [
    "packageId",
    "organizationName",
    "organizationType",
    "county",
    "contactPerson",
    "email",
    "phone",
    "productsOrServices",
  ];

  const missingFields =
    requiredFields.filter(
      (field) =>
        !normalizeText(
          payload?.[field]
        )
    );

  if (
    missingFields.length > 0
  ) {
    throw new SummitExhibitorServiceError(
      `Missing required fields: ${missingFields.join(
        ", "
      )}.`,
      400,
      "MISSING_REQUIRED_FIELDS"
    );
  }

  const normalizedEmail =
    normalizeEmail(
      payload.email
    );

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail
    )
  ) {
    throw new SummitExhibitorServiceError(
      "Enter a valid email address.",
      400,
      "INVALID_EMAIL"
    );
  }

  if (!payload.acceptedTerms) {
    throw new SummitExhibitorServiceError(
      "You must accept the exhibitor declaration.",
      400,
      "TERMS_NOT_ACCEPTED"
    );
  }
};

/* ==========================================================
   PUBLIC: REGISTER EXHIBITOR
========================================================== */

export const registerSummitExhibitor =
  async ({
    summitEventId = null,
    summitSlug = null,
    payload = {},
  }) => {
    validateRegistrationPayload(
      payload
    );

    const summitEvent =
      await findSummitEvent({
        summitEventId,
        summitSlug,
      });

    const selectedPackage =
      resolvePackage(
        payload.packageId
      );

    const email =
      normalizeEmail(
        payload.email
      );

    const phone =
      normalizePhone(
        payload.phone
      );

    const existingExhibitor =
      await SummitExhibitor.findOne({
        summitEvent:
          summitEvent._id,

        $or: [
          {
            email,
          },
          {
            phone,
          },
        ],
      }).select(
        "_id organizationName packageName status paymentStatus"
      );

    if (existingExhibitor) {
      throw new SummitExhibitorServiceError(
        "An exhibitor registration already exists using this email address or phone number.",
        409,
        "DUPLICATE_EXHIBITOR_REGISTRATION"
      );
    }

    try {
      const exhibitor =
        await SummitExhibitor.create(
          {
            summitEvent:
              summitEvent._id,

            packageId:
              selectedPackage.packageId,

            packageName:
              selectedPackage.packageName,

            packageAmount:
              selectedPackage.packageAmount,

            organizationName:
              normalizeText(
                payload.organizationName
              ),

            organizationType:
              normalizeText(
                payload.organizationType
              )
                .toLowerCase()
                .replace(/\s+/g, "_"),

            county:
              normalizeText(
                payload.county
              ),

            contactPerson:
              normalizeText(
                payload.contactPerson
              ),

            email,

            phone,

            productsOrServices:
              normalizeText(
                payload.productsOrServices
              ),

            exhibitionRequirements:
              normalizeText(
                payload.exhibitionRequirements
              ),

            acceptedTerms:
              Boolean(
                payload.acceptedTerms
              ),

            status: "pending",

            paymentStatus:
              "not_requested",
          }
        );

      return await SummitExhibitor.findById(
        exhibitor._id
      )
        .populate(
          "summitEvent",
          "title shortTitle slug"
        )
        .lean();
    } catch (error) {
      if (
        error?.code === 11000
      ) {
        throw new SummitExhibitorServiceError(
          "An exhibitor registration already exists using this email address.",
          409,
          "DUPLICATE_EXHIBITOR_REGISTRATION"
        );
      }

      throw error;
    }
  };

/* ==========================================================
   ADMIN: LIST EXHIBITORS
========================================================== */

export const getSummitExhibitors =
  async ({
    summitEventId = null,
    page = 1,
    limit = 20,
    status = "",
    paymentStatus = "",
    packageId = "",
    search = "",
  } = {}) => {
    const safePage =
      Math.max(
        Number(page) || 1,
        1
      );

    const safeLimit =
      Math.min(
        Math.max(
          Number(limit) || 20,
          1
        ),
        100
      );

    const query = {};

    if (summitEventId) {
      if (
        !mongoose.isValidObjectId(
          summitEventId
        )
      ) {
        throw new SummitExhibitorServiceError(
          "The summit event ID is invalid.",
          400,
          "INVALID_SUMMIT_EVENT_ID"
        );
      }

      query.summitEvent =
        summitEventId;
    }

    if (status) {
      query.status =
        String(status)
          .trim()
          .toLowerCase();
    }

    if (paymentStatus) {
      query.paymentStatus =
        String(paymentStatus)
          .trim()
          .toLowerCase();
    }

    if (packageId) {
      query.packageId =
        String(packageId)
          .trim()
          .toLowerCase();
    }

    const normalizedSearch =
      normalizeText(search);

    if (normalizedSearch) {
      const searchExpression =
        new RegExp(
          normalizedSearch.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ),
          "i"
        );

      query.$or = [
        {
          organizationName:
            searchExpression,
        },
        {
          contactPerson:
            searchExpression,
        },
        {
          email:
            searchExpression,
        },
        {
          phone:
            searchExpression,
        },
      ];
    }

    const skip =
      (safePage - 1) *
      safeLimit;

    const [
      exhibitors,
      total,
    ] = await Promise.all([
      SummitExhibitor.find(
        query
      )
        .populate(
          "summitEvent",
          "title shortTitle slug"
        )
        .populate(
          "reviewedBy",
          "email role"
        )
        .sort({
          submittedAt: -1,
        })
        .skip(skip)
        .limit(safeLimit)
        .lean(),

      SummitExhibitor.countDocuments(
        query
      ),
    ]);

    return {
      exhibitors,

      pagination: {
        page: safePage,
        limit: safeLimit,
        total,

        totalPages:
          Math.max(
            Math.ceil(
              total /
                safeLimit
            ),
            1
          ),

        hasNextPage:
          skip +
            exhibitors.length <
          total,

        hasPreviousPage:
          safePage > 1,
      },
    };
  };

/* ==========================================================
   ADMIN: GET ONE EXHIBITOR
========================================================== */

export const getSummitExhibitorById =
  async ({
    exhibitorId,
  }) => {
    if (
      !mongoose.isValidObjectId(
        exhibitorId
      )
    ) {
      throw new SummitExhibitorServiceError(
        "The exhibitor ID is invalid.",
        400,
        "INVALID_EXHIBITOR_ID"
      );
    }

    const exhibitor =
      await SummitExhibitor.findById(
        exhibitorId
      )
        .populate(
          "summitEvent",
          "title shortTitle slug"
        )
        .populate(
          "reviewedBy",
          "email role"
        )
        .lean();

    if (!exhibitor) {
      throw new SummitExhibitorServiceError(
        "The exhibitor registration could not be found.",
        404,
        "EXHIBITOR_NOT_FOUND"
      );
    }

    return exhibitor;
  };

/* ==========================================================
   ADMIN: UPDATE EXHIBITOR
========================================================== */

export const updateSummitExhibitor =
  async ({
    exhibitorId,
    currentUserId,
    status,
    paymentStatus,
    adminNotes,
  }) => {
    if (
      !mongoose.isValidObjectId(
        exhibitorId
      )
    ) {
      throw new SummitExhibitorServiceError(
        "The exhibitor ID is invalid.",
        400,
        "INVALID_EXHIBITOR_ID"
      );
    }

    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
      "payment_pending",
      "confirmed",
      "cancelled",
    ];

    const allowedPaymentStatuses =
      [
        "not_requested",
        "pending",
        "paid",
        "failed",
        "refunded",
      ];

    const update = {
      reviewedAt:
        new Date(),

      reviewedBy:
        currentUserId || null,
    };

    if (
      status !== undefined
    ) {
      const normalizedStatus =
        String(status)
          .trim()
          .toLowerCase();

      if (
        !allowedStatuses.includes(
          normalizedStatus
        )
      ) {
        throw new SummitExhibitorServiceError(
          "The exhibitor status is invalid.",
          400,
          "INVALID_EXHIBITOR_STATUS"
        );
      }

      update.status =
        normalizedStatus;
    }

    if (
      paymentStatus !==
      undefined
    ) {
      const normalizedPaymentStatus =
        String(paymentStatus)
          .trim()
          .toLowerCase();

      if (
        !allowedPaymentStatuses.includes(
          normalizedPaymentStatus
        )
      ) {
        throw new SummitExhibitorServiceError(
          "The exhibitor payment status is invalid.",
          400,
          "INVALID_PAYMENT_STATUS"
        );
      }

      update.paymentStatus =
        normalizedPaymentStatus;
    }

    if (
      adminNotes !== undefined
    ) {
      update.adminNotes =
        normalizeText(
          adminNotes
        );
    }

    const exhibitor =
      await SummitExhibitor.findByIdAndUpdate(
        exhibitorId,
        {
          $set: update,
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "summitEvent",
          "title shortTitle slug"
        )
        .populate(
          "reviewedBy",
          "email role"
        )
        .lean();

    if (!exhibitor) {
      throw new SummitExhibitorServiceError(
        "The exhibitor registration could not be found.",
        404,
        "EXHIBITOR_NOT_FOUND"
      );
    }

    return exhibitor;
  };

export {
  EXHIBITOR_PACKAGES,
};