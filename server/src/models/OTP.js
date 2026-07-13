import mongoose from "mongoose";
import bcrypt from "bcrypt";

/* ==========================================================
   OTP SCHEMA
========================================================== */

const otpSchema = new mongoose.Schema(
  {
    /* ==========================================
       USER
    ========================================== */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ==========================================
       EMAIL
    ========================================== */

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    /* ==========================================
       OTP CODE
    ========================================== */

    code: {
      type: String,
      required: true,
      select: false,
    },

    /* ==========================================
       PURPOSE
    ========================================== */

    purpose: {
      type: String,
      required: true,
      enum: [
        "EMAIL_VERIFICATION",
        "ACCOUNT_ACTIVATION",
        "PASSWORD_RESET",
        "LOGIN",
        "CHANGE_EMAIL",
        "CHANGE_PHONE",
      ],
    },

    /* ==========================================
       SECURITY
    ========================================== */

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
    },

    used: {
      type: Boolean,
      default: false,
    },

    /* ==========================================
       EXPIRY
    ========================================== */

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ==========================================================
   TTL INDEX
   Automatically deletes expired OTPs
========================================================== */

otpSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

/* ==========================================================
   LOOKUP INDEX
========================================================== */

otpSchema.index({
  email: 1,
  purpose: 1,
  used: 1,
});


/* ==========================================================
   HASH OTP BEFORE SAVE
========================================================== */

otpSchema.pre("save", async function () {
  if (!this.isModified("code")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);

  this.code = await bcrypt.hash(
    this.code,
    salt
  );
});

/* ==========================================================
   COMPARE OTP
========================================================== */

otpSchema.methods.compareCode = async function (
  plainCode
) {
  return bcrypt.compare(
    plainCode,
    this.code
  );
};

/* ==========================================================
   MARK OTP AS USED
========================================================== */

otpSchema.methods.markAsUsed =
  async function () {
    this.used = true;
    await this.save();
  };

/* ==========================================================
   INCREMENT FAILED ATTEMPTS
========================================================== */

otpSchema.methods.incrementAttempts =
  async function () {
    this.attempts += 1;
    await this.save();
  };

/* ==========================================================
   CHECK EXPIRY
========================================================== */

otpSchema.methods.isExpired =
  function () {
    return this.expiresAt <= new Date();
  };

/* ==========================================================
   CHECK MAX ATTEMPTS
========================================================== */

otpSchema.methods.hasExceededAttempts =
  function () {
    return this.attempts >= this.maxAttempts;
  };

/* ==========================================================
   JSON TRANSFORM
========================================================== */

otpSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.code;
    return ret;
  },
});

/* ==========================================================
   EXPORT
========================================================== */

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;