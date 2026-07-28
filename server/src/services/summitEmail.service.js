import fs from "fs/promises";
import mongoose from "mongoose";
import { Resend } from "resend";

import SummitRegistration from "../models/summitRegistration.model.js";
import { summitTicketEmailTemplate } from "../templates/summitTicketEmail.template.js";
import { ensureRegistrationTicket } from "./summitTicket.service.js";
import {
  buildSummitLogisticsEmail,
} from "../templates/summitLogisticsEmail.template.js";

/* ==========================================
   CONFIGURATION
========================================== */

const FRONTEND_URL = (
  process.env.FRONTEND_URL || "http://localhost:5173"
).replace(/\/+$/, "");

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  "Jumuiya ya Vijana wa Pwani <admin@jvp.co.ke>";

const EMAIL_REPLY_TO =
  process.env.EMAIL_REPLY_TO || "admin@jvp.co.ke";

/* ==========================================
   CUSTOM ERROR
========================================== */

class SummitEmailServiceError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "SUMMIT_EMAIL_ERROR"
  ) {
    super(message);

    this.name = "SummitEmailServiceError";
    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace?.(
      this,
      SummitEmailServiceError
    );
  }
}

/* ==========================================
   RESEND CLIENT
========================================== */

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new SummitEmailServiceError(
      "RESEND_API_KEY is missing from the environment variables.",
      500,
      "RESEND_API_KEY_MISSING"
    );
  }

  if (!EMAIL_FROM) {
    throw new SummitEmailServiceError(
      "EMAIL_FROM is missing from the environment variables.",
      500,
      "EMAIL_FROM_MISSING"
    );
  }

  return new Resend(apiKey);
};

/* ==========================================
   VALIDATE REGISTRATION ID
========================================== */

const validateRegistrationId = (registrationId) => {
  if (!registrationId) {
    throw new SummitEmailServiceError(
      "The summit registration ID is required.",
      400,
      "REGISTRATION_ID_REQUIRED"
    );
  }

  if (!mongoose.isValidObjectId(registrationId)) {
    throw new SummitEmailServiceError(
      "The summit registration ID is invalid.",
      400,
      "INVALID_REGISTRATION_ID"
    );
  }
};

/* ==========================================
   LOAD REGISTRATION
========================================== */

const loadRegistrationForEmail = async (
  registrationId
) => {
  validateRegistrationId(registrationId);

  const registration =
    await SummitRegistration.findById(
      registrationId
    )
      .populate({
        path: "summitEvent",
        select: [
          "title",
          "shortTitle",
          "summitDate",
          "dateStatus",
          "venue",
          "logisticsMessage",
          "contactEmail",
          "contactPhone",
        ].join(" "),
      })
      .select(
        [
          "fullName",
          "email",
          "phone",
          "nationalIdLastFour",
          "county",
          "constituency",
          "ward",
          "ticketNumber",
          "ticketStatus",
          "ticketPdfPath",
          "ticketPdfUrl",
          "ticketGeneratedAt",
          "confirmationEmailSent",
          "confirmationEmailSentAt",
          "confirmationEmailAttempts",
          "status",
          "registeredAt",
          "summitEvent",
        ].join(" ")
      );

  if (!registration) {
    throw new SummitEmailServiceError(
      "The summit registration could not be found.",
      404,
      "REGISTRATION_NOT_FOUND"
    );
  }

  if (!registration.email) {
    throw new SummitEmailServiceError(
      "The participant does not have an email address.",
      400,
      "PARTICIPANT_EMAIL_MISSING"
    );
  }

  if (!registration.ticketNumber) {
    throw new SummitEmailServiceError(
      "The registration does not have a summit ticket number.",
      409,
      "TICKET_NUMBER_MISSING"
    );
  }

  if (!registration.summitEvent) {
    throw new SummitEmailServiceError(
      "The summit event linked to this registration could not be found.",
      404,
      "SUMMIT_EVENT_NOT_FOUND"
    );
  }

  if (registration.status === "cancelled") {
    throw new SummitEmailServiceError(
      "An email cannot be sent for a cancelled registration.",
      409,
      "REGISTRATION_CANCELLED"
    );
  }

  if (
    registration.ticketStatus === "cancelled" ||
    registration.ticketStatus === "expired"
  ) {
    throw new SummitEmailServiceError(
      "This summit ticket is no longer active.",
      409,
      "TICKET_NOT_ACTIVE"
    );
  }

  return registration;
};

/* ==========================================
   RECORD EMAIL FAILURE
========================================== */

const recordEmailFailure = async ({
  registrationId,
  error,
}) => {
  try {
    await SummitRegistration.findByIdAndUpdate(
      registrationId,
      {
        $inc: {
          confirmationEmailAttempts: 1,
        },

        $set: {
          confirmationEmailError: String(
            error?.message || error
          ).slice(0, 1000),
        },
      }
    );
  } catch (databaseError) {
    console.error(
      "Failed to record summit email error:",
      databaseError
    );
  }
};

/* ==========================================
   RECORD EMAIL SUCCESS
========================================== */

const recordEmailSuccess = async ({
  registrationId,
}) => {
  const sentAt = new Date();

  await SummitRegistration.findByIdAndUpdate(
    registrationId,
    {
      $inc: {
        confirmationEmailAttempts: 1,
      },

      $set: {
        confirmationEmailSent: true,
        confirmationEmailSentAt: sentAt,
        confirmationEmailError: null,
        lastCommunicationAt: sentAt,
      },
    },
    {
      runValidators: true,
    }
  );

  return sentAt;
};

/* ==========================================
   CREATE TICKET ATTACHMENT
========================================== */

const createTicketAttachment = async ({
  registration,
  ticket,
}) => {
  if (!ticket?.ticketPdfPath) {
    throw new SummitEmailServiceError(
      "The summit ticket PDF path is missing.",
      500,
      "TICKET_PDF_PATH_MISSING"
    );
  }

  let pdfBuffer;

  try {
    pdfBuffer = await fs.readFile(
      ticket.ticketPdfPath
    );
  } catch (error) {
    throw new SummitEmailServiceError(
      `The summit ticket PDF could not be read: ${error.message}`,
      500,
      "TICKET_PDF_READ_FAILED"
    );
  }

  const filename = `${registration.ticketNumber.replace(
    /\//g,
    "-"
  )}.pdf`;

  return {
    filename,
    content: pdfBuffer.toString("base64"),
  };
};

/* ==========================================
   SEND EMAIL THROUGH RESEND
========================================== */

const sendEmailThroughResend = async ({
  to,
  subject,
  html,
  text = "",
  attachments = [],
  headers = {},
}) => {
  if (!to) {
    throw new SummitEmailServiceError(
      "The email recipient is required.",
      400,
      "EMAIL_RECIPIENT_REQUIRED"
    );
  }

  if (!subject) {
    throw new SummitEmailServiceError(
      "The email subject is required.",
      400,
      "EMAIL_SUBJECT_REQUIRED"
    );
  }

  if (!html) {
    throw new SummitEmailServiceError(
      "The email HTML content is required.",
      400,
      "EMAIL_CONTENT_REQUIRED"
    );
  }

  const resend = getResendClient();

  const emailPayload = {
    from: EMAIL_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  };

  if (EMAIL_REPLY_TO) {
    emailPayload.replyTo = EMAIL_REPLY_TO;
  }

  if (
    Array.isArray(attachments) &&
    attachments.length > 0
  ) {
    emailPayload.attachments = attachments;
  }

  if (
    headers &&
    Object.keys(headers).length > 0
  ) {
    emailPayload.headers = headers;
  }

  const response =
    await resend.emails.send(emailPayload);

  if (response?.error) {
    throw new SummitEmailServiceError(
      response.error.message ||
        "Resend rejected the email.",
      502,
      "RESEND_EMAIL_REJECTED"
    );
  }

  if (!response?.data?.id) {
    throw new SummitEmailServiceError(
      "Resend did not return an email message ID.",
      502,
      "RESEND_MESSAGE_ID_MISSING"
    );
  }

  return response.data;
};

/* ==========================================
   BUILD REGISTRATION URL
========================================== */

const buildRegistrationSuccessUrl = (
  ticketNumber
) => {
  return (
    `${FRONTEND_URL}/summit/registration-success` +
    `?ticket=${encodeURIComponent(ticketNumber)}`
  );
};

/* ==========================================
   BUILD TEMPLATE DATA
========================================== */

const buildTicketEmailTemplate = ({
  registration,
  ticket,
}) => {
  const registrationUrl =
    buildRegistrationSuccessUrl(
      registration.ticketNumber
    );

  return summitTicketEmailTemplate({
    participant: {
      fullName: registration.fullName,
      email: registration.email,
      phone: registration.phone,

      nationalIdMasked:
        registration.nationalIdLastFour
          ? `*****${registration.nationalIdLastFour}`
          : "Not available",

      county: registration.county,
      constituency: registration.constituency,
      ward: registration.ward,
    },

    ticket: {
      ticketNumber: registration.ticketNumber,
      ticketPdfUrl: ticket.ticketPdfUrl || null,
      verificationUrl:
        ticket.verificationUrl || null,
      registrationUrl,
    },

    summitEvent: {
      title:
        registration.summitEvent.title,

      shortTitle:
        registration.summitEvent.shortTitle,

      summitDate:
        registration.summitEvent.summitDate,

      dateStatus:
        registration.summitEvent.dateStatus,

      venue:
        registration.summitEvent.venue,

      logisticsMessage:
        registration.summitEvent
          .logisticsMessage,

      contactEmail:
        registration.summitEvent.contactEmail,

      contactPhone:
        registration.summitEvent.contactPhone,
    },
  });
};

/* ==========================================
   SEND SUMMIT TICKET EMAIL
========================================== */

export const sendSummitTicketEmail = async ({
  registrationId,
  forceSend = false,
}) => {
  const registration =
    await loadRegistrationForEmail(
      registrationId
    );

  if (
    registration.confirmationEmailSent &&
    !forceSend
  ) {
    return {
      sent: true,
      skipped: true,

      reason:
        "The summit ticket email has already been sent.",

      registrationId:
        registration._id,

      ticketNumber:
        registration.ticketNumber,

      recipient:
        registration.email,

      messageId: null,

      sentAt:
        registration.confirmationEmailSentAt,
    };
  }

  try {
    const ticket =
      await ensureRegistrationTicket({
        registrationId:
          registration._id.toString(),
      });

    const attachment =
      await createTicketAttachment({
        registration,
        ticket,
      });

    const template =
      buildTicketEmailTemplate({
        registration,
        ticket,
      });

    if (
      !template ||
      !template.subject ||
      !template.html
    ) {
      throw new SummitEmailServiceError(
        "The summit ticket email template is invalid.",
        500,
        "INVALID_EMAIL_TEMPLATE"
      );
    }

    const emailData =
      await sendEmailThroughResend({
        to: registration.email,

        subject:
          template.subject,

        html:
          template.html,

        text:
          template.text || "",

        attachments: [
          attachment,
        ],

        headers: {
          "X-Entity-Ref-ID":
            registration._id.toString(),

          "X-Summit-Ticket":
            registration.ticketNumber,

          "X-Summit-Message-Type":
            "ticket",
        },
      });

    const sentAt =
      await recordEmailSuccess({
        registrationId:
          registration._id,
      });

    return {
      sent: true,
      skipped: false,

      registrationId:
        registration._id,

      ticketNumber:
        registration.ticketNumber,

      recipient:
        registration.email,

      messageId:
        emailData.id,

      sentAt,
    };
  } catch (error) {
    await recordEmailFailure({
      registrationId:
        registration._id,

      error,
    });

    if (
      error instanceof
      SummitEmailServiceError
    ) {
      throw error;
    }

    throw new SummitEmailServiceError(
      `The summit ticket email could not be delivered: ${error.message}`,
      502,
      "SUMMIT_EMAIL_DELIVERY_FAILED"
    );
  }
};

/* ==========================================
   RESEND SUMMIT TICKET EMAIL
========================================== */

export const resendSummitTicketEmail = async ({
  registrationId,
}) => {
  return sendSummitTicketEmail({
    registrationId,
    forceSend: true,
  });
};

/* ==========================================
   SEND SUMMIT LOGISTICS EMAIL
========================================== */

export const sendSummitLogisticsEmail =
  async ({
    registrationId,
    subject,
    message,
  }) => {
    const registration =
      await loadRegistrationForEmail(
        registrationId
      );

    if (
      typeof subject !== "string" ||
      !subject.trim()
    ) {
      throw new SummitEmailServiceError(
        "The logistics email subject is required.",
        400,
        "LOGISTICS_EMAIL_SUBJECT_REQUIRED"
      );
    }

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      throw new SummitEmailServiceError(
        "The logistics message is required.",
        400,
        "LOGISTICS_EMAIL_CONTENT_REQUIRED"
      );
    }

    try {
      const template =
        buildSummitLogisticsEmail({
          fullName:
            registration.fullName,

          ticketNumber:
            registration.ticketNumber,

          subject:
            subject.trim(),

          message:
            message.trim(),

          summitEvent:
            registration.summitEvent,

          ticketPdfUrl:
            registration.ticketPdfUrl,
        });

      if (
        !template ||
        !template.subject ||
        !template.html
      ) {
        throw new SummitEmailServiceError(
          "The summit logistics email template is invalid.",
          500,
          "INVALID_LOGISTICS_EMAIL_TEMPLATE"
        );
      }

      const emailData =
        await sendEmailThroughResend({
          to: registration.email,

          subject:
            template.subject,

          html:
            template.html,

          text:
            template.text || message.trim(),

          headers: {
            "X-Entity-Ref-ID":
              registration._id.toString(),

            "X-Summit-Ticket":
              registration.ticketNumber,

            "X-Summit-Message-Type":
              "logistics",
          },
        });

      const sentAt = new Date();

      await SummitRegistration.findByIdAndUpdate(
        registration._id,
        {
          $set: {
            logisticsEmailSent: true,
            lastCommunicationAt: sentAt,
          },
        },
        {
          runValidators: true,
        }
      );

      return {
        sent: true,

        registrationId:
          registration._id,

        ticketNumber:
          registration.ticketNumber,

        recipient:
          registration.email,

        messageId:
          emailData.id,

        sentAt,
      };
    } catch (error) {
      if (
        error instanceof
        SummitEmailServiceError
      ) {
        throw error;
      }

      throw new SummitEmailServiceError(
        `The summit logistics email could not be delivered: ${error.message}`,
        502,
        "LOGISTICS_EMAIL_DELIVERY_FAILED"
      );
    }
  };

/* ==========================================
   EXPORT ERROR CLASS
========================================== */

export {
  SummitEmailServiceError,
};