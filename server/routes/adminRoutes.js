const express = require("express");

const router = express.Router();

const {

    getMembers,

    getMember,

    updateMember,

    deleteMember,

    dashboardStats,

} = require("../controllers/adminController");

router.get("/members", getMembers);

router.get("/members/:id", getMember);

router.put("/members/:id", updateMember);

router.delete("/members/:id", deleteMember);

router.get("/dashboard", dashboardStats);

module.exports = router;