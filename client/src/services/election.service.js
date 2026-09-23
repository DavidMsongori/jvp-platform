import api from "./api";

/* =======================================================
   ELECTIONS — MEMBER + GENERAL
======================================================= */

export const getElections = async () => {
  const response = await api.get("/elections");

  return response.data;
};


export const getElection = async (
  electionId
) => {
  const response = await api.get(
    `/elections/${electionId}`
  );

  return response.data;
};


export const getAdminElections = async () => {
  const response = await api.get("/elections/admin");
  return response.data;
};

export const createElection = async (
  electionData
) => {
  const response = await api.post(
    "/elections",
    electionData
  );

  return response.data;
};


export const updateElection = async (
  electionId,
  electionData
) => {
  const response = await api.patch(
    `/elections/${electionId}`,
    electionData
  );

  return response.data;
};


/* =======================================================
   POSITION MANAGEMENT
======================================================= */

export const addPosition = async (
  electionId,
  positionData
) => {
  const response = await api.post(
    `/elections/${electionId}/positions`,
    positionData
  );

  return response.data;
};


export const updatePosition = async (
  electionId,
  positionId,
  positionData
) => {
  const response = await api.patch(
    `/elections/${electionId}/positions/${positionId}`,
    positionData
  );

  return response.data;
};


export const removePosition = async (
  electionId,
  positionId
) => {
  const response = await api.delete(
    `/elections/${electionId}/positions/${positionId}`
  );

  return response.data;
};


/* =======================================================
   ELECTION LIFECYCLE
======================================================= */

export const openElection = async (
  electionId
) => {
  const response = await api.post(
    `/elections/${electionId}/open`
  );

  return response.data;
};


export const startVoting = async (
  electionId
) => {
  const response = await api.post(
    `/elections/${electionId}/start-voting`
  );

  return response.data;
};


export const prepareElectionForVoting = async (
  electionId
) => {
  const response = await api.post(
    `/elections/${electionId}/prepare-for-voting`
  );

  return response.data;
};


export const closeElection = async (
  electionId
) => {
  const response = await api.post(
    `/elections/${electionId}/close`
  );

  return response.data;
};


export const cancelElection = async (
  electionId
) => {
  const response = await api.post(
    `/elections/${electionId}/cancel`
  );

  return response.data;
};


export const publishResults = async (
  electionId
) => {
  const response = await api.post(
    `/elections/${electionId}/publish-results`
  );

  return response.data;
};


/* =======================================================
   ELECTION SETUP
======================================================= */

export const getElectionSetup = async (
  electionId
) => {
  const response = await api.get(
    `/elections/${electionId}/setup`
  );

  return response.data;
};


/* =======================================================
   MEMBER SEARCH — ADMIN
======================================================= */

export const searchMembersForElection = async (
  search
) => {
  const response = await api.get(
    "/elections/members/search",
    {
      params: {
        q: search,
      },
    }
  );

  return response.data;
};


/* =======================================================
   EXISTING ASPIRANTS — ADMIN
======================================================= */

export const addExistingAspirant = async (
  electionId,
  aspirantData
) => {
  const response = await api.post(
    `/elections/${electionId}/existing-aspirants`,
    aspirantData
  );

  return response.data;
};


export const removeExistingAspirant = async (
  electionId,
  aspirantId
) => {
  const response = await api.delete(
    `/elections/${electionId}/existing-aspirants/${aspirantId}`
  );

  return response.data;
};


/* =======================================================
   APPLICATIONS — MEMBER
======================================================= */

export const submitApplication = async (
  electionId,
  positionId,
  applicationData
) => {
  const response = await api.post(
    `/elections/${electionId}/positions/${positionId}/apply`,
    applicationData
  );

  return response.data;
};


export const withdrawApplication = async (
  applicationId
) => {
  const response = await api.patch(
    `/elections/applications/${applicationId}/withdraw`
  );

  return response.data;
};


export const getMyApplications = async () => {
  const response = await api.get(
    "/elections/my-applications"
  );

  return response.data;
};


/* =======================================================
   APPLICATIONS — ADMIN
======================================================= */

export const getApplications = async (
  params = {}
) => {
  const response = await api.get(
    "/elections/applications",
    {
      params,
    }
  );

  return response.data;
};


export const getApplication = async (
  applicationId
) => {
  const response = await api.get(
    `/elections/applications/${applicationId}`
  );

  return response.data;
};


export const reviewApplication = async (
  applicationId,
  reviewData
) => {
  const response = await api.patch(
    `/elections/applications/${applicationId}/review`,
    reviewData
  );

  return response.data;
};


/* =======================================================
   ASPIRANTS
======================================================= */

export const getAspirants = async (
  electionId
) => {
  const response = await api.get(
    `/elections/${electionId}/aspirants`
  );

  return response.data;
};


export const getAllAspirants = async (
  params = {}
) => {
  const response = await api.get(
    "/elections/aspirants",
    {
      params,
    }
  );

  return response.data;
};


export const getAspirant = async (
  aspirantId
) => {
  const response = await api.get(
    `/elections/aspirants/${aspirantId}`
  );

  return response.data;
};


/* =======================================================
   VOTING
======================================================= */

export const castVote = async (
  electionId,
  positionId,
  aspirantId
) => {
  const response = await api.post(
    `/elections/${electionId}/positions/${positionId}/vote`,
    {
      aspirantId,
    }
  );

  return response.data;
};


export const getMyVotes = async (
  electionId = null
) => {
  const endpoint = electionId
    ? `/elections/${electionId}/my-votes`
    : "/elections/my-votes";

  const response = await api.get(endpoint);

  return response.data;
};


/* =======================================================
   RESULTS
======================================================= */

export const getResults = async (
  electionId
) => {
  const response = await api.get(
    `/elections/${electionId}/results`
  );

  return response.data;
};


/* =======================================================
   DEFAULT EXPORT
======================================================= */

export default {
  getElections,
  getElection,
  createElection,
  updateElection,

  addPosition,
  updatePosition,
  removePosition,

  openElection,
  startVoting,
  prepareElectionForVoting,
  closeElection,
  cancelElection,
  publishResults,

  getElectionSetup,

  searchMembersForElection,

  addExistingAspirant,
  removeExistingAspirant,

  submitApplication,
  withdrawApplication,
  getMyApplications,

  getApplications,
  getApplication,
  reviewApplication,

  getAspirants,
  getAllAspirants,
  getAspirant,

  castVote,
  getMyVotes,

  getResults,
};