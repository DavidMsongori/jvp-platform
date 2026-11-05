
import { Router } from "express";

import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import { uploadSingle } from "../middleware/upload.js";

import {
  registerJVPAtOne,
  getJVPAtOneRegistrations,
} from "../controllers/jvpAtOne.controller.js";

import {
  registerJVPAtOneLeader,
   getJVPAtOneLeaderRegistrations,
} from "../controllers/jvpAtOneLeader.controller.js";

import {
  getJVPAtOnePhotos,
  uploadJVPAtOnePhoto,
  deleteJVPAtOnePhoto,
} from "../controllers/jvpAtOnePhoto.controller.js";

const router = Router();

// Public Lamu youth registration
router.post("/register", registerJVPAtOne);

// Public leaders registration
router.post("/leaders/register", registerJVPAtOneLeader);
// Protected: view registered JVP @ 1 leaders
router.get(
  "/leaders/registrations",
  auth,
  authorize("admin", "events", "super_admin"),
  getJVPAtOneLeaderRegistrations
);

// Protected: view registered youths
router.get(
  "/registrations",
  auth,
  authorize("admin", "events", "super_admin"),
  getJVPAtOneRegistrations
);

// Public photo gallery
router.get("/photos", getJVPAtOnePhotos);

// Protected photo management
router.post(
  "/photos",
  auth,
  authorize("admin", "events", "super_admin"),
  uploadSingle("photo"),
  uploadJVPAtOnePhoto
);

router.delete(
  "/photos/:id",
  auth,
  authorize("admin", "super_admin"),
  deleteJVPAtOnePhoto
);

export default router;
