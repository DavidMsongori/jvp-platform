const Member = require("../models/Member");
const COUNTIES = require("../constants/counties");

const generateMembershipNumber = async (county) => {
  const prefix = COUNTIES[county];

  if (!prefix) {
    throw new Error("Invalid county.");
  }

  const year = new Date().getFullYear();

  const total = await Member.countDocuments({
    county,
    membershipNumber: { $ne: null },
  });

  const sequence = String(total + 1).padStart(5, "0");

  return `JVP/${prefix}/${year}/${sequence}`;
};

module.exports = generateMembershipNumber;