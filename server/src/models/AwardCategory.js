
import mongoose from "mongoose";

const awardCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Award category name is required."],
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: [true, "Award category slug is required."],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 180,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 3000,
    },

    icon: {
      type: String,
      trim: true,
      default: "\u{1F3C6}",
    },

    categoryType: {
      type: String,
      enum: ["open", "jvp_officeholder", "jvp_appointee"],
      default: "open",
      required: true,
    },

    eligibility: {
      minimumAge: {
        type: Number,
        default: 18,
        min: 18,
      },

      maximumAge: {
        type: Number,
        default: 35,
        min: 18,
      },

      eligibleCounties: {
        type: [
          {
            type: String,
            enum: [
              "Mombasa",
              "Kwale",
              "Kilifi",
              "Tana River",
              "Lamu",
              "Taita Taveta",
            ],
          },
        ],
        default: [
          "Mombasa",
          "Kwale",
          "Kilifi",
          "Tana River",
          "Lamu",
          "Taita Taveta",
        ],
      },

      requiresOfficeVerification: {
        type: Boolean,
        default: false,
      },

      additionalRequirements: {
        type: String,
        trim: true,
        default: "",
        maxlength: 2000,
      },
    },

    nominationSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },

      opensAt: {
        type: Date,
        default: null,
      },

      closesAt: {
        type: Date,
        default: null,
      },
    },

    votingSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },

      opensAt: {
        type: Date,
        default: null,
      },

      closesAt: {
        type: Date,
        default: null,
      },
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

  status: {
  type: String,
  enum: ["draft", "active", "inactive"],
  default: "draft",
},

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent invalid age ranges.
awardCategorySchema.pre("validate", function () {
  if (
    this.eligibility &&
    this.eligibility.minimumAge > this.eligibility.maximumAge
  ) {
    this.invalidate(
      "eligibility.maximumAge",
      "Maximum age must be greater than or equal to minimum age."
    );
  }

  const nominationOpen = this.nominationSettings?.opensAt;
  const nominationClose = this.nominationSettings?.closesAt;

  if (
    nominationOpen &&
    nominationClose &&
    nominationClose <= nominationOpen
  ) {
    this.invalidate(
      "nominationSettings.closesAt",
      "Nomination closing time must be after opening time."
    );
  }

  const votingOpen = this.votingSettings?.opensAt;
  const votingClose = this.votingSettings?.closesAt;

  if (votingOpen && votingClose && votingClose <= votingOpen) {
    this.invalidate(
      "votingSettings.closesAt",
      "Voting closing time must be after opening time."
    );
  }
});

// Efficient ordering and filtering in the Secretariat dashboard.
awardCategorySchema.index({ status: 1, displayOrder: 1 });
awardCategorySchema.index({ categoryType: 1, status: 1 });

const AwardCategory =
  mongoose.models.AwardCategory ||
  mongoose.model("AwardCategory", awardCategorySchema);

export default AwardCategory;




