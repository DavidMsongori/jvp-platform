import mongoose from "mongoose";

/* ==========================================================
   MEETING COUNTER SCHEMA
========================================================== */

const meetingCounterSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    sequence: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    lastMeetingNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

/* ==========================================================
   EXPORT
========================================================== */

const MeetingCounter =
  mongoose.models.MeetingCounter ||
  mongoose.model(
    "MeetingCounter",
    meetingCounterSchema
  );

export default MeetingCounter;