import mongoose from "mongoose";

/* ===========================================================
   POSITION SCHEMA
=========================================================== */

const positionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Position name is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
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

/* ===========================================================
   VOTER ELIGIBILITY SCHEMA

   Defines who is allowed to vote in an election.

   Examples:

   1. All active members

      {
        type: "all_active_members"
      }

   2. All Youth Assembly members

      {
        type: "leaders",
        category: "youth_assembly"
      }

   3. County Youth MCAs

      {
        type: "leaders",
        category: "youth_assembly",
        position: "Youth MCA",
        scope: "county",
        county: "Mombasa"
      }

   4. Leaders in a particular constituency

      {
        type: "leaders",
        category: "youth_assembly",
        county: "Mombasa",
        constituency: "Kisauni"
      }

   This is intentionally generic so the same system can
   support Mombasa, Kilifi, Tana River, Kwale, Lamu,
   Taita Taveta and regional elections.
=========================================================== */

const voterEligibilitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "all_active_members",
        "leaders",
      ],
      default: "all_active_members",
      required: true,
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    position: {
      type: String,
      trim: true,
      default: "",
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    scope: {
      type: String,
      enum: [
        "",
        "regional",
        "county",
        "constituency",
        "ward",
      ],
      default: "",
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

    requireActiveLeadership: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

/* ===========================================================
   ELECTION SCHEMA
=========================================================== */

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

    type: {
      type: String,
      enum: ["elective", "nomination"],
      default: "elective",
      required: true,
    },

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

    /* =======================================================
       VOTER ELIGIBILITY
    ======================================================= */

    voterEligibility: {
      type: voterEligibilitySchema,
      default: () => ({
        type: "all_active_members",
      }),
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

/* ===========================================================
   INDEXES
=========================================================== */

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

/*
 * Helps identify/filter elections by voter eligibility.
 */
electionSchema.index({
  "voterEligibility.type": 1,
  "voterEligibility.category": 1,
  "voterEligibility.position": 1,
});

electionSchema.index({
  "voterEligibility.county": 1,
  "voterEligibility.constituency": 1,
  "voterEligibility.ward": 1,
});

/* ===========================================================
   VALIDATION
=========================================================== */

electionSchema.pre("validate", function () {
  /* =========================================================
     ELECTION GEOGRAPHY
  ========================================================= */

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
    if (
      !this.county ||
      !this.constituency
    ) {
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

  /* =========================================================
     NOMINATION VALIDATION
  ========================================================= */

  if (
    this.type === "nomination" &&
    !this.vettingCommittee
  ) {
    throw new Error(
      "Vetting committee is required for nomination exercises."
    );
  }

  if (this.type === "nomination") {
    this.votingStart = null;
    this.votingEnd = null;
    this.resultsPublished = false;
  }

  /* =========================================================
     APPLICATION DATES
  ========================================================= */

  if (
    this.applicationStart &&
    this.applicationEnd &&
    this.applicationEnd <= this.applicationStart
  ) {
    throw new Error(
      "Application end time must be after application start time."
    );
  }

  /* =========================================================
     VOTING DATES
  ========================================================= */

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

  /* =========================================================
     VOTER ELIGIBILITY VALIDATION
  ========================================================= */

  const eligibility = this.voterEligibility;

  /*
   * Default to all active members if no eligibility
   * configuration was supplied.
   */
  if (!eligibility) {
    this.voterEligibility = {
      type: "all_active_members",
    };

    return;
  }

  /* ---------------------------------------------------------
     ALL ACTIVE MEMBERS
  --------------------------------------------------------- */

  if (
    eligibility.type === "all_active_members"
  ) {
    /*
     * These fields are irrelevant when every
     * active member is eligible.
     */
    eligibility.category = "";
    eligibility.position = "";
    eligibility.department = "";
    eligibility.scope = "";
    eligibility.county = "";
    eligibility.constituency = "";
    eligibility.ward = "";

    return;
  }

  /* ---------------------------------------------------------
     LEADERS
  --------------------------------------------------------- */

  if (eligibility.type === "leaders") {
    /*
     * At least one leadership filter should normally
     * be provided. This prevents accidentally creating
     * an unrestricted leaders electorate.
     */
    const hasLeadershipFilter = Boolean(
      eligibility.category ||
        eligibility.position ||
        eligibility.department ||
        eligibility.county ||
        eligibility.constituency ||
        eligibility.ward
    );

    if (!hasLeadershipFilter) {
      throw new Error(
        "At least one leadership eligibility filter is required when voter type is leaders."
      );
    }

    /* =======================================================
       GEOGRAPHY HIERARCHY
    ======================================================= */

    if (eligibility.scope === "regional") {
      eligibility.county = "";
      eligibility.constituency = "";
      eligibility.ward = "";
    }

    if (eligibility.scope === "county") {
      if (!eligibility.county) {
        throw new Error(
          "County is required for county-level voter eligibility."
        );
      }

      eligibility.constituency = "";
      eligibility.ward = "";
    }

    if (
      eligibility.scope === "constituency"
    ) {
      if (
        !eligibility.county ||
        !eligibility.constituency
      ) {
        throw new Error(
          "County and constituency are required for constituency-level voter eligibility."
        );
      }

      eligibility.ward = "";
    }

    if (eligibility.scope === "ward") {
      if (
        !eligibility.county ||
        !eligibility.constituency ||
        !eligibility.ward
      ) {
        throw new Error(
          "County, constituency and ward are required for ward-level voter eligibility."
        );
      }
    }
  }
});

/* ===========================================================
   MODEL
=========================================================== */

const Election = mongoose.model(
  "Election",
  electionSchema
);

export default Election;