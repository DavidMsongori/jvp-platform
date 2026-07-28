import crypto from "crypto";
import mongoose from "mongoose";

import SummitEvent from "../models/summitEvent.model.js";
import SummitRegistration from "../models/summitRegistration.model.js";
import SummitCounter from "../models/summitCounter.model.js";
import Member from "../models/Member.js";

import { generateSummitTicketNumber } from "../utils/generateSummitTicketNumber.js";

import {
  generateRegistrationTicket,
} from "./summitTicket.service.js";

import {
  sendSummitTicketEmail,
} from "./summitEmail.service.js";

/* ==========================================
   COUNTY CONFIGURATION
========================================== */

const COUNTY_CONFIG = Object.freeze({
  kilifi: {
    county: "Kilifi",
    countyCode: "KLF",
  },

  mombasa: {
    county: "Mombasa",
    countyCode: "MSA",
  },

  kwale: {
    county: "Kwale",
    countyCode: "KWL",
  },

  "taita taveta": {
    county: "Taita Taveta",
    countyCode: "TTV",
  },

  "tana river": {
    county: "Tana River",
    countyCode: "TNR",
  },

  lamu: {
    county: "Lamu",
    countyCode: "LMU",
  },
});

/* ==========================================
   SERVICE ERROR
========================================== */

class SummitServiceError extends Error {
  constructor(message, statusCode = 500, code = "SUMMIT_SERVICE_ERROR") {
    super(message);

    this.name = "SummitServiceError";
    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace?.(this, SummitServiceError);
  }
}

/* ==========================================
   NORMALIZATION HELPERS
========================================== */

const normalizeText = (value = "") =>
  String(value).trim().replace(/\s+/g, " ");

const normalizeEmail = (email = "") =>
  String(email).trim().toLowerCase();

const normalizeNationalId = (nationalId = "") =>
  String(nationalId).trim().replace(/\s+/g, "");

const normalizePhone = (phone = "") => {
  let normalized = String(phone).trim().replace(/[\s()-]/g, "");

  if (normalized.startsWith("+254")) {
    normalized = `0${normalized.slice(4)}`;
  }

  if (normalized.startsWith("254")) {
    normalized = `0${normalized.slice(3)}`;
  }

  return normalized;
};

const getNationalIdLastFour = (nationalId) =>
  nationalId.slice(-4).padStart(4, "*");

/* ==========================================
   COUNTY HELPERS
========================================== */

const resolveCounty = (countyValue) => {
  const key = normalizeText(countyValue).toLowerCase();
  const county = COUNTY_CONFIG[key];

  if (!county) {
    throw new SummitServiceError(
      "Summit registration is currently available only to participants from the six Coast Region counties.",
      400,
      "INVALID_COUNTY"
    );
  }

  return county;
};

/* ==========================================
   EVENT VALIDATION
========================================== */

const validateEventRegistrationStatus = (event) => {
  if (!event) {
    throw new SummitServiceError(
      "The summit event could not be found.",
      404,
      "SUMMIT_NOT_FOUND"
    );
  }

  if (event.registrationStatus !== "open") {
    const messages = {
      draft: "Summit registration has not yet opened.",
      paused: "Summit registration has temporarily been paused.",
      closed: "Summit registration has closed.",
    };

    throw new SummitServiceError(
      messages[event.registrationStatus] ||
        "Summit registration is currently unavailable.",
      403,
      "REGISTRATION_NOT_OPEN"
    );
  }

  const now = new Date();

  if (
    event.registrationOpensAt &&
    now < new Date(event.registrationOpensAt)
  ) {
    throw new SummitServiceError(
      "Summit registration has not yet opened.",
      403,
      "REGISTRATION_NOT_STARTED"
    );
  }

  if (
    event.registrationClosesAt &&
    now > new Date(event.registrationClosesAt)
  ) {
    throw new SummitServiceError(
      "Summit registration has closed.",
      403,
      "REGISTRATION_CLOSED"
    );
  }

  if (event.totalRegistered >= event.totalCapacity) {
    throw new SummitServiceError(
      "All available summit slots have been filled.",
      409,
      "SUMMIT_FULL"
    );
  }
};

/* ==========================================
   PARTICIPANT VALIDATION
========================================== */

const validateRegistrationPayload = (payload) => {
  const requiredFields = [
    "fullName",
    "email",
    "phone",
    "nationalId",
    "county",
    "constituency",
    "ward",
  ];

  const missingFields = requiredFields.filter(
    (field) => !normalizeText(payload[field])
  );

  if (missingFields.length > 0) {
    throw new SummitServiceError(
      `Missing required fields: ${missingFields.join(", ")}.`,
      400,
      "MISSING_REQUIRED_FIELDS"
    );
  }

  if (!payload.acceptedTerms) {
    throw new SummitServiceError(
      "You must accept the summit registration terms.",
      400,
      "TERMS_NOT_ACCEPTED"
    );
  }

  if (!payload.consentedToCommunication) {
    throw new SummitServiceError(
      "You must consent to receiving summit information by email or phone.",
      400,
      "COMMUNICATION_CONSENT_REQUIRED"
    );
  }
};

/* ==========================================
   MEMBER RESOLUTION
========================================== */

const resolveMemberRegistration = async ({
  isRegisteredMember,
  userId,
  memberId,
  session,
}) => {
  if (!isRegisteredMember) {
    return {
      user: null,
      member: null,
      participantType: "public",
    };
  }

  let member = null;

  if (userId) {
    member = await Member.findOne({
      user: userId,
    })
      .session(session)
      .select(
        "_id user firstName middleName lastName email phone nationalId county constituency ward membershipStatus"
      );
  }

  if (!member && memberId) {
    member = await Member.findById(memberId)
      .session(session)
      .select(
        "_id user firstName middleName lastName email phone nationalId county constituency ward membershipStatus"
      );
  }

  if (!member) {
    throw new SummitServiceError(
      "Your JVP membership record could not be found. Please continue as a public participant or complete membership registration.",
      404,
      "MEMBER_NOT_FOUND"
    );
  }

  if (
    member.membershipStatus &&
    member.membershipStatus !== "active"
  ) {
    throw new SummitServiceError(
      "Your JVP membership is not currently active. You may still register as a public participant.",
      403,
      "MEMBERSHIP_NOT_ACTIVE"
    );
  }

  return {
    user: member.user || userId || null,
    member: member._id,
    participantType: "member",
  };
};

/* ==========================================
   DUPLICATE REGISTRATION CHECK
========================================== */

const checkDuplicateRegistration = async ({
  summitEventId,
  email,
  phone,
  nationalId,
  memberId,
  session,
}) => {
  const duplicateConditions = [
    { email },
    { phone },
    { nationalId },
  ];

  if (memberId) {
    duplicateConditions.push({
      member: memberId,
    });
  }

  const existingRegistration = await SummitRegistration.findOne({
    summitEvent: summitEventId,
    status: {
      $ne: "cancelled",
    },
    $or: duplicateConditions,
  })
    .session(session)
    .select(
      "ticketNumber fullName email phone county status registeredAt"
    );

  if (!existingRegistration) {
    return;
  }

  throw new SummitServiceError(
    `A summit registration already exists for these details. Ticket number: ${existingRegistration.ticketNumber}.`,
    409,
    "DUPLICATE_SUMMIT_REGISTRATION"
  );
};

/* ==========================================
   RESERVE COUNTY SLOT
========================================== */

const reserveCountySlot = async ({
  summitEvent,
  county,
  countyCode,
  session,
}) => {
  const countyAllocation = summitEvent.countyAllocations.find(
    (allocation) => allocation.countyCode === countyCode
  );

  if (!countyAllocation) {
    throw new SummitServiceError(
      `No summit allocation was found for ${county}.`,
      400,
      "COUNTY_ALLOCATION_NOT_FOUND"
    );
  }

  if (!countyAllocation.isRegistrationOpen) {
    throw new SummitServiceError(
      `Summit registration for ${county} County is currently closed.`,
      403,
      "COUNTY_REGISTRATION_CLOSED"
    );
  }

  const updatedCounter = await SummitCounter.findOneAndUpdate(
  {
    summitEvent: summitEvent._id,
    countyCode,
    currentSequence: {
      $lt: countyAllocation.allocatedSlots,
    },
  },
  {
    $setOnInsert: {
      summitEvent: summitEvent._id,
      county,
      countyCode,
      allocatedSlots: countyAllocation.allocatedSlots,
    },

    $inc: {
      currentSequence: 1,
    },

    $set: {
      lastIssuedAt: new Date(),
    },
  },
  {
   returnDocument: "after",
    upsert: true,
    session,
    runValidators: true,
    setDefaultsOnInsert: true,
  }
);

if (!updatedCounter) {
  throw new SummitServiceError(
    `All ${county} County summit slots have been filled.`,
    409,
    "COUNTY_SLOTS_FULL"
  );
}

if (
  updatedCounter.currentSequence >
  countyAllocation.allocatedSlots
) {
  throw new SummitServiceError(
    `All ${county} County summit slots have been filled.`,
    409,
    "COUNTY_SLOTS_FULL"
  );
}

return {
  countySlotNumber: updatedCounter.currentSequence,
  allocatedSlots: countyAllocation.allocatedSlots,
};
};

/* ==========================================
   UPDATE EVENT STATISTICS
========================================== */

const incrementEventRegistrationCounts = async ({
  summitEvent,
  countyCode,
  session,
}) => {
  const countyAllocation =
    summitEvent.countyAllocations.find(
      (allocation) =>
        allocation.countyCode === countyCode
    );

  if (!countyAllocation) {
    throw new SummitServiceError(
      "The selected county allocation could not be found.",
      400,
      "COUNTY_ALLOCATION_NOT_FOUND"
    );
  }

  const updatedEvent =
    await SummitEvent.findOneAndUpdate(
      {
        _id: summitEvent._id,

        registrationStatus: "open",

        totalRegistered: {
          $lt: summitEvent.totalCapacity,
        },

        countyAllocations: {
          $elemMatch: {
            countyCode,
            isRegistrationOpen: true,
            registeredCount: {
              $lt: countyAllocation.allocatedSlots,
            },
          },
        },
      },

      {
        $inc: {
          totalRegistered: 1,

          "countyAllocations.$[county].registeredCount": 1,
        },
      },

      {
        returnDocument: "after",
        session,
        runValidators: true,

        arrayFilters: [
          {
            "county.countyCode": countyCode,
            "county.isRegistrationOpen": true,
            "county.registeredCount": {
              $lt: countyAllocation.allocatedSlots,
            },
          },
        ],
      }
    );

  if (!updatedEvent) {
    throw new SummitServiceError(
      "The summit or selected county has reached its registration capacity.",
      409,
      "EVENT_CAPACITY_UPDATE_FAILED"
    );
  }

  return updatedEvent;
};

/* ==========================================
   CREATE REGISTRATION
========================================== */

const createRegistrationRecord = async ({
  summitEvent,
  payload,
  memberRegistration,
  countyDetails,
  countySlot,
  requestMeta,
  session,
}) => {
  const verificationCode = crypto
    .randomBytes(32)
    .toString("hex");

  const ticketNumber = generateSummitTicketNumber({
    prefix: summitEvent.ticketPrefix || "CYS",
    countyCode: countyDetails.countyCode,
    sequence: countySlot.countySlotNumber,
    allocatedSlots: countySlot.allocatedSlots,
  });

  const nationalId = normalizeNationalId(payload.nationalId);

  const registrationDocuments = await SummitRegistration.create(
    [
      {
        summitEvent: summitEvent._id,

        participantType:
          memberRegistration.participantType,

        registrationSource:
          payload.registrationSource ||
          (memberRegistration.participantType === "member"
            ? "public_member_login"
            : "public_guest"),

        isRegisteredMember:
          memberRegistration.participantType === "member",

        membershipInterest:
          Boolean(payload.membershipInterest),

        membershipRegistrationStarted:
          Boolean(payload.membershipRegistrationStarted),

        user: memberRegistration.user,
        member: memberRegistration.member,

        fullName: normalizeText(payload.fullName),
        email: normalizeEmail(payload.email),
        phone: normalizePhone(payload.phone),

        nationalId,
        nationalIdLastFour:
          getNationalIdLastFour(nationalId),

        county: countyDetails.county,
        countyCode: countyDetails.countyCode,

        constituency: normalizeText(
          payload.constituency
        ),

        ward: normalizeText(payload.ward),

        ticketNumber,
        countySlotNumber:
          countySlot.countySlotNumber,

        ticketStatus: "active",
        ticketVerificationCode:
          verificationCode,

        acceptedTerms:
          Boolean(payload.acceptedTerms),

        consentedToCommunication:
          Boolean(payload.consentedToCommunication),

        ipAddress: requestMeta?.ipAddress || null,
        userAgent: requestMeta?.userAgent || null,

        status: "confirmed",
        registeredAt: new Date(),

        createdBy:
          payload.createdBy ||
          memberRegistration.user ||
          null,
      },
    ],
    {
      session,
    }
  );

  return registrationDocuments[0];
};

/* ==========================================
   HANDLE DUPLICATE DATABASE ERRORS
========================================== */

const handleMongoRegistrationError = (error) => {
  if (error?.code !== 11000) {
    throw error;
  }

  const duplicateField =
    Object.keys(error.keyPattern || {})[1] ||
    Object.keys(error.keyPattern || {})[0] ||
    "registration details";

  const fieldMessages = {
    email: "This email address is already registered for the summit.",
    phone: "This phone number is already registered for the summit.",
    nationalId: "This ID number is already registered for the summit.",
    ticketNumber: "The generated summit ticket number already exists.",
    countySlotNumber:
      "The selected county slot has already been issued.",
  };

  throw new SummitServiceError(
    fieldMessages[duplicateField] ||
      "A registration already exists using these details.",
    409,
    "DUPLICATE_SUMMIT_REGISTRATION"
  );
};

/* ==========================================
   REGISTER FOR SUMMIT
========================================== */

export const registerForSummit = async ({
  summitEventId,
  payload,
  userId = null,
  memberId = null,
  requestMeta = {},
}) => {
  validateRegistrationPayload(payload);

  if (!mongoose.isValidObjectId(summitEventId)) {
    throw new SummitServiceError(
      "The summit event ID is invalid.",
      400,
      "INVALID_SUMMIT_EVENT_ID"
    );
  }

  const countyDetails = resolveCounty(
    payload.county
  );

  const normalizedPayload = {
    ...payload,

    fullName: normalizeText(
      payload.fullName
    ),

    email: normalizeEmail(
      payload.email
    ),

    phone: normalizePhone(
      payload.phone
    ),

    nationalId: normalizeNationalId(
      payload.nationalId
    ),

    constituency: normalizeText(
      payload.constituency
    ),

    ward: normalizeText(
      payload.ward
    ),
  };

  const session =
    await mongoose.startSession();

  let registration = null;

  try {
    await session.withTransaction(
      async () => {
        const summitEvent =
          await SummitEvent.findById(
            summitEventId
          ).session(session);

        validateEventRegistrationStatus(
          summitEvent
        );

        const memberRegistration =
          await resolveMemberRegistration({
            isRegisteredMember: Boolean(
              normalizedPayload
                .isRegisteredMember
            ),

            userId,
            memberId,
            session,
          });

        await checkDuplicateRegistration({
          summitEventId:
            summitEvent._id,

          email:
            normalizedPayload.email,

          phone:
            normalizedPayload.phone,

          nationalId:
            normalizedPayload
              .nationalId,

          memberId:
            memberRegistration.member,

          session,
        });

        const countySlot =
          await reserveCountySlot({
            summitEvent,

            county:
              countyDetails.county,

            countyCode:
              countyDetails.countyCode,

            session,
          });

        registration =
          await createRegistrationRecord({
            summitEvent,

            payload:
              normalizedPayload,

            memberRegistration,

            countyDetails,

            countySlot,

            requestMeta,

            session,
          });

        await incrementEventRegistrationCounts({
          summitEvent,

          countyCode:
            countyDetails.countyCode,

          session,
        });
      }
    );
  } catch (error) {
    handleMongoRegistrationError(
      error
    );
  } finally {
    await session.endSession();
  }

  if (!registration) {
    throw new SummitServiceError(
      "The summit registration could not be completed.",
      500,
      "REGISTRATION_CREATION_FAILED"
    );
  }

  /*
   * Ticket generation and email delivery happen after
   * the database transaction commits.
   *
   * A temporary PDF or email failure should not consume
   * another ticket number or remove a valid registration.
   */

  let ticket = null;
  let emailDelivery = null;

  const warnings = [];

  try {
    ticket =
      await generateRegistrationTicket({
        registrationId:
          registration._id,
      });
  } catch (error) {
    console.error(
      "Summit ticket generation failed:",
      error
    );

    warnings.push(
      "Registration succeeded, but the PDF ticket could not be generated immediately."
    );
  }

  try {
    emailDelivery =
      await sendSummitTicketEmail({
        registrationId:
          registration._id,
      });
  } catch (error) {
    console.error(
      "Summit confirmation email failed:",
      error
    );

    warnings.push(
      "Registration succeeded, but the ticket email could not be delivered immediately."
    );
  }

  const completedRegistration =
    await SummitRegistration.findById(
      registration._id
    )
      .populate(
        "summitEvent",
        "title shortTitle summitDate dateStatus venue logisticsMessage"
      )
      .select(
        "-ticketVerificationCode -ipAddress -userAgent"
      )
      .lean();

  return {
    registration:
      completedRegistration,

    ticket: ticket
      ? {
          ticketNumber:
            ticket.ticketNumber,

          ticketPdfUrl:
            ticket.ticketPdfUrl,

          ticketGeneratedAt:
            ticket.ticketGeneratedAt,

          downloadAvailable:
            Boolean(
              ticket.ticketPdfUrl
            ),
        }
      : {
          ticketNumber:
            completedRegistration
              .ticketNumber,

          ticketPdfUrl: null,

          downloadAvailable:
            false,
        },

    email: {
      sent: Boolean(
        emailDelivery?.sent
      ),

      messageId:
        emailDelivery?.messageId ||
        null,
    },

    warnings,
  };
};

/* ==========================================
   GET PUBLIC SUMMIT INFORMATION
========================================== */

export const getPublicSummitDetails = async ({
  eventId,
  slug,
}) => {
  const query = {};

  if (eventId) {
    if (!mongoose.isValidObjectId(eventId)) {
      throw new SummitServiceError(
        "The summit event ID is invalid.",
        400,
        "INVALID_SUMMIT_EVENT_ID"
      );
    }

    query._id = eventId;
  } else if (slug) {
    query.slug = String(slug).trim().toLowerCase();
  } else {
    query.registrationStatus = {
      $in: ["open", "paused"],
    };
  }

  const summitEvent = await SummitEvent.findOne(query)
    .select(
      "title shortTitle slug description year summitDate dateStatus venue registrationOpensAt registrationClosesAt registrationStatus totalCapacity totalRegistered countyAllocations logisticsMessage contactEmail contactPhone"
    )
    .lean();

  if (!summitEvent) {
    throw new SummitServiceError(
      "The summit event could not be found.",
      404,
      "SUMMIT_NOT_FOUND"
    );
  }

  const countySlots =
    summitEvent.countyAllocations.map(
      (allocation) => ({
        county: allocation.county,
        countyCode: allocation.countyCode,
        allocatedSlots:
          allocation.allocatedSlots,
        registeredCount:
          allocation.registeredCount,
        remainingSlots: Math.max(
          allocation.allocatedSlots -
            allocation.registeredCount,
          0
        ),
        isRegistrationOpen:
          allocation.isRegistrationOpen,
        isFull:
          allocation.registeredCount >=
          allocation.allocatedSlots,
      })
    );

  return {
    ...summitEvent,

    remainingSlots: Math.max(
      summitEvent.totalCapacity -
        summitEvent.totalRegistered,
      0
    ),

    countyAllocations: countySlots,
  };
};

/* ==========================================
   FIND REGISTRATION
========================================== */

export const getRegistrationByTicketNumber =
  async ({ ticketNumber }) => {
    const normalizedTicketNumber = String(
      ticketNumber
    )
      .trim()
      .toUpperCase();

    const registration =
      await SummitRegistration.findOne({
        ticketNumber: normalizedTicketNumber,
      })
        .populate(
          "summitEvent",
          "title shortTitle summitDate dateStatus venue logisticsMessage"
        )
        .select(
          "fullName email phone nationalIdLastFour county constituency ward ticketNumber countySlotNumber ticketStatus ticketPdfUrl ticketGeneratedAt status registeredAt summitEvent"
        )
        .lean();

    if (!registration) {
      throw new SummitServiceError(
        "No summit registration was found using this ticket number.",
        404,
        "REGISTRATION_NOT_FOUND"
      );
    }

    return registration;
  };

/* ==========================================
   VERIFY TICKET
========================================== */

export const verifySummitTicket = async ({
  ticketNumber,
  verificationCode = null,
}) => {
  const normalizedTicketNumber = String(
    ticketNumber
  )
    .trim()
    .toUpperCase();

  const query = {
    ticketNumber: normalizedTicketNumber,
  };

  if (verificationCode) {
    query.ticketVerificationCode = String(
      verificationCode
    ).trim();
  }

  const registration =
    await SummitRegistration.findOne(query)
      .populate(
        "summitEvent",
        "title shortTitle summitDate dateStatus venue"
      )
      .select(
        "+ticketVerificationCode fullName county constituency ward ticketNumber ticketStatus status registeredAt checkedIn checkedInAt summitEvent"
      )
      .lean();

  if (!registration) {
    return {
      valid: false,
      message:
        "The summit ticket is invalid or could not be found.",
    };
  }

  const valid =
    registration.status === "confirmed" &&
    registration.ticketStatus !== "cancelled" &&
    registration.ticketStatus !== "expired";

  return {
    valid,

    message: valid
      ? "This is a valid Coast Youth Summit ticket."
      : "This summit ticket is no longer active.",

    ticket: {
      ticketNumber:
        registration.ticketNumber,
      fullName: registration.fullName,
      county: registration.county,
      constituency:
        registration.constituency,
      ward: registration.ward,
      ticketStatus:
        registration.ticketStatus,
      checkedIn: registration.checkedIn,
      checkedInAt:
        registration.checkedInAt,
      registeredAt:
        registration.registeredAt,
      summitEvent:
        registration.summitEvent,
    },
  };
};

export { SummitServiceError };