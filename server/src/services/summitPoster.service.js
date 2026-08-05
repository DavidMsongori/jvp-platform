import crypto from "crypto";

import SummitPoster from "../models/summitPoster.model.js";
import AppError from "../utils/AppError.js";
import ActivityLog from "../models/ActivityLog.js";

/* ==========================================================
   CONFIGURATION
========================================================== */

const POSTER_PRICE =
  Number(
    process.env.SUMMIT_POSTER_PRICE
  ) || 50;

const POSTER_TILL_NUMBER =
  String(
    process.env.SUMMIT_POSTER_TILL_NUMBER ||
      ""
  ).trim();

const POSTER_REFERENCE_PREFIX =
  String(
    process.env
      .SUMMIT_POSTER_REFERENCE_PREFIX ||
      "CYS-POSTER"
  )
    .trim()
    .toUpperCase();

/* ==========================================================
   CONSTANTS
========================================================== */

const COASTAL_COUNTIES = [
  "Kilifi",
  "Mombasa",
  "Kwale",
  "Taita Taveta",
  "Tana River",
  "Lamu",
];

const PAYMENT_STATUSES = [
  "pending",
  "submitted",
  "confirmed",
  "rejected",
];

const POSTER_STATUSES = [
  "pending_payment",
  "payment_submitted",
  "approved",
  "generating",
  "ready",
  "downloaded",
  "rejected",
];

/* ==========================================================
   HELPERS
========================================================== */

const escapeRegex = (value = "") => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const normalizeEmail = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const normalizeKenyanPhone = (value) => {
  const phone = String(value || "")
    .trim()
    .replace(/[^\d+]/g, "");

  if (/^\+254[17]\d{8}$/.test(phone)) {
    return phone.slice(1);
  }

  if (/^254[17]\d{8}$/.test(phone)) {
    return phone;
  }

  if (/^0[17]\d{8}$/.test(phone)) {
    return `254${phone.slice(1)}`;
  }

  throw new AppError(
    400,
    "Enter a valid Kenyan mobile phone number."
  );
};

const normalizeTransactionCode = (value) => {
  const transactionCode = String(
    value || ""
  )
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  /*
   * M-Pesa transaction codes are normally
   * ten alphanumeric characters.
   */
  if (
    !/^[A-Z0-9]{10}$/.test(
      transactionCode
    )
  ) {
    throw new AppError(
      400,
      "Enter a valid 10-character M-Pesa transaction code."
    );
  }

  return transactionCode;
};

const normalizeCounty = (value) => {
  const county = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  const matchedCounty =
    COASTAL_COUNTIES.find(
      (item) =>
        item.toLowerCase() ===
        county.toLowerCase()
    );

  if (!matchedCounty) {
    throw new AppError(
      400,
      "Select one of the six Coastal Counties."
    );
  }

  return matchedCounty;
};

const getUserId = (user) => {
  return user?._id || user || null;
};

const generateDownloadToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
};

/* ==========================================================
   CLOUDINARY IMAGE VALIDATION
========================================================== */

const validateCloudinaryImage = (
  image,
  fieldLabel = "Image"
) => {
  if (
    !image ||
    typeof image !== "object"
  ) {
    throw new AppError(
      400,
      `${fieldLabel} details are required.`
    );
  }

  const publicId =
    String(
      image.publicId || ""
    ).trim();

  const secureUrl =
    String(
      image.secureUrl ||
        image.url ||
        ""
    ).trim();

  if (
    !publicId ||
    !secureUrl
  ) {
    throw new AppError(
      400,
      `${fieldLabel} must contain a Cloudinary public ID and URL.`
    );
  }

  return {
    publicId,

    assetId:
      image.assetId ||
      null,

    url:
      image.url ||
      secureUrl,

    secureUrl,

    resourceType:
      image.resourceType ||
      "image",

    format:
      image.format ||
      null,

    bytes:
      Number(
        image.bytes
      ) || null,

    width:
      Number(
        image.width
      ) || null,

    height:
      Number(
        image.height
      ) || null,

    folder:
      image.folder ||
      null,

    originalFilename:
      image.originalFilename ||
      null,

    uploadedAt:
      image.uploadedAt
        ? new Date(
            image.uploadedAt
          )
        : new Date(),
  };
};


const createPosterReference = async () => {
  const year =
    new Date().getFullYear();

  for (
    let attempt = 0;
    attempt < 10;
    attempt += 1
  ) {
    const randomPart = crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();

    const reference =
      `${POSTER_REFERENCE_PREFIX}-${year}-${randomPart}`;

    const exists =
      await SummitPoster.exists({
        posterReference:
          reference,
      });

    if (!exists) {
      return reference;
    }
  }

  throw new AppError(
    500,
    "Unable to generate a unique poster reference."
  );
};

const validatePosterConfiguration = () => {
  const invalidValues = [
    "",
    "undefined",
    "null",
  ];

  if (
    invalidValues.includes(
      String(
        POSTER_TILL_NUMBER
      )
        .trim()
        .toLowerCase()
    )
  ) {
    throw new AppError(
      500,
      "The summit poster Till Number has not been configured."
    );
  }
};

const findPosterById = async (
  posterId,
  {
    populateAdmin = false,
  } = {}
) => {
  let query =
    SummitPoster.findById(
      posterId
    );

  if (populateAdmin) {
    query = query
      .populate(
        "paymentConfirmedBy",
        "email role"
      )
      .populate(
        "approvedBy",
        "email role"
      );
  }

  const poster =
    await query;

  if (!poster) {
    throw new AppError(
      404,
      "Summit poster request not found."
    );
  }

  return poster;
};

const findPosterByReference =
  async (
    posterReference,
    {
      populateAdmin = false,
    } = {}
  ) => {
    const normalizedReference =
      String(
        posterReference || ""
      )
        .trim()
        .toUpperCase();

    if (!normalizedReference) {
      throw new AppError(
        400,
        "Poster reference is required."
      );
    }

    let query =
      SummitPoster.findOne({
        posterReference:
          normalizedReference,
      });

    if (populateAdmin) {
      query = query
        .populate(
          "paymentConfirmedBy",
          "email role"
        )
        .populate(
          "approvedBy",
          "email role"
        );
    }

    const poster =
      await query;

    if (!poster) {
      throw new AppError(
        404,
        "Summit poster request not found."
      );
    }

    return poster;
  };

/* ==========================================================
   ACTIVITY LOG
========================================================== */

const createActivityLog =
  async ({
    user = null,
    title,
    action,
    description,
    targetId = null,
    metadata = {},
  }) => {
    try {
      await ActivityLog.create({
        user:
          getUserId(user),

        title,

        action,

        module:
          "summit_posters",

        description,

        targetId,

        metadata,
      });
    } catch (error) {
      /*
       * Activity logging should not block
       * the main poster workflow.
       */
      console.error(
        "Unable to create summit poster activity log:",
        error.message
      );
    }
  };

/* ==========================================================
   CREATE POSTER REQUEST
========================================================== */

export const createSummitPosterRequest =
  async ({
    fullName,
    email,
    phoneNumber,
    county,
    socialHandle = null,

    originalPhoto,

    consentAccepted,

    ipAddress = null,
    userAgent = null,
  }) => {
    validatePosterConfiguration();

    const normalizedName =
      String(fullName || "")
        .trim()
        .replace(/\s+/g, " ");

    if (
      normalizedName.length < 3 ||
      normalizedName.length > 150
    ) {
      throw new AppError(
        400,
        "Full name must be between 3 and 150 characters."
      );
    }

    const normalizedEmail =
      normalizeEmail(email);

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      throw new AppError(
        400,
        "Enter a valid email address."
      );
    }

    const normalizedPhone =
      normalizeKenyanPhone(
        phoneNumber
      );

    const normalizedCounty =
      normalizeCounty(county);

    const normalizedOriginalPhoto =
  validateCloudinaryImage(
    originalPhoto,
    "Participant photo"
  );


    if (
      consentAccepted !== true
    ) {
      throw new AppError(
        400,
        "You must consent to the use of your photo for poster generation."
      );
    }

    /*
     * Prevent accidental duplicate pending
     * requests from the same participant.
     */
    const existingRequest =
      await SummitPoster.findOne({
        $or: [
          {
            email:
              normalizedEmail,
          },
          {
            phoneNumber:
              normalizedPhone,
          },
        ],

        status: {
          $in: [
            "pending_payment",
            "payment_submitted",
            "approved",
            "generating",
            "ready",
          ],
        },
      }).sort({
        createdAt: -1,
      });

    if (existingRequest) {
      return {
        poster:
          existingRequest,

        isExisting: true,

        paymentInstructions: {
          amount:
            existingRequest.amount,

          tillNumber:
            existingRequest
              .tillNumber,

          posterReference:
            existingRequest
              .posterReference,
        },
      };
    }

    const posterReference =
      await createPosterReference();

    const poster =
      await SummitPoster.create({
        fullName:
          normalizedName,

        email:
          normalizedEmail,

        phoneNumber:
          normalizedPhone,

        county:
          normalizedCounty,

        socialHandle:
          socialHandle
            ? String(
                socialHandle
              )
                .trim()
                .slice(0, 100)
            : null,

        /*
 * Cloudinary participant image metadata.
 */
originalPhoto:
  normalizedOriginalPhoto,

        posterReference,

        amount:
          POSTER_PRICE,

        paymentMethod:
          "M-PESA",

        tillNumber:
          POSTER_TILL_NUMBER,

        paymentStatus:
          "pending",

        status:
          "pending_payment",

        consentAccepted:
          true,

        ipAddress,

        userAgent,
      });

    await createActivityLog({
      title:
        "Summit Poster Requested",

      action:
        "Poster request created",

      description:
        "A participant submitted an attendance poster request.",

      targetId:
        poster._id,

      metadata: {
        posterReference,

        county:
          normalizedCounty,

        amount:
          POSTER_PRICE,

        paymentStatus:
          poster.paymentStatus,
      },
    });

    return {
      poster,

      isExisting: false,

      paymentInstructions: {
        amount:
          poster.amount,

        tillNumber:
          poster.tillNumber,

        posterReference:
          poster.posterReference,

        message:
          `Pay KES ${poster.amount} to Till Number ${poster.tillNumber}, then submit your M-Pesa transaction code.`,
      },
    };
  };

/* ==========================================================
   SUBMIT M-PESA TRANSACTION CODE
========================================================== */

export const submitPosterPayment =
  async ({
    posterReference,
    transactionCode,
  }) => {
    const poster =
      await findPosterByReference(
        posterReference
      );

 // Backfill Till Number for old poster requests
if (!poster.tillNumber) {
  poster.tillNumber = POSTER_TILL_NUMBER;
}     

    if (
      poster.paymentStatus ===
      "confirmed"
    ) {
      return {
        poster,
        alreadyConfirmed: true,
      };
    }

    if (
      [
        "ready",
        "downloaded",
      ].includes(
        poster.status
      )
    ) {
      throw new AppError(
        400,
        "This poster request has already been completed."
      );
    }

    const normalizedCode =
      normalizeTransactionCode(
        transactionCode
      );

    const duplicatePayment =
      await SummitPoster.findOne({
        mpesaTransactionCode:
          normalizedCode,

        _id: {
          $ne: poster._id,
        },
      });

    if (duplicatePayment) {
      throw new AppError(
        409,
        "This M-Pesa transaction code has already been submitted."
      );
    }

    poster.mpesaTransactionCode =
      normalizedCode;

    poster.paymentStatus =
      "submitted";

    poster.status =
      "payment_submitted";

    /*
     * Add paymentSubmittedAt to the model
     * if you want to persist this timestamp.
     */
    if (
      poster.schema.path(
        "paymentSubmittedAt"
      )
    ) {
      poster.paymentSubmittedAt =
        new Date();
    }

    poster.paymentRejectedReason =
      null;

    await poster.save();

    await createActivityLog({
      title:
        "Poster Payment Submitted",

      action:
        "Payment code submitted",

      description:
        "A participant submitted an M-Pesa transaction code for poster payment verification.",

      targetId:
        poster._id,

      metadata: {
        posterReference:
          poster.posterReference,

        transactionCode:
          normalizedCode,

        amount:
          poster.amount,
      },
    });

    return {
      poster,

      message:
        "Your M-Pesa transaction code has been submitted. The JVP team will verify the payment.",
    };
  };

/* ==========================================================
   PUBLIC POSTER STATUS
========================================================== */

export const getPosterStatus =
  async ({
    posterReference,
    email = null,
    phoneNumber = null,
  }) => {
    const poster =
      await findPosterByReference(
        posterReference
      );

    /*
     * Require one participant detail to reduce
     * exposure through reference guessing.
     */
    if (
      !email &&
      !phoneNumber
    ) {
      throw new AppError(
        400,
        "Email address or phone number is required to check poster status."
      );
    }

    const emailMatches =
      email &&
      normalizeEmail(email) ===
        poster.email;

    let phoneMatches = false;

    if (phoneNumber) {
      try {
        phoneMatches =
          normalizeKenyanPhone(
            phoneNumber
          ) ===
          poster.phoneNumber;
      } catch {
        phoneMatches = false;
      }
    }

    if (
      !emailMatches &&
      !phoneMatches
    ) {
      throw new AppError(
        403,
        "The supplied details do not match this poster request."
      );
    }

    return {
      posterReference:
        poster.posterReference,

      fullName:
        poster.fullName,

      county:
        poster.county,

      amount:
        poster.amount,

      tillNumber:
        poster.tillNumber,

      paymentStatus:
        poster.paymentStatus,

      status:
        poster.status,

      paymentRejectedReason:
        poster.paymentRejectedReason,

      previewPoster:
        poster.previewPoster,

      finalPoster:
        poster.status ===
          "ready" ||
        poster.status ===
          "downloaded"
          ? poster.finalPoster
          : null,

      downloadToken:
        poster.status ===
          "ready" ||
        poster.status ===
          "downloaded"
          ? poster.downloadToken
          : null,

      createdAt:
        poster.createdAt,

      generatedAt:
        poster.generatedAt,
    };
  };

/* ==========================================================
   ADMIN LIST
========================================================== */

export const getSummitPosterRequests =
  async ({
    page = 1,
    limit = 20,
    search = "",
    county = "",
    paymentStatus = "",
    status = "",
  } = {}) => {
    const normalizedPage =
      Math.max(
        Number(page) || 1,
        1
      );

    const normalizedLimit =
      Math.min(
        Math.max(
          Number(limit) || 20,
          1
        ),
        100
      );

    const query = {};

    if (
      county &&
      COASTAL_COUNTIES.includes(
        county
      )
    ) {
      query.county = county;
    }

    if (
      paymentStatus &&
      PAYMENT_STATUSES.includes(
        paymentStatus
      )
    ) {
      query.paymentStatus =
        paymentStatus;
    }

    if (
      status &&
      POSTER_STATUSES.includes(
        status
      )
    ) {
      query.status = status;
    }

    const normalizedSearch =
      String(search || "")
        .trim()
        .slice(0, 100);

    if (normalizedSearch) {
      const searchPattern =
        new RegExp(
          escapeRegex(
            normalizedSearch
          ),
          "i"
        );

      query.$or = [
        {
          fullName:
            searchPattern,
        },
        {
          email:
            searchPattern,
        },
        {
          phoneNumber:
            searchPattern,
        },
        {
          posterReference:
            searchPattern,
        },
        {
          mpesaTransactionCode:
            searchPattern,
        },
      ];
    }

    const [
      posters,
      total,
    ] = await Promise.all([
      SummitPoster.find(query)
        .populate(
          "paymentConfirmedBy",
          "email role"
        )
        .populate(
          "approvedBy",
          "email role"
        )
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

      SummitPoster.countDocuments(
        query
      ),
    ]);

    const totalPages =
      Math.max(
        Math.ceil(
          total /
            normalizedLimit
        ),
        1
      );

    return {
      posters,

      pagination: {
        page:
          normalizedPage,

        limit:
          normalizedLimit,

        total,

        totalPages,

        hasNextPage:
          normalizedPage <
          totalPages,

        hasPreviousPage:
          normalizedPage >
          1,
      },
    };
  };

/* ==========================================================
   ADMIN GET SINGLE REQUEST
========================================================== */

export const getSummitPosterById =
  async (posterId) => {
    return findPosterById(
      posterId,
      {
        populateAdmin: true,
      }
    );
  };

/* ==========================================================
   ADMIN CONFIRM PAYMENT
========================================================== */

export const confirmPosterPayment =
  async ({
    posterId,
    adminUser,
    notes = null,
  }) => {
    const poster =
      await findPosterById(
        posterId
      );

    if (
      !poster.mpesaTransactionCode
    ) {
      throw new AppError(
        400,
        "The participant has not submitted an M-Pesa transaction code."
      );
    }

    if (
      poster.paymentStatus ===
      "confirmed"
    ) {
      return {
        poster,
        alreadyConfirmed: true,
      };
    }

    poster.paymentStatus =
      "confirmed";

    poster.paymentConfirmedBy =
      getUserId(
        adminUser
      );

    poster.paymentConfirmedAt =
      new Date();

    poster.paymentRejectedReason =
      null;

    poster.status =
      "approved";

    poster.approvedBy =
      getUserId(
        adminUser
      );

    poster.approvedAt =
      new Date();

    poster.notes =
      notes
        ? String(notes)
            .trim()
            .slice(0, 1000)
        : poster.notes;

    await poster.save();

    await createActivityLog({
      user:
        adminUser,

      title:
        "Poster Payment Confirmed",

      action:
        "Poster payment confirmed",

      description:
        "An administrator confirmed payment for a summit attendance poster.",

      targetId:
        poster._id,

      metadata: {
        posterReference:
          poster.posterReference,

        transactionCode:
          poster.mpesaTransactionCode,

        amount:
          poster.amount,
      },
    });

    return {
      poster,

      alreadyConfirmed: false,

      message:
        "Payment confirmed successfully. The poster can now be generated.",
    };
  };

/* ==========================================================
   ADMIN REJECT PAYMENT
========================================================== */

export const rejectPosterPayment =
  async ({
    posterId,
    adminUser,
    reason,
  }) => {
    const normalizedReason =
      String(reason || "")
        .trim();

    if (
      normalizedReason.length <
      3
    ) {
      throw new AppError(
        400,
        "A payment rejection reason is required."
      );
    }

    const poster =
      await findPosterById(
        posterId
      );

    if (
      poster.status ===
        "ready" ||
      poster.status ===
        "downloaded"
    ) {
      throw new AppError(
        400,
        "A completed poster payment cannot be rejected."
      );
    }

    poster.paymentStatus =
      "rejected";

    poster.paymentRejectedReason =
      normalizedReason.slice(
        0,
        500
      );

    poster.status =
      "rejected";

    poster.paymentConfirmedBy =
      null;

    poster.paymentConfirmedAt =
      null;

    poster.approvedBy =
      null;

    poster.approvedAt =
      null;

    await poster.save();

    await createActivityLog({
      user:
        adminUser,

      title:
        "Poster Payment Rejected",

      action:
        "Poster payment rejected",

      description:
        "An administrator rejected the submitted poster payment details.",

      targetId:
        poster._id,

      metadata: {
        posterReference:
          poster.posterReference,

        transactionCode:
          poster.mpesaTransactionCode,

        reason:
          poster.paymentRejectedReason,
      },
    });

    return {
      poster,

      message:
        "Payment submission rejected.",
    };
  };

/* ==========================================================
   MARK POSTER AS GENERATING
========================================================== */

export const markPosterGenerating =
  async ({
    posterId,
    adminUser,
  }) => {
    const poster =
      await findPosterById(
        posterId
      );

    if (
      poster.paymentStatus !==
      "confirmed"
    ) {
      throw new AppError(
        400,
        "Payment must be confirmed before generating the poster."
      );
    }

    poster.status =
      "generating";

    await poster.save();

    await createActivityLog({
      user:
        adminUser,

      title:
        "Poster Generation Started",

      action:
        "Poster generation started",

      description:
        "Generation of a summit attendance poster was started.",

      targetId:
        poster._id,

      metadata: {
        posterReference:
          poster.posterReference,
      },
    });

    return poster;
  };

/* ==========================================================
   SAVE GENERATED POSTER
========================================================== */

export const completePosterGeneration =
  async ({
    posterId,
    previewPoster = null,
    finalPoster,
    adminUser = null,
  }) => {
    const normalizedFinalPoster =
      validateCloudinaryImage(
        finalPoster,
        "Final poster"
      );

    const normalizedPreviewPoster =
      previewPoster
        ? validateCloudinaryImage(
            previewPoster,
            "Preview poster"
          )
        : null;

    const poster =
      await findPosterById(
        posterId
      );

    if (
      poster.paymentStatus !==
      "confirmed"
    ) {
      throw new AppError(
        400,
        "Payment must be confirmed before the final poster can be released."
      );
    }

    if (
      normalizedPreviewPoster
    ) {
      poster.previewPoster =
        normalizedPreviewPoster;
    }

    poster.finalPoster =
      normalizedFinalPoster;

    poster.downloadToken =
      poster.downloadToken ||
      generateDownloadToken();

    poster.generatedAt =
      new Date();

    poster.status =
      "ready";

    await poster.save();

    await createActivityLog({
      user:
        adminUser,

      title:
        "Summit Poster Ready",

      action:
        "Poster generated",

      description:
        "A summit attendance poster was generated and uploaded to Cloudinary.",

      targetId:
        poster._id,

      metadata: {
        posterReference:
          poster.posterReference,

        finalPosterPublicId:
          normalizedFinalPoster
            .publicId,

        previewPosterPublicId:
          normalizedPreviewPoster
            ?.publicId ||
          null,
      },
    });

    return {
      poster,

      downloadUrl:
        poster.finalPoster
          ?.secureUrl ||
        poster.finalPoster
          ?.url ||
        null,

      message:
        "Poster generated successfully and is ready for download.",
    };
  };

/* ==========================================================
   SECURE DOWNLOAD
========================================================== */

export const getPosterForDownload =
  async ({
    downloadToken,
  }) => {
    const normalizedToken =
      String(
        downloadToken || ""
      ).trim();

    if (!normalizedToken) {
      throw new AppError(
        400,
        "Download token is required."
      );
    }

    const poster =
      await SummitPoster.findOne({
        downloadToken:
          normalizedToken,
      });

    if (!poster) {
      throw new AppError(
        404,
        "Poster download link not found."
      );
    }

    if (
      poster.paymentStatus !==
      "confirmed"
    ) {
      throw new AppError(
        403,
        "Payment has not been confirmed for this poster."
      );
    }

    const downloadUrl =
  poster.finalPoster
    ?.secureUrl ||
  poster.finalPoster
    ?.url ||
  null;

if (
  ![
    "ready",
    "downloaded",
  ].includes(
    poster.status
  ) ||
  !downloadUrl
) {
      throw new AppError(
        404,
        "The poster is not yet available for download."
      );
    }

    poster.downloadCount =
      Number(
        poster.downloadCount ||
          0
      ) + 1;

    poster.downloadedAt =
      new Date();

    poster.status =
      "downloaded";

    await poster.save();

    await createActivityLog({
      title:
        "Summit Poster Downloaded",

      action:
        "Poster downloaded",

      description:
        "A participant downloaded their summit attendance poster.",

      targetId:
        poster._id,

      metadata: {
        posterReference:
          poster.posterReference,

        downloadCount:
          poster.downloadCount,
      },
    });

   return {
  poster,

  downloadUrl,
};
    };

/* ==========================================================
   ADMIN NOTES
========================================================== */

export const updatePosterAdminNotes =
  async ({
    posterId,
    notes,
    adminUser,
  }) => {
    const poster =
      await findPosterById(
        posterId
      );

    poster.notes =
      notes
        ? String(notes)
            .trim()
            .slice(0, 1000)
        : null;

    await poster.save();

    await createActivityLog({
      user:
        adminUser,

      title:
        "Poster Notes Updated",

      action:
        "Poster notes updated",

      description:
        "Administrative notes for a summit poster request were updated.",

      targetId:
        poster._id,

      metadata: {
        posterReference:
          poster.posterReference,
      },
    });

    return poster;
  };

/* ==========================================================
   STATISTICS
========================================================== */

export const getSummitPosterStatistics =
  async () => {
    const [
      total,
      pendingPayment,
      paymentSubmitted,
      paymentConfirmed,
      ready,
      downloaded,
      confirmedRevenue,
      countyDistribution,
    ] = await Promise.all([
      SummitPoster.countDocuments(),

      SummitPoster.countDocuments({
        status:
          "pending_payment",
      }),

      SummitPoster.countDocuments({
        status:
          "payment_submitted",
      }),

      SummitPoster.countDocuments({
        paymentStatus:
          "confirmed",
      }),

      SummitPoster.countDocuments({
        status:
          "ready",
      }),

      SummitPoster.countDocuments({
        status:
          "downloaded",
      }),

      SummitPoster.aggregate([
        {
          $match: {
            paymentStatus:
              "confirmed",
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: "$amount",
            },
          },
        },
      ]),

      SummitPoster.aggregate([
        {
          $group: {
            _id: "$county",

            total: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            total: -1,
          },
        },
      ]),
    ]);

    return {
      total,

      pendingPayment,

      paymentSubmitted,

      paymentConfirmed,

      ready,

      downloaded,

      confirmedRevenue:
        confirmedRevenue[0]
          ?.total || 0,

      countyDistribution,
    };
  };

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  createSummitPosterRequest,
  submitPosterPayment,
  getPosterStatus,

  getSummitPosterRequests,
  getSummitPosterById,
  getSummitPosterStatistics,

  confirmPosterPayment,
  rejectPosterPayment,

  markPosterGenerating,
  completePosterGeneration,
  getPosterForDownload,

  updatePosterAdminNotes,
};