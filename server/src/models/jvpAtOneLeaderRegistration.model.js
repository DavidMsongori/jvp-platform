
import mongoose from "mongoose";

const jvpAtOneLeaderRegistrationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

        position: {
      type: String,
      required: [true, "Leadership position is required."],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      maxlength: 16,
      unique: true,
    },

    county: {
      type: String,
      required: [true, "County is required."],
      enum: [
        "Mombasa",
        "Kwale",
        "Kilifi",
        "Tana River",
        "Lamu",
        "Taita Taveta",
      ],
    },

    constituency: {
      type: String,
      required: [true, "Constituency is required."],
      trim: true,
    },

    ward: {
      type: String,
      required: [true, "Ward is required."],
      trim: true,
    },

    pickupTown: {
      type: String,
      required: [true, "Nearest pick-up town is required."],
      trim: true,
      maxlength: 100,
    },

    tShirtSize: {
      type: String,
      required: [true, "T-shirt size is required."],
      enum: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
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

// Useful indexes for future admin filtering.
jvpAtOneLeaderRegistrationSchema.index({
  county: 1,
  constituency: 1,
  ward: 1,
});

jvpAtOneLeaderRegistrationSchema.index({
  registrationStatus: 1,
  createdAt: -1,
});

const JVPAtOneLeaderRegistration = mongoose.model(
  "JVPAtOneLeaderRegistration",
  jvpAtOneLeaderRegistrationSchema
);

export default JVPAtOneLeaderRegistration;
