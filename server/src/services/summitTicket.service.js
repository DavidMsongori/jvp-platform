import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";

import SummitRegistration from "../models/summitRegistration.model.js";

import { generateSummitTicketPdf } from "../utils/generateSummitTicketPDF.js";

/* ==========================================
   CONFIGURATION
========================================== */

const TICKET_UPLOAD_DIRECTORY =
  process.env.SUMMIT_TICKET_UPLOAD_DIR ||
  path.join(
    process.cwd(),
    "src",
    "uploads",
    "summit-tickets"
  );

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const FRONTEND_URL = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
).replace(/\/$/, "");

/* ==========================================
   SERVICE ERROR
========================================== */

class SummitTicketServiceError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "SUMMIT_TICKET_ERROR"
  ) {
    super(message);

    this.name = "SummitTicketServiceError";
    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace?.(
      this,
      SummitTicketServiceError
    );
  }
}

/* ==========================================
   FILE HELPERS
========================================== */

const ensureTicketDirectory = async () => {
  await fs.mkdir(TICKET_UPLOAD_DIRECTORY, {
    recursive: true,
  });
};

const sanitizeTicketFileName = (
  ticketNumber
) =>
  ticketNumber
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "");

const buildTicketFileName = (
  ticketNumber
) =>
  `${sanitizeTicketFileName(
    ticketNumber
  )}.pdf`;

const buildTicketPdfUrl = (
  fileName
) =>
  `${BACKEND_URL}/uploads/summit-tickets/${fileName}`;

const buildVerificationUrl = ({
  ticketNumber,
  verificationCode,
}) => {
  const params = new URLSearchParams({
    ticket: ticketNumber,
    code: verificationCode,
  });

  return `${FRONTEND_URL}/summit/verify?${params.toString()}`;
};

/* ==========================================
   LOAD REGISTRATION FOR TICKET
========================================== */

const loadRegistrationForTicket = async (
  registrationId
) => {
  if (!mongoose.isValidObjectId(registrationId)) {
    throw new SummitTicketServiceError(
      "The summit registration ID is invalid.",
      400,
      "INVALID_REGISTRATION_ID"
    );
  }

  const registration =
    await SummitRegistration.findById(
      registrationId
    )
      .populate({
        path: "summitEvent",
        select:
          "title shortTitle year summitDate dateStatus venue logisticsMessage contactEmail contactPhone",
      })
      .select(
        "+ticketVerificationCode fullName email phone nationalIdLastFour county countyCode constituency ward ticketNumber countySlotNumber ticketStatus ticketPdfPath ticketPdfUrl ticketGeneratedAt registeredAt status summitEvent"
      );

  if (!registration) {
    throw new SummitTicketServiceError(
      "The summit registration could not be found.",
      404,
      "REGISTRATION_NOT_FOUND"
    );
  }

  if (!registration.summitEvent) {
    throw new SummitTicketServiceError(
      "The summit event linked to this registration could not be found.",
      404,
      "SUMMIT_EVENT_NOT_FOUND"
    );
  }

  if (registration.status === "cancelled") {
    throw new SummitTicketServiceError(
      "A ticket cannot be generated for a cancelled registration.",
      409,
      "REGISTRATION_CANCELLED"
    );
  }

  if (
    registration.ticketStatus === "cancelled"
  ) {
    throw new SummitTicketServiceError(
      "This summit ticket has been cancelled.",
      409,
      "TICKET_CANCELLED"
    );
  }

  return registration;
};

/* ==========================================
   CHECK FILE
========================================== */

const fileExists = async (filePath) => {
  if (!filePath) {
    return false;
  }

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/* ==========================================
   GENERATE REGISTRATION TICKET
========================================== */

export const generateRegistrationTicket =
  async ({
    registrationId,
    forceRegenerate = false,
  }) => {
    const registration =
      await loadRegistrationForTicket(
        registrationId
      );

    if (
      !forceRegenerate &&
      registration.ticketPdfPath &&
      (await fileExists(
        registration.ticketPdfPath
      ))
    ) {
      return {
        registrationId:
          registration._id,
        ticketNumber:
          registration.ticketNumber,
        ticketPdfPath:
          registration.ticketPdfPath,
        ticketPdfUrl:
          registration.ticketPdfUrl,
        ticketGeneratedAt:
          registration.ticketGeneratedAt,
        verificationUrl:
          buildVerificationUrl({
            ticketNumber:
              registration.ticketNumber,
            verificationCode:
              registration.ticketVerificationCode,
          }),
        regenerated: false,
      };
    }

    await ensureTicketDirectory();

    const fileName = buildTicketFileName(
      registration.ticketNumber
    );

    const outputPath = path.join(
      TICKET_UPLOAD_DIRECTORY,
      fileName
    );

    const ticketPdfUrl =
      buildTicketPdfUrl(fileName);

    const verificationUrl =
      buildVerificationUrl({
        ticketNumber:
          registration.ticketNumber,
        verificationCode:
          registration.ticketVerificationCode,
      });

    try {
      await generateSummitTicketPdf({
        registration: {
          id: registration._id.toString(),
          fullName: registration.fullName,
          email: registration.email,
          phone: registration.phone,

          nationalIdMasked: `*****${registration.nationalIdLastFour}`,

          county: registration.county,
          countyCode:
            registration.countyCode,

          constituency:
            registration.constituency,

          ward: registration.ward,

          ticketNumber:
            registration.ticketNumber,

          countySlotNumber:
            registration.countySlotNumber,

          ticketStatus:
            registration.ticketStatus,

          registeredAt:
            registration.registeredAt,
        },

        summitEvent: {
          id: registration.summitEvent._id.toString(),

          title:
            registration.summitEvent.title,

          shortTitle:
            registration.summitEvent
              .shortTitle,

          year:
            registration.summitEvent.year,

          summitDate:
            registration.summitEvent
              .summitDate,

          dateStatus:
            registration.summitEvent
              .dateStatus,

          venue:
            registration.summitEvent.venue,

          logisticsMessage:
            registration.summitEvent
              .logisticsMessage,

          contactEmail:
            registration.summitEvent
              .contactEmail,

          contactPhone:
            registration.summitEvent
              .contactPhone,
        },

        verificationUrl,
        outputPath,
      });
    } catch (error) {
      try {
        await fs.unlink(outputPath);
      } catch {
        // Ignore cleanup error when no file exists.
      }

      throw new SummitTicketServiceError(
        `The summit PDF ticket could not be generated: ${error.message}`,
        500,
        "PDF_GENERATION_FAILED"
      );
    }

    const generatedAt = new Date();

    const updateResult =
  await SummitRegistration.updateOne(
    {
      _id: registration._id,
    },
    {
      $set: {
        ticketPdfPath: outputPath,
        ticketPdfUrl,
        ticketGeneratedAt:
          generatedAt,
      },
    }
  );

    return {
      registrationId: registration._id,
      ticketNumber:
        registration.ticketNumber,
      ticketPdfPath: outputPath,
      ticketPdfUrl,
      ticketGeneratedAt: generatedAt,
      verificationUrl,
      regenerated:
        Boolean(forceRegenerate),
    };
  };

/* ==========================================
   GET TICKET INFORMATION
========================================== */

export const getRegistrationTicket =
  async ({ registrationId }) => {
    const registration =
      await loadRegistrationForTicket(
        registrationId
      );

    const hasPdf = await fileExists(
      registration.ticketPdfPath
    );

    return {
      registrationId:
        registration._id,
      ticketNumber:
        registration.ticketNumber,
      ticketStatus:
        registration.ticketStatus,

      ticketPdfPath: hasPdf
        ? registration.ticketPdfPath
        : null,

      ticketPdfUrl: hasPdf
        ? registration.ticketPdfUrl
        : null,

      ticketGeneratedAt: hasPdf
        ? registration.ticketGeneratedAt
        : null,

      verificationUrl:
        buildVerificationUrl({
          ticketNumber:
            registration.ticketNumber,
          verificationCode:
            registration.ticketVerificationCode,
        }),

      downloadAvailable: hasPdf,
    };
  };

/* ==========================================
   ENSURE TICKET EXISTS
========================================== */

export const ensureRegistrationTicket =
  async ({ registrationId }) => {
    const ticket =
      await getRegistrationTicket({
        registrationId,
      });

    if (ticket.downloadAvailable) {
      return ticket;
    }

    return generateRegistrationTicket({
      registrationId,
    });
  };

/* ==========================================
   READ TICKET FILE
========================================== */

export const readRegistrationTicketFile =
  async ({ registrationId }) => {
    const ticket =
      await ensureRegistrationTicket({
        registrationId,
      });

    try {
      const buffer = await fs.readFile(
        ticket.ticketPdfPath
      );

      return {
        ...ticket,

        fileName:
          buildTicketFileName(
            ticket.ticketNumber
          ),

        contentType: "application/pdf",
        buffer,
      };
    } catch (error) {
      throw new SummitTicketServiceError(
        `The summit ticket file could not be read: ${error.message}`,
        500,
        "TICKET_FILE_READ_FAILED"
      );
    }
  };

/* ==========================================
   REGENERATE TICKET
========================================== */

export const regenerateRegistrationTicket =
  async ({ registrationId }) =>
    generateRegistrationTicket({
      registrationId,
      forceRegenerate: true,
    });

export { SummitTicketServiceError };