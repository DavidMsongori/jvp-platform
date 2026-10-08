import mongoose from "mongoose";

/* =========================================================
   CONTACT CONSTANTS
========================================================= */

export const CONTACT_STATUS = {
  NEW: "new",
  READ: "read",
  IN_PROGRESS: "in_progress",
  RESPONDED: "responded",
  ARCHIVED: "archived",
};

export const CONTACT_PRIORITY = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
};

export const CONTACT_CATEGORIES = {
  GENERAL: "general",
  MEMBERSHIP: "membership",
  PROGRAMMES: "programmes",
  PARTNERSHIPS: "partnerships",
  MEDIA: "media",
  EVENTS: "events",
  LEADERSHIP: "leadership",
  OPPORTUNITIES: "opportunities",
  SUPPORT: "support",
  COMPLAINTS: "complaints",
  OTHER: "other",
};

/* =========================================================
   CONTACT SCHEMA
========================================================= */

const contactSchema = new mongoose.Schema(
  {
    /* -------------------------------------------------------
       SENDER INFORMATION
    ------------------------------------------------------- */

    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [100, "Name cannot exceed 100 characters."],
    },

    email: {
      type: String,
      required: [true, "Email address is required."],
      trim: true,
      lowercase: true,
      maxlength: [150, "Email cannot exceed 150 characters."],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address.",
      ],
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [30, "Phone number cannot exceed 30 characters."],
    },

    /* -------------------------------------------------------
       ENQUIRY
    ------------------------------------------------------- */

    subject: {
      type: String,
      required: [true, "Subject is required."],
      trim: true,
      minlength: [3, "Subject must be at least 3 characters."],
      maxlength: [200, "Subject cannot exceed 200 characters."],
    },

    category: {
      type: String,
      enum: Object.values(CONTACT_CATEGORIES),
      default: CONTACT_CATEGORIES.GENERAL,
    },

    message: {
      type: String,
      required: [true, "Message is required."],
      trim: true,
      minlength: [10, "Message must be at least 10 characters."],
      maxlength: [
        5000,
        "Message cannot exceed 5000 characters.",
      ],
    },

    /* -------------------------------------------------------
       WORKFLOW
    ------------------------------------------------------- */

    status: {
      type: String,
      enum: Object.values(CONTACT_STATUS),
      default: CONTACT_STATUS.NEW,
      index: true,
    },

    priority: {
      type: String,
      enum: Object.values(CONTACT_PRIORITY),
      default: CONTACT_PRIORITY.NORMAL,
      index: true,
    },

    /* -------------------------------------------------------
       ADMIN ASSIGNMENT
    ------------------------------------------------------- */

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    response: {
      type: String,
      trim: true,
      maxlength: [
        10000,
        "Response cannot exceed 10000 characters.",
      ],
      default: "",
    },

    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    /* -------------------------------------------------------
       ADMIN NOTES
    ------------------------------------------------------- */

    internalNotes: {
      type: String,
      trim: true,
      maxlength: [
        5000,
        "Internal notes cannot exceed 5000 characters.",
      ],
      default: "",
    },

    /* -------------------------------------------------------
       READ TRACKING
    ------------------------------------------------------- */

    readAt: {
      type: Date,
      default: null,
    },

    readBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* -------------------------------------------------------
       ARCHIVE TRACKING
    ------------------------------------------------------- */

    archivedAt: {
      type: Date,
      default: null,
    },

    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* -------------------------------------------------------
       SOURCE / METADATA
    ------------------------------------------------------- */

    source: {
      type: String,
      default: "website",
      trim: true,
      maxlength: 50,
    },

    ipAddress: {
      type: String,
      default: null,
      maxlength: 100,
    },

    userAgent: {
      type: String,
      default: null,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================================
   INDEXES
========================================================= */

contactSchema.index({
  status: 1,
  createdAt: -1,
});

contactSchema.index({
  category: 1,
  createdAt: -1,
});

contactSchema.index({
  priority: 1,
  createdAt: -1,
});

contactSchema.index({
  email: 1,
  createdAt: -1,
});

contactSchema.index({
  assignedTo: 1,
  status: 1,
});

contactSchema.index({
  createdAt: -1,
});

/* =========================================================
   INSTANCE METHODS
========================================================= */

/**
 * Mark enquiry as read.
 */
contactSchema.methods.markAsRead = function (userId = null) {
  this.status =
    this.status === CONTACT_STATUS.NEW
      ? CONTACT_STATUS.READ
      : this.status;

  this.readAt = new Date();
  this.readBy = userId || null;

  return this.save();
};

/**
 * Mark enquiry as in progress.
 */
contactSchema.methods.markInProgress = function () {
  this.status = CONTACT_STATUS.IN_PROGRESS;

  return this.save();
};

/**
 * Assign enquiry to an administrator.
 */
contactSchema.methods.assignToUser = function (userId) {
  this.assignedTo = userId;
  this.assignedAt = new Date();

  if (this.status === CONTACT_STATUS.NEW) {
    this.status = CONTACT_STATUS.READ;
  }

  return this.save();
};

/**
 * Respond to enquiry.
 */
contactSchema.methods.markResponded = function (
  response,
  userId = null
) {
  this.response = response;
  this.respondedBy = userId || null;
  this.respondedAt = new Date();
  this.status = CONTACT_STATUS.RESPONDED;

  return this.save();
};

/**
 * Archive enquiry.
 */
contactSchema.methods.archive = function (userId = null) {
  this.status = CONTACT_STATUS.ARCHIVED;
  this.archivedAt = new Date();
  this.archivedBy = userId || null;

  return this.save();
};

/**
 * Restore archived enquiry.
 */
contactSchema.methods.restore = function () {
  this.status = CONTACT_STATUS.READ;
  this.archivedAt = null;
  this.archivedBy = null;

  return this.save();
};

/* =========================================================
   STATIC METHODS
========================================================= */

/**
 * Get all active enquiries.
 */
contactSchema.statics.findActive = function () {
  return this.find({
    status: {
      $ne: CONTACT_STATUS.ARCHIVED,
    },
  }).sort({
    createdAt: -1,
  });
};

/**
 * Get unread enquiries.
 */
contactSchema.statics.findUnread = function () {
  return this.find({
    status: CONTACT_STATUS.NEW,
  }).sort({
    createdAt: -1,
  });
};

/**
 * Count unread enquiries.
 */
contactSchema.statics.countUnread = function () {
  return this.countDocuments({
    status: CONTACT_STATUS.NEW,
  });
};

/* =========================================================
   MODEL
========================================================= */

const Contact = mongoose.model(
  "Contact",
  contactSchema
);

export default Contact;