import api from "./api";

/* ==========================================
   MEMBER PROFILE
========================================== */

export const getMyProfile = async () => {

  const response = await api.get(
    "/member/me"
  );

  return response.data;

};

export const updateMyProfile = async (
  profileData
) => {

  const response = await api.put(
    "/member/me",
    profileData
  );

  return response.data;

};

/* ==========================================
   PROFILE PHOTO
========================================== */

export const uploadProfilePhoto = async (file) => {

  const formData = new FormData();

  formData.append("photo", file);

  const response = await api.post(
    "/member/photo",
    formData
  );

  return response.data;

};

/* ==========================================
   MEMBER DASHBOARD
========================================== */

export const getDashboard = async () => {

  const response = await api.get(
    "/member/dashboard"
  );

  return response.data;

};

/* ==========================================
   MEMBERSHIP CARD
========================================== */

export const getMembershipCard = async () => {

  const response = await api.get(
    "/member/card"
  );

  return response.data;

};

/* ==========================================
   EVENTS
========================================== */

export const getMyEvents = async () => {

  const response = await api.get(
    "/member/events"
  );

  return response.data;

};

/* ==========================================
   PROGRAMS
========================================== */

export const getMyPrograms = async () => {

  const response = await api.get(
    "/member/programs"
  );

  return response.data;

};

/* ==========================================
   CERTIFICATES
========================================== */

export const getMyCertificates = async () => {

  const response = await api.get(
    "/member/certificates"
  );

  return response.data;

};

/* ==========================================
   DEFAULT EXPORT
========================================== */

export default {

  getMyProfile,

  updateMyProfile,

  uploadProfilePhoto,

  getDashboard,

  getMembershipCard,

  getMyEvents,

  getMyPrograms,

  getMyCertificates,

};