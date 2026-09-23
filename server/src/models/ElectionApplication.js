import mongoose from "mongoose";

const electionApplicationSchema = new mongoose.Schema(
  {
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: [true, "Election is required"],
    },

    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Position is required"],
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Member is required"],
    },

    statement: {
      type: String,
      required: [true, "Statement of interest is required"],
      trim: true,
    },

    experience: {
      type: String,
      trim: true,
      default: "",
    },

    manifesto: {
      type: String,
      trim: true,
      default: "",
    },

    photo: {
      type: String,
      trim: true,
      default: "",
    },

    documents: [
      {
        name: {
          type: String,
          trim: true,
          default: "",
        },

        url: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],

    declaration: {
      type: Boolean,
      default: false,
    },

    /*
    =======================================================
    APPLICATION STATUS
    =======================================================
    */

    status: {
      type: String,
      enum: [
        "submitted",
        "review",
        "vetted",
        "approved",
        "rejected",
        "withdrawn",
        "appointed",
      ],
      default: "submitted",
    },

    /*
    =======================================================
    GENERAL REVIEW
    =======================================================
    */

    remarks: {
      type: String,
      trim: true,
      default: "",
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

    /*
    =======================================================
    NOMINATION / VETTING
    =======================================================
    */

    vettingVerdict: {
      type: String,
      enum: [
        "",
        "approved",
        "rejected",
        "deferred",
      ],
      default: "",
    },

    vettingRemarks: {
      type: String,
      trim: true,
      default: "",
    },

    vettedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    vettedAt: {
      type: Date,
      default: null,
    },

    /*
    =======================================================
    APPOINTMENT
    =======================================================
    */

    appointedAt: {
      type: Date,
      default: null,
    },

    appointedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    appointmentRemarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =======================================================
   INDEXES
======================================================= */

electionApplicationSchema.index(
  {
    election: 1,
    positionId: 1,
    member: 1,
  },
  {
    unique: true,
  }
);

electionApplicationSchema.index({
  election: 1,
  status: 1,
});

electionApplicationSchema.index({
  election: 1,
  vettingVerdict: 1,
});

electionApplicationSchema.index({
  member: 1,
  status: 1,
});

electionApplicationSchema.index({
  appointedAt: 1,
});

/* =======================================================
   MODEL
======================================================= */

const ElectionApplication = mongoose.model(
  "ElectionApplication",
  electionApplicationSchema
);

export default ElectionApplication;