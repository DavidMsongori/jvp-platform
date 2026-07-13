import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    /* ==========================================
       USER ACCOUNT
    ========================================== */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      default: null,
    },

    accountActivated: {
      type: Boolean,
      default: false,
    },

    /* ==========================================
       MEMBERSHIP DETAILS
    ========================================== */

source: {
  type: String,
  enum: ["new", "imported"],
  default: "new",
},

    membershipNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    membershipType: {
      type: String,
      enum: ["ordinary", "leadership"],
      required: true,
    },

    membershipStatus: {
      type: String,
      enum: [
        "pending_payment",
        "active",
        "expired",
        "inactive",
      ],
      default: "inactive",
    },

membershipFeePaid: {
  type: Boolean,
  default: false,
},

    membershipExpiry: {
  type: Date,
  default: null,
},

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    /* ==========================================
       PERSONAL INFORMATION
    ========================================== */

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

    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Gender is required"],
    },

    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },

    nationalId: {
      type: String,
      required: [true, "National ID is required"],
      unique: true,
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },

    occupation: {
      type: String,
      trim: true,
      default: "",
    },

    county: {
      type: String,
      required: true,
      enum: [
        "Mombasa",
        "Kwale",
        "Kilifi",
        "Tana River",
        "Lamu",
        "Taita Taveta",
      ],
    },

    profilePhoto: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Member = mongoose.model("Member", memberSchema);

export default Member;