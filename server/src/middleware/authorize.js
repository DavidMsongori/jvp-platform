import AppError from "../utils/AppError.js";

/* ==========================================
   ROLE AUTHORIZATION MIDDLEWARE
========================================== */

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    /* ----------------------------
       AUTHENTICATED?
    ---------------------------- */

    if (!req.user) {
      return next(
        new AppError(
          401,
          "Authentication required."
        )
      );
    }

    /* ----------------------------
       AUTHORIZED?
    ---------------------------- */

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          "You do not have permission to access this resource."
        )
      );
    }

    next();
  };
};

export default authorize;