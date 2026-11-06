
import AppError from "../utils/AppError.js";

/* ==========================================
   ACTIVE MEMBERSHIP AUTHORIZATION
========================================== */

const requireActiveMembership = (req, res, next) => {
  if (!req.member) {
    return next(
      new AppError(404, "Member profile not found.")
    );
  }

  const hasPaidMembership =
    req.member.membershipFeePaid === true;

  const isMembershipActive =
    req.member.membershipStatus === "active";

  if (!hasPaidMembership || !isMembershipActive) {
    return next(
      new AppError(
        403,
        "Your membership is not active. Please complete your membership payment to access this feature."
      )
    );
  }

  next();
};

export default requireActiveMembership;
