const authService = require("../services/auth.service");

/* =====================================================
   ACTIVATE MEMBER
===================================================== */

const activateMembership = async (req, res) => {
  try {
    const result = await authService.activate(req.body);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      data: {
        member: {
          id: result.member._id,
          firstName: result.member.firstName,
          middleName: result.member.middleName,
          lastName: result.member.lastName,
          phone: result.member.phone,
          email: result.member.email,
          county: result.member.county,
          constituency: result.member.constituency,
          ward: result.member.ward,
          role: result.member.role,
          activationStatus: result.member.activationStatus,
          membershipStatus: result.member.membershipStatus,
        },

        // DEVELOPMENT ONLY
        // Remove this when SMS/Email OTP is implemented
        otp: result.otp,
      },
    });
  } catch (error) {
    console.error("Activate Membership:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

/* =====================================================
   VERIFY OTP
===================================================== */

const verifyOTP = async (req, res) => {
  try {
    const result = await authService.verifyOTP(req.body);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      data: {
        memberId: result.member._id,
        activationStatus: result.member.activationStatus,
        nextStep: "Create Password",
      },
    });
  } catch (error) {
    console.error("Verify OTP:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

/* =====================================================
   CREATE PASSWORD
===================================================== */

const createPassword = async (req, res) => {
  try {
    const result = await authService.createPassword(req.body);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      data: {
        token: result.token,

        member: {
          id: result.member._id,
          membershipNumber: result.member.membershipNumber,
          firstName: result.member.firstName,
          middleName: result.member.middleName,
          lastName: result.member.lastName,
          phone: result.member.phone,
          email: result.member.email,
          county: result.member.county,
          constituency: result.member.constituency,
          ward: result.member.ward,
          role: result.member.role,
          activationStatus: result.member.activationStatus,
          membershipStatus: result.member.membershipStatus,
          memberSince: result.member.memberSince,
        },
      },
    });
  } catch (error) {
    console.error("Create Password:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

/* =====================================================
   LOGIN
===================================================== */

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      data: {
        token: result.token,

        member: {
          id: result.member._id,
          membershipNumber: result.member.membershipNumber,
          firstName: result.member.firstName,
          middleName: result.member.middleName,
          lastName: result.member.lastName,
          phone: result.member.phone,
          email: result.member.email,
          county: result.member.county,
          constituency: result.member.constituency,
          ward: result.member.ward,
          role: result.member.role,
          activationStatus: result.member.activationStatus,
          membershipStatus: result.member.membershipStatus,
          profileCompleted: result.member.profileCompleted,
          profilePhoto: result.member.profilePhoto,
          lastLogin: result.member.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error("Login:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

/* =====================================================
   CURRENT LOGGED-IN MEMBER
===================================================== */

const me = async (req, res) => {
  try {
    const result = await authService.me(req.member._id);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      data: result.member,
    });
  } catch (error) {
    console.error("Current Member:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
    });
  }
};

module.exports = {
  activateMembership,
  verifyOTP,
  createPassword,
  login,
  me,
};