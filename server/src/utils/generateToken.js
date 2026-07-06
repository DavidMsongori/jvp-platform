const jwt = require("jsonwebtoken");

const generateToken = (member) => {
  return jwt.sign(
    {
      id: member._id,
      role: member.role,
      membershipNumber: member.membershipNumber,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

module.exports = generateToken;