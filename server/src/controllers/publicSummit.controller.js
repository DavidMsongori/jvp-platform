import fs from "fs/promises";
import path from "path";

import {
  registerForSummit,
  getPublicSummitDetails,
  getRegistrationByTicketNumber,
  verifySummitTicket,
} from "../services/summitRegistration.service.js";

import {
  ensureRegistrationTicket,
} from "../services/summitTicket.service.js";

import SummitRegistration from "../models/summitRegistration.model.js";

/* ==========================================
   CONTROLLER ERROR HANDLER
========================================== */

const handleControllerError = (
  error,
  res,
  next
) => {
  const statusCode =
    error.statusCode ||
    error.status ||
    500;

  const code =
    error.code ||
    "SUMMIT_CONTROLLER_ERROR";

  if (statusCode >= 500) {
    console.error(
      "Public summit controller error:",
      error
    );
  }

  if (res.headersSent) {
    return next(error);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      error.message ||
      "An unexpected summit error occurred.",
    code,
  });
};


const normalizePhone = (value) => {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[()-]/g, "");

  if (cleaned.startsWith("+254")) {
    return cleaned;
  }

  if (cleaned.startsWith("254")) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith("0")) {
    return `+254${cleaned.slice(1)}`;
  }

  return cleaned;
};

const sanitizePublicRegistration = (
  registration
) => {
  const data =
    typeof registration?.toObject ===
    "function"
      ? registration.toObject()
      : { ...registration };

  delete data.nationalId;
  delete data.nationalIdLastFour;
  delete data.ticketVerificationCode;
  delete data.ticketPdfPath;
  delete data.ipAddress;
  delete data.userAgent;
  delete data.__v;
  delete data.checkedInBy;
delete data.confirmationEmailAttempts;
delete data.confirmationEmailSentAt;
delete data.logisticsEmailSent;
delete data.logisticsSmsSent;
delete data.lastCommunicationAt;
delete data.createdBy;
delete data.createdAt;
delete data.updatedAt;

  return data;
};


/* ==========================================
   GET PUBLIC SUMMIT DETAILS
========================================== */

export const getPublicSummit = async (
  req,
  res,
  next
) => {
  try {
    const {
      summitEventId,
      slug,
    } = req.params;

   const summit = await getPublicSummitDetails({
  eventId:
    req.params.summitEventId ||
    undefined,

  slug:
    req.params.slug ||
    undefined,
});

    return res.status(200).json({
      success: true,
      message:
        "Summit details retrieved successfully.",
      data: {
        summit,
      },
    });
  } catch (error) {
    return handleControllerError(
      error,
      res,
      next
    );
  }
};

/* ==========================================
   REGISTER SUMMIT PARTICIPANT
========================================== */

export const registerSummitParticipant =
  async (req, res, next) => {
    try {
      const authenticatedUser =
        req.user || null;

      const registrationPayload = {
        ...req.body,

        userId:
          authenticatedUser?._id ||
          authenticatedUser?.id ||
          req.body.userId ||
          null,

        ipAddress:
          req.ip ||
          req.headers[
            "x-forwarded-for"
          ] ||
          req.socket?.remoteAddress ||
          null,

        userAgent:
          req.get("user-agent") ||
          null,
      };

      const result = await registerForSummit({
  summitEventId: req.body.summitEventId,

  payload: {
    ...req.body,

    consentedToCommunication:
      req.body.consentedToCommunication ??
      req.body.communicationConsent ??
      false,
  },

  userId:
    req.user?._id ||
    req.user?.id ||
    req.body.userId ||
    req.body.user ||
    null,

 memberId:
  req.body.memberId ||
  req.body.member ||
  null,

  requestMeta: {
    ipAddress:
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      null,

    userAgent:
      req.get("user-agent") ||
      null,
  },
});

      return res.status(201).json({
        success: true,

        message:
          "Your summit registration has been completed successfully.",

        data: {
          registration:
            result.registration,

          ticket:
            result.ticket || null,

          email:
            result.email || null,
        },
      });
    } catch (error) {
      return handleControllerError(
        error,
        res,
        next
      );
    }
  };

/* ==========================================
   GET REGISTRATION BY TICKET NUMBER
========================================== */

export const getSummitRegistrationByTicket =
  async (req, res, next) => {
    try {
      const ticketNumber =
        req.params.ticketNumber;

      const registration =
        await getRegistrationByTicketNumber({
          ticketNumber,
        });

      return res.status(200).json({
        success: true,

        message:
          "Summit registration retrieved successfully.",

        data: {
          registration,
        },
      });
    } catch (error) {
      return handleControllerError(
        error,
        res,
        next
      );
    }
  };

/* ==========================================
   LOOKUP REGISTRATION BY EMAIL
========================================== */

export const getSummitRegistrationByEmail =
  async (req, res, next) => {
    try {
      const email = String(
        req.params.email || ""
      )
        .trim()
        .toLowerCase();

      const nationalIdLastFour =
        String(
          req.query.nationalIdLastFour ||
            ""
        )
          .trim()
          .toUpperCase();

      const registration =
        await SummitRegistration.findOne({
          email,
          nationalIdLastFour,
        })
          .populate(
            "summitEvent",
            "title name slug startDate eventDate date venue location"
          )
          .lean();

      if (!registration) {
        return res.status(404).json({
          success: false,
          message:
            "No summit registration was found using those details.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Summit registration retrieved successfully.",
        data: {
          registration:
            sanitizePublicRegistration(
              registration
            ),
        },
      });
    } catch (error) {
      next(error);
    }
  };

/* ==========================================
   LOOKUP REGISTRATION BY PHONE
========================================== */

export const getSummitRegistrationByPhone =
  async (req, res, next) => {
    try {
      const phone =
        normalizePhone(
          req.params.phone
        );

      const nationalIdLastFour =
        String(
          req.query.nationalIdLastFour ||
            ""
        )
          .trim()
          .toUpperCase();

      const registration =
        await SummitRegistration.findOne({
          phone,
          nationalIdLastFour,
        })
          .populate(
            "summitEvent",
            "title name slug startDate eventDate date venue location"
          )
          .lean();

      if (!registration) {
        return res.status(404).json({
          success: false,
          message:
            "No summit registration was found using those details.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Summit registration retrieved successfully.",
        data: {
          registration:
            sanitizePublicRegistration(
              registration
            ),
        },
      });
    } catch (error) {
      next(error);
    }
  };  


/* ==========================================
   VERIFY SUMMIT TICKET
========================================== */

export const verifyPublicSummitTicket =
  async (req, res, next) => {
    try {
      const ticketNumber =
        req.params.ticketNumber;

      const verificationCode =
        req.query.code ||
        req.body?.verificationCode ||
        null;

      const verification =
        await verifySummitTicket({
          ticketNumber,
          verificationCode,
        });

      return res.status(200).json({
        success: true,

        message:
          verification.valid
            ? "The summit ticket is valid."
            : "The summit ticket could not be verified.",

        data: {
          verification,
        },
      });
    } catch (error) {
      return handleControllerError(
        error,
        res,
        next
      );
    }
  };

/* ==========================================
   DOWNLOAD SUMMIT TICKET
========================================== */

export const downloadSummitTicket =
  async (req, res, next) => {
    try {
      const ticketNumber =
        req.params.ticketNumber;

      const registration =
        await getRegistrationByTicketNumber({
          ticketNumber,
        });

      if (!registration?._id) {
        const error = new Error(
          "The summit registration could not be found."
        );

        error.statusCode = 404;
        error.code =
          "REGISTRATION_NOT_FOUND";

        throw error;
      }

      const ticket =
        await ensureRegistrationTicket({
          registrationId:
            registration._id.toString(),
        });

      if (!ticket?.ticketPdfPath) {
        const error = new Error(
          "The summit ticket PDF is unavailable."
        );

        error.statusCode = 404;
        error.code =
          "TICKET_PDF_NOT_FOUND";

        throw error;
      }

      try {
        await fs.access(
          ticket.ticketPdfPath
        );
      } catch {
        const error = new Error(
          "The summit ticket PDF file could not be found."
        );

        error.statusCode = 404;
        error.code =
          "TICKET_FILE_NOT_FOUND";

        throw error;
      }

      const filename =
        `${registration.ticketNumber.replace(
          /\//g,
          "-"
        )}.pdf`;

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.setHeader(
        "Cache-Control",
        "private, no-store, max-age=0"
      );

      return res.sendFile(
        path.resolve(
          ticket.ticketPdfPath
        )
      );
    } catch (error) {
      return handleControllerError(
        error,
        res,
        next
      );
    }
  };