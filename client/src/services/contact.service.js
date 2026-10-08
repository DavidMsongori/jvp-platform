import api from "./api";

/*
|--------------------------------------------------------------------------
| CONTACT API
|--------------------------------------------------------------------------
| Public contact submission + admin contact management.
|--------------------------------------------------------------------------
*/

const contactPath = (path) => {
  if (!path) return path;

  return path.startsWith("/api/")
    ? path.replace(/^\/api/, "")
    : path;
};

/*
|--------------------------------------------------------------------------
| PUBLIC
|--------------------------------------------------------------------------
*/

/**
 * Submit a contact enquiry.
 *
 * POST /api/contact
 */
export const createContact = async (contactData) => {
  const response = await api.post(
    contactPath("/api/contact"),
    contactData
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| ADMIN - LIST & DASHBOARD
|--------------------------------------------------------------------------
*/

/**
 * Get all contact enquiries.
 *
 * GET /api/contact/admin/all
 */
export const getContacts = async (params = {}) => {
  const response = await api.get(
    contactPath("/api/contact/admin/all"),
    {
      params,
    }
  );

  return response.data;
};

/**
 * Get a single contact enquiry.
 *
 * GET /api/contact/:id
 */
export const getContactById = async (contactId) => {
  const response = await api.get(
    contactPath(`/api/contact/${contactId}`)
  );

  return response.data;
};

/**
 * Get contact statistics.
 *
 * GET /api/contact/admin/statistics
 */
export const getContactStatistics = async () => {
  const response = await api.get(
    contactPath("/api/contact/admin/statistics")
  );

  return response.data;
};

/**
 * Get recent contact enquiries.
 *
 * GET /api/contact/admin/recent
 */
export const getRecentContacts = async (limit = 5) => {
  const response = await api.get(
    contactPath("/api/contact/admin/recent"),
    {
      params: {
        limit,
      },
    }
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

/**
 * Mark contact as read.
 *
 * PATCH /api/contact/:id/read
 */
export const markContactAsRead = async (contactId) => {
  const response = await api.patch(
    contactPath(`/api/contact/${contactId}/read`)
  );

  return response.data;
};

/**
 * Mark contact as in progress.
 *
 * PATCH /api/contact/:id/in-progress
 */
export const markContactInProgress = async (contactId) => {
  const response = await api.patch(
    contactPath(`/api/contact/${contactId}/in-progress`)
  );

  return response.data;
};

/**
 * Update contact status.
 *
 * PATCH /api/contact/:id/status
 */
export const updateContactStatus = async (
  contactId,
  status
) => {
  const response = await api.patch(
    contactPath(`/api/contact/${contactId}/status`),
    {
      status,
    }
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| PRIORITY
|--------------------------------------------------------------------------
*/

/**
 * Update contact priority.
 *
 * PATCH /api/contact/:id/priority
 */
export const updateContactPriority = async (
  contactId,
  priority
) => {
  const response = await api.patch(
    contactPath(`/api/contact/${contactId}/priority`),
    {
      priority,
    }
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| ASSIGNMENT
|--------------------------------------------------------------------------
*/

/**
 * Assign contact to a user.
 *
 * PATCH /api/contact/:id/assign
 */
export const assignContact = async (
  contactId,
  userId
) => {
  const response = await api.patch(
    contactPath(`/api/contact/${contactId}/assign`),
    {
      userId,
    }
  );

  return response.data;
};

/**
 * Remove contact assignment.
 *
 * PATCH /api/contact/:id/unassign
 */
export const unassignContact = async (contactId) => {
  const response = await api.patch(
    contactPath(`/api/contact/${contactId}/unassign`)
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| RESPONSE
|--------------------------------------------------------------------------
*/

/**
 * Respond to a contact enquiry.
 *
 * POST /api/contact/:id/respond
 */
export const respondToContact = async (
  contactId,
  responseText
) => {
  const response = await api.post(
    contactPath(`/api/contact/${contactId}/respond`),
    {
      response: responseText,
    }
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| INTERNAL NOTES
|--------------------------------------------------------------------------
*/

/**
 * Update internal notes.
 *
 * PATCH /api/contact/:id/notes
 */
export const updateContactNotes = async (
  contactId,
  internalNotes
) => {
  const response = await api.patch(
    contactPath(`/api/contact/${contactId}/notes`),
    {
      internalNotes,
    }
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| ARCHIVE / RESTORE
|--------------------------------------------------------------------------
*/

/**
 * Archive contact enquiry.
 *
 * PATCH /api/contact/:id/archive
 */
export const archiveContact = async (contactId) => {
  const response = await api.patch(
    contactPath(`/api/contact/${contactId}/archive`)
  );

  return response.data;
};

/**
 * Restore archived contact enquiry.
 *
 * PATCH /api/contact/:id/restore
 */
export const restoreContact = async (contactId) => {
  const response = await api.patch(
    contactPath(`/api/contact/${contactId}/restore`)
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

/**
 * Permanently delete contact enquiry.
 *
 * DELETE /api/contact/:id
 */
export const deleteContact = async (contactId) => {
  const response = await api.delete(
    contactPath(`/api/contact/${contactId}`)
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const contactService = {
  createContact,

  getContacts,
  getContactById,
  getContactStatistics,
  getRecentContacts,

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
};

export default contactService;