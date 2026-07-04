const express = require("express");

const router = express.Router();

const authRoutes = require("./authRoutes");
const memberRoutes = require("./memberRoutes");
const adminRoutes = require("./adminRoutes");
const importRoutes = require("./importRoutes");

router.use(

    "/import",

    importRoutes

);

router.use("/auth", authRoutes);

router.use("/members", memberRoutes);

router.use("/admin", adminRoutes);

module.exports = router;