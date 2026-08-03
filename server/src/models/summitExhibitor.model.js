import mongoose from "mongoose";

/* ==========================================================
   SUMMIT EXHIBITOR SCHEMA
========================================================== */

const summitExhibitorSchema =
  new mongoose.Schema(
    {
      /* ========================================
         SUMMIT
      ======================================== */

      summitEvent: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "SummitEvent",
        required: true,
        index: true,
      },

      /* ========================================
         PACKAGE
      ======================================== */

      packageId: {
        type: String,
        required: true,
        enum: [
          "youth",
          "bronze",
          "silver",
          "gold",
          "premium",
        ],
        lowercase: true,
        trim: true,
        index: true,
      },

      packageName: {
        type: String,
        required: true,
        trim: true,
      },

      packageAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      /* ========================================
         ORGANIZATION
      ======================================== */

      organizationName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      organizationType: {
        type: String,
        required: true,
        enum: [
          "youth_enterprise",
          "startup",
          "company",
          "ngo",
          "government",
          "educational",
          "other",
        ],
      },

      county: {
        type: String,
        required: true,
        trim: true,
      },

      /* ========================================
         CONTACT
      ======================================== */

      contactPerson: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      /* ========================================
         EXHIBITION DETAILS
      ======================================== */

      productsOrServices: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },

      exhibitionRequirements: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },

      /* ========================================
         ADMIN STATUS
      ======================================== */

      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
          "payment_pending",
          "confirmed",
          "cancelled",
        ],
        default: "pending",
        index: true,
      },

      paymentStatus: {
        type: String,
        enum: [
          "not_requested",
          "pending",
          "paid",
          "failed",
          "refunded",
        ],
        default: "not_requested",
        index: true,
      },

      adminNotes: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },

      reviewedBy: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      /* ========================================
         CONSENT
      ======================================== */

      acceptedTerms: {
        type: Boolean,
        required: true,
        default: false,
      },

      submittedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

/* ==========================================================
   INDEXES
========================================================== */

summitExhibitorSchema.index(
  {
    summitEvent: 1,
    email: 1,
  },
  {
    unique: true,
    name: "unique_summit_exhibitor_email",
  }
);

summitExhibitorSchema.index({
  summitEvent: 1,
  status: 1,
  submittedAt: -1,
});

/* ==========================================================
   VALIDATION
========================================================== */

summitExhibitorSchema.pre(
  "validate",
  function validateExhibitor() {
    if (!this.acceptedTerms) {
      throw new Error(
        "The exhibitor declaration must be accepted."
      );
    }
  }
);

/* ==========================================================
   MODEL
========================================================== */

const SummitExhibitor =
  mongoose.models.SummitExhibitor ||
  mongoose.model(
    "SummitExhibitor",
    summitExhibitorSchema
  );

export default SummitExhibitor;