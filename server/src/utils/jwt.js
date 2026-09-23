import jwt from "jsonwebtoken";

/* ==========================================
   CONFIG
========================================== */

const JWT_SECRET = process.env.JWT_SECRET;

const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || "7d";

const PASSWORD_SETUP_EXPIRES_IN =
  process.env.PASSWORD_SETUP_EXPIRES_IN || "15m";

/* ==========================================
   VALIDATE JWT CONFIG
========================================== */

const ensureJwtSecret = () => {
  if (!JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }
};

/* ==========================================
   GENERATE ACCESS TOKEN
========================================== */

export const generateToken = (userId) => {
  ensureJwtSecret();

  return jwt.sign(
    {
      id: userId,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

/* ==========================================
   VERIFY ACCESS TOKEN
========================================== */

export const verifyToken = (token) => {
  ensureJwtSecret();

  return jwt.verify(
    token,
    JWT_SECRET
  );
};

/* ==========================================
   GENERATE PASSWORD SETUP TOKEN
========================================== */

export const generatePasswordSetupToken = (
  memberId
) => {
  ensureJwtSecret();

  return jwt.sign(
    {
      memberId,
      purpose: "PASSWORD_SETUP",
    },
    JWT_SECRET,
    {
      expiresIn:
        PASSWORD_SETUP_EXPIRES_IN,
    }
  );
};

/* ==========================================
   VERIFY PASSWORD SETUP TOKEN
========================================== */

export const verifyPasswordSetupToken = (
  token
) => {
  ensureJwtSecret();

  const decoded = jwt.verify(
    token,
    JWT_SECRET
  );

  if (
    decoded.purpose !==
    "PASSWORD_SETUP"
  ) {
    throw new Error(
      "Invalid password setup token."
    );
  }

  if (!decoded.memberId) {
    throw new Error(
      "Password setup token is missing member information."
    );
  }

  return decoded;
};