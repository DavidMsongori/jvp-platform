import api from "./api";

/* ==========================================================
   REGISTER
========================================================== */

export const register = async (payload) => {
  const response = await api.post(
    "/auth/register",
    payload
  );

  return response.data;
};

/* ==========================================================
   ACTIVATE IMPORTED MEMBER
========================================================== */

export const activateMembership = async (payload) => {
  const response = await api.post(
    "/auth/activate",
    payload
  );

  return response.data;
};

/* ==========================================================
   VERIFY OTP
========================================================== */

export const verifyOTP = async (payload) => {
  const response = await api.post(
    "/auth/verify-otp",
    payload
  );

  return response.data;
};

/* ==========================================================
   RESEND OTP
========================================================== */

export const resendOTP = async (payload) => {
  const response = await api.post(
    "/auth/resend-otp",
    payload
  );

  return response.data;
};

/* ==========================================================
   CREATE PASSWORD
========================================================== */

export const createPassword = async (payload) => {
  const response = await api.post(
    "/auth/create-password",
    payload
  );

  return response.data;
};

/* ==========================================================
   LOGIN
========================================================== */

export const login = async (payload) => {
  const response = await api.post(
    "/auth/login",
    payload
  );

  return response.data;
};

/* ==========================================================
   CURRENT MEMBER
========================================================== */

export const getCurrentMember = async () => {
  const response = await api.get("/member/me");
  return response.data;
};

/* ==========================================================
   FORGOT PASSWORD
========================================================== */

export const forgotPassword = async (payload) => {
  const response = await api.post(
    "/auth/forgot-password",
    payload
  );

  return response.data;
};

/* ==========================================================
   RESET PASSWORD
========================================================== */

export const resetPassword = async (payload) => {
  const response = await api.post(
    "/auth/reset-password",
    payload
  );

  return response.data;
};

/* ==========================================================
   LOGOUT
========================================================== */

export const logout = async () => {
  const response = await api.post(
    "/auth/logout"
  );

  return response.data;
};

/* ==========================================================
   REFRESH TOKEN
========================================================== */

export const refreshToken = async () => {
  const response = await api.post(
    "/auth/refresh-token"
  );

  return response.data;
};

export default {
  register,
  activateMembership,
  verifyOTP,
  resendOTP,
  createPassword,
  login,
  getCurrentMember,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
};