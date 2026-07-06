const express = require("express");

const router = express.Router();

const {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  getDashboard,
  getMembershipCard,
  getAllMembers,
  getMemberById,
} = require("../controllers/member.controller");

const {
  protect,
  authorize,
} = require("../middleware/auth.middleware");

const {
  uploadProfilePhoto: uploadPhoto,
} = require("../middleware/upload.middleware");

/* =====================================================
   MEMBER ROUTES
===================================================== */

/**
 * Get logged-in member profile
 * GET /api/member/profile
 */
router.get(
  "/profile",
  protect,
  getProfile
);

/**
 * Update logged-in member profile
 * PUT /api/member/profile
 */
router.put(
  "/profile",
  protect,
  updateProfile
);

/**
 * Upload profile photo
 * POST /api/member/photo
 *
 * Form-Data:
 * photo : File
 */
router.post(
  "/photo",
  protect,
  uploadPhoto,
  uploadProfilePhoto
);

/**
 * Member Dashboard
 * GET /api/member/dashboard
 */
router.get(
  "/dashboard",
  protect,
  getDashboard
);

/**
 * Membership Card
 * GET /api/member/card
 */
router.get(
  "/card",
  protect,
  getMembershipCard
);

/* =====================================================
   ADMIN ROUTES
===================================================== */

/**
 * Get all members
 * GET /api/member
 */
router.get(
  "/",
  protect,
  authorize(
    "secretariat",
    "admin",
    "super_admin"
  ),
  getAllMembers
);

/**
 * Get member by ID
 * GET /api/member/:id
 */
router.get(
  "/:id",
  protect,
  authorize(
    "secretariat",
    "admin",
    "super_admin"
  ),
  getMemberById
);

module.exports = router;