import * as authService from "../services/auth.service.js";

/* ==========================================================
   REGISTER NEW MEMBER
========================================================== */

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    return res.status(201).json({
      success: true,
      message: "Registration completed successfully. An OTP has been sent to your email.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   ACTIVATE IMPORTED MEMBER
========================================================== */

export const activateExistingMember = async (
  req,
  res,
  next
) => {
  try {
    const result = await authService.activateExistingMember(
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Membership verified. Please provide your email and create a new password to activate your account.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   VERIFY OTP
========================================================== */

export const verifyOTP = async (
  req,
  res,
  next
) => {
  try {
    const result = await authService.verifyOTP(
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   RESEND OTP
========================================================== */

export const resendOTP = async (
  req,
  res,
  next
) => {
  try {
    const result = await authService.resendOTP(
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   CREATE PASSWORD
========================================================== */

export const createPassword = async (
  req,
  res,
  next
) => {
  try {
    const result = await authService.createPassword(
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Password created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   LOGIN
========================================================== */

export const login = async (
  req,
  res,
  next
) => {
  try {
    const result = await authService.login(
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   FORGOT PASSWORD
========================================================== */

export const forgotPassword = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await authService.forgotPassword(
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "If the account exists, an OTP has been sent.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   RESET PASSWORD
========================================================== */

export const resetPassword = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await authService.resetPassword(
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   REFRESH TOKEN
========================================================== */

export const refreshToken = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await authService.refreshToken(
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Token refreshed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   LOGOUT
========================================================== */

export const logout = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await authService.logout(
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};