const express = require("express");

const router = express.Router();

/* API Health Check */
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "JVP API is connected.",
  });
});

/* Route Imports */
const authRoutes = require("./authRoutes");
const memberRoutes = require("./memberRoutes");
const adminRoutes = require("./adminRoutes");
const importRoutes = require("./importRoutes");

/* API Routes */
router.use("/import", importRoutes);
router.use("/auth", authRoutes);
router.use("/members", memberRoutes);
router.use("/admin", adminRoutes);

module.exports = router;