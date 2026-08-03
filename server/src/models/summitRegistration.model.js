import mongoose from "mongoose";

const summitRegistrationSchema = new mongoose.Schema(
  {
    summitEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SummitEvent",
      required: true,
      index: true,
    },

    /*
    ==========================================
    REGISTRATION SOURCE
    ==========================================
    */

    participantType: {
      type: String,
      required: true,
      enum: ["member", "public"],
    },

    registrationSource: {
      type: String,
      required: true,
      enum: [
        "member_dashboard",
        "public_member_login",
        "public_guest",
        "membership_registration",
        "admin",
      ],
    },

    isRegisteredMember: {
      type: Boolean,
      required: true,
      default: false,
    },

    membershipInterest: {
      type: Boolean,
      default: false,
    },

    membershipRegistrationStarted: {
      type: Boolean,
      default: false,
    },

    /*
    ==========================================
    OPTIONAL ACCOUNT REFERENCES
    ==========================================
    */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },

    /*
    ==========================================
    PARTICIPANT DETAILS
    ==========================================
    */

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
  type: String,
  required: true,
  trim: true,
  match: [
    /^\+254[17]\d{8}$/,
    "Please provide a valid Kenyan mobile phone number.",
  ],
},

    nationalId: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },

    nationalIdLastFour: {
      type: String,
      required: true,
      trim: true,
    },

    county: {
      type: String,
      required: true,
      enum: [
        "Kilifi",
        "Mombasa",
        "Kwale",
        "Taita Taveta",
        "Tana River",
        "Lamu",
      ],
      index: true,
    },

    countyCode: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["KLF", "MSA", "KWL", "TTV", "TNR", "LMU"],
    },

    constituency: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    ward: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    /*
    ==========================================
    TICKET DETAILS
    ==========================================
    */

    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    countySlotNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    ticketStatus: {
      type: String,
      enum: [
        "active",
        "cancelled",
        "checked_in",
        "transferred",
        "expired",
      ],
      default: "active",
      index: true,
    },

    ticketVerificationCode: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    ticketPdfPath: {
      type: String,
      default: null,
    },

    ticketPdfUrl: {
      type: String,
      default: null,
    },

    ticketGeneratedAt: {
      type: Date,
      default: null,
    },

    /*
    ==========================================
    EMAIL DELIVERY
    ==========================================
    */

    confirmationEmailSent: {
      type: Boolean,
      default: false,
    },

    confirmationEmailSentAt: {
      type: Date,
      default: null,
    },

    confirmationEmailAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    confirmationEmailError: {
      type: String,
      default: null,
      select: false,
    },

    /*
    ==========================================
    ATTENDANCE
    ==========================================
    */

    checkedIn: {
      type: Boolean,
      default: false,
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
    ==========================================
    COMMUNICATION
    ==========================================
    */

    logisticsEmailSent: {
      type: Boolean,
      default: false,
    },

    logisticsSmsSent: {
      type: Boolean,
      default: false,
    },

    lastCommunicationAt: {
      type: Date,
      default: null,
    },

    /*
    ==========================================
    CONSENT AND SECURITY
    ==========================================
    */

    acceptedTerms: {
      type: Boolean,
      required: true,
      default: false,
    },

    consentedToCommunication: {
      type: Boolean,
      required: true,
      default: false,
    },

    ipAddress: {
      type: String,
      default: null,
      select: false,
    },

    userAgent: {
      type: String,
      default: null,
      select: false,
    },

    status: {
      type: String,
      enum: ["confirmed", "cancelled", "waitlisted"],
      default: "confirmed",
      index: true,
    },

    registeredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
==========================================
COMPOUND INDEXES
==========================================
*/

/**
 * A national ID can only register once for a particular summit.
 */
summitRegistrationSchema.index(
  {
    summitEvent: 1,
    nationalId: 1,
  },
  {
    unique: true,
    name: "unique_summit_national_id",
  }
);

/**
 * An email can only register once for a particular summit.
 */
summitRegistrationSchema.index(
  {
    summitEvent: 1,
    email: 1,
  },
  {
    unique: true,
    name: "unique_summit_email",
  }
);

/**
 * A phone number can only register once for a particular summit.
 */
summitRegistrationSchema.index(
  {
    summitEvent: 1,
    phone: 1,
  },
  {
    unique: true,
    name: "unique_summit_phone",
  }
);

/**
 * Prevent two participants from receiving the same county slot.
 */
summitRegistrationSchema.index(
  {
    summitEvent: 1,
    countyCode: 1,
    countySlotNumber: 1,
  },
  {
    unique: true,
    name: "unique_summit_county_slot",
  }
);

/**
 * Support admin county registration listings.
 */
summitRegistrationSchema.index({
  summitEvent: 1,
  county: 1,
  status: 1,
  registeredAt: -1,
});

/*
==========================================
DOCUMENT VALIDATION
==========================================
*/

summitRegistrationSchema.pre(
  "validate",
  function validateRegistration() {
    if (
      this.isRegisteredMember &&
      !this.member
    ) {
      throw new Error(
        "A member reference is required when the participant is registered as a JVP member."
      );
    }

    if (
      this.participantType ===
        "member" &&
      !this.isRegisteredMember
    ) {
      throw new Error(
        "Participant type cannot be member when isRegisteredMember is false."
      );
    }

    if (!this.acceptedTerms) {
      throw new Error(
        "The participant must accept the summit registration terms."
      );
    }

    if (
      !this.consentedToCommunication
    ) {
      throw new Error(
        "The participant must consent to receiving summit communication."
      );
    }
  }
);

const SummitRegistration =
  mongoose.models.SummitRegistration ||
  mongoose.model("SummitRegistration", summitRegistrationSchema);

export default SummitRegistration;