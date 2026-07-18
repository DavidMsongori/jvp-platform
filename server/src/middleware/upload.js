import multer from "multer";

/* ==========================================
   MEMORY STORAGE
========================================== */

const storage = multer.memoryStorage();

/* ==========================================
   FILE FILTER
========================================== */

const fileFilter = (req, file, cb) => {

  const allowedTypes = [

    "image/jpeg",

    "image/jpg",

    "image/png",

    "image/webp",

  ];

  if (allowedTypes.includes(file.mimetype)) {

    return cb(null, true);

  }

  return cb(

    new Error(

      "Only JPG, JPEG, PNG and WEBP images are allowed."

    ),

    false

  );

};

/* ==========================================
   MULTER
========================================== */

const upload = multer({

  storage,

  fileFilter,

  limits: {

    fileSize: 2 * 1024 * 1024, // 2MB

  },

});

/* ==========================================
   EXPORTS
========================================== */

export const uploadProfilePhoto =
  upload.single("photo");

export default upload;