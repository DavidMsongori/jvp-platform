import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  fileURLToPath,
} from "url";

import sharp from "sharp";

import SummitPoster from "../models/summitPoster.model.js";
import AppError from "../utils/AppError.js";
import {
  removeImageBackground,
} from "./backgroundRemoval.service.js";

import {
  uploadImage,
  deleteImage,
} from "../config/cloudinary.js";

import {
  POSTER_WIDTH,
  POSTER_HEIGHT,
  PHOTO_FRAME,
  imageBufferToDataUri,
  createSummitPosterTemplate,
} from "../templates/summitPoster.template.js";

/* ==========================================================
   FILE PATHS
========================================================== */

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const SUMMIT_LOGO_PATH =
  path.resolve(
    __dirname,
    "../assets/summit-posters/logos/coast-youth-summit-logo.png"
  );

const JVP_LOGO_PATH =
  path.resolve(
    __dirname,
    "../assets/summit-posters/logos/jvp-logo.png"
  );

const BACKGROUND_PATTERN_PATH =
  path.resolve(
    __dirname,
    "../assets/summit-posters/backgrounds/african-pattern.png"
  );  

/* ==========================================================
   CLOUDINARY FOLDERS
========================================================== */

const PREVIEW_FOLDER =
  "jvp/summit/posters/previews";

const FINAL_FOLDER =
  "jvp/summit/posters/generated";

/* ==========================================================
   ASSET CACHE
========================================================== */

/*
 * Logo buffers and data URIs are cached after
 * the first poster generation to avoid repeatedly
 * reading the same files from disk.
 */

let cachedSummitLogoDataUri =
  null;

let cachedJvpLogoDataUri =
  null;

let cachedBackgroundPatternDataUri =
  null;

/* ==========================================================
   FILE VALIDATION
========================================================== */

const ensureRequiredAssetsExist =
  () => {
    if (
      !fs.existsSync(
        SUMMIT_LOGO_PATH
      )
    ) {
      throw new AppError(
        500,
        "The Coast Youth Summit logo could not be found."
      );
    }

    if (
      !fs.existsSync(
        JVP_LOGO_PATH
      )
    ) {
      throw new AppError(
        500,
        "The JVP logo could not be found."
      );
    }
if (
  !fs.existsSync(
    BACKGROUND_PATTERN_PATH
  )
) {
  throw new AppError(
    500,
    "The summit poster background pattern could not be found."
  );
}

  };

/* ==========================================================
   LOGO DATA
========================================================== */

const getLogoDataUris =
  () => {
    ensureRequiredAssetsExist();

    if (
      !cachedSummitLogoDataUri
    ) {
      const summitLogoBuffer =
        fs.readFileSync(
          SUMMIT_LOGO_PATH
        );

      cachedSummitLogoDataUri =
        imageBufferToDataUri(
          summitLogoBuffer,
          "image/png"
        );
    }

    if (
      !cachedJvpLogoDataUri
    ) {
      const jvpLogoBuffer =
        fs.readFileSync(
          JVP_LOGO_PATH
        );

      cachedJvpLogoDataUri =
        imageBufferToDataUri(
          jvpLogoBuffer,
          "image/png"
        );
    }

  if (
  !cachedBackgroundPatternDataUri
) {
  const backgroundPatternBuffer =
    fs.readFileSync(
      BACKGROUND_PATTERN_PATH
    );

  cachedBackgroundPatternDataUri =
    imageBufferToDataUri(
      backgroundPatternBuffer,
      "image/png"
    );
}  

   return {
  summitLogoDataUri:
    cachedSummitLogoDataUri,

  jvpLogoDataUri:
    cachedJvpLogoDataUri,

  backgroundPatternDataUri:
    cachedBackgroundPatternDataUri,
};
  };

/* ==========================================================
   POSTER LOOKUP
========================================================== */

const findPoster = async (
  posterId
) => {
  const poster =
    await SummitPoster.findById(
      posterId
    );

  if (!poster) {
    throw new AppError(
      404,
      "Summit poster request not found."
    );
  }

  return poster;
};

/* ==========================================================
   REMOTE IMAGE DOWNLOAD
========================================================== */

const downloadImageBuffer =
  async (
    imageUrl
  ) => {
    if (!imageUrl) {
      throw new AppError(
        400,
        "The participant photo URL is missing."
      );
    }

    let response;

    try {
      response =
        await fetch(
          imageUrl
        );
    } catch (error) {
      console.error(
        "Unable to download participant photo:",
        error.message
      );

      throw new AppError(
        502,
        "Unable to retrieve the participant photo."
      );
    }

    if (!response.ok) {
      throw new AppError(
        502,
        `Unable to retrieve the participant photo. Remote server returned ${response.status}.`
      );
    }

    const contentType =
      String(
        response.headers.get(
          "content-type"
        ) || ""
      ).toLowerCase();

    if (
      contentType &&
      !contentType.startsWith(
        "image/"
      )
    ) {
      throw new AppError(
        400,
        "The stored participant photo is not a valid image."
      );
    }

    const arrayBuffer =
      await response.arrayBuffer();

    const buffer =
      Buffer.from(
        arrayBuffer
      );

    if (!buffer.length) {
      throw new AppError(
        502,
        "The participant photo returned an empty file."
      );
    }

    return buffer;
  };

/* ==========================================================
   CLOUDINARY SERIALIZATION
========================================================== */

const serializeCloudinaryImage =
  (image) => {
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
        Number(
          image.bytes
        ) || null,

      width:
        Number(
          image.width
        ) || null,

      height:
        Number(
          image.height
        ) || null,

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
   PARTICIPANT PHOTO
========================================================== */

const createParticipantCutout =
  async (
    photoBuffer
  ) => {
    if (
      !Buffer.isBuffer(
        photoBuffer
      ) ||
      !photoBuffer.length
    ) {
      throw new AppError(
        400,
        "A valid participant photo is required."
      );
    }

    try {
      /* ========================================
         NORMALIZE ORIGINAL IMAGE
      ======================================== */

      const normalizedPhoto =
        await sharp(
          photoBuffer
        )
          .rotate()
          .resize(
            1600,
            1600,
            {
              fit: "inside",
              withoutEnlargement:
                true,
            }
          )
          .jpeg({
            quality: 92,
            mozjpeg: true,
          })
          .toBuffer();

      /* ========================================
         REMOVE ORIGINAL BACKGROUND
      ======================================== */

      const backgroundRemovedBuffer =
        await removeImageBackground(
          normalizedPhoto,
          {
            filename:
              "summit-participant.jpg",

            mimeType:
              "image/jpeg",

            timeoutMs:
              120000,
          }
        );

      /* ========================================
         VALIDATE TRANSPARENT OUTPUT
      ======================================== */

      const outputMetadata =
        await sharp(
          backgroundRemovedBuffer
        ).metadata();

      if (
        !outputMetadata.width ||
        !outputMetadata.height
      ) {
        throw new AppError(
          502,
          "The background-removal service returned an invalid image."
        );
      }

      /* ========================================
         CLEAN TRANSPARENT EDGES
      ======================================== */

      const cleanedCutout =
        await sharp(
          backgroundRemovedBuffer
        )
          .rotate()
          .ensureAlpha()
          .trim({
            background: {
              r: 0,
              g: 0,
              b: 0,
              alpha: 0,
            },

            threshold: 6,
          })
          .png({
            compressionLevel: 9,
            adaptiveFiltering:
              true,
          })
          .toBuffer();

      /* ========================================
         FIT CUTOUT INTO RIGHT-SIDE FRAME
      ======================================== */

      const participantCutout =
        await sharp(
          cleanedCutout
        )
          .resize(
            PHOTO_FRAME.width,
            PHOTO_FRAME.height,
            {
              fit: "inside",

              position:
                "bottom",

              background: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 0,
              },

              withoutEnlargement:
                false,
            }
          )
          .extend({
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,

            background: {
              r: 0,
              g: 0,
              b: 0,
              alpha: 0,
            },
          })
          .png({
            compressionLevel: 9,
            adaptiveFiltering:
              true,
          })
          .toBuffer();

      return participantCutout;
    } catch (error) {
      console.error(
        "Unable to create participant cutout:",
        {
          message:
            error.message,

          statusCode:
            error.statusCode,

          stack:
            process.env.NODE_ENV ===
            "development"
              ? error.stack
              : undefined,
        }
      );

      if (
        error instanceof
        AppError
      ) {
        throw error;
      }

      throw new AppError(
        400,
        "The participant photo background could not be removed or processed."
      );
    }
  };

/* ==========================================================
   PREVIEW WATERMARK
========================================================== */

const createPreviewWatermark =
  () => {
    return Buffer.from(`
      <svg
        width="${POSTER_WIDTH}"
        height="${POSTER_HEIGHT}"
        viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          transform="rotate(
            -28
            ${POSTER_WIDTH / 2}
            ${POSTER_HEIGHT / 2}
          )"
        >
          <rect
            x="-120"
            y="${
              POSTER_HEIGHT /
                2 -
              58
            }"
            width="${
              POSTER_WIDTH +
              240
            }"
            height="116"
            rx="12"
            fill="#ffffff"
            fill-opacity="0.70"
          />

          <text
            x="${POSTER_WIDTH / 2}"
            y="${
              POSTER_HEIGHT /
              2
            }"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="68"
            font-weight="900"
            fill="#c62828"
            fill-opacity="0.84"
            letter-spacing="7"
          >
            PREVIEW
          </text>
        </g>
      </svg>
    `);
  };

/* ==========================================================
   BUILD FINAL POSTER
========================================================== */

/**
 * Creates the clean final attendance poster.
 *
 * The SVG template handles:
 * - summit branding;
 * - logos;
 * - participant name;
 * - county;
 * - event date and venue;
 * - footer branding.
 *
 * Sharp only composites the participant photograph.
 */

export const generatePosterBuffer =
  async ({
    fullName,
    county,
    participantPhotoBuffer,

     eventDate =
      "28 AUGUST 2026",

    eventVenue =
      "UWANJA WA WATER, KILIFI",

    hashtag =
      "#CYS2026",
  }) => {
    if (
      !participantPhotoBuffer
    ) {
      throw new AppError(
        400,
        "The participant photo is required for poster generation."
      );
    }

    const {
      summitLogoDataUri,
      jvpLogoDataUri,
      backgroundPatternDataUri,
    } = getLogoDataUris();

    const participantCutout =
  await createParticipantCutout(
    participantPhotoBuffer
  );

  const participantPhotoDataUri =
  imageBufferToDataUri(
    participantCutout,
    "image/png"
  );

    const templateBuffer =
      createSummitPosterTemplate({
        fullName,
        county,

        summitLogoDataUri,
        jvpLogoDataUri,
        backgroundPatternDataUri,
        participantPhotoDataUri,

        eventDate,
        eventVenue,
        hashtag,
      });

    try {
      return await sharp(
  templateBuffer,
  {
    density: 192,
  }
)
  .resize(
    POSTER_WIDTH,
    POSTER_HEIGHT,
    {
      fit: "fill",
    }
  )
  .png({
    compressionLevel: 9,
    adaptiveFiltering: true,
  })
  .toBuffer();
    } catch (error) {
      console.error(
        "Unable to render summit poster template:",
        error
      );

      throw new AppError(
        500,
        "Unable to render the summit attendance poster."
      );
    }
  };

/* ==========================================================
   BUILD WATERMARKED PREVIEW
========================================================== */

export const generatePreviewBuffer =
  async (
    finalPosterBuffer
  ) => {
    if (!finalPosterBuffer) {
      throw new AppError(
        400,
        "The final poster buffer is required."
      );
    }

    const previewWidth =
      720;

    const previewHeight =
      Math.round(
        (
          POSTER_HEIGHT /
          POSTER_WIDTH
        ) *
          previewWidth
      );

    const watermark =
      createPreviewWatermark();

    const resizedWatermark =
      await sharp(
        watermark,
        {
          density: 144,
        }
      )
        .resize(
          previewWidth,
          previewHeight,
          {
            fit: "fill",
          }
        )
        .png()
        .toBuffer();

    return sharp(
      finalPosterBuffer
    )
      .resize(
        previewWidth,
        previewHeight,
        {
          fit: "fill",
          withoutEnlargement:
            true,
        }
      )
      .composite([
        {
          input:
            resizedWatermark,

          top: 0,
          left: 0,
        },
      ])
      .jpeg({
        quality: 76,
        progressive: true,
        chromaSubsampling:
          "4:4:4",
      })
      .toBuffer();
  };

/* ==========================================================
   GENERATE AND UPLOAD POSTER
========================================================== */

export const generateSummitPoster =
  async ({
    posterId,
    adminUser = null,

    /*
     * Set force to true to regenerate an
     * existing ready/downloaded poster.
     */
    force = false,
  }) => {
    const poster =
      await findPoster(
        posterId
      );

    if (
      poster.paymentStatus !==
      "confirmed"
    ) {
      throw new AppError(
        400,
        "Payment must be confirmed before generating the poster."
      );
    }

    const alreadyComplete =
      [
        "ready",
        "downloaded",
      ].includes(
        poster.status
      ) &&
      (
        poster.finalPoster
          ?.secureUrl ||
        poster.finalPoster
          ?.url
      );

    if (
      alreadyComplete &&
      !force
    ) {
      return {
        poster,

        alreadyGenerated:
          true,

        previewUrl:
          poster.previewPoster
            ?.secureUrl ||
          poster.previewPoster
            ?.url ||
          null,

        downloadUrl:
          poster.finalPoster
            ?.secureUrl ||
          poster.finalPoster
            ?.url ||
          null,

        downloadToken:
          poster.downloadToken ||
          null,

        message:
          "The summit attendance poster has already been generated.",
      };
    }

    const participantPhotoUrl =
      poster.originalPhoto
        ?.secureUrl ||
      poster.originalPhoto
        ?.url ||
      null;

    if (
      !participantPhotoUrl
    ) {
      throw new AppError(
        400,
        "The participant photo is missing."
      );
    }

    /*
     * Capture old Cloudinary IDs before replacing
     * the poster with a newly generated version.
     */
    const oldFinalPublicId =
      poster.finalPoster
        ?.publicId ||
      null;

    const oldPreviewPublicId =
      poster.previewPoster
        ?.publicId ||
      null;

    const previousStatus =
      poster.status;

    poster.status =
      "generating";

    await poster.save();

    let uploadedPreview =
      null;

    let uploadedFinal =
      null;

    try {
      /* ========================================
         DOWNLOAD PARTICIPANT PHOTO
      ======================================== */

      const participantPhotoBuffer =
        await downloadImageBuffer(
          participantPhotoUrl
        );

      /* ========================================
         GENERATE CLEAN FINAL POSTER
      ======================================== */

      const finalPosterBuffer =
        await generatePosterBuffer({
          fullName:
            poster.fullName,

          county:
            poster.county,

          participantPhotoBuffer,
        });

      /* ========================================
         GENERATE WATERMARKED PREVIEW
      ======================================== */

      const previewPosterBuffer =
        await generatePreviewBuffer(
          finalPosterBuffer
        );

      /* ========================================
         UPLOAD FINAL POSTER
      ======================================== */

      uploadedFinal =
        await uploadImage(
          finalPosterBuffer,
          {
            folder:
              FINAL_FOLDER,
          }
        );

      /* ========================================
         UPLOAD PREVIEW
      ======================================== */

      uploadedPreview =
        await uploadImage(
          previewPosterBuffer,
          {
            folder:
              PREVIEW_FOLDER,
          }
        );

      /* ========================================
         SAVE GENERATED ASSETS
      ======================================== */

      poster.finalPoster =
        serializeCloudinaryImage(
          uploadedFinal
        );

      poster.previewPoster =
        serializeCloudinaryImage(
          uploadedPreview
        );

      poster.downloadToken =
        poster.downloadToken ||
        crypto
          .randomBytes(32)
          .toString("hex");

      poster.generatedAt =
        new Date();

      poster.downloadedAt =
  null;  

      poster.status =
        "ready";

      await poster.save();

      /* ========================================
         DELETE OLD GENERATED ASSETS
      ======================================== */

      if (
        oldFinalPublicId &&
        oldFinalPublicId !==
          uploadedFinal.publicId
      ) {
        deleteImage(
          oldFinalPublicId
        ).catch(
          (error) => {
            console.error(
              "Unable to delete old final poster:",
              error.message
            );
          }
        );
      }

      if (
        oldPreviewPublicId &&
        oldPreviewPublicId !==
          uploadedPreview.publicId
      ) {
        deleteImage(
          oldPreviewPublicId
        ).catch(
          (error) => {
            console.error(
              "Unable to delete old preview poster:",
              error.message
            );
          }
        );
      }

      return {
        poster,

        alreadyGenerated:
          false,

        previewUrl:
          poster.previewPoster
            ?.secureUrl ||
          poster.previewPoster
            ?.url ||
          null,

        downloadUrl:
          poster.finalPoster
            ?.secureUrl ||
          poster.finalPoster
            ?.url ||
          null,

        downloadToken:
          poster.downloadToken,

        generatedBy:
          adminUser?._id ||
          adminUser ||
          null,

        message:
          force
            ? "Summit attendance poster regenerated successfully."
            : "Summit attendance poster generated successfully.",
      };
    } catch (error) {
      /* ========================================
         CLEAN FAILED CLOUDINARY UPLOADS
      ======================================== */

      if (
        uploadedPreview?.publicId
      ) {
        try {
          await deleteImage(
            uploadedPreview.publicId
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Unable to remove failed preview poster:",
            cleanupError.message
          );
        }
      }

      if (
        uploadedFinal?.publicId
      ) {
        try {
          await deleteImage(
            uploadedFinal.publicId
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Unable to remove failed final poster:",
            cleanupError.message
          );
        }
      }

      /*
       * Restore a sensible status when regeneration
       * or first-time generation fails.
       */

      if (
        [
          "ready",
          "downloaded",
        ].includes(
          previousStatus
        )
      ) {
        poster.status =
          previousStatus;
      } else {
        poster.status =
          "approved";
      }

      await poster.save();

      console.error(
        "Summit poster generation failed:",
        error
      );

      if (
        error instanceof
        AppError
      ) {
        throw error;
      }

      throw new AppError(
        500,
        "Unable to generate the summit attendance poster."
      );
    }
  };

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  generatePosterBuffer,
  generatePreviewBuffer,
  generateSummitPoster,
};