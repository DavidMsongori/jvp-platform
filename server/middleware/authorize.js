const authorize = (...roles) => {
  return (req, res, next) => {

    if (!req.member) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.member.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    next();
  };
};

module.exports = authorize;