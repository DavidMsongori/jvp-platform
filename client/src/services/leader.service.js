import api from "./api";

/* ==========================================================
   LEADERSHIP DIRECTORY
========================================================== */

const getPublicLeaders = async () => {
  const response = await api.get("/leaders/public");
  return response.data;
};

const getLeader = async (leaderId) => {
  const response = await api.get(`/leaders/${leaderId}`);
  return response.data;
};


/* ==========================================================
   LEADERSHIP DASHBOARD
========================================================== */

const getLeadershipDashboard = async (params = {}) => {
  const response = await api.get("/leaders/dashboard", {
    params,
  });

  return response.data;
};

/* ==========================================================
   ADMIN
========================================================== */

const getLeaders = async (params = {}) => {
  const response = await api.get("/leaders/admin/all", {
    params,
  });

  return response.data;
};

const getStatistics = async () => {
  const response = await api.get("/leaders/statistics");
  return response.data;
};

const createLeader = async (data) => {
  const response = await api.post("/leaders", data);
  return response.data;
};

const updateLeader = async (leaderId, data) => {
  const response = await api.put(
    `/leaders/${leaderId}`,
    data
  );

  return response.data;
};

const activateLeader = async (leaderId) => {
  const response = await api.patch(
    `/leaders/${leaderId}/activate`
  );

  return response.data;
};

const deactivateLeader = async (leaderId) => {
  const response = await api.patch(
    `/leaders/${leaderId}/deactivate`
  );

  return response.data;
};

const deleteLeader = async (leaderId) => {
  const response = await api.delete(
    `/leaders/${leaderId}`
  );

  return response.data;
};

const leaderService = {
  /* Public */
  getPublicLeaders,
  getLeader,

  /* Leadership Dashboard */
  getLeadershipDashboard,

  /* Admin */
  getLeaders,
  getStatistics,

  createLeader,
  updateLeader,

  activateLeader,
  deactivateLeader,
  deleteLeader,
};

export default leaderService;