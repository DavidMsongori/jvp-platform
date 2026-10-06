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
  LEADERSHIP_SCOPE,

  REPORT_VISIBILITY_VALUES,
  REPORT_VISIBILITY,

  APPOINTMENT_TYPE_VALUES,

  COAST_COUNTIES,
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

  if (!normalized) {
    return "";
  }

  return (
    LEGACY_LEADERSHIP_OFFICE_ALIASES[normalized] ||
    normalized
  );
};


/* ============================================================
   LEADER SCHEMA
============================================================ */

const leaderSchema = new Schema(
  {
    /* ========================================================
       MEMBER
    ======================================================== */

    member: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      default: null,
      index: true,
    },


    /* ========================================================
       PATRON PROFILE
    ======================================================== */

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


    /* ========================================================
       CATEGORY
    ======================================================== */

    category: {
      type: String,
      enum: LEADERSHIP_CATEGORY_VALUES,
      required: true,
      index: true,
    },


    /* ========================================================
       LEADERSHIP LEVEL
    ======================================================== */

    level: {
      type: String,
      enum: LEADERSHIP_LEVEL_VALUES,
      default: null,
      index: true,
    },


    /* ========================================================
       POSITION / OFFICE
    ======================================================== */

    position: {
      type: String,
      enum: LEADERSHIP_OFFICE_VALUES,
      required: true,
      index: true,
    },


    /* ========================================================
       DEPARTMENT
    ======================================================== */

    department: {
      type: String,
      enum: LEADERSHIP_DEPARTMENT_VALUES,
      default: null,
      index: true,
    },


    /* ========================================================
       STRUCTURAL SCOPE
    ======================================================== */

    scope: {
      type: String,
      enum: LEADERSHIP_SCOPE_VALUES,
      default: null,
      index: true,
    },


    /* ========================================================
       REPORT VISIBILITY
    ======================================================== */

    reportVisibility: {
      type: String,
      enum: REPORT_VISIBILITY_VALUES,
      default: REPORT_VISIBILITY.PRIVATE,
      index: true,
    },


    /* ========================================================
       APPOINTMENT TYPE
    ======================================================== */

    appointmentType: {
      type: String,
      enum: APPOINTMENT_TYPE_VALUES,
      required: true,
      index: true,
    },


    /* ========================================================
       GEOGRAPHY
    ======================================================== */

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


    /* ========================================================
       DISPLAY
    ======================================================== */

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


    /* ========================================================
       TERM
    ======================================================== */

    termStart: {
      type: Date,
      default: Date.now,
      required: true,
    },

    termEnd: {
      type: Date,
      default: null,
    },


    /* ========================================================
       STATUS
    ======================================================== */

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


    /* ========================================================
       LIFECYCLE
    ======================================================== */

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


    /* ========================================================
       AUDIT
    ======================================================== */

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


/* ============================================================
   PRE-VALIDATE
   ------------------------------------------------------------
   IMPORTANT:
   This middleware intentionally uses async/promise style.

   Do NOT use `next()` here.
   Throwing an Error causes Mongoose validation to reject
   correctly and prevents the "next is not a function" error.
============================================================ */

leaderSchema.pre("validate", async function () {

  const normalizedPosition =
    normalizePosition(this.position);


  /* ==========================================================
     NORMALIZE POSITION
  ========================================================== */

  if (
    normalizedPosition &&
    normalizedPosition !== this.position
  ) {
    this.position = normalizedPosition;
  }


  /* ==========================================================
     IDENTIFY PATRON
  ========================================================== */

  const isPatron =
    normalizedPosition ===
      LEADERSHIP_OFFICES.PATRON ||
    this.category ===
      LEADERSHIP_CATEGORIES.PATRONAGE;


  /* ==========================================================
     PATRON
  ========================================================== */

  if (isPatron) {

    this.position =
      LEADERSHIP_OFFICES.PATRON;

    this.category =
      LEADERSHIP_CATEGORIES.PATRONAGE;

    this.level = null;

    this.department = null;

    this.scope = null;

    this.reportVisibility =
      REPORT_VISIBILITY.REGIONAL;

    this.appointmentType =
      this.appointmentType || "appointed";

    this.member = null;

    this.county = null;

    this.constituency = null;

    this.ward = null;


    if (
      !this.patron?.fullName ||
      !this.patron.fullName.trim()
    ) {
      throw new Error(
        "Patron full name is required."
      );
    }

    return;
  }


  /* ==========================================================
     NORMAL LEADER — MEMBER REQUIRED
  ========================================================== */

  if (!this.member) {
    throw new Error(
      "A Member is required for non-patron leadership positions."
    );
  }


  /* ==========================================================
     NORMAL LEADER — LEVEL REQUIRED
  ========================================================== */

  if (!this.level) {
    throw new Error(
      "Leadership level is required."
    );
  }


  /* ==========================================================
     NORMAL LEADER — CATEGORY REQUIRED
  ========================================================== */

  if (!this.category) {
    throw new Error(
      "Leadership category is required."
    );
  }


  /* ==========================================================
     COUNCIL OF GOVERNORS
  ========================================================== */

  if (
    this.level ===
    LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS
  ) {

    this.category =
      LEADERSHIP_CATEGORIES.SECRETARIAT;

    this.department =
      LEADERSHIP_DEPARTMENTS.SECRETARIAT;

    this.scope = null;

    this.reportVisibility =
      REPORT_VISIBILITY.COUNTY;
  }


  /* ==========================================================
     STRUCTURAL SCOPE VALIDATION
  ========================================================== */

  const validScopes = new Set(
    LEADERSHIP_SCOPE_VALUES
  );

  if (
    this.scope &&
    !validScopes.has(this.scope)
  ) {
    throw new Error(
      `Invalid leadership structural scope: ${this.scope}`
    );
  }


  /* ==========================================================
     REPORT VISIBILITY VALIDATION
  ========================================================== */

  if (
    !REPORT_VISIBILITY_VALUES.includes(
      this.reportVisibility
    )
  ) {
    throw new Error(
      `Invalid report visibility: ${this.reportVisibility}`
    );
  }


  /* ==========================================================
     REGIONAL REPORTING
  ========================================================== */

  if (
    this.reportVisibility ===
    REPORT_VISIBILITY.REGIONAL
  ) {

    this.county = null;
    this.constituency = null;
    this.ward = null;
  }


  /* ==========================================================
     COUNTY REPORTING
  ========================================================== */

  if (
    this.reportVisibility ===
    REPORT_VISIBILITY.COUNTY
  ) {

    if (!this.county) {
      throw new Error(
        "County is required for county-level leadership."
      );
    }

    this.constituency = null;
    this.ward = null;
  }


  /* ==========================================================
     CONSTITUENCY REPORTING
  ========================================================== */

  if (
    this.reportVisibility ===
    REPORT_VISIBILITY.CONSTITUENCY
  ) {

    if (!this.county) {
      throw new Error(
        "County is required for constituency-level leadership."
      );
    }

    if (!this.constituency) {
      throw new Error(
        "Constituency is required for constituency-level leadership."
      );
    }

    this.ward = null;
  }


  /* ==========================================================
     WARD REPORTING
  ========================================================== */

  if (
    this.reportVisibility ===
    REPORT_VISIBILITY.WARD
  ) {

    if (!this.county) {
      throw new Error(
        "County is required for ward-level leadership."
      );
    }

    if (!this.constituency) {
      throw new Error(
        "Constituency is required for ward-level leadership."
      );
    }

    if (!this.ward) {
      throw new Error(
        "Ward is required for ward-level leadership."
      );
    }
  }


  /* ==========================================================
     PRIVATE REPORTING
     ----------------------------------------------------------
     Private reporting does not require geography.
  ========================================================== */

  if (
    this.reportVisibility ===
    REPORT_VISIBILITY.PRIVATE
  ) {
    /*
     * Geography is intentionally preserved.
     */
  }
});


/* ============================================================
   PRE-SAVE
   ------------------------------------------------------------
   Also uses async/promise style.
============================================================ */

leaderSchema.pre("save", async function () {

  /* ==========================================================
     PATRON NORMALIZATION
  ========================================================== */

  if (
    this.position ===
      LEADERSHIP_OFFICES.PATRON ||
    this.category ===
      LEADERSHIP_CATEGORIES.PATRONAGE
  ) {

    this.position =
      LEADERSHIP_OFFICES.PATRON;

    this.category =
      LEADERSHIP_CATEGORIES.PATRONAGE;

    this.member = null;

    this.level = null;

    this.department = null;

    this.scope = null;

    this.reportVisibility =
      REPORT_VISIBILITY.REGIONAL;

    this.county = null;

    this.constituency = null;

    this.ward = null;
  }


  /* ==========================================================
     ACTIVATION
  ========================================================== */

  if (
    this.isModified("isActive") &&
    this.isActive
  ) {

    this.activatedAt =
      this.activatedAt ||
      new Date();

    this.deactivatedAt = null;

    if (
      this.status ===
      LEADERSHIP_STATUS.INACTIVE
    ) {

      this.status =
        LEADERSHIP_STATUS.ACTIVE;
    }
  }


  /* ==========================================================
     DEACTIVATION
  ========================================================== */

  if (
    this.isModified("isActive") &&
    !this.isActive
  ) {

    this.deactivatedAt =
      this.deactivatedAt ||
      new Date();
  }


  /* ==========================================================
     COMPLETED TERM
  ========================================================== */

  if (
    this.status ===
    LEADERSHIP_STATUS.COMPLETED
  ) {

    this.isActive = false;

    this.completedAt =
      this.completedAt ||
      new Date();

    this.deactivatedAt =
      this.deactivatedAt ||
      new Date();
  }


  /* ==========================================================
     SUSPENDED
  ========================================================== */

  if (
    this.status ===
    LEADERSHIP_STATUS.SUSPENDED
  ) {

    this.isActive = false;

    this.deactivatedAt =
      this.deactivatedAt ||
      new Date();
  }
});


/* ============================================================
   VIRTUALS
============================================================ */


/* ============================================================
   IS PATRON
============================================================ */

leaderSchema.virtual("isPatron").get(function () {

  return (
    this.category ===
      LEADERSHIP_CATEGORIES.PATRONAGE ||
    this.position ===
      LEADERSHIP_OFFICES.PATRON ||
    !this.member
  );

});


/* ============================================================
   FULL NAME
============================================================ */

leaderSchema.virtual("fullName").get(function () {

  if (
    this.member &&
    typeof this.member === "object"
  ) {

    return [
      this.member.firstName,
      this.member.middleName,
      this.member.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return (
    this.patron?.fullName ||
    ""
  );
});


/* ============================================================
   PROFILE
============================================================ */

leaderSchema.virtual("profile").get(function () {

  if (
    this.member &&
    typeof this.member === "object"
  ) {

    return {
      _id:
        this.member._id,

      memberNumber:
        this.member.memberNumber,

      firstName:
        this.member.firstName,

      middleName:
        this.member.middleName,

      lastName:
        this.member.lastName,

      fullName: [
        this.member.firstName,
        this.member.middleName,
        this.member.lastName,
      ]
        .filter(Boolean)
        .join(" "),

      profilePhoto:
        this.member.profilePhoto,

      county:
        this.member.county,

      constituency:
        this.member.constituency,

      ward:
        this.member.ward,

      membershipStatus:
        this.member.membershipStatus,

      gender:
        this.member.gender,

      isMember: true,
    };
  }


  return {
    fullName:
      this.patron?.fullName || "",

    firstName:
      this.patron?.fullName || "",

    middleName:
      "",

    lastName:
      "",

    profilePhoto:
      this.patron?.photo || "",

    county:
      null,

    constituency:
      null,

    ward:
      null,

    organization:
      this.patron?.organization || "",

    title:
      this.patron?.title || "",

    bio:
      this.patron?.bio || "",

    isMember: false,
  };
});


/* ============================================================
   IS CURRENT
============================================================ */

leaderSchema.virtual("isCurrent").get(function () {

  return (
    this.isActive &&
    this.status ===
      LEADERSHIP_STATUS.ACTIVE
  );

});


/* ============================================================
   APPOINTMENT VIRTUALS
============================================================ */

leaderSchema.virtual("isElected").get(function () {

  return this.appointmentType === "elected";

});


leaderSchema.virtual("isAppointed").get(function () {

  return this.appointmentType === "appointed";

});


leaderSchema.virtual("isNominated").get(function () {

  return this.appointmentType === "nominated";

});


/* ============================================================
   STRUCTURAL VIRTUALS
============================================================ */

leaderSchema.virtual("isRegionalCabinet").get(function () {

  return (
    this.level ===
    LEADERSHIP_LEVELS.REGIONAL_CABINET
  );

});


leaderSchema.virtual("isRegionalYouthAssembly").get(function () {

  return (
    this.level ===
    LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY
  );

});


leaderSchema.virtual("isCouncilOfGovernors").get(function () {

  return (
    this.level ===
    LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS
  );

});


leaderSchema.virtual("isCountyCabinet").get(function () {

  return (
    this.level ===
    LEADERSHIP_LEVELS.COUNTY_CABINET
  );

});


leaderSchema.virtual("isCountyYouthAssembly").get(function () {

  return (
    this.level ===
    LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY
  );

});


/* ============================================================
   INSTANCE METHODS
============================================================ */

leaderSchema.methods.activate = function () {

  this.isActive = true;

  this.status =
    LEADERSHIP_STATUS.ACTIVE;

  this.activatedAt =
    new Date();

  this.deactivatedAt =
    null;
};


leaderSchema.methods.deactivate = function () {

  this.isActive = false;

  this.status =
    LEADERSHIP_STATUS.INACTIVE;

  this.deactivatedAt =
    new Date();
};


leaderSchema.methods.completeTerm = function () {

  this.status =
    LEADERSHIP_STATUS.COMPLETED;

  this.isActive = false;

  this.completedAt =
    new Date();

  this.deactivatedAt =
    new Date();
};


leaderSchema.methods.suspend = function () {

  this.status =
    LEADERSHIP_STATUS.SUSPENDED;

  this.isActive = false;

  this.deactivatedAt =
    new Date();
};


leaderSchema.methods.reinstate = function () {

  this.status =
    LEADERSHIP_STATUS.ACTIVE;

  this.isActive = true;

  this.deactivatedAt =
    null;

  this.completedAt =
    null;
};


/* ============================================================
   STATIC METHODS
============================================================ */

leaderSchema.statics.getActive = function () {

  return this.find({
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


leaderSchema.statics.getInactive = function () {

  return this.find({
    isActive: false,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


leaderSchema.statics.getCurrent = function () {

  return this.find({
    isActive: true,
    status: LEADERSHIP_STATUS.ACTIVE,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


leaderSchema.statics.getByCategory = function (category) {

  return this.find({
    category,
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


leaderSchema.statics.getByLevel = function (level) {

  return this.find({
    level,
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


leaderSchema.statics.getByPosition = function (position) {

  return this.find({
    position: normalizePosition(position),
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


leaderSchema.statics.getByCounty = function (county) {

  return this.find({
    county,
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


leaderSchema.statics.getByConstituency =
function (county, constituency) {

  return this.find({
    county,
    constituency,
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


leaderSchema.statics.getByWard =
function (county, constituency, ward) {

  return this.find({
    county,
    constituency,
    ward,
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


leaderSchema.statics.getByReportVisibility =
function (reportVisibility) {

  return this.find({
    reportVisibility,
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


leaderSchema.statics.getByScope =
function (scope) {

  return this.find({
    scope,
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


leaderSchema.statics.getByDepartment =
function (department) {

  return this.find({
    department,
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


/* ============================================================
   REGIONAL CABINET
============================================================ */

leaderSchema.statics.getRegionalCabinet =
function () {

  return this.find({
    level:
      LEADERSHIP_LEVELS.REGIONAL_CABINET,
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


/* ============================================================
   REGIONAL YOUTH ASSEMBLY
============================================================ */

leaderSchema.statics.getRegionalYouthAssembly =
function () {

  return this.find({
    level:
      LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


/* ============================================================
   COUNCIL OF GOVERNORS
============================================================ */

leaderSchema.statics.getCouncilOfGovernors =
function () {

  return this.find({
    level:
      LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
    isActive: true,
  })
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });
};


/* ============================================================
   COUNTY CABINET
============================================================ */

leaderSchema.statics.getCountyCabinet =
function (county = null) {

  const query = {
    level:
      LEADERSHIP_LEVELS.COUNTY_CABINET,
    isActive: true,
  };

  if (county) {
    query.county = county;
  }

  return this.find(query)
    .sort({
      county: 1,
      displayOrder: 1,
      createdAt: 1,
    });
};


/* ============================================================
   COUNTY YOUTH ASSEMBLY
============================================================ */

leaderSchema.statics.getCountyYouthAssembly =
function (county = null) {

  const query = {
    level:
      LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,
    isActive: true,
  };

  if (county) {
    query.county = county;
  }

  return this.find(query)
    .sort({
      county: 1,
      displayOrder: 1,
      createdAt: 1,
    });
};


/* ============================================================
   PATRON
============================================================ */

leaderSchema.statics.getPatron =
function () {

  return this.findOne({
    position:
      LEADERSHIP_OFFICES.PATRON,
    isActive: true,
  });

};


/* ============================================================
   SERIALIZATION
============================================================ */

leaderSchema.set(
  "toJSON",
  {
    virtuals: true,
  }
);

leaderSchema.set(
  "toObject",
  {
    virtuals: true,
  }
);


/* ============================================================
   MODEL
============================================================ */

export default mongoose.model(
  "Leader",
  leaderSchema
);