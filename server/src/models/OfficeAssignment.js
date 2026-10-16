
import mongoose from "mongoose";

const { Schema } = mongoose;

const OFFICE_TYPES = [
  "president",
  "deputy_president",
  "prime_cabinet_secretary",
  "cabinet_secretary",
  "attorney_general",
  "other",
];

const ASSIGNMENT_STATUSES = [
  "active",
  "inactive",
  "completed",
];

const officeAssignmentSchema = new Schema(
  {
    /* ==========================================
       ASSIGNED MEMBER
    ========================================== */

    member: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "An assigned member is required."],
      index: true,
    },

    /* ==========================================
       OFFICE HOLDER
       References an existing Leader record.
    ========================================== */

    officeHolder: {
      type: Schema.Types.ObjectId,
      ref: "Leader",
      required: [true, "The office holder is required."],
      index: true,
    },

    /* ==========================================
       OFFICE DETAILS
    ========================================== */

    officeType: {
      type: String,
      enum: OFFICE_TYPES,
      required: [true, "Office type is required."],
      index: true,
    },

    /*
     * Used when officeType is cabinet_secretary.
     * Keep this consistent with the portfolio key
     * on the associated Leader record.
     */

    portfolioKey: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    designation: {
      type: String,
      required: [true, "Officer designation is required."],
      trim: true,
      maxlength: [150, "Designation cannot exceed 150 characters."],
    },

    responsibilities: {
      type: String,
      trim: true,
      default: "",
      maxlength: [3000, "Responsibilities cannot exceed 3000 characters."],
    },

    shortBio: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1500, "Biography cannot exceed 1500 characters."],
    },

    displayOrder: {
      type: Number,
      default: 999,
      min: [1, "Display order must be at least 1."],
    },

    /* ==========================================
       ASSIGNMENT PERIOD
    ========================================== */

    startDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          if (!value || !this.startDate) return true;
          return value >= this.startDate;
        },
        message: "End date cannot precede start date.",
      },
    },

    /* ==========================================
       LIFECYCLE
    ========================================== */

    status: {
      type: String,
      enum: ASSIGNMENT_STATUSES,
      default: "active",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    deactivatedAt: {
      type: Date,
      default: null,
    },

    /* ==========================================
       PUBLIC VISIBILITY
    ========================================== */

    visibility: {
      isPublic: {
        type: Boolean,
        default: false,
      },

      showOnOfficePage: {
        type: Boolean,
        default: true,
      },

      showInLeadershipDirectory: {
        type: Boolean,
        default: false,
      },
    },

    /* ==========================================
       AUDIT
    ========================================== */

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

/* ==========================================
   INDEXES
========================================== */

officeAssignmentSchema.index({
  officeHolder: 1,
  status: 1,
  isActive: 1,
  "visibility.isPublic": 1,
  "visibility.showOnOfficePage": 1,
  displayOrder: 1,
});

officeAssignmentSchema.index({
  member: 1,
  status: 1,
  isActive: 1,
});

officeAssignmentSchema.index({
  officeType: 1,
  portfolioKey: 1,
  status: 1,
  isActive: 1,
});

/* ==========================================
   LIFECYCLE NORMALIZATION
========================================== */

officeAssignmentSchema.pre("validate", function () {
  if (
    this.endDate &&
    this.startDate &&
    this.endDate < this.startDate
  ) {
    this.invalidate(
      "endDate",
      "End date cannot precede start date."
    );
  }

  if (this.officeType !== "cabinet_secretary") {
    this.portfolioKey = null;
  } else if (!this.portfolioKey) {
    this.invalidate(
      "portfolioKey",
      "A portfolio is required for a Cabinet Secretary's office."
    );
  }

  if (this.status === "active") {
    this.isActive = true;
    this.deactivatedAt = null;
    this.completedAt = null;
  }

  if (this.status === "inactive") {
    this.isActive = false;
    this.deactivatedAt = this.deactivatedAt || new Date();
  }

  if (this.status === "completed") {
    this.isActive = false;
    this.completedAt = this.completedAt || new Date();
    this.deactivatedAt = this.deactivatedAt || new Date();
  }
});

/* ==========================================
   SERIALIZATION
========================================== */

officeAssignmentSchema.set("toJSON", {
  virtuals: true,
});

officeAssignmentSchema.set("toObject", {
  virtuals: true,
});

/* ==========================================
   MODEL
========================================== */

const OfficeAssignment =
  mongoose.models.OfficeAssignment ||
  mongoose.model("OfficeAssignment", officeAssignmentSchema);

export default OfficeAssignment;

export {
  OFFICE_TYPES,
  ASSIGNMENT_STATUSES,
};
