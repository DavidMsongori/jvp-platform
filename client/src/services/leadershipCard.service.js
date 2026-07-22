import api from "./api";

/* ==========================================================
   MY CARD
========================================================== */

const getMyLeadershipCard = async () => {
  const response = await api.get(
    "/leadership-card/me"
  );

  return response.data;
};

/* ==========================================================
   CARD
========================================================== */

const getLeadershipCard = async (leaderId) => {
  const response = await api.get(
    `/leadership-card/${leaderId}`
  );

  return response.data;
};

const regenerateLeadershipCard = async (
  leaderId
) => {
  const response = await api.post(
    `/leadership-card/${leaderId}/regenerate`
  );

  return response.data;
};

/* ==========================================================
   PUBLIC
========================================================== */

const verifyLeadershipCard = async (code) => {
  const response = await api.get(
    `/leadership-card/verify/${code}`
  );

  return response.data;
};

const getPublicLeadershipCard = async (code) => {
  const response = await api.get(
    `/leadership-card/public/${code}`
  );

  return response.data;
};

const leadershipCardService = {
  getMyLeadershipCard,

  getLeadershipCard,
  regenerateLeadershipCard,

  verifyLeadershipCard,
  getPublicLeadershipCard,
};

export default leadershipCardService;