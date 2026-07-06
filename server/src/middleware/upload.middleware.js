const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =====================================================
   CREATE UPLOAD DIRECTORIES
===================================================== */

const profileUploadPath = path.join(
  __dirname,
  "../../uploads/profiles"
);

if (!fs.existsSync(profileUploadPath)) {
  fs.mkdirSync(profileUploadPath, {
    recursive: true,
  });
}

/* =====================================================
   STORAGE CONFIGURATION
===================================================== */

const storage = multer.diskStorage({

  destination(req, file, cb) {

    cb(null, profileUploadPath);

  },

  filename(req, file, cb) {

    const extension =
      path.extname(file.originalname);

    cb(
      null,
      `${req.member._id}${extension.toLowerCase()}`
    );

  },

});

/* =====================================================
   FILE FILTER
===================================================== */

const fileFilter = (req, file, cb) => {

  const allowedTypes = [

    "image/jpeg",

    "image/jpg",

    "image/png",

    "image/webp"

  ];

  if (allowedTypes.includes(file.mimetype)) {

    cb(null, true);

  } else {

    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      ),
      false
    );

  }

};

/* =====================================================
   MULTER CONFIGURATION
===================================================== */

const upload = multer({

  storage,

  fileFilter,

  limits: {

    fileSize: 2 * 1024 * 1024 // 2 MB

  }

});

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {

  uploadProfilePhoto: upload.single("photo"),

};