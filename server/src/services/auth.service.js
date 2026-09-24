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

    /* ----------------------------------------
       REQUIRED INPUT CHECKS
    ---------------------------------------- */

    if (!firstName?.trim()) {
      throw new AppError(
        400,
        "First name is required."
      );
    }

    if (!lastName?.trim()) {
      throw new AppError(
        400,
        "Last name is required."
      );
    }

    if (!dateOfBirth) {
      throw new AppError(
        400,
        "Date of birth is required."
      );
    }

    if (!nationalId?.trim()) {
      throw new AppError(
        400,
        "National ID is required."
      );
    }

    if (!phone?.trim()) {
      throw new AppError(
        400,
        "Phone number is required."
      );
    }

    if (!county) {
      throw new AppError(
        400,
        "County is required."
      );
    }

    if (!constituency?.trim()) {
      throw new AppError(
        400,
        "Constituency is required."
      );
    }

    if (!ward?.trim()) {
      throw new AppError(
        400,
        "Ward is required."
      );
    }

    if (!membershipType) {
      throw new AppError(
        400,
        "Membership type is required."
      );
    }

    if (!email?.trim()) {
      throw new AppError(
        400,
        "Email address is required."
      );
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const normalizedPhone =
      normalizePhone(phone);

    const normalizedNationalId =
      String(nationalId).trim();

    /* ----------------------------------------
       EMAIL EXISTS
    ---------------------------------------- */

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      }).session(session);

    if (existingUser) {
      throw new AppError(
        409,
        "Email address is already registered."
      );
    }

    /* ----------------------------------------
       NATIONAL ID EXISTS
    ---------------------------------------- */

    const existingNationalId =
      await Member.findOne({
        nationalId:
          normalizedNationalId,
      }).session(session);

    if (existingNationalId) {
      throw new AppError(
        409,
        "National ID is already registered."
      );
    }

    /* ----------------------------------------
       PHONE EXISTS
    ---------------------------------------- */

    const existingPhone =
      await Member.findOne({
        phone:
          normalizedPhone,
      }).session(session);

    if (existingPhone) {
      throw new AppError(
        409,
        "Phone number is already registered."
      );
    }

    /* ----------------------------------------
       CREATE USER
    ---------------------------------------- */

    const [user] =
      await User.create(
        [
          {
            email:
              normalizedEmail,

            password:
              null,

            role:
              "member",

            isActive:
              false,

            emailVerified:
              false,
          },
        ],
        {
          session,
        }
      );

    /* ----------------------------------------
       CREATE MEMBER
    ---------------------------------------- */

    const [member] =
      await Member.create(
        [
          {
            user:
              user._id,

            source:
              "new",

            accountActivated:
              false,

            membershipType,

            membershipStatus:
              "pending_payment",

            membershipFeePaid:
              false,

            membershipExpiry:
              null,

            firstName:
              firstName.trim(),

            middleName:
              middleName?.trim() || "",

            lastName:
              lastName.trim(),

            gender,

            dateOfBirth,

            nationalId:
              normalizedNationalId,

            phone:
              normalizedPhone,

            occupation:
              occupation?.trim() || "",

            county,

            constituency:
              constituency.trim(),

            ward:
              ward.trim(),

            disability,
          },
        ],
        {
          session,
        }
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
      email:
        user.email,

      firstName:
        member.firstName,

      otp:
        otpResult.plainOtp,
    });

    /* ----------------------------------------
       LOG ACTIVITY
    ---------------------------------------- */

    await logActivity({
      user:
        user._id,

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

    /* ========================================
       MONGODB DUPLICATE KEY
    ======================================== */

    if (error?.code === 11000) {
      const duplicateField =
        Object.keys(
          error.keyPattern || {}
        )[0] ||
        Object.keys(
          error.keyValue || {}
        )[0];

      const duplicateMessages = {
        email:
          "Email address is already registered.",

        phone:
          "Phone number is already registered.",

        nationalId:
          "National ID is already registered.",

        memberNumber:
          "Membership number is already registered.",
      };

      throw new AppError(
        409,
        duplicateMessages[
          duplicateField
        ] ||
          "Some of the information provided is already registered."
      );
    }

    /* ========================================
       MONGOOSE VALIDATION ERROR
    ======================================== */

    if (
      error?.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors
        )
          .map(
            (validationError) =>
              validationError.message
          )
          .filter(Boolean);

      throw new AppError(
        400,
        messages.length
          ? messages.join(", ")
          : "Please check the information provided."
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

/* ==========================================================
   ACTIVATE IMPORTED MEMBER
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
        400,
        "Phone number is required."
      );
    }

    if (!password) {
      throw new AppError(
        400,
        "Default password is required."
      );
    }

    const defaultPassword =
      process.env
        .JVP_DEFAULT_MEMBER_PASSWORD;

    if (!defaultPassword) {
      throw new AppError(
        500,
        "Imported member activation is not configured."
      );
    }

    /* ----------------------------------------
       FIND IMPORTED MEMBER
    ---------------------------------------- */

    const member =
      await Member.findOne({
        phone:
          normalizedPhone,

        source:
          "imported",
      });

    if (!member) {
      throw new AppError(
        404,
        "No imported member was found with the provided phone number."
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
        409,
        "This membership has already been activated. Please log in using your account credentials."
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
        401,
        "Invalid phone number or default password."
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

    if (!email?.trim()) {
      throw new AppError(
        400,
        "Email address is required."
      );
    }

    if (!code) {
      throw new AppError(
        400,
        "Verification code is required."
      );
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    /* ----------------------------------------
       FIND USER
    ---------------------------------------- */

    const user =
      await User.findOne({
        email:
          normalizedEmail,
      }).session(session);

    if (!user) {
      throw new AppError(
        404,
        "Account not found."
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
        user:
          user._id,
      }).session(session);

    if (!member) {
      throw new AppError(
        404,
        "Member profile not found."
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
       * OTP verification does not assign
       * membership number or complete payment.
       */

      if (
        member.source ===
          "new" &&
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
      user:
        user._id,

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
      success:
        true,

      verified:
        true,

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

  if (!email?.trim()) {
    throw new AppError(
      400,
      "Email address is required."
    );
  }

  const normalizedEmail =
    email.toLowerCase().trim();

  const user =
    await User.findOne({
      email:
        normalizedEmail,
    });

  if (!user) {
    throw new AppError(
      404,
      "Account not found."
    );
  }

  const member =
    await Member.findOne({
      user:
        user._id,
    });

  if (
    purpose ===
      OTP_PURPOSE.ACCOUNT_ACTIVATION &&
    user.emailVerified
  ) {
    throw new AppError(
      400,
      "Your email has already been verified."
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
    user:
      user._id,

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
    const {
      email,
      password,
      setupToken,
    } = data;

    if (!email?.trim()) {
      throw new AppError(
        400,
        "Email address is required."
      );
    }

    if (!password) {
      throw new AppError(
        400,
        "Password is required."
      );
    }

    if (password.length < 8) {
      throw new AppError(
        400,
        "Password must be at least 8 characters long."
      );
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    /*
     * We allow a small number of complete transaction
     * retries if MongoDB reports a membership-number
     * duplicate.
     *
     * This is important because the membership number
     * is protected by a unique MongoDB index.
     */

    const MAX_ATTEMPTS = 3;

    for (
      let attempt = 1;
      attempt <= MAX_ATTEMPTS;
      attempt++
    ) {
      const session =
        await startTransaction();

      try {
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
              401,
              "Your account setup session has expired or is invalid. Please start the activation process again."
            );
          }

          member =
            await Member.findById(
              decoded.memberId
            ).session(session);

          if (!member) {
            throw new AppError(
              404,
              "Member profile not found."
            );
          }

          if (
            member.source !==
            "imported"
          ) {
            throw new AppError(
              400,
              "Invalid imported member account."
            );
          }

          if (
            member.accountActivated ||
            member.user
          ) {
            throw new AppError(
              409,
              "This membership has already been activated."
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
              404,
              "Account not found."
            );
          }

          if (!user.emailVerified) {
            throw new AppError(
              400,
              "Please verify your email before creating a password."
            );
          }

          if (user.password) {
            throw new AppError(
              409,
              "Password has already been created."
            );
          }

          member =
            await Member.findOne({
              user:
                user._id,
            }).session(session);

          if (!member) {
            throw new AppError(
              404,
              "Member profile not found."
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
            409,
            "Email address is already registered."
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

                  password:
                    null,

                  role:
                    "member",

                  isActive:
                    true,

                  emailVerified:
                    true,
                },
              ],
              {
                session,
              }
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

        user.emailVerified =
          true;

        /* ========================================
           GENERATE MEMBERSHIP NUMBER
        ======================================== */

        if (
          !member.memberNumber
        ) {
          member.memberNumber =
            await generateMembershipNumber(
              member.county,
              session
            );
        }

        /*
         * HARD SAFETY CHECK
         *
         * An activated account must NEVER be saved
         * without a membership number.
         */

        if (
          !member.memberNumber
        ) {
          throw new AppError(
            500,
            "Unable to assign a membership number. Your account has not been activated. Please try again."
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

        /* ========================================
           SAVE USER + MEMBER
        ======================================== */

        await user.save({
          session,
        });

        await member.save({
          session,
        });

        /*
         * Final invariant check before commit.
         */

        if (
          !member.accountActivated ||
          !member.memberNumber
        ) {
          throw new AppError(
            500,
            "Account activation could not be completed because a membership number was not assigned."
          );
        }

        /* ========================================
           LOG ACTIVITY
        ======================================== */

        await logActivity({
          user:
            user._id,

          action:
            ACTIVITY.AUTH
              .ACCOUNT_ACTIVATED,

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
              : "Member completed account activation, created a password, and received a membership number.",

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

        /*
         * If the membership-number unique index
         * reports a collision, retry the complete
         * transaction.
         *
         * The previous transaction has already been
         * aborted, so the counter increment is also
         * rolled back.
         */

        if (
          error?.code === 11000
        ) {
          const duplicateField =
            Object.keys(
              error.keyPattern || {}
            )[0] ||
            Object.keys(
              error.keyValue || {}
            )[0];

          if (
            duplicateField ===
            "memberNumber"
          ) {
            if (
              attempt <
              MAX_ATTEMPTS
            ) {
              continue;
            }

            throw new AppError(
              409,
              "We could not assign a unique membership number at this time. Please try again."
            );
          }

          if (
            duplicateField ===
            "email"
          ) {
            throw new AppError(
              409,
              "Email address is already registered."
            );
          }

          if (
            duplicateField ===
            "phone"
          ) {
            throw new AppError(
              409,
              "Phone number is already registered."
            );
          }

          if (
            duplicateField ===
            "nationalId"
          ) {
            throw new AppError(
              409,
              "National ID is already registered."
            );
          }

          throw new AppError(
            409,
            "Some of the information provided is already registered."
          );
        }

        if (
          error?.name ===
          "ValidationError"
        ) {
          const messages =
            Object.values(
              error.errors
            )
              .map(
                (validationError) =>
                  validationError.message
              )
              .filter(Boolean);

          throw new AppError(
            400,
            messages.length
              ? messages.join(", ")
              : "Please check the information provided."
          );
        }

        throw error;
      } finally {
        await session.endSession();
      }
    }

    /*
     * This point should never normally be reached.
     */
    throw new AppError(
      500,
      "Unable to complete account activation. Please try again."
    );
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
      400,
      "Email address or phone number is required."
    );
  }

  if (!password) {
    throw new AppError(
      400,
      "Password is required."
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
      401,
      "Invalid email/phone number or password."
    );
  }

  /* ----------------------------------------
     PASSWORD CREATED?
  ---------------------------------------- */

  if (!user.password) {
    throw new AppError(
      400,
      "Please complete account activation first."
    );
  }

  /* ----------------------------------------
     EMAIL VERIFIED?
  ---------------------------------------- */

  if (!user.emailVerified) {
    throw new AppError(
      403,
      "Please verify your email first."
    );
  }

  /* ----------------------------------------
     ACCOUNT ACTIVE?
  ---------------------------------------- */

  if (!user.isActive) {
    throw new AppError(
      403,
      "Your account has been deactivated."
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
      401,
      "Invalid email/phone number or password."
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
      404,
      "Member profile not found."
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

    if (!email?.trim()) {
      throw new AppError(
        400,
        "Email address is required."
      );
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await User.findOne({
        email:
          normalizedEmail,
      });

    /*
     * SECURITY:
     * Never reveal whether an account exists.
     */

    if (!user) {
      return {
        success:
          true,

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
        400,
        "Please complete account activation first."
      );
    }

    if (!user.emailVerified) {
      throw new AppError(
        400,
        "Email address has not been verified."
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

      if (!email?.trim()) {
        throw new AppError(
          400,
          "Email address is required."
        );
      }

      if (!otp) {
        throw new AppError(
          400,
          "Verification code is required."
        );
      }

      if (!password) {
        throw new AppError(
          400,
          "Password is required."
        );
      }

      if (password.length < 8) {
        throw new AppError(
          400,
          "Password must be at least 8 characters long."
        );
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        }).session(session);

      if (!user) {
        throw new AppError(
          404,
          "Account not found."
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
          404,
          "Member profile not found."
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
   REPAIR MISSING MEMBERSHIP NUMBERS
   ADMIN / MAINTENANCE FUNCTION
========================================================== */

export const repairMissingMembershipNumbers =
  async () => {
    const members =
      await Member.find({
        accountActivated:
          true,

        $or: [
          {
            memberNumber: {
              $exists: false,
            },
          },

          {
            memberNumber:
              null,
          },

          {
            memberNumber:
              "",
          },
        ],
      }).sort({
        createdAt:
          1,
      });

    const repaired = [];
    const skipped = [];
    const failed = [];

    for (const member of members) {
      const session =
        await startTransaction();

      try {
        /*
         * Re-read the member inside the transaction
         * so that another admin process cannot cause
         * us to overwrite a number that was just assigned.
         */

        const currentMember =
          await Member.findById(
            member._id
          ).session(session);

        if (!currentMember) {
          skipped.push({
            memberId:
              member._id,

            reason:
              "Member no longer exists.",
          });

          await session.abortTransaction();

          continue;
        }

        if (
          currentMember.memberNumber
        ) {
          skipped.push({
            memberId:
              currentMember._id,

            memberNumber:
              currentMember.memberNumber,

            reason:
              "Membership number already assigned.",
          });

          await session.abortTransaction();

          continue;
        }

        if (
          !currentMember.accountActivated
        ) {
          skipped.push({
            memberId:
              currentMember._id,

            reason:
              "Member account is not activated.",
          });

          await session.abortTransaction();

          continue;
        }

        /* ----------------------------------------
           GENERATE NUMBER
        ---------------------------------------- */

        const memberNumber =
          await generateMembershipNumber(
            currentMember.county,
            session
          );

        if (!memberNumber) {
          throw new Error(
            "Membership number generation failed."
          );
        }

        /* ----------------------------------------
           ASSIGN NUMBER
        ---------------------------------------- */

        currentMember.memberNumber =
          memberNumber;

        await currentMember.save({
          session,
        });

        /*
         * Final safety check.
         */

        if (
          !currentMember.memberNumber
        ) {
          throw new Error(
            "Membership number was not saved."
          );
        }

        await session.commitTransaction();

        repaired.push({
          memberId:
            currentMember._id,

          name:
            `${currentMember.firstName} ${currentMember.lastName}`,

          county:
            currentMember.county,

          memberNumber,
        });
      } catch (error) {
        if (
          session.inTransaction()
        ) {
          await session.abortTransaction();
        }

        /*
         * A duplicate memberNumber should normally
         * be prevented by generateMembershipNumber().
         *
         * If it nevertheless happens, report it rather
         * than overwriting an existing member number.
         */

        failed.push({
          memberId:
            member._id,

          name:
            `${member.firstName} ${member.lastName}`,

          county:
            member.county,

          error:
            error?.message ||
            "Unable to assign membership number.",
        });
      } finally {
        await session.endSession();
      }
    }

    return {
      success:
        true,

      totalFound:
        members.length,

      repairedCount:
        repaired.length,

      skippedCount:
        skipped.length,

      failedCount:
        failed.length,

      repaired,

      skipped,

      failed,
    };
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
    success:
      true,

    message:
      "Logged out successfully.",
  };
};