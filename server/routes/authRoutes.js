const express = require("express");

const router = express.Router();

const{

    activateMembership,

    login

}=require("../controllers/auth.controllers");

router.post(

    "/activate",

    activateMembership

);

router.post(

    "/login",

    login

);

module.exports=router;