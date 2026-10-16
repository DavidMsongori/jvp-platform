
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";

import leaderService from "../services/leader.service";

const LeaderContext = createContext(null);

/* ==========================================================
   CONSTANTS
========================================================== */

const DEFAULT_FILTERS = {
  search: "",
  category: "",
  county: "",
  active: "true",
};


const REGIONAL_CABINET_POSITIONS = new Set([
  "president",
  "deputy_president",
  "prime_cabinet_secretary",
  "secretary_to_cabinet",
  "secretary_to_the_cabinet",
  "attorney_general",
  "cabinet_secretary",
]);

const INACTIVE_STATUSES = new Set([
  "inactive",
  "suspended",
  "completed",
  "vacant",
]);

const normalizePosition = (position) =>
  String(position || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

/* ==========================================================
   LEADER HELPERS
========================================================== */

const getLeaderId = (leader) =>
  leader?._id ??
  leader?.id ??
  leader?.leaderId ??
  null;

const sameLeaderId = (first, second) =>
  first != null &&
  second != null &&
  String(first) === String(second);


const isRegionalExecutive = (leader) => {
  if (!leader) return false;

  const position = normalizePosition(leader.position);
  const level = normalizePosition(leader.level);
  const category = normalizePosition(leader.category);
  const status = normalizePosition(leader.status);

  const isRegionalCabinet =
    level === "regional_cabinet" ||
    REGIONAL_CABINET_POSITIONS.has(position);

  const isActive =
    leader.isActive !== false &&
    !INACTIVE_STATUSES.has(status);

  const isExecutiveCategory = category === "executive";

  const isRecognizedCabinetPosition =
    REGIONAL_CABINET_POSITIONS.has(position);

  return (
    isRegionalCabinet &&
    isActive &&
    (isExecutiveCategory || isRecognizedCabinetPosition)
  );
};


/* ==========================================================
   ERROR HANDLING
========================================================== */

const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

/* ==========================================================
   RESPONSE HELPERS
========================================================== */

/**
 * The frontend service returns the parsed API payload,
 * not the original Axios response.
 *
 * Supports:
 * { success: true, data: [...] }
 * { success: true, data: {...} }
 * Direct arrays and objects.
 */
const getResponseData = (response) => {
  if (response == null) return null;

  // Support raw Axios responses if one is passed accidentally.
  const payload =
    response &&
    typeof response === "object" &&
    response.data !== undefined &&
    response.status !== undefined
      ? response.data
      : response;

  if (
    payload &&
    typeof payload === "object" &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    return payload.data;
  }

  return payload;
};

/**
 * Extracts arrays from the standard API envelope or
 * alternative legacy list formats.
 */
const getResponseList = (response) => {
  const data = getResponseData(response);

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.leaders)) return data.leaders;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.vacancies)) return data.vacancies;
  if (Array.isArray(data?.positions)) return data.positions;

  return [];
};

/**
 * Extracts one leader from either a direct object or
 * an API envelope.
 */
const getResponseLeader = (response) => {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data?.leader ?? data?.item ?? data ?? null;
};

/**
 * Removes empty filter values before sending query parameters.
 */
const cleanFilters = (filters = {}) => {
  const params = { ...filters };

  Object.keys(params).forEach((key) => {
    const value = params[key];

    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      delete params[key];
    }
  });

  return params;
};

/* ==========================================================
   PROVIDER
========================================================== */

export function LeaderProvider({ children }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
  });

  const [statistics, setStatistics] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [selectedLeader, setSelectedLeader] = useState(null);

  const executive = useMemo(
    () => leaders.filter(isRegionalExecutive),
    [leaders]
  );

  // Prevent older list requests from replacing newer results.
  const requestSequence = useRef(0);

  /* ========================================================
     LOAD PUBLIC LEADERSHIP DIRECTORY
  ======================================================== */

  /**
   * Public page:
   * GET /leaders/public
   *
   * This loads the public directory rather than restricting
   * the result to the Regional Cabinet.
   */
  const loadLeaders = useCallback(
    async (currentFilters = filters) => {
      const requestId = ++requestSequence.current;

      try {
        setLoading(true);
        setError(null);

        const params = cleanFilters(currentFilters);

        const response =
          await leaderService.getPublicLeaders(params);

        const list = getResponseList(response);

        if (requestId === requestSequence.current) {
          setLeaders(list);
        }

        return list;
      } catch (err) {
        if (requestId === requestSequence.current) {
          setError(
            getErrorMessage(
              err,
              "Failed to load public leadership records."
            )
          );
        }

        throw err;
      } finally {
        if (requestId === requestSequence.current) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  /* ========================================================
     LOAD ADMINISTRATIVE LEADERSHIP RECORDS
  ======================================================== */

  /**
   * Admin page:
   * GET /leaders/admin/all
   *
   * Includes the records returned by the administrative
   * endpoint, subject to its filters and permissions.
   */
  const loadAdminLeaders = useCallback(
    async (currentFilters = filters) => {
      const requestId = ++requestSequence.current;

      try {
        setLoading(true);
        setError(null);

        const params = cleanFilters(currentFilters);

        const response =
          await leaderService.getLeaders(params);

        const list = getResponseList(response);

        if (requestId === requestSequence.current) {
          setLeaders(list);
        }

        return list;
      } catch (err) {
        if (requestId === requestSequence.current) {
          setError(
            getErrorMessage(
              err,
              "Failed to load administrative leadership records."
            )
          );
        }

        throw err;
      } finally {
        if (requestId === requestSequence.current) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  /* ========================================================
     LOAD ONE LEADER
  ======================================================== */

  /**
   * Public profile page:
   * GET /leaders/:id
   */
  const loadLeader = useCallback(async (leaderId) => {
    if (!leaderId) {
      throw new Error(
        "A leadership record ID is required."
      );
    }

    try {
      setError(null);

      const response =
        await leaderService.getLeader(leaderId);

      const leader = getResponseLeader(response);

      setSelectedLeader(leader);

      return leader;
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to load leadership profile."
        )
      );

      throw err;
    }
  }, []);

  /* ========================================================
     CREATE LEADER
  ======================================================== */

  const createLeader = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await leaderService.createLeader(data);

      const createdLeader =
        getResponseLeader(response);

      const createdId = getLeaderId(createdLeader);

      if (createdLeader && createdId != null) {
        setLeaders((previous) => {
          const exists = previous.some((leader) =>
            sameLeaderId(
              getLeaderId(leader),
              createdId
            )
          );

          if (exists) {
            return previous.map((leader) =>
              sameLeaderId(
                getLeaderId(leader),
                createdId
              )
                ? createdLeader
                : leader
            );
          }

          return [createdLeader, ...previous];
        });

        setSelectedLeader(createdLeader);
      }

      return response;
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to create leadership record."
        )
      );

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ========================================================
     UPDATE LEADER
  ======================================================== */

  const updateLeader = useCallback(
    async (leaderId, data) => {
      if (!leaderId) {
        throw new Error(
          "A leadership record ID is required."
        );
      }

      try {
        setLoading(true);
        setError(null);

        const response =
          await leaderService.updateLeader(
            leaderId,
            data
          );

        const updatedLeader =
          getResponseLeader(response);

        const updatedId = getLeaderId(updatedLeader);

        if (updatedLeader && updatedId != null) {
          setLeaders((previous) =>
            previous.map((leader) =>
              sameLeaderId(
                getLeaderId(leader),
                updatedId
              )
                ? { ...leader, ...updatedLeader }
                : leader
            )
          );

          setSelectedLeader((previous) =>
            previous &&
            sameLeaderId(
              getLeaderId(previous),
              updatedId
            )
              ? { ...previous, ...updatedLeader }
              : previous
          );
        }

        return response;
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Failed to update leadership record."
          )
        );

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ========================================================
     DELETE LEADER
  ======================================================== */

  const deleteLeader = useCallback(async (leaderId) => {
    if (!leaderId) {
      throw new Error(
        "A leadership record ID is required."
      );
    }

    try {
      setLoading(true);
      setError(null);

      const response =
        await leaderService.deleteLeader(leaderId);

      setLeaders((previous) =>
        previous.filter(
          (leader) =>
            !sameLeaderId(
              getLeaderId(leader),
              leaderId
            )
        )
      );

      setSelectedLeader((previous) =>
        previous &&
        sameLeaderId(
          getLeaderId(previous),
          leaderId
        )
          ? null
          : previous
      );

      return response;
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to delete leadership record."
        )
      );

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ========================================================
     REFRESH ADMIN DIRECTORY
  ======================================================== */

  const refreshAdminDirectory = useCallback(
    async (currentFilters = filters) => {
      const requestId = ++requestSequence.current;

      const response = await leaderService.getLeaders(
        cleanFilters(currentFilters)
      );

      const list = getResponseList(response);

      if (requestId === requestSequence.current) {
        setLeaders(list);
      }

      return list;
    },
    [filters]
  );

  /* ========================================================
     SHARED LIFECYCLE ACTION
  ======================================================== */

  const runLeaderAction = useCallback(
    async (leaderId, action, fallbackMessage) => {
      if (!leaderId) {
        throw new Error(
          "A leadership record ID is required."
        );
      }

      try {
        setLoading(true);
        setError(null);

        const response = await action(leaderId);

        const returnedLeader =
          getResponseLeader(response);

        const returnedId = getLeaderId(returnedLeader);

        if (returnedLeader && returnedId != null) {
          setLeaders((previous) =>
            previous.map((leader) =>
              sameLeaderId(
                getLeaderId(leader),
                returnedId
              )
                ? { ...leader, ...returnedLeader }
                : leader
            )
          );

          setSelectedLeader((previous) =>
            previous &&
            sameLeaderId(
              getLeaderId(previous),
              returnedId
            )
              ? { ...previous, ...returnedLeader }
              : previous
          );
        } else {
          // Lifecycle endpoints may return only a message.
          await refreshAdminDirectory();
        }

        return response;
      } catch (err) {
        setError(
          getErrorMessage(err, fallbackMessage)
        );

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshAdminDirectory]
  );

  /* ========================================================
     ACTIVATE LEADER
  ======================================================== */

  const activateLeader = useCallback(
    (leaderId) =>
      runLeaderAction(
        leaderId,
        leaderService.activateLeader,
        "Failed to activate leadership record."
      ),
    [runLeaderAction]
  );

  /* ========================================================
     DEACTIVATE LEADER
  ======================================================== */

  const deactivateLeader = useCallback(
    (leaderId) =>
      runLeaderAction(
        leaderId,
        leaderService.deactivateLeader,
        "Failed to deactivate leadership record."
      ),
    [runLeaderAction]
  );

  /* ========================================================
     BULK ACTIVATION
  ======================================================== */

  const activateMany = useCallback(
    async (ids = []) => {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error(
          "Select at least one leader to activate."
        );
      }

      try {
        setLoading(true);
        setError(null);

        const response =
          await leaderService.activateMany(ids);

        await refreshAdminDirectory();

        return response;
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Failed to activate selected leaders."
          )
        );

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshAdminDirectory]
  );

  /* ========================================================
     SEARCH PUBLIC LEADERS
  ======================================================== */

  const searchLeaders = useCallback(
    async (search = "") => {
      try {
        setError(null);

        const params = cleanFilters({
          ...filters,
          search,
        });

        const response =
          await leaderService.getPublicLeaders(params);

        const list = getResponseList(response);

        setLeaders(list);

        return list;
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Failed to search public leadership records."
          )
        );

        throw err;
      }
    },
    [filters]
  );

  /* ========================================================
     FILTER MANAGEMENT
  ======================================================== */

  const updateFilters = useCallback(
    (newFilters = {}) => {
      setFilters((previous) => ({
        ...previous,
        ...newFilters,
      }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /* ========================================================
     STATISTICS
  ======================================================== */

  const loadStatistics = useCallback(async () => {
    try {
      setError(null);

      const response =
        await leaderService.getStatistics();

      const data = getResponseData(response);

      setStatistics(data);

      return data;
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to load leadership statistics."
        )
      );

      throw err;
    }
  }, []);

  /* ========================================================
     VACANCIES
  ======================================================== */

  const loadVacancies = useCallback(async () => {
    try {
      setError(null);

      const response =
        await leaderService.getVacantPositions();

      const list = getResponseList(response);

      setVacancies(list);

      return list;
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to load vacant positions."
        )
      );

      throw err;
    }
  }, []);

  /* ========================================================
     INITIAL LOAD AND FILTER CHANGES
  ======================================================== */

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeaders().catch(() => {
        // The error is already stored in context state.
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [loadLeaders]);

  /* ========================================================
     CONTEXT VALUE
  ======================================================== */

  const value = useMemo(
    () => ({
      // Directory data
      leaders,
      executive,
      selectedLeader,
      statistics,
      vacancies,

      // Request state
      loading,
      error,
      clearError,

      // Filters
      filters,
      updateFilters,
      resetFilters,

      // Loading
      loadLeaders,
      loadAdminLeaders,
      loadLeader,
      searchLeaders,

      // CRUD
      createLeader,
      updateLeader,
      deleteLeader,

      // Lifecycle
      activateLeader,
      deactivateLeader,
      activateMany,

      // Administrative data
      loadStatistics,
      loadVacancies,

      // Selected profile
      setSelectedLeader,
    }),
    [
      leaders,
      executive,
      selectedLeader,
      statistics,
      vacancies,
      loading,
      error,
      clearError,
      filters,
      updateFilters,
      resetFilters,
      loadLeaders,
      loadAdminLeaders,
      loadLeader,
      searchLeaders,
      createLeader,
      updateLeader,
      deleteLeader,
      activateLeader,
      deactivateLeader,
      activateMany,
      loadStatistics,
      loadVacancies,
    ]
  );

  return (
    <LeaderContext.Provider value={value}>
      {children}
    </LeaderContext.Provider>
  );
}

/* ==========================================================
   CUSTOM HOOK
========================================================== */

export function useLeaders() {
  const context = useContext(LeaderContext);

  if (!context) {
    throw new Error(
      "useLeaders must be used inside LeaderProvider."
    );
  }

  return context;
}

export default LeaderContext;