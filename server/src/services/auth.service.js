import mongoose from "mongoose";
import bcrypt from "bcrypt";

import User from "../models/User.js";
import Member from "../models/Member.js";

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
  generatePasswordSetupToken,
  verifyPasswordSetupToken,
} from "../utils/jwt.js";

import {
  generateMembershipNumber,
} from "../utils/membershipNumber.js";

/* ==========================================================
   OTP PURPOSES
========================================================== */

const OTP_PURPOSE = {
  ACCOUNT_ACTIVATION:
    "ACCOUNT_ACTIVATION",

  PASSWORD_RESET:
    "PASSWORD_RESET",
};

/* ==========================================================
   PASSWORD SETTINGS
========================================================== */

const SALT_ROUNDS = 12;

/* ==========================================================
   START DATABASE TRANSACTION
========================================================== */

const startTransaction = async () => {
  const session =
    await mongoose.startSession();

  session.startTransaction();

  return session;
};

/* ==========================================================
   HASH PASSWORD
========================================================== */

const hashPassword = async (
  password
) => {
  return bcrypt.hash(
    password,
    SALT_ROUNDS
  );
};

/* ==========================================================
   COMPARE PASSWORD
========================================================== */

const comparePassword = async (
  password,
  hash
) => {
  return bcrypt.compare(
    password,
    hash
  );
};

/* ==========================================================
   NORMALIZE PHONE
========================================================== */

const normalizePhone = (
  phone
) => {
  if (!phone) {
    return "";
  }

  let normalized = String(phone)
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/^\+/, "");

  if (
    normalized.startsWith("07") ||
    normalized.startsWith("01")
  ) {
    normalized =
      `254${normalized.slice(1)}`;
  }

  return normalized;
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
      emailVerified:
        user.emailVerified,
    },

    member: {
      id: member._id,

      memberNumber:
        member.memberNumber,

      firstName:
        member.firstName,

      middleName:
        member.middleName,

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

      joinedAt:
        member.joinedAt,

    },
  };
};

/* ==========================================================
   REGISTER NEW MEMBER
========================================================== */

export const register = async (
  data
) => {
  const session =
    await startTransaction();

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

    const normalizedPhone =
      normalizePhone(phone);

    /* ----------------------------------------
       EMAIL EXISTS
    ---------------------------------------- */

    const existingUser =
      await User.findOne({
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
        phone: normalizedPhone,
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

    const [user] =
      await User.create(
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

    const [member] =
      await Member.create(
        [
          {
            user: user._id,

            source: "new",

            accountActivated: false,

            /*
             * Membership number is assigned
             * after password creation.
             */
            memberNumber: null,

            membershipType,

            membershipStatus:
              "pending_payment",

            membershipFeePaid:
              false,

            membershipExpiry:
              null,

            firstName,
            middleName,
            lastName,
            gender,
            dateOfBirth,
            nationalId,
            phone: normalizedPhone,
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
      calculateProfileCompletion(
        member
      );

    await member.save({
      session,
    });

    /* ----------------------------------------
       GENERATE OTP
    ---------------------------------------- */

    const otpResult =
      await otpService.createOTP({
        user,

        email:
          user.email,

        purpose:
          OTP_PURPOSE.ACCOUNT_ACTIVATION,
      });

    /* ----------------------------------------
       SEND OTP EMAIL
    ---------------------------------------- */

    await emailService.sendOTPEmail({
      email: user.email,

      firstName:
        member.firstName,

      otp:
        otpResult.plainOtp,
    });

    /* ----------------------------------------
       LOG ACTIVITY
    ---------------------------------------- */

    await logActivity({
      user: user._id,

      action:
        ACTIVITY.AUTH.REGISTER,

      module:
        ACTIVITY_MODULES.AUTH,

      targetType:
        TARGET_TYPES.MEMBER,

      targetId:
        member._id,

      title:
        "Account Registered",

      description:
        "A new member account was successfully registered.",

      status:
        "success",

      session,
    });

    /* ----------------------------------------
       COMMIT
    ---------------------------------------- */

    await session.commitTransaction();

    return {
      email:
        user.email,

      nextStep:
        "verify-otp",

      otpId:
        otpResult
          .otpRecord
          ._id,

      expiresAt:
        otpResult
          .otpRecord
          .expiresAt,
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
   ACTIVATE IMPORTED MEMBER
   NEW FLOW:
   PHONE + DEFAULT PASSWORD
========================================================== */

export const activateExistingMember =
  async (data) => {
    const {
      phone,
      password,
    } = data;

    const normalizedPhone =
      normalizePhone(phone);

    if (!normalizedPhone) {
      throw new AppError(
        "Phone number is required.",
        400
      );
    }

    if (!password) {
      throw new AppError(
        "Default password is required.",
        400
      );
    }

    const defaultPassword =
      process.env
        .JVP_DEFAULT_MEMBER_PASSWORD;

    if (!defaultPassword) {
      throw new AppError(
        "Imported member activation is not configured.",
        500
      );
    }

    /* ----------------------------------------
       FIND IMPORTED MEMBER
    ---------------------------------------- */

    const member =
      await Member.findOne({
        phone: normalizedPhone,
        source: "imported",
      });

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
        "This membership has already been activated. Please log in using your account credentials.",
        409
      );
    }

    /* ----------------------------------------
       VERIFY DEFAULT PASSWORD
    ---------------------------------------- */

    if (
      password !==
      defaultPassword
    ) {
      throw new AppError(
        "Invalid phone number or default password.",
        401
      );
    }

    /* ----------------------------------------
       GENERATE TEMPORARY SETUP TOKEN
    ---------------------------------------- */

    const setupToken =
      generatePasswordSetupToken(
        member._id.toString()
      );

    return {
      nextStep:
        "create-password",

      setupToken,

      member: {
        id:
          member._id,

        firstName:
          member.firstName,

        middleName:
          member.middleName,

        lastName:
          member.lastName,

        phone:
          member.phone,

        county:
          member.county,

        memberNumber:
          member.memberNumber,
      },
    };
  };

/* ==========================================================
   VERIFY OTP
========================================================== */

export const verifyOTP = async (
  data
) => {
  const session =
    await startTransaction();

  try {
    const {
      email,
      code,
      purpose =
        OTP_PURPOSE.ACCOUNT_ACTIVATION,
    } = data;

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

    const normalizedEmail =
      email.toLowerCase().trim();

    /* ----------------------------------------
       FIND USER
    ---------------------------------------- */

    const user =
      await User.findOne({
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

    const member =
      await Member.findOne({
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
      user.emailVerified =
        true;

      user.isActive =
        true;

      await user.save({
        session,
        validateBeforeSave:
          false,
      });

      /*
       * For new members, OTP verification
       * does not complete membership payment.
       */
      if (
        member.source === "new" &&
        member.membershipStatus !==
          "active"
      ) {
        member.membershipStatus =
          "pending_payment";

        member.membershipFeePaid =
          false;
      }

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
        purpose ===
        OTP_PURPOSE.ACCOUNT_ACTIVATION
          ? "Member successfully verified their account activation OTP."
          : "Member successfully verified their OTP.",

      status:
        "success",

      session,
    });

    await session.commitTransaction();

    /* ----------------------------------------
       WELCOME EMAIL
    ---------------------------------------- */

    if (
      purpose ===
      OTP_PURPOSE.ACCOUNT_ACTIVATION
    ) {
      try {
        await emailService.sendWelcomeEmail(
          {
            email:
              user.email,

            firstName:
              member.firstName,
          }
        );
      } catch (emailError) {
        console.error(
          "Welcome email failed:",
          emailError
        );
      }
    }

    return {
      success: true,

      verified: true,

      nextStep:
        purpose ===
        OTP_PURPOSE.ACCOUNT_ACTIVATION
          ? "create-password"
          : "reset-password",

      user: {
        id:
          user._id,

        email:
          user.email,

        emailVerified:
          user.emailVerified,

        isActive:
          user.isActive,
      },

      member: {
        id:
          member._id,

        accountActivated:
          member.accountActivated,

        membershipStatus:
          member.membershipStatus,

        membershipFeePaid:
          member.membershipFeePaid,
      },
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

export const resendOTP = async (
  data
) => {
  const {
    email,
    purpose =
      OTP_PURPOSE.ACCOUNT_ACTIVATION,
  } = data;

  const normalizedEmail =
    email.toLowerCase().trim();

  const user =
    await User.findOne({
      email: normalizedEmail,
    });

  if (!user) {
    throw new AppError(
      "Account not found.",
      404
    );
  }

  const member =
    await Member.findOne({
      user: user._id,
    });

  if (
    purpose ===
      OTP_PURPOSE.ACCOUNT_ACTIVATION &&
    user.emailVerified
  ) {
    throw new AppError(
      "Your email has already been verified.",
      400
    );
  }

  const otpResult =
    await otpService.createOTP({
      user,

      email:
        user.email,

      purpose,
    });

  if (
    purpose ===
    OTP_PURPOSE.ACCOUNT_ACTIVATION
  ) {
    await emailService.sendOTPEmail({
      email:
        user.email,

      firstName:
        member?.firstName ||
        "Member",

      otp:
        otpResult.plainOtp,
    });
  } else {
    await emailService.sendPasswordResetEmail(
      {
        email:
          user.email,

        firstName:
          member?.firstName ||
          "Member",

        otp:
          otpResult.plainOtp,
      }
    );
  }

  await logActivity({
    user: user._id,

    action:
      ACTIVITY.AUTH.OTP_RESENT,

    module:
      ACTIVITY_MODULES.AUTH,

    targetType:
      TARGET_TYPES.MEMBER,

    targetId:
      member?._id,

    title:
      "OTP Resent",

    description:
      purpose,

    status:
      "success",
  });

  return {
    email:
      user.email,

    otpId:
      otpResult
        .otpRecord
        ._id,

    expiresAt:
      otpResult
        .otpRecord
        .expiresAt,

    nextStep:
      purpose ===
      OTP_PURPOSE.ACCOUNT_ACTIVATION
        ? "verify-otp"
        : "reset-password",
  };
};

/* ==========================================================
   CREATE PASSWORD
   SUPPORTS:
   1. NEW MEMBER OTP FLOW
   2. IMPORTED MEMBER SETUP TOKEN FLOW
========================================================== */

export const createPassword =
  async (data) => {
    const session =
      await startTransaction();

    try {
      const {
        email,
        password,
        setupToken,
      } = data;

      const normalizedEmail =
        email.toLowerCase().trim();

      let member = null;
      let user = null;
      let importedActivation =
        false;

      /* ========================================
         IMPORTED MEMBER FLOW
      ======================================== */

      if (setupToken) {
        let decoded;

        try {
          decoded =
            verifyPasswordSetupToken(
              setupToken
            );
        } catch {
          throw new AppError(
            "Your account setup session has expired or is invalid. Please start the activation process again.",
            401
          );
        }

        member =
          await Member.findById(
            decoded.memberId
          ).session(session);

        if (!member) {
          throw new AppError(
            "Member profile not found.",
            404
          );
        }

        if (
          member.source !==
          "imported"
        ) {
          throw new AppError(
            "Invalid imported member account.",
            400
          );
        }

        if (
          member.accountActivated ||
          member.user
        ) {
          throw new AppError(
            "This membership has already been activated.",
            409
          );
        }

        importedActivation =
          true;
      }

      /* ========================================
         NEW MEMBER FLOW
      ======================================== */

      if (!importedActivation) {
        user =
          await User.findOne({
            email:
              normalizedEmail,
          }).session(session);

        if (!user) {
          throw new AppError(
            "Account not found.",
            404
          );
        }

        if (!user.emailVerified) {
          throw new AppError(
            "Please verify your email before creating a password.",
            400
          );
        }

        if (user.password) {
          throw new AppError(
            "Password has already been created.",
            409
          );
        }

        member =
          await Member.findOne({
            user: user._id,
          }).session(session);

        if (!member) {
          throw new AppError(
            "Member profile not found.",
            404
          );
        }
      }

      /* ========================================
         EMAIL ALREADY IN USE
      ======================================== */

      const existingUser =
        await User.findOne({
          email:
            normalizedEmail,
        }).session(session);

      if (
        existingUser &&
        (
          importedActivation ||
          existingUser._id.toString() !==
            user?._id.toString()
        )
      ) {
        throw new AppError(
          "Email address is already registered.",
          409
        );
      }

      /* ========================================
         IMPORTED MEMBER:
         CREATE USER
      ======================================== */

      if (importedActivation) {
        const [
          createdUser,
        ] =
          await User.create(
            [
              {
                email:
                  normalizedEmail,

                password: null,

                role:
                  "member",

                isActive:
                  true,

                /*
                 * The email is being supplied
                 * as part of account setup.
                 *
                 * Existing authentication requires
                 * emailVerified=true for login.
                 */
                emailVerified:
                  true,
              },
            ],
            { session }
          );

        user =
          createdUser;

        member.user =
          user._id;
      }

      /* ========================================
         HASH PASSWORD
      ======================================== */

      user.password =
        await hashPassword(
          password
        );

      user.isActive =
        true;

      /*
       * Existing new-member OTP flow has
       * already verified the email.
       *
       * Imported flow marks the supplied
       * account email as verified for the
       * current authentication architecture.
       */
      user.emailVerified =
        true;

      /* ========================================
         GENERATE MEMBERSHIP NUMBER
      ======================================== */

      if (!member.memberNumber) {
        member.memberNumber =
          await generateMembershipNumber(
            member.county,
            session
          );
      }

      /* ========================================
         COMPLETE ACCOUNT SETUP
      ======================================== */

      member.accountActivated =
        true;

      if (!member.joinedAt) {
        member.joinedAt =
          new Date();
      }

      /*
       * Imported members are not automatically
       * marked as paid/active here.
       *
       * Their existing membership status is
       * preserved.
       */

      await user.save({
        session,
      });

      await member.save({
        session,
      });

      /* ========================================
         LOG ACTIVITY
      ======================================== */

      await logActivity({
        user:
          user._id,

        action:
          ACTIVITY.AUTH.ACCOUNT_ACTIVATED,

        module:
          ACTIVITY_MODULES.AUTH,

        targetType:
          TARGET_TYPES.MEMBER,

        targetId:
          member._id,

        title:
          importedActivation
            ? "Imported Account Activated"
            : "Account Activated",

        description:
          importedActivation
            ? "Imported member completed account setup, created a password, and received a membership number."
            : "Member completed account activation and created a password.",

        status:
          "success",

        session,
      });

      /* ========================================
         COMMIT
      ======================================== */

      await session.commitTransaction();

      /* ========================================
         WELCOME EMAIL
      ======================================== */

      try {
        await emailService.sendWelcomeEmail(
          {
            email:
              user.email,

            firstName:
              member.firstName,
          }
        );
      } catch (emailError) {
        console.error(
          "Welcome email failed:",
          emailError
        );
      }

      /* ========================================
         AUTO LOGIN
      ======================================== */

      const token =
        generateToken(
          user._id
        );

      return buildAuthResponse(
        user,
        member,
        token
      );
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
   LOGIN
========================================================== */

export const login = async (
  data
) => {
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

  const value =
    identifier.trim();

  let user = null;

  /* ----------------------------------------
     EMAIL LOGIN
  ---------------------------------------- */

  if (
    value.includes("@")
  ) {
    user =
      await User.findOne({
        email:
          value.toLowerCase(),
      }).select(
        "+password"
      );
  } else {
    /* ----------------------------------------
       PHONE LOGIN
       NORMAL USER ACCOUNT
    ---------------------------------------- */

    const normalizedPhone =
      normalizePhone(value);

    const member =
      await Member.findOne({
        phone:
          normalizedPhone,
      });

    if (member?.user) {
      user =
        await User.findById(
          member.user
        ).select(
          "+password"
        );
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

  const passwordMatches =
    await comparePassword(
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

  const member =
    await Member.findOne({
      user:
        user._id,
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

  user.lastLogin =
    new Date();

  await user.save();

  /* ----------------------------------------
     LOG ACTIVITY
  ---------------------------------------- */

  await logActivity({
    user:
      user._id,

    action:
      ACTIVITY.AUTH.LOGIN,

    module:
      ACTIVITY_MODULES.AUTH,

    targetType:
      TARGET_TYPES.USER,

    targetId:
      user._id,

    title:
      "Logged In",

    description:
      "Member logged into JVP Connect.",

    status:
      "success",
  });

  /* ----------------------------------------
     GENERATE TOKEN
  ---------------------------------------- */

  const token =
    generateToken(
      user._id
    );

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

export const forgotPassword =
  async (data) => {
    const {
      email,
    } = data;

    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await User.findOne({
        email:
          normalizedEmail,
      });

    /*
     * SECURITY:
     * Never reveal whether an
     * account exists.
     */

    if (!user) {
      return {
        success: true,

        message:
          "If the account exists, a verification code has been sent.",
      };
    }

    const member =
      await Member.findOne({
        user:
          user._id,
      });

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

    const otpResult =
      await otpService.createOTP({
        user,

        email:
          user.email,

        purpose:
          OTP_PURPOSE.PASSWORD_RESET,
      });

    await emailService.sendPasswordResetEmail(
      {
        email:
          user.email,

        firstName:
          member?.firstName ||
          "Member",

        otp:
          otpResult.plainOtp,
      }
    );

    await logActivity({
      user:
        user._id,

      action:
        ACTIVITY.AUTH
          .PASSWORD_RESET_REQUESTED,

      module:
        ACTIVITY_MODULES.AUTH,

      targetType:
        TARGET_TYPES.USER,

      targetId:
        user._id,

      title:
        "Password Reset Requested",

      description:
        "Password reset OTP was sent.",

      status:
        "success",
    });

    return {
      email:
        user.email,

      otpId:
        otpResult
          .otpRecord
          ._id,

      expiresAt:
        otpResult
          .otpRecord
          .expiresAt,

      nextStep:
        "reset-password",
    };
  };

/* ==========================================================
   RESET PASSWORD
========================================================== */

export const resetPassword =
  async (data) => {
    const session =
      await startTransaction();

    try {
      const {
        email,
        otp,
        password,
      } = data;

      const normalizedEmail =
        email.toLowerCase().trim();

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        }).session(session);

      if (!user) {
        throw new AppError(
          "Account not found.",
          404
        );
      }

      await otpService.verifyOTP({
        user,

        email:
          normalizedEmail,

        otp,

        purpose:
          OTP_PURPOSE.PASSWORD_RESET,
      });

      user.password =
        await hashPassword(
          password
        );

      user.isActive =
        true;

      user.emailVerified =
        true;

      await user.save({
        session,
      });

      const member =
        await Member.findOne({
          user:
            user._id,
        }).session(session);

      if (!member) {
        throw new AppError(
          "Member profile not found.",
          404
        );
      }

      await logActivity({
        user:
          user._id,

        action:
          ACTIVITY.AUTH
            .PASSWORD_RESET,

        module:
          ACTIVITY_MODULES.AUTH,

        targetType:
          TARGET_TYPES.USER,

        targetId:
          user._id,

        title:
          "Password Reset",

        description:
          "Password successfully changed.",

        status:
          "success",

        session,
      });

      await session.commitTransaction();

      const token =
        generateToken(
          user._id
        );

      return buildAuthResponse(
        user,
        member,
        token
      );
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
   LOGOUT
========================================================== */

export const logout = async (
  data = {}
) => {
  const {
    userId,
  } = data;

  if (userId) {
    await logActivity({
      user:
        userId,

      action:
        ACTIVITY.AUTH.LOGOUT,

      module:
        ACTIVITY_MODULES.AUTH,

      targetType:
        TARGET_TYPES.USER,

      targetId:
        userId,

      title:
        "Logged Out",

      description:
        "User logged out of JVP Connect.",

      status:
        "success",
    });
  }

  return {
    success: true,

    message:
      "Logged out successfully.",
  };
};