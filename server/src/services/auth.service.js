import mongoose from "mongoose";
import bcrypt from "bcrypt";

import User from "../models/User.js";
import Member from "../models/Member.js";
import OTP from "../models/OTP.js";

import {
  logActivity,
  ACTIVITY,
  ACTIVITY_MODULES,
  TARGET_TYPES,
} from "../utils/activity.js";

import AppError from "../utils/AppError.js";

import * as otpService from "./otp.service.js";
import * as emailService from "./email.service.js";

import { calculateProfileCompletion } from "../utils/profileCompletion.js";

import {
  generateToken,
  verifyToken,
} from "../utils/jwt.js";

import {
  generateMembershipNumber,
} from "../utils/membershipNumber.js";

import ActivityLog from "../models/ActivityLog.js";

/* ==========================================================
   OTP PURPOSES
========================================================== */

const OTP_PURPOSE = {
  ACCOUNT_ACTIVATION: "ACCOUNT_ACTIVATION",
  PASSWORD_RESET: "PASSWORD_RESET",
};

/* ==========================================================
   PASSWORD SETTINGS
========================================================== */

const SALT_ROUNDS = 12;

/* ==========================================================
   START DATABASE TRANSACTION
========================================================== */

const startTransaction = async () => {

  const session = await mongoose.startSession();

  session.startTransaction();

  return session;

};

/* ==========================================================
   HASH PASSWORD
========================================================== */

const hashPassword = async (password) => {

  return bcrypt.hash(password, SALT_ROUNDS);

};

/* ==========================================================
   COMPARE PASSWORD
========================================================== */

const comparePassword = async (
  password,
  hash
) => {

  return bcrypt.compare(password, hash);

};





/* ==========================================================
   BUILD AUTH RESPONSE
========================================================== */

const buildAuthResponse = (
  user,
  member,
  token
) => {

  return {

    token,

    user: {

      id: user._id,

      email: user.email,

      role: user.role,

      isActive: user.isActive,

      emailVerified: user.emailVerified,

    },

    member: {

      id: member._id,

      memberNumber: member.memberNumber,

      firstName: member.firstName,

      middleName: member.middleName,

      lastName: member.lastName,

      county: member.county,

      membershipType: member.membershipType,

      membershipStatus: member.membershipStatus,

      membershipFeePaid: member.membershipFeePaid,

      profilePhoto: member.profilePhoto,

      joinedAt: member.joinedAt,

    },

  };

};

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
  constituency,
  ward,

  disability,

  membershipType,
  email,
} = data;

    const normalizedEmail =
      email.toLowerCase().trim();

    /* ----------------------------------------
       EMAIL EXISTS
    ---------------------------------------- */

    const existingUser = await User.findOne({
      email: normalizedEmail,
    }).session(session);

    if (existingUser) {

      throw new AppError(
        "Email address is already registered.",
        409
      );

    }

    /* ----------------------------------------
       NATIONAL ID EXISTS
    ---------------------------------------- */

    const existingNationalId =
      await Member.findOne({
        nationalId,
      }).session(session);

    if (existingNationalId) {

      throw new AppError(
        "National ID already exists.",
        409
      );

    }

    /* ----------------------------------------
       PHONE EXISTS
    ---------------------------------------- */

    const existingPhone =
      await Member.findOne({
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
          email: normalizedEmail,
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

          source: "new",

          accountActivated: false,

          membershipNumber: null,

          membershipType,

          membershipStatus:
            "pending_payment",

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
constituency,
ward,

disability,
        },
      ],

      { session }

    );

    /* ----------------------------------------
   PROFILE COMPLETION
---------------------------------------- */

member.profileCompletion =
  calculateProfileCompletion(member);

await member.save({ session });

    /* ----------------------------------------
       GENERATE OTP
    ---------------------------------------- */

    const otpResult =
      await otpService.createOTP({

        user,

        email: user.email,

        purpose:
          OTP_PURPOSE.ACCOUNT_ACTIVATION,

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

    await logActivity({
  user: user._id,

  action: ACTIVITY.AUTH.REGISTER,

  module: ACTIVITY_MODULES.AUTH,

  targetType: TARGET_TYPES.MEMBER,

  targetId: member._id,

  title: "Account Registered",

  description:
    "A new member account was successfully registered.",

  status: "success",

  session,
});

    /* ----------------------------------------
       COMMIT
    ---------------------------------------- */

    await session.commitTransaction();

    return {

      email: user.email,

      nextStep: "verify-otp",

      otpId:
        otpResult.otpRecord._id,

      expiresAt:
        otpResult.otpRecord.expiresAt,

    };

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    await session.endSession();

  }

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

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    const normalizedPhone = phone.trim();

    /* ----------------------------------------
       FIND IMPORTED MEMBER
    ---------------------------------------- */

    const member = await Member.findOne({

      phone: normalizedPhone,

      source: "imported",

    }).session(session);

    if (!member) {

      throw new AppError(

        "No imported member was found with the provided phone number.",

        404

      );

    }

    /* ----------------------------------------
       ALREADY ACTIVATED?
    ---------------------------------------- */

    if (

      member.accountActivated ||

      member.user

    ) {

      throw new AppError(

        "This membership has already been activated.",

        409

      );

    }

    /* ----------------------------------------
       EMAIL ALREADY EXISTS?
    ---------------------------------------- */

    const existingUser = await User.findOne({

      email: normalizedEmail,

    }).session(session);

    if (existingUser) {

      throw new AppError(

        "Email address is already registered.",

        409

      );

    }

    /* ----------------------------------------
       CREATE USER ACCOUNT
    ---------------------------------------- */

    const [user] = await User.create(

      [
        {

          email: normalizedEmail,

          password: null,

          role: "member",

          isActive: false,

          emailVerified: false,

        },
      ],

      { session }

    );

    /* ----------------------------------------
       LINK MEMBER
    ---------------------------------------- */

    member.user = user._id;

    member.accountActivated = false;

    await member.save({ session });

    /* ----------------------------------------
       GENERATE OTP
    ---------------------------------------- */

    const otpResult =
      await otpService.createOTP({

        user,

        email: user.email,

        purpose:
          OTP_PURPOSE.ACCOUNT_ACTIVATION,

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

   await logActivity({
  user: user._id,

  action: ACTIVITY.AUTH.REGISTER,

  module: ACTIVITY_MODULES.AUTH,

  targetType: TARGET_TYPES.MEMBER,

  targetId: member._id,

  title: "Imported Membership Activated",

  description:
    "Imported member successfully activated their account.",

  status: "success",

  session,
});

    /* ----------------------------------------
       COMMIT
    ---------------------------------------- */

    await session.commitTransaction();

    return {

      email: user.email,

      nextStep: "verify-otp",

      otpId:
        otpResult.otpRecord._id,

      expiresAt:
        otpResult.otpRecord.expiresAt,

    };

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    await session.endSession();

  }

};

/* ==========================================================
   VERIFY OTP
========================================================== */

export const verifyOTP = async (data) => {

  const session = await startTransaction();

  try {

    const {
      email,
      code,
      purpose = OTP_PURPOSE.ACCOUNT_ACTIVATION,
    } = data;

    /* ----------------------------------------
       VALIDATE INPUT
    ---------------------------------------- */

    if (!email) {

      throw new AppError(
        "Email address is required.",
        400
      );

    }

    if (!code) {

      throw new AppError(
        "Verification code is required.",
        400
      );

    }

    /* ----------------------------------------
       NORMALIZE EMAIL
    ---------------------------------------- */

    const normalizedEmail =
      email.toLowerCase().trim();

    /* ----------------------------------------
       FIND USER
    ---------------------------------------- */

    const user = await User.findOne({

      email: normalizedEmail,

    }).session(session);

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
       ACCOUNT ACTIVATION
    ---------------------------------------- */

    if (

      purpose ===
      OTP_PURPOSE.ACCOUNT_ACTIVATION

    ) {

      user.emailVerified = true;

      await user.save({

        session,

      });

      member.accountActivated = true;

      await member.save({

        session,

      });

    }

    /* ----------------------------------------
       LOG ACTIVITY
    ---------------------------------------- */

    await logActivity({

      user: user._id,

      action:
        ACTIVITY.AUTH.OTP_VERIFIED,

      module:
        ACTIVITY_MODULES.AUTH,

      targetType:
        TARGET_TYPES.MEMBER,

      targetId:
        member._id,

      title:
        "OTP Verified",

      description:
        "Member successfully verified their OTP.",

      status:
        "success",

      session,

    });

    /* ----------------------------------------
       COMMIT TRANSACTION
    ---------------------------------------- */

    await session.commitTransaction();

    /* ----------------------------------------
       SEND WELCOME EMAIL
       Only after successful commit
    ---------------------------------------- */

    if (

      purpose ===
      OTP_PURPOSE.ACCOUNT_ACTIVATION

    ) {

      await emailService.sendWelcomeEmail({

        email:
          user.email,

        firstName:
          member.firstName,

      });

    }

    /* ----------------------------------------
       RESPONSE
    ---------------------------------------- */

    return {

      success: true,

      verified: true,

      nextStep:

        purpose ===
        OTP_PURPOSE.ACCOUNT_ACTIVATION

          ? "create-password"

          : "reset-password",

    };

  } catch (error) {

    if (

      session.inTransaction()

    ) {

      await session.abortTransaction();

    }

    throw error;

  } finally {

    await session.endSession();

  }

};

/* ==========================================================
   RESEND OTP
========================================================== */

export const resendOTP = async (data) => {

  const {
    email,
    purpose = OTP_PURPOSE.ACCOUNT_ACTIVATION,
  } = data;

  const normalizedEmail = email
    .toLowerCase()
    .trim();

  /* ----------------------------------------
     FIND USER
  ---------------------------------------- */

  const user = await User.findOne({

    email: normalizedEmail,

  });

  if (!user) {

    throw new AppError(

      "Account not found.",

      404

    );

  }

  /* ----------------------------------------
     FIND MEMBER
  ---------------------------------------- */

  const member = await Member.findOne({

    user: user._id,

  });

  /* ----------------------------------------
     ACCOUNT ALREADY VERIFIED?
  ---------------------------------------- */

  if (

    purpose === OTP_PURPOSE.ACCOUNT_ACTIVATION &&

    user.emailVerified

  ) {

    throw new AppError(

      "Your email has already been verified.",

      400

    );

  }

  /* ----------------------------------------
     GENERATE NEW OTP
  ---------------------------------------- */

  const otpResult =
    await otpService.createOTP({

      user,

      email: user.email,

      purpose,

    });

  /* ----------------------------------------
     SEND EMAIL
  ---------------------------------------- */

  if (

    purpose ===
    OTP_PURPOSE.ACCOUNT_ACTIVATION

  ) {

    await emailService.sendOTPEmail({

      email: user.email,

      firstName:
        member?.firstName || "Member",

      otp: otpResult.plainOtp,

    });

  } else {

    await emailService.sendPasswordResetEmail({

      email: user.email,

      firstName:
        member?.firstName || "Member",

      otp: otpResult.plainOtp,

    });

  }

  /* ----------------------------------------
     LOG ACTIVITY
  ---------------------------------------- */

  await logActivity({
  user: user._id,

  action: ACTIVITY.AUTH.OTP_RESENT,

  module: ACTIVITY_MODULES.AUTH,

  targetType: TARGET_TYPES.MEMBER,

  targetId: member._id,

  title: "OTP Resent",

  description: purpose,

  status: "success",
});

  /* ----------------------------------------
     RESPONSE
  ---------------------------------------- */

  return {

    email: user.email,

    otpId:
      otpResult.otpRecord._id,

    expiresAt:
      otpResult.otpRecord.expiresAt,

    nextStep:

      purpose ===
      OTP_PURPOSE.ACCOUNT_ACTIVATION

        ? "verify-otp"

        : "reset-password",

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

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    /* ----------------------------------------
       FIND USER
    ---------------------------------------- */

    const user = await User.findOne({

      email: normalizedEmail,

    }).session(session);

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

        "Please verify your email before creating a password.",

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

    user.password = await hashPassword(password);

    user.isActive = true;

    /* ----------------------------------------
       COMPLETE ACCOUNT SETUP
    ---------------------------------------- */

    member.accountActivated = true;

    if (!member.memberNumber) {

      member.memberNumber =
        await generateMembershipNumber(
          member.county,
          session
        );

    }

    if (!member.joinedAt) {

      member.joinedAt = new Date();

    }

    await user.save({ session });

    await member.save({ session });

    /* ----------------------------------------
       LOG ACTIVITY
    ---------------------------------------- */

    await logActivity({
  user: user._id,

  action: ACTIVITY.AUTH.ACCOUNT_ACTIVATED,

  module: ACTIVITY_MODULES.AUTH,

  targetType: TARGET_TYPES.MEMBER,

  targetId: member._id,

  title: "Account Activated",

  description:
    "Member completed account activation and created a password.",

  status: "success",

  session,
});

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
       AUTO LOGIN
    ---------------------------------------- */

    const token =
  generateToken(user._id);

return buildAuthResponse(
  user,
  member,
  token
);

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

  if (!identifier?.trim()) {

    throw new AppError(
      "Email address or phone number is required.",
      400
    );

  }

  if (!password) {

    throw new AppError(
      "Password is required.",
      400
    );

  }

  const value = identifier.trim();

  let user = null;

  /* ----------------------------------------
     LOGIN USING EMAIL
  ---------------------------------------- */

  if (value.includes("@")) {

   user = await User.findOne({
  email: value.toLowerCase(),
}).select("+password");

  } else {

    /* ----------------------------------------
       LOGIN USING PHONE
    ---------------------------------------- */

    const member = await Member.findOne({
      phone: value,
    });

    if (member) {

     user = await User.findById(
  member.user
).select("+password");

    }

  }

  /* ----------------------------------------
     USER FOUND?
  ---------------------------------------- */

  if (!user) {

    throw new AppError(
      "Invalid email/phone number or password.",
      401
    );

  }

  /* ----------------------------------------
     PASSWORD CREATED?
  ---------------------------------------- */

  if (!user.password) {

    throw new AppError(
      "Please complete account activation first.",
      400
    );

  }

  /* ----------------------------------------
     EMAIL VERIFIED?
  ---------------------------------------- */

  if (!user.emailVerified) {

    throw new AppError(
      "Please verify your email first.",
      403
    );

  }

  /* ----------------------------------------
     ACCOUNT ACTIVE?
  ---------------------------------------- */

  if (!user.isActive) {

    throw new AppError(
      "Your account has been deactivated.",
      403
    );

  }

  /* ----------------------------------------
     VERIFY PASSWORD
  ---------------------------------------- */

  const passwordMatches = await comparePassword(
    password,
    user.password
  );

  if (!passwordMatches) {

    throw new AppError(
      "Invalid email/phone number or password.",
      401
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
     UPDATE LAST LOGIN
  ---------------------------------------- */

  user.lastLogin = new Date();

  await user.save();

  /* ----------------------------------------
     LOG ACTIVITY
  ---------------------------------------- */

 await logActivity({
  user: user._id,

  action: ACTIVITY.AUTH.LOGIN,

  module: ACTIVITY_MODULES.AUTH,

  targetType: TARGET_TYPES.USER,

  targetId: user._id,

  title: "Logged In",

  description:
    "Member logged into JVP Connect.",

  status: "success",
});

  /* ----------------------------------------
     GENERATE TOKEN
  ---------------------------------------- */

  const token = generateToken(user._id);

  /* ----------------------------------------
     RESPONSE
  ---------------------------------------- */

  return buildAuthResponse(
    user,
    member,
    token
  );

};


/* ==========================================================
   FORGOT PASSWORD
========================================================== */

export const forgotPassword = async (data) => {

  const { email } = data;

  const normalizedEmail = email
    .toLowerCase()
    .trim();

  /* ----------------------------------------
     FIND USER
  ---------------------------------------- */

  const user = await User.findOne({

    email: normalizedEmail,

  });

  /*
     SECURITY:
     Never reveal whether an account exists.
  */

  if (!user) {

    return {

      success: true,

      message:
        "If the account exists, a verification code has been sent.",

    };

  }

  /* ----------------------------------------
     FIND MEMBER
  ---------------------------------------- */

  const member = await Member.findOne({

    user: user._id,

  });

  /* ----------------------------------------
     ACCOUNT READY?
  ---------------------------------------- */

  if (!user.password) {

    throw new AppError(

      "Please complete account activation first.",

      400

    );

  }

  if (!user.emailVerified) {

    throw new AppError(

      "Email address has not been verified.",

      400

    );

  }

  /* ----------------------------------------
     CREATE PASSWORD RESET OTP
  ---------------------------------------- */

  const otpResult =
    await otpService.createOTP({

      user,

      email: user.email,

      purpose:
        OTP_PURPOSE.PASSWORD_RESET,

    });

  /* ----------------------------------------
     SEND EMAIL
  ---------------------------------------- */

  await emailService.sendPasswordResetEmail({

    email: user.email,

    firstName:
      member?.firstName || "Member",

    otp: otpResult.plainOtp,

  });

  /* ----------------------------------------
     LOG ACTIVITY
  ---------------------------------------- */

  await logActivity({
  user: user._id,

  action: ACTIVITY.AUTH.PASSWORD_RESET_REQUESTED,

  module: ACTIVITY_MODULES.AUTH,

  targetType: TARGET_TYPES.USER,

  targetId: user._id,

  title: "Password Reset Requested",

  description:
    "Password reset OTP was sent.",

  status: "success",
});

  /* ----------------------------------------
     RESPONSE
  ---------------------------------------- */

  return {

    email: user.email,

    otpId:
      otpResult.otpRecord._id,

    expiresAt:
      otpResult.otpRecord.expiresAt,

    nextStep: "reset-password",

  };

};

/* ==========================================================
   RESET PASSWORD
========================================================== */

export const resetPassword = async (data) => {

  const session = await startTransaction();

  try {

    const {
      email,
      otp,
      password,
    } = data;

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    /* ----------------------------------------
       FIND USER
    ---------------------------------------- */

    const user = await User.findOne({

      email: normalizedEmail,

    }).session(session);

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

      email: normalizedEmail,

      otp,

      purpose: OTP_PURPOSE.PASSWORD_RESET,

    });

    /* ----------------------------------------
       UPDATE PASSWORD
    ---------------------------------------- */

    user.password =
      await hashPassword(password);

    user.isActive = true;

    await user.save({ session });

  

    /* ----------------------------------------
       MEMBER PROFILE
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
       LOG ACTIVITY
    ---------------------------------------- */

   await logActivity({
  user: user._id,

  action: ACTIVITY.AUTH.PASSWORD_RESET,

  module: ACTIVITY_MODULES.AUTH,

  targetType: TARGET_TYPES.USER,

  targetId: user._id,

  title: "Password Reset",

  description:
    "Password successfully changed.",

  status: "success",

  session,
});

    /* ----------------------------------------
       COMMIT
    ---------------------------------------- */

    await session.commitTransaction();

    /* ----------------------------------------
       AUTO LOGIN
    ---------------------------------------- */

   const token =
  generateToken(user);

return buildAuthResponse(
  user,
  member,
  token
);

    /* ----------------------------------------
       RESPONSE
    ---------------------------------------- */

    return {

      token: accessToken,

      refreshToken,

      user: {

        id: user._id,

        email: user.email,

        role: user.role,

        isActive: user.isActive,

        emailVerified:
          user.emailVerified,

      },

      member: {

        id: member._id,

        membershipNumber:
          member.membershipNumber,

        firstName:
          member.firstName,

        lastName:
          member.lastName,

        county:
          member.county,

        membershipType:
          member.membershipType,

        membershipStatus:
          member.membershipStatus,

        membershipFeePaid:
          member.membershipFeePaid,

        profilePhoto:
          member.profilePhoto,

      },

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

export const logout = async (data = {}) => {

  const { userId } = data;

  if (userId) {

    await logActivity({
  user: userId,

  action: ACTIVITY.AUTH.LOGOUT, 

  module: ACTIVITY_MODULES.AUTH,

  targetType: TARGET_TYPES.USER,

  targetId: userId,

  title: "Logged Out",

  description:
    "User logged out of JVP Connect.",

  status: "success",
});
  }

  return {

    success: true,

    message: "Logged out successfully.",

  };

};