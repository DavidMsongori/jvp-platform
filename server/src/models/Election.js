import mongoose from "mongoose";

const positionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Position name is required"],
      trim: true,
    },

    level: {
      type: String,
      enum: [
        "regional",
        "county",
        "constituency",
        "ward",
      ],
      required: true,
    },

    county: {
      type: String,
      trim: true,
      default: "",
    },

    constituency: {
      type: String,
      trim: true,
      default: "",
    },

    ward: {
      type: String,
      trim: true,
      default: "",
    },

    maxWinners: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    _id: true,
  }
);

const electionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Election name is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    /*
    =======================================================
    ELECTION TYPE
    =======================================================
    */

    type: {
      type: String,
      enum: ["elective", "nomination"],
      default: "elective",
      required: true,
    },

    /*
    =======================================================
    VETTING COMMITTEE
    =======================================================
    */

    vettingCommittee: {
      type: String,
      trim: true,
      default: "",
    },

    scope: {
      type: String,
      enum: [
        "regional",
        "county",
        "constituency",
        "ward",
      ],
      required: true,
    },

    county: {
      type: String,
      trim: true,
      default: "",
    },

    constituency: {
      type: String,
      trim: true,
      default: "",
    },

    ward: {
      type: String,
      trim: true,
      default: "",
    },

    positions: {
      type: [positionSchema],
      default: [],
    },

    applicationStart: {
      type: Date,
      default: null,
    },

    applicationEnd: {
      type: Date,
      default: null,
    },

    votingStart: {
      type: Date,
      default: null,
    },

    votingEnd: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "open",
        "voting",
        "closed",
        "results",
        "cancelled",
      ],
      default: "draft",
    },

    resultsPublished: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

electionSchema.index({
  status: 1,
  votingStart: 1,
  votingEnd: 1,
});

electionSchema.index({
  type: 1,
  status: 1,
});

electionSchema.index({
  scope: 1,
  county: 1,
  constituency: 1,
  ward: 1,
});

/* =======================================================
   VALIDATION
======================================================= */

electionSchema.pre("validate", function () {
  /*
  -------------------------------------------------------
  SCOPE VALIDATION
  -------------------------------------------------------
  */

  if (this.scope === "regional") {
    this.county = "";
    this.constituency = "";
    this.ward = "";
  }

  if (this.scope === "county") {
    if (!this.county) {
      throw new Error(
        "County is required for a county election."
      );
    }

    this.constituency = "";
    this.ward = "";
  }

  if (this.scope === "constituency") {
    if (!this.county || !this.constituency) {
      throw new Error(
        "County and constituency are required for a constituency election."
      );
    }

    this.ward = "";
  }

  if (this.scope === "ward") {
    if (
      !this.county ||
      !this.constituency ||
      !this.ward
    ) {
      throw new Error(
        "County, constituency and ward are required for a ward election."
      );
    }
  }

  /*
  -------------------------------------------------------
  NOMINATION VALIDATION
  -------------------------------------------------------
  */

  if (
    this.type === "nomination" &&
    !this.vettingCommittee
  ) {
    throw new Error(
      "Vetting committee is required for nomination exercises."
    );
  }

  /*
  -------------------------------------------------------
  NOMINATION DOES NOT USE VOTING
  -------------------------------------------------------
  */

  if (this.type === "nomination") {
    this.votingStart = null;
    this.votingEnd = null;
    this.resultsPublished = false;
  }

  /*
  -------------------------------------------------------
  APPLICATION TIMELINE
  -------------------------------------------------------
  */

  if (
    this.applicationStart &&
    this.applicationEnd &&
    this.applicationEnd <= this.applicationStart
  ) {
    throw new Error(
      "Application end time must be after application start time."
    );
  }

  /*
  -------------------------------------------------------
  VOTING TIMELINE
  -------------------------------------------------------
  */

  if (
    this.type === "elective" &&
    this.votingStart &&
    this.votingEnd &&
    this.votingEnd <= this.votingStart
  ) {
    throw new Error(
      "Voting end time must be after voting start time."
    );
  }
});

/* =======================================================
   MODEL
======================================================= */

const Election = mongoose.model(
  "Election",
  electionSchema
);

export default Election;