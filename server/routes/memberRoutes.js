const express = require("express");

const router = express.Router();

const {
  testDatabase,
} = require("../controllers/memberController");

router.get("/test", testDatabase);

module.exports = router;