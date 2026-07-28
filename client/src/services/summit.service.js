import api from "./api";

/* ==========================================
   HELPERS
========================================== */

const encodePathValue = (value) =>
  encodeURIComponent(String(value || "").trim());

const cleanQueryParams = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );
};

const getFilenameFromDisposition = (
  contentDisposition,
  fallbackFilename
) => {
  if (!contentDisposition) {
    return fallbackFilename;
  }

  const utf8Match =
    contentDisposition.match(
      /filename\*=UTF-8''([^;]+)/i
    );

  if (utf8Match?.[1]) {
    return decodeURIComponent(
      utf8Match[1].replace(/["']/g, "")
    );
  }

  const regularMatch =
    contentDisposition.match(
      /filename="?([^";]+)"?/i
    );

  return (
    regularMatch?.[1] ||
    fallbackFilename
  );
};

const createTicketFilename = (
  ticketNumber
) => {
  const safeTicketNumber = String(
    ticketNumber || "summit-ticket"
  ).replace(/[\/\\:*?"<>|]/g, "-");

  return `${safeTicketNumber}.pdf`;
};

/* ==========================================
   PUBLIC SUMMIT INFORMATION
========================================== */

/**
 * Get a public summit event by slug.
 *
 * GET /api/summit/public/events/slug/:slug
 */
export const getPublicSummitBySlug =
  async (slug) => {
    const response = await api.get(
      `/summit/public/events/slug/${encodePathValue(
        slug
      )}`
    );

    return response.data;
  };

/**
 * Get a public summit event by MongoDB ID.
 *
 * GET /api/summit/public/events/:summitEventId
 */
export const getPublicSummitById =
  async (summitEventId) => {
    const response = await api.get(
      `/summit/public/events/${encodePathValue(
        summitEventId
      )}`
    );

    return response.data;
  };

/**
 * Get a public summit using either its ID or slug.
 *
 * @param {string} identifier
 * @param {"id" | "slug"} type
 */
export const getPublicSummit =
  async (
    identifier,
    type = "slug"
  ) => {
    if (type === "id") {
      return getPublicSummitById(
        identifier
      );
    }

    return getPublicSummitBySlug(
      identifier
    );
  };

/* ==========================================
   PUBLIC SUMMIT REGISTRATION
========================================== */

/**
 * Register a summit participant.
 *
 * POST /api/summit/public/register
 */
export const registerSummitParticipant =
  async (registrationData) => {
    const response = await api.post(
      "/summit/public/register",
      registrationData
    );

    return response.data;
  };

/* ==========================================
   PUBLIC REGISTRATION LOOKUP
========================================== */

/**
 * Retrieve a registration using its ticket number.
 *
 * GET /api/summit/public/registrations/ticket/:ticketNumber
 */
export const getSummitRegistrationByTicket =
  async (ticketNumber) => {
    const response = await api.get(
      `/summit/public/registrations/ticket/${encodePathValue(
        ticketNumber
      )}`
    );

    return response.data;
  };


/**
 * Retrieve a summit registration using the
 * email address used during registration.
 *
 * GET /api/summit/public/registrations/email/:email
 */
export const getSummitRegistrationByEmail =
  async (
    email,
    nationalIdLastFour
  ) => {
    const normalizedEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    const response = await api.get(
      `/summit/public/registrations/email/${encodePathValue(
        normalizedEmail
      )}`,
      {
        params: cleanQueryParams({
          nationalIdLastFour,
        }),
      }
    );

    return response.data;
  };

export const getSummitRegistrationByPhone =
  async (
    phone,
    nationalIdLastFour
  ) => {
    const normalizedPhone =
      String(phone || "")
        .trim()
        .replace(/\s+/g, "");

    const response = await api.get(
      `/summit/public/registrations/phone/${encodePathValue(
        normalizedPhone
      )}`,
      {
        params: cleanQueryParams({
          nationalIdLastFour,
        }),
      }
    );

    return response.data;
  };

/* ==========================================
   PUBLIC TICKET VERIFICATION
========================================== */

/**
 * Verify a summit ticket.
 *
 * GET /api/summit/public/tickets/:ticketNumber/verify
 *
 * The verification code is optional.
 */
export const verifySummitTicket =
  async ({
    ticketNumber,
    code,
  }) => {
    const response = await api.get(
      `/summit/public/tickets/${encodePathValue(
        ticketNumber
      )}/verify`,
      {
        params: cleanQueryParams({
          code,
        }),
      }
    );

    return response.data;
  };

/* ==========================================
   PUBLIC TICKET DOWNLOAD
========================================== */

/**
 * Fetch a summit ticket PDF as a Blob.
 *
 * GET /api/summit/public/tickets/:ticketNumber/download
 */
export const fetchSummitTicketPdf =
  async (ticketNumber) => {
    const response = await api.get(
      `/summit/public/tickets/${encodePathValue(
        ticketNumber
      )}/download`,
      {
        responseType: "blob",
      }
    );

    return {
      blob: response.data,

      filename:
        getFilenameFromDisposition(
          response.headers[
            "content-disposition"
          ],
          createTicketFilename(
            ticketNumber
          )
        ),

      contentType:
        response.headers[
          "content-type"
        ] || "application/pdf",
    };
  };

/**
 * Download the summit ticket directly in the browser.
 */
export const downloadSummitTicket =
  async (ticketNumber) => {
    const {
      blob,
      filename,
      contentType,
    } = await fetchSummitTicketPdf(
      ticketNumber
    );

    const pdfBlob =
      blob instanceof Blob
        ? blob
        : new Blob([blob], {
            type: contentType,
          });

    const objectUrl =
      window.URL.createObjectURL(
        pdfBlob
      );

    const link =
      document.createElement("a");

    link.href = objectUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(
      objectUrl
    );

    return {
      success: true,
      filename,
    };
  };

/**
 * Open the ticket PDF in a new browser tab.
 */
export const openSummitTicket =
  async (ticketNumber) => {
    const {
      blob,
      contentType,
    } = await fetchSummitTicketPdf(
      ticketNumber
    );

    const pdfBlob =
      blob instanceof Blob
        ? blob
        : new Blob([blob], {
            type: contentType,
          });

    const objectUrl =
      window.URL.createObjectURL(
        pdfBlob
      );

    window.open(
      objectUrl,
      "_blank",
      "noopener,noreferrer"
    );

    window.setTimeout(() => {
      window.URL.revokeObjectURL(
        objectUrl
      );
    }, 60_000);

    return {
      success: true,
    };
  };

/* ==========================================
   ADMIN SUMMIT DASHBOARD
========================================== */

/**
 * Get summit dashboard statistics.
 *
 * GET /api/summit/admin/events/:summitEventId/dashboard
 */
export const getAdminSummitDashboard =
  async (summitEventId) => {
    const response = await api.get(
      `/summit/admin/events/${encodePathValue(
        summitEventId
      )}/dashboard`
    );

    return response.data;
  };

/* ==========================================
   ADMIN SUMMIT REGISTRATION LIST
========================================== */

/**
 * List summit registrations.
 *
 * Supported filters:
 * page
 * limit
 * county
 * countyCode
 * participantType
 * status
 * ticketStatus
 * checkedIn
 * search
 * sortBy
 * sortOrder
 */
export const getAdminSummitRegistrations =
  async (
    summitEventId,
    queryParams = {}
  ) => {
    const response = await api.get(
      `/summit/admin/events/${encodePathValue(
        summitEventId
      )}/registrations`,
      {
        params:
          cleanQueryParams(
            queryParams
          ),
      }
    );

    return response.data;
  };

/**
 * Alias matching the backend controller terminology.
 */
export const listSummitRegistrations =
  getAdminSummitRegistrations;

/* ==========================================
   ADMIN GET ONE REGISTRATION
========================================== */

/**
 * Get one summit registration.
 *
 * GET /api/summit/admin/registrations/:registrationId
 */
export const getAdminSummitRegistration =
  async (registrationId) => {
    const response = await api.get(
      `/summit/admin/registrations/${encodePathValue(
        registrationId
      )}`
    );

    return response.data;
  };

/* ==========================================
   ADMIN UPDATE REGISTRATION STATUS
========================================== */

/**
 * Update a registration status.
 *
 * PATCH /api/summit/admin/registrations/:registrationId/status
 *
 * Example:
 * {
 *   status: "cancelled",
 *   reason: "Unable to attend"
 * }
 */
export const updateSummitRegistrationStatus =
  async (
    registrationId,
    statusData
  ) => {
    const response = await api.patch(
      `/summit/admin/registrations/${encodePathValue(
        registrationId
      )}/status`,
      statusData
    );

    return response.data;
  };

/* ==========================================
   ADMIN UPDATE TICKET STATUS
========================================== */

/**
 * Update a summit ticket status.
 *
 * PATCH /api/summit/admin/registrations/:registrationId/ticket-status
 *
 * Example:
 * {
 *   ticketStatus: "cancelled",
 *   reason: "Ticket replaced"
 * }
 */
export const updateSummitTicketStatus =
  async (
    registrationId,
    ticketStatusData
  ) => {
    const response = await api.patch(
      `/summit/admin/registrations/${encodePathValue(
        registrationId
      )}/ticket-status`,
      ticketStatusData
    );

    return response.data;
  };

/* ==========================================
   ADMIN PARTICIPANT CHECK-IN
========================================== */

/**
 * Check in a participant.
 *
 * POST /api/summit/admin/check-in
 *
 * Example:
 * {
 *   ticketNumber: "CYS/KLF/0001"
 * }
 */
export const checkInSummitParticipant =
  async (checkInData) => {
    const response = await api.post(
      "/summit/admin/check-in",
      checkInData
    );

    return response.data;
  };

/**
 * Convenience function for checking in with only
 * a ticket number.
 */
export const checkInByTicketNumber =
  async (ticketNumber) => {
    return checkInSummitParticipant({
      ticketNumber:
        String(ticketNumber).trim(),
    });
  };

/* ==========================================
   ADMIN GENERATE TICKET
========================================== */

/**
 * Ensure a registration ticket is generated.
 *
 * POST /api/summit/admin/registrations/:registrationId/ticket
 */
export const generateRegistrationTicket =
  async (registrationId) => {
    const response = await api.post(
      `/summit/admin/registrations/${encodePathValue(
        registrationId
      )}/ticket`
    );

    return response.data;
  };

/* ==========================================
   ADMIN REGENERATE TICKET
========================================== */

/**
 * Regenerate a registration ticket PDF.
 *
 * POST /api/summit/admin/registrations/:registrationId/ticket/regenerate
 */
export const regenerateSummitTicket =
  async (registrationId) => {
    const response = await api.post(
      `/summit/admin/registrations/${encodePathValue(
        registrationId
      )}/ticket/regenerate`
    );

    return response.data;
  };

/* ==========================================
   ADMIN SEND FIRST TICKET EMAIL
========================================== */

/**
 * Send the initial summit ticket email.
 *
 * POST /api/summit/admin/registrations/:registrationId/email/ticket
 */
export const sendRegistrationTicketEmail =
  async (registrationId) => {
    const response = await api.post(
      `/summit/admin/registrations/${encodePathValue(
        registrationId
      )}/email/ticket`
    );

    return response.data;
  };

/* ==========================================
   ADMIN RESEND TICKET EMAIL
========================================== */

/**
 * Resend a summit ticket email.
 *
 * POST /api/summit/admin/registrations/:registrationId/email/ticket/resend
 */
export const resendRegistrationTicketEmail =
  async (
    registrationId,
    payload = {}
  ) => {
    const response = await api.post(
      `/summit/admin/registrations/${encodePathValue(
        registrationId
      )}/email/ticket/resend`,
      payload
    );

    return response.data;
  };

/* ==========================================
   ADMIN SEND LOGISTICS EMAIL
========================================== */

/**
 * Send a branded logistics email.
 *
 * POST /api/summit/admin/registrations/:registrationId/email/logistics
 *
 * Expected payload:
 * {
 *   subject: "Coast Youth Summit 2026 Logistics Update",
 *   message: "The summit venue will be communicated soon."
 * }
 */
export const sendRegistrationLogisticsEmail =
  async (
    registrationId,
    logisticsData
  ) => {
    const response = await api.post(
      `/summit/admin/registrations/${encodePathValue(
        registrationId
      )}/email/logistics`,
      logisticsData
    );

    return response.data;
  };

/* ==========================================
   DEFAULT EXPORT
========================================== */

const summitService = {
  // Public summit
  getPublicSummit,
  getPublicSummitById,
  getPublicSummitBySlug,

   // Public registration
  registerSummitParticipant,
  getSummitRegistrationByTicket,
  getSummitRegistrationByEmail,
  getSummitRegistrationByPhone,

  // Public ticket
  verifySummitTicket,
  fetchSummitTicketPdf,
  downloadSummitTicket,
  openSummitTicket,

  // Admin dashboard and registrations
  getAdminSummitDashboard,
  getAdminSummitRegistrations,
  listSummitRegistrations,
  getAdminSummitRegistration,

  // Admin status management
  updateSummitRegistrationStatus,
  updateSummitTicketStatus,

  // Admin check-in
  checkInSummitParticipant,
  checkInByTicketNumber,

  // Admin ticket management
  generateRegistrationTicket,
  regenerateSummitTicket,

  // Admin email management
  sendRegistrationTicketEmail,
  resendRegistrationTicketEmail,
  sendRegistrationLogisticsEmail,
};

export default summitService;