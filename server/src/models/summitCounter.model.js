import mongoose from "mongoose";

const summitCounterSchema = new mongoose.Schema(
  {
    summitEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SummitEvent",
      required: true,
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
    },

    countyCode: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["KLF", "MSA", "KWL", "TTV", "TNR", "LMU"],
    },

    currentSequence: {
      type: Number,
      default: 0,
      min: 0,
    },

    allocatedSlots: {
      type: Number,
      required: true,
      min: 1,
    },

    lastIssuedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * One counter per summit event and county.
 */
summitCounterSchema.index(
  {
    summitEvent: 1,
    countyCode: 1,
  },
  {
    unique: true,
    name: "unique_summit_county_counter",
  }
);

/**
 * Virtual number of slots remaining in the county.
 */
summitCounterSchema.virtual("remainingSlots").get(function remainingSlots() {
  return Math.max(this.allocatedSlots - this.currentSequence, 0);
});

/**
 * Virtual check indicating whether the county is full.
 */
summitCounterSchema.virtual("isFull").get(function isFull() {
  return this.currentSequence >= this.allocatedSlots;
});

summitCounterSchema.set("toJSON", {
  virtuals: true,
});

summitCounterSchema.set("toObject", {
  virtuals: true,
});

const SummitCounter =
  mongoose.models.SummitCounter ||
  mongoose.model("SummitCounter", summitCounterSchema);

export default SummitCounter;