import api from "./api";

/* ==========================================
   DASHBOARD
========================================== */

export const getDashboard = async () => {

  const response = await api.get(
    "/admin/dashboard"
  );

  return response.data;

};

/* ==========================================
   MEMBERS
========================================== */

export const getMembers = async (
  params = {}
) => {

  const response = await api.get(
    "/admin/members",
    {
      params,
    }
  );

  return response.data;

};

export const getMember = async (
  id
) => {

  const response = await api.get(
    `/admin/members/${id}`
  );

  return response.data;

};

export const updateMember = async (
  id,
  payload
) => {

  const response = await api.put(
    `/admin/members/${id}`,
    payload
  );

  return response.data;

};

/* ==========================================
   MEMBER STATUS
========================================== */

export const activateMember = async (
  id
) => {

  const response = await api.patch(
    `/admin/members/${id}/activate`
  );

  return response.data;

};

export const deactivateMember = async (
  id
) => {

  const response = await api.patch(
    `/admin/members/${id}/deactivate`
  );

  return response.data;

};

export const deleteMember = async (
  id
) => {

  const response = await api.delete(
    `/admin/members/${id}`
  );

  return response.data;

};

/* ==========================================
   PAYMENTS
========================================== */

export const getPayments = async (
  params = {}
) => {

  const response = await api.get(
    "/admin/payments",
    {
      params,
    }
  );

  return response.data;

};

export const verifyPayment = async (
  id,
  payload = {}
) => {

  const response = await api.patch(
    `/admin/payments/${id}/verify`,
    payload
  );

  return response.data;

};

/* ==========================================
   MANUAL M-PESA VERIFICATION QUEUE
========================================== */

export const getManualMpesaQueue = async (
  params = {}
) => {

  const response = await api.get(
    "/payments/admin/manual-mpesa",
    {
      params,
    }
  );

  return response.data;

};

export const approveManualMpesaPayment = async (
 reference
) => {

  const response = await api.patch(
    `/payments/admin/approve/${reference}`
  );

  return response.data;

};

/* ==========================================
   EVENTS
========================================== */

export const getEvents = async (
  params = {}
) => {

  const response = await api.get(
    "/admin/events",
    {
      params,
    }
  );

  return response.data;

};

export const getEvent = async (
  id
) => {

  const response = await api.get(
    `/admin/events/${id}`
  );

  return response.data;

};

export const createEvent = async (
  payload
) => {

  const response = await api.post(
    "/admin/events",
    payload
  );

  return response.data;

};

export const updateEvent = async (
  id,
  payload
) => {

  const response = await api.put(
    `/admin/events/${id}`,
    payload
  );

  return response.data;

};

export const deleteEvent = async (
  id
) => {

  const response = await api.delete(
    `/admin/events/${id}`
  );

  return response.data;

};

/* ==========================================
   REPORTS
========================================== */

export const getReports = async () => {

  const response = await api.get(
    "/admin/reports"
  );

  return response.data;

};

/* ==========================================
   ACTIVITY LOGS
========================================== */

export const getActivityLogs = async (
  params = {}
) => {

  const response = await api.get(
    "/admin/activity-logs",
    {
      params,
    }
  );

  return response.data;

};

/* ==========================================
   DEFAULT EXPORT
========================================== */

export default {

  /* Dashboard */

  getDashboard,

  /* Members */

  getMembers,
  getMember,
  updateMember,
  activateMember,
  deactivateMember,
  deleteMember,

  /* Payments */

  getPayments,
  verifyPayment,
  getManualMpesaQueue,
  approveManualMpesaPayment,

  /* Events */

  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,

  /* Reports */

  getReports,

  /* Activity */

  getActivityLogs,

};