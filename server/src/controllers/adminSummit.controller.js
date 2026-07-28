import mongoose from "mongoose";

import SummitEvent from "../models/summitEvent.model.js";
import SummitRegistration from "../models/summitRegistration.model.js";

import {
  sendSummitTicketEmail,
  resendSummitTicketEmail,
  sendSummitLogisticsEmail,
} from "../services/summitEmail.service.js";

import {
  ensureRegistrationTicket,
  regenerateRegistrationTicket,
} from "../services/summitTicket.service.js";



/* ==========================================
   CONSTANTS
========================================== */

const REGISTRATION_STATUSES = [
  "confirmed",
  "cancelled",
  "waitlisted",
];

const TICKET_STATUSES = [
  "active",
  "used",
  "cancelled",
  "expired",
];

const ALLOWED_SORT_FIELDS = [
  "registeredAt",
  "fullName",
  "county",
  "ticketNumber",
  "status",
  "checkedInAt",
];

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
    "ADMIN_SUMMIT_CONTROLLER_ERROR";

  if (statusCode >= 500) {
    console.error(
      "Admin summit controller error:",
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
      "An unexpected summit administration error occurred.",

    code,
  });
};

/* ==========================================
   CREATE SERVICE ERROR
========================================== */

const createControllerError = (
  message,
  statusCode,
  code
) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

/* ==========================================
   ESCAPE REGEX
========================================== */

const escapeRegex = (value = "") => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

/* ==========================================
   GET AUTHENTICATED ADMIN ID
========================================== */

const getAdminId = (req) => {
  return (
    req.user?._id ||
    req.user?.id ||
    null
  );
};

/* ==========================================
   GET ADMIN SUMMIT DASHBOARD
========================================== */

export const getAdminSummitDashboard =
  async (req, res, next) => {
    try {
      const {
        summitEventId,
      } = req.params;

      if (
        !mongoose.isValidObjectId(
          summitEventId
        )
      ) {
        throw createControllerError(
          "The summit event ID is invalid.",
          400,
          "INVALID_SUMMIT_EVENT_ID"
        );
      }

      const summitEvent =
        await SummitEvent.findById(
          summitEventId
        ).lean();

      if (!summitEvent) {
        throw createControllerError(
          "The summit event could not be found.",
          404,
          "SUMMIT_EVENT_NOT_FOUND"
        );
      }

      const [
        statusStatistics,
        participantStatistics,
        ticketStatistics,
        checkInStatistics,
        countyStatistics,
        recentRegistrations,
      ] = await Promise.all([
        SummitRegistration.aggregate([
          {
            $match: {
              summitEvent:
                summitEvent._id,
            },
          },
          {
            $group: {
              _id: "$status",
              total: {
                $sum: 1,
              },
            },
          },
        ]),

        SummitRegistration.aggregate([
          {
            $match: {
              summitEvent:
                summitEvent._id,
            },
          },
          {
            $group: {
              _id: "$participantType",
              total: {
                $sum: 1,
              },
            },
          },
        ]),

        SummitRegistration.aggregate([
          {
            $match: {
              summitEvent:
                summitEvent._id,
            },
          },
          {
            $group: {
              _id: "$ticketStatus",
              total: {
                $sum: 1,
              },
            },
          },
        ]),

        SummitRegistration.aggregate([
          {
            $match: {
              summitEvent:
                summitEvent._id,
            },
          },
          {
            $group: {
              _id: "$checkedIn",
              total: {
                $sum: 1,
              },
            },
          },
        ]),

        SummitRegistration.aggregate([
          {
            $match: {
              summitEvent:
                summitEvent._id,

              status: {
                $ne: "cancelled",
              },
            },
          },
          {
            $group: {
              _id: {
                county: "$county",
                countyCode:
                  "$countyCode",
              },

              registered: {
                $sum: 1,
              },

              checkedIn: {
                $sum: {
                  $cond: [
                    "$checkedIn",
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $sort: {
              registered: -1,
            },
          },
        ]),

        SummitRegistration.find({
          summitEvent:
            summitEvent._id,
        })
          .sort({
            registeredAt: -1,
          })
          .limit(10)
          .select(
            [
              "fullName",
              "email",
              "phone",
              "county",
              "ticketNumber",
              "participantType",
              "status",
              "ticketStatus",
              "checkedIn",
              "registeredAt",
            ].join(" ")
          )
          .lean(),
      ]);

      const statusMap = Object.fromEntries(
        statusStatistics.map(
          (item) => [
            item._id || "unknown",
            item.total,
          ]
        )
      );

      const participantMap =
        Object.fromEntries(
          participantStatistics.map(
            (item) => [
              item._id || "unknown",
              item.total,
            ]
          )
        );

      const ticketMap = Object.fromEntries(
        ticketStatistics.map(
          (item) => [
            item._id || "unknown",
            item.total,
          ]
        )
      );

      const checkInMap =
        Object.fromEntries(
          checkInStatistics.map(
            (item) => [
              String(item._id),
              item.total,
            ]
          )
        );

      return res.status(200).json({
        success: true,

        message:
          "Summit dashboard retrieved successfully.",

        data: {
          summitEvent,

          statistics: {
            totalCapacity:
              summitEvent.totalCapacity,

            totalRegistered:
              summitEvent.totalRegistered,

            remainingSlots:
              Math.max(
                0,
                summitEvent.totalCapacity -
                  summitEvent.totalRegistered
              ),

            confirmed:
              statusMap.confirmed || 0,

            cancelled:
              statusMap.cancelled || 0,

            waitlisted:
              statusMap.waitlisted || 0,

            members:
              participantMap.member || 0,

            publicParticipants:
              participantMap.public || 0,

            activeTickets:
              ticketMap.active || 0,

           checkedInTickets:
  ticketMap.checked_in || 0,

  checkedInTickets:
  ticketMap.checked_in || 0,

            cancelledTickets:
              ticketMap.cancelled || 0,

            checkedIn:
              checkInMap.true || 0,

            notCheckedIn:
              checkInMap.false || 0,
          },

          countyStatistics,

          recentRegistrations,
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
   LIST SUMMIT REGISTRATIONS
========================================== */

export const listSummitRegistrations =
  async (req, res, next) => {
    try {
      const {
        summitEventId,
      } = req.params;

      if (
        !mongoose.isValidObjectId(
          summitEventId
        )
      ) {
        throw createControllerError(
          "The summit event ID is invalid.",
          400,
          "INVALID_SUMMIT_EVENT_ID"
        );
      }

      const page = Math.max(
        1,
        Number(req.query.page) || 1
      );

      const limit = Math.min(
        100,
        Math.max(
          1,
          Number(req.query.limit) || 20
        )
      );

      const skip =
        (page - 1) * limit;

      const sortBy =
        ALLOWED_SORT_FIELDS.includes(
          req.query.sortBy
        )
          ? req.query.sortBy
          : "registeredAt";

      const sortOrder =
        req.query.sortOrder === "asc"
          ? 1
          : -1;

      const filter = {
        summitEvent:
          new mongoose.Types.ObjectId(
            summitEventId
          ),
      };

      if (req.query.county) {
        filter.county =
          req.query.county;
      }

      if (req.query.countyCode) {
        filter.countyCode =
          req.query.countyCode;
      }

      if (req.query.status) {
        filter.status =
          req.query.status;
      }

      if (
        req.query.participantType
      ) {
        filter.participantType =
          req.query.participantType;
      }

      if (req.query.ticketStatus) {
        filter.ticketStatus =
          req.query.ticketStatus;
      }

      if (
        req.query.checkedIn !==
        undefined
      ) {
        filter.checkedIn =
          String(
            req.query.checkedIn
          ).toLowerCase() === "true";
      }

      if (req.query.search) {
        const searchPattern =
          new RegExp(
            escapeRegex(
              req.query.search.trim()
            ),
            "i"
          );

        filter.$or = [
          {
            fullName:
              searchPattern,
          },
          {
            email:
              searchPattern,
          },
          {
            phone:
              searchPattern,
          },
          {
            ticketNumber:
              searchPattern,
          },
          {
            constituency:
              searchPattern,
          },
          {
            ward:
              searchPattern,
          },
        ];
      }

      const [
        registrations,
        total,
      ] = await Promise.all([
        SummitRegistration.find(
          filter
        )
          .populate({
            path: "member",
            select:
              "memberNumber membershipType membershipStatus",
          })
          .sort({
            [sortBy]: sortOrder,
          })
          .skip(skip)
          .limit(limit)
          .select(
            [
              "fullName",
              "email",
              "phone",
              "nationalIdLastFour",
              "county",
              "countyCode",
              "constituency",
              "ward",
              "participantType",
              "membershipInterest",
              "ticketNumber",
              "ticketStatus",
              "status",
              "checkedIn",
              "checkedInAt",
              "confirmationEmailSent",
              "confirmationEmailSentAt",
              "registeredAt",
              "member",
            ].join(" ")
          )
          .lean(),

        SummitRegistration.countDocuments(
          filter
        ),
      ]);

      const totalPages =
        Math.ceil(total / limit);

      return res.status(200).json({
        success: true,

        message:
          "Summit registrations retrieved successfully.",

        data: {
          registrations,

          pagination: {
            page,
            limit,
            total,
            totalPages,

            hasNextPage:
              page < totalPages,

            hasPreviousPage:
              page > 1,
          },
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
   GET ONE REGISTRATION
========================================== */

export const getAdminSummitRegistration =
  async (req, res, next) => {
    try {
      const {
        registrationId,
      } = req.params;

      if (
        !mongoose.isValidObjectId(
          registrationId
        )
      ) {
        throw createControllerError(
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
          })
          .populate({
            path: "member",
            select:
              "memberNumber membershipType membershipStatus firstName middleName lastName",
          })
          .populate({
            path: "user",
            select:
              "email role isActive",
          });

      if (!registration) {
        throw createControllerError(
          "The summit registration could not be found.",
          404,
          "REGISTRATION_NOT_FOUND"
        );
      }

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
   UPDATE REGISTRATION STATUS
========================================== */

export const updateSummitRegistrationStatus =
  async (req, res, next) => {
    try {
      const { registrationId } = req.params;

      const {
        status,
        reason,
        cancellationReason,
      } = req.body;

      if (
        !REGISTRATION_STATUSES.includes(status)
      ) {
        throw createControllerError(
          "The summit registration status is invalid.",
          400,
          "INVALID_REGISTRATION_STATUS"
        );
      }

      const registration =
        await SummitRegistration.findById(
          registrationId
        );

      if (!registration) {
        throw createControllerError(
          "The summit registration could not be found.",
          404,
          "REGISTRATION_NOT_FOUND"
        );
      }

      const previousStatus =
        registration.status;

      const statusReason =
        typeof reason === "string" &&
        reason.trim()
          ? reason.trim()
          : typeof cancellationReason ===
                "string" &&
              cancellationReason.trim()
            ? cancellationReason.trim()
            : null;

      registration.status = status;

      registration.statusReason =
        statusReason;

      registration.statusUpdatedAt =
        new Date();

      registration.statusUpdatedBy =
        getAdminId(req);

      if (status === "cancelled") {
        registration.ticketStatus =
          "cancelled";

        registration.cancelledAt =
          new Date();

        registration.cancellationReason =
          statusReason;

        registration.checkedIn = false;
        registration.checkedInAt = null;
        registration.checkedInBy = null;
      } else {
        registration.cancelledAt = null;
        registration.cancellationReason =
          null;
      }

      if (
        status === "confirmed" &&
        registration.ticketStatus ===
          "cancelled" &&
        previousStatus === "cancelled"
      ) {
        registration.ticketStatus =
          "active";
      }

      await registration.save();

      return res.status(200).json({
        success: true,
        message:
          "Summit registration status updated successfully.",
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
   UPDATE TICKET STATUS
========================================== */

export const updateSummitTicketStatus =
  async (req, res, next) => {
    try {
      const {
        registrationId,
      } = req.params;

      const {
        ticketStatus,
      } = req.body;

      if (
        !TICKET_STATUSES.includes(
          ticketStatus
        )
      ) {
        throw createControllerError(
          "The summit ticket status is invalid.",
          400,
          "INVALID_TICKET_STATUS"
        );
      }

      const registration =
        await SummitRegistration.findById(
          registrationId
        );

      if (!registration) {
        throw createControllerError(
          "The summit registration could not be found.",
          404,
          "REGISTRATION_NOT_FOUND"
        );
      }

      registration.ticketStatus =
        ticketStatus;

      if (
        ticketStatus === "cancelled" ||
        ticketStatus === "expired"
      ) {
        registration.checkedIn =
          false;

        registration.checkedInAt =
          null;

        registration.checkedInBy =
          null;
      }

     if (ticketStatus === "checked_in") {
        registration.checkedIn =
          true;

        registration.checkedInAt =
          registration.checkedInAt ||
          new Date();

        registration.checkedInBy =
          registration.checkedInBy ||
          getAdminId(req);
      }

      await registration.save();

      return res.status(200).json({
        success: true,

        message:
          "Summit ticket status updated successfully.",

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
   CHECK IN PARTICIPANT
========================================== */

export const checkInSummitParticipant =
  async (req, res, next) => {
    try {
      const {
        ticketNumber,
        verificationCode,
      } = req.body;

      const registration =
  await SummitRegistration.findOne({
    ticketNumber:
      String(ticketNumber)
        .trim()
        .toUpperCase(),
  }).select("+ticketVerificationCode");

      if (!registration) {
        throw createControllerError(
          "The summit ticket could not be found.",
          404,
          "TICKET_NOT_FOUND"
        );
      }

      if (
        verificationCode &&
       registration.ticketVerificationCode &&
        verificationCode !==
          registration.ticketVerificationCode
      ) {
        throw createControllerError(
          "The summit ticket verification code is invalid.",
          403,
          "INVALID_VERIFICATION_CODE"
        );
      }

      if (
        registration.status !==
        "confirmed"
      ) {
        throw createControllerError(
          "Only confirmed registrations can be checked in.",
          409,
          "REGISTRATION_NOT_CONFIRMED"
        );
      }

      if (
        registration.ticketStatus ===
          "cancelled" ||
        registration.ticketStatus ===
          "expired"
      ) {
        throw createControllerError(
          "This summit ticket is not active.",
          409,
          "TICKET_NOT_ACTIVE"
        );
      }

      if (registration.checkedIn) {
        return res.status(200).json({
          success: true,

          message:
            "This participant has already checked in.",

          data: {
            registration,
            alreadyCheckedIn: true,
          },
        });
      }

      const checkedInAt =
        new Date();

      registration.checkedIn =
        true;

      registration.checkedInAt =
        checkedInAt;

      registration.checkedInBy =
        getAdminId(req);

     registration.ticketStatus = "checked_in";

      await registration.save();

      return res.status(200).json({
        success: true,

        message:
          "Participant checked in successfully.",

        data: {
          registration,
          alreadyCheckedIn: false,
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
   RESEND TICKET EMAIL
========================================== */

export const resendRegistrationTicketEmail =
  async (req, res, next) => {
    try {
      const {
        registrationId,
      } = req.params;

      const result =
        await resendSummitTicketEmail({
          registrationId,
        });

      return res.status(200).json({
        success: true,

        message:
          "The summit ticket email has been resent successfully.",

        data: result,
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
   SEND FIRST TICKET EMAIL
========================================== */

export const sendRegistrationTicketEmail =
  async (req, res, next) => {
    try {
      const {
        registrationId,
      } = req.params;

      const result =
        await sendSummitTicketEmail({
          registrationId,
        });

      return res.status(200).json({
        success: true,

        message:
          result.skipped
            ? "The summit ticket email had already been sent."
            : "The summit ticket email was sent successfully.",

        data: result,
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
   SEND LOGISTICS EMAIL
========================================== */

export const sendRegistrationLogisticsEmail =
  async (req, res, next) => {
    try {
      const { registrationId } =
        req.params;

      const {
        subject,
        message,
      } = req.body;

      const result =
        await sendSummitLogisticsEmail({
          registrationId,
          subject,
          message,
        });

      return res.status(200).json({
        success: true,
        message:
          "The summit logistics email was sent successfully.",
        data: result,
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
   ENSURE REGISTRATION TICKET
========================================== */

export const generateRegistrationTicket =
  async (req, res, next) => {
    try {
      const {
        registrationId,
      } = req.params;

      const ticket =
        await ensureRegistrationTicket({
          registrationId,
        });

      return res.status(200).json({
        success: true,

        message:
          "The summit ticket is available.",

        data: {
          ticket,
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
   REGENERATE REGISTRATION TICKET
========================================== */

export const regenerateSummitTicket =
  async (req, res, next) => {
    try {
      const {
        registrationId,
      } = req.params;

      const ticket =
        await regenerateRegistrationTicket({
          registrationId,
        });

      return res.status(200).json({
        success: true,

        message:
          "The summit ticket was regenerated successfully.",

        data: {
          ticket,
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