/* ==========================================================
   MEMBERSHIP CONFIGURATION
========================================================== */

export const MEMBERSHIP = {

  /* ==========================================
     FEES
  ========================================== */

  fees: {

    /* Ordinary Membership */
    ordinary: 50,

    /* Leadership Membership */
    leadership: 100,

    /* General Renewal Fee */
    renewal: 100,

  },

  /* ==========================================
     CURRENCY
  ========================================== */

  currency: "KES",

  /* ==========================================
     DURATION
  ========================================== */

  validityInMonths: 12,

  /* ==========================================
     STATUS
  ========================================== */

  status: {

    PENDING_PAYMENT: "pending_payment",

    ACTIVE: "active",

    EXPIRED: "expired",

    INACTIVE: "inactive",

  },

  /* ==========================================
     TYPES
  ========================================== */

  types: {

    ORDINARY: "ordinary",

    LEADERSHIP: "leadership",

  },

};

/* ==========================================================
   HELPER FUNCTIONS
========================================================== */

/**
 * Get membership fee by membership type.
 *
 * ordinary    → KES 50
 * leadership  → KES 100
 *
 * Falls back to the ordinary membership fee if
 * an unknown membership type is supplied.
 */

export function getMembershipFee(type) {

  return (

    MEMBERSHIP.fees[type] ??

    MEMBERSHIP.fees.ordinary

  );

}

/**
 * Calculate membership expiry date.
 */

export function calculateMembershipExpiry(

  activationDate = new Date()

) {

  const expiry = new Date(activationDate);

  expiry.setMonth(

    expiry.getMonth() +

      MEMBERSHIP.validityInMonths

  );

  return expiry;

}