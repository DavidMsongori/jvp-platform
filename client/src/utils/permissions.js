/* ==========================================================
   SYSTEM PERMISSIONS
========================================================== */

export const PERMISSIONS = {

  /* MEMBERS */

  VIEW_MEMBERS: "view_members",
  CREATE_MEMBER: "create_member",
  EDIT_MEMBER: "edit_member",
  DELETE_MEMBER: "delete_member",


  /* PAYMENTS */

  VIEW_PAYMENTS: "view_payments",
  RECORD_PAYMENT: "record_payment",
  REFUND_PAYMENT: "refund_payment",


  /* FINANCE */

  VIEW_FINANCE_DASHBOARD: "view_finance_dashboard",
  VIEW_FINANCE_REPORTS: "view_finance_reports",


  /* EVENTS */

  VIEW_EVENTS: "view_events",
  CREATE_EVENT: "create_event",
  EDIT_EVENT: "edit_event",
  DELETE_EVENT: "delete_event",


  /* PROGRAMS */

  VIEW_PROGRAMS: "view_programs",
  CREATE_PROGRAM: "create_program",


  /* ELECTIONS */

  MANAGE_ELECTIONS: "manage_elections",


  /* NEWS */

  VIEW_NEWS: "view_news",
  CREATE_NEWS: "create_news",
  EDIT_NEWS: "edit_news",
  DELETE_NEWS: "delete_news",
  PUBLISH_NEWS: "publish_news",
  FEATURE_NEWS: "feature_news",
  ARCHIVE_NEWS: "archive_news",
  VIEW_NEWS_REPORTS: "view_news_reports",


  /* REPORTS */

  VIEW_REPORTS: "view_reports",


  /* SETTINGS */

  MANAGE_SETTINGS: "manage_settings",


  /* USERS */

  MANAGE_USERS: "manage_users",

};


/* ==========================================================
   ROLE PERMISSIONS
========================================================== */

export const ROLE_PERMISSIONS = {

  /* ========================================================
     SUPER ADMIN
  ======================================================== */

  super_admin: [

    "*",

  ],


  /* ========================================================
     ADMIN
  ======================================================== */

  admin: [

    /* MEMBERS */

    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.CREATE_MEMBER,
    PERMISSIONS.EDIT_MEMBER,


    /* PAYMENTS */

    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.RECORD_PAYMENT,


    /* EVENTS */

    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.CREATE_EVENT,
    PERMISSIONS.EDIT_EVENT,


    /* PROGRAMS */

    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.CREATE_PROGRAM,


    /* ELECTIONS */

    PERMISSIONS.MANAGE_ELECTIONS,


    /* NEWS */

    PERMISSIONS.VIEW_NEWS,
    PERMISSIONS.CREATE_NEWS,
    PERMISSIONS.EDIT_NEWS,
    PERMISSIONS.DELETE_NEWS,
    PERMISSIONS.PUBLISH_NEWS,
    PERMISSIONS.FEATURE_NEWS,
    PERMISSIONS.ARCHIVE_NEWS,
    PERMISSIONS.VIEW_NEWS_REPORTS,


    /* REPORTS */

    PERMISSIONS.VIEW_REPORTS,

  ],


  /* ========================================================
     FINANCE
  ======================================================== */

  finance: [

    /* FINANCE */

    PERMISSIONS.VIEW_FINANCE_DASHBOARD,
    PERMISSIONS.VIEW_FINANCE_REPORTS,


    /* PAYMENTS */

    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.RECORD_PAYMENT,
    PERMISSIONS.REFUND_PAYMENT,


    /* REPORTS */

    PERMISSIONS.VIEW_REPORTS,

  ],


  /* ========================================================
     EVENTS
  ======================================================== */

  events: [

    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.CREATE_EVENT,
    PERMISSIONS.EDIT_EVENT,
    PERMISSIONS.DELETE_EVENT,

  ],


  /* ========================================================
     MEMBER
  ======================================================== */

  member: [

  ],

};


/* ==========================================================
   CHECK PERMISSION
========================================================== */

export function hasPermission(

  role,

  permission

) {

  const permissions =
    ROLE_PERMISSIONS[role] || [];

  return (

    permissions.includes("*") ||

    permissions.includes(permission)

  );

}