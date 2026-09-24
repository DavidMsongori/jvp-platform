import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: [true, "Election is required"],
      index: true,
    },

    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Position is required"],
      index: true,
    },

    aspirant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Aspirant",
      required: [true, "Aspirant is required"],
      index: true,
    },

    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Voter is required"],
      index: true,
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

/*
|--------------------------------------------------------------------------
| ONE VOTE PER VOTER / POSITION / ELECTION
|--------------------------------------------------------------------------
|
| A voter can vote only once for a particular position
| in a particular election.
|
| Example:
|
| Mombasa Speaker Election
| Position: Speaker
| Voter: MCA A
|
| MCA A cannot submit another vote for the Speaker position.
|
*/
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

/*
|--------------------------------------------------------------------------
| ELECTION RESULTS
|--------------------------------------------------------------------------
|
| Optimizes vote counting by election, position and aspirant.
|
*/
voteSchema.index({
  election: 1,
  positionId: 1,
  aspirant: 1,
});

/*
|--------------------------------------------------------------------------
| VOTER HISTORY
|--------------------------------------------------------------------------
|
| Allows the system to quickly retrieve all votes cast
| by a particular member in an election.
|
*/
voteSchema.index({
  voter: 1,
  election: 1,
});

/*
|--------------------------------------------------------------------------
| ELECTION VOTING ACTIVITY
|--------------------------------------------------------------------------
|
| Useful for admin dashboards, auditing and chronological
| election activity.
|
*/
voteSchema.index({
  election: 1,
  castAt: -1,
});

/* =======================================================
   MODEL
======================================================= */

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;