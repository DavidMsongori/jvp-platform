const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {

    importMembers,

} = require("../controllers/importController");

router.post(

    "/",

    upload.single("file"),

    importMembers

);

module.exports=router;