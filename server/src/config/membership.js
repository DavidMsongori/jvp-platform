/* ==========================================================
   MEMBERSHIP CONFIGURATION
========================================================== */

export const MEMBERSHIP = {

  /* ==========================================
     FEES
  ========================================== */

  fees: {

    ordinary: 100,

    leadership: 500,

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
 * Get membership fee by type.
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