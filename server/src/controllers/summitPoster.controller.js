import {
  uploadImage,
  deleteImage,
} from "../config/cloudinary.js";

import {
  createSummitPosterRequest,
  submitPosterPayment,
  getPosterStatus,
  getSummitPosterRequests,
  getSummitPosterById,
  getSummitPosterStatistics,
  confirmPosterPayment,
  rejectPosterPayment,
  completePosterGeneration,
  getPosterForDownload,
  updatePosterAdminNotes,
} from "../services/summitPoster.service.js";

import {
  generateSummitPoster,
} from "../services/summitPosterGenerator.service.js";


/* ==========================================================
   HELPERS
========================================================== */

const getClientIpAddress = (req) => {
  const forwardedFor =
    req.headers["x-forwarded-for"];

  if (forwardedFor) {
    return String(forwardedFor)
      .split(",")[0]
      .trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    null
  );
};

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

const parseBoolean = (
  value
) => {
  return (
    value === true ||
    value === "true" ||
    value === "1" ||
    value === "on"
  );
};

const serializeCloudinaryImage = (
  image
) => {
  if (!image) {
    return null;
  }

  return {
    publicId:
      image.publicId,

    assetId:
      image.assetId ||
      null,

    url:
      image.url,

    secureUrl:
      image.secureUrl,

    resourceType:
      image.resourceType ||
      "image",

    format:
      image.format ||
      null,

    bytes:
      image.bytes ||
      null,

    width:
      image.width ||
      null,

    height:
      image.height ||
      null,

    folder:
      image.folder ||
      null,

    originalFilename:
      image.originalFilename ||
      null,

    uploadedAt:
      image.uploadedAt ||
      new Date(),
  };
};

/* ==========================================================
   CREATE PUBLIC POSTER REQUEST
========================================================== */

/**
 * POST /api/summit/posters
 *
 * Public multipart/form-data route.
 *
 * Fields:
 * - fullName
 * - email
 * - phoneNumber
 * - county
 * - socialHandle
 * - consentAccepted
 * - photo
 */

export const createPosterRequest =
  async (
    req,
    res,
    next
  ) => {
    let uploadedPhoto =
      null;

    let photoSavedToRequest =
      false;

    try {
      if (
        !req.file?.buffer
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "A participant photo is required.",
          });
      }

      const {
        fullName,
        email,
        phoneNumber,
        county,
        socialHandle = null,
      } = req.body || {};

      const consentAccepted =
        parseBoolean(
          req.body
            ?.consentAccepted
        );

      /* ========================================
         UPLOAD PARTICIPANT PHOTO
      ======================================== */

      uploadedPhoto =
        await uploadImage(
          req.file.buffer,
          {
            folder:
              "jvp/summit/posters/participants",
          }
        );

      /* ========================================
         CREATE DATABASE RECORD
      ======================================== */

      const result =
        await createSummitPosterRequest({
          fullName,
          email,
          phoneNumber,
          county,
          socialHandle,

          originalPhoto:
            serializeCloudinaryImage(
              uploadedPhoto
            ),

          consentAccepted,

          ipAddress:
            getClientIpAddress(
              req
            ),

          userAgent:
            req.headers[
              "user-agent"
            ] || null,
        });

      /*
       * A newly created request owns the image.
       * It should not be removed during cleanup.
       */

      photoSavedToRequest =
        !result.isExisting;

      /* ========================================
         DELETE DUPLICATE UNUSED IMAGE
      ======================================== */

      if (
        result.isExisting &&
        uploadedPhoto?.publicId
      ) {
        try {
          await deleteImage(
            uploadedPhoto.publicId
          );

          uploadedPhoto =
            null;
        } catch (
          cleanupError
        ) {
          console.error(
            "Unable to delete duplicate summit poster photo:",
            cleanupError.message
          );
        }
      }

      return sendSuccess(
        res,
        {
          statusCode:
            result.isExisting
              ? 200
              : 201,

          message:
            result.isExisting
              ? "An active poster request already exists for these participant details."
              : "Summit poster request created successfully.",

          data: {
            poster:
              result.poster,

            isExisting:
              Boolean(
                result.isExisting
              ),

            paymentInstructions:
              result.paymentInstructions,
          },
        }
      );
    } catch (error) {
      /*
       * Remove an uploaded Cloudinary image
       * when the database request fails.
       */

      if (
        uploadedPhoto
          ?.publicId &&
        !photoSavedToRequest
      ) {
        try {
          await deleteImage(
            uploadedPhoto.publicId
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Unable to delete failed summit poster upload:",
            cleanupError.message
          );
        }
      }

      next(error);
    }
  };

/* ==========================================================
   SUBMIT PAYMENT CODE
========================================================== */

/**
 * POST /api/summit/posters/payment
 *
 * Public route.
 */

export const submitPayment =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        posterReference,
        transactionCode,
      } = req.body || {};

      const result =
        await submitPosterPayment({
          posterReference,
          transactionCode,
        });

      return sendSuccess(
        res,
        {
          message:
            result.message ||
            "Payment details submitted successfully.",

          data: {
            poster:
              result.poster,

            alreadyConfirmed:
              Boolean(
                result.alreadyConfirmed
              ),
          },
        }
      );
    } catch (error) {
      next(error);
    }
  };

/* ==========================================================
   PUBLIC POSTER STATUS
========================================================== */

/**
 * POST /api/summit/posters/status
 *
 * Public route.
 */

export const checkPosterStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        posterReference,
        email = null,
        phoneNumber = null,
      } = req.body || {};

      const result =
        await getPosterStatus({
          posterReference,
          email,
          phoneNumber,
        });

      return sendSuccess(
        res,
        {
          message:
            "Poster request status retrieved successfully.",

          data:
            result,
        }
      );
    } catch (error) {
      next(error);
    }
  };

/* ==========================================================
   ADMIN LIST
========================================================== */

/**
 * GET /api/summit/posters/admin
 */

export const getPosterRequests =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await getSummitPosterRequests({
          page:
            req.query.page,

          limit:
            req.query.limit,

          search:
            req.query.search,

          county:
            req.query.county,

          paymentStatus:
            req.query
              .paymentStatus,

          status:
            req.query.status,
        });

      return sendSuccess(
        res,
        {
          message:
            "Summit poster requests retrieved successfully.",

          data:
            result,
        }
      );
    } catch (error) {
      next(error);
    }
  };

/* ==========================================================
   ADMIN SINGLE REQUEST
========================================================== */

/**
 * GET /api/summit/posters/admin/:posterId
 */

export const getPosterRequest =
  async (
    req,
    res,
    next
  ) => {
    try {
      const poster =
        await getSummitPosterById(
          req.params.posterId
        );

      return sendSuccess(
        res,
        {
          message:
            "Summit poster request retrieved successfully.",

          data: {
            poster,
          },
        }
      );
    } catch (error) {
      next(error);
    }
  };

/* ==========================================================
   ADMIN STATISTICS
========================================================== */

/**
 * GET /api/summit/posters/admin/statistics
 */

export const getPosterStatistics =
  async (
    req,
    res,
    next
  ) => {
    try {
      const statistics =
        await getSummitPosterStatistics();

      return sendSuccess(
        res,
        {
          message:
            "Summit poster statistics retrieved successfully.",

          data: {
            statistics,
          },
        }
      );
    } catch (error) {
      next(error);
    }
  };

/* ==========================================================
   ADMIN CONFIRM PAYMENT
========================================================== */

/**
 * PATCH /api/summit/posters/admin/:posterId/confirm-payment
 */

export const confirmPayment =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await confirmPosterPayment({
          posterId:
            req.params.posterId,

          adminUser:
            req.user,

          notes:
            req.body?.notes ||
            null,
        });

      return sendSuccess(
        res,
        {
          message:
            result.message ||
            "Poster payment confirmed successfully.",

          data: {
            poster:
              result.poster,

            alreadyConfirmed:
              Boolean(
                result.alreadyConfirmed
              ),
          },
        }
      );
    } catch (error) {
      next(error);
    }
  };

/* ==========================================================
   ADMIN REJECT PAYMENT
========================================================== */

/**
 * PATCH /api/summit/posters/admin/:posterId/reject-payment
 */

export const rejectPayment =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await rejectPosterPayment({
          posterId:
            req.params.posterId,

          adminUser:
            req.user,

          reason:
            req.body?.reason,
        });

      return sendSuccess(
        res,
        {
          message:
            result.message ||
            "Poster payment rejected.",

          data: {
            poster:
              result.poster,
          },
        }
      );
    } catch (error) {
      next(error);
    }
  };

/* ==========================================================
   ADMIN START GENERATION
========================================================== */

/**
 * PATCH /api/summit/posters/admin/:posterId/generating
 */

export const startPosterGeneration =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
  await generateSummitPoster({
    posterId:
      req.params.posterId,

    adminUser:
      req.user,

    force:
      req.body?.force === true ||
      req.body?.force === "true",
  });

      return sendSuccess(
        res,
        {
          message:
            result.message ||
            (
              result.alreadyGenerated
                ? "Poster has already been generated."
                : "Poster generated successfully."
            ),

          data: {
            poster:
              result.poster,

            alreadyGenerated:
              Boolean(
                result.alreadyGenerated
              ),

            previewUrl:
              result.previewUrl ||
              null,

            downloadUrl:
              result.downloadUrl ||
              null,

            downloadToken:
              result.downloadToken ||
              result.poster
                ?.downloadToken ||
              null,
          },
        }
      );
    } catch (error) {
      next(error);
    }
  };
/* ==========================================================
   ADMIN COMPLETE GENERATION
========================================================== */

/**
 * PATCH /api/summit/posters/admin/:posterId/complete
 *
 * Temporary endpoint until automatic poster
 * generation is connected.
 */

export const finishPosterGeneration =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        previewPoster = null,
        finalPoster,
      } = req.body || {};

      if (
        !finalPoster ||
        typeof finalPoster !==
          "object" ||
        !finalPoster.publicId ||
        !(
          finalPoster.secureUrl ||
          finalPoster.url
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Valid final poster Cloudinary details are required.",
          });
      }

      if (
        previewPoster &&
        (
          typeof previewPoster !==
            "object" ||
          !previewPoster.publicId ||
          !(
            previewPoster.secureUrl ||
            previewPoster.url
          )
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Valid preview poster Cloudinary details are required.",
          });
      }

      const result =
        await completePosterGeneration({
          posterId:
            req.params.posterId,

          previewPoster,

          finalPoster,

          adminUser:
            req.user,
        });

      return sendSuccess(
        res,
        {
          message:
            result.message ||
            "Poster generation completed successfully.",

          data: {
            poster:
              result.poster,

            downloadUrl:
              result.downloadUrl ||
              result.poster
                ?.finalPoster
                ?.secureUrl ||
              result.poster
                ?.finalPoster
                ?.url ||
              null,
          },
        }
      );
    } catch (error) {
      next(error);
    }
  };

/* ==========================================================
   ADMIN UPDATE NOTES
========================================================== */

/**
 * PATCH /api/summit/posters/admin/:posterId/notes
 */

export const updatePosterNotes =
  async (
    req,
    res,
    next
  ) => {
    try {
      const poster =
        await updatePosterAdminNotes({
          posterId:
            req.params.posterId,

          notes:
            req.body?.notes ||
            null,

          adminUser:
            req.user,
        });

      return sendSuccess(
        res,
        {
          message:
            "Poster request notes updated successfully.",

          data: {
            poster,
          },
        }
      );
    } catch (error) {
      next(error);
    }
  };

/* ==========================================================
   SECURE DOWNLOAD
========================================================== */

/**
 * GET /api/summit/posters/download/:downloadToken
 *
 * Public route protected by an unguessable
 * download token.
 */

export const downloadPoster =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await getPosterForDownload({
          downloadToken:
            req.params
              .downloadToken,
        });

      const downloadUrl =
        result.downloadUrl ||
        result.poster
          ?.finalPoster
          ?.secureUrl ||
        result.poster
          ?.finalPoster
          ?.url ||
        null;

      if (!downloadUrl) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "The generated poster is not available.",
          });
      }

      return res.redirect(
        302,
        downloadUrl
      );
    } catch (error) {
      next(error);
    }
  };

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  createPosterRequest,
  submitPayment,
  checkPosterStatus,

  getPosterRequests,
  getPosterRequest,
  getPosterStatistics,

  confirmPayment,
  rejectPayment,

  startPosterGeneration,
  finishPosterGeneration,

  updatePosterNotes,
  downloadPoster,
};