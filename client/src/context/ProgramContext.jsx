
import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useRef,
} from "react";

import programService from "../services/program.service";

/* ===========================================================
   INITIAL STATE
=========================================================== */

const initialState = {
  /* ------------------------------------------
     PROGRAMS
  ------------------------------------------ */

  programs: [],

  featuredPrograms: [],

  upcomingPrograms: [],

  ongoingPrograms: [],

  selectedProgram: null,

  /* ------------------------------------------
     ACTIVITIES
  ------------------------------------------ */

  activities: [],

  /* ------------------------------------------
     PUBLIC PROGRAM DATA
  ------------------------------------------ */

  publicProgram: null,

  publicActivities: [],

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

  /* ---------- PROGRAMS ---------- */

  SET_PROGRAMS: "SET_PROGRAMS",

  SET_FEATURED_PROGRAMS: "SET_FEATURED_PROGRAMS",

  SET_UPCOMING_PROGRAMS: "SET_UPCOMING_PROGRAMS",

  SET_ONGOING_PROGRAMS: "SET_ONGOING_PROGRAMS",

  SET_SELECTED_PROGRAM: "SET_SELECTED_PROGRAM",

  CLEAR_SELECTED_PROGRAM: "CLEAR_SELECTED_PROGRAM",

  /* ---------- ACTIVITIES ---------- */

  SET_ACTIVITIES: "SET_ACTIVITIES",

  /* ---------- PUBLIC DATA ---------- */

  SET_PUBLIC_PROGRAM: "SET_PUBLIC_PROGRAM",

  SET_PUBLIC_ACTIVITIES: "SET_PUBLIC_ACTIVITIES",

  CLEAR_PUBLIC_PROGRAM: "CLEAR_PUBLIC_PROGRAM",

  /* ---------- DASHBOARD ---------- */

  SET_STATISTICS: "SET_STATISTICS",

  /* ---------- PAGINATION ---------- */

  SET_PAGINATION: "SET_PAGINATION",
};

/* ===========================================================
   REDUCER
=========================================================== */

const programReducer = (state, action) => {
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
       PROGRAMS
    ====================================== */

    case ACTIONS.SET_PROGRAMS:
      return {
        ...state,
        programs: action.payload.programs,
        pagination: action.payload.pagination,
      };

    case ACTIONS.SET_FEATURED_PROGRAMS:
      return {
        ...state,
        featuredPrograms: action.payload,
      };

    case ACTIONS.SET_UPCOMING_PROGRAMS:
      return {
        ...state,
        upcomingPrograms: action.payload,
      };

    case ACTIONS.SET_ONGOING_PROGRAMS:
      return {
        ...state,
        ongoingPrograms: action.payload,
      };

    case ACTIONS.SET_SELECTED_PROGRAM:
      return {
        ...state,
        selectedProgram: action.payload,
      };

    case ACTIONS.CLEAR_SELECTED_PROGRAM:
      return {
        ...state,
        selectedProgram: null,
        activities: [],
      };

    /* ======================================
       ACTIVITIES
    ====================================== */

    case ACTIONS.SET_ACTIVITIES:
      return {
        ...state,
        activities: action.payload,
      };

    /* ======================================
       PUBLIC DATA
    ====================================== */

    case ACTIONS.SET_PUBLIC_PROGRAM:
      return {
        ...state,
        publicProgram: action.payload,
      };

    case ACTIONS.SET_PUBLIC_ACTIVITIES:
      return {
        ...state,
        publicActivities: action.payload,
      };

    case ACTIONS.CLEAR_PUBLIC_PROGRAM:
      return {
        ...state,
        publicProgram: null,
        publicActivities: [],
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
   RESPONSE HELPERS
=========================================================== */

/**
 * Normalize common API response structures.
 */
const extractList = (response, keys = []) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  for (const key of keys) {
    if (Array.isArray(response?.data?.[key])) {
      return response.data[key];
    }

    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }

  return [];
};

const extractEntity = (response, keys = []) => {
  for (const key of keys) {
    if (response?.data?.[key]) {
      return response.data[key];
    }

    if (response?.[key]) {
      return response[key];
    }
  }

  return response?.data ?? response;
};

const extractPagination = (response) =>
  response?.pagination ??
  response?.data?.pagination ??
  null;

/* ===========================================================
   CONTEXT
=========================================================== */

const ProgramContext = createContext(null);

/* ===========================================================
   PROVIDER
=========================================================== */

export const ProgramProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    programReducer,
    initialState
  );

  /*
   * Prevent duplicate simultaneous programme-list requests.
   */
  const programRequestsRef = useRef(new Map());

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
     LOAD PROGRAMS
  ========================================================= */

  const loadPrograms = useCallback(
    async (params = {}) => {
      const requestKey = JSON.stringify(params);

      const existingRequest =
        programRequestsRef.current.get(requestKey);

      if (existingRequest) {
        return existingRequest;
      }

      const request = (async () => {
        try {
          setLoading(true);
          clearError();

          const response =
            await programService.getPrograms(params);

          const programs = extractList(
            response,
            ["programs"]
          );

          dispatch({
            type: ACTIONS.SET_PROGRAMS,
            payload: {
              programs,
              pagination: extractPagination(response),
            },
          });

          return response;
        } catch (error) {
          setError(error);
          throw error;
        } finally {
          programRequestsRef.current.delete(requestKey);
          setLoading(false);
        }
      })();

      programRequestsRef.current.set(requestKey, request);

      return request;
    },
    [setLoading, clearError, setError]
  );

  /* =========================================================
     SEARCH PROGRAMS
  ========================================================= */

  const searchPrograms = useCallback(
    async (search, params = {}) => {
      try {
        setLoading(true);
        clearError();

        const response =
          await programService.searchPrograms(
            search,
            params
          );

        dispatch({
          type: ACTIONS.SET_PROGRAMS,
          payload: {
            programs: extractList(response, ["programs"]),
            pagination: extractPagination(response),
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
    [setLoading, clearError, setError]
  );

  /* =========================================================
     FILTER PROGRAMS
  ========================================================= */

  const filterPrograms = useCallback(
    async (filters = {}) => {
      try {
        setLoading(true);
        clearError();

        const response =
          await programService.filterPrograms(filters);

        dispatch({
          type: ACTIONS.SET_PROGRAMS,
          payload: {
            programs: extractList(response, ["programs"]),
            pagination: extractPagination(response),
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
    [setLoading, clearError, setError]
  );

  /* =========================================================
     LOAD PROGRAM BY ID
  ========================================================= */

  const loadProgramById = useCallback(
    async (id) => {
      if (!id) return null;

      try {
        setLoading(true);
        clearError();

        const response =
          await programService.getProgramById(id);

        const program = extractEntity(response, [
          "program",
        ]);

        dispatch({
          type: ACTIONS.SET_SELECTED_PROGRAM,
          payload: program,
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, clearError, setError]
  );

  /* =========================================================
     LOAD PROGRAM BY SLUG
  ========================================================= */

  const loadProgramBySlug = useCallback(
    async (slug) => {
      if (!slug) return null;

      try {
        setLoading(true);
        clearError();

        const response =
          await programService.getProgramBySlug(slug);

        const program = extractEntity(response, [
          "program",
        ]);

        dispatch({
          type: ACTIONS.SET_SELECTED_PROGRAM,
          payload: program,
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, clearError, setError]
  );

  /* =========================================================
     FEATURED PROGRAMS
  ========================================================= */

  const loadFeaturedPrograms = useCallback(
    async (limit = 6) => {
      try {
        clearError();

        const response =
          await programService.getFeaturedPrograms(limit);

        dispatch({
          type: ACTIONS.SET_FEATURED_PROGRAMS,
          payload: extractList(response, ["programs"]),
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      }
    },
    [clearError, setError]
  );

  /* =========================================================
     UPCOMING PROGRAMS
  ========================================================= */

  const loadUpcomingPrograms = useCallback(
    async (limit = 10) => {
      try {
        clearError();

        const response =
          await programService.getUpcomingPrograms(limit);

        dispatch({
          type: ACTIONS.SET_UPCOMING_PROGRAMS,
          payload: extractList(response, ["programs"]),
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      }
    },
    [clearError, setError]
  );

  /* =========================================================
     ONGOING PROGRAMS
  ========================================================= */

  const loadOngoingPrograms = useCallback(
    async () => {
      try {
        clearError();

        const response =
          await programService.getOngoingPrograms();

        dispatch({
          type: ACTIONS.SET_ONGOING_PROGRAMS,
          payload: extractList(response, ["programs"]),
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      }
    },
    [clearError, setError]
  );

  /* =========================================================
     PROGRAMS BY CATEGORY
  ========================================================= */

  const loadProgramsByCategory = useCallback(
    async (category, limit = 20) => {
      try {
        setLoading(true);
        clearError();

        const response =
          await programService.getProgramsByCategory(
            category,
            limit
          );

        dispatch({
          type: ACTIONS.SET_PROGRAMS,
          payload: {
            programs: extractList(response, ["programs"]),
            pagination: extractPagination(response),
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
    [setLoading, clearError, setError]
  );

  /* =========================================================
     PUBLIC PROGRAM ACTIVITIES
  ========================================================= */

  const loadPublicProgramActivities = useCallback(
    async (parentProgramId) => {
      if (!parentProgramId) return null;

      try {
        setLoading(true);
        clearError();

        const response =
          await programService.getPublicProgramActivities(
            parentProgramId
          );

        const result = extractEntity(response, []);

        const parentProgram =
          result?.parentProgram ?? null;

        const activities = extractList(
          result,
          ["activities"]
        );

        dispatch({
          type: ACTIONS.SET_PUBLIC_PROGRAM,
          payload: parentProgram,
        });

        dispatch({
          type: ACTIONS.SET_PUBLIC_ACTIVITIES,
          payload: activities,
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, clearError, setError]
  );

  /* =========================================================
     ADMIN ACTIVITIES
  ========================================================= */

  const loadProgramActivities = useCallback(
    async (parentProgramId) => {
      if (!parentProgramId) return null;

      try {
        setLoading(true);
        clearError();

        const response =
          await programService.getProgramActivities(
            parentProgramId
          );

        const activities = extractList(
          response,
          ["activities"]
        );

        dispatch({
          type: ACTIONS.SET_ACTIVITIES,
          payload: activities,
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, clearError, setError]
  );

  /* =========================================================
     CLEAR SELECTED PROGRAM
  ========================================================= */

  const clearSelectedProgram = useCallback(() => {
    dispatch({
      type: ACTIONS.CLEAR_SELECTED_PROGRAM,
    });
  }, []);

  const clearPublicProgram = useCallback(() => {
    dispatch({
      type: ACTIONS.CLEAR_PUBLIC_PROGRAM,
    });
  }, []);

  /* =========================================================
     CREATE PROGRAM
  ========================================================= */

  const createProgram = useCallback(
    async (programData) => {
      try {
        setSubmitting(true);
        clearError();

        const response =
          await programService.createProgram(programData);

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [setSubmitting, clearError, setError]
  );

  /* =========================================================
     UPDATE PROGRAM
  ========================================================= */

  const updateProgram = useCallback(
    async (programId, programData) => {
      try {
        setSubmitting(true);
        clearError();

        const response =
          await programService.updateProgram(
            programId,
            programData
          );

        const updatedProgram = extractEntity(response, [
          "program",
        ]);

        if (
          updatedProgram &&
          (updatedProgram._id || updatedProgram.id)
        ) {
          dispatch({
            type: ACTIONS.SET_SELECTED_PROGRAM,
            payload: updatedProgram,
          });
        }

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [setSubmitting, clearError, setError]
  );

  /* =========================================================
     DELETE PROGRAM
  ========================================================= */

  const deleteProgram = useCallback(
    async (programId) => {
      try {
        setSubmitting(true);
        clearError();

        const response =
          await programService.deleteProgram(programId);

        if (
          state.selectedProgram?._id === programId ||
          state.selectedProgram?.id === programId
        ) {
          dispatch({
            type: ACTIONS.CLEAR_SELECTED_PROGRAM,
          });
        }

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [
      state.selectedProgram,
      setSubmitting,
      clearError,
      setError,
    ]
  );

  /* =========================================================
     PUBLISH PROGRAM
  ========================================================= */

  const publishProgram = useCallback(
    async (programId) => {
      try {
        setSubmitting(true);
        clearError();

        const response =
          await programService.publishProgram(programId);

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [setSubmitting, clearError, setError]
  );

  /* =========================================================
     UNPUBLISH PROGRAM
  ========================================================= */

  const unpublishProgram = useCallback(
    async (programId) => {
      try {
        setSubmitting(true);
        clearError();

        const response =
          await programService.unpublishProgram(programId);

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [setSubmitting, clearError, setError]
  );

  /* =========================================================
     UPDATE PROGRAM IMPACT
  ========================================================= */

  const updateProgramImpact = useCallback(
    async (programId, impactData = {}) => {
      try {
        setSubmitting(true);
        clearError();

        const response =
          await programService.updateProgramImpact(
            programId,
            impactData
          );

        const updatedProgram = extractEntity(response, [
          "program",
        ]);

        if (
          updatedProgram &&
          (updatedProgram._id || updatedProgram.id)
        ) {
          dispatch({
            type: ACTIONS.SET_SELECTED_PROGRAM,
            payload: updatedProgram,
          });
        }

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [setSubmitting, clearError, setError]
  );

  /* =========================================================
     DASHBOARD STATISTICS
  ========================================================= */

  const loadDashboardStatistics = useCallback(
    async () => {
      try {
        setLoading(true);
        clearError();

        const response =
          await programService.getProgramDashboardStatistics();

        dispatch({
          type: ACTIONS.SET_STATISTICS,
          payload: extractEntity(response, [
            "statistics",
          ]),
        });

        return response;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, clearError, setError]
  );

  /* =========================================================
     REFRESH HELPERS
  ========================================================= */

  const refreshPrograms = useCallback(
    async (params = {}) => loadPrograms(params),
    [loadPrograms]
  );

  const refreshFeaturedPrograms = useCallback(
    async (limit = 6) => loadFeaturedPrograms(limit),
    [loadFeaturedPrograms]
  );

  const refreshUpcomingPrograms = useCallback(
    async (limit = 10) => loadUpcomingPrograms(limit),
    [loadUpcomingPrograms]
  );

  const refreshOngoingPrograms = useCallback(
    async () => loadOngoingPrograms(),
    [loadOngoingPrograms]
  );

  const refreshDashboard = useCallback(
    async () => loadDashboardStatistics(),
    [loadDashboardStatistics]
  );

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
         PROGRAMS
      ------------------------- */

      loadPrograms,
      refreshPrograms,
      searchPrograms,
      filterPrograms,
      loadProgramById,
      loadProgramBySlug,
      clearSelectedProgram,

      loadFeaturedPrograms,
      loadUpcomingPrograms,
      loadOngoingPrograms,
      loadProgramsByCategory,

      refreshFeaturedPrograms,
      refreshUpcomingPrograms,
      refreshOngoingPrograms,

      /* -------------------------
         PUBLIC ACTIVITIES
      ------------------------- */

      loadPublicProgramActivities,
      clearPublicProgram,

      /* -------------------------
         ADMIN ACTIVITIES
      ------------------------- */

      loadProgramActivities,

      /* -------------------------
         ADMIN MANAGEMENT
      ------------------------- */

      createProgram,
      updateProgram,
      deleteProgram,
      publishProgram,
      unpublishProgram,
      updateProgramImpact,

      /* -------------------------
         DASHBOARD
      ------------------------- */

      loadDashboardStatistics,
      refreshDashboard,
    }),
    [
      state,
      setLoading,
      setSubmitting,
      setError,
      clearError,

      loadPrograms,
      refreshPrograms,
      searchPrograms,
      filterPrograms,
      loadProgramById,
      loadProgramBySlug,
      clearSelectedProgram,

      loadFeaturedPrograms,
      loadUpcomingPrograms,
      loadOngoingPrograms,
      loadProgramsByCategory,

      refreshFeaturedPrograms,
      refreshUpcomingPrograms,
      refreshOngoingPrograms,

      loadPublicProgramActivities,
      clearPublicProgram,
      loadProgramActivities,

      createProgram,
      updateProgram,
      deleteProgram,
      publishProgram,
      unpublishProgram,
      updateProgramImpact,

      loadDashboardStatistics,
      refreshDashboard,
    ]
  );

  /* =========================================================
     PROVIDER
  ========================================================= */

  return (
    <ProgramContext.Provider value={value}>
      {children}
    </ProgramContext.Provider>
  );
};

/* ===========================================================
   CUSTOM HOOK
=========================================================== */

export const useProgram = () => {
  const context = useContext(ProgramContext);

  if (!context) {
    throw new Error(
      "useProgram must be used within a ProgramProvider."
    );
  }

  return context;
};

export default ProgramContext;