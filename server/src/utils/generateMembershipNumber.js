const Member = require("../models/Member");
const COUNTIES = require("../constants/counties");

/* ==========================================
   GENERATE MEMBERSHIP NUMBER

   Format:
   JVP/TTV/2026/000001
========================================== */

const generateMembershipNumber = async (county) => {
  if (!county) {
    throw new Error("County is required.");
  }

  const prefix = COUNTIES[county];

  if (!prefix) {
    throw new Error(`Unsupported county: ${county}`);
  }

  const year = new Date().getFullYear();

  /*
    Find the latest membership number
    for this county and year.

    Example:
    JVP/TTV/2026/000145
  */

  const latestMember = await Member.findOne({
    county,
    membershipNumber: {
      $regex: `^JVP/${prefix}/${year}/`,
    },
  })
    .sort({ membershipNumber: -1 })
    .select("membershipNumber");

  let nextSequence = 1;

  if (latestMember && latestMember.membershipNumber) {
    const parts = latestMember.membershipNumber.split("/");

    if (parts.length === 4) {
      const current = parseInt(parts[3], 10);

      if (!isNaN(current)) {
        nextSequence = current + 1;
      }
    }
  }

  const sequence = String(nextSequence).padStart(6, "0");

  return `JVP/${prefix}/${year}/${sequence}`;
};

module.exports = generateMembershipNumber;