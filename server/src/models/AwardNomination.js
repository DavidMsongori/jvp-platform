import mongoose from "mongoose";

const awardNominationSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AwardCategory",
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    county: {
      type: String,
      required: true,
      enum: [
        "Mombasa",
        "Kwale",
        "Kilifi",
        "Tana River",
        "Lamu",
        "Taita Taveta",
      ],
    },

    constituency: {
      type: String,
      trim: true,
      default: null,
    },

    ward: {
      type: String,
      trim: true,
      default: null,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    currentRole: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },

    nominationStatement: {
      type: String,
      required: true,
      trim: true,
      minlength: 30,
      maxlength: 3000,
    },

    achievements: {
      type: String,
      required: true,
      trim: true,
      minlength: 30,
      maxlength: 5000,
    },

    evidenceLinks: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 1000,
        },
      ],
      default: [],
      validate: {
        validator: (links) => links.length <= 10,
        message: "A nomination may include a maximum of 10 evidence links.",
      },
    },

    nomineeConsent: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value) => value === true,
        message: "The nominee must consent before the nomination is submitted.",
      },
    },

  
    nominatedByMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
      index: true,
    },

    createdByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },


    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "withdrawn",
      ],
      default: "submitted",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

awardNominationSchema.index({ category: 1, status: 1, createdAt: -1 });

awardNominationSchema.index({ nominatedByMember: 1, createdAt: -1 });

awardNominationSchema.index({ category: 1, fullName: 1 });

const AwardNomination =
  mongoose.models.AwardNomination ||
  mongoose.model("AwardNomination", awardNominationSchema);

export default AwardNomination;