const express = require("express");

const router = express.Router();

const authRoutes = require("./auth.routes");
const memberRoutes = require("./member.routes");

/* =====================================================
   API ROUTES
===================================================== */

router.use("/auth", authRoutes);

router.use("/member", memberRoutes);

/* =====================================================
   API ROOT
===================================================== */

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    application: "JVP Connect API",
    version: "1.0.0",
    status: "Running",
  });
});

module.exports = router;