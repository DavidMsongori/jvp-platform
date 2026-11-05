
import mongoose from "mongoose";

const awardAuditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
      index: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "nomination_submitted",
        "nomination_withdrawn",
        "nomination_under_review",
        "nomination_approved",
        "nomination_rejected",
        "vote_cast",
        "vote_rejected",
        "duplicate_vote_attempt",
        "category_created",
"category_updated",
"category_activated",
"category_deactivated",
"voting_opened",
        "voting_closed",
        "complaint_submitted",
        "complaint_resolved",
        "results_published",
        "results_unpublished",
      ],
      index: true,
    },

    targetType: {
      type: String,
      enum: [
        "category",
        "nomination",
        "vote",
        "complaint",
        "results",
        "system",
      ],
      default: "system",
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AwardCategory",
      default: null,
      index: true,
    },

    nomination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AwardNomination",
      default: null,
    },

    vote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AwardVote",
      default: null,
    },

    outcome: {
      type: String,
      enum: ["success", "rejected", "failed"],
      default: "success",
      required: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      default: null,
      maxlength: 100,
    },

    userAgent: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Support chronological audit reviews.
awardAuditLogSchema.index({ action: 1, createdAt: -1 });
awardAuditLogSchema.index({ user: 1, createdAt: -1 });
awardAuditLogSchema.index({ member: 1, createdAt: -1 });
awardAuditLogSchema.index({ category: 1, createdAt: -1 });

// Prevent model recompilation during development reloads.
const AwardAuditLog =
  mongoose.models.AwardAuditLog ||
  mongoose.model("AwardAuditLog", awardAuditLogSchema);

export default AwardAuditLog;
