
import mongoose from "mongoose";

const jvpAtOnePhotoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Photo title is required."],
      trim: true,
      maxlength: 120,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    publicId: {
      type: String,
      required: true,
      unique: true,
    },
    secureUrl: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      default: "",
    },
    bytes: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

jvpAtOnePhotoSchema.index({ isActive: 1, createdAt: -1 });

const JVPAtOnePhoto = mongoose.model(
  "JVPAtOnePhoto",
  jvpAtOnePhotoSchema
);

export default JVPAtOnePhoto;
