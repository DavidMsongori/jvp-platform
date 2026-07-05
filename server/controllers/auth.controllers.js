const Member = require("../models/Member");
const generateToken = require("../utils/generateToken");
const generateOTP = require("../utils/generateOTP");

/* ==========================================
   ACTIVATE EXISTING MEMBER
========================================== */

const activateMembership = async (req, res) => {
  try {
    const { phone, email } = req.body;

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: "Phone number or email is required.",
      });
    }

    const member = await Member.findOne({
      $or: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    const otp = generateOTP();

    member.activationStatus = "Pending OTP";
    member.otp = otp;
    member.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await member.save();

    console.log("====================================");
    console.log("JVP CONNECT OTP");
    console.log("Member:", member.firstName, member.lastName);
    console.log("OTP:", otp);
    console.log("====================================");

    return res.json({
      success: true,
      otpSent: true,
      message: "Member found. OTP generated successfully.",

      member: {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        email: member.email,
        county: member.county,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================
   VERIFY OTP
========================================== */

const verifyOTP = async (req, res) => {
  try {
    const { phone, email, otp } = req.body;

    if ((!phone && !email) || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone/Email and OTP are required.",
      });
    }

    const member = await Member.findOne({
      $or: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    if (!member.otp) {
      return res.status(400).json({
        success: false,
        message: "No OTP has been generated.",
      });
    }

    if (member.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (member.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired.",
      });
    }

    member.activationStatus = "OTP Verified";

    await member.save();

    return res.json({
      success: true,
      message: "OTP verified successfully.",

      member: {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        email: member.email,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================
   CREATE PASSWORD
========================================== */

const createPassword = async (req, res) => {
  try {
    const { memberId, password } = req.body;

    if (!memberId || !password) {
      return res.status(400).json({
        success: false,
        message: "Member ID and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    member.password = password;

    member.activationStatus = "Activated";
    member.activationDate = new Date();

    member.memberSince = new Date();

    member.membershipStatus = "Active";

    member.migrationCompleted = true;

    member.profileCompleted = false;

    member.passwordCreatedAt = new Date();

    member.otp = null;
    member.otpExpires = null;

    await member.save();

    const token = generateToken(member);

    return res.json({
      success: true,
      message: "Password created successfully.",

      token,

      member: {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        email: member.email,
        county: member.county,
        membershipNumber: member.membershipNumber,
        membershipStatus: member.membershipStatus,
        profileCompleted: member.profileCompleted,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================
   MEMBER LOGIN
========================================== */

const login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if ((!phone && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone/Email and password are required.",
      });
    }

    const member = await Member.findOne({
      $or: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    if (!member.password) {
      return res.status(400).json({
        success: false,
        message: "Please activate your account first.",
      });
    }

    const validPassword = await member.comparePassword(password);

    if (!validPassword) {
      member.failedLoginAttempts += 1;

      await member.save();

      return res.status(401).json({
        success: false,
        message: "Incorrect password.",
      });
    }

    member.failedLoginAttempts = 0;
    member.lastLogin = new Date();
    member.loginCount += 1;

    await member.save();

    const token = generateToken(member);

    return res.json({
      success: true,
      message: "Login successful.",

      token,

      member: {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        email: member.email,
        county: member.county,
        membershipNumber: member.membershipNumber,
        membershipStatus: member.membershipStatus,
        profilePhoto: member.profilePhoto,
        role: member.role,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  activateMembership,
  verifyOTP,
  createPassword,
  login,
};