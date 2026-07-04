const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const memberSchema = new mongoose.Schema(
  {
    /* ===================================================
       ACCOUNT
    =================================================== */

    role: {
      type: String,
      enum: [
        "member",
        "ward_leader",
        "constituency_leader",
        "county_leader",
        "regional_leader",
        "secretariat",
        "admin",
        "super_admin",
      ],
      default: "member",
    },

    membershipNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    legacyMember: {
      type: Boolean,
      default: false,
    },

    migrationCompleted: {
      type: Boolean,
      default: false,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    activationStatus: {
      type: String,
      enum: [
        "Not Activated",
        "Pending OTP",
        "Activated",
      ],
      default: "Not Activated",
    },

    activationDate: Date,

    membershipStatus: {
      type: String,
      enum: [
        "Pending",
        "Active",
        "Suspended",
        "Expired",
      ],
      default: "Pending",
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Exempt",
      ],
      default: "Pending",
    },

    memberSince: Date,

    /* ===================================================
       PERSONAL INFORMATION
    =================================================== */

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    gender: String,

    dob: Date,

    nationalId: {
      type: String,
      sparse: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    profilePhoto: String,

    /* ===================================================
       LOCATION
    =================================================== */

    county: String,

    constituency: String,

    ward: String,

    village: String,

    /* ===================================================
       EDUCATION
    =================================================== */

    institution: String,

    course: String,

    level: String,

    graduationYear: Number,

    studentRegistrationNumber: String,

    /* ===================================================
       EMPLOYMENT
    =================================================== */

    employmentStatus: String,

    occupation: String,

    employer: String,

    /* ===================================================
       LEADERSHIP
    =================================================== */

    leadershipExperience: String,

    leadershipPosition: String,

    leadershipOrganization: String,

    /* ===================================================
       JVP PROFILE
    =================================================== */

    skills: {
      type: [String],
      default: [],
    },

    interests: {
      type: [String],
      default: [],
    },

    languages: {
      type: [String],
      default: [],
    },

    bio: {
      type: String,
      maxlength: 500,
    },

    availability: {
      type: String,
      enum: [
        "",
        "Weekdays",
        "Weekends",
        "Evenings",
        "Any Time",
      ],
      default: "",
    },

    /* ===================================================
       SOCIAL MEDIA
    =================================================== */

    facebook: String,

    instagram: String,

    linkedin: String,

    x: String,

    tiktok: String,

    /* ===================================================
       SECURITY
    =================================================== */

    lastLogin: Date,

    loginCount: {
      type: Number,
      default: 0,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: String,

    otpExpires: Date,

    refreshToken: String,
  },
  {
    timestamps: true,
  }
);

/* ===================================================
   HASH PASSWORD
=================================================== */

memberSchema.pre("save", async function (next) {

  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);

  next();

});

/* ===================================================
   COMPARE PASSWORD
=================================================== */

memberSchema.methods.comparePassword = async function (
  enteredPassword
) {

  return await bcrypt.compare(
    enteredPassword,
    this.password
  );

};

module.exports = mongoose.model(
  "Member",
  memberSchema
);