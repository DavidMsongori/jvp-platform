import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
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

    aspirant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Aspirant",
      required: [true, "Aspirant is required"],
    },

    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Voter is required"],
    },

    castAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =======================================================
   INDEXES
======================================================= */

// One member can vote only once for each position
// within a particular election.
voteSchema.index(
  {
    election: 1,
    positionId: 1,
    voter: 1,
  },
  {
    unique: true,
  }
);

// Optimizes election result counting.
voteSchema.index({
  election: 1,
  positionId: 1,
  aspirant: 1,
});

/* =======================================================
   MODEL
======================================================= */

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;