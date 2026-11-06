import api from "./api";

// Get all events with optional search and filters.
export const getEvents = async (params = {}) => {
  const response = await api.get("/events", { params });
  return response.data;
};

// Get featured events.
export const getFeaturedEvents = async (limit = 6) => {
  const response = await api.get("/events/featured", {
    params: { limit },
  });
  return response.data;
};

// Get upcoming events.
export const getUpcomingEvents = async (limit = 10) => {
  const response = await api.get("/events/upcoming", {
    params: { limit },
  });
  return response.data;
};

// Get ongoing events.
export const getOngoingEvents = async () => {
  const response = await api.get("/events/ongoing");
  return response.data;
};

// Get events by category.
export const getEventsByCategory = async (
  category,
  limit = 20
) => {
  const response = await api.get(
    `/events/category/${encodeURIComponent(category)}`,
    { params: { limit } }
  );
  return response.data;
};

// Get one event using its slug.
export const getEventBySlug = async (slug) => {
  const response = await api.get(
    `/events/slug/${encodeURIComponent(slug)}`
  );
  return response.data;
};

// Get one event using its ID.
export const getEventById = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

// Get the logged-in member's event registrations.
export const getMyEventRegistrations = async (params = {}) => {
  const response = await api.get("/events/my-registrations", {
    params,
  });
  return response.data;
};

// Register for an event.
export const registerForEvent = async (eventId) => {
  const response = await api.post(`/events/${eventId}/register`);
  return response.data;
};

// Get the logged-in member's registration for one event.
export const getMyEventRegistration = async (eventId) => {
  const response = await api.get(
    `/events/${eventId}/registration`
  );
  return response.data;
};

// Cancel an event registration.
export const cancelEventRegistration = async (
  eventId,
  reason = ""
) => {
  const response = await api.delete(
    `/events/${eventId}/register`,
    { data: { reason } }
  );
  return response.data;
};

export default {
  getEvents,
  getFeaturedEvents,
  getUpcomingEvents,
  getOngoingEvents,
  getEventsByCategory,
  getEventBySlug,
  getEventById,
  getMyEventRegistrations,
  registerForEvent,
  getMyEventRegistration,
  cancelEventRegistration,
};
