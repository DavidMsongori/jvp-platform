const Member = require("../models/Member");
const generateToken = require("../utils/generateToken");

/* ==========================================
   Activate Existing Member
========================================== */

const activateMembership = async (req, res) => {

    try {

        const { phone, email } = req.body;

        if (!phone && !email) {

            return res.status(400).json({

                success:false,

                message:"Phone or Email is required."

            });

        }

        const member = await Member.findOne({

            $or:[

                ...(phone ? [{ phone }] : []),

                ...(email ? [{ email: email.toLowerCase() }] : [])

            ]

        });

        if(!member){

            return res.status(404).json({

                success:false,

                message:"Member not found."

            });

        }

        if(member.activationStatus === "Activated"){

            return res.status(400).json({

                success:false,

                message:"Account already activated."

            });

        }

        member.activationStatus = "Pending OTP";

        await member.save();

        return res.json({

            success:true,

            message:"Member found.",

            member:{

                id:member._id,

                firstName:member.firstName,

                lastName:member.lastName,

                county:member.county,

                phone:member.phone,

                email:member.email

            }

        });

    }

    catch(error){

        console.log(error);

        return res.status(500).json({

            success:false,

            message:error.message

        });

    }

};


/* ==========================================
   Login
========================================== */

const login = async (req,res)=>{

    try{

        const{

            phone,

            password

        }=req.body;

        const member = await Member.findOne({

            phone

        });

        if(!member){

            return res.status(404).json({

                success:false,

                message:"Member not found."

            });

        }

        const validPassword = await member.comparePassword(password);

        if(!validPassword){

            return res.status(401).json({

                success:false,

                message:"Incorrect password."

            });

        }

        member.lastLogin = new Date();

        member.loginCount += 1;

        await member.save();

        const token = generateToken(member);

        return res.json({

            success:true,

            token,

            member

        });

    }

    catch(error){

        return res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

module.exports={

    activateMembership,

    login

};