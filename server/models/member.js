const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    membershipNumber: {
      type: String,
      required: [true, "Membership number is required"],
      unique: true,
      immutable: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },

    nationalId: {
      type: String,
      required: [true, "National ID is required"],
      unique: true,
      immutable: true,
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Prefer not to say"],
      required: [true, "Gender is required"],
    },

    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },

    county: {
      type: String,
      enum: [
        "Mombasa",
        "Kilifi",
        "Kwale",
        "Lamu",
        "Taita Taveta",
        "Tana River",
      ],
      required: [true, "County is required"],
    },

    subCounty: {
      type: String,
      required: [true, "Sub-county is required"],
      trim: true,
    },

    ward: {
      type: String,
      required: [true, "Ward is required"],
      trim: true,
    },

    occupation: {
      type: String,
      default: "",
      trim: true,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    membershipCategory: {
      type: String,
      enum: ["ORDINARY", "LEADERSHIP"],
      default: "ORDINARY",
    },

    membershipStatus: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "SUSPENDED"],
      default: "ACTIVE",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: [true, "Membership expiry date is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes
memberSchema.index({ membershipNumber: 1 });
memberSchema.index({ nationalId: 1 });
memberSchema.index({ phone: 1 });
memberSchema.index({ county: 1 });

module.exports = mongoose.model("Member", memberSchema);