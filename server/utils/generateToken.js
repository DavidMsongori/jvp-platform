const jwt = require("jsonwebtoken");

const generateToken = (member) => {
  return jwt.sign(
    {
      id: member._id,
      role: member.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

module.exports = generateToken;