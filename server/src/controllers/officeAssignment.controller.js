
import * as officeAssignmentService from "../services/officeAssignment.service.js";

/* ===========================================================
   HELPERS
=========================================================== */

/**
 * Get the authenticated user's ID.
 * Supports common authentication middleware conventions.
 */
const getAuthenticatedUserId = (req) =>
  req.user?._id || req.user?.id || req.user?.userId || null;

/**
 * Resolve assignment ID from supported route parameter names.
 */
const getAssignmentId = (req) =>
  req.params.assignmentId || req.params.id;

/**
 * Standard success response.
 */
const sendSuccess = (
  res,
  { statusCode = 200, message = "Request successful.", data = null } = {},
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/* ===========================================================
   CREATE OFFICE ASSIGNMENT
   POST /api/office-assignments
=========================================================== */

export const createOfficeAssignment = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const assignment =
      await officeAssignmentService.createOfficeAssignment(
        req.body,
        userId,
      );

    return sendSuccess(res, {
      statusCode: 201,
      message: "Office assignment created successfully.",
      data: assignment,
    });
  } catch (error) {
    return next(error);
  }
};

/* ===========================================================
   GET ALL OFFICE ASSIGNMENTS
   GET /api/office-assignments
=========================================================== */

export const getAllOfficeAssignments = async (req, res, next) => {
  try {
    const result =
      await officeAssignmentService.getAllOfficeAssignments(req.query);

    return sendSuccess(res, {
      message: "Office assignments retrieved successfully.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

/* ===========================================================
   GET OFFICE ASSIGNMENT BY ID
   GET /api/office-assignments/:assignmentId
=========================================================== */

export const getOfficeAssignmentById = async (req, res, next) => {
  try {
    const assignmentId = getAssignmentId(req);

    const assignment =
      await officeAssignmentService.getOfficeAssignmentById(
        assignmentId,
      );

    return sendSuccess(res, {
      message: "Office assignment retrieved successfully.",
      data: assignment,
    });
  } catch (error) {
    return next(error);
  }
};

/* ===========================================================
   UPDATE OFFICE ASSIGNMENT
   PATCH /api/office-assignments/:assignmentId
=========================================================== */

export const updateOfficeAssignment = async (req, res, next) => {
  try {
    const assignmentId = getAssignmentId(req);
    const userId = getAuthenticatedUserId(req);

    const assignment =
      await officeAssignmentService.updateOfficeAssignment(
        assignmentId,
        req.body,
        userId,
      );

    return sendSuccess(res, {
      message: "Office assignment updated successfully.",
      data: assignment,
    });
  } catch (error) {
    return next(error);
  }
};

/* ===========================================================
   GET ASSIGNMENTS FOR A PRINCIPAL OFFICE-HOLDER
   GET /api/office-assignments/office-holder/:officeHolderId
=========================================================== */

export const getAssignmentsForOfficeHolder = async (
  req,
  res,
  next,
) => {
  try {
    const { officeHolderId } = req.params;

    const options = {
      ...req.query,
    };

    const assignments =
      await officeAssignmentService.getAssignmentsForOfficeHolder(
        officeHolderId,
        options,
      );

    return sendSuccess(res, {
      message: "Office-holder assignments retrieved successfully.",
      data: assignments,
    });
  } catch (error) {
    return next(error);
  }
};

/* ===========================================================
   GET PUBLIC TEAM FOR ONE PRINCIPAL OFFICE-HOLDER
   GET /api/office-assignments/public/office-holder/:officeHolderId
=========================================================== */

export const getPublicOfficeTeam = async (req, res, next) => {
  try {
    const { officeHolderId } = req.params;

    const team =
      await officeAssignmentService.getPublicOfficeTeam(
        officeHolderId,
      );

    return sendSuccess(res, {
      message: "Public office team retrieved successfully.",
      data: team,
    });
  } catch (error) {
    return next(error);
  }
};

/* ===========================================================
   GET PUBLIC OFFICE TEAMS BY PRINCIPAL POSITION
   GET /api/office-assignments/public/position/:position
=========================================================== */

export const getPublicOfficeTeamsByPosition = async (
  req,
  res,
  next,
) => {
  try {
    const { position } = req.params;

    const options = {
      ...req.query,
    };

    const teams =
      await officeAssignmentService.getPublicOfficeTeamsByPosition(
        position,
        options,
      );

    return sendSuccess(res, {
      message: "Public office teams retrieved successfully.",
      data: teams,
    });
  } catch (error) {
    return next(error);
  }
};

/* ===========================================================
   ACTIVATE OFFICE ASSIGNMENT
   PATCH /api/office-assignments/:assignmentId/activate
=========================================================== */

export const activateOfficeAssignment = async (req, res, next) => {
  try {
    const assignmentId = getAssignmentId(req);
    const userId = getAuthenticatedUserId(req);

    const assignment =
      await officeAssignmentService.activateOfficeAssignment(
        assignmentId,
        userId,
      );

    return sendSuccess(res, {
      message: "Office assignment activated successfully.",
      data: assignment,
    });
  } catch (error) {
    return next(error);
  }
};

/* ===========================================================
   DEACTIVATE OFFICE ASSIGNMENT
   PATCH /api/office-assignments/:assignmentId/deactivate
=========================================================== */

export const deactivateOfficeAssignment = async (req, res, next) => {
  try {
    const assignmentId = getAssignmentId(req);
    const userId = getAuthenticatedUserId(req);

    const assignment =
      await officeAssignmentService.deactivateOfficeAssignment(
        assignmentId,
        userId,
      );

    return sendSuccess(res, {
      message: "Office assignment deactivated successfully.",
      data: assignment,
    });
  } catch (error) {
    return next(error);
  }
};

/* ===========================================================
   MARK OFFICE ASSIGNMENT AS COMPLETED
   PATCH /api/office-assignments/:assignmentId/complete
=========================================================== */

export const completeOfficeAssignment = async (req, res, next) => {
  try {
    const assignmentId = getAssignmentId(req);
    const userId = getAuthenticatedUserId(req);

    const assignment =
      await officeAssignmentService.completeOfficeAssignment(
        assignmentId,
        userId,
      );

    return sendSuccess(res, {
      message: "Office assignment marked as completed.",
      data: assignment,
    });
  } catch (error) {
    return next(error);
  }
};

/* ===========================================================
   DELETE OFFICE ASSIGNMENT
   DELETE /api/office-assignments/:assignmentId
=========================================================== */

export const deleteOfficeAssignment = async (req, res, next) => {
  try {
    const assignmentId = getAssignmentId(req);
    const userId = getAuthenticatedUserId(req);

    await officeAssignmentService.deleteOfficeAssignment(
      assignmentId,
      userId,
    );

    return sendSuccess(res, {
      message: "Office assignment deleted successfully.",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};

/* ===========================================================
   OFFICE ASSIGNMENT STATISTICS
   GET /api/office-assignments/statistics
=========================================================== */

export const getOfficeAssignmentStatistics = async (
  req,
  res,
  next,
) => {
  try {
    const statistics =
      await officeAssignmentService.getOfficeAssignmentStatistics();

    return sendSuccess(res, {
      message: "Office assignment statistics retrieved successfully.",
      data: statistics,
    });
  } catch (error) {
    return next(error);
  }
};
