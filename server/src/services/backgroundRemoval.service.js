import axios from "axios";
import FormData from "form-data";

import AppError from "../utils/AppError.js";

/* ==========================================================
   CONFIGURATION
========================================================== */

const BACKGROUND_REMOVAL_URL =
  String(
    process.env
      .BACKGROUND_REMOVAL_SERVICE_URL ||
      "http://127.0.0.1:8001"
  )
    .trim()
    .replace(/\/+$/, "");

/* ==========================================================
   REMOVE BACKGROUND
========================================================== */

export const removeImageBackground =
  async (
    imageBuffer,
    options = {}
  ) => {
    if (
      !Buffer.isBuffer(
        imageBuffer
      ) ||
      !imageBuffer.length
    ) {
      throw new AppError(
        400,
        "A valid image buffer is required."
      );
    }

    try {
      const form =
        new FormData();

      form.append(
        "image",
        imageBuffer,
        {
          filename:
            options.filename ||
            "participant-photo.jpg",

          contentType:
            options.mimeType ||
            "image/jpeg",
        }
      );

      const response =
        await axios.post(
          `${BACKGROUND_REMOVAL_URL}/remove-background`,
          form,
          {
            headers: {
              ...form.getHeaders(),
            },

            responseType:
              "arraybuffer",

            timeout:
              options.timeoutMs ||
              120000,

            maxContentLength:
              Infinity,

            maxBodyLength:
              Infinity,
          }
        );

      const outputBuffer =
        Buffer.from(
          response.data
        );

      if (
        !outputBuffer.length
      ) {
        throw new AppError(
          502,
          "The background-removal service returned an empty image."
        );
      }

      return outputBuffer;
    } catch (error) {
      console.error(
        "Background removal failed:",
        {
          message:
            error.message,

          status:
            error.response
              ?.status,

          response:
            error.response
              ?.data
              ? Buffer.isBuffer(
                  error.response.data
                )
                ? error.response.data
                    .toString(
                      "utf-8"
                    )
                : error.response.data
              : undefined,
        }
      );

      if (
        error instanceof
        AppError
      ) {
        throw error;
      }

      if (
        error.code ===
        "ECONNREFUSED"
      ) {
        throw new AppError(
          503,
          "The background-removal service is not running."
        );
      }

      if (
        error.code ===
        "ECONNABORTED"
      ) {
        throw new AppError(
          504,
          "Background removal took too long."
        );
      }

      throw new AppError(
        502,
        "Unable to remove the participant photo background."
      );
    }
  };

/* ==========================================================
   OPTIONAL ALIAS
========================================================== */

export const removeBackground =
  removeImageBackground;

export default {
  removeImageBackground,
  removeBackground,
};