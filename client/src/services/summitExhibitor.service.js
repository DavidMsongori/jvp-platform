import api from "./api";

/* ==========================================================
   PUBLIC: REGISTER EXHIBITOR
========================================================== */

export const registerSummitExhibitor =
  async (registrationData) => {
    const response = await api.post(
      "/summit-exhibitors/register",
      registrationData
    );

    return response.data;
  };

/* ==========================================================
   ADMIN: GET ALL EXHIBITORS
========================================================== */

export const getSummitExhibitors =
  async ({
    summitEventId = null,
    page = 1,
    limit = 20,
    status = "",
    paymentStatus = "",
    packageId = "",
    search = "",
  } = {}) => {
    const params = {
      page,
      limit,
    };

    if (summitEventId) {
      params.summitEventId =
        summitEventId;
    }

    if (status) {
      params.status =
        status;
    }

    if (paymentStatus) {
      params.paymentStatus =
        paymentStatus;
    }

    if (packageId) {
      params.packageId =
        packageId;
    }

    if (search) {
      params.search =
        search;
    }

    const response = await api.get(
      "/summit-exhibitors",
      {
        params,
      }
    );

    return response.data;
  };

/* ==========================================================
   ADMIN: GET ONE EXHIBITOR
========================================================== */

export const getSummitExhibitorById =
  async (exhibitorId) => {
    if (!exhibitorId) {
      throw new Error(
        "Exhibitor ID is required."
      );
    }

    const response = await api.get(
      `/summit-exhibitors/${exhibitorId}`
    );

    return response.data;
  };

/* ==========================================================
   ADMIN: UPDATE EXHIBITOR
========================================================== */

export const updateSummitExhibitor =
  async (
    exhibitorId,
    {
      status,
      paymentStatus,
      adminNotes,
    } = {}
  ) => {
    if (!exhibitorId) {
      throw new Error(
        "Exhibitor ID is required."
      );
    }

    const payload = {};

    if (status !== undefined) {
      payload.status =
        status;
    }

    if (
      paymentStatus !==
      undefined
    ) {
      payload.paymentStatus =
        paymentStatus;
    }

    if (
      adminNotes !==
      undefined
    ) {
      payload.adminNotes =
        adminNotes;
    }

    const response = await api.patch(
      `/summit-exhibitors/${exhibitorId}`,
      payload
    );

    return response.data;
  };

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

const summitExhibitorService = {
  registerSummitExhibitor,
  getSummitExhibitors,
  getSummitExhibitorById,
  updateSummitExhibitor,
};

export default summitExhibitorService;