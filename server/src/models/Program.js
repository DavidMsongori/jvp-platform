
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

/* ===========================================================
   PROGRAM IMAGE SCHEMA

   Compatible with the image objects returned by the existing
   Cloudinary upload service used by the Events module.
=========================================================== */

const programImageSchema = new Schema(
  {
    assetId: {
      type: String,
      default: null,
    },

    publicId: {
      type: String,
      default: null,
      trim: true,
    },

    url: {
      type: String,
      default: null,
      trim: true,
    },

    secureUrl: {
      type: String,
      default: null,
      trim: true,
    },

    width: {
      type: Number,
      default: null,
      min: 0,
    },

    height: {
      type: Number,
      default: null,
      min: 0,
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

    resourceType: {
      type: String,
      default: "image",
    },

    alt: {
      type: String,
      default: "",
      trim: true,
      maxlength: 250,
    },

    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

/* ===========================================================
   PROGRAM / ACTIVITY SCHEMA
=========================================================== */

const programSchema = new Schema(
  {
    /* ------------------------------------------
       BASIC INFORMATION
    ------------------------------------------ */

    title: {
      type: String,
      required: [true, "Program title is required."],
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    recordType: {
      type: String,
      required: true,
      enum: {
        values: [
          "programme",
          "event",
          "activity",
          "initiative",
        ],
        message: "Invalid program record type.",
      },
      default: "programme",
      index: true,
    },

    category: {
      type: String,
      required: [true, "Program category is required."],
      enum: [
        "Leadership & Governance",
        "Civic Engagement",
        "Education & Skills Development",
        "Youth Employment & Entrepreneurship",
        "Environment & Climate Action",
        "Agriculture & Food Security",
        "Culture & Creative Arts",
        "Sports & Talent Development",
        "Health & Wellbeing",
        "Gender & Social Inclusion",
        "Community Development",
        "Advocacy & Public Participation",
        "Other",
      ],
      default: "Other",
      index: true,
    },

    summary: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    objectives: {
      type: [String],
      default: [],
    },

    /* ------------------------------------------
       PROGRAM HIERARCHY

       A flagship program can have many activities.
       Standalone records leave parentProgram null.
    ------------------------------------------ */

    parentProgram: {
      type: Schema.Types.ObjectId,
      ref: "Program",
      default: null,
      index: true,
    },

    /* ------------------------------------------
       DATE AND LOCATION
    ------------------------------------------ */

    startDate: {
      type: Date,
      default: null,
      index: true,
    },

    endDate: {
      type: Date,
      default: null,
    },

    county: {
      type: String,
      trim: true,
      enum: [
        "Kilifi",
        "Mombasa",
        "Kwale",
        "Taita Taveta",
        "Tana River",
        "Lamu",
        "Other",
      ],
      default: null,
      index: true,
    },

    subCounty: {
      type: String,
      trim: true,
      default: "",
    },

    ward: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "",
    },

    /* ------------------------------------------
       IMPLEMENTATION STATUS
    ------------------------------------------ */

    status: {
      type: String,
      enum: {
        values: [
          "planned",
          "ongoing",
          "completed",
        ],
        message: "Invalid program status.",
      },
      default: "planned",
      index: true,
    },

    /* ------------------------------------------
       IMPACT TRACKING

       Attendance and direct beneficiaries are
       separate measures and are not interchangeable.
    ------------------------------------------ */

    youthsAttended: {
      type: Number,
      default: 0,
      min: [0, "Attendance cannot be negative."],
      validate: {
        validator: Number.isInteger,
        message: "Attendance must be a whole number.",
      },
    },

    youthsBenefited: {
      type: Number,
      default: 0,
      min: [0, "Beneficiaries cannot be negative."],
      validate: {
        validator: Number.isInteger,
        message: "Beneficiaries must be a whole number.",
      },
    },

    impactSummary: {
      type: String,
      trim: true,
      default: "",
    },

    achievements: {
      type: [String],
      default: [],
    },

    /* ------------------------------------------
       PARTNERS AND SUPPORTERS
    ------------------------------------------ */

    partners: {
      type: [String],
      default: [],
    },

    /* ------------------------------------------
       MEDIA
    ------------------------------------------ */

    coverImage: {
      type: programImageSchema,
      default: null,
    },

    gallery: {
      type: [programImageSchema],
      default: [],
    },

    /* ------------------------------------------
       FEATURED / PUBLICATION CONTROLS
    ------------------------------------------ */

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ------------------------------------------
       SOFT DELETION

       Records are retained in the database when
       deleted, following the Events service pattern.
    ------------------------------------------ */

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    /* ------------------------------------------
       AUDIT FIELDS
    ------------------------------------------ */

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ===========================================================
   INDEXES
=========================================================== */

// Public program listings and category filtering.
programSchema.index({
  isPublished: 1,
  isDeleted: 1,
  status: 1,
});

programSchema.index({
  category: 1,
  county: 1,
  startDate: -1,
});

// Retrieve activities belonging to a flagship program.
programSchema.index({
  parentProgram: 1,
  isDeleted: 1,
});

// Support chronological admin listings.
programSchema.index({
  isDeleted: 1,
  startDate: -1,
});

// Support featured public content.
programSchema.index({
  isPublished: 1,
  isFeatured: 1,
  createdAt: -1,
});

/* ===========================================================
   EXPORT MODEL
=========================================================== */

const Program =
  models.Program || model("Program", programSchema);

export default Program;