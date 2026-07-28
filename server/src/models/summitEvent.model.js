import mongoose from "mongoose";

const countyAllocationSchema = new mongoose.Schema(
  {
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
    },

    countyCode: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["KLF", "MSA", "KWL", "TTV", "TNR", "LMU"],
    },

    allocatedSlots: {
      type: Number,
      required: true,
      min: 0,
    },

    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isRegistrationOpen: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const summitEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Coast Youth Summit 2026",
    },

    shortTitle: {
      type: String,
      trim: true,
      default: "CYS 2026",
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      default: "coast-youth-summit-2026",
    },

    description: {
      type: String,
      trim: true,
      default:
        "A regional youth summit bringing together young people from the six counties of Kenya's Coast Region.",
    },

    year: {
      type: Number,
      required: true,
      default: 2026,
    },

    summitDate: {
      type: Date,
      default: null,
    },

    dateStatus: {
      type: String,
      enum: ["confirmed", "to_be_communicated"],
      default: "to_be_communicated",
    },

    venue: {
      name: {
        type: String,
        trim: true,
        default: "To be communicated",
      },

      county: {
        type: String,
        trim: true,
        default: "Kilifi",
      },

      address: {
        type: String,
        trim: true,
        default: "To be communicated",
      },

      mapUrl: {
        type: String,
        trim: true,
        default: null,
      },
    },

    registrationOpensAt: {
      type: Date,
      default: null,
    },

    registrationClosesAt: {
      type: Date,
      default: null,
    },

    registrationStatus: {
      type: String,
      enum: ["draft", "open", "paused", "closed"],
      default: "draft",
    },

    totalCapacity: {
      type: Number,
      required: true,
      default: 10000,
      min: 1,
    },

    totalRegistered: {
      type: Number,
      default: 0,
      min: 0,
    },

    countyAllocations: {
      type: [countyAllocationSchema],
      default: [
        {
          county: "Kilifi",
          countyCode: "KLF",
          allocatedSlots: 7500,
          registeredCount: 0,
          isRegistrationOpen: true,
        },
        {
          county: "Mombasa",
          countyCode: "MSA",
          allocatedSlots: 500,
          registeredCount: 0,
          isRegistrationOpen: true,
        },
        {
          county: "Kwale",
          countyCode: "KWL",
          allocatedSlots: 500,
          registeredCount: 0,
          isRegistrationOpen: true,
        },
        {
          county: "Taita Taveta",
          countyCode: "TTV",
          allocatedSlots: 500,
          registeredCount: 0,
          isRegistrationOpen: true,
        },
        {
          county: "Tana River",
          countyCode: "TNR",
          allocatedSlots: 500,
          registeredCount: 0,
          isRegistrationOpen: true,
        },
        {
          county: "Lamu",
          countyCode: "LMU",
          allocatedSlots: 500,
          registeredCount: 0,
          isRegistrationOpen: true,
        },
      ],
    },

    allowMemberRegistration: {
      type: Boolean,
      default: true,
    },

    allowPublicRegistration: {
      type: Boolean,
      default: true,
    },

    allowMembershipInterest: {
      type: Boolean,
      default: true,
    },

    ticketPrefix: {
      type: String,
      trim: true,
      uppercase: true,
      default: "CYS",
    },

    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    contactPhone: {
      type: String,
      trim: true,
      default: null,
    },

    logisticsMessage: {
      type: String,
      trim: true,
      default:
        "The final summit date, venue and transport logistics will be communicated through email and phone.",
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Ensure each county appears only once in an event.
 */
summitEventSchema.pre(
  "validate",
  function validateCountyAllocations() {
    const counties =
      this.countyAllocations.map(
        (allocation) =>
          allocation.county.toLowerCase()
      );

    const uniqueCounties =
      new Set(counties);

    if (
      counties.length !==
      uniqueCounties.size
    ) {
      throw new Error(
        "A county cannot appear more than once in county allocations."
      );
    }

    const allocatedTotal =
      this.countyAllocations.reduce(
        (total, allocation) =>
          total +
          allocation.allocatedSlots,
        0
      );

    if (
      allocatedTotal !==
      this.totalCapacity
    ) {
      throw new Error(
        `County allocations must equal the total summit capacity of ${this.totalCapacity}.`
      );
    }
  }
);

/**
 * Virtual remaining summit slots.
 */
summitEventSchema.virtual("remainingSlots").get(function remainingSlots() {
  return Math.max(this.totalCapacity - this.totalRegistered, 0);
});

summitEventSchema.set("toJSON", {
  virtuals: true,
});

summitEventSchema.set("toObject", {
  virtuals: true,
});

const SummitEvent =
  mongoose.models.SummitEvent ||
  mongoose.model("SummitEvent", summitEventSchema);

export default SummitEvent;