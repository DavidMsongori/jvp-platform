import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    /* ==========================================
       USER ACCOUNT
    ========================================== */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
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

    memberNumber: {
      type: String,
      trim: true,
    },

    membershipType: {
      type: String,
      enum: ["ordinary","member", "leadership"],
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
  default: undefined,
},

    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },

    nationalId: {
      type: String,
      required: [true, "National ID is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
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

    profilePhotoPublicId: {
      type: String,
      default: "",
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

// A member can only be linked to one user account,
// but imported members may have no linked user yet.
memberSchema.index(
  { user: 1 },
  {
    unique: true,
    sparse: true,
  }
);

// Membership number is assigned only after activation.
memberSchema.index(
  { memberNumber: 1 },
  {
    unique: true,
    sparse: true,
  }
);

// National ID must be unique.
memberSchema.index(
  { nationalId: 1 },
  {
    unique: true,
  }
);

// Phone number must be unique.
memberSchema.index(
  { phone: 1 },
  {
    unique: true,
  }
);

const Member = mongoose.model("Member", memberSchema);

export default Member;