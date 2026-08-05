import api from "./api";

/* ==========================================================
   ERROR HELPER
========================================================== */

const getServiceError = (
  error,
  fallbackMessage
) => {
  return (
    error?.response?.data || {
      success: false,

      message:
        error?.message ||
        fallbackMessage,
    }
  );
};

/* ==========================================================
   PUBLIC — CREATE POSTER REQUEST
========================================================== */

/**
 * Create a new summit attendance poster request.
 *
 * @param {{
 *   fullName: string,
 *   email: string,
 *   phoneNumber: string,
 *   county: string,
 *   socialHandle?: string,
 *   consentAccepted: boolean,
 *   photo: File
 * }} payload
 *
 * @returns {Promise<object>}
 */
export const createPosterRequest =
  async ({
    fullName,
    email,
    phoneNumber,
    county,
    socialHandle = "",
    consentAccepted,
    photo,
  }) => {
    try {
      const formData =
        new FormData();

      formData.append(
        "fullName",
        fullName
      );

      formData.append(
        "email",
        email
      );

      formData.append(
        "phoneNumber",
        phoneNumber
      );

      formData.append(
        "county",
        county
      );

      if (
        socialHandle
          ?.trim()
      ) {
        formData.append(
          "socialHandle",
          socialHandle.trim()
        );
      }

      formData.append(
        "consentAccepted",
        String(
          Boolean(
            consentAccepted
          )
        )
      );

      formData.append(
        "photo",
        photo
      );

      const response =
        await api.post(
          "/summit/posters",
          formData
        );

      return response.data;
    } catch (error) {
      throw getServiceError(
        error,
        "Unable to create your summit poster request."
      );
    }
  };

/* ==========================================================
   PUBLIC — SUBMIT M-PESA PAYMENT CODE
========================================================== */

/**
 * Submit the participant's M-Pesa transaction code.
 *
 * @param {{
 *   posterReference: string,
 *   transactionCode: string
 * }} payload
 *
 * @returns {Promise<object>}
 */
export const submitPosterPayment =
  async ({
    posterReference,
    transactionCode,
  }) => {
    try {
      const response =
        await api.post(
          "/summit/posters/payment",
          {
            posterReference:
              String(
                posterReference ||
                  ""
              )
                .trim()
                .toUpperCase(),

            transactionCode:
              String(
                transactionCode ||
                  ""
              )
                .trim()
                .toUpperCase(),
          }
        );

      return response.data;
    } catch (error) {
      throw getServiceError(
        error,
        "Unable to submit the M-Pesa transaction code."
      );
    }
  };

/* ==========================================================
   PUBLIC — CHECK POSTER STATUS
========================================================== */

/**
 * Check a poster request using the reference
 * and either the participant's email or phone number.
 *
 * @param {{
 *   posterReference: string,
 *   email?: string,
 *   phoneNumber?: string
 * }} payload
 *
 * @returns {Promise<object>}
 */
export const checkPosterStatus =
  async ({
    posterReference,
    email = "",
    phoneNumber = "",
  }) => {
    try {
      const requestBody = {
        posterReference:
          String(
            posterReference ||
              ""
          )
            .trim()
            .toUpperCase(),
      };

      if (email?.trim()) {
        requestBody.email =
          email
            .trim()
            .toLowerCase();
      }

      if (
        phoneNumber?.trim()
      ) {
        requestBody.phoneNumber =
          phoneNumber.trim();
      }

      const response =
        await api.post(
          "/summit/posters/status",
          requestBody
        );

      return response.data;
    } catch (error) {
      throw getServiceError(
        error,
        "Unable to retrieve the poster request status."
      );
    }
  };

/* ==========================================================
   PUBLIC — DOWNLOAD URL
========================================================== */

/**
 * Build the secure poster download URL.
 *
 * Use this for an anchor href or window.open().
 *
 * @param {string} downloadToken
 * @returns {string}
 */
export const getPosterDownloadUrl = (
  downloadToken
) => {
  const normalizedToken =
    String(
      downloadToken ||
        ""
    ).trim();

  if (!normalizedToken) {
    return "";
  }

  const baseUrl =
    String(
      api.defaults.baseURL ||
        ""
    ).replace(
      /\/+$/,
      ""
    );

  return `${baseUrl}/summit/posters/download/${encodeURIComponent(
    normalizedToken
  )}`;
};

/* ==========================================================
   ADMIN — LIST POSTER REQUESTS
========================================================== */

/**
 * Retrieve paginated poster requests.
 *
 * @param {{
 *   page?: number,
 *   limit?: number,
 *   search?: string,
 *   county?: string,
 *   paymentStatus?: string,
 *   status?: string
 * }} params
 *
 * @returns {Promise<object>}
 */
export const getAdminPosterRequests =
  async (
    params = {}
  ) => {
    try {
      const response =
        await api.get(
          "/summit/posters/admin",
          {
            params: {
              page:
                params.page,

              limit:
                params.limit,

              search:
                params.search,

              county:
                params.county,

              paymentStatus:
                params.paymentStatus,

              status:
                params.status,
            },
          }
        );

      return response.data;
    } catch (error) {
      throw getServiceError(
        error,
        "Unable to retrieve summit poster requests."
      );
    }
  };

/* ==========================================================
   ADMIN — STATISTICS
========================================================== */

/**
 * Retrieve poster-module statistics.
 *
 * @returns {Promise<object>}
 */
export const getAdminPosterStatistics =
  async () => {
    try {
      const response =
        await api.get(
          "/summit/posters/admin/statistics"
        );

      return response.data;
    } catch (error) {
      throw getServiceError(
        error,
        "Unable to retrieve summit poster statistics."
      );
    }
  };

/* ==========================================================
   ADMIN — GET SINGLE REQUEST
========================================================== */

/**
 * Retrieve one poster request by MongoDB ID.
 *
 * @param {string} posterId
 * @returns {Promise<object>}
 */
export const getAdminPosterById =
  async (
    posterId
  ) => {
    try {
      const response =
        await api.get(
          `/summit/posters/admin/${posterId}`
        );

      return response.data;
    } catch (error) {
      throw getServiceError(
        error,
        "Unable to retrieve the summit poster request."
      );
    }
  };

/* ==========================================================
   ADMIN — CONFIRM PAYMENT
========================================================== */

/**
 * Confirm manual Till payment.
 *
 * @param {string} posterId
 * @param {{ notes?: string }} payload
 * @returns {Promise<object>}
 */
export const confirmPosterPayment =
  async (
    posterId,
    {
      notes = "",
    } = {}
  ) => {
    try {
      const response =
        await api.patch(
          `/summit/posters/admin/${posterId}/confirm-payment`,
          {
            notes:
              notes?.trim() ||
              null,
          }
        );

      return response.data;
    } catch (error) {
      throw getServiceError(
        error,
        "Unable to confirm the poster payment."
      );
    }
  };

/* ==========================================================
   ADMIN — REJECT PAYMENT
========================================================== */

/**
 * Reject submitted payment details.
 *
 * @param {string} posterId
 * @param {{ reason: string }} payload
 * @returns {Promise<object>}
 */
export const rejectPosterPayment =
  async (
    posterId,
    {
      reason,
    }
  ) => {
    try {
      const response =
        await api.patch(
          `/summit/posters/admin/${posterId}/reject-payment`,
          {
            reason:
              String(
                reason ||
                  ""
              ).trim(),
          }
        );

      return response.data;
    } catch (error) {
      throw getServiceError(
        error,
        "Unable to reject the poster payment."
      );
    }
  };

/* ==========================================================
   ADMIN — GENERATE POSTER
========================================================== */

/**
 * Generate or regenerate the final attendance poster.
 *
 * @param {string} posterId
 * @param {{ force?: boolean }} payload
 * @returns {Promise<object>}
 */
export const generatePoster =
  async (
    posterId,
    {
      force = false,
    } = {}
  ) => {
    try {
      const response =
        await api.post(
          `/summit/posters/admin/${posterId}/generate`,
          {
            force:
              Boolean(force),
          }
        );

      return response.data;
    } catch (error) {
      throw getServiceError(
        error,
        force
          ? "Unable to regenerate the summit poster."
          : "Unable to generate the summit poster."
      );
    }
  };

/* ==========================================================
   ADMIN — COMPLETE MANUAL GENERATION
========================================================== */

/**
 * Temporary helper for the manual completion endpoint.
 * This may be removed once all posters are generated
 * exclusively by the backend generator.
 *
 * @param {string} posterId
 * @param {{
 *   previewPoster?: object | null,
 *   finalPoster: object
 * }} payload
 *
 * @returns {Promise<object>}
 */
export const completePosterGeneration =
  async (
    posterId,
    {
      previewPoster = null,
      finalPoster,
    }
  ) => {
    try {
      const response =
        await api.patch(
          `/summit/posters/admin/${posterId}/complete`,
          {
            previewPoster,
            finalPoster,
          }
        );

      return response.data;
    } catch (error) {
      throw getServiceError(
        error,
        "Unable to complete poster generation."
      );
    }
  };

/* ==========================================================
   ADMIN — UPDATE NOTES
========================================================== */

/**
 * Update internal administrative notes.
 *
 * @param {string} posterId
 * @param {{ notes?: string }} payload
 * @returns {Promise<object>}
 */
export const updatePosterNotes =
  async (
    posterId,
    {
      notes = "",
    } = {}
  ) => {
    try {
      const response =
        await api.patch(
          `/summit/posters/admin/${posterId}/notes`,
          {
            notes:
              notes?.trim() ||
              null,
          }
        );

      return response.data;
    } catch (error) {
      throw getServiceError(
        error,
        "Unable to update poster notes."
      );
    }
  };

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

const summitPosterService = {
  createPosterRequest,
  submitPosterPayment,
  checkPosterStatus,
  getPosterDownloadUrl,

  getAdminPosterRequests,
  getAdminPosterStatistics,
  getAdminPosterById,

  confirmPosterPayment,
  rejectPosterPayment,
  generatePoster,
  completePosterGeneration,
  updatePosterNotes,
};

export default summitPosterService;