import mongoose from "mongoose";

/* ==========================================================
   CLOUDINARY IMAGE SCHEMA
========================================================== */

const cloudinaryImageSchema =
  new mongoose.Schema(
    {
      publicId: {
        type: String,
        required: true,
        trim: true,
      },

      assetId: {
        type: String,
        default: null,
        trim: true,
      },

      url: {
        type: String,
        required: true,
        trim: true,
      },

      secureUrl: {
        type: String,
        required: true,
        trim: true,
      },

      resourceType: {
        type: String,
        default: "image",
        trim: true,
      },

      format: {
        type: String,
        default: null,
        trim: true,
      },

      bytes: {
        type: Number,
        default: null,
        min: 0,
      },

      width: {
        type: Number,
        default: null,
        min: 1,
      },

      height: {
        type: Number,
        default: null,
        min: 1,
      },

      folder: {
        type: String,
        default: null,
        trim: true,
      },

      originalFilename: {
        type: String,
        default: null,
        trim: true,
      },

      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    }
  );

const summitPosterSchema = new mongoose.Schema(
  {
    /* ==========================================================
       PARTICIPANT
    ========================================================== */

    fullName: {
  type: String,
  required: true,
  trim: true,
  minlength: 3,
  maxlength: 150,
},

    email: {
  type: String,
  required: true,
  lowercase: true,
  trim: true,
  maxlength: 150,
  index: true,
},

   phoneNumber: {
  type: String,
  required: true,
  trim: true,
  index: true,
},

   county: {
  type: String,
  required: true,

  enum: [
    "Kilifi",
    "Mombasa",
    "Kwale",
    "Taita Taveta",
    "Tana River",
    "Lamu",
  ],

  index: true,
},

    socialHandle: {
      type: String,
      default: null,
      trim: true,
    },

    /* ==========================================================
   IMAGES
========================================================== */

originalPhoto: {
  type:
    cloudinaryImageSchema,

  required: true,
},

previewPoster: {
  type:
    cloudinaryImageSchema,

  default: null,
},

finalPoster: {
  type:
    cloudinaryImageSchema,

  default: null,
},

    /* ==========================================================
       POSTER DETAILS
    ========================================================== */

    posterReference: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    downloadToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    downloadCount: {
      type: Number,
      default: 0,
    },

   /* ==========================================================
   PAYMENT
========================================================== */

amount: {
  type: Number,
  required: true,
  default: 50,
  min: 1,
},

paymentMethod: {
  type: String,
  enum: ["M-PESA"],
  default: "M-PESA",
},

tillNumber: {
  type: String,
  required: true,
  trim: true,
},

mpesaTransactionCode: {
  type: String,
  uppercase: true,
  trim: true,

  /*
   * Do not use default: null.
   * The field must remain absent until a
   * participant submits a transaction code.
   */
  default: undefined,
},

paymentStatus: {
  type: String,
  enum: [
    "pending",
    "submitted",
    "confirmed",
    "rejected",
  ],
  default: "pending",
  index: true,
},

paymentConfirmedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

paymentConfirmedAt: {
  type: Date,
  default: null,
},

paymentRejectedReason: {
  type: String,
  default: null,
},

paymentSubmittedAt: {
  type: Date,
  default: null,
},

    /* ==========================================================
       POSTER STATUS
    ========================================================== */

    status: {
      type: String,
      enum: [
        "pending_payment",
        "payment_submitted",
        "approved",
        "generating",
        "ready",
        "downloaded",
        "rejected",
      ],
      default: "pending_payment",
      index: true,
    },

    generatedAt: {
      type: Date,
      default: null,
    },

    downloadedAt: {
      type: Date,
      default: null,
    },

    /* ==========================================================
       ADMIN
    ========================================================== */

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: null,
    },

    /* ==========================================================
       CONSENT
    ========================================================== */

    consentAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ==========================================================
   INDEXES
========================================================== */

summitPosterSchema.index({
  paymentStatus: 1,
  status: 1,
});

summitPosterSchema.index({
  createdAt: -1,
});

summitPosterSchema.index(
  {
    mpesaTransactionCode: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      mpesaTransactionCode: {
        $type: "string",
      },
    },

    name:
      "unique_summit_poster_mpesa_code",
  }
);

const SummitPoster =
  mongoose.models.SummitPoster ||
  mongoose.model(
    "SummitPoster",
    summitPosterSchema
  );

export default SummitPoster;