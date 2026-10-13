/* ==========================================================
   ACTIVITY MODULES
========================================================== */

export const ACTIVITY_MODULES = {
  AUTH: "auth",
  MEMBERS: "members",
  PAYMENTS: "payments",
  EVENTS: "events",
  REGISTRATIONS: "registrations",
  VENUES: "venues",
  SPEAKERS: "speakers",
  PARTNERS: "partners",
  NEWS: "news",
  BLOGS: "blogs",
  SETTINGS: "settings",
  REPORTS: "reports",
  SYSTEM: "system",
  PROGRAMS: "programs",
};

/* ==========================================================
   TARGET TYPES
========================================================== */

export const TARGET_TYPES = {
  USER: "User",
  MEMBER: "Member",
  PAYMENT: "Payment",
  EVENT: "Event",
  EVENT_REGISTRATION: "EventRegistration",
  VENUE: "Venue",
  SPEAKER: "Speaker",
  PARTNER: "Partner",
  NEWS: "News",
  BLOG: "Blog",
  SETTING: "Setting",
  REPORT: "Report",
  SYSTEM: "System",
  PROGRAM: "Program",
};

/* ==========================================================
   ACTIVITY ACTIONS
========================================================== */

export const ACTIVITY = {
  AUTH: {
  REGISTER: "register",
  LOGIN: "login",
  LOGOUT: "logout",

  EMAIL_VERIFIED: "email_verified",

  OTP_SENT: "otp_sent",
  OTP_RESENT: "otp_resent",
  OTP_VERIFIED: "otp_verified",

  ACCOUNT_ACTIVATED: "account_activated",

  PASSWORD_CREATED: "password_created",

  PASSWORD_RESET_REQUESTED: "password_reset_requested",
  PASSWORD_RESET: "password_reset",

  PASSWORD_CHANGED: "password_changed",

  REFRESH_TOKEN: "refresh_token",
},

  MEMBER: {
    CREATED: "member_created",
    UPDATED: "member_updated",
    ACTIVATED: "member_activated",
    DEACTIVATED: "member_deactivated",
    IMPORTED: "member_imported",
    PROFILE_UPDATED: "profile_updated",
    PHOTO_UPDATED: "profile_photo_updated",
    RENEWED: "membership_renewed",
    STATUS_CHANGED: "membership_status_changed",
    TYPE_CHANGED: "membership_type_changed",
  },

  PAYMENT: {
    CREATED: "payment_created",
    SUCCESSFUL: "payment_successful",
    FAILED: "payment_failed",
    VERIFIED: "payment_verified",
    REFUNDED: "payment_refunded",
  },

  EVENT: {
    CREATED: "event_created",
    UPDATED: "event_updated",
    DELETED: "event_deleted",
    PUBLISHED: "event_published",
    CANCELLED: "event_cancelled",
  },

  REGISTRATION: {
    REGISTERED: "event_registered",
    CONFIRMED: "registration_confirmed",
    WAITLISTED: "registration_waitlisted",
    CANCELLED: "registration_cancelled",
    CHECKED_IN: "event_checked_in",
    ATTENDED: "event_attended",
    CERTIFICATE_ISSUED: "certificate_issued",
  },

  VENUE: {
    CREATED: "venue_created",
    UPDATED: "venue_updated",
    DELETED: "venue_deleted",
  },

  SPEAKER: {
    CREATED: "speaker_created",
    UPDATED: "speaker_updated",
    DELETED: "speaker_deleted",
  },

  PARTNER: {
    CREATED: "partner_created",
    UPDATED: "partner_updated",
    DELETED: "partner_deleted",
  },

  NEWS: {
    CREATED: "news_created",
    UPDATED: "news_updated",
    PUBLISHED: "news_published",
    DELETED: "news_deleted",
  },

  BLOG: {
    CREATED: "blog_created",
    UPDATED: "blog_updated",
    PUBLISHED: "blog_published",
    DELETED: "blog_deleted",
  },

  SETTINGS: {
    UPDATED: "settings_updated",
  },

  REPORT: {
    GENERATED: "report_generated",
    EXPORTED: "report_exported",
  },

  SYSTEM: {
    BACKUP: "system_backup",
    RESTORE: "system_restore",
    MAINTENANCE: "system_maintenance",
  },

  PROGRAM: {
  CREATED: "program_created",
  UPDATED: "program_updated",
  PUBLISHED: "program_published",
  UNPUBLISHED: "program_unpublished",
  DELETED: "program_deleted",
  FEATURED: "program_featured",
  UNFEATURED: "program_unfeatured",
  IMPACT_UPDATED: "program_impact_updated",
},
};