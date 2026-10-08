import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useRef,
} from "react";

import eventService from "../services/event.service";

/* ===========================================================
   INITIAL STATE
=========================================================== */

const initialState = {
  /* ------------------------------------------
     EVENTS
  ------------------------------------------ */

  events: [],

  featuredEvents: [],

  upcomingEvents: [],

  ongoingEvents: [],

  selectedEvent: null,

  /* ------------------------------------------
     REGISTRATIONS
  ------------------------------------------ */

  registrations: [],

  myRegistration: null,

  /* ------------------------------------------
     DASHBOARD
  ------------------------------------------ */

  statistics: null,

  /* ------------------------------------------
     PAGINATION
  ------------------------------------------ */

  pagination: null,

  /* ------------------------------------------
     UI
  ------------------------------------------ */

  loading: false,

  submitting: false,

  error: null,
};

/* ===========================================================
   ACTION TYPES
=========================================================== */

const ACTIONS = {
  /* ---------- UI ---------- */

  SET_LOADING: "SET_LOADING",

  SET_SUBMITTING: "SET_SUBMITTING",

  SET_ERROR: "SET_ERROR",

  CLEAR_ERROR: "CLEAR_ERROR",

  /* ---------- EVENTS ---------- */

  SET_EVENTS: "SET_EVENTS",

  SET_FEATURED_EVENTS: "SET_FEATURED_EVENTS",

  SET_UPCOMING_EVENTS: "SET_UPCOMING_EVENTS",

  SET_ONGOING_EVENTS: "SET_ONGOING_EVENTS",

  SET_SELECTED_EVENT: "SET_SELECTED_EVENT",

  CLEAR_SELECTED_EVENT: "CLEAR_SELECTED_EVENT",

  /* ---------- REGISTRATIONS ---------- */

  SET_REGISTRATIONS: "SET_REGISTRATIONS",

  SET_MY_REGISTRATION: "SET_MY_REGISTRATION",

  /* ---------- DASHBOARD ---------- */

  SET_STATISTICS: "SET_STATISTICS",

  /* ---------- PAGINATION ---------- */

  SET_PAGINATION: "SET_PAGINATION",
};

/* ===========================================================
   REDUCER
=========================================================== */

const eventReducer = (state, action) => {
  switch (action.type) {
    /* ======================================
       UI
    ====================================== */

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case ACTIONS.SET_SUBMITTING:
      return {
        ...state,
        submitting: action.payload,
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    /* ======================================
       EVENTS
    ====================================== */

    case ACTIONS.SET_EVENTS:
      return {
        ...state,
        events: action.payload.events,
        pagination: action.payload.pagination,
      };

    case ACTIONS.SET_FEATURED_EVENTS:
      return {
        ...state,
        featuredEvents: action.payload,
      };

    case ACTIONS.SET_UPCOMING_EVENTS:
      return {
        ...state,
        upcomingEvents: action.payload,
      };

    case ACTIONS.SET_ONGOING_EVENTS:
      return {
        ...state,
        ongoingEvents: action.payload,
      };

    case ACTIONS.SET_SELECTED_EVENT:
      return {
        ...state,
        selectedEvent: action.payload,
      };

    case ACTIONS.CLEAR_SELECTED_EVENT:
      return {
        ...state,
        selectedEvent: null,
      };

    /* ======================================
       REGISTRATIONS
    ====================================== */

    case ACTIONS.SET_REGISTRATIONS:
      return {
        ...state,
        registrations: action.payload.registrations,
        pagination: action.payload.pagination,
      };

    case ACTIONS.SET_MY_REGISTRATION:
      return {
        ...state,
        myRegistration: action.payload,
      };

    /* ======================================
       DASHBOARD
    ====================================== */

    case ACTIONS.SET_STATISTICS:
      return {
        ...state,
        statistics: action.payload,
      };

    /* ======================================
       PAGINATION
    ====================================== */

    case ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: action.payload,
      };

    default:
      return state;
  }
};

/* ===========================================================
   CONTEXT
=========================================================== */

const EventContext = createContext(null);

/* ===========================================================
   PROVIDER
=========================================================== */

export const EventProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    eventReducer,
    initialState
  );

  /*
   * Tracks active loadEvents requests.
   *
   * Key:
   * JSON representation of the request parameters.
   *
   * This prevents the same request from being fired twice
   * simultaneously while still allowing different searches,
   * filters and pagination requests.
   */
  const eventsRequestsRef = useRef(new Map());

  /* =========================================================
     UI HELPERS
  ========================================================= */

  const setLoading = useCallback((value) => {
    dispatch({
      type: ACTIONS.SET_LOADING,
      payload: value,
    });
  }, []);

  const setSubmitting = useCallback((value) => {
    dispatch({
      type: ACTIONS.SET_SUBMITTING,
      payload: value,
    });
  }, []);

  const setError = useCallback((error) => {
    dispatch({
      type: ACTIONS.SET_ERROR,
      payload:
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong.",
    });
  }, []);

  const clearError = useCallback(() => {
    dispatch({
      type: ACTIONS.CLEAR_ERROR,
    });
  }, []);

  /* =========================================================
     LOAD EVENTS
  ========================================================= */

  const loadEvents = useCallback(
    async (params = {}) => {
      /*
       * Create a stable request key.
       *
       * This means:
       *
       * loadEvents({ page: 1 })
       *
       * called twice simultaneously will share one request.
       */
      const requestKey = JSON.stringify(params);

      const existingRequest =
        eventsRequestsRef.current.get(requestKey);

      if (existingRequest) {
        return existingRequest;
      }

      const request = (async () => {
        try {
          setLoading(true);
          clearError();

          const response =
            await eventService.getEvents(params);

          const eventList =
            Array.isArray(response?.data)
              ? response.data
              : response?.data?.events ??
                response?.events ??
                [];

          const pagination =
            response?.pagination ??
            response?.data?.pagination ??
            null;

          dispatch({
            type: ACTIONS.SET_EVENTS,
            payload: {
              events: eventList,
              pagination,
            },
          });

          return response;
        } catch (error) {
          setError(error);
          throw error;
        } finally {
          /*
           * Remove only this request.
           */
          eventsRequestsRef.current.delete(
            requestKey
          );

          setLoading(false);
        }
      })();

      eventsRequestsRef.current.set(
        requestKey,
        request
      );

      return request;
    },
    [
      setLoading,
      clearError,
      setError,
    ]
  );

  /* =========================================================
     SEARCH EVENTS
  ========================================================= */

  const searchEvents = useCallback(
    async (search, params = {}) => {
      try {
        setLoading(true);
        clearError();

        const response =
          await eventService.searchEvents(
            search,
            params
          );

        const eventList =
          Array.isArray(response?.data)
            ? response.data
            : response?.data?.events ??
              response?.events ??
              [];

        const pagination =
          response?.data?.pagination ??
          response?.pagination ??
          null;

        dispatch({
          type: ACTIONS.SET_EVENTS,
          payload: {
            events: eventList,
            pagination,
          },
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      setLoading,
      clearError,
      setError,
    ]
  );

  /* =========================================================
     FILTER EVENTS
  ========================================================= */

  const filterEvents = useCallback(
    async (filters = {}) => {
      try {
        setLoading(true);
        clearError();

        const response =
          await eventService.filterEvents(
            filters
          );

        const eventList =
          Array.isArray(response?.data)
            ? response.data
            : response?.data?.events ??
              response?.events ??
              [];

        const pagination =
          response?.data?.pagination ??
          response?.pagination ??
          null;

        dispatch({
          type: ACTIONS.SET_EVENTS,
          payload: {
            events: eventList,
            pagination,
          },
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      setLoading,
      clearError,
      setError,
    ]
  );

  /* =========================================================
     LOAD EVENT BY ID
  ========================================================= */

  const loadEventById = useCallback(
    async (id) => {
      if (!id) {
        return null;
      }

      try {
        setLoading(true);
        clearError();

        const response =
          await eventService.getEventById(id);

        const event =
          response?.data?.event ??
          response?.data ??
          response?.event ??
          response;

        dispatch({
          type: ACTIONS.SET_SELECTED_EVENT,
          payload: event,
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      setLoading,
      clearError,
      setError,
    ]
  );

  /* =========================================================
     LOAD EVENT BY SLUG
  ========================================================= */

  const loadEventBySlug = useCallback(
    async (slug) => {
      if (!slug) {
        return null;
      }

      try {
        setLoading(true);
        clearError();

        const response =
          await eventService.getEventBySlug(
            slug
          );

        const event =
          response?.data?.event ??
          response?.data ??
          response?.event ??
          response;

        dispatch({
          type:
            ACTIONS.SET_SELECTED_EVENT,
          payload: event,
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      setLoading,
      clearError,
      setError,
    ]
  );

  /* =========================================================
     FEATURED EVENTS
  ========================================================= */

  const loadFeaturedEvents = useCallback(
    async (limit = 6) => {
      try {
        clearError();

        const response =
          await eventService.getFeaturedEvents(
            limit
          );

        const featuredList =
          Array.isArray(response?.data)
            ? response.data
            : response?.data?.events ??
              response?.events ??
              [];

        dispatch({
          type:
            ACTIONS.SET_FEATURED_EVENTS,
          payload: featuredList,
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      }
    },
    [
      clearError,
      setError,
    ]
  );

  /* =========================================================
     UPCOMING EVENTS
  ========================================================= */

  const loadUpcomingEvents = useCallback(
    async (limit = 10) => {
      try {
        clearError();

        const response =
          await eventService.getUpcomingEvents(
            limit
          );

        const upcomingList =
          Array.isArray(response?.data)
            ? response.data
            : response?.data?.events ??
              response?.events ??
              response ??
              [];

        dispatch({
          type:
            ACTIONS.SET_UPCOMING_EVENTS,
          payload: upcomingList,
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      }
    },
    [
      clearError,
      setError,
    ]
  );

  /* =========================================================
     ONGOING EVENTS
  ========================================================= */

  const loadOngoingEvents = useCallback(
    async () => {
      try {
        clearError();

        const response =
          await eventService.getOngoingEvents();

        const ongoingList =
          Array.isArray(response?.data)
            ? response.data
            : response?.data?.events ??
              response?.events ??
              response ??
              [];

        dispatch({
          type:
            ACTIONS.SET_ONGOING_EVENTS,
          payload: ongoingList,
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      }
    },
    [
      clearError,
      setError,
    ]
  );

  /* =========================================================
     EVENTS BY CATEGORY
  ========================================================= */

  const loadEventsByCategory = useCallback(
    async (category, limit = 20) => {
      try {
        setLoading(true);
        clearError();

        const response =
          await eventService.getEventsByCategory(
            category,
            limit
          );

        const eventList =
          Array.isArray(response?.data)
            ? response.data
            : response?.data?.events ??
              response?.events ??
              response ??
              [];

        dispatch({
          type: ACTIONS.SET_EVENTS,
          payload: {
            events: eventList,
            pagination: null,
          },
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      setLoading,
      clearError,
      setError,
    ]
  );

  /* =========================================================
     CLEAR SELECTED EVENT
  ========================================================= */

  const clearSelectedEvent = useCallback(() => {
    dispatch({
      type:
        ACTIONS.CLEAR_SELECTED_EVENT,
    });
  }, []);

  /* =========================================================
     LOAD MY REGISTRATIONS
  ========================================================= */

  const loadMyRegistrations = useCallback(
    async (params = {}) => {
      try {
        setLoading(true);
        clearError();

        const response =
          await eventService.getMyRegistrations(
            params
          );

        const registrations =
          Array.isArray(response?.data)
            ? response.data
            : response?.data?.registrations ??
              response?.registrations ??
              [];

        const pagination =
          response?.pagination ??
          response?.data?.pagination ??
          null;

        dispatch({
          type:
            ACTIONS.SET_REGISTRATIONS,
          payload: {
            registrations,
            pagination,
          },
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      setLoading,
      clearError,
      setError,
    ]
  );

  /* =========================================================
     LOAD MY REGISTRATION
  ========================================================= */

  const loadMyRegistration = useCallback(
    async (eventId) => {
      if (!eventId) {
        return null;
      }

      try {
        const response =
          await eventService.getMyRegistration(
            eventId
          );

        dispatch({
          type:
            ACTIONS.SET_MY_REGISTRATION,
          payload:
            response?.data?.registration ??
            response?.data ??
            response?.registration ??
            response,
        });

        return response;
      } catch (error) {
        /*
         * A 404 simply means the member has not
         * registered for the event.
         */
        if (
          error?.response?.status === 404
        ) {
          dispatch({
            type:
              ACTIONS.SET_MY_REGISTRATION,
            payload: null,
          });

          return null;
        }

        console.error(
          "Failed to load registration:",
          error
        );

        dispatch({
          type:
            ACTIONS.SET_MY_REGISTRATION,
          payload: null,
        });

        throw error;
      }
    },
    []
  );

  /* =========================================================
     REGISTER FOR EVENT
  ========================================================= */

  const register = useCallback(
    async (
      eventId,
      registrationData = {}
    ) => {
      try {
        setSubmitting(true);

        const response =
          await eventService.registerForEvent(
            eventId,
            registrationData
          );

        dispatch({
          type:
            ACTIONS.SET_MY_REGISTRATION,
          payload:
            response?.data?.registration ??
            response?.data ??
            response?.registration ??
            response,
        });

        /*
         * Refresh member registrations.
         */
        await loadMyRegistrations();

        /*
         * We intentionally do not automatically reload
         * the event here. The registration response is
         * already available and reloading the event can
         * create unnecessary requests.
         */
        return response;
      } catch (error) {
        console.error(
          "Registration failed:",
          error
        );

        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [
      setSubmitting,
      loadMyRegistrations,
    ]
  );

  /* =========================================================
     CANCEL REGISTRATION
  ========================================================= */

  const cancelEventRegistration =
    useCallback(
      async (
        eventId,
        reason = ""
      ) => {
        try {
          setSubmitting(true);

          const response =
            await eventService.cancelRegistration(
              eventId,
              reason
            );

          dispatch({
            type:
              ACTIONS.SET_MY_REGISTRATION,
            payload: null,
          });

          /*
           * Refresh member registrations.
           */
          await loadMyRegistrations();

          return response;
        } catch (error) {
          console.error(
            "Failed to cancel registration:",
            error
          );

          throw error;
        } finally {
          setSubmitting(false);
        }
      },
      [
        setSubmitting,
        loadMyRegistrations,
      ]
    );

  /* =========================================================
     DASHBOARD STATISTICS
  ========================================================= */

  const loadDashboardStatistics =
    useCallback(
      async () => {
        try {
          setLoading(true);
          clearError();

          const response =
            await eventService.getDashboardStatistics();

          dispatch({
            type:
              ACTIONS.SET_STATISTICS,
            payload:
              response?.data?.statistics ??
              response?.data ??
              response?.statistics ??
              response,
          });

          return response;
        } catch (error) {
          setError(error);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      [
        setLoading,
        clearError,
        setError,
      ]
    );

  /* =========================================================
     CREATE EVENT
  ========================================================= */

  const createNewEvent = useCallback(
    async (eventData) => {
      try {
        setSubmitting(true);
        clearError();

        const response =
          await eventService.createEvent(
            eventData
          );

        /*
         * Refresh the default event listing.
         */
        await loadEvents({
          page: 1,
          limit: 20,
          sort: "date_asc",
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [
      setSubmitting,
      clearError,
      setError,
      loadEvents,
    ]
  );

  /* =========================================================
     UPDATE EVENT
  ========================================================= */

  const updateExistingEvent =
    useCallback(
      async (
        eventId,
        eventData
      ) => {
        try {
          setSubmitting(true);
          clearError();

          const response =
            await eventService.updateEvent(
              eventId,
              eventData
            );

          /*
           * Refresh the selected event if this
           * is the event currently being viewed.
           */
          if (
            state.selectedEvent?._id ===
              eventId ||
            state.selectedEvent?.id ===
              eventId
          ) {
            await loadEventById(eventId);
          }

          /*
           * Refresh event listing.
           */
          await loadEvents({
            page: 1,
            limit: 20,
            sort: "date_asc",
          });

          return response;
        } catch (error) {
          setError(error);
          throw error;
        } finally {
          setSubmitting(false);
        }
      },
      [
        state.selectedEvent,
        setSubmitting,
        clearError,
        setError,
        loadEventById,
        loadEvents,
      ]
    );

  /* =========================================================
     DELETE EVENT
  ========================================================= */

  const removeEvent = useCallback(
    async (eventId) => {
      try {
        setSubmitting(true);
        clearError();

        const response =
          await eventService.deleteEvent(
            eventId
          );

        if (
          state.selectedEvent?._id ===
            eventId ||
          state.selectedEvent?.id ===
            eventId
        ) {
          dispatch({
            type:
              ACTIONS.CLEAR_SELECTED_EVENT,
          });
        }

        await loadEvents({
          page: 1,
          limit: 20,
          sort: "date_asc",
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [
      state.selectedEvent,
      setSubmitting,
      clearError,
      setError,
      loadEvents,
    ]
  );

  /* =========================================================
     PUBLISH EVENT
  ========================================================= */

  const publishExistingEvent =
    useCallback(
      async (eventId) => {
        try {
          setSubmitting(true);
          clearError();

          const response =
            await eventService.publishEvent(
              eventId
            );

          if (
            state.selectedEvent?._id ===
              eventId ||
            state.selectedEvent?.id ===
              eventId
          ) {
            await loadEventById(eventId);
          }

          await loadEvents({
            page: 1,
            limit: 20,
            sort: "date_asc",
          });

          return response;
        } catch (error) {
          setError(error);
          throw error;
        } finally {
          setSubmitting(false);
        }
      },
      [
        state.selectedEvent,
        setSubmitting,
        clearError,
        setError,
        loadEventById,
        loadEvents,
      ]
    );

  /* =========================================================
     ARCHIVE EVENT
  ========================================================= */

  const archiveExistingEvent =
    useCallback(
      async (eventId) => {
        try {
          setSubmitting(true);
          clearError();

          const response =
            await eventService.archiveEvent(
              eventId
            );

          if (
            state.selectedEvent?._id ===
              eventId ||
            state.selectedEvent?.id ===
              eventId
          ) {
            await loadEventById(eventId);
          }

          await loadEvents({
            page: 1,
            limit: 20,
            sort: "date_asc",
          });

          return response;
        } catch (error) {
          setError(error);
          throw error;
        } finally {
          setSubmitting(false);
        }
      },
      [
        state.selectedEvent,
        setSubmitting,
        clearError,
        setError,
        loadEventById,
        loadEvents,
      ]
    );

  /* =========================================================
     REFRESH HELPERS
  ========================================================= */

  const refreshEvents = useCallback(
    async (params = {}) => {
      return loadEvents(params);
    },
    [loadEvents]
  );

  const refreshSelectedEvent =
    useCallback(async () => {
      const eventId =
        state.selectedEvent?._id ||
        state.selectedEvent?.id;

      if (!eventId) {
        return null;
      }

      return loadEventById(eventId);
    }, [
      state.selectedEvent,
      loadEventById,
    ]);

  const refreshDashboard =
    useCallback(async () => {
      return loadDashboardStatistics();
    }, [
      loadDashboardStatistics,
    ]);

  const refreshFeaturedEvents =
    useCallback(
      async (limit = 6) => {
        return loadFeaturedEvents(limit);
      },
      [loadFeaturedEvents]
    );

  const refreshUpcomingEvents =
    useCallback(
      async (limit = 10) => {
        return loadUpcomingEvents(limit);
      },
      [loadUpcomingEvents]
    );

  const refreshOngoingEvents =
    useCallback(async () => {
      return loadOngoingEvents();
    }, [loadOngoingEvents]);

  /* =========================================================
     CONTEXT VALUE
  ========================================================= */

  const value = useMemo(
    () => ({
      /* -------------------------
         STATE
      ------------------------- */

      ...state,

      /* -------------------------
         UI
      ------------------------- */

      setLoading,

      setSubmitting,

      setError,

      clearError,

      /* -------------------------
         EVENTS
      ------------------------- */

      loadEvents,

      refreshEvents,

      searchEvents,

      filterEvents,

      loadEventById,

      loadEventBySlug,

      refreshSelectedEvent,

      clearSelectedEvent,

      loadFeaturedEvents,

      loadUpcomingEvents,

      loadOngoingEvents,

      loadEventsByCategory,

      refreshFeaturedEvents,

      refreshUpcomingEvents,

      refreshOngoingEvents,

      /* -------------------------
         REGISTRATION
      ------------------------- */

      loadMyRegistrations,

      loadMyRegistration,

      register,

      cancelRegistration:
        cancelEventRegistration,

      /* -------------------------
         ADMIN
      ------------------------- */

      loadDashboardStatistics,

      refreshDashboard,

      createEvent:
        createNewEvent,

      updateEvent:
        updateExistingEvent,

      deleteEvent:
        removeEvent,

      publishEvent:
        publishExistingEvent,

      archiveEvent:
        archiveExistingEvent,
    }),
    [
      state,

      setLoading,
      setSubmitting,
      setError,
      clearError,

      loadEvents,
      refreshEvents,

      searchEvents,
      filterEvents,

      loadEventById,
      loadEventBySlug,

      refreshSelectedEvent,
      clearSelectedEvent,

      loadFeaturedEvents,
      loadUpcomingEvents,
      loadOngoingEvents,
      loadEventsByCategory,

      refreshFeaturedEvents,
      refreshUpcomingEvents,
      refreshOngoingEvents,

      loadMyRegistrations,
      loadMyRegistration,

      register,
      cancelEventRegistration,

      loadDashboardStatistics,
      refreshDashboard,

      createNewEvent,
      updateExistingEvent,
      removeEvent,
      publishExistingEvent,
      archiveExistingEvent,
    ]
  );

  /* =========================================================
     PROVIDER
  ========================================================= */

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};

/* ===========================================================
   CUSTOM HOOK
=========================================================== */

export const useEvent = () => {
  const context = useContext(EventContext);

  if (!context) {
    throw new Error(
      "useEvent must be used within an EventProvider."
    );
  }

  return context;
};

export default EventContext;