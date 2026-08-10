import {
  COAST_GEOGRAPHY,
} from "../data/geography.js";

/* ==========================================
   GET COAST GEOGRAPHY
========================================== */

export const getCoastGeography =
  async (req, res) => {
    return res.status(200).json({
      success: true,

      message:
        "Coast geography retrieved successfully.",

      data: {
        geography:
          COAST_GEOGRAPHY,
      },
    });
  };