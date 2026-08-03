import {
  getSummitExhibitorById,
  getSummitExhibitors,
  registerSummitExhibitor,
  updateSummitExhibitor,
} from "../services/summitExhibitor.service.js";

/* ==========================================================
   RESPONSE HELPERS
========================================================== */

const sendSuccess = (
  res,
  {
    statusCode = 200,
    message,
    data = null,
  }
) => {
  return res
    .status(statusCode)
    .json({
      success: true,
      message,
      data,
    });
};

const forwardError = (
  error,
  next
) => {
  next(error);
};

/* ==========================================================
   PUBLIC: REGISTER EXHIBITOR
========================================================== */

export const createSummitExhibitor =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        summitEventId,
        summitSlug,
        ...payload
      } = req.body || {};

      const exhibitor =
        await registerSummitExhibitor({
          summitEventId:
            summitEventId ||
            req.params
              ?.summitEventId ||
            null,

          summitSlug:
            summitSlug ||
            req.params?.slug ||
            null,

          payload,
        });

      return sendSuccess(
        res,
        {
          statusCode: 201,

          message:
            "Exhibitor registration submitted successfully.",

          data: {
            exhibitor,
          },
        }
      );
    } catch (error) {
      return forwardError(
        error,
        next
      );
    }
  };

/* ==========================================================
   ADMIN: LIST EXHIBITORS
========================================================== */

export const listSummitExhibitors =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await getSummitExhibitors({
          summitEventId:
            req.query
              ?.summitEventId ||
            null,

          page:
            req.query?.page,

          limit:
            req.query?.limit,

          status:
            req.query?.status,

          paymentStatus:
            req.query
              ?.paymentStatus,

          packageId:
            req.query
              ?.packageId,

          search:
            req.query?.search,
        });

      return sendSuccess(
        res,
        {
          message:
            "Exhibitor registrations retrieved successfully.",

          data: result,
        }
      );
    } catch (error) {
      return forwardError(
        error,
        next
      );
    }
  };

/* ==========================================================
   ADMIN: GET ONE EXHIBITOR
========================================================== */

export const getSummitExhibitor =
  async (
    req,
    res,
    next
  ) => {
    try {
      const exhibitor =
        await getSummitExhibitorById({
          exhibitorId:
            req.params
              .exhibitorId,
        });

      return sendSuccess(
        res,
        {
          message:
            "Exhibitor registration retrieved successfully.",

          data: {
            exhibitor,
          },
        }
      );
    } catch (error) {
      return forwardError(
        error,
        next
      );
    }
  };

/* ==========================================================
   ADMIN: UPDATE EXHIBITOR
========================================================== */

export const updateSummitExhibitorRecord =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        status,
        paymentStatus,
        adminNotes,
      } = req.body || {};

      const exhibitor =
        await updateSummitExhibitor({
          exhibitorId:
            req.params
              .exhibitorId,

          currentUserId:
            req.user?._id ||
            req.user?.id ||
            null,

          status,
          paymentStatus,
          adminNotes,
        });

      return sendSuccess(
        res,
        {
          message:
            "Exhibitor registration updated successfully.",

          data: {
            exhibitor,
          },
        }
      );
    } catch (error) {
      return forwardError(
        error,
        next
      );
    }
  };