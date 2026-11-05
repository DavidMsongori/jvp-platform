import mongoose from "mongoose";

const awardVoteSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AwardCategory",
      required: true,
      index: true,
    },

    nomination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AwardNomination",
      required: true,
      index: true,
    },

    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },

    castAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Enforce one vote per member per award category.
awardVoteSchema.index(
  { category: 1, voter: 1 },
  { unique: true }
);

// Support category results and vote counting.
awardVoteSchema.index(
  { category: 1, nomination: 1 }
);

// Support a member's voting history.
awardVoteSchema.index(
  { voter: 1, category: 1 }
);

const AwardVote =
  mongoose.models.AwardVote ||
  mongoose.model("AwardVote", awardVoteSchema);

export default AwardVote;