import express from "express";

import {
  getMeetingDirectoryController,
} from "../controllers/user.controller.js";

import auth from "../middleware/auth.js";

const router = express.Router();

/* ==========================================================
   MEETING DIRECTORY
========================================================== */

router.get(
  "/meeting-directory",
  auth,
  getMeetingDirectoryController
);

export default router;