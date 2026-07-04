const jwt = require("jsonwebtoken");

const Member = require("../models/Member");

const protect = async (req, res, next) => {

    try {

        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {

            return res.status(401).json({

                success:false,

                message:"Unauthorized",

            });

        }

        const decoded = jwt.verify(

            token,

            process.env.JWT_SECRET

        );

        req.member = await Member.findById(

            decoded.id

        ).select("-password");

        next();

    } catch (error) {

        return res.status(401).json({

            success:false,

            message:"Invalid token",

        });

    }

};

module.exports = protect;