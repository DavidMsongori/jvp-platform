import mongoose from "mongoose";

const aspirantSchema = new mongoose.Schema(
  {
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: [true, "Election is required"],
    },

    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Position is required"],
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Member is required"],
    },

    /*
     * Normal aspirants come from an approved
     * ElectionApplication.
     *
     * Legacy/existing aspirants may have no
     * application because they applied outside
     * the current JVP Connect workflow.
     */
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElectionApplication",
      default: null,
    },

    /*
     * Identifies how the aspirant entered
     * the election system.
     */
    source: {
      type: String,
      enum: ["application", "legacy"],
      default: "application",
    },

    name: {
      type: String,
      required: [true, "Aspirant name is required"],
      trim: true,
    },

    photo: {
      type: String,
      trim: true,
      default: "",
    },

    manifesto: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "active",
        "withdrawn",
        "disqualified",
      ],
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
 * One member can only be an aspirant once
 * for the same election position.
 */
aspirantSchema.index(
  {
    election: 1,
    positionId: 1,
    member: 1,
  },
  {
    unique: true,
  }
);

/*
 * An application can only create one aspirant,
 * but legacy aspirants are allowed to have
 * application: null.
 */
aspirantSchema.index(
  {
    application: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      application: {
        $type: "objectId",
      },
    },
  }
);

aspirantSchema.index({
  election: 1,
  positionId: 1,
  status: 1,
});

const Aspirant = mongoose.model(
  "Aspirant",
  aspirantSchema
);

export default Aspirant;