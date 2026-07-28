import { body } from "express-validator";

/* ==========================================================
   CONSTANTS
========================================================== */

const COUNTIES = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
];

const MEMBERSHIP_TYPES = [
  "ordinary",
  "leadership",
];

const GENDERS = [
  "male",
  "female",
];

const OTP_PURPOSES = [
  "EMAIL_VERIFICATION",
  "ACCOUNT_ACTIVATION",
  "PASSWORD_RESET",
  "LOGIN",
  "CHANGE_EMAIL",
  "CHANGE_PHONE",
];

/* ==========================================================
   REGISTER
========================================================== */

export const registerValidator = [

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required."),

  body("middleName")
    .optional()
    .trim(),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required."),

  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Gender is required.")
    .isIn(GENDERS)
    .withMessage("Invalid gender."),

  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required.")
    .isISO8601()
    .withMessage("Invalid date of birth."),

  body("nationalId")
    .trim()
    .notEmpty()
    .withMessage("National ID is required.")
    .isLength({
      min: 6,
      max: 20,
    }),

 body("phone")
  .trim()
  .notEmpty()
  .withMessage("Phone number is required.")
  .customSanitizer((value) => {
    let phone = String(value)
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .replace(/^\+/, "");

    if (
      phone.startsWith("07") ||
      phone.startsWith("01")
    ) {
      phone = `254${phone.slice(1)}`;
    }

    return phone;
  })
  .matches(/^254(?:7|1)\d{8}$/)
  .withMessage(
    "Invalid Kenyan phone number. Use 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, or 2541XXXXXXXX."
  ),
  
  body("occupation")
    .trim()
    .notEmpty()
    .withMessage("Occupation is required."),

  body("county")
    .notEmpty()
    .withMessage("County is required.")
    .isIn(COUNTIES)
    .withMessage("Invalid county."),

  body("membershipType")
    .notEmpty()
    .withMessage("Membership type is required.")
    .isIn(MEMBERSHIP_TYPES)
    .withMessage("Invalid membership type."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email.")
    .normalizeEmail(),

];

/* ==========================================
   ACTIVATE EXISTING MEMBER
========================================== */

export const activateExistingMemberValidator = [

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),

];

/* ==========================================================
   VERIFY OTP
========================================================== */

export const verifyOTPValidator = [

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email.")
    .normalizeEmail(),

  body("code")
    .trim()
    .notEmpty()
    .withMessage("OTP code is required.")
    .isLength({
      min: 6,
      max: 6,
    })
    .withMessage("OTP must contain 6 digits."),

  body("purpose")
    .notEmpty()
    .withMessage("OTP purpose is required.")
    .isIn(OTP_PURPOSES)
    .withMessage("Invalid OTP purpose."),

];

/* ==========================================================
   RESEND OTP
========================================================== */

export const resendOTPValidator = [

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email.")
    .normalizeEmail(),

  body("purpose")
    .notEmpty()
    .withMessage("OTP purpose is required.")
    .isIn(OTP_PURPOSES)
    .withMessage("Invalid OTP purpose."),

];

/* ==========================================================
   CREATE PASSWORD
========================================================== */

export const createPasswordValidator = [

  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email.")
    .normalizeEmail(),

  body("password")
    .isLength({
      min: 8,
    })
    .withMessage(
      "Password must be at least 8 characters."
    ),

  body("confirmPassword")
    .custom((value, { req }) => {

      if (value !== req.body.password) {

        throw new Error(
          "Passwords do not match."
        );

      }

      return true;

    }),

];

/* ==========================================================
   LOGIN
========================================================== */

export const loginValidator = [

  body("identifier")
    .trim()
    .notEmpty()
    .withMessage(
      "Email address or phone number is required."
    ),

  body("password")
    .notEmpty()
    .withMessage("Password is required."),

];

/* ==========================================================
   FORGOT PASSWORD
========================================================== */

export const forgotPasswordValidator = [

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email.")
    .normalizeEmail(),

];

/* ==========================================================
   RESET PASSWORD
========================================================== */

export const resetPasswordValidator = [

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),

  body("code")
    .trim()
    .notEmpty()
    .withMessage("OTP code is required.")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits.")
    .isNumeric()
    .withMessage("OTP must contain only numbers."),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password.")
    .custom((value, { req }) => {

      if (value !== req.body.password) {

        throw new Error(
          "Passwords do not match."
        );

      }

      return true;

    }),

];