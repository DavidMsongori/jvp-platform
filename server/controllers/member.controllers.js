const memberService = require("../services/memberServices");

/* ==========================================
   GET MY PROFILE
========================================== */

const getMyProfile = async (req, res) => {
  try {

    const member = await memberService.getMemberProfile(
      req.member._id
    );

    res.json({
      success: true,
      member,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ==========================================
   UPDATE MY PROFILE
========================================== */

const updateMyProfile = async (req, res) => {
  try {

    const member = await memberService.updateMemberProfile(
      req.member._id,
      req.body
    );

    res.json({
      success: true,
      message: "Profile updated successfully.",
      member,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};