
import express from "express";

import auth from "../middleware/auth.js";
import requireActiveMembership from "../middleware/requireActiveMembership.js";
import validate from "../middleware/validate.js";

import {
  uploadProfilePhoto as uploadPhotoMiddleware,
} from "../middleware/upload.js";

import {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  getDashboard,
  searchMembers,
} from "../controllers/member.controller.js";

import {
  updateProfileValidator,
} from "../utils/member.validators.js";

const router = express.Router();

/* ==========================================
   MEMBER DASHBOARD
========================================== */

router.get(
  "/dashboard",
  auth,
  requireActiveMembership,
  getDashboard
);

/* ==========================================
   SEARCH MEMBERS
========================================== */

router.get(
  "/search",
  auth,
  requireActiveMembership,
  searchMembers
);

/* ==========================================
   MY PROFILE
   Remains accessible before payment.
========================================== */

router.get(
  "/me",
  auth,
  getMyProfile
);

router.put(
  "/me",
  auth,
  updateProfileValidator,
  validate,
  updateMyProfile
);

/* ==========================================
   PROFILE PHOTO
========================================== */

router.post(
  "/photo",
  auth,
  uploadPhotoMiddleware,
  uploadProfilePhoto
);

export default router;
