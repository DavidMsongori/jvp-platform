import express from "express";

import {
  getCoastGeography,
} from "../controllers/geography.controller.js";

const router = express.Router();

/* ==========================================
   PUBLIC COAST GEOGRAPHY
========================================== */

router.get(
  "/coast",
  getCoastGeography
);

export default router;