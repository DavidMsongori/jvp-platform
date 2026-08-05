import multer from "multer";

/* ===========================================================
   MEMORY STORAGE
=========================================================== */

const storage = multer.memoryStorage();

/* ===========================================================
   FILE FILTER
=========================================================== */

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPG, JPEG, PNG and WEBP images are allowed."
    ),
    false
  );
};

/* ===========================================================
   MULTER INSTANCE
=========================================================== */

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
});

/* ===========================================================
   GENERIC HELPERS
=========================================================== */

/**
 * Upload a single file.
 *
 * Example:
 * uploadSingle("coverImage")
 */
export const uploadSingle = (fieldName) =>
  upload.single(fieldName);

/**
 * Upload multiple files from one field.
 *
 * Example:
 * uploadArray("gallery", 20)
 */
export const uploadArray = (
  fieldName,
  maxCount = 10
) => upload.array(fieldName, maxCount);

/**
 * Upload multiple named fields.
 *
 * Example:
 * uploadFields([
 *   { name: "coverImage", maxCount: 1 },
 *   { name: "gallery", maxCount: 20 },
 * ])
 */
export const uploadFields = (fields) =>
  upload.fields(fields);

/* ===========================================================
   APPLICATION MIDDLEWARES
=========================================================== */

/**
 * Member profile photo
 */
export const uploadProfilePhoto =
  uploadSingle("photo");

/**
 * Event cover image + gallery
 */
export const uploadEventImages =
  uploadFields([
    {
      name: "coverImage",
      maxCount: 1,
    },
    {
      name: "gallery",
      maxCount: 20,
    },
  ]);

/**
 * Speaker photo
 */
export const uploadSpeakerPhoto =
  uploadSingle("photo");

/**
 * Partner logo
 */
export const uploadPartnerLogo =
  uploadSingle("logo");

/**
 * News featured image
 */
export const uploadNewsImage =
  uploadSingle("featuredImage");

/**
 * Publication cover
 */
export const uploadPublicationCover =
  uploadSingle("coverImage");



/* ===========================================================
   SUMMIT POSTER PHOTO
=========================================================== */

export const uploadSummitPosterPhoto =
  uploadSingle("photo");  

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

export default upload;