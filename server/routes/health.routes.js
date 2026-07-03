const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "JVP Connect API is running",
    version: "1.0.0"
  });
});

module.exports = router;