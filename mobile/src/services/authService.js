
import api from "./api";
import * as SecureStore from "expo-secure-store";

// Save the token returned by successful authentication.
const saveToken = async (response) => {
  const token = response?.data?.token;

  if (token) {
    await SecureStore.setItemAsync("token", token);
  }

  return response;
};

// REGISTER NEW MEMBER
export const register = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

// ACTIVATE EXISTING MEMBER
export const activateMembership = async (payload) => {
  const response = await api.post("/auth/activate", payload);
  return response.data;
};

// VERIFY EMAIL OTP
export const verifyOTP = async (payload) => {
  const response = await api.post("/auth/verify-otp", payload);
  return response.data;
};

// RESEND OTP
export const resendOTP = async (payload) => {
  const response = await api.post("/auth/resend-otp", payload);
  return response.data;
};

// CREATE ACCOUNT PASSWORD
export const createPassword = async (payload) => {
  const response = await api.post("/auth/create-password", payload);
  await saveToken(response.data);
  return response.data;
};

// LOGIN
export const login = async (payload) => {
  const response = await api.post("/auth/login", payload);
  await saveToken(response.data);
  return response.data;
};

// GET CURRENT MEMBER PROFILE
export const getCurrentMember = async () => {
  const response = await api.get("/member/me");
  return response.data;
};

// FORGOT PASSWORD
export const forgotPassword = async (payload) => {
  const response = await api.post("/auth/forgot-password", payload);
  return response.data;
};

// RESET PASSWORD
export const resetPassword = async (payload) => {
  const response = await api.post("/auth/reset-password", payload);
  await saveToken(response.data);
  return response.data;
};

// LOGOUT
export const logout = async () => {
  try {
    const response = await api.post("/auth/logout");
    return response.data;
  } finally {
    await SecureStore.deleteItemAsync("token");
  }
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
};
