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


    /* REPORTS */

    PERMISSIONS.VIEW_REPORTS,

  ],


  /* ========================================================
     FINANCE
  ======================================================== */

  finance: [

    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.RECORD_PAYMENT,
    PERMISSIONS.REFUND_PAYMENT,
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