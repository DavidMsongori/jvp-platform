
import rateLimit from "express-rate-limit";

const awardNominationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Maximum 5 attempts per IP per window
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many nomination attempts. Please try again in 15 minutes.",
  },
});

export default awardNominationLimiter;
