
import api from "./api";

/* ===========================================================
   HELPERS
=========================================================== */

/**
 * Remove empty query parameters before sending requests.
 */
const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

/**
 * Encode path parameters safely.
 */
const encode = (value) => encodeURIComponent(String(value));

/* ===========================================================
   PUBLIC OFFICE TEAMS
=========================================================== */

/**
 * Get the public supporting team for one principal office-holder.
 *
 * GET /office-assignments/public/office-holder/:officeHolderId
 */
export const getPublicOfficeTeam = async (officeHolderId) => {
  const response = await api.get(
    `/office-assignments/public/office-holder/${encode(officeHolderId)}`
  );

  return response.data;
};

/**
 * Get public office teams grouped by principal office position.
 *
 * GET /office-assignments/public/position/:position
 */
export const getPublicOfficeTeamsByPosition = async (
  position,
  params = {}
) => {
  const response = await api.get(
    `/office-assignments/public/position/${encode(position)}`,
    {
      params: cleanParams(params),
    }
  );

  return response.data;
};

/* ===========================================================
   ADMIN: LIST AND RETRIEVE ASSIGNMENTS
=========================================================== */

/**
 * Get all office assignments with optional filters and pagination.
 *
 * GET /office-assignments
 *
 * Example params:
 * {
 *   page: 1,
 *   limit: 20,
 *   search: "secretary",
 *   status: "active",
 *   officeHolder: "...",
 *   member: "..."
 * }
 */
export const getOfficeAssignments = async (params = {}) => {
  const response = await api.get("/office-assignments", {
    params: cleanParams(params),
  });

  return response.data;
};

/**
 * Get one office assignment by ID.
 *
 * GET /office-assignments/:assignmentId
 */
export const getOfficeAssignmentById = async (assignmentId) => {
  const response = await api.get(
    `/office-assignments/${encode(assignmentId)}`
  );

  return response.data;
};

/**
 * Get assignments belonging to a particular principal office-holder.
 *
 * GET /office-assignments/office-holder/:officeHolderId
 */
export const getAssignmentsForOfficeHolder = async (
  officeHolderId,
  params = {}
) => {
  const response = await api.get(
    `/office-assignments/office-holder/${encode(officeHolderId)}`,
    {
      params: cleanParams(params),
    }
  );

  return response.data;
};

/* ===========================================================
   ADMIN: CREATE ASSIGNMENT
=========================================================== */

/**
 * Assign an existing JVP member to support a principal office-holder.
 *
 * POST /office-assignments
 */
export const createOfficeAssignment = async (assignmentData) => {
  const response = await api.post(
    "/office-assignments",
    assignmentData
  );

  return response.data;
};

/* ===========================================================
   ADMIN: UPDATE ASSIGNMENT
=========================================================== */

/**
 * Update an existing office assignment.
 *
 * PATCH /office-assignments/:assignmentId
 */
export const updateOfficeAssignment = async (
  assignmentId,
  updateData
) => {
  const response = await api.patch(
    `/office-assignments/${encode(assignmentId)}`,
    updateData
  );

  return response.data;
};

/* ===========================================================
   ADMIN: ASSIGNMENT STATUS
=========================================================== */

/**
 * Activate an office assignment.
 *
 * PATCH /office-assignments/:assignmentId/activate
 */
export const activateOfficeAssignment = async (assignmentId) => {
  const response = await api.patch(
    `/office-assignments/${encode(assignmentId)}/activate`
  );

  return response.data;
};

/**
 * Deactivate an office assignment.
 *
 * PATCH /office-assignments/:assignmentId/deactivate
 */
export const deactivateOfficeAssignment = async (assignmentId) => {
  const response = await api.patch(
    `/office-assignments/${encode(assignmentId)}/deactivate`
  );

  return response.data;
};

/**
 * Mark an office assignment as completed.
 *
 * PATCH /office-assignments/:assignmentId/complete
 */
export const completeOfficeAssignment = async (assignmentId) => {
  const response = await api.patch(
    `/office-assignments/${encode(assignmentId)}/complete`
  );

  return response.data;
};

/* ===========================================================
   ADMIN: DELETE ASSIGNMENT
=========================================================== */

/**
 * Permanently delete an office assignment.
 *
 * DELETE /office-assignments/:assignmentId
 */
export const deleteOfficeAssignment = async (assignmentId) => {
  const response = await api.delete(
    `/office-assignments/${encode(assignmentId)}`
  );

  return response.data;
};

/* ===========================================================
   ADMIN: STATISTICS
=========================================================== */

/**
 * Retrieve office assignment dashboard statistics.
 *
 * GET /office-assignments/statistics
 */
export const getOfficeAssignmentStatistics = async () => {
  const response = await api.get(
    "/office-assignments/statistics"
  );

  return response.data;
};

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

const officeAssignmentService = {
  // Public
  getPublicOfficeTeam,
  getPublicOfficeTeamsByPosition,

  // List and retrieve
  getOfficeAssignments,
  getOfficeAssignmentById,
  getAssignmentsForOfficeHolder,

  // Create and update
  createOfficeAssignment,
  updateOfficeAssignment,

  // Status management
  activateOfficeAssignment,
  deactivateOfficeAssignment,
  completeOfficeAssignment,

  // Delete and statistics
  deleteOfficeAssignment,
  getOfficeAssignmentStatistics,
};

export default officeAssignmentService;
