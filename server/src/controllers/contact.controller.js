/* =========================================================
   CONTACT CONTROLLER
========================================================= */

import * as contactService from "../services/contact.service.js";

/* =========================================================
   HELPERS
========================================================= */

/**
 * Get authenticated user ID.
 */
const getUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

/**
 * Get request IP address.
 */
const getIpAddress = (req) => {
  return (
    req.headers["x-forwarded-for"]
      ?.split(",")[0]
      ?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    null
  );
};

/**
 * Handle controller errors consistently.
 */
const handleError = (
  res,
  error,
  fallbackMessage
) => {
  console.error(
    fallbackMessage,
    error
  );

  const statusCode =
    error.statusCode ||
    (error.name ===
    "ValidationError"
      ? 400
      : 500);

  return res.status(statusCode).json({
    success: false,

    message:
      error.message ||
      fallbackMessage,

    errors:
      error.errors || undefined,

    error:
      process.env.NODE_ENV ===
      "development"
        ? error.message
        : undefined,
  });
};

/* =========================================================
   PUBLIC
========================================================= */

/**
 * Submit a contact enquiry.
 *
 * POST /api/contact
 */
export const createContact = async (
  req,
  res
) => {
  try {
    const contact =
      await contactService.createContact(
        req.body,
        {
          ipAddress:
            getIpAddress(req),

          userAgent:
            req.headers[
              "user-agent"
            ],

          source:
            req.body?.source ||
            "website",
        }
      );

    return res.status(201).json({
      success: true,

      message:
        "Your message has been received successfully. The JVP Secretariat will get back to you.",

      contact: {
        id: contact._id,
        reference:
          contact._id
            .toString(),
        status:
          contact.status,
        createdAt:
          contact.createdAt,
      },
    });
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to submit your message."
    );
  }
};

/* =========================================================
   ADMIN
========================================================= */

/**
 * Get contact enquiries.
 *
 * GET /api/contact/admin/all
 */
export const getAdminContacts =
  async (req, res) => {
    try {
      const {
        page,
        limit,
        search,
        status,
        category,
        priority,
        assignedTo,
        sortBy,
        sortOrder,
      } = req.query;

      const result =
        await contactService.getAdminContacts(
          {
            page,
            limit,
            search,
            status,
            category,
            priority,
            assignedTo,
            sortBy,
            sortOrder,
          }
        );

      return res.status(200).json({
        success: true,

        contacts:
          result.contacts,

        pagination:
          result.pagination,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to fetch contact enquiries."
      );
    }
  };

/**
 * Get a single contact enquiry.
 *
 * GET /api/contact/:id
 */
export const getContactById =
  async (req, res) => {
    try {
      const contact =
        await contactService.getContactById(
          req.params.id
        );

      return res.status(200).json({
        success: true,
        contact,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to fetch contact enquiry."
      );
    }
  };

/* =========================================================
   STATUS
========================================================= */

/**
 * Mark contact as read.
 *
 * PATCH /api/contact/:id/read
 */
export const markContactAsRead =
  async (req, res) => {
    try {
      const userId =
        getUserId(req);

      const contact =
        await contactService.markContactAsRead(
          req.params.id,
          userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Contact enquiry marked as read.",

        contact,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to mark contact enquiry as read."
      );
    }
  };

/**
 * Mark contact as in progress.
 *
 * PATCH /api/contact/:id/in-progress
 */
export const markContactInProgress =
  async (req, res) => {
    try {
      const contact =
        await contactService.markContactInProgress(
          req.params.id
        );

      return res.status(200).json({
        success: true,

        message:
          "Contact enquiry marked as in progress.",

        contact,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to update contact enquiry."
      );
    }
  };

/**
 * Update contact status.
 *
 * PATCH /api/contact/:id/status
 */
export const updateContactStatus =
  async (req, res) => {
    try {
      const {
        status,
      } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message:
            "Contact status is required.",
        });
      }

      const contact =
        await contactService.updateContactStatus(
          req.params.id,
          status
        );

      return res.status(200).json({
        success: true,

        message:
          "Contact status updated successfully.",

        contact,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to update contact status."
      );
    }
  };

/* =========================================================
   PRIORITY
========================================================= */

/**
 * Update contact priority.
 *
 * PATCH /api/contact/:id/priority
 */
export const updateContactPriority =
  async (req, res) => {
    try {
      const {
        priority,
      } = req.body;

      if (!priority) {
        return res.status(400).json({
          success: false,
          message:
            "Contact priority is required.",
        });
      }

      const contact =
        await contactService.updateContactPriority(
          req.params.id,
          priority
        );

      return res.status(200).json({
        success: true,

        message:
          "Contact priority updated successfully.",

        contact,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to update contact priority."
      );
    }
  };

/* =========================================================
   ASSIGNMENT
========================================================= */

/**
 * Assign contact enquiry.
 *
 * PATCH /api/contact/:id/assign
 */
export const assignContact =
  async (req, res) => {
    try {
      const {
        userId,
      } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      const contact =
        await contactService.assignContact(
          req.params.id,
          userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Contact enquiry assigned successfully.",

        contact,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to assign contact enquiry."
      );
    }
  };

/**
 * Unassign contact enquiry.
 *
 * PATCH /api/contact/:id/unassign
 */
export const unassignContact =
  async (req, res) => {
    try {
      const contact =
        await contactService.unassignContact(
          req.params.id
        );

      return res.status(200).json({
        success: true,

        message:
          "Contact enquiry unassigned successfully.",

        contact,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to unassign contact enquiry."
      );
    }
  };

/* =========================================================
   RESPONSE
========================================================= */

/**
 * Respond to contact enquiry.
 *
 * POST /api/contact/:id/respond
 */
export const respondToContact =
  async (req, res) => {
    try {
      const {
        response,
      } = req.body;

      const userId =
        getUserId(req);

      if (!response?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Response message is required.",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication is required.",
        });
      }

      const contact =
        await contactService.respondToContact(
          req.params.id,
          response,
          userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Response saved successfully.",

        contact,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to respond to contact enquiry."
      );
    }
  };

/* =========================================================
   INTERNAL NOTES
========================================================= */

/**
 * Update internal notes.
 *
 * PATCH /api/contact/:id/notes
 */
export const updateContactNotes =
  async (req, res) => {
    try {
      const {
        internalNotes,
      } = req.body;

      const contact =
        await contactService.updateContactNotes(
          req.params.id,
          internalNotes
        );

      return res.status(200).json({
        success: true,

        message:
          "Internal notes updated successfully.",

        contact,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to update internal notes."
      );
    }
  };

/* =========================================================
   ARCHIVE / RESTORE
========================================================= */

/**
 * Archive contact enquiry.
 *
 * PATCH /api/contact/:id/archive
 */
export const archiveContact =
  async (req, res) => {
    try {
      const userId =
        getUserId(req);

      const contact =
        await contactService.archiveContact(
          req.params.id,
          userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Contact enquiry archived successfully.",

        contact,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to archive contact enquiry."
      );
    }
  };

/**
 * Restore contact enquiry.
 *
 * PATCH /api/contact/:id/restore
 */
export const restoreContact =
  async (req, res) => {
    try {
      const contact =
        await contactService.restoreContact(
          req.params.id
        );

      return res.status(200).json({
        success: true,

        message:
          "Contact enquiry restored successfully.",

        contact,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to restore contact enquiry."
      );
    }
  };

/* =========================================================
   DELETE
========================================================= */

/**
 * Delete contact enquiry.
 *
 * DELETE /api/contact/:id
 */
export const deleteContact =
  async (req, res) => {
    try {
      await contactService.deleteContact(
        req.params.id
      );

      return res.status(200).json({
        success: true,

        message:
          "Contact enquiry deleted successfully.",
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to delete contact enquiry."
      );
    }
  };

/* =========================================================
   STATISTICS
========================================================= */

/**
 * Get contact statistics.
 *
 * GET /api/contact/admin/statistics
 */
export const getContactStatistics =
  async (req, res) => {
    try {
      const statistics =
        await contactService.getContactStatistics();

      return res.status(200).json({
        success: true,
        statistics,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to fetch contact statistics."
      );
    }
  };

/* =========================================================
   RECENT CONTACTS
========================================================= */

/**
 * Get recent contact enquiries.
 *
 * GET /api/contact/admin/recent
 */
export const getRecentContacts =
  async (req, res) => {
    try {
      const {
        limit = 5,
      } = req.query;

      const contacts =
        await contactService.getRecentContacts(
          limit
        );

      return res.status(200).json({
        success: true,
        contacts,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to fetch recent contact enquiries."
      );
    }
  };

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  createContact,

  getAdminContacts,
  getContactById,

  markContactAsRead,
  markContactInProgress,
  updateContactStatus,

  updateContactPriority,

  assignContact,
  unassignContact,

  respondToContact,

  updateContactNotes,

  archiveContact,
  restoreContact,

  deleteContact,

  getContactStatistics,
  getRecentContacts,
};