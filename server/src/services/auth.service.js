import mongoose from "mongoose";
import bcrypt from "bcrypt";

import User from "../models/User.js";
import Member from "../models/Member.js";
import ActivityLog from "../models/ActivityLog.js";

import AppError from "../utils/AppError.js";

import { generateToken } from "../utils/jwt.js";

import generateMemberNumber from "../utils/memberNumber.js";

import otpService from "./otp.service.js";
import emailService from "./email.service.js";

/* ==========================================================
   OTP PURPOSES
========================================================== */

export const OTP_PURPOSE = Object.freeze({
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  ACCOUNT_ACTIVATION: "ACCOUNT_ACTIVATION",
  PASSWORD_RESET: "PASSWORD_RESET",
  LOGIN: "LOGIN",
  CHANGE_EMAIL: "CHANGE_EMAIL",
  CHANGE_PHONE: "CHANGE_PHONE",
});

/* ==========================================================
   START DATABASE TRANSACTION
========================================================== */

async function startTransaction() {
  const session = await mongoose.startSession();

  session.startTransaction();

  return session;
}

/* ==========================================================
   HASH PASSWORD
========================================================== */

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/* ==========================================================
   COMPARE PASSWORD
========================================================== */

async function comparePassword(
  password,
  hashedPassword
) {
  return bcrypt.compare(
    password,
    hashedPassword
  );
}

/* ==========================================================
   FIND USER BY EMAIL
========================================================== */

async function findUserByEmail(email) {
  return User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password");
}

/* ==========================================================
   FIND MEMBER BY USER ID
========================================================== */

async function findMemberByUser(userId) {
  return Member.findOne({
    user: userId,
  });
}

/* ==========================================================
   VALIDATE OTP PURPOSE
========================================================== */

function validateOTPPurpose(purpose) {
  const allowedPurposes = Object.values(
    OTP_PURPOSE
  );

  if (!allowedPurposes.includes(purpose)) {
    throw new AppError(
      "Invalid OTP purpose.",
      400
    );
  }

  return purpose;
}

/* ==========================================================
   LOG USER ACTIVITY
========================================================== */

async function logActivity(
  userId,
  action,
  session = null
) {
  const payload = {
    user: userId,
    action,
  };

  if (session) {
    await ActivityLog.create(
      [payload],
      { session }
    );
  } else {
    await ActivityLog.create(payload);
  }
}

/* ==========================================================
   BUILD AUTH RESPONSE
========================================================== */

function buildAuthResponse(
  user,
  member
) {
  return {
    token: generateToken(user._id),
    user,
    member,
  };
}





/* ==========================================================
   REGISTER NEW MEMBER
========================================================== */

export const register = async (data) => {
  const session = await startTransaction();

  try {
    const {
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      nationalId,
      phone,
      occupation,
      county,
      membershipType,
      email,
    } = data;

    /* ----------------------------------------
       CHECK EMAIL
    ---------------------------------------- */

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    }).session(session);

    if (existingUser) {
      throw new AppError(
        "Email address is already registered.",
        409
      );
    }

    /* ----------------------------------------
       CHECK NATIONAL ID
    ---------------------------------------- */

    const existingNationalId = await Member.findOne({
      nationalId,
    }).session(session);

    if (existingNationalId) {
      throw new AppError(
        "National ID already exists.",
        409
      );
    }

    /* ----------------------------------------
       CHECK PHONE
    ---------------------------------------- */

    const existingPhone = await Member.findOne({
      phone,
    }).session(session);

    if (existingPhone) {
      throw new AppError(
        "Phone number already exists.",
        409
      );
    }

    /* ----------------------------------------
       CREATE USER
    ---------------------------------------- */

    const [user] = await User.create(
      [
        {
          email: email.toLowerCase().trim(),
          password: null,
          role: "member",
          isActive: false,
          emailVerified: false,
        },
      ],
      { session }
    );

    /* ----------------------------------------
       CREATE MEMBER
    ---------------------------------------- */

    const [member] = await Member.create(
      [
        {
          user: user._id,

          accountActivated: false,

          source: "new",

          membershipType,

          membershipStatus: "pending_payment",

          membershipFeePaid: false,

          membershipExpiry: null,

          firstName,
          middleName,
          lastName,

          gender,
          dateOfBirth,

          nationalId,
          phone,

          occupation,

          county,
        },
      ],
      { session }
    );

    /* ----------------------------------------
       CREATE OTP
    ---------------------------------------- */

   const otpResult = await otpService.createOTP({
  user,
  email: user.email,
  purpose: OTP_PURPOSE.ACCOUNT_ACTIVATION,
});

/* ----------------------------------------
   SEND OTP EMAIL
---------------------------------------- */

await emailService.sendOTPEmail({
  email: user.email,
  firstName: member.firstName,
  otp: otpResult.plainOtp,
});


    /* ----------------------------------------
       LOG ACTIVITY
    ---------------------------------------- */

    await logActivity(
      user._id,
      "Registered a new account",
      session
    );

   /* ----------------------------------------
   COMMIT
---------------------------------------- */

await session.commitTransaction();

user.password = undefined;

return {
  email: user.email,
  nextStep: "verify-otp",
  otpId: otpResult.otpRecord._id,
  expiresAt: otpResult.otpRecord.expiresAt,
};


/* ==========================================================
   ACTIVATE IMPORTED MEMBER
========================================================== */

export const activateExistingMember = async (data) => {

  const session = await startTransaction();

  try {

    const {
      phone,
      email,
    } = data;

    /* ----------------------------------------
       FIND IMPORTED MEMBER
    ---------------------------------------- */

    const member = await Member.findOne({
      phone: phone.trim(),
      source: "imported",
    }).session(session);

    if (!member) {

      throw new AppError(
        "No imported membership was found with the provided phone number.",
        404
      );

    }

    /* ----------------------------------------
       ACCOUNT ALREADY ACTIVATED?
    ---------------------------------------- */

    if (member.user || member.accountActivated) {

      throw new AppError(
        "This membership has already been activated.",
        409
      );

    }

    /* ----------------------------------------
       EMAIL ALREADY USED?
    ---------------------------------------- */

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    }).session(session);

    if (existingUser) {

      throw new AppError(
        "Email address is already registered.",
        409
      );

    }

    /* ----------------------------------------
       CREATE USER
    ---------------------------------------- */

    const [user] = await User.create(
      [
        {
          email: email.toLowerCase().trim(),
          password: null,
          role: "member",
          isActive: false,
          emailVerified: false,
        },
      ],
      { session }
    );

    /* ----------------------------------------
       LINK MEMBER ACCOUNT
    ---------------------------------------- */

    member.user = user._id;

    member.accountActivated = false;

    await member.save({ session });

    /* ----------------------------------------
       CREATE OTP
    ---------------------------------------- */

   const otpResult = await otpService.createOTP({

  user,

  email: user.email,

  purpose: OTP_PURPOSE.ACCOUNT_ACTIVATION,

});

/* ----------------------------------------
   SEND OTP EMAIL
---------------------------------------- */

await emailService.sendOTPEmail({

  email: user.email,

  firstName: member.firstName,

  otp: otpResult.plainOtp,

});

    /* ----------------------------------------
       LOG ACTIVITY
    ---------------------------------------- */

    await logActivity(

      user._id,

      "Activated imported membership",

      session

    );

    /* ----------------------------------------
       COMMIT TRANSACTION
    ---------------------------------------- */

    await session.commitTransaction();

  /* ----------------------------------------
   RESPONSE
---------------------------------------- */

return {

  email: user.email,

  nextStep: "verify-otp",

  otpId: otpResult.otpRecord._id,

  expiresAt: otpResult.otpRecord.expiresAt,

};


/* ==========================================================
   VERIFY OTP
========================================================== */

export const verifyOTP = async (data) => {
  const {
    email,
    code,
    purpose,
  } = data;

  /* ----------------------------------------
     VALIDATE PURPOSE
  ---------------------------------------- */

  validateOTPPurpose(purpose);

  /* ----------------------------------------
     FIND USER
  ---------------------------------------- */

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user) {
    throw new AppError(
      "Account not found.",
      404
    );
  }

  /* ----------------------------------------
     VERIFY OTP
  ---------------------------------------- */

  await otpService.verifyOTP({
    user,
    purpose,
    code,
  });

  /* ----------------------------------------
     VERIFY EMAIL
  ---------------------------------------- */

  if (!user.emailVerified) {
    user.emailVerified = true;
    await user.save();
  }

  /* ----------------------------------------
     LOG ACTIVITY
  ---------------------------------------- */

  await logActivity(
    user._id,
    "Verified email address"
  );

  /* ----------------------------------------
     RESPONSE
  ---------------------------------------- */

  return {
    email: user.email,
    verified: true,
    nextStep: "create-password",
  };
};



/* ==========================================================
   CREATE PASSWORD
========================================================== */

export const createPassword = async (data) => {
  const session = await startTransaction();

  try {
    const {
      email,
      password,
    } = data;

    /* ----------------------------------------
       FIND USER
    ---------------------------------------- */

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    })
      .select("+password")
      .session(session);

    if (!user) {
      throw new AppError(
        "Account not found.",
        404
      );
    }

    /* ----------------------------------------
       EMAIL VERIFIED?
    ---------------------------------------- */

    if (!user.emailVerified) {
      throw new AppError(
        "Please verify your email first.",
        400
      );
    }

    /* ----------------------------------------
       PASSWORD ALREADY CREATED?
    ---------------------------------------- */

    if (user.password) {
      throw new AppError(
        "Password has already been created.",
        409
      );
    }

    /* ----------------------------------------
       FIND MEMBER
    ---------------------------------------- */

    const member = await Member.findOne({
      user: user._id,
    }).session(session);

    if (!member) {
      throw new AppError(
        "Member profile not found.",
        404
      );
    }

    /* ----------------------------------------
       HASH PASSWORD
    ---------------------------------------- */

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    user.password = hashedPassword;

    /* ----------------------------------------
       ACTIVATE ACCOUNT
    ---------------------------------------- */

    user.isActive = true;

    /* ----------------------------------------
       ACTIVATE MEMBER
    ---------------------------------------- */

    member.accountActivated = true;

    /* ----------------------------------------
       GENERATE MEMBER NUMBER
    ---------------------------------------- */

    if (!member.memberNumber) {
      member.memberNumber =
        await generateMemberNumber(
          member.county
        );
    }

    /* ----------------------------------------
       SAVE
    ---------------------------------------- */

    await user.save({ session });

    await member.save({ session });

    /* ----------------------------------------
       LOG ACTIVITY
    ---------------------------------------- */

    await logActivity(
      user._id,
      "Created account password",
      session
    );

    /* ----------------------------------------
       COMMIT TRANSACTION
    ---------------------------------------- */

    await session.commitTransaction();

    /* ----------------------------------------
       SEND WELCOME EMAIL
    ---------------------------------------- */

    await emailService.sendWelcomeEmail({
      email: user.email,
      firstName: member.firstName,
    });

    /* ----------------------------------------
       GENERATE TOKEN
    ---------------------------------------- */

    const token = generateToken(user._id);

    user.password = undefined;

    /* ----------------------------------------
       RESPONSE
    ---------------------------------------- */

    return {
      token,
      user,
      member,
    };

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    await session.endSession();

  }
};



/* ==========================================================
   LOGIN
========================================================== */

export const login = async (data) => {

  const {
    identifier,
    password,
  } = data;

  /* ----------------------------------------
     FIND USER
  ---------------------------------------- */

  let user;

  // Login using Email

  if (identifier.includes("@")) {

    user = await User.findOne({
      email: identifier
        .toLowerCase()
        .trim(),
    }).select("+password");

  }

  // Login using Phone Number

  else {

    const member = await Member.findOne({
      phone: identifier.trim(),
    });

    if (!member) {

      throw new AppError(
        "Invalid credentials.",
        401
      );

    }

    user = await User.findById(
      member.user
    ).select("+password");

  }

  if (!user) {

    throw new AppError(
      "Invalid credentials.",
      401
    );

  }

  /* ----------------------------------------
     ACCOUNT LOCKED?
  ---------------------------------------- */

  if (user.accountLocked) {

    throw new AppError(
      "Your account has been locked. Please contact support.",
      403
    );

  }

  /* ----------------------------------------
     ACCOUNT ACTIVE?
  ---------------------------------------- */

  if (!user.isActive) {

    throw new AppError(
      "Please complete account activation.",
      403
    );

  }

  /* ----------------------------------------
     EMAIL VERIFIED?
  ---------------------------------------- */

  if (!user.emailVerified) {

    throw new AppError(
      "Please verify your email address.",
      403
    );

  }

  /* ----------------------------------------
     VERIFY PASSWORD
  ---------------------------------------- */

  const passwordMatches =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!passwordMatches) {

    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= 5) {

      user.accountLocked = true;

    }

    await user.save();

    throw new AppError(
      "Invalid credentials.",
      401
    );

  }

  /* ----------------------------------------
     RESET FAILED ATTEMPTS
  ---------------------------------------- */

  user.failedLoginAttempts = 0;

  user.lastLogin = new Date();

  await user.save();

  /* ----------------------------------------
     MEMBER PROFILE
  ---------------------------------------- */

  const member = await Member.findOne({
    user: user._id,
  });

  /* ----------------------------------------
     ACTIVITY LOG
  ---------------------------------------- */

  await logActivity(
    user._id,
    "Logged into the system"
  );

  /* ----------------------------------------
     JWT
  ---------------------------------------- */

  const token =
    generateToken(user._id);

  user.password = undefined;

  /* ----------------------------------------
     RESPONSE
  ---------------------------------------- */

  return {

    token,

    user,

    member,

  };

};


/* ==========================================================
   FORGOT PASSWORD
========================================================== */

export const forgotPassword = async (data) => {

  const { email } = data;

  /* ----------------------------------------
     FIND USER
  ---------------------------------------- */

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user) {

    throw new AppError(
      "Account not found.",
      404
    );

  }

  /* ----------------------------------------
     ACCOUNT ACTIVE?
  ---------------------------------------- */

  if (!user.isActive) {

    throw new AppError(
      "This account has not been activated.",
      400
    );

  }

  /* ----------------------------------------
     EMAIL VERIFIED?
  ---------------------------------------- */

  if (!user.emailVerified) {

    throw new AppError(
      "Please verify your email first.",
      400
    );

  }

  /* ----------------------------------------
     MEMBER PROFILE
  ---------------------------------------- */

  const member = await Member.findOne({
    user: user._id,
  });

  if (!member) {

    throw new AppError(
      "Member profile not found.",
      404
    );

  }

  /* ----------------------------------------
     GENERATE OTP
  ---------------------------------------- */

  const otpResult = await otpService.createOTP({

  user,

  email: user.email,

  purpose: OTP_PURPOSE.PASSWORD_RESET,

});

/* ----------------------------------------
   SEND EMAIL
---------------------------------------- */

await emailService.sendOTPEmail({

  email: user.email,

  firstName: member.firstName,

  otp: otpResult.plainOtp,

});

/* ----------------------------------------
   LOG ACTIVITY
---------------------------------------- */

await logActivity(

  user._id,

  "Requested password reset"

);

/* ----------------------------------------
   RESPONSE
---------------------------------------- */

return {

  email: user.email,

  nextStep: "reset-password",

  otpId: otpResult.otpRecord._id,

  expiresAt: otpResult.otpRecord.expiresAt,

};


/* ==========================================================
   RESET PASSWORD
========================================================== */

export const resetPassword = async (data) => {

  const {
    email,
    code,
    password,
  } = data;

  const session = await startTransaction();

  try {

    /* ----------------------------------------
       FIND USER
    ---------------------------------------- */

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    })
      .select("+password")
      .session(session);

    if (!user) {

      throw new AppError(
        "Account not found.",
        404
      );

    }

    /* ----------------------------------------
       VERIFY OTP
    ---------------------------------------- */

    await otpService.verifyOTP({

      user,

      purpose: OTP_PURPOSE.PASSWORD_RESET,

      code,

    });

    /* ----------------------------------------
       HASH PASSWORD
    ---------------------------------------- */

    const hashedPassword =
      await hashPassword(password);

    user.password = hashedPassword;

    /* ----------------------------------------
       UNLOCK ACCOUNT
    ---------------------------------------- */

    user.accountLocked = false;

    user.failedLoginAttempts = 0;

    /* ----------------------------------------
       SAVE
    ---------------------------------------- */

    await user.save({ session });

    /* ----------------------------------------
       LOG ACTIVITY
    ---------------------------------------- */

    await logActivity(

      user._id,

      "Reset account password",

      session

    );

    /* ----------------------------------------
       COMMIT
    ---------------------------------------- */

    await session.commitTransaction();

    /* ----------------------------------------
       RESPONSE
    ---------------------------------------- */

    return {

      success: true,

      message:
        "Password reset successfully. Please log in.",

    };

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    await session.endSession();

  }

};


/* ==========================================================
   LOGOUT
========================================================== */

export const logout = async () => {

  return {

    success: true,

    message: "Logged out successfully.",

  };

};
