
import api from "./api";

/**
 * Retrieve the authenticated member's profile.
 */
export const getMyProfile = async () => {
  const response = await api.get("/member/me");
  return response.data;
};

/**
 * Update the authenticated member's profile.
 */
export const updateMyProfile = async (profileData) => {
  const response = await api.put("/member/me", profileData);
  return response.data;
};

/**
 * Upload or replace the member's profile picture.
 */
export const uploadProfilePhoto = async (image) => {
  const formData = new FormData();

  formData.append("photo", {
    uri: image.uri,
    name: image.fileName || `profile-${Date.now()}.jpg`,
    type: image.mimeType || "image/jpeg",
  });

  const response = await api.post("/member/photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export default {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
};
