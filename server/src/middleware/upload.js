import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import cloudinary from "../config/cloudinary.js";

/* ==========================================
   CLOUDINARY STORAGE
========================================== */

const storage = new CloudinaryStorage({

  cloudinary,

  params: async (req, file) => ({

    folder: "jvp-connect/profile-photos",

    allowed_formats: [

      "jpg",

      "jpeg",

      "png",

      "webp",

    ],

    public_id: `member-${req.member.memberNumber || req.member._id}`,

    overwrite: true,

    resource_type: "image",

    transformation: [

      {
        width: 500,
        height: 500,
        crop: "fill",
        gravity: "face",
      },

      {
        quality: "auto",
      },

      {
        fetch_format: "auto",
      },

    ],

  }),

});

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

    fileSize: 2 * 1024 * 1024,

  },

});

/* ==========================================
   EXPORTS
========================================== */

export const uploadProfilePhoto =
  upload.single("photo");

export default upload;