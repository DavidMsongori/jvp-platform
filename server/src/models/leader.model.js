import mongoose from "mongoose";

import {
  LEADERSHIP_LEVEL_VALUES,
  LEADERSHIP_OFFICE_VALUES,
  LEADERSHIP_STATUS,
  LEADERSHIP_STATUS_VALUES,
  LEADERSHIP_SCOPE_VALUES,
  LEADERSHIP_DEPARTMENT_VALUES,
  APPOINTMENT_TYPE_VALUES,
  COAST_COUNTIES,
} from "../constants/leadership.constants.js";

const { Schema } = mongoose;

/* ===========================================================
   LEADER SCHEMA
=========================================================== */

const leaderSchema = new Schema(
  {
    /* =======================================================
       MEMBER
       (Null only for honorary leaders / patrons)
    ======================================================= */

    member: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      default: null,
      index: true,
    },

    /* =======================================================
       PATRON DETAILS
    ======================================================= */

    patron: {
      fullName: {
        type: String,
        trim: true,
        default: "",
      },

      title: {
        type: String,
        trim: true,
        default: "",
      },

      organization: {
        type: String,
        trim: true,
        default: "",
      },

      photo: {
        type: String,
        default: "",
      },

      bio: {
        type: String,
        trim: true,
        default: "",
      },
    },

    /* =======================================================
       LEADERSHIP
    ======================================================= */

    category: {
      type: String,
      enum: LEADERSHIP_LEVEL_VALUES,
      required: true,
      index: true,
    },

    position: {
      type: String,
      enum: LEADERSHIP_OFFICE_VALUES,
      required: true,
      index: true,
    },

    department: {
      type: String,
      enum: LEADERSHIP_DEPARTMENT_VALUES,
      required: true,
      index: true,
    },

    scope: {
      type: String,
      enum: LEADERSHIP_SCOPE_VALUES,
      required: true,
      index: true,
    },

    appointmentType: {
      type: String,
      enum: APPOINTMENT_TYPE_VALUES,
      required: true,
    },

    /* =======================================================
       GEOGRAPHY
    ======================================================= */

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

    /* =======================================================
       DISPLAY
    ======================================================= */

    displayOrder: {
      type: Number,
      default: 999,
      min: 1,
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    /* =======================================================
       TERM
    ======================================================= */

    termStart: {
      type: Date,
      required: true,
      default: Date.now,
    },

    termEnd: {
      type: Date,
      default: null,
    },

    /* =======================================================
       STATUS
    ======================================================= */

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
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    /* =======================================================
       LIFECYCLE
    ======================================================= */

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

    /* =======================================================
       AUDIT
    ======================================================= */

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

/* ===========================================================
   INDEXES
=========================================================== */

leaderSchema.index({
  category: 1,
  position: 1,
});

leaderSchema.index({
  category: 1,
  county: 1,
  displayOrder: 1,
});

leaderSchema.index({
  county: 1,
  constituency: 1,
  ward: 1,
});

leaderSchema.index({
  member: 1,
  isActive: 1,
});

leaderSchema.index({
  position: 1,
  isActive: 1,
});

/* ===========================================================
   MIDDLEWARE
=========================================================== */

leaderSchema.pre("save", function () {

  /* ==========================================
     PATRONS DO NOT HAVE GEOGRAPHY
  ========================================== */

  if (!this.member) {

    this.county = null;

    this.constituency = null;

    this.ward = null;

  }

  /* ==========================================
     ACTIVATION LIFECYCLE
  ========================================== */

  if (

    this.isModified("isActive") &&

    this.isActive &&

    !this.activatedAt

  ) {

    this.activatedAt = new Date();

  }

  /* ==========================================
     DEACTIVATION LIFECYCLE
  ========================================== */

  if (

    this.isModified("isActive") &&

    !this.isActive &&

    !this.deactivatedAt

  ) {

    this.deactivatedAt = new Date();

  }

  /* ==========================================
     COMPLETED TERM
  ========================================== */

  if (

    this.status ===

    LEADERSHIP_STATUS.COMPLETED &&

    !this.completedAt

  ) {

    this.completedAt = new Date();

  }

});

/* ===========================================================
   VIRTUALS
=========================================================== */

leaderSchema.virtual("isPatron").get(function () {
  return !this.member;
});

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

  return this.patron.fullName;

});

leaderSchema.virtual("profile").get(function () {

  if (
    this.member &&
    typeof this.member === "object"
  ) {

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
      this.patron.fullName,

    firstName:
      this.patron.fullName,

    lastName: "",

    profilePhoto:
      this.patron.photo,

    county: null,

    constituency: null,

    ward: null,

    organization:
      this.patron.organization,

    title:
      this.patron.title,

    bio:
      this.patron.bio,

    isMember: false,

  };

});

leaderSchema.virtual("isCurrent").get(function () {

  return (
    this.isActive &&
    this.status ===
      LEADERSHIP_STATUS.ACTIVE
  );

});

/* ===========================================================
   INSTANCE METHODS
=========================================================== */

leaderSchema.methods.activate =
function () {

  this.isActive = true;

  this.status =
    LEADERSHIP_STATUS.ACTIVE;

  this.activatedAt =
    new Date();

  this.deactivatedAt =
    null;

};

leaderSchema.methods.deactivate =
function () {

  this.isActive = false;

  this.deactivatedAt =
    new Date();

};

leaderSchema.methods.completeTerm =
function () {

  this.status =
    LEADERSHIP_STATUS.COMPLETED;

  this.isActive = false;

  this.completedAt =
    new Date();

};

leaderSchema.methods.suspend =
function () {

  this.status =
    LEADERSHIP_STATUS.SUSPENDED;

  this.isActive = false;

};

leaderSchema.methods.reinstate =
function () {

  this.status =
    LEADERSHIP_STATUS.ACTIVE;

  this.isActive = true;

};

/* ===========================================================
   STATIC METHODS
=========================================================== */

leaderSchema.statics.getActive =
function () {

  return this.find({
    isActive: true,
  });

};

leaderSchema.statics.getInactive =
function () {

  return this.find({
    isActive: false,
  });

};

leaderSchema.statics.getByCategory =
function (category) {

  return this.find({
    category,
    isActive: true,
  });

};

/* ===========================================================
   SERIALIZATION
=========================================================== */

leaderSchema.set("toJSON", {
  virtuals: true,
});

leaderSchema.set("toObject", {
  virtuals: true,
});

/* ===========================================================
   EXPORT
=========================================================== */

export default mongoose.model(
  "Leader",
  leaderSchema
);