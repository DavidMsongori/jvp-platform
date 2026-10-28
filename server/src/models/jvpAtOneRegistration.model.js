
import mongoose from "mongoose";

const LAMU_WARDS = {
  "Lamu East": [
    "Faza",
    "Kiunga",
    "Basuba",
  ],
  "Lamu West": [
    "Shela",
    "Mkomani",
    "Hindi",
    "Hongwe",
    "Bahari",
    "Witu",
    "Mpeketoni",
  ],
};

const jvpAtOneRegistrationSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      trim: true,
    },

    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      maxlength: 16,
    },

    constituency: {
      type: String,
      required: [true, "Constituency is required."],
      enum: {
        values: ["Lamu East", "Lamu West"],
        message: "Select a valid Lamu constituency.",
      },
    },

    ward: {
      type: String,
      required: [true, "Ward is required."],
      trim: true,
    },

    registrationStatus: {
      type: String,
      enum: ["registered", "cancelled"],
      default: "registered",
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Ensure registration numbers are unique when present.
 * The partial index allows existing records without numbers
 * to remain in the database while we update the controller.
 */
jvpAtOneRegistrationSchema.index(
  { registrationNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      registrationNumber: { $type: "string" },
    },
  }
);

/* Validate that the selected ward belongs to the constituency. */
jvpAtOneRegistrationSchema.pre("validate", function () {
  const validWards = LAMU_WARDS[this.constituency] || [];

  if (this.ward && !validWards.includes(this.ward)) {
    this.invalidate(
      "ward",
      "The selected ward does not belong to this constituency."
    );
  }
});

const JVPAtOneRegistration = mongoose.model(
  "JVPAtOneRegistration",
  jvpAtOneRegistrationSchema
);

export default JVPAtOneRegistration;
