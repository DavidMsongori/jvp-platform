import crypto from "crypto";

import OTP from "../models/OTP.js";

/**
 * ==========================================================
 * OTP CONFIGURATION
 * ==========================================================
 */

const OTP_CONFIG = {

    EMAIL_VERIFICATION: {

        length: 6,

        expiresInMinutes: 10,

        maxAttempts: 5

    },

    ACCOUNT_ACTIVATION: {

        length: 6,

        expiresInMinutes: 10,

        maxAttempts: 5

    },

    PASSWORD_RESET: {

        length: 6,

        expiresInMinutes: 10,

        maxAttempts: 5

    },

    LOGIN: {

        length: 6,

        expiresInMinutes: 5,

        maxAttempts: 5

    },

    CHANGE_EMAIL: {

        length: 6,

        expiresInMinutes: 10,

        maxAttempts: 5

    },

    CHANGE_PHONE: {

        length: 6,

        expiresInMinutes: 10,

        maxAttempts: 5

    }

};



/* ==========================================================
   PRIVATE HELPERS
========================================================== */

/**
 * Generate a cryptographically secure numeric OTP.
 */

function generateNumericOTP(length) {

    let otp = "";

    while (otp.length < length) {

        otp += crypto.randomInt(0, 10).toString();

    }

    return otp.substring(0, length);

}



/**
 * Generate an alphanumeric OTP.
 *
 * Reserved for future high-security operations.
 */

function generateAlphaNumericOTP(length) {

    const characters =

        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let otp = "";

    while (otp.length < length) {

        const index = crypto.randomInt(

            0,

            characters.length

        );

        otp += characters[index];

    }

    return otp;

}



/**
 * Generate OTP based on purpose.
 */

function generateOTP(purpose) {

    const config = OTP_CONFIG[purpose];

    if (!config) {

        throw new Error(

            `Unsupported OTP purpose: ${purpose}`

        );

    }

    return generateNumericOTP(

        config.length

    );

}



/**
 * Calculate OTP expiration date.
 */

function getExpiryDate(purpose) {

    const config = OTP_CONFIG[purpose];

    if (!config) {

        throw new Error(

            `Unsupported OTP purpose: ${purpose}`

        );

    }

    const expiresAt = new Date();

    expiresAt.setMinutes(

        expiresAt.getMinutes() +

        config.expiresInMinutes

    );

    return expiresAt;

}



/**
 * Return OTP configuration.
 */

function getOTPConfig(purpose) {

    const config = OTP_CONFIG[purpose];

    if (!config) {

        throw new Error(

            `Unsupported OTP purpose: ${purpose}`

        );

    }

    return config;

}



/**
 * Delete any previous active OTPs for the same
 * user and purpose.
 */

async function invalidatePreviousOTPs(

    userId,

    purpose

) {

    await OTP.deleteMany({

        user: userId,

        purpose,

        used: false

    });

}
/* ==========================================================
   CREATE OTP
========================================================== */

/**
 * Check whether the user has exceeded the OTP request limit.
 *
 * Default policy:
 * - Maximum 3 OTP requests
 * - Within 15 minutes
 */

async function checkRateLimit(userId, purpose) {

    const fifteenMinutesAgo = new Date(
        Date.now() - (15 * 60 * 1000)
    );

    const requests = await OTP.countDocuments({

        user: userId,

        purpose,

        createdAt: {

            $gte: fifteenMinutesAgo

        }

    });

    if (requests >= 3) {

        throw new Error(

            "Too many OTP requests. Please wait a few minutes before requesting another code."

        );

    }

}



/**
 * Create a new OTP.
 */

export async function createOTP({

    user,

    email,

    purpose

}) {

    if (!user) {

        throw new Error("User is required.");

    }

    if (!email) {

        throw new Error("Email is required.");

    }

    if (!purpose) {

        throw new Error("OTP purpose is required.");

    }

    // ----------------------------------------
    // Validate Purpose
    // ----------------------------------------

    const config = getOTPConfig(purpose);

    // ----------------------------------------
    // Rate Limiting
    // ----------------------------------------

    await checkRateLimit(

        user._id,

        purpose

    );

    // ----------------------------------------
    // Remove previous OTPs
    // ----------------------------------------

    await invalidatePreviousOTPs(

        user._id,

        purpose

    );

    // ----------------------------------------
    // Generate OTP
    // ----------------------------------------

    const otp = generateOTP(

        purpose

    );

    // ----------------------------------------
    // Create OTP Record
    // ----------------------------------------

    const otpRecord = await OTP.create({

        user: user._id,

        email,

        code: otp,

        purpose,

        attempts: 0,

        maxAttempts: config.maxAttempts,

        expiresAt: getExpiryDate(purpose)

    });

  /* ----------------------------------------
   DEVELOPMENT ONLY
---------------------------------------- */

if (process.env.NODE_ENV === "development") {

    console.log("\n========================================");
    console.log("🔐 DEVELOPMENT OTP");
    console.log("Email   :", email);
    console.log("Purpose :", purpose);
    console.log("OTP     :", otp);
    console.log("========================================\n");

}

/* ----------------------------------------
   RETURN
---------------------------------------- */

return {

    otpRecord,

    plainOtp: otp,

};
}

/* ==========================================================
   VERIFY OTP
========================================================== */

/**
 * Verify an OTP.
 */

export async function verifyOTP({

    user,

    purpose,

    code

}) {

    if (!user) {

        throw new Error("User is required.");

    }

    if (!purpose) {

        throw new Error("OTP purpose is required.");

    }

    if (!code) {

        throw new Error("OTP code is required.");

    }

    // ----------------------------------------
    // Find latest OTP
    // ----------------------------------------

    const otp = await OTP.findOne({

        user: user._id,

        purpose,

        used: false

    })

    .select("+code")

    .sort({

        createdAt: -1

    });

    if (!otp) {

        throw new Error(

            "No active OTP found."

        );

    }

    // ----------------------------------------
    // Check if already expired
    // ----------------------------------------

    if (otp.isExpired()) {

        await otp.deleteOne();

        throw new Error(

            "OTP has expired."

        );

    }

    // ----------------------------------------
    // Check maximum attempts
    // ----------------------------------------

    if (otp.attempts >= otp.maxAttempts) {

        await otp.deleteOne();

        throw new Error(

            "Maximum verification attempts exceeded."

        );

    }

    // ----------------------------------------
    // Compare OTP
    // ----------------------------------------

    const valid = await otp.compareCode(code);

    if (!valid) {

        otp.attempts += 1;

        await otp.save();

        throw new Error(

            "Invalid OTP."

        );

    }

    // ----------------------------------------
    // Mark as used
    // ----------------------------------------

    otp.used = true;

    await otp.save();

    return {

        success: true,

        message: "OTP verified successfully."

    };

}
/* ==========================================================
   RESEND OTP
========================================================== */

/**
 * Resend an OTP.
 *
 * This automatically invalidates any existing
 * active OTP before creating a new one.
 */

export async function resendOTP({

    user,

    email,

    purpose

}) {

    return await createOTP({

        user,

        email,

        purpose

    });

}



/* ==========================================================
   INVALIDATE OTP
========================================================== */

/**
 * Invalidate all active OTPs for a user/purpose.
 */

export async function invalidateOTP({

    user,

    purpose

}) {

    if (!user) {

        throw new Error("User is required.");

    }

    if (!purpose) {

        throw new Error("OTP purpose is required.");

    }

    await OTP.deleteMany({

        user: user._id,

        purpose,

        used: false

    });

}



/* ==========================================================
   DELETE OTP
========================================================== */

/**
 * Delete a specific OTP by ID.
 */

export async function deleteOTP(

    otpId

) {

    if (!otpId) {

        throw new Error(

            "OTP ID is required."

        );

    }

    await OTP.findByIdAndDelete(

        otpId

    );

}



/* ==========================================================
   CLEANUP EXPIRED OTPS
========================================================== */

/**
 * Manual cleanup.
 *
 * MongoDB TTL already removes expired OTPs,
 * but this function can be called from scripts
 * or tests if needed.
 */

export async function cleanupExpiredOTPs() {

    const result = await OTP.deleteMany({

        expiresAt: {

            $lte: new Date()

        }

    });

    return result.deletedCount;

}



/* ==========================================================
   EXPORT DEFAULT
========================================================== */

export default {

    createOTP,

    verifyOTP,

    resendOTP,

    invalidateOTP,

    deleteOTP,

    cleanupExpiredOTPs

};
