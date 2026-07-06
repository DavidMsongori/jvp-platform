const jwt = require("jsonwebtoken");
const Member = require("../models/Member");

/* ==========================================
   PROTECT ROUTES
========================================== */

const protect = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // No Token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find Member
    const member = await Member.findById(decoded.id).select("-password");

    if (!member) {
      return res.status(401).json({
        success: false,
        message: "Member not found.",
      });
    }

    // Account must be activated
    if (member.activationStatus !== "Activated") {
      return res.status(401).json({
        success: false,
        message: "Account is not activated.",
      });
    }

    // Attach member to request
    req.member = member;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

/* ==========================================
   AUTHORIZE ROLES
========================================== */

const authorize = (...roles) => {
  return (req, res, next) => {

    if (!req.member) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!roles.includes(req.member.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};