
import mongoose from "mongoose";

import {
  LEADERSHIP_STATUS,
  LEADERSHIP_STATUS_VALUES,
  LEADERSHIP_OFFICE_VALUES,
  LEADERSHIP_OFFICES,
  LEGACY_LEADERSHIP_OFFICE_ALIASES,
  LEADERSHIP_CATEGORY_VALUES,
  LEADERSHIP_CATEGORIES,
  LEADERSHIP_LEVEL_VALUES,
  LEADERSHIP_LEVELS,
  LEADERSHIP_DEPARTMENT_VALUES,
  LEADERSHIP_DEPARTMENTS,
  LEADERSHIP_SCOPE_VALUES,
  REPORT_VISIBILITY_VALUES,
  REPORT_VISIBILITY,
  APPOINTMENT_TYPE_VALUES,
  COAST_COUNTIES,
  REGIONAL_CABINET_PORTFOLIOS,
  getRegionalCabinetPortfolio,
} from "../constants/leadership.constants.js";

const { Schema } = mongoose;

/* ============================================================
   NORMALIZATION HELPERS
============================================================ */

const normalizePosition = (position = "") => {
  const normalized = String(position)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!normalized) return "";

  return (
    LEGACY_LEADERSHIP_OFFICE_ALIASES[normalized] ||
    normalized
  );
};

const REGIONAL_PORTFOLIO_KEYS =
  REGIONAL_CABINET_PORTFOLIOS.map(
    (portfolio) => portfolio.key
  );

const isPatronRecord = (leader) =>
  leader.position === LEADERSHIP_OFFICES.PATRON ||
  leader.category === LEADERSHIP_CATEGORIES.PATRONAGE;

const isRegionalCabinetSecretary = (leader) =>
  leader.position === LEADERSHIP_OFFICES.CABINET_SECRETARY &&
  leader.level === LEADERSHIP_LEVELS.REGIONAL_CABINET;

/* ============================================================
   LEADER SCHEMA
============================================================ */

const leaderSchema = new Schema(
  {
    /* MEMBER */

    member: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      default: null,
      index: true,
    },

    /* PATRON PROFILE */

    patron: {
      fullName: {
        type: String,
        trim: true,
        default: "",
        maxlength: 150,
      },
      title: {
        type: String,
        trim: true,
        default: "",
        maxlength: 150,
      },
      organization: {
        type: String,
        trim: true,
        default: "",
        maxlength: 200,
      },
      photo: {
        type: String,
        trim: true,
        default: "",
      },
      bio: {
        type: String,
        trim: true,
        default: "",
        maxlength: 3000,
      },
    },

    /* CATEGORY */

    category: {
      type: String,
      enum: LEADERSHIP_CATEGORY_VALUES,
      required: true,
      index: true,
    },

    /* LEVEL */

    level: {
      type: String,
      enum: LEADERSHIP_LEVEL_VALUES,
      default: null,
      index: true,
    },

    /* OFFICE */

    position: {
      type: String,
      enum: LEADERSHIP_OFFICE_VALUES,
      required: true,
      index: true,
    },

    /* REGIONAL CABINET PORTFOLIO */

    portfolioKey: {
      type: String,
      enum: REGIONAL_PORTFOLIO_KEYS,
      default: null,
      index: true,
    },

    portfolioTitle: {
      type: String,
      trim: true,
      default: null,
      maxlength: 200,
    },

    portfolioSlug: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120,
      index: true,
    },

    /* DEPARTMENT */

    department: {
      type: String,
      enum: LEADERSHIP_DEPARTMENT_VALUES,
      default: null,
      index: true,
    },

    /* STRUCTURAL SCOPE */

    scope: {
      type: String,
      enum: LEADERSHIP_SCOPE_VALUES,
      default: null,
      index: true,
    },

    /* REPORT VISIBILITY */

    reportVisibility: {
      type: String,
      enum: REPORT_VISIBILITY_VALUES,
      default: REPORT_VISIBILITY.PRIVATE,
      index: true,
    },

    /* APPOINTMENT TYPE */

    appointmentType: {
      type: String,
      enum: APPOINTMENT_TYPE_VALUES,
      required: true,
      index: true,
    },

    /* GEOGRAPHY */

    county: {
      type: String,
      enum: COAST_COUNTIES,
      default: null,
      index: true,
    },

    constituency: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    ward: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    /* DISPLAY */

    displayOrder: {
      type: Number,
      default: 999,
      min: 1,
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* TERM */

    termStart: {
      type: Date,
      default: Date.now,
      required: true,
    },

    termEnd: {
      type: Date,
      default: null,
    },

    /* STATUS */

    status: {
      type: String,
      enum: LEADERSHIP_STATUS_VALUES,
      default: LEADERSHIP_STATUS.ACTIVE,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    verified: {
      type: Boolean,
      default: true,
      index: true,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    /* LIFECYCLE */

    activatedAt: {
      type: Date,
      default: Date.now,
    },

    deactivatedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    /* AUDIT */

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ============================================================
   INDEXES
============================================================ */

leaderSchema.index({
  level: 1,
  position: 1,
  status: 1,
  displayOrder: 1,
});

leaderSchema.index({
  category: 1,
  level: 1,
  position: 1,
});

leaderSchema.index({
  department: 1,
  position: 1,
  isActive: 1,
});

leaderSchema.index({
  scope: 1,
  position: 1,
  isActive: 1,
});

leaderSchema.index({
  county: 1,
  level: 1,
  position: 1,
  displayOrder: 1,
});

leaderSchema.index({
  county: 1,
  constituency: 1,
  position: 1,
});

leaderSchema.index({
  county: 1,
  constituency: 1,
  ward: 1,
  position: 1,
});

leaderSchema.index({
  reportVisibility: 1,
  isActive: 1,
});

leaderSchema.index({
  member: 1,
  isActive: 1,
});

leaderSchema.index({
  position: 1,
  isActive: 1,
});

leaderSchema.index({
  featured: 1,
  isActive: 1,
});

leaderSchema.index({
  isActive: 1,
  status: 1,
  displayOrder: 1,
});

leaderSchema.index({
  level: 1,
  position: 1,
  portfolioKey: 1,
  isActive: 1,
});

leaderSchema.index({
  portfolioSlug: 1,
  isActive: 1,
});

/*
 * Enforce one active Regional Cabinet Secretary per portfolio.
 *
 * Resolve existing duplicate active assignments before allowing
 * MongoDB to build this unique index.
 */
leaderSchema.index(
  {
    portfolioKey: 1,
  },
  {
    name: "unique_active_regional_cs_portfolio",
    unique: true,
    partialFilterExpression: {
      position: LEADERSHIP_OFFICES.CABINET_SECRETARY,
      level: LEADERSHIP_LEVELS.REGIONAL_CABINET,
      isActive: true,
      status: LEADERSHIP_STATUS.ACTIVE,
      portfolioKey: { $type: "string" },
    },
  }
);

/* ============================================================
   PRE-VALIDATE
============================================================ */

leaderSchema.pre("validate", async function () {
  const normalizedPosition = normalizePosition(this.position);

  if (normalizedPosition && normalizedPosition !== this.position) {
    this.position = normalizedPosition;
  }

  /* PATRON */

  if (isPatronRecord(this)) {
    this.position = LEADERSHIP_OFFICES.PATRON;
    this.category = LEADERSHIP_CATEGORIES.PATRONAGE;

    this.level = null;
    this.department = null;
    this.scope = null;

    this.reportVisibility = REPORT_VISIBILITY.REGIONAL;
    this.appointmentType = this.appointmentType || "appointed";

    this.member = null;

    this.county = null;
    this.constituency = null;
    this.ward = null;

    this.portfolioKey = null;
    this.portfolioTitle = null;
    this.portfolioSlug = null;

    if (!this.patron?.fullName?.trim()) {
      this.invalidate(
        "patron.fullName",
        "Patron full name is required."
      );
    }

    return;
  }

  /* MEMBER */

  if (!this.member) {
    this.invalidate(
      "member",
      "A Member is required for non-patron leadership positions."
    );
  }

  /* LEVEL */

  if (!this.level) {
    this.invalidate(
      "level",
      "Leadership level is required."
    );
  }

  /* CATEGORY */

  if (!this.category) {
    this.invalidate(
      "category",
      "Leadership category is required."
    );
  }

  /* REGIONAL CABINET SECRETARY PORTFOLIO */

  if (isRegionalCabinetSecretary(this)) {
    const portfolioWasChanged =
      this.isNew ||
      this.isModified("position") ||
      this.isModified("level") ||
      this.isModified("portfolioKey");

    if (!this.portfolioKey) {
      if (portfolioWasChanged) {
        this.invalidate(
          "portfolioKey",
          "A ministry docket is required for a Regional Cabinet Secretary."
        );
      }

      this.portfolioTitle = null;
      this.portfolioSlug = null;
    } else {
      const portfolio = getRegionalCabinetPortfolio(
        this.portfolioKey
      );

      if (!portfolio) {
        this.invalidate(
          "portfolioKey",
          `Invalid Regional Cabinet Secretary portfolio: ${this.portfolioKey}`
        );
      } else {
        this.portfolioKey = portfolio.key;
        this.portfolioTitle = portfolio.title;
        this.portfolioSlug = portfolio.slug;
      }
    }
  } else {
    this.portfolioKey = null;
    this.portfolioTitle = null;
    this.portfolioSlug = null;
  }

  /* COUNCIL OF GOVERNORS */

  if (
    this.level === LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS
  ) {
    this.category = LEADERSHIP_CATEGORIES.SECRETARIAT;
    this.department = LEADERSHIP_DEPARTMENTS.SECRETARIAT;
    this.scope = null;
    this.reportVisibility = REPORT_VISIBILITY.COUNTY;
  }

  /* STRUCTURAL SCOPE */

  if (
    this.scope &&
    !LEADERSHIP_SCOPE_VALUES.includes(this.scope)
  ) {
    this.invalidate(
      "scope",
      `Invalid leadership structural scope: ${this.scope}`
    );
  }

  /* REPORT VISIBILITY */

  if (
    !REPORT_VISIBILITY_VALUES.includes(this.reportVisibility)
  ) {
    this.invalidate(
      "reportVisibility",
      `Invalid report visibility: ${this.reportVisibility}`
    );
    return;
  }

  /* REGIONAL */

  if (this.reportVisibility === REPORT_VISIBILITY.REGIONAL) {
    this.county = null;
    this.constituency = null;
    this.ward = null;
  }

  /* COUNTY */

  if (this.reportVisibility === REPORT_VISIBILITY.COUNTY) {
    if (!this.county) {
      this.invalidate(
        "county",
        "County is required for county-level leadership."
      );
    }

    this.constituency = null;
    this.ward = null;
  }

  /* CONSTITUENCY */

  if (
    this.reportVisibility === REPORT_VISIBILITY.CONSTITUENCY
  ) {
    if (!this.county) {
      this.invalidate(
        "county",
        "County is required for constituency-level leadership."
      );
    }

    if (!this.constituency) {
      this.invalidate(
        "constituency",
        "Constituency is required for constituency-level leadership."
      );
    }

    this.ward = null;
  }

  /* WARD */

  if (this.reportVisibility === REPORT_VISIBILITY.WARD) {
    if (!this.county) {
      this.invalidate(
        "county",
        "County is required for ward-level leadership."
      );
    }

    if (!this.constituency) {
      this.invalidate(
        "constituency",
        "Constituency is required for ward-level leadership."
      );
    }

    if (!this.ward) {
      this.invalidate(
        "ward",
        "Ward is required for ward-level leadership."
      );
    }
  }
});

/* ============================================================
   PRE-SAVE LIFECYCLE NORMALIZATION
============================================================ */

leaderSchema.pre("save", async function () {
  if (isPatronRecord(this)) {
    this.position = LEADERSHIP_OFFICES.PATRON;
    this.category = LEADERSHIP_CATEGORIES.PATRONAGE;
    this.member = null;

    this.level = null;
    this.department = null;
    this.scope = null;

    this.reportVisibility = REPORT_VISIBILITY.REGIONAL;

    this.county = null;
    this.constituency = null;
    this.ward = null;

    this.portfolioKey = null;
    this.portfolioTitle = null;
    this.portfolioSlug = null;
  }

  /*
   * Keep isActive and status synchronized.
   * This also handles status-only lifecycle changes.
   */

  if (this.status === LEADERSHIP_STATUS.COMPLETED) {
    this.isActive = false;
    this.completedAt = this.completedAt || new Date();
    this.deactivatedAt = this.deactivatedAt || new Date();
  } else if (this.status === LEADERSHIP_STATUS.SUSPENDED) {
    this.isActive = false;
    this.deactivatedAt = this.deactivatedAt || new Date();
  } else if (this.status === LEADERSHIP_STATUS.INACTIVE) {
    this.isActive = false;
    this.deactivatedAt = this.deactivatedAt || new Date();
  } else if (this.status === LEADERSHIP_STATUS.ACTIVE) {
    this.isActive = true;
    this.deactivatedAt = null;
  }

  /*
   * Record activation when a previously persisted record
   * transitions from inactive to active.
   */
  if (
    this.isActive &&
    (
      this.isNew ||
      this.isModified("isActive") ||
      this.isModified("status")
    )
  ) {
    this.activatedAt = new Date();
    this.deactivatedAt = null;
  }
});

/* ============================================================
   VIRTUALS
============================================================ */

leaderSchema.virtual("isPatron").get(function () {
  return isPatronRecord(this);
});

leaderSchema.virtual("fullName").get(function () {
  if (this.member && typeof this.member === "object") {
    return [
      this.member.firstName,
      this.member.middleName,
      this.member.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return this.patron?.fullName || "";
});

leaderSchema.virtual("profile").get(function () {
  if (this.member && typeof this.member === "object") {
    return {
      _id: this.member._id,
      memberNumber: this.member.memberNumber,
      firstName: this.member.firstName,
      middleName: this.member.middleName,
      lastName: this.member.lastName,
      fullName: [
        this.member.firstName,
        this.member.middleName,
        this.member.lastName,
      ]
        .filter(Boolean)
        .join(" "),
      profilePhoto: this.member.profilePhoto,
      county: this.member.county,
      constituency: this.member.constituency,
      ward: this.member.ward,
      membershipStatus: this.member.membershipStatus,
      gender: this.member.gender,
      isMember: true,
    };
  }

  return {
    fullName: this.patron?.fullName || "",
    firstName: this.patron?.fullName || "",
    middleName: "",
    lastName: "",
    profilePhoto: this.patron?.photo || "",
    county: null,
    constituency: null,
    ward: null,
    organization: this.patron?.organization || "",
    title: this.patron?.title || "",
    bio: this.patron?.bio || "",
    isMember: false,
  };
});

leaderSchema.virtual("portfolio").get(function () {
  if (!this.portfolioKey) return null;

  return getRegionalCabinetPortfolio(this.portfolioKey);
});

leaderSchema.virtual("officeDisplayTitle").get(function () {
  if (this.position === LEADERSHIP_OFFICES.CABINET_SECRETARY) {
    return this.portfolioTitle
      ? `Cabinet Secretary — ${this.portfolioTitle}`
      : "Cabinet Secretary";
  }

  if (
    this.position === LEADERSHIP_OFFICES.SECRETARY_TO_CABINET
  ) {
    return "Secretary to the Cabinet";
  }

  return this.position
    ? this.position
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";
});

leaderSchema.virtual("isCurrent").get(function () {
  return (
    this.isActive &&
    this.status === LEADERSHIP_STATUS.ACTIVE
  );
});

leaderSchema.virtual("isElected").get(function () {
  return this.appointmentType === "elected";
});

leaderSchema.virtual("isAppointed").get(function () {
  return this.appointmentType === "appointed";
});

leaderSchema.virtual("isNominated").get(function () {
  return this.appointmentType === "nominated";
});

leaderSchema.virtual("isRegionalCabinet").get(function () {
  return this.level === LEADERSHIP_LEVELS.REGIONAL_CABINET;
});

leaderSchema.virtual("isRegionalYouthAssembly").get(function () {
  return (
    this.level === LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY
  );
});

leaderSchema.virtual("isCouncilOfGovernors").get(function () {
  return this.level === LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS;
});

leaderSchema.virtual("isCountyCabinet").get(function () {
  return this.level === LEADERSHIP_LEVELS.COUNTY_CABINET;
});

leaderSchema.virtual("isCountyYouthAssembly").get(function () {
  return (
    this.level === LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY
  );
});

/* ============================================================
   INSTANCE METHODS
============================================================ */

leaderSchema.methods.activate = function () {
  this.isActive = true;
  this.status = LEADERSHIP_STATUS.ACTIVE;
  this.activatedAt = new Date();
  this.deactivatedAt = null;
  this.completedAt = null;
};

leaderSchema.methods.deactivate = function () {
  this.isActive = false;
  this.status = LEADERSHIP_STATUS.INACTIVE;
  this.deactivatedAt = new Date();
};

leaderSchema.methods.completeTerm = function () {
  this.status = LEADERSHIP_STATUS.COMPLETED;
  this.isActive = false;
  this.completedAt = new Date();
  this.deactivatedAt = new Date();
};

leaderSchema.methods.suspend = function () {
  this.status = LEADERSHIP_STATUS.SUSPENDED;
  this.isActive = false;
  this.deactivatedAt = new Date();
};

leaderSchema.methods.reinstate = function () {
  this.status = LEADERSHIP_STATUS.ACTIVE;
  this.isActive = true;
  this.activatedAt = new Date();
  this.deactivatedAt = null;
  this.completedAt = null;
};

/* ============================================================
   STATIC METHODS
============================================================ */

const activeSort = {
  displayOrder: 1,
  createdAt: 1,
};

leaderSchema.statics.getActive = function () {
  return this.find({ isActive: true }).sort(activeSort);
};

leaderSchema.statics.getInactive = function () {
  return this.find({ isActive: false }).sort(activeSort);
};

leaderSchema.statics.getCurrent = function () {
  return this.find({
    isActive: true,
    status: LEADERSHIP_STATUS.ACTIVE,
  }).sort(activeSort);
};

leaderSchema.statics.getByCategory = function (category) {
  return this.find({ category, isActive: true }).sort(activeSort);
};

leaderSchema.statics.getByLevel = function (level) {
  return this.find({ level, isActive: true }).sort(activeSort);
};

leaderSchema.statics.getByPosition = function (position) {
  return this.find({
    position: normalizePosition(position),
    isActive: true,
  }).sort(activeSort);
};

leaderSchema.statics.getByCounty = function (county) {
  return this.find({ county, isActive: true }).sort(activeSort);
};

leaderSchema.statics.getByConstituency = function (
  county,
  constituency
) {
  return this.find({
    county,
    constituency,
    isActive: true,
  }).sort(activeSort);
};

leaderSchema.statics.getByWard = function (
  county,
  constituency,
  ward
) {
  return this.find({
    county,
    constituency,
    ward,
    isActive: true,
  }).sort(activeSort);
};

leaderSchema.statics.getByReportVisibility = function (
  reportVisibility
) {
  return this.find({
    reportVisibility,
    isActive: true,
  }).sort(activeSort);
};

leaderSchema.statics.getByScope = function (scope) {
  return this.find({ scope, isActive: true }).sort(activeSort);
};

leaderSchema.statics.getByDepartment = function (department) {
  return this.find({
    department,
    isActive: true,
  }).sort(activeSort);
};

/* REGIONAL CABINET */

leaderSchema.statics.getRegionalCabinet = function () {
  return this.find({
    level: LEADERSHIP_LEVELS.REGIONAL_CABINET,
    isActive: true,
  }).sort(activeSort);
};

leaderSchema.statics.getRegionalCabinetSecretaries = function () {
  return this.find({
    level: LEADERSHIP_LEVELS.REGIONAL_CABINET,
    position: LEADERSHIP_OFFICES.CABINET_SECRETARY,
    isActive: true,
  }).sort(activeSort);
};

leaderSchema.statics.getByPortfolioKey = function (portfolioKey) {
  if (!REGIONAL_PORTFOLIO_KEYS.includes(portfolioKey)) {
    return Promise.resolve(null);
  }

  return this.findOne({
    level: LEADERSHIP_LEVELS.REGIONAL_CABINET,
    position: LEADERSHIP_OFFICES.CABINET_SECRETARY,
    portfolioKey,
    isActive: true,
    status: LEADERSHIP_STATUS.ACTIVE,
  }).sort(activeSort);
};

leaderSchema.statics.getByPortfolioSlug = function (portfolioSlug) {
  const portfolio = REGIONAL_CABINET_PORTFOLIOS.find(
    (item) => item.slug === portfolioSlug
  );

  if (!portfolio) return Promise.resolve(null);

  return this.findOne({
    level: LEADERSHIP_LEVELS.REGIONAL_CABINET,
    position: LEADERSHIP_OFFICES.CABINET_SECRETARY,
    portfolioKey: portfolio.key,
    isActive: true,
    status: LEADERSHIP_STATUS.ACTIVE,
  }).sort(activeSort);
};

/* REGIONAL YOUTH ASSEMBLY */

leaderSchema.statics.getRegionalYouthAssembly = function () {
  return this.find({
    level: LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,
    isActive: true,
  }).sort(activeSort);
};

/* COUNCIL OF GOVERNORS */

leaderSchema.statics.getCouncilOfGovernors = function () {
  return this.find({
    level: LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
    isActive: true,
  }).sort(activeSort);
};

/* COUNTY CABINET */

leaderSchema.statics.getCountyCabinet = function (county = null) {
  const query = {
    level: LEADERSHIP_LEVELS.COUNTY_CABINET,
    isActive: true,
  };

  if (county) query.county = county;

  return this.find(query).sort({
    county: 1,
    ...activeSort,
  });
};

/* COUNTY YOUTH ASSEMBLY */

leaderSchema.statics.getCountyYouthAssembly = function (
  county = null
) {
  const query = {
    level: LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,
    isActive: true,
  };

  if (county) query.county = county;

  return this.find(query).sort({
    county: 1,
    ...activeSort,
  });
};

/* PATRON */

leaderSchema.statics.getPatron = function () {
  return this.findOne({
    position: LEADERSHIP_OFFICES.PATRON,
    isActive: true,
    status: LEADERSHIP_STATUS.ACTIVE,
  });
};

/* ============================================================
   SERIALIZATION
============================================================ */

leaderSchema.set("toJSON", {
  virtuals: true,
});

leaderSchema.set("toObject", {
  virtuals: true,
});

/* ============================================================
   MODEL
============================================================ */

export default mongoose.model("Leader", leaderSchema);