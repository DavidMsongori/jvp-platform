import { body, param, query } from "express-validator";

/* ==========================================
   SUPPORTED COUNTIES
========================================== */

const SUPPORTED_COUNTIES = [
  "Kilifi",
  "Mombasa",
  "Kwale",
  "Taita Taveta",
  "Tana River",
  "Lamu",
];

const SUPPORTED_COUNTY_CODES = [
  "KLF",
  "MSA",
  "KWL",
  "TTV",
  "TNR",
  "LMU",
];

const PARTICIPANT_TYPES = [
  "member",
  "public",
];

const REGISTRATION_STATUSES = [
  "confirmed",
  "cancelled",
  "waitlisted",
];

const TICKET_STATUSES = [
  "active",
  "cancelled",
  "checked_in",
  "transferred",
  "expired",
];

/* ==========================================
   HELPER FUNCTIONS
========================================== */

const normalizeSpaces = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .trim()
    .replace(/\s+/g, " ");
};

const normalizeEmail = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().toLowerCase();
};

const normalizePhone = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value
    .trim()
    .replace(/[\s()-]/g, "");

  if (trimmedValue.startsWith("+254")) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith("254")) {
    return `+${trimmedValue}`;
  }

  if (trimmedValue.startsWith("0")) {
    return `+254${trimmedValue.slice(1)}`;
  }

  if (/^[17]\d{8}$/.test(trimmedValue)) {
  return `+254${trimmedValue}`;
}

if (/^0[17]\d{8}$/.test(trimmedValue)) {
  return `+254${trimmedValue.slice(1)}`;
}

if (/^254[17]\d{8}$/.test(trimmedValue)) {
  return `+${trimmedValue}`;
}

  return trimmedValue;
};

const normalizeNationalId = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return value;
  }

  return String(value)
    .trim()
    .replace(/\s+/g, "");
};

const normalizeTicketNumber = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().toUpperCase();
};

const isValidKenyanPhone = (value) => {
  return /^\+254[17]\d{8}$/.test(value);
};

const isValidNationalId = (value) => {
  return /^\d{5,10}$/.test(value);
};

const isValidTicketNumber = (value) => {
  return /^CYS\/(KLF|MSA|KWL|TTV|TNR|LMU)\/\d{3,4}$/.test(
    value
  );
};

/* ==========================================
   PUBLIC SUMMIT REGISTRATION VALIDATION
========================================== */

export const validateSummitRegistration = [
  body("summitEventId")
    .trim()
    .notEmpty()
    .withMessage(
      "The summit event ID is required."
    )
    .isMongoId()
    .withMessage(
      "The summit event ID is invalid."
    ),

  body("participantType")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage(
      "Participant type is required."
    )
    .isIn(PARTICIPANT_TYPES)
    .withMessage(
      "Participant type must be either member or public."
    ),

  body("fullName")
    .customSanitizer(normalizeSpaces)
    .notEmpty()
    .withMessage(
      "Full name is required."
    )
    .isLength({
      min: 3,
      max: 120,
    })
    .withMessage(
      "Full name must be between 3 and 120 characters."
    )
    .matches(
      /^[A-Za-zÀ-ÖØ-öø-ÿ'’.\-\s]+$/
    )
    .withMessage(
      "Full name contains invalid characters."
    ),

  body("email")
    .customSanitizer(normalizeEmail)
    .notEmpty()
    .withMessage(
      "Email address is required."
    )
    .isEmail()
    .withMessage(
      "Please provide a valid email address."
    )
    .isLength({
      max: 160,
    })
    .withMessage(
      "Email address is too long."
    ),

  body("phone")
    .customSanitizer(normalizePhone)
    .notEmpty()
    .withMessage(
      "Phone number is required."
    )
    .custom(isValidKenyanPhone)
    .withMessage(
      "Please provide a valid Kenyan phone number."
    ),

  body("nationalId")
    .customSanitizer(normalizeNationalId)
    .notEmpty()
    .withMessage(
      "National ID number is required."
    )
    .custom(isValidNationalId)
    .withMessage(
      "National ID must contain between 5 and 10 digits."
    ),

  body("county")
    .customSanitizer(normalizeSpaces)
    .notEmpty()
    .withMessage(
      "County is required."
    )
    .isIn(SUPPORTED_COUNTIES)
    .withMessage(
      `County must be one of: ${SUPPORTED_COUNTIES.join(
        ", "
      )}.`
    ),

  body("countyCode")
    .optional({
      checkFalsy: true,
    })
    .trim()
    .toUpperCase()
    .isIn(SUPPORTED_COUNTY_CODES)
    .withMessage(
      "The county code is invalid."
    ),

  body("constituency")
    .customSanitizer(normalizeSpaces)
    .notEmpty()
    .withMessage(
      "Constituency is required."
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Constituency must be between 2 and 100 characters."
    )
    .matches(
      /^[A-Za-zÀ-ÖØ-öø-ÿ0-9'’.\-\s]+$/
    )
    .withMessage(
      "Constituency contains invalid characters."
    ),

  body("ward")
    .customSanitizer(normalizeSpaces)
    .notEmpty()
    .withMessage(
      "Ward is required."
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Ward must be between 2 and 100 characters."
    )
    .matches(
      /^[A-Za-zÀ-ÖØ-öø-ÿ0-9'’.\-\s]+$/
    )
    .withMessage(
      "Ward contains invalid characters."
    ),

  body("membershipInterest")
    .optional()
    .isBoolean()
    .withMessage(
      "Membership interest must be true or false."
    )
    .toBoolean(),

  body("acceptedTerms")
    .exists({
      checkNull: true,
    })
    .withMessage(
      "You must accept the registration terms."
    )
    .isBoolean()
    .withMessage(
      "Accepted terms must be true or false."
    )
    .custom((value) => {
      if (value !== true) {
        throw new Error(
          "You must accept the registration terms."
        );
      }

      return true;
    })
    .toBoolean(),

 body("consentedToCommunication")
    .optional()
    .isBoolean()
    .withMessage(
      "Communication consent must be true or false."
    )
    .toBoolean(),

  body("registrationSource")
  .optional({
    checkFalsy: true,
  })
  .trim()
  .toLowerCase()
  .isIn([
    "member_dashboard",
    "public_member_login",
    "public_guest",
    "membership_registration",
    "admin",
  ])
  .withMessage(
    "The registration source is invalid."
  ),

  body("userId")
    .optional({
      checkFalsy: true,
    })
    .isMongoId()
    .withMessage(
      "The user ID is invalid."
    ),

  body("memberId")
    .optional({
      checkFalsy: true,
    })
    .isMongoId()
    .withMessage(
      "The member ID is invalid."
    ),

  body().custom((requestBody) => {
    if (
      requestBody.participantType ===
        "member" &&
      !requestBody.memberId
    ) {
      throw new Error(
        "A member ID is required when registering as a JVP member."
      );
    }

    return true;
  }),
];

/* ==========================================
   MEMBER REGISTRATION VALIDATION
========================================== */

export const validateMemberSummitRegistration = [
  body("summitEventId")
    .trim()
    .notEmpty()
    .withMessage(
      "The summit event ID is required."
    )
    .isMongoId()
    .withMessage(
      "The summit event ID is invalid."
    ),

  body("county")
    .optional({
      checkFalsy: true,
    })
    .customSanitizer(normalizeSpaces)
    .isIn(SUPPORTED_COUNTIES)
    .withMessage(
      `County must be one of: ${SUPPORTED_COUNTIES.join(
        ", "
      )}.`
    ),

  body("constituency")
    .optional({
      checkFalsy: true,
    })
    .customSanitizer(normalizeSpaces)
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Constituency must be between 2 and 100 characters."
    ),

  body("ward")
    .optional({
      checkFalsy: true,
    })
    .customSanitizer(normalizeSpaces)
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Ward must be between 2 and 100 characters."
    ),

  body("acceptedTerms")
    .exists({
      checkNull: true,
    })
    .withMessage(
      "You must accept the registration terms."
    )
    .isBoolean()
    .withMessage(
      "Accepted terms must be true or false."
    )
    .custom((value) => {
      if (value !== true) {
        throw new Error(
          "You must accept the registration terms."
        );
      }

      return true;
    })
    .toBoolean(),

  body("consentedToCommunication")
    .optional()
    .isBoolean()
    .withMessage(
      "Communication consent must be true or false."
    )
    .toBoolean(),
];

/* ==========================================
   PUBLIC PARTICIPANT VALIDATION
========================================== */

export const validatePublicSummitRegistration = [
  body("summitEventId")
    .trim()
    .notEmpty()
    .withMessage(
      "The summit event ID is required."
    )
    .isMongoId()
    .withMessage(
      "The summit event ID is invalid."
    ),

  body("fullName")
    .customSanitizer(normalizeSpaces)
    .notEmpty()
    .withMessage(
      "Full name is required."
    )
    .isLength({
      min: 3,
      max: 120,
    })
    .withMessage(
      "Full name must be between 3 and 120 characters."
    )
    .matches(
      /^[A-Za-zÀ-ÖØ-öø-ÿ'’.\-\s]+$/
    )
    .withMessage(
      "Full name contains invalid characters."
    ),

  body("email")
    .customSanitizer(normalizeEmail)
    .notEmpty()
    .withMessage(
      "Email address is required."
    )
    .isEmail()
    .withMessage(
      "Please provide a valid email address."
    ),

  body("phone")
    .customSanitizer(normalizePhone)
    .notEmpty()
    .withMessage(
      "Phone number is required."
    )
    .custom(isValidKenyanPhone)
    .withMessage(
      "Please provide a valid Kenyan phone number."
    ),

  body("nationalId")
    .customSanitizer(normalizeNationalId)
    .notEmpty()
    .withMessage(
      "National ID number is required."
    )
    .custom(isValidNationalId)
    .withMessage(
      "National ID must contain between 5 and 10 digits."
    ),

  body("county")
    .customSanitizer(normalizeSpaces)
    .notEmpty()
    .withMessage(
      "County is required."
    )
    .isIn(SUPPORTED_COUNTIES)
    .withMessage(
      `County must be one of: ${SUPPORTED_COUNTIES.join(
        ", "
      )}.`
    ),

  body("constituency")
    .customSanitizer(normalizeSpaces)
    .notEmpty()
    .withMessage(
      "Constituency is required."
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Constituency must be between 2 and 100 characters."
    ),

  body("ward")
    .customSanitizer(normalizeSpaces)
    .notEmpty()
    .withMessage(
      "Ward is required."
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Ward must be between 2 and 100 characters."
    ),

  body("membershipInterest")
    .optional()
    .isBoolean()
    .withMessage(
      "Membership interest must be true or false."
    )
    .toBoolean(),

  body("acceptedTerms")
    .exists({
      checkNull: true,
    })
    .withMessage(
      "You must accept the registration terms."
    )
    .isBoolean()
    .withMessage(
      "Accepted terms must be true or false."
    )
    .custom((value) => {
      if (value !== true) {
        throw new Error(
          "You must accept the registration terms."
        );
      }

      return true;
    })
    .toBoolean(),

 body("consentedToCommunication")
    .optional()
    .isBoolean()
    .withMessage(
      "Communication consent must be true or false."
    )
    .toBoolean(),
];

/* ==========================================
   SUMMIT EVENT ID PARAMETER
========================================== */

export const validateSummitEventId = [
  param("summitEventId")
    .trim()
    .notEmpty()
    .withMessage(
      "The summit event ID is required."
    )
    .isMongoId()
    .withMessage(
      "The summit event ID is invalid."
    ),
];

/* ==========================================
   REGISTRATION ID PARAMETER
========================================== */

export const validateSummitRegistrationId = [
  param("registrationId")
    .trim()
    .notEmpty()
    .withMessage(
      "The summit registration ID is required."
    )
    .isMongoId()
    .withMessage(
      "The summit registration ID is invalid."
    ),
];

/* ==========================================
   TICKET NUMBER PARAMETER
========================================== */

export const validateSummitTicketNumber = [
  param("ticketNumber")
    .customSanitizer(
      normalizeTicketNumber
    )
    .notEmpty()
    .withMessage(
      "The summit ticket number is required."
    )
    .custom(isValidTicketNumber)
    .withMessage(
      "The summit ticket number is invalid."
    ),
];

/* ==========================================
   TICKET VERIFICATION VALIDATION
========================================== */

export const validateSummitTicketVerification = [
  param("ticketNumber")
    .customSanitizer(
      normalizeTicketNumber
    )
    .notEmpty()
    .withMessage(
      "The summit ticket number is required."
    )
    .custom(isValidTicketNumber)
    .withMessage(
      "The summit ticket number is invalid."
    ),

  query("code")
    .optional({
      checkFalsy: true,
    })
    .trim()
    .isLength({
      min: 16,
      max: 128,
    })
    .withMessage(
      "The ticket verification code is invalid."
    )
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "The ticket verification code contains invalid characters."
    ),
];

/* ==========================================
   RESEND TICKET EMAIL VALIDATION
========================================== */

export const validateResendSummitTicketEmail = [
  param("registrationId")
    .trim()
    .notEmpty()
    .withMessage(
      "The summit registration ID is required."
    )
    .isMongoId()
    .withMessage(
      "The summit registration ID is invalid."
    ),
];

/* ==========================================
   LOGISTICS EMAIL VALIDATION
========================================== */

export const validateSummitLogisticsEmail = [
  param("registrationId")
    .isMongoId()
    .withMessage(
      "The summit registration ID is invalid."
    ),

  body("subject")
    .trim()
    .notEmpty()
    .withMessage(
      "The logistics email subject is required."
    )
    .isLength({
      min: 3,
      max: 160,
    })
    .withMessage(
      "The logistics email subject must be between 3 and 160 characters."
    ),

  body("message")
    .trim()
    .notEmpty()
    .withMessage(
      "The logistics message is required."
    )
    .isLength({
      min: 10,
      max: 5000,
    })
    .withMessage(
      "The logistics message must be between 10 and 5000 characters."
    ),
];

/* ==========================================
   UPDATE REGISTRATION STATUS
========================================== */

export const validateUpdateSummitRegistrationStatus = [
  param("registrationId")
    .trim()
    .notEmpty()
    .withMessage(
      "The summit registration ID is required."
    )
    .isMongoId()
    .withMessage(
      "The summit registration ID is invalid."
    ),

  body("status")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage(
      "The registration status is required."
    )
    .isIn(REGISTRATION_STATUSES)
    .withMessage(
      `Registration status must be one of: ${REGISTRATION_STATUSES.join(
        ", "
      )}.`
    ),

  body("reason")
    .optional({
      checkFalsy: true,
    })
    .customSanitizer(normalizeSpaces)
    .isLength({
      min: 3,
      max: 500,
    })
    .withMessage(
      "The status reason must be between 3 and 500 characters."
    ),
];

/* ==========================================
   UPDATE TICKET STATUS
========================================== */

export const validateUpdateSummitTicketStatus = [
  param("registrationId")
    .trim()
    .notEmpty()
    .withMessage(
      "The summit registration ID is required."
    )
    .isMongoId()
    .withMessage(
      "The summit registration ID is invalid."
    ),

  body("ticketStatus")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage(
      "The ticket status is required."
    )
    .isIn(TICKET_STATUSES)
    .withMessage(
      `Ticket status must be one of: ${TICKET_STATUSES.join(
        ", "
      )}.`
    ),
];

/* ==========================================
   CHECK-IN VALIDATION
========================================== */

export const validateSummitCheckIn = [
  body("ticketNumber")
    .customSanitizer(
      normalizeTicketNumber
    )
    .notEmpty()
    .withMessage(
      "The summit ticket number is required."
    )
    .custom(isValidTicketNumber)
    .withMessage(
      "The summit ticket number is invalid."
    ),

  body("verificationCode")
    .optional({
      checkFalsy: true,
    })
    .trim()
    .isLength({
      min: 16,
      max: 128,
    })
    .withMessage(
      "The verification code is invalid."
    )
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "The verification code contains invalid characters."
    ),
];

/* ==========================================
   REGISTRATION LIST QUERY VALIDATION
========================================== */

export const validateSummitRegistrationListQuery = [
  query("page")
    .optional()
    .isInt({
      min: 1,
      max: 100000,
    })
    .withMessage(
      "Page must be a positive integer."
    )
    .toInt(),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage(
      "Limit must be between 1 and 100."
    )
    .toInt(),

  query("county")
    .optional({
      checkFalsy: true,
    })
    .customSanitizer(normalizeSpaces)
    .isIn(SUPPORTED_COUNTIES)
    .withMessage(
      "The county filter is invalid."
    ),

  query("countyCode")
    .optional({
      checkFalsy: true,
    })
    .trim()
    .toUpperCase()
    .isIn(SUPPORTED_COUNTY_CODES)
    .withMessage(
      "The county code filter is invalid."
    ),

  query("participantType")
    .optional({
      checkFalsy: true,
    })
    .trim()
    .toLowerCase()
    .isIn(PARTICIPANT_TYPES)
    .withMessage(
      "The participant type filter is invalid."
    ),

  query("status")
    .optional({
      checkFalsy: true,
    })
    .trim()
    .toLowerCase()
    .isIn(REGISTRATION_STATUSES)
    .withMessage(
      "The registration status filter is invalid."
    ),

  query("ticketStatus")
    .optional({
      checkFalsy: true,
    })
    .trim()
    .toLowerCase()
    .isIn(TICKET_STATUSES)
    .withMessage(
      "The ticket status filter is invalid."
    ),

  query("checkedIn")
    .optional()
    .isBoolean()
    .withMessage(
      "Checked-in filter must be true or false."
    )
    .toBoolean(),

  query("search")
    .optional({
      checkFalsy: true,
    })
    .customSanitizer(normalizeSpaces)
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Search text must be between 2 and 100 characters."
    ),

  query("sortBy")
    .optional({
      checkFalsy: true,
    })
    .trim()
    .isIn([
      "registeredAt",
      "fullName",
      "county",
      "ticketNumber",
      "status",
    ])
    .withMessage(
      "The selected sorting field is invalid."
    ),

  query("sortOrder")
    .optional({
      checkFalsy: true,
    })
    .trim()
    .toLowerCase()
    .isIn([
      "asc",
      "desc",
    ])
    .withMessage(
      "Sort order must be asc or desc."
    ),
];

/* ==========================================
   EVENT SLUG VALIDATION
========================================== */

export const validateSummitSlug = [
  param("slug")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage(
      "The summit event slug is required."
    )
    .isLength({
      min: 3,
      max: 120,
    })
    .withMessage(
      "The summit slug must be between 3 and 120 characters."
    )
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage(
      "The summit slug is invalid."
    ),
];


/* ==========================================
   PUBLIC REGISTRATION LOOKUP
========================================== */

export const validateSummitRegistrationEmailLookup = [
  param("email")
    .trim()
    .notEmpty()
    .withMessage(
      "Email address is required."
    )
    .isEmail()
    .withMessage(
      "Enter a valid email address."
    )
    .normalizeEmail(),

  query("nationalIdLastFour")
    .trim()
    .notEmpty()
    .withMessage(
      "The last four characters of the National ID are required."
    )
    .isLength({
      min: 4,
      max: 4,
    })
    .withMessage(
      "National ID verification must contain exactly four characters."
    ),
];

export const validateSummitRegistrationPhoneLookup = [
  param("phone")
    .trim()
    .notEmpty()
    .withMessage(
      "Phone number is required."
    )
    .custom((value) => {
      const phone = String(value || "")
        .replace(/\s+/g, "")
        .replace(/[()-]/g, "");

      const normalizedPhone =
        phone.startsWith("0")
          ? `+254${phone.slice(1)}`
          : phone.startsWith("254")
            ? `+${phone}`
            : phone;

      if (
        !/^\+254[17]\d{8}$/.test(
          normalizedPhone
        )
      ) {
        throw new Error(
          "Enter a valid Kenyan phone number."
        );
      }

      return true;
    }),

  query("nationalIdLastFour")
    .trim()
    .notEmpty()
    .withMessage(
      "The last four characters of the National ID are required."
    )
    .isLength({
      min: 4,
      max: 4,
    })
    .withMessage(
      "National ID verification must contain exactly four characters."
    ),
];


/* ==========================================
   EXPORT CONSTANTS
========================================== */

export {
  SUPPORTED_COUNTIES,
  SUPPORTED_COUNTY_CODES,
  PARTICIPANT_TYPES,
  REGISTRATION_STATUSES,
  TICKET_STATUSES,
};