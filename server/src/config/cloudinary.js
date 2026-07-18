import { v2 as cloudinary } from "cloudinary";

/* ==========================================
   CLOUDINARY CONFIGURATION
========================================== */

cloudinary.config({

  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

  api_key: process.env.CLOUDINARY_API_KEY,

  api_secret: process.env.CLOUDINARY_API_SECRET,

  secure: true,

});

console.log({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret_loaded: !!process.env.CLOUDINARY_API_SECRET,
});


export default cloudinary;